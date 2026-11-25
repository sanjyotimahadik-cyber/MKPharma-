import { Router } from 'express';
import { requireRole } from '../auth.js';
import db, { fromJson, now, toJson } from '../db.js';
import { badRequest } from '../http.js';

const router = Router();

/** Defaults for every allowed key; stored values are merged over these. */
export const DEFAULTS = {
  company: { name: '', tagline: '', gstNumber: '', dlNumber: '', panNumber: '', email: '', phone: '', address: '' },
  billing: { gstRate: 12, deliveryCharge: 50, currency: '₹' },
  inventory: { lowStockLevel: 40 },
  // Admin alert switches, keyed by the notification type passed to notify()/notifyRole().
  notifications: { order: true, payment: true, leave: true, stock: true, registration: true },
  preferences: {},
};

const num = (v, label, min, max) => {
  const n = Number(v);
  if (v === '' || v == null || !Number.isFinite(n) || n < min || n > max) throw badRequest(`${label} must be a number between ${min} and ${max}`);
  return n;
};

// Each validator receives the merged (current + incoming) value and returns the value to store.
const VALIDATE = {
  company(v) {
    const c = Object.fromEntries(Object.keys(DEFAULTS.company).map((k) => [k, String(v[k] ?? '').trim().slice(0, 255)]));
    if (!c.name) throw badRequest('Company name is required');
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) throw badRequest('Enter a valid company email');
    c.gstNumber = c.gstNumber.toUpperCase();
    c.panNumber = c.panNumber.toUpperCase();
    if (c.gstNumber && !/^[0-9A-Z]{15}$/.test(c.gstNumber)) throw badRequest('GST number must be 15 letters/digits');
    if (c.panNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(c.panNumber)) throw badRequest('Enter a valid PAN number (e.g. ABCDE1234F)');
    return c;
  },
  billing: (v) => ({
    gstRate: num(v.gstRate, 'GST rate', 0, 28),
    deliveryCharge: num(v.deliveryCharge, 'Delivery charge', 0, 100000),
    currency: String(v.currency ?? '').trim().slice(0, 5) || '₹',
  }),
  inventory: (v) => ({ lowStockLevel: Math.round(num(v.lowStockLevel, 'Low stock level', 0, 100000)) }),
  notifications: (v) => Object.fromEntries(Object.keys(DEFAULTS.notifications).map((k) => [k, Boolean(v[k])])),
  preferences(v) {
    if (Object.values(v).some((x) => x !== null && typeof x === 'object')) throw badRequest('Preferences must be simple values');
    if (JSON.stringify(v).length > 2000) throw badRequest('Preferences are too large');
    return v;
  },
};

/** All settings as { key: value }, defaults merged in. Other routes can import this. */
export async function getSettings() {
  const rows = await db('settings').select('key', 'value');
  const stored = Object.fromEntries(rows.map((r) => [r.key, fromJson(r.value, {})]));
  return Object.fromEntries(
    [...new Set([...Object.keys(DEFAULTS), ...Object.keys(stored)])].map((k) => [k, { ...DEFAULTS[k], ...stored[k] }]),
  );
}

router.get('/', async (_req, res) => res.json(await getSettings()));

router.put('/:key', requireRole('admin'), async (req, res) => {
  const { key } = req.params;
  if (!VALIDATE[key]) throw badRequest(`Unknown setting: ${key}`);
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badRequest('Send the setting values as an object');
  const current = (await getSettings())[key];
  const value = VALIDATE[key]({ ...current, ...body });
  await db('settings').insert({ key, value: toJson(value), updated_at: now() }).onConflict('key').merge();
  res.json(value);
});

export default router;
