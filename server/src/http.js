// Small helpers shared by route modules.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg) => new HttpError(400, msg);
export const notFound = (what = 'Record') => new HttpError(404, `${what} not found`);
export const forbidden = (msg = 'Not allowed') => new HttpError(403, msg);

/** Throws 400 listing any missing required fields in body. */
export function requireFields(body, fields) {
  const missing = fields.filter((f) => body?.[f] == null || body[f] === '');
  if (missing.length) throw badRequest(`Missing required field(s): ${missing.join(', ')}`);
}

/** Copies only the allowed keys present in body. */
export const pick = (body, keys) => Object.fromEntries(keys.filter((k) => body?.[k] !== undefined).map((k) => [k, body[k]]));

/** Next sequential code like EMP004 / ORD-1005 from the highest existing one. */
export async function nextCode(query, column, prefix, width = 3) {
  const rows = await query.clone().where(column, 'like', `${prefix}%`).pluck(column);
  const max = rows.reduce((m, c) => Math.max(m, Number(String(c).slice(prefix.length)) || 0), 0);
  return prefix + String(max + 1).padStart(width, '0');
}
