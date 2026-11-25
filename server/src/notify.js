import db, { fromJson, now } from './db.js';

/** Admin can switch notification types off in Settings → Notifications ({ order: false, ... }). */
async function enabled(type) {
  const row = await db('settings').where({ key: 'notifications' }).first();
  return fromJson(row?.value, {})[type] !== false;
}

/** Creates an in-app notification for one user. */
export async function notify(userId, title, message, type = 'info') {
  if (!(await enabled(type))) return;
  await db('notifications').insert({ user_id: userId, title, message, type, is_read: false, created_at: now() });
}

/** Notifies every active user with the given role or roles (e.g. 'admin', or ['admin', 'employee']). */
export async function notifyRole(role, title, message, type = 'info') {
  if (!(await enabled(type))) return;
  const ids = await db('users').whereIn('role', [role].flat()).where({ status: 'Active' }).pluck('id');
  if (ids.length) {
    const created_at = now();
    await db('notifications').insert(ids.map((user_id) => ({ user_id, title, message, type, is_read: false, created_at })));
  }
}
