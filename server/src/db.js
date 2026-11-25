import knex from 'knex';
import config from '../knexfile.js';

// insertGetId(row) inserts one row and resolves to [newId] on every driver:
// Postgres only returns the id with RETURNING, SQLite and MySQL return it directly.
knex.QueryBuilder.extend('insertGetId', function (row) {
  const q = this.insert(row);
  return this.client.config.client === 'mysql2' ? q : q.returning('id').queryContext({ insertId: true });
});

const db = knex({
  ...config,
  postProcessResponse: (res, ctx) => (ctx?.insertId ? res.map((r) => r?.id ?? r) : res),
});
export default db;

/** Case-insensitive LIKE for search boxes (Postgres LIKE is case-sensitive). */
export const LIKE = config.client === 'pg' ? 'ilike' : 'like';

/** 'YYYY-MM-DD HH:MM:SS' in local time. Use for every timestamp column (portable across SQLite, MySQL and Postgres). */
export const now = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/** 'YYYY-MM-DD' in local time. Use for date-only columns. */
export const today = (d = new Date()) => now(d).slice(0, 10);

/** JSON columns come back as strings from SQLite and as objects from MySQL. */
export const fromJson = (v, fallback = null) => {
  if (v == null) return fallback;
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};
export const toJson = (v) => (v == null ? null : JSON.stringify(v));

/** Booleans come back as 0/1 from both drivers. */
export const bool = (v) => Boolean(Number(v));
