import { Router } from 'express';
import { requireRole } from '../auth.js';
import db, { bool, today } from '../db.js';
import { withDetails } from './orders.js';
import { serializeProduct } from './products.js';

const router = Router();
router.use(requireRole('admin'));

/** % change from prev to cur, one decimal; null when there is nothing to compare against. */
const change = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);
const sum = (rows, pick = (r) => Number(r.total)) => Math.round(rows.reduce((s, r) => s + pick(r), 0) * 100) / 100;

// Admin dashboard: KPIs with month-over-month trends, charts, recent orders, low stock, notifications.
router.get('/', async (req, res) => {
  const thisMonth = today().slice(0, 7);
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  const lastMonth = today(d).slice(0, 7);
  const thisYear = thisMonth.slice(0, 4);
  const year = /^\d{4}$/.test(req.query.year ?? '') ? req.query.year : thisYear;

  // Order volumes are small enough to aggregate in JS, which keeps the SQL portable across SQLite and MySQL.
  const [orders, items, doctors, recent, lowStock, notifications, unread] = await Promise.all([
    db('orders').whereNot({ status: 'Cancelled' }).select('created_at', 'total', 'payment_status', 'paid_at'),
    db('order_items as i').join('orders as o', 'o.id', 'i.order_id').whereNot('o.status', 'Cancelled')
      .where('o.created_at', 'like', `${year}%`).select('i.category', 'i.total'),
    db('users').where({ role: 'doctor', status: 'Active' }).select('created_at'),
    db('orders').orderBy('created_at', 'desc').orderBy('id', 'desc').limit(5),
    db('products').where({ status: 'Active' }).where('stock', '<=', db.ref('reorder_level')).orderBy('stock'),
    db('notifications').where({ user_id: req.user.id }).orderBy('created_at', 'desc').orderBy('id', 'desc').limit(6),
    db('notifications').where({ user_id: req.user.id, is_read: false }).count({ n: '*' }).first(),
  ]);

  const inMonth = (prefix) => orders.filter((o) => o.created_at.startsWith(prefix));
  const paid = orders.filter((o) => o.payment_status === 'Paid');
  const paidIn = (prefix) => paid.filter((o) => o.paid_at?.startsWith(prefix));
  const doctorsBefore = doctors.filter((u) => u.created_at < `${thisMonth}-01`).length;

  const byCategory = {};
  for (const i of items) byCategory[i.category ?? 'Other'] = (byCategory[i.category ?? 'Other'] ?? 0) + Number(i.total);

  res.json({
    year: Number(year),
    years: [...new Set([thisYear, ...orders.map((o) => o.created_at.slice(0, 4))])].sort().reverse().map(Number),
    kpis: {
      sales: { value: sum(inMonth(thisYear)), change: change(sum(inMonth(thisMonth)), sum(inMonth(lastMonth))) },
      orders: { value: inMonth(thisYear).length, change: change(inMonth(thisMonth).length, inMonth(lastMonth).length) },
      doctors: { value: doctors.length, change: change(doctors.length, doctorsBefore) },
      revenue: { value: sum(paidIn(thisYear)), change: change(sum(paidIn(thisMonth)), sum(paidIn(lastMonth))) },
    },
    monthlySales: Array.from({ length: 12 }, (_, m) => sum(inMonth(`${year}-${String(m + 1).padStart(2, '0')}`))),
    categories: Object.entries(byCategory)
      .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total),
    recentOrders: await withDetails(recent),
    lowStock: lowStock.map(serializeProduct),
    notifications: {
      unread: Number(unread?.n ?? 0),
      items: notifications.map((n) => ({ id: n.id, title: n.title, message: n.message, type: n.type, isRead: bool(n.is_read), createdAt: n.created_at })),
    },
  });
});

export default router;
