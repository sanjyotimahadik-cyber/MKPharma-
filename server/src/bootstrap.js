import { passwordHash } from './accounts.js';
import db, { now, toJson } from './db.js';
import { nextCode } from './http.js';

/**
 * Admin accounts are never self-registered. On start, ADMIN_EMAIL + ADMIN_PASSWORD (server/.env) make sure an
 * admin with that email exists and can sign in. An existing password is left alone, so a password changed in
 * Settings survives restarts. Further admins can be added directly in the database.
 */
export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (email && password) {
    const user = await db('users').whereRaw('lower(email) = ?', [email]).first();
    const ts = now();
    if (!user) {
      await db('users').insert({
        code: await nextCode(db('users'), 'code', 'ADM'),
        role: 'admin',
        name: process.env.ADMIN_NAME?.trim() || 'Administrator',
        email,
        password_hash: await passwordHash(password),
        status: 'Active',
        meta: toJson({ designation: 'System Admin' }),
        created_at: ts,
        updated_at: ts,
      });
      console.log(`Created admin account ${email}`);
    } else if (user.role !== 'admin') {
      console.warn(`ADMIN_EMAIL ${email} belongs to a ${user.role} account; no admin was created`);
    } else if (!user.password_hash || user.status !== 'Active') {
      await db('users').where({ id: user.id }).update({
        password_hash: user.password_hash ?? (await passwordHash(password)),
        status: 'Active',
        updated_at: ts,
      });
    }
  }

  const ready = await db('users').where({ role: 'admin', status: 'Active' }).whereNotNull('password_hash').first('id');
  if (!ready) console.warn('No admin can sign in yet. Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env and restart.');
}
