import { Router } from 'express';
import { requireRole } from '../auth.js';
import db, { fromJson, now } from '../db.js';
import { badRequest, forbidden, nextCode, notFound } from '../http.js';
import { notify, notifyRole } from '../notify.js';

const router = Router();
const BUYERS = ['doctor', 'pharmacy'];
const PAYMENT_STATUSES = ['Paid', 'Unpaid'];
// Allowed status moves (admin). Buyers may only cancel their own Pending orders.
const NEXT = { Pending: ['Processing', 'Cancelled'], Processing: ['Completed', 'Cancelled'], Completed: [], Cancelled: [] };
const round2 = (n) => Math.round(n * 100) / 100;
const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const serializeItem = (i) => ({
  productId: i.product_id,
  name: i.name,
  category: i.category,
  price: Number(i.price),
  qty: Number(i.qty),
  gstRate: Number(i.gst_rate),
  total: Number(i.total),
});

const serializeOrder = (o, items, buyer) => ({
  id: o.id,
  orderNumber: o.order_number,
  invoiceNumber: o.invoice_number,
  buyer,
  buyerRole: o.buyer_role,
  status: o.status,
  paymentMethod: o.payment_method,
  paymentStatus: o.payment_status,
  subtotal: Number(o.subtotal),
  gst: Number(o.gst),
  delivery: Number(o.delivery),
  total: Number(o.total),
  createdAt: o.created_at,
  paidAt: o.paid_at,
  items: items.map(serializeItem),
});

/** Attaches items and buyer to order rows (two queries, no N+1). Also used by the admin dashboard. */
export async function withDetails(rows) {
  if (!rows.length) return [];
  const [items, buyers] = await Promise.all([
    db('order_items').whereIn('order_id', rows.map((o) => o.id)).orderBy('id'),
    db('users').whereIn('id', [...new Set(rows.map((o) => o.buyer_id))]).select('id', 'name', 'code', 'role', 'phone', 'meta'),
  ]);
  const buyerById = new Map(buyers.map((b) => [b.id, { ...b, meta: fromJson(b.meta, {}) }]));
  return rows.map((o) => serializeOrder(o, items.filter((i) => i.order_id === o.id), buyerById.get(o.buyer_id) ?? null));
}

const one = async (id) => (await withDetails([await db('orders').where({ id }).first()]))[0];

/** Loads an order the signed-in user may see (admin: any, buyer: own). */
async function findOrder(req) {
  const order = await db('orders').where({ id: req.params.id }).first();
  if (!order || (req.user.role !== 'admin' && order.buyer_id !== req.user.id)) throw notFound('Order');
  return order;
}

router.use(requireRole('admin', ...BUYERS));

// Buyers see their own orders; admin sees all, with optional filters.
router.get('/', async (req, res) => {
  const { status, paymentStatus, buyerRole, search, from, to } = req.query;
  const q = db('orders as o').join('users as u', 'u.id', 'o.buyer_id').select('o.*').orderBy('o.created_at', 'desc').orderBy('o.id', 'desc');
  if (req.user.role !== 'admin') q.where('o.buyer_id', req.user.id);
  else if (buyerRole) q.where('o.buyer_role', buyerRole);
  if (status) q.where('o.status', status);
  if (paymentStatus) q.where('o.payment_status', paymentStatus);
  if (from) q.where('o.created_at', '>=', from);
  if (to) q.where('o.created_at', '<=', `${to} 23:59:59`);
  if (search?.trim()) {
    const like = `%${search.trim()}%`;
    q.where((w) => w.where('o.order_number', 'like', like).orWhere('o.invoice_number', 'like', like).orWhere('u.name', 'like', like).orWhere('u.code', 'like', like));
  }
  res.json(await withDetails(await q));
});

router.get('/:id', async (req, res) => {
  res.json(await one((await findOrder(req)).id));
});

// Places an order. Prices, GST and delivery are computed here from products + settings, never trusted from the client.
router.post('/', requireRole(...BUYERS), async (req, res) => {
  const { items, paymentMethod } = req.body ?? {};
  if (!Array.isArray(items) || !items.length) throw badRequest('Add at least one product to the order');
  const qtys = new Map();
  for (const { productId, qty } of items) {
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1) throw badRequest('Quantity must be a whole number of at least 1');
    qtys.set(Number(productId), (qtys.get(Number(productId)) ?? 0) + n);
  }

  const id = await db.transaction(async (trx) => {
    const ts = now();
    const products = await trx('products').whereIn('id', [...qtys.keys()]);
    const billing = fromJson((await trx('settings').where({ key: 'billing' }).first())?.value, {});
    const gstRate = Number(billing.gstRate ?? 12);

    const lines = [...qtys].map(([productId, qty]) => {
      const p = products.find((x) => x.id === productId);
      if (!p || p.status !== 'Active') throw badRequest('One of the products is no longer available');
      if (p.expiry && p.expiry < ts.slice(0, 10)) throw badRequest(`${p.name} has expired`);
      if (p.stock < qty) throw badRequest(`Only ${p.stock} units of ${p.name} available`);
      return { p, qty, total: round2(Number(p.price) * qty) };
    });
    const subtotal = round2(lines.reduce((s, l) => s + l.total, 0));
    const gst = round2((subtotal * gstRate) / 100);
    const delivery = Number(billing.deliveryCharge ?? 0);
    const orderNumber = await nextCode(trx('orders'), 'order_number', 'ORD-', 4);

    const [orderId] = await trx('orders').insert({
      order_number: orderNumber,
      invoice_number: orderNumber.replace('ORD', 'INV'),
      buyer_id: req.user.id,
      buyer_role: req.user.role,
      status: 'Pending',
      payment_method: paymentMethod || 'Cash on Delivery',
      payment_status: 'Unpaid',
      subtotal,
      gst,
      delivery,
      total: round2(subtotal + gst + delivery),
      created_at: ts,
      updated_at: ts,
    });

    for (const { p, qty, total } of lines) {
      await trx('order_items').insert({ order_id: orderId, product_id: p.id, name: p.name, category: p.category, price: p.price, qty, gst_rate: gstRate, total });
      // Conditional decrement guards against a concurrent order taking the same stock.
      const changed = await trx('products').where({ id: p.id }).where('stock', '>=', qty).update({ stock: trx.raw('stock - ?', [qty]), updated_at: ts });
      if (!changed) throw badRequest(`Not enough stock for ${p.name}`);
      await trx('stock_transactions').insert({
        product_id: p.id, user_id: req.user.id, type: 'SALE', quantity: -qty,
        previous_quantity: p.stock, new_quantity: p.stock - qty, reason: `Order ${orderNumber}`, created_at: ts,
      });
    }
    return orderId;
  });

  const order = await one(id);
  await notifyRole('admin', 'New order', `${req.user.name} placed ${order.orderNumber} for ${rupees(order.total)}`, 'order');
  res.status(201).json(order);
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body ?? {};
  const order = await findOrder(req);
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !(status === 'Cancelled' && order.status === 'Pending')) throw forbidden('Only pending orders can be cancelled');
  if (!NEXT[order.status]?.includes(status)) throw badRequest(`A ${order.status} order cannot be changed to ${status ?? 'that status'}`);

  await db.transaction(async (trx) => {
    const ts = now();
    await trx('orders').where({ id: order.id }).update({ status, updated_at: ts });
    if (status !== 'Cancelled') return;
    // Put the stock back.
    for (const item of await trx('order_items').where({ order_id: order.id }).whereNotNull('product_id')) {
      const p = await trx('products').where({ id: item.product_id }).first();
      if (!p) continue;
      await trx('products').where({ id: p.id }).update({ stock: trx.raw('stock + ?', [item.qty]), updated_at: ts });
      await trx('stock_transactions').insert({
        product_id: p.id, user_id: req.user.id, type: 'RETURN', quantity: item.qty,
        previous_quantity: p.stock, new_quantity: p.stock + item.qty, reason: `Order ${order.order_number} cancelled`, created_at: ts,
      });
    }
  });

  if (isAdmin) await notify(order.buyer_id, `Order ${status.toLowerCase()}`, `Your order ${order.order_number} is now ${status}`, 'order');
  else await notifyRole('admin', 'Order cancelled', `${req.user.name} cancelled ${order.order_number}`, 'order');
  res.json(await one(order.id));
});

router.patch('/:id/payment', requireRole('admin'), async (req, res) => {
  const { paymentStatus, paymentMethod } = req.body ?? {};
  if (!PAYMENT_STATUSES.includes(paymentStatus)) throw badRequest('paymentStatus must be Paid or Unpaid');
  const order = await findOrder(req);
  if (order.status === 'Cancelled' && paymentStatus === 'Paid') throw badRequest('A cancelled order cannot be marked as paid');
  const ts = now();
  await db('orders').where({ id: order.id }).update({
    payment_status: paymentStatus,
    ...(paymentMethod && { payment_method: paymentMethod }),
    paid_at: paymentStatus === 'Paid' ? (order.paid_at ?? ts) : null,
    updated_at: ts,
  });
  if (paymentStatus === 'Paid' && order.payment_status !== 'Paid') {
    await notify(order.buyer_id, 'Payment received', `Payment of ${rupees(order.total)} for ${order.order_number} has been received`, 'payment');
  }
  res.json(await one(order.id));
});

export default router;
