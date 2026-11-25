import { Router } from 'express';
import db, { bool, fromJson, now, today } from '../db.js';
import { requireRole } from '../auth.js';
import { badRequest, HttpError, notFound } from '../http.js';

const router = Router();
router.use(requireRole('mr'));

const num = (v) => (v == null || v === '' ? null : Number(v));

const serializeVisit = (v) => ({
  id: v.id,
  doctorId: v.doctor_id,
  doctorName: v.doctor_name,
  visitDate: v.visit_date,
  visitedAt: v.visited_at,
  status: v.status,
  notes: v.notes ?? '',
  products: v.products ?? '',
  sampleGiven: bool(v.sample_given),
  orderTaken: bool(v.order_taken),
  latitude: num(v.latitude),
  longitude: num(v.longitude),
  accuracy: num(v.accuracy),
});

/** Editable visit fields from a request body. */
const visitFields = (b) => {
  const out = {};
  if (b.notes !== undefined) out.notes = String(b.notes ?? '').trim();
  if (b.products !== undefined) out.products = String(b.products ?? '').trim();
  if (b.sampleGiven !== undefined) out.sample_given = Boolean(b.sampleGiven);
  if (b.orderTaken !== undefined) out.order_taken = Boolean(b.orderTaken);
  for (const k of ['latitude', 'longitude', 'accuracy']) {
    if (b[k] === undefined) continue;
    if (b[k] !== null && !Number.isFinite(Number(b[k]))) throw badRequest(`${k} must be a number`);
    out[k] = num(b[k]);
  }
  return out;
};

const ownVisits = (mrId) =>
  db('mr_visits as v').join('users as d', 'd.id', 'v.doctor_id').where('v.mr_id', mrId).select('v.*', 'd.name as doctor_name');

/** Today's and this month's visit counts against the MR's own visit targets. */
router.get('/summary', async (req, res) => {
  const day = today();
  const monthStart = `${day.slice(0, 8)}01`;
  const [att, visits, targets, assignedDoctors] = await Promise.all([
    db('attendance').where({ user_id: req.user.id, date: day }).first(),
    db('mr_visits').where({ mr_id: req.user.id, status: 'Completed' }).whereBetween('visit_date', [monthStart, day]).pluck('visit_date'),
    db('targets')
      .where({ assignee_id: req.user.id, metric: 'visits', status: 'active' })
      .where('start_date', '<=', day)
      .where('end_date', '>=', day)
      .orderBy('end_date'),
    db('users').where({ assigned_mr_id: req.user.id, status: 'Active' }).whereIn('role', ['doctor', 'pharmacy']).count({ n: 'id' }).first(),
  ]);
  // A one-day target is the daily goal; the longer one is the period (monthly) goal. Without a daily
  // target, the daily goal is the period target spread evenly over its days.
  const daily = targets.find((t) => t.start_date === t.end_date);
  const period = targets.find((t) => t.start_date !== t.end_date);
  const periodDays = period ? Math.round((Date.parse(period.end_date) - Date.parse(period.start_date)) / 864e5) + 1 : 0;
  res.json({
    attendance: att?.status ?? 'Not marked',
    checkIn: att?.check_in ?? null,
    checkOut: att?.check_out ?? null,
    todayVisits: {
      done: visits.filter((d) => d === day).length,
      target: daily ? Number(daily.target_value) : period ? Math.ceil(Number(period.target_value) / periodDays) : 0,
    },
    monthVisits: { done: visits.length, target: period ? Number(period.target_value) : 0 },
    area: req.user.meta?.area ?? '',
    assignedDoctors: Number(assignedDoctors?.n ?? 0),
  });
});

/** Doctors and pharmacies assigned to the signed-in MR, with their latest visit by this MR. */
router.get('/doctors', async (req, res) => {
  const day = today();
  const rows = await db('users')
    .where({ assigned_mr_id: req.user.id, status: 'Active' })
    .whereIn('role', ['doctor', 'pharmacy'])
    .orderBy(['role', 'name']);
  const visits = rows.length
    ? await ownVisits(req.user.id).whereIn('v.doctor_id', rows.map((r) => r.id)).orderBy([{ column: 'v.visit_date', order: 'desc' }, { column: 'v.id', order: 'desc' }])
    : [];
  const latest = new Map();
  for (const v of visits) if (!latest.has(v.doctor_id)) latest.set(v.doctor_id, v);

  res.json(
    rows.map((r) => {
      const meta = fromJson(r.meta, {});
      const last = latest.get(r.id);
      return {
        id: r.id,
        code: r.code,
        name: r.name,
        role: r.role,
        phone: r.phone ?? '',
        area: meta.area ?? meta.location ?? '',
        hospital: meta.hospital ?? meta.owner ?? '',
        lastVisit: last ? serializeVisit(last) : null,
        visitedToday: last?.visit_date === day,
      };
    }),
  );
});

router.get('/visits', async (req, res) => {
  const { from, to, doctorId } = req.query;
  const q = ownVisits(req.user.id).orderBy([{ column: 'v.visit_date', order: 'desc' }, { column: 'v.id', order: 'desc' }]);
  if (from) q.where('v.visit_date', '>=', from);
  if (to) q.where('v.visit_date', '<=', to);
  if (doctorId) q.where('v.doctor_id', doctorId);
  res.json((await q).map(serializeVisit));
});

router.post('/visits', async (req, res) => {
  const doctorId = req.body?.doctorId;
  if (!doctorId) throw badRequest('Missing required field(s): doctorId');
  const doctor = await db('users').where({ id: doctorId, assigned_mr_id: req.user.id }).whereIn('role', ['doctor', 'pharmacy']).first();
  if (!doctor) throw notFound('Assigned doctor');
  const day = today();
  if (await db('mr_visits').where({ mr_id: req.user.id, doctor_id: doctor.id, visit_date: day }).first()) {
    throw new HttpError(409, 'Already visited today. Open the visit to edit it.');
  }
  const ts = now();
  const [id] = await db('mr_visits').insertGetId({
    sample_given: false,
    order_taken: false,
    ...visitFields(req.body),
    mr_id: req.user.id,
    doctor_id: doctor.id,
    visit_date: day,
    visited_at: ts,
    status: 'Completed',
    created_at: ts,
    updated_at: ts,
  });
  res.status(201).json(serializeVisit(await ownVisits(req.user.id).where('v.id', id).first()));
});

router.put('/visits/:id', async (req, res) => {
  const visit = await db('mr_visits').where({ id: req.params.id, mr_id: req.user.id }).first();
  if (!visit) throw notFound('Visit');
  await db('mr_visits').where({ id: visit.id }).update({ ...visitFields(req.body ?? {}), updated_at: now() });
  res.json(serializeVisit(await ownVisits(req.user.id).where('v.id', visit.id).first()));
});

export default router;
