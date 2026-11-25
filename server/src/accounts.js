// Account rules shared by User Management (routes/users.js), self-registration (routes/auth.js)
// and registration review (routes/registrations.js).
import db from './db.js';
import { badRequest, pick } from './http.js';
import { hashPassword } from './password.js';

/**
 * Roles that can be created by an admin or requested at registration: code prefix, meta keys and which are required.
 * Admin is deliberately absent: admin accounts come from ADMIN_EMAIL/ADMIN_PASSWORD (see bootstrap.js) or the database.
 */
export const ROLE = {
  employee: { prefix: 'EMP', meta: ['department', 'designation', 'branch'], required: ['department', 'designation'] },
  mr: { prefix: 'MR', meta: ['area'], required: ['area'] },
  doctor: { prefix: 'DOC', meta: ['specialization', 'hospital', 'area'], required: ['specialization', 'hospital'] },
  pharmacy: { prefix: 'PH', meta: ['owner', 'location'], required: ['owner', 'location'] },
};
export const BUYERS = ['doctor', 'pharmacy'];
export const PHONE = /^[6-9]\d{9}$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Meta keys from body or body.meta, trimmed. */
export const metaPatch = (body, keys) =>
  Object.fromEntries(Object.entries({ ...pick(body, keys), ...pick(body?.meta, keys) }).map(([k, v]) => [k, String(v ?? '').trim()]));

export function requireMeta(meta, keys) {
  const missing = keys.filter((k) => !meta[k]);
  if (missing.length) throw badRequest(`Missing required field(s): ${missing.join(', ')}`);
}

export async function passwordHash(pw) {
  if (String(pw ?? '').length < 6) throw badRequest('Password must be at least 6 characters');
  return hashPassword(pw);
}

/** Validated assigned MR id for a doctor/pharmacy, or null. */
export async function mrId(value) {
  if (value == null || value === '') return null;
  const mr = await db('users').where({ id: value, role: 'mr' }).first('id');
  if (!mr) throw badRequest('Assigned MR not found');
  return mr.id;
}

/** True when the email belongs to a user or to a registration still waiting for review. */
export async function emailTaken(email, { exceptRequestId = 0 } = {}) {
  const e = String(email).toLowerCase();
  const [user, request] = await Promise.all([
    db('users').whereRaw('lower(email) = ? or lower(username) = ?', [e, e]).first('id'),
    db('registration_requests').whereRaw('lower(email) = ?', [e]).where({ status: 'Pending' }).whereNot('id', exceptRequestId).first('id'),
  ]);
  return Boolean(user || request);
}
