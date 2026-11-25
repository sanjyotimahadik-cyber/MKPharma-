// Order tracking: the fulfilment flow becomes Placed → Confirmed → Packed → Dispatched → Out for Delivery → Delivered
// (or Cancelled), and every step is logged in order_events with who made it and an optional note.

const RENAME = { Pending: 'Placed', Processing: 'Confirmed', Completed: 'Delivered' };
const BACK = { Placed: 'Pending', Confirmed: 'Processing', Packed: 'Processing', Dispatched: 'Processing', 'Out for Delivery': 'Processing', Delivered: 'Completed' };

export async function up(knex) {
  await knex.schema.createTable('order_events', (t) => {
    t.increments('id');
    t.integer('order_id').unsigned().notNullable().references('orders.id').onDelete('CASCADE').index();
    t.string('status', 20).notNullable(); // the status the order moved to
    t.string('note', 255); // e.g. courier / vehicle, receiver name, cancel reason
    t.integer('user_id').unsigned().references('users.id').onDelete('SET NULL'); // who made the change
    t.string('created_at', 19).notNullable();
  });

  for (const [from, to] of Object.entries(RENAME)) await knex('orders').where({ status: from }).update({ status: to });

  // Existing orders get a minimal history: when they were placed and when they reached their current status.
  const orders = await knex('orders').select('id', 'status', 'buyer_id', 'created_at', 'updated_at');
  const events = orders.flatMap((o) => [
    { order_id: o.id, status: 'Placed', user_id: o.buyer_id, created_at: o.created_at },
    ...(o.status === 'Placed' ? [] : [{ order_id: o.id, status: o.status, user_id: null, created_at: o.updated_at }]),
  ]);
  if (events.length) await knex.batchInsert('order_events', events, 200);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('order_events');
  for (const [from, to] of Object.entries(BACK)) await knex('orders').where({ status: from }).update({ status: to });
}
