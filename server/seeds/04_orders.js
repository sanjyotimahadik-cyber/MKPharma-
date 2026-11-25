// Order history for the last 12 months for every doctor and pharmacy, deterministic (seeded PRNG) so resets match.
// Totals follow the billing rules: subtotal + GST + delivery. Product stock is left untouched.
import { now } from '../src/db.js';

const GST_RATE = 12;
const DELIVERY = 50;
const METHODS = ['Cash on Delivery', 'UPI Payment', 'Bank Transfer'];
const DAY = 86400000;

/** mulberry32: tiny deterministic PRNG returning [0, 1). */
function prng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function seed(knex) {
  const rand = prng(20260401);
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
  const pickOne = (arr) => arr[Math.floor(rand() * arr.length)];
  const round2 = (n) => Math.round(n * 100) / 100;

  const buyers = await knex('users').whereIn('role', ['doctor', 'pharmacy']).orderBy('id');
  const products = await knex('products').orderBy('id');
  const admins = await knex('users').where({ role: 'admin', status: 'Active' }).pluck('id');
  const nowMs = Date.now();

  const orders = [];
  for (const b of buyers) {
    const active = b.status === 'Active';
    const pharmacy = b.role === 'pharmacy';
    for (let m = 11; m >= 0; m--) {
      // Inactive accounts only ordered in the older half of the year.
      const count = active ? int(1, pharmacy ? 4 : 3) : m > 6 ? int(0, 2) : 0;
      for (let k = 0; k < count; k++) {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - m);
        date.setDate(int(1, m ? 28 : new Date().getDate()));
        date.setHours(int(9, 18), int(0, 59), int(0, 59));
        if (date.getTime() > nowMs) date.setTime(date.getTime() - DAY);
        const ageDays = (nowMs - date.getTime()) / DAY;

        const items = [...products].sort(() => rand() - 0.5).slice(0, int(1, 4)).map((p) => {
          const qty = pharmacy ? int(5, 25) : int(1, 8);
          return { product_id: p.id, name: p.name, category: p.category, price: p.price, qty, gst_rate: GST_RATE, total: round2(p.price * qty) };
        });

        const r = rand();
        const status = ageDays > 20
          ? (r < 0.88 ? 'Completed' : 'Cancelled')
          : (r < 0.35 ? 'Pending' : r < 0.7 ? 'Processing' : r < 0.92 ? 'Completed' : 'Cancelled');
        const paid = status === 'Completed' ? rand() < (ageDays > 45 ? 0.95 : 0.6) : status === 'Processing' && rand() < 0.3;
        const paidAt = paid ? new Date(Math.min(nowMs, date.getTime() + int(0, 7) * DAY)) : null;

        const subtotal = round2(items.reduce((s, i) => s + i.total, 0));
        const gst = round2((subtotal * GST_RATE) / 100);
        orders.push({
          row: {
            buyer_id: b.id,
            buyer_role: b.role,
            status,
            payment_method: pickOne(METHODS),
            payment_status: paid ? 'Paid' : 'Unpaid',
            subtotal,
            gst,
            delivery: DELIVERY,
            total: round2(subtotal + gst + DELIVERY),
            paid_at: paidAt && now(paidAt),
            created_at: now(date),
            updated_at: now(paidAt ?? date),
          },
          items,
          buyer: b,
        });
      }
    }
  }

  orders.sort((a, b) => a.row.created_at.localeCompare(b.row.created_at));
  for (const [i, { row, items, buyer }] of orders.entries()) {
    const number = 1001 + i;
    const [orderId] = await knex('orders').insert({ ...row, order_number: `ORD-${number}`, invoice_number: `INV-${number}` });
    await knex('order_items').insert(items.map((it) => ({ ...it, order_id: orderId })));
    // Admins get the usual "new order" alert for orders still waiting to be processed.
    if (row.status === 'Pending' && admins.length) {
      await knex('notifications').insert(admins.map((user_id) => ({
        user_id, title: 'New order', message: `${buyer.name} placed ORD-${number} for ₹${row.total.toLocaleString('en-IN')}`,
        type: 'order', is_read: false, created_at: row.created_at,
      })));
    }
  }
}
