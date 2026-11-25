import { Router } from 'express';
import { requireRole } from '../auth.js';
import db, { fromJson, LIKE, now } from '../db.js';
import { badRequest, forbidden, nextCode, notFound } from '../http.js';
import { notify, notifyRole } from '../notify.js';
import { CANCELLABLE, isStaff, nextStatuses, ORDER_STATUSES, STAFF } from '../orderFlow.js';

const router = Router();
const BUYERS = ['doctor', 'pharmacy'];
const PAYMENT_STATUSES = ['Paid', 'Unpaid'];
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

const serializeEvent = (e) => ({ status: e.status, note: e.note, at: e.created_at, by: e.by_name ?? null, byRole: e.by_role ?? null });

const serializeOrder = (o, items, buyer, events) => ({
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
  updatedAt: o.updated_at,
  paidAt: o.paid_at,
  items: items.map(serializeItem),
  events: events.map(serializeEvent),
});

/** Attaches items, buyer and tracking events to order rows (three queries, no N+1). Also used by the admin dashboard. */
export async function withDetails(rows) {
  if (!rows.length) return [];
  const ids = rows.map((o) => o.id);
  const [items, buyers, events] = await Promise.all([
    db('order_items').whereIn('order_id', ids).orderBy('id'),
    db('users').whereIn('id', [...new Set(rows.map((o) => o.buyer_id))]).select('id', 'name', 'code', 'role', 'phone', 'email', 'meta'),
    db('order_events as e').leftJoin('users as u', 'u.id', 'e.user_id').whereIn('e.order_id', ids)
      .select('e.*', 'u.name as by_name', 'u.role as by_role').orderBy('e.created_at').orderBy('e.id'),
  ]);
  const buyerById = new Map(buyers.map((b) => [b.id, { ...b, meta: fromJson(b.meta, {}) }]));
  const itemsBy = Map.groupBy(items, (i) => i.order_id);
  const eventsBy = Map.groupBy(events, (e) => e.order_id);
  return rows.map((o) => serializeOrder(o, itemsBy.get(o.id) ?? [], buyerById.get(o.buyer_id) ?? null, eventsBy.get(o.id) ?? []));
}

const logEvent = (trx, orderId, status, userId, note, ts) =>
  trx('order_events').insert({ order_id: orderId, status, note: note?.trim().slice(0, 255) || null, user_id: userId, created_at: ts });

const one = async (id) => (await withDetails([await db('orders').where({ id }).first()]))[0];

/** Loads an order the signed-in user may see (staff: any, buyer: own). */
async function findOrder(req) {
  const order = await db('orders').where({ id: req.params.id }).first();
  if (!order || (!isStaff(req.user) && order.buyer_id !== req.user.id)) throw notFound('Order');
  return order;
}

router.use(requireRole(...STAFF, ...BUYERS));

// Buyers see their own orders; staff (admin and employees) see all, with optional filters.
// status may be a comma-separated list, e.g. status=Placed,Confirmed.
router.get('/', async (req, res) => {
  const { status, paymentStatus, buyerRole, search, from, to } = req.query;
  const q = db('orders as o').join('users as u', 'u.id', 'o.buyer_id').select('o.*').orderBy('o.created_at', 'desc').orderBy('o.id', 'desc');
  if (!isStaff(req.user)) q.where('o.buyer_id', req.user.id);
  else if (buyerRole) q.where('o.buyer_role', buyerRole);
  if (status) q.whereIn('o.status', String(status).split(','));
  if (paymentStatus) q.where('o.payment_status', paymentStatus);
  if (from) q.where('o.created_at', '>=', from);
  if (to) q.where('o.created_at', '<=', `${to} 23:59:59`);
  if (search?.trim()) {
    const like = `%${search.trim()}%`;
    q.where((w) => w.where('o.order_number', LIKE, like).orWhere('o.invoice_number', LIKE, like).orWhere('u.name', LIKE, like).orWhere('u.code', LIKE, like));
  }
  res.json(await withDetails(await q));
});

// Number of orders per status, for menu badges ({ Placed: 3, Confirmed: 1, ... }). Staff only.
router.get('/counts', requireRole(...STAFF), async (_req, res) => {
  const rows = await db('orders').groupBy('status').select('status').count({ n: '*' });
  res.json(Object.fromEntries(rows.map((r) => [r.status, Number(r.n)])));
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

    const [orderId] = await trx('orders').insertGetId({
      order_number: orderNumber,
      invoice_number: orderNumber.replace('ORD', 'INV'),
      buyer_id: req.user.id,
      buyer_role: req.user.role,
      status: 'Placed',
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
    await logEvent(trx, orderId, 'Placed', req.user.id, null, ts);
    return orderId;
  });

  const order = await one(id);
  await notifyRole(STAFF, 'New order', `${req.user.name} placed ${order.orderNumber} for ${rupees(order.total)}`, 'order');
  res.status(201).json(order);
});

// Moves an order one step along the flow. Staff: the next step, or Cancelled until it is dispatched.
// Buyers: only cancel their own order while it is still Placed. An optional note is kept in the timeline.
router.patch('/:id/status', async (req, res) => {
  const { status, note } = req.body ?? {};
  if (!ORDER_STATUSES.includes(status)) throw badRequest('Unknown order status');
  const order = await findOrder(req);
  const staff = isStaff(req.user);
  if (!staff && !(status === 'Cancelled' && order.status === 'Placed')) throw forbidden('Orders can only be cancelled before they are confirmed');
  if (staff && !nextStatuses(order.status).includes(status)) {
    throw badRequest(status === 'Cancelled' && !CANCELLABLE.includes(order.status)
      ? `A ${order.status} order can no longer be cancelled`
      : `A ${order.status} order cannot be changed to ${status}`);
  }

  await db.transaction(async (trx) => {
    const ts = now();
    // Guarded on the old status so two people updating the same order cannot both succeed.
    const changed = await trx('orders').where({ id: order.id, status: order.status }).update({ status, updated_at: ts });
    if (!changed) throw badRequest('This order was just updated by someone else. Refresh and try again.');
    await logEvent(trx, order.id, status, req.user.id, note, ts);
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

  if (staff) {
    const text = status === 'Cancelled' ? 'has been cancelled' : status === 'Delivered' ? 'has been delivered' : `is now ${status}`;
    await notify(order.buyer_id, `Order ${status}`, `Your order ${order.order_number} ${text}${note?.trim() ? ` (${note.trim()})` : ''}`, 'order');
  } else {
    await notifyRole(STAFF, 'Order cancelled', `${req.user.name} cancelled ${order.order_number}`, 'order');
  }
  res.json(await one(order.id));
});

router.patch('/:id/payment', requireRole(...STAFF), async (req, res) => {
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
