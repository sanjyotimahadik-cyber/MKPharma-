import { Router } from 'express';
import { requireRole } from '../auth.js';
import db, { now, today } from '../db.js';
import { badRequest, HttpError } from '../http.js';

const router = Router();
const STAFF = ['employee', 'mr'];
const LATE_AFTER = '09:15';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const shapeAttendance = (r) =>
  r && {
    id: r.id,
    date: r.date,
    checkIn: r.check_in,
    checkOut: r.check_out,
    status: r.status,
    latitude: r.latitude == null ? null : Number(r.latitude),
    longitude: r.longitude == null ? null : Number(r.longitude),
  };

/** Counts per status plus attendance % (present + late + half day over all counted days). */
export function summarize(rows) {
  const c = (s) => rows.filter((r) => r.status === s).length;
  const s = { total: rows.length, present: c('Present'), late: c('Late'), halfDay: c('Half Day'), absent: c('Absent'), leave: c('Leave') };
  const attended = s.present + s.late + s.halfDay;
  return { ...s, percentage: s.total ? Math.round((attended / s.total) * 1000) / 10 : 0 };
}

const coord = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const own = (req) => db('attendance').where({ user_id: req.user.id, date: today() }).first();

router.get('/today', async (req, res) => res.json(shapeAttendance(await own(req)) ?? null));

router.post('/check-in', requireRole(...STAFF), async (req, res) => {
  const existing = await own(req);
  if (existing?.check_in) throw new HttpError(409, 'You have already checked in today');
  const ts = now();
  const row = {
    check_in: ts,
    status: ts.slice(11, 16) > LATE_AFTER ? 'Late' : 'Present',
    latitude: coord(req.body?.latitude),
    longitude: coord(req.body?.longitude),
  };
  // A pre-filled Leave/Absent row for today is replaced by the actual check-in.
  if (existing) await db('attendance').where({ id: existing.id }).update(row);
  else await db('attendance').insert({ ...row, user_id: req.user.id, date: today(), created_at: ts });
  res.status(201).json(shapeAttendance(await own(req)));
});

router.post('/check-out', requireRole(...STAFF), async (req, res) => {
  const existing = await own(req);
  if (!existing?.check_in) throw badRequest('You have not checked in today');
  if (existing.check_out) throw new HttpError(409, 'You have already checked out today');
  await db('attendance').where({ id: existing.id }).update({ check_out: now() });
  res.json(shapeAttendance(await own(req)));
});

/** Own history, optionally for one month/year. */
router.get('/me', async (req, res) => {
  const { month, year } = req.query;
  const q = db('attendance').where({ user_id: req.user.id }).orderBy('date', 'desc');
  if (year && !/^\d{4}$/.test(year)) throw badRequest('Invalid year');
  if (month && !(month >= 1 && month <= 12)) throw badRequest('Invalid month');
  if (year && month) q.where('date', 'like', `${year}-${String(month).padStart(2, '0')}-%`);
  else if (year) q.where('date', 'like', `${year}-%`);
  else if (month) q.where('date', 'like', `%-${String(month).padStart(2, '0')}-%`);
  const rows = (await q).map(shapeAttendance);
  res.json({ records: rows, summary: summarize(rows) });
});

/** Admin: one row per active employee/MR for the date; missing records are Absent (or Leave if approved). */
router.get('/', requireRole('admin'), async (req, res) => {
  const date = req.query.date || today();
  if (!ISO_DATE.test(date)) throw badRequest('Invalid date');
  const { status, role } = req.query;
  const search = String(req.query.search ?? '').trim().toLowerCase();

  const users = await db('users')
    .whereIn('role', role && STAFF.includes(role) ? [role] : STAFF)
    .where({ status: 'Active' })
    .orderBy('name')
    .select('id', 'code', 'role', 'name', 'phone', 'email');
  const ids = users.map((u) => u.id);
  const [records, leaves] = await Promise.all([
    db('attendance').where({ date }).whereIn('user_id', ids),
    db('leave_requests').where({ status: 'Approved' }).where('from_date', '<=', date).where('to_date', '>=', date).whereIn('user_id', ids).pluck('user_id'),
  ]);
  const byUser = new Map(records.map((r) => [r.user_id, r]));

  let rows = users
    .filter((u) => !search || [u.name, u.code, u.phone, u.email].join(' ').toLowerCase().includes(search))
    .map((u) => {
      const r = byUser.get(u.id);
      return {
        userId: u.id, name: u.name, code: u.code, role: u.role, phone: u.phone, email: u.email, date,
        checkIn: r?.check_in ?? null,
        checkOut: r?.check_out ?? null,
        status: r?.status ?? (leaves.includes(u.id) ? 'Leave' : 'Absent'),
      };
    });
  const summary = summarize(rows);
  if (status) rows = rows.filter((r) => r.status === status);
  res.json({ date, summary, rows });
});

export default router;
