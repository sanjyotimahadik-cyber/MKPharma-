import { Router } from 'express';
import { emailTaken, EMAIL, metaPatch, passwordHash, PHONE, requireMeta, ROLE } from '../accounts.js';
import { authenticate, publicUser, signToken } from '../auth.js';
import db, { now, toJson } from '../db.js';
import { badRequest, HttpError, requireFields } from '../http.js';
import { notifyRole } from '../notify.js';
import { verifyPassword } from '../password.js';

const router = Router();
const INVALID = 'Invalid email or password';

/** Email (or username) + password sign-in. Only Active accounts get a token. */
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  const id = String(email ?? '').trim().toLowerCase();
  if (!id || !password) throw badRequest('Enter your email and password');

  const user = await db('users').whereRaw('lower(email) = ? or lower(username) = ?', [id, id]).first();
  if (user) {
    if (!(await verifyPassword(password, user.password_hash))) throw new HttpError(401, INVALID);
    if (user.status !== 'Active') throw new HttpError(403, 'Your account is inactive. Please contact the administrator.');
    return res.json({ token: signToken(user), user: publicUser(user) });
  }

  // No account yet: explain a pending/rejected registration, but only to someone who knows its password.
  const request = await db('registration_requests').whereRaw('lower(email) = ?', [id]).whereNot({ status: 'Approved' }).orderBy('id', 'desc').first();
  if (request && (await verifyPassword(password, request.password_hash))) {
    if (request.status === 'Pending') throw new HttpError(403, 'Your registration is waiting for admin approval.');
    throw new HttpError(403, `Your registration was rejected${request.note ? ` (${request.note})` : ''}. You can register again.`);
  }
  throw new HttpError(401, INVALID);
});

/** Public sign-up: stores a Pending request for an admin to approve, modify or reject. Admin cannot be requested. */
router.post('/register', async (req, res) => {
  const body = req.body ?? {};
  requireFields(body, ['role', 'name', 'email', 'phone', 'password']);
  const cfg = ROLE[body.role];
  if (!cfg) throw badRequest('Choose a valid role: employee, mr, doctor or pharmacy');

  const name = String(body.name).trim();
  const email = String(body.email).trim().toLowerCase();
  const phone = String(body.phone).replace(/[\s-]/g, '');
  if (!name) throw badRequest('Name is required');
  if (!EMAIL.test(email)) throw badRequest('Enter a valid email address');
  if (!PHONE.test(phone)) throw badRequest('Enter a valid 10-digit mobile number');
  if (await emailTaken(email)) throw badRequest('This email is already registered or waiting for approval');
  const meta = metaPatch(body, cfg.meta);
  requireMeta(meta, cfg.required);

  const ts = now();
  await db('registration_requests').insert({
    role: body.role,
    name: name.slice(0, 150),
    email,
    phone,
    password_hash: await passwordHash(body.password),
    meta: toJson(meta),
    status: 'Pending',
    created_at: ts,
    updated_at: ts,
  });
  await notifyRole('admin', 'New registration request', `${name} registered as ${body.role.toUpperCase()} and is waiting for approval.`, 'registration');
  res.status(201).json({ ok: true, message: 'Registration submitted. You can sign in once an admin approves it.' });
});

router.get('/me', authenticate, (req, res) => res.json(req.user));

export default router;
