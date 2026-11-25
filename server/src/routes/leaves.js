import { Router } from 'express';
import { requireRole } from '../auth.js';
import db, { now } from '../db.js';
import { badRequest, HttpError, notFound, requireFields } from '../http.js';
import { notify, notifyRole } from '../notify.js';

const router = Router();
const TYPES = ['Casual', 'Sick', 'Earned', 'Unpaid'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 60;

/** Every 'YYYY-MM-DD' from..to inclusive. */
const datesBetween = (from, to) => {
  const out = [];
  for (const d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

const shape = (r) => ({
  id: r.id,
  fromDate: r.from_date,
  toDate: r.to_date,
  days: datesBetween(r.from_date, r.to_date).length,
  type: r.type,
  reason: r.reason,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  ...(r.name !== undefined && { user: { id: r.user_id, name: r.name, code: r.code, role: r.role } }),
});

router.post('/', requireRole('employee', 'mr'), async (req, res) => {
  requireFields(req.body, ['fromDate', 'toDate', 'reason']);
  const { fromDate, toDate, type = 'Casual', reason } = req.body;
  if (!ISO_DATE.test(fromDate) || !ISO_DATE.test(toDate)) throw badRequest('Dates must be YYYY-MM-DD');
  if (fromDate > toDate) throw badRequest('From date must be on or before To date');
  if (datesBetween(fromDate, toDate).length > MAX_DAYS) throw badRequest(`Leave cannot exceed ${MAX_DAYS} days`);
  if (!TYPES.includes(type)) throw badRequest(`Type must be one of: ${TYPES.join(', ')}`);

  const overlap = await db('leave_requests')
    .where({ user_id: req.user.id })
    .whereNot({ status: 'Rejected' })
    .where('from_date', '<=', toDate)
    .where('to_date', '>=', fromDate)
    .first();
  if (overlap) throw new HttpError(409, 'You already have a leave request covering these dates');

  const ts = now();
  const [id] = await db('leave_requests').insertGetId({
    user_id: req.user.id, from_date: fromDate, to_date: toDate, type, reason: String(reason).trim(),
    status: 'Pending', created_at: ts, updated_at: ts,
  });
  await notifyRole('admin', 'New Leave Request', `${req.user.name} (${req.user.code}) requested ${type} leave ${fromDate} to ${toDate}.`, 'leave');
  res.status(201).json(shape(await db('leave_requests').where({ id }).first()));
});

router.get('/me', async (req, res) => {
  const rows = await db('leave_requests').where({ user_id: req.user.id }).orderBy('id', 'desc');
  res.json(rows.map(shape));
});

/** Requester cancels their own pending request. */
router.delete('/:id', async (req, res) => {
  const row = await db('leave_requests').where({ id: req.params.id, user_id: req.user.id }).first();
  if (!row) throw notFound('Leave request');
  if (row.status !== 'Pending') throw new HttpError(409, 'Only pending requests can be cancelled');
  await db('leave_requests').where({ id: row.id }).del();
  res.status(204).end();
});

router.get('/', requireRole('admin'), async (req, res) => {
  const q = db('leave_requests as l')
    .join('users as u', 'u.id', 'l.user_id')
    .select('l.*', 'u.name', 'u.code', 'u.role')
    .orderBy('l.id', 'desc');
  if (req.query.status) q.where('l.status', req.query.status);
  res.json((await q).map(shape));
});

router.patch('/:id', requireRole('admin'), async (req, res) => {
  const { status } = req.body ?? {};
  if (!['Approved', 'Rejected'].includes(status)) throw badRequest("Status must be 'Approved' or 'Rejected'");
  const row = await db('leave_requests').where({ id: req.params.id }).first();
  if (!row) throw notFound('Leave request');
  if (row.status !== 'Pending') throw new HttpError(409, `This request is already ${row.status.toLowerCase()}`);

  const ts = now();
  await db.transaction(async (trx) => {
    await trx('leave_requests').where({ id: row.id }).update({ status, reviewed_by: req.user.id, updated_at: ts });
    if (status !== 'Approved') return;
    // Mark covered days as Leave in attendance, except days the person actually checked in.
    const existing = await trx('attendance').where({ user_id: row.user_id }).whereBetween('date', [row.from_date, row.to_date]);
    const byDate = new Map(existing.map((a) => [a.date, a]));
    for (const date of datesBetween(row.from_date, row.to_date)) {
      const a = byDate.get(date);
      if (!a) await trx('attendance').insert({ user_id: row.user_id, date, status: 'Leave', created_at: ts });
      else if (!a.check_in) await trx('attendance').where({ id: a.id }).update({ status: 'Leave' });
    }
  });
  await notify(row.user_id, `Leave ${status}`, `Your ${row.type} leave from ${row.from_date} to ${row.to_date} was ${status.toLowerCase()}.`, 'leave');
  const updated = await db('leave_requests as l').join('users as u', 'u.id', 'l.user_id').select('l.*', 'u.name', 'u.code', 'u.role').where('l.id', row.id).first();
  res.json(shape(updated));
});

export default router;
