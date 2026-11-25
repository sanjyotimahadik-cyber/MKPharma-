import jwt from 'jsonwebtoken';
import db, { fromJson } from './db.js';
import { HttpError } from './http.js';

export const ROLES = ['admin', 'mr', 'doctor', 'pharmacy', 'employee'];
const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '7d' });

/** Public shape of a user row: never exposes password_hash, parses meta JSON. */
export const publicUser = ({ password_hash: _omit, meta, ...u }) => ({ ...u, meta: fromJson(meta, {}) });

/**
 * Verifies the Bearer token and loads the user into req.user.
 * Every data route scopes by req.user.id, so multiple users per role work without changes.
 */
export async function authenticate(req, _res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) return next(new HttpError(401, 'Not signed in'));
  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    return next(new HttpError(401, 'Session expired, please sign in again'));
  }
  const user = await db('users').where({ id: payload.sub }).first();
  if (!user || user.status !== 'Active') return next(new HttpError(401, 'Account not available'));
  req.user = publicUser(user);
  next();
}

/** Restricts a route to the given roles. */
export const requireRole =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'You do not have access to this resource'));
