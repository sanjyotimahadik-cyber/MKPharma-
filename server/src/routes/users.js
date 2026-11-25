import { Router } from 'express';
import { publicUser, requireRole } from '../auth.js';
import db, { now, toJson } from '../db.js';
import { BUYERS, EMAIL, metaPatch, mrId, passwordHash, PHONE, requireMeta, ROLE } from '../accounts.js';
import { badRequest, forbidden, nextCode, notFound, pick } from '../http.js';
import { verifyPassword } from '../password.js';

const router = Router();
const admin = requireRole('admin');

const SELF_META = { admin: ['designation'], ...Object.fromEntries(Object.entries(ROLE).map(([r, c]) => [r, c.meta])) };
const ATTENDED = ['Present', 'Late', 'Half Day'];

// ---- validation helpers ----

/** Validates the shared columns present in body; returns the row patch. */
async function baseFields(body, id = 0) {
  const row = {};
  for (const k of ['name', 'phone', 'email', 'username', 'status']) {
    if (body?.[k] !== undefined) row[k] = String(body[k] ?? '').trim() || null;
  }
  if ('name' in row && !row.name) throw badRequest('Name is required');
  if ('phone' in row) {
    row.phone = row.phone?.replace(/[\s-]/g, '') ?? null;
    if (!PHONE.test(row.phone ?? '')) throw badRequest('Enter a valid 10-digit mobile number');
  }
  if (row.email) {
    if (!EMAIL.test(row.email)) throw badRequest('Enter a valid email address');
    row.email = row.email.toLowerCase();
  }
  if ('status' in row && !['Active', 'Inactive'].includes(row.status)) throw badRequest('Status must be Active or Inactive');
  for (const k of ['email', 'username']) {
    if (row[k] && (await db('users').whereRaw('lower(??) = ?', [k, row[k].toLowerCase()]).whereNot('id', id).first('id'))) {
      throw badRequest(`This ${k} is already in use`);
    }
  }
  return row;
}

// ---- computed stats ----

/** Current period start plus the same span one period earlier, as timestamp strings. */
function periodRange(period) {
  const d = new Date();
  const start =
    period === 'week' ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
    : period === 'year' ? new Date(d.getFullYear(), 0, 1)
    : new Date(d.getFullYear(), d.getMonth(), 1);
  const back = (x) => {
    const y = new Date(x);
    if (period === 'week') y.setDate(y.getDate() - 7);
    else if (period === 'year') y.setFullYear(y.getFullYear() - 1);
    else y.setMonth(y.getMonth() - 1);
    return y;
  };
  return { from: now(start), prevFrom: now(back(start)), prevTo: now(back(d)) };
}

const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : null);

/**
 * Adds { stats, performance, growth } to user rows of one role, using a few grouped queries.
 * performance: employees = attendance rate in the period; MR/doctor/pharmacy = period sales relative to the
 * top seller of the role (top = 100). Falls back to the stored meta.performance rating when there is no data yet.
 * growth: employees = attendance rate change in points; others = % sales change vs the same span last period.
 */
async function withStats(users, role, period) {
  const { from, prevFrom, prevTo } = periodRange(period);
  const cur = (t) => t >= from;
  const prev = (t) => t >= prevFrom && t < prevTo;
  const result = new Map();

  if (role === 'employee') {
    const att = await db('attendance')
      .join('users', 'users.id', 'attendance.user_id')
      .where('users.role', role)
      .where('attendance.date', '>=', prevFrom.slice(0, 10))
      .select('attendance.user_id', 'attendance.date', 'attendance.status');
    const rate = (list) => pct(list.filter((a) => ATTENDED.includes(a.status)).length, list.length);
    for (const u of users) {
      const mine = att.filter((a) => a.user_id === u.id);
      const curRate = rate(mine.filter((a) => cur(`${a.date} 00:00:00`)));
      const prevRate = rate(mine.filter((a) => prev(`${a.date} 00:00:00`)));
      result.set(u.id, { stats: { attendanceRate: curRate }, score: curRate, growth: curRate != null && prevRate != null ? curRate - prevRate : null });
    }
  } else {
    const [orders, totals, assigned, mrs] = await Promise.all([
      db('orders').whereNot('status', 'Cancelled').where('created_at', '>=', prevFrom).select('buyer_id', 'total', 'created_at'),
      role === 'mr' ? [] : db('orders').whereNot('status', 'Cancelled').groupBy('buyer_id').select('buyer_id').sum({ total: 'total' }),
      db('users').whereIn('role', BUYERS).whereNotNull('assigned_mr_id').select('id', 'assigned_mr_id'),
      db('users').where('role', 'mr').select('id', 'name'),
    ]);
    const mrOf = new Map(assigned.map((b) => [b.id, b.assigned_mr_id]));
    const mrName = new Map(mrs.map((m) => [m.id, m.name]));
    const purchase = new Map(totals.map((t) => [t.buyer_id, Number(t.total)]));
    const owner = (o) => (role === 'mr' ? mrOf.get(o.buyer_id) : o.buyer_id);
    const sum = (list) => Math.round(list.reduce((s, o) => s + Number(o.total), 0) * 100) / 100;
    for (const u of users) {
      const mine = orders.filter((o) => owner(o) === u.id);
      const sales = sum(mine.filter((o) => cur(o.created_at)));
      const before = sum(mine.filter((o) => prev(o.created_at)));
      const stats =
        role === 'mr'
          ? { doctors: assigned.filter((b) => b.assigned_mr_id === u.id).length, sales }
          : { orders: mine.filter((o) => cur(o.created_at)).length, sales, purchase: purchase.get(u.id) ?? 0, mrName: mrName.get(u.assigned_mr_id) ?? null };
      result.set(u.id, { stats, sales, growth: before ? Math.round(((sales - before) / before) * 100) : null });
    }
    const top = Math.max(0, ...[...result.values()].map((r) => r.sales));
    for (const r of result.values()) r.score = top ? pct(r.sales, top) : null;
  }

  return users.map((u) => {
    const { stats, score, growth } = result.get(u.id);
    return { ...u, stats, performance: score ?? u.meta.performance ?? null, growth };
  });
}

// ---- own profile (every role) ----

router.get('/me', async (req, res) => {
  const row = await db('users').where({ id: req.user.id }).first('password_hash');
  res.json({ ...req.user, hasPassword: Boolean(row?.password_hash) });
});

router.patch('/me', async (req, res) => {
  const row = await baseFields(pick(req.body, ['name', 'email', 'phone']), req.user.id);
  const meta = { ...req.user.meta, ...metaPatch(req.body, SELF_META[req.user.role] ?? []) };
  await db('users').where({ id: req.user.id }).update({ ...row, meta: toJson(meta), updated_at: now() });
  res.json(publicUser(await db('users').where({ id: req.user.id }).first()));
});

router.put('/me/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  const { password_hash } = await db('users').where({ id: req.user.id }).first('password_hash');
  if (password_hash && !(await verifyPassword(currentPassword, password_hash))) throw badRequest('Current password is incorrect');
  await db('users').where({ id: req.user.id }).update({ password_hash: await passwordHash(newPassword), updated_at: now() });
  res.json({ ok: true, message: 'Password updated' });
});

// ---- admin: user directory ----

router.get('/options', admin, async (req, res) => {
  const role = req.query.role ?? 'mr';
  res.json(await db('users').where({ role }).orderBy('name').select('id', 'name', 'code', 'status'));
});

router.get('/', admin, async (req, res) => {
  const { role, status, search, period = 'month' } = req.query;
  const q = db('users').orderBy('id');
  if (role) q.where({ role });
  if (status) q.where({ status });
  if (search) {
    const s = `%${String(search).trim()}%`;
    q.where((b) => b.where('name', 'like', s).orWhere('code', 'like', s).orWhere('phone', 'like', s).orWhere('email', 'like', s));
  }
  const users = (await q).map(publicUser);
  res.json(ROLE[role] ? await withStats(users, role, period) : users);
});

router.post('/', admin, async (req, res) => {
  const body = req.body ?? {};
  const cfg = ROLE[body.role];
  if (!cfg) throw badRequest('Role must be one of: employee, mr, doctor, pharmacy');
  const row = await baseFields({ name: '', phone: '', ...body });
  const meta = metaPatch(body, cfg.meta);
  requireMeta(meta, cfg.required);
  if (body.password) {
    if (!row.email && !row.username) throw badRequest('An email is required to give this user a login password');
    row.password_hash = await passwordHash(body.password);
  }
  const ts = now();
  const [id] = await db('users').insert({
    ...row,
    role: body.role,
    status: row.status ?? 'Active',
    code: await nextCode(db('users'), 'code', cfg.prefix),
    assigned_mr_id: BUYERS.includes(body.role) ? await mrId(body.assignedMrId) : null,
    meta: toJson(meta),
    created_at: ts,
    updated_at: ts,
  });
  res.status(201).json(publicUser(await db('users').where({ id }).first()));
});

/** Loads a managed (non-admin) user or throws. */
async function managed(id) {
  const user = await db('users').where({ id }).first();
  if (!user) throw notFound('User');
  if (!ROLE[user.role]) throw forbidden('Administrator accounts are managed from their own profile');
  return publicUser(user);
}

router.put('/:id', admin, async (req, res) => {
  const body = req.body ?? {};
  const user = await managed(req.params.id);
  if (body.role && body.role !== user.role) throw badRequest('Role cannot be changed');
  const cfg = ROLE[user.role];
  const row = await baseFields(body, user.id);
  const meta = { ...user.meta, ...metaPatch(body, cfg.meta) };
  requireMeta(meta, cfg.required);
  if (BUYERS.includes(user.role) && body.assignedMrId !== undefined) row.assigned_mr_id = await mrId(body.assignedMrId);
  if (body.password) {
    if (!(row.email ?? user.email) && !(row.username ?? user.username)) throw badRequest('An email is required to give this user a login password');
    row.password_hash = await passwordHash(body.password);
  }
  await db('users').where({ id: user.id }).update({ ...row, meta: toJson(meta), updated_at: now() });
  res.json(publicUser(await db('users').where({ id: user.id }).first()));
});

router.delete('/:id', admin, async (req, res) => {
  const user = await managed(req.params.id);
  if (user.id === req.user.id) throw forbidden('You cannot delete your own account');
  const id = user.id;
  const history = await Promise.all([
    db('orders').where('buyer_id', id).first('id'),
    db('mr_visits').where('mr_id', id).orWhere('doctor_id', id).first('id'),
    db('attendance').where('user_id', id).first('id'),
    db('leave_requests').where('user_id', id).first('id'),
  ]);
  if (history.some(Boolean)) {
    await db('users').where({ id }).update({ status: 'Inactive', updated_at: now() });
    return res.json({ deleted: false, deactivated: true, message: `${user.name} has orders, visits or attendance history, so the account was set to Inactive instead` });
  }
  await db('users').where({ id }).del();
  res.json({ deleted: true, deactivated: false, message: `${user.name} deleted` });
});

export default router;
