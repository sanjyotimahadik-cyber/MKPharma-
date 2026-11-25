import { Router } from 'express';
import db, { LIKE, now } from '../db.js';
import { requireRole } from '../auth.js';
import { badRequest, notFound, nextCode, requireFields } from '../http.js';

const router = Router();

export const TYPE_ROLE = { Doctors: 'doctor', Pharmacy: 'pharmacy', 'MR Team': 'mr' };
const ROLE_TYPE = Object.fromEntries(Object.entries(TYPE_ROLE).map(([t, r]) => [r, t]));
const STATUSES = ['active', 'closed'];
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') && !Number.isNaN(Date.parse(s));

/**
 * Per-user achievement for each target: { [targetId]: Map(userId -> value) }.
 * Orders and visits in the overall date window are fetched once and aggregated in JS.
 */
async function achievements(targets) {
  if (!targets.length) return {};
  const from = targets.reduce((m, t) => (t.start_date < m ? t.start_date : m), targets[0].start_date);
  const to = targets.reduce((m, t) => (t.end_date > m ? t.end_date : m), targets[0].end_date);
  const [orders, visits] = await Promise.all([
    targets.some((t) => t.metric === 'sales')
      ? db('orders').whereNot({ status: 'Cancelled' }).whereBetween('created_at', [from, `${to} 23:59:59`]).select('buyer_id', 'total', 'created_at')
      : [],
    targets.some((t) => t.metric === 'visits')
      ? db('mr_visits').where({ status: 'Completed' }).whereBetween('visit_date', [from, to]).select('mr_id', 'visit_date')
      : [],
  ]);
  const events = {
    sales: orders.map((o) => ({ user: o.buyer_id, date: String(o.created_at).slice(0, 10), value: Number(o.total) })),
    visits: visits.map((v) => ({ user: v.mr_id, date: v.visit_date, value: 1 })),
  };
  return Object.fromEntries(
    targets.map((t) => {
      const sums = new Map();
      for (const e of events[t.metric]) {
        if (e.date >= t.start_date && e.date <= t.end_date) sums.set(e.user, (sums.get(e.user) ?? 0) + e.value);
      }
      return [t.id, sums];
    }),
  );
}

const pct = (achieved, target) => (Number(target) > 0 ? Math.round((achieved / Number(target)) * 100) : 0);
const round = (n) => Math.round(n * 100) / 100;

const serialize = (t, achieved) => ({
  id: t.id,
  code: t.code,
  name: t.name,
  type: t.type,
  metric: t.metric,
  targetValue: Number(t.target_value),
  achieved: round(achieved),
  progress: Math.min(100, pct(achieved, t.target_value)),
  rawProgress: pct(achieved, t.target_value),
  startDate: t.start_date,
  endDate: t.end_date,
  status: t.status,
  description: t.description ?? '',
});

/** Targets assigned to the signed-in user, or to the whole group of their role, with their own progress. */
router.get('/mine', async (req, res) => {
  const type = ROLE_TYPE[req.user.role];
  const rows = await db('targets')
    .where({ status: 'active' })
    .andWhere((q) => {
      q.where({ assignee_id: req.user.id });
      if (type) q.orWhere((g) => g.whereNull('assignee_id').andWhere({ type }));
    })
    .orderBy('end_date');
  const sums = await achievements(rows);
  res.json(rows.map((t) => serialize(t, sums[t.id].get(req.user.id) ?? 0)));
});

router.use(requireRole('admin'));

router.get('/', async (req, res) => {
  const { status, type, search, month } = req.query;
  const q = db('targets as t').leftJoin('users as u', 'u.id', 't.assignee_id').select('t.*', 'u.name as assignee_name').orderBy('t.code');
  if (status && status !== 'all') q.where('t.status', status);
  if (type) q.where('t.type', type);
  if (search) {
    const s = `%${search}%`;
    q.where((w) => w.where('t.name', LIKE, s).orWhere('t.code', LIKE, s).orWhere('t.type', LIKE, s).orWhere('u.name', LIKE, s));
  }
  if (/^\d{4}-\d{2}$/.test(month ?? '')) q.where('t.start_date', '<=', `${month}-31`).andWhere('t.end_date', '>=', `${month}-01`);
  const rows = await q;

  const sums = await achievements(rows);
  const groupRoles = [...new Set(rows.filter((t) => !t.assignee_id).map((t) => TYPE_ROLE[t.type]))];
  const members = groupRoles.length ? await db('users').whereIn('role', groupRoles).select('id', 'name', 'role') : [];

  res.json(
    rows.map((t) => {
      const s = sums[t.id];
      if (t.assignee_id) {
        return { ...serialize(t, s.get(t.assignee_id) ?? 0), assigneeId: t.assignee_id, assigneeName: t.assignee_name, performers: [] };
      }
      const group = members.filter((m) => m.role === TYPE_ROLE[t.type]);
      const achieved = group.reduce((sum, m) => sum + (s.get(m.id) ?? 0), 0);
      const performers = group
        .map((m) => ({ name: m.name, value: round(s.get(m.id) ?? 0) }))
        .filter((p) => p.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
      return { ...serialize(t, achieved), assigneeId: null, assigneeName: null, performers };
    }),
  );
});

/** Validates a create/update body and returns the DB columns. */
async function columns(body, existing = {}) {
  const merged = {
    name: body.name ?? existing.name,
    type: body.type ?? existing.type,
    assigneeId: body.assigneeId !== undefined ? body.assigneeId || null : existing.assignee_id ?? null,
    targetValue: body.targetValue ?? existing.target_value,
    startDate: body.startDate ?? existing.start_date,
    endDate: body.endDate ?? existing.end_date,
  };
  requireFields(merged, ['name', 'type', 'targetValue', 'startDate', 'endDate']);
  if (!TYPE_ROLE[merged.type]) throw badRequest(`Type must be one of: ${Object.keys(TYPE_ROLE).join(', ')}`);
  if (!(Number(merged.targetValue) > 0)) throw badRequest('Target value must be greater than 0');
  if (!isDate(merged.startDate) || !isDate(merged.endDate)) throw badRequest('Dates must be YYYY-MM-DD');
  if (merged.startDate > merged.endDate) throw badRequest('End date must be on or after the start date');
  if (merged.assigneeId) {
    const u = await db('users').where({ id: merged.assigneeId }).first();
    if (!u || u.role !== TYPE_ROLE[merged.type]) throw badRequest(`Assignee must be a ${TYPE_ROLE[merged.type]} user`);
  }
  return {
    name: String(merged.name).trim(),
    type: merged.type,
    metric: merged.type === 'MR Team' ? 'visits' : 'sales', // MRs are measured by visits, buyers by order value
    assignee_id: merged.assigneeId,
    target_value: Number(merged.targetValue),
    start_date: merged.startDate,
    end_date: merged.endDate,
    description: body.description ?? existing.description ?? null,
    updated_at: now(),
  };
}

const findTarget = async (id) => {
  const t = await db('targets').where({ id }).first();
  if (!t) throw notFound('Target');
  return t;
};

router.post('/', async (req, res) => {
  const data = await columns(req.body ?? {});
  const code = await nextCode(db('targets'), 'code', 'TG', 3);
  const [id] = await db('targets').insertGetId({ ...data, code, status: 'active', created_by: req.user.id, created_at: data.updated_at });
  res.status(201).json({ id: Number(id), code });
});

router.put('/:id', async (req, res) => {
  const t = await findTarget(req.params.id);
  await db('targets').where({ id: t.id }).update(await columns(req.body ?? {}, t));
  res.json({ ok: true });
});

router.patch('/:id/status', async (req, res) => {
  const t = await findTarget(req.params.id);
  if (!STATUSES.includes(req.body?.status)) throw badRequest('Status must be active or closed');
  await db('targets').where({ id: t.id }).update({ status: req.body.status, updated_at: now() });
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  const t = await findTarget(req.params.id);
  await db('targets').where({ id: t.id }).del();
  res.status(204).end();
});

export default router;
