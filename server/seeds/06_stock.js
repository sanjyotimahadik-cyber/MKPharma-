// Stock movement history for the first products over the past months.
// Built backwards from each product's current stock so products.stock stays unchanged.
import { now } from '../src/db.js';

// [type, signed quantity, reason, months ago], newest first; an opening purchase covers the rest.
const MOVES = [
  ['ADJUSTMENT', -8, 'Damaged in transit', 1],
  ['PURCHASE', 60, 'Supplier restock', 2],
  ['ADJUSTMENT', -15, 'Transferred to Nashik hub', 4],
];

export async function seed(knex) {
  const { id: adminId } = await knex('users').where({ role: 'admin' }).orderBy('id').first('id');
  const products = await knex('products').orderBy('id').limit(8).select('id', 'stock');
  const rows = [];
  products.forEach((p, n) => {
    const at = (monthsAgo) => {
      const d = new Date();
      d.setMonth(d.getMonth() - monthsAgo, 3 + n * 3);
      return now(d);
    };
    let qty = Number(p.stock);
    for (const [type, q, reason, monthsAgo] of MOVES) {
      if (qty - q < 0) continue; // skip moves that would need negative stock earlier
      rows.push({ product_id: p.id, user_id: adminId, type, quantity: q, previous_quantity: qty - q, new_quantity: qty, reason, created_at: at(monthsAgo) });
      qty -= q;
    }
    if (qty > 0) rows.push({ product_id: p.id, user_id: adminId, type: 'PURCHASE', quantity: qty, previous_quantity: 0, new_quantity: qty, reason: 'Opening stock received', created_at: at(6) });
  });
  await knex.batchInsert('stock_transactions', rows, 50);
}
