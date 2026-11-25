import { Router } from 'express';
import { BUYERS, emailTaken, metaPatch, mrId, requireMeta, ROLE } from '../accounts.js';
import { requireRole } from '../auth.js';
import db, { fromJson, now, toJson } from '../db.js';
import { badRequest, nextCode, notFound } from '../http.js';
import { notify } from '../notify.js';

// Admin review of self-registrations: approve as requested, approve with changes (e.g. a different role), or reject.
const router = Router();
router.use(requireRole('admin'));

const STATUSES = ['Pending', 'Approved', 'Rejected'];

const shape = ({ password_hash: _omit, meta, approved_role, user_id, reviewed_by, reviewed_at, created_at, updated_at, ...r }) => ({
  ...r,
  meta: fromJson(meta, {}),
  approvedRole: approved_role,
  userId: user_id,
  reviewedBy: reviewed_by,
  reviewedAt: reviewed_at,
  createdAt: created_at,
});

async function pending(id) {
  const request = await db('registration_requests').where({ id }).first();
  if (!request) throw notFound('Registration request');
  if (request.status !== 'Pending') throw badRequest(`This request was already ${request.status.toLowerCase()}`);
  return request;
}

router.get('/', async (req, res) => {
  const { status } = req.query;
  const q = db('registration_requests').orderBy('id', 'desc');
  if (STATUSES.includes(status)) q.where({ status });
  const [rows, counts] = await Promise.all([q, db('registration_requests').groupBy('status').select('status').count({ n: '*' })]);
  res.json({
    requests: rows.map(shape),
    counts: Object.fromEntries(STATUSES.map((s) => [s, Number(counts.find((c) => c.status === s)?.n ?? 0)])),
  });
});

/**
 * Approves a request and creates the user. Body may override the role and role details:
 * { role?, name?, meta?: {...}, assignedMrId? }. Required details of the final role must be present.
 */
router.post('/:id/approve', async (req, res) => {
  const body = req.body ?? {};
  const request = await pending(req.params.id);
  const role = body.role ?? request.role;
  const cfg = ROLE[role];
  if (!cfg) throw badRequest('Role must be one of: employee, mr, doctor, pharmacy');

  // Keep only the details that belong to the final role, letting the admin's values win.
  const meta = { ...metaPatch(fromJson(request.meta, {}), cfg.meta), ...metaPatch(body, cfg.meta) };
  requireMeta(meta, cfg.required);
  const name = String(body.name ?? request.name).trim();
  if (!name) throw badRequest('Name is required');
  if (await emailTaken(request.email, { exceptRequestId: request.id })) throw badRequest('This email now belongs to another account');
  const assigned = BUYERS.includes(role) ? await mrId(body.assignedMrId) : null;

  const ts = now();
  const user = await db.transaction(async (trx) => {
    const [id] = await trx('users').insertGetId({
      code: await nextCode(trx('users'), 'code', cfg.prefix),
      role,
      name,
      email: request.email,
      phone: request.phone,
      password_hash: request.password_hash,
      status: 'Active',
      assigned_mr_id: assigned,
      meta: toJson(meta),
      created_at: ts,
      updated_at: ts,
    });
    await trx('registration_requests').where({ id: request.id }).update({
      status: 'Approved',
      approved_role: role,
      user_id: id,
      reviewed_by: req.user.id,
      reviewed_at: ts,
      updated_at: ts,
    });
    return trx('users').where({ id }).first('id', 'code', 'name', 'role');
  });

  const changed = role !== request.role ? ` as ${role.toUpperCase()} (you requested ${request.role.toUpperCase()})` : '';
  await notify(user.id, 'Welcome to MK Animal Health', `Your registration was approved${changed}. Your ID is ${user.code}.`);
  res.json({ ...shape(await db('registration_requests').where({ id: request.id }).first()), user });
});

router.post('/:id/reject', async (req, res) => {
  const request = await pending(req.params.id);
  const ts = now();
  await db('registration_requests').where({ id: request.id }).update({
    status: 'Rejected',
    note: String(req.body?.note ?? '').trim().slice(0, 500) || null,
    reviewed_by: req.user.id,
    reviewed_at: ts,
    updated_at: ts,
  });
  res.json(shape(await db('registration_requests').where({ id: request.id }).first()));
});

export default router;
