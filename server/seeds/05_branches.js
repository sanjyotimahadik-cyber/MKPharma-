// Company branches shown on Admin > Inventory > Branch Management.
import { now } from '../src/db.js';

const BRANCHES = [
  { code: 'BR-PUN', name: 'Pune Central Depot', city: 'Pune', manager: 'Sanjay More', phone: '+91 98231 11223', capacity: 15000 },
  { code: 'BR-JLG', name: 'Jalgaon Regional Hub', city: 'Jalgaon', manager: 'Ramesh Patil', phone: '+91 94222 33445', capacity: 12000 },
  { code: 'BR-NSK', name: 'Nashik Logistics Hub', city: 'Nashik', manager: 'Vikram Joshi', phone: '+91 97654 55667', capacity: 10000 },
  { code: 'BR-KLP', name: 'Kolhapur Distribution Point', city: 'Kolhapur', manager: 'Anand Shinde', phone: '+91 98901 77889', capacity: 8000 },
];

export async function seed(knex) {
  const ts = now();
  await knex('branches').insert(BRANCHES.map((b) => ({ ...b, status: 'Active', created_at: ts, updated_at: ts })));
}
