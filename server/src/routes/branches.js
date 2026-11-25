import { Router } from 'express';
import { requireRole } from '../auth.js';
import db, { now } from '../db.js';
import { badRequest, nextCode, notFound, pick, requireFields } from '../http.js';

const router = Router();
router.use(requireRole('admin'));

const serialize = (b) => ({
  id: b.id,
  code: b.code,
  name: b.name,
  city: b.city ?? '',
  manager: b.manager ?? '',
  phone: b.phone ?? '',
  capacity: Number(b.capacity),
  status: b.status,
  updatedAt: b.updated_at,
});

/** Validates the editable fields present in body. */
function columns(body) {
  const c = pick(body, ['code', 'name', 'city', 'manager', 'phone', 'capacity', 'status']);
  for (const k of ['code', 'name', 'city', 'manager', 'phone']) if (c[k] !== undefined) c[k] = String(c[k] ?? '').trim();
  if (c.name === '') throw badRequest('Branch name is required');
  if (c.code !== undefined) c.code = c.code.toUpperCase();
  if (c.capacity !== undefined) {
    c.capacity = Number(c.capacity);
    if (!Number.isInteger(c.capacity) || c.capacity < 0) throw badRequest('Capacity must be a whole number of 0 or more');
  }
  if (c.status !== undefined && !['Active', 'Inactive'].includes(c.status)) throw badRequest('Status must be Active or Inactive');
  return c;
}

async function assertCodeFree(code, exceptId) {
  const clash = await db('branches').where({ code }).whereNot('id', exceptId ?? 0).first();
  if (clash) throw badRequest(`Branch code ${code} is already used by ${clash.name}`);
}

const find = async (id) => {
  const row = await db('branches').where({ id }).first();
  if (!row) throw notFound('Branch');
  return row;
};

router.get('/', async (_req, res) => {
  res.json((await db('branches').orderBy('name')).map(serialize));
});

router.post('/', async (req, res) => {
  requireFields(req.body, ['name']);
  const c = columns(req.body);
  c.code ||= await nextCode(db('branches'), 'code', 'BR-', 3);
  await assertCodeFree(c.code);
  const ts = now();
  const [id] = await db('branches').insert({ ...c, created_at: ts, updated_at: ts });
  res.status(201).json(serialize(await find(id)));
});

router.put('/:id', async (req, res) => {
  const branch = await find(req.params.id);
  const c = columns(req.body);
  if (c.code === '') delete c.code;
  if (c.code) await assertCodeFree(c.code, branch.id);
  await db('branches').where({ id: branch.id }).update({ ...c, updated_at: now() });
  res.json(serialize(await find(branch.id)));
});

router.delete('/:id', async (req, res) => {
  const branch = await find(req.params.id);
  await db('branches').where({ id: branch.id }).del();
  res.status(204).end();
});

export default router;
