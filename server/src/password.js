import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

/** Hashes a password as 'scrypt$<salt hex>$<hash hex>'. */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(String(password), salt, 64);
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

/** Constant-time check of a password against a stored hash (false for missing/unknown formats). */
export async function verifyPassword(password, stored) {
  const [scheme, salt, hex] = String(stored ?? '').split('$');
  if (scheme !== 'scrypt' || !salt || !hex) return false;
  const expected = Buffer.from(hex, 'hex');
  const actual = await scryptAsync(String(password ?? ''), salt, expected.length);
  return timingSafeEqual(actual, expected);
}
