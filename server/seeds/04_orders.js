// Order history for the last 12 months for every doctor and pharmacy, deterministic (seeded PRNG) so resets match.
// Totals follow the billing rules: subtotal + GST + delivery. Product stock is left untouched.
// Each order gets a tracking history (order_events) from Placed up to its current status.
import { now } from '../src/db.js';

const GST_RATE = 12;
const DELIVERY = 50;
const METHODS = ['Cash on Delivery', 'UPI Payment', 'Bank Transfer'];
const DAY = 86400000;
const HOUR = 3600000;
const FLOW = ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered'];
const NOTES = { Dispatched: ['Company van MH-19-AB-4521', 'Company van MH-19-CD-1187', 'Courier: DTDC'], Delivered: ['Received at counter', 'Received by owner', 'Handed to front desk'] };

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
  const staff = await knex('users').whereIn('role', ['admin', 'employee']).where({ status: 'Active' }).orderBy('id').pluck('id');
  const nowMs = Date.now();

  const orders = [];
  for (const b of buyers) {
    const active = b.status === 'Active';
    const pharmacy = b.role === 'pharmacy';
    for (let m = 11; m >= 0; m--) {
      // Inactive accounts only ordered in the older half of the year.
      // The current month is a little busier so the order desk has work in every stage.
      const count = active ? int(m ? 1 : 2, pharmacy ? 4 : 3) + (m ? 0 : 1) : m > 6 ? int(0, 2) : 0;
      for (let k = 0; k < count; k++) {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - m);
        // This month's orders fall in the last nine days, so they are spread across the fulfilment flow.
        date.setDate(m ? int(1, 28) : Math.max(1, new Date().getDate() - int(0, 9)));
        date.setHours(int(9, 18), int(0, 59), int(0, 59));
        if (date.getTime() > nowMs) date.setTime(date.getTime() - DAY);
        const ageDays = (nowMs - date.getTime()) / DAY;

        const items = [...products].sort(() => rand() - 0.5).slice(0, int(1, 4)).map((p) => {
          const qty = pharmacy ? int(5, 25) : int(1, 8);
          return { product_id: p.id, name: p.name, category: p.category, price: p.price, qty, gst_rate: GST_RATE, total: round2(p.price * qty) };
        });

        const r = rand();
        // Older orders are finished; recent ones are further along the flow the older they are.
        const status = ageDays > 10
          ? (r < 0.88 ? 'Delivered' : 'Cancelled')
          : r < 0.08 ? 'Cancelled' : FLOW[Math.min(FLOW.length - 1, Math.floor(ageDays * 0.6 + rand() * 1.2))];
        const reached = status === 'Cancelled' ? int(0, 2) : FLOW.indexOf(status);

        // Steps a few hours apart (delivery the next day or two), never in the future.
        let t = date.getTime();
        const events = [{ status: 'Placed', at: t, by: null }];
        for (const step of FLOW.slice(1, reached + 1)) {
          t = Math.min(nowMs, t + (step === 'Out for Delivery' ? int(12, 30) : int(1, 6)) * HOUR);
          events.push({ status: step, at: t, by: pickOne(staff), note: NOTES[step] && pickOne(NOTES[step]) });
        }
        if (status === 'Cancelled') {
          t = Math.min(nowMs, t + int(1, 12) * HOUR);
          events.push({ status, at: t, by: reached === 0 && rand() < 0.5 ? b.id : pickOne(staff), note: reached ? 'Out of stock at warehouse' : null });
        }

        const paid = status === 'Delivered' ? rand() < (ageDays > 45 ? 0.95 : 0.6) : status !== 'Cancelled' && reached > 0 && rand() < 0.3;
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
            updated_at: now(new Date(Math.max(t, paidAt?.getTime() ?? 0))),
          },
          events,
          items,
          buyer: b,
        });
      }
    }
  }

  orders.sort((a, b) => a.row.created_at.localeCompare(b.row.created_at));
  const history = [];
  for (const [i, { row, events, items, buyer }] of orders.entries()) {
    const number = 1001 + i;
    const [inserted] = await knex('orders').insert({ ...row, order_number: `ORD-${number}`, invoice_number: `INV-${number}` }).returning('id');
    const orderId = inserted?.id ?? inserted;
    await knex('order_items').insert(items.map((it) => ({ ...it, order_id: orderId })));
    history.push(...events.map((e) => ({ order_id: orderId, status: e.status, note: e.note ?? null, user_id: e.by ?? buyer.id, created_at: now(new Date(e.at)) })));
    // Staff get the usual "new order" alert for orders still waiting to be confirmed.
    if (row.status === 'Placed' && staff.length) {
      await knex('notifications').insert(staff.map((user_id) => ({
        user_id, title: 'New order', message: `${buyer.name} placed ORD-${number} for ₹${row.total.toLocaleString('en-IN')}`,
        type: 'order', is_read: false, created_at: row.created_at,
      })));
    }
  }
  await knex.batchInsert('order_events', history, 200);
}
