import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { Router } from 'express';
import { UPLOAD_DIR } from '../app.js';
import { requireRole } from '../auth.js';
import db, { fromJson, now, toJson } from '../db.js';
import { badRequest, nextCode, notFound, requireFields } from '../http.js';
import { STAFF } from '../orderFlow.js';
import { getSettings } from './settings.js';

const router = Router();
// Catalogue and stock are managed by staff: admin and employees.
const staff = requireRole(...STAFF);

/** API shape of a product (matches what the React pages render). */
export const serializeProduct = (p) => ({
  id: p.id,
  code: p.code,
  name: p.name,
  category: p.category,
  price: Number(p.price),
  mrp: p.mrp == null ? null : Number(p.mrp),
  gstRate: Number(p.gst_rate),
  stock: Number(p.stock),
  reorderLevel: Number(p.reorder_level),
  expiry: p.expiry,
  description: p.description ?? '',
  benefits: fromJson(p.benefits, []),
  composition: fromJson(p.composition, []),
  indications: fromJson(p.indications, []),
  dosage: p.dosage ?? '',
  images: fromJson(p.images, []),
  status: p.status,
  updatedAt: p.updated_at,
});

const number = (v, field, { int = false } = {}) => {
  const n = Number(v);
  if (v === '' || !Number.isFinite(n) || n < 0 || (int && !Number.isInteger(n))) {
    throw badRequest(`${field} must be a ${int ? 'whole ' : ''}number of 0 or more`);
  }
  return n;
};
const list = (v, field) => {
  if (!Array.isArray(v) || v.some((s) => typeof s !== 'string')) throw badRequest(`${field} must be a list of text`);
  return toJson(v.map((s) => s.trim()).filter(Boolean));
};

/** Validates the editable fields present in body and maps them to columns. */
function productColumns(b) {
  const c = {};
  for (const k of ['name', 'category', 'description', 'dosage']) if (b[k] !== undefined) c[k] = String(b[k] ?? '').trim();
  if (c.name === '' || c.category === '') throw badRequest('Name and category are required');
  if (b.price !== undefined) c.price = number(b.price, 'Price');
  if (b.mrp !== undefined) c.mrp = b.mrp == null || b.mrp === '' ? null : number(b.mrp, 'MRP');
  if (b.gstRate !== undefined) c.gst_rate = number(b.gstRate, 'GST rate');
  if (b.stock !== undefined) c.stock = number(b.stock, 'Stock', { int: true });
  if (b.reorderLevel !== undefined) c.reorder_level = number(b.reorderLevel, 'Reorder level', { int: true });
  if (b.expiry !== undefined) {
    if (b.expiry && !/^\d{4}-\d{2}-\d{2}$/.test(b.expiry)) throw badRequest('Expiry must be a date (YYYY-MM-DD)');
    c.expiry = b.expiry || null;
  }
  for (const k of ['benefits', 'composition', 'indications', 'images']) if (b[k] !== undefined) c[k] = list(b[k], k);
  if (b.status !== undefined) {
    if (!['Active', 'Inactive'].includes(b.status)) throw badRequest('Status must be Active or Inactive');
    c.status = b.status;
  }
  return c;
}

/** Writes a stock_transactions row for a stock change made inside trx. */
const logStock = (trx, productId, userId, type, previous, next, reason) =>
  trx('stock_transactions').insert({
    product_id: productId,
    user_id: userId,
    type,
    quantity: next - previous,
    previous_quantity: previous,
    new_quantity: next,
    reason: reason || null,
    created_at: now(),
  });

const findProduct = async (q, id) => {
  const row = await q('products').where({ id }).first();
  if (!row) throw notFound('Product');
  return row;
};

// Every signed-in role can browse the catalogue.
router.get('/', async (_req, res) => {
  const rows = await db('products').where({ status: 'Active' }).orderBy('id');
  res.json(rows.map(serializeProduct));
});

// Stock movement history, newest first.
router.get('/stock/transactions', staff, async (req, res) => {
  const q = db('stock_transactions as t')
    .join('products as p', 'p.id', 't.product_id')
    .leftJoin('users as u', 'u.id', 't.user_id')
    .select('t.*', 'p.name as product_name', 'u.name as user_name')
    .orderBy([{ column: 't.created_at', order: 'desc' }, { column: 't.id', order: 'desc' }])
    .limit(Math.min(Number(req.query.limit) || 50, 500));
  if (req.query.productId) q.where('t.product_id', req.query.productId);
  res.json(
    (await q).map((t) => ({
      id: t.id,
      productId: t.product_id,
      productName: t.product_name,
      type: t.type,
      quantity: t.quantity,
      previousQuantity: t.previous_quantity,
      newQuantity: t.new_quantity,
      reason: t.reason ?? '',
      user: t.user_name ?? '',
      createdAt: t.created_at,
    })),
  );
});

// Units sold per month of ?year= and the best sellers by units (cancelled orders excluded).
router.get('/stock/summary', staff, async (req, res) => {
  const year = String(Number(req.query.year) || new Date().getFullYear());
  const items = await db('order_items as i')
    .join('orders as o', 'o.id', 'i.order_id')
    .whereNot('o.status', 'Cancelled')
    .where('o.created_at', 'like', `${year}-%`)
    .select('i.product_id', 'i.name', 'i.qty', 'o.created_at');
  const monthly = Array(12).fill(0);
  const byProduct = new Map();
  for (const i of items) {
    const qty = Number(i.qty);
    monthly[Number(i.created_at.slice(5, 7)) - 1] += qty;
    const key = i.product_id ?? i.name;
    byProduct.set(key, { name: i.name, units: (byProduct.get(key)?.units ?? 0) + qty });
  }
  const ranked = [...byProduct.values()].sort((a, b) => b.units - a.units);
  const others = ranked.slice(5).reduce((s, p) => s + p.units, 0);
  const { first } = (await db('orders').min('created_at as first').first()) ?? {};
  const thisYear = new Date().getFullYear();
  const from = Math.min(Number(first?.slice(0, 4)) || thisYear, thisYear);
  res.json({
    year: Number(year),
    years: Array.from({ length: thisYear - from + 1 }, (_, i) => thisYear - i),
    monthly,
    top: others ? [...ranked.slice(0, 5), { name: 'Others', units: others }] : ranked,
  });
});

// Product image upload: { name, dataUrl } -> { url: '/uploads/<file>' }.
const IMAGE_TYPES = { jpeg: 'jpg', png: 'png', webp: 'webp' };
router.post('/uploads', staff, async (req, res) => {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(req.body?.dataUrl ?? '');
  if (!match) throw badRequest('Only JPEG, PNG or WebP images can be uploaded');
  const data = Buffer.from(match[2], 'base64');
  if (data.length > 5 * 1024 * 1024) throw badRequest('Image must be 5 MB or smaller');
  const file = `${randomUUID()}.${IMAGE_TYPES[match[1]]}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(UPLOAD_DIR + file, data);
  res.status(201).json({ url: `/uploads/${file}` });
});

router.get('/:id', async (req, res) => {
  res.json(serializeProduct(await findProduct(db, req.params.id)));
});

router.post('/', staff, async (req, res) => {
  requireFields(req.body, ['name', 'category', 'price']);
  const cols = productColumns(req.body);
  cols.reorder_level ??= (await getSettings()).inventory.lowStockLevel;
  const ts = now();
  const id = await db.transaction(async (trx) => {
    const code = await nextCode(trx('products'), 'code', 'MK-', 3);
    const [newId] = await trx('products').insertGetId({ ...cols, code, created_at: ts, updated_at: ts });
    if (cols.stock) await logStock(trx, newId, req.user.id, 'PURCHASE', 0, cols.stock, 'Opening stock');
    return newId;
  });
  res.status(201).json(serializeProduct(await findProduct(db, id)));
});

router.put('/:id', staff, async (req, res) => {
  const cols = productColumns(req.body);
  await db.transaction(async (trx) => {
    const before = await findProduct(trx, req.params.id);
    await trx('products').where({ id: before.id }).update({ ...cols, updated_at: now() });
    if (cols.stock !== undefined && cols.stock !== Number(before.stock)) {
      await logStock(trx, before.id, req.user.id, 'ADJUSTMENT', Number(before.stock), cols.stock, 'Edited in product form');
    }
  });
  res.json(serializeProduct(await findProduct(db, req.params.id)));
});

// Soft delete so past orders keep their product reference.
router.delete('/:id', staff, async (req, res) => {
  const p = await findProduct(db, req.params.id);
  await db('products').where({ id: p.id }).update({ status: 'Inactive', updated_at: now() });
  res.status(204).end();
});

// { type: 'add' | 'remove', quantity, reason } -> updated product.
router.post('/:id/stock', staff, async (req, res) => {
  const { type, reason } = req.body ?? {};
  const quantity = Number(req.body?.quantity);
  if (!['add', 'remove'].includes(type)) throw badRequest("Type must be 'add' or 'remove'");
  if (!Number.isInteger(quantity) || quantity <= 0) throw badRequest('Quantity must be a whole number above 0');
  await db.transaction(async (trx) => {
    const p = await findProduct(trx, req.params.id);
    const previous = Number(p.stock);
    if (type === 'remove' && quantity > previous) throw badRequest(`Cannot remove more than the ${previous} units in stock`);
    const next = previous + (type === 'add' ? quantity : -quantity);
    await trx('products').where({ id: p.id }).update({ stock: next, updated_at: now() });
    await logStock(trx, p.id, req.user.id, type === 'add' ? 'PURCHASE' : 'ADJUSTMENT', previous, next, String(reason ?? '').trim());
  });
  res.json(serializeProduct(await findProduct(db, req.params.id)));
});

export default router;
