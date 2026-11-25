// Core schema, modelled on Database/*.sql but trimmed to what the app uses.
// Conventions: timestamps are 'YYYY-MM-DD HH:MM:SS' strings (db.now()), dates are 'YYYY-MM-DD',
// JSON is stored as text (db.toJson / db.fromJson). Every row that belongs to someone has a user FK,
// so data stays separated when several users share a role.

const stamps = (t) => {
  t.string('created_at', 19).notNullable();
  t.string('updated_at', 19).notNullable();
};

export async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id');
    t.string('code', 20).notNullable().unique(); // EMP001, MR001, DOC001, PH001, ADM001
    t.string('role', 20).notNullable().index(); // admin | mr | doctor | pharmacy | employee
    t.string('username', 50).unique(); // login name, optional until real login lands
    t.string('password_hash', 255);
    t.string('name', 150).notNullable();
    t.string('email', 150);
    t.string('phone', 20);
    t.string('status', 20).notNullable().defaultTo('Active'); // Active | Inactive
    t.integer('assigned_mr_id').unsigned().references('users.id').onDelete('SET NULL'); // doctors & pharmacies
    t.text('meta'); // role-specific JSON: department, designation, area, specialization, hospital, owner, location...
    stamps(t);
  });

  await knex.schema.createTable('settings', (t) => {
    t.string('key', 100).primary();
    t.text('value'); // JSON
    t.string('updated_at', 19).notNullable();
  });

  await knex.schema.createTable('branches', (t) => {
    t.increments('id');
    t.string('code', 20).notNullable().unique();
    t.string('name', 150).notNullable();
    t.string('city', 100);
    t.string('manager', 150);
    t.string('phone', 20);
    t.integer('capacity').notNullable().defaultTo(0);
    t.string('status', 20).notNullable().defaultTo('Active');
    stamps(t);
  });

  await knex.schema.createTable('products', (t) => {
    t.increments('id');
    t.string('code', 30).notNullable().unique();
    t.string('name', 150).notNullable();
    t.string('category', 60).notNullable().index();
    t.decimal('price', 10, 2).notNullable();
    t.decimal('mrp', 10, 2);
    t.decimal('gst_rate', 5, 2).notNullable().defaultTo(12);
    t.integer('stock').notNullable().defaultTo(0);
    t.integer('reorder_level').notNullable().defaultTo(40);
    t.string('expiry', 10);
    t.text('description');
    t.text('benefits'); // JSON string[]
    t.text('composition'); // JSON string[]
    t.text('indications'); // JSON string[]
    t.string('dosage', 255);
    t.text('images'); // JSON string[] of URLs (/assets/... or /uploads/...)
    t.string('status', 20).notNullable().defaultTo('Active');
    stamps(t);
  });

  await knex.schema.createTable('stock_transactions', (t) => {
    t.increments('id');
    t.integer('product_id').unsigned().notNullable().references('products.id').onDelete('CASCADE');
    t.integer('user_id').unsigned().references('users.id').onDelete('SET NULL');
    t.string('type', 20).notNullable(); // PURCHASE | SALE | ADJUSTMENT | RETURN | DAMAGE | EXPIRY
    t.integer('quantity').notNullable(); // signed change
    t.integer('previous_quantity').notNullable();
    t.integer('new_quantity').notNullable();
    t.string('reason', 255);
    t.string('created_at', 19).notNullable().index();
  });

  await knex.schema.createTable('orders', (t) => {
    t.increments('id');
    t.string('order_number', 30).notNullable().unique();
    t.integer('buyer_id').unsigned().notNullable().references('users.id').index();
    t.string('buyer_role', 20).notNullable(); // doctor | pharmacy
    t.string('status', 20).notNullable().defaultTo('Pending'); // Pending | Processing | Completed | Cancelled
    t.string('payment_method', 40);
    t.string('payment_status', 20).notNullable().defaultTo('Unpaid'); // Unpaid | Paid
    t.string('invoice_number', 30).unique();
    t.decimal('subtotal', 12, 2).notNullable().defaultTo(0);
    t.decimal('gst', 12, 2).notNullable().defaultTo(0);
    t.decimal('delivery', 12, 2).notNullable().defaultTo(0);
    t.decimal('total', 12, 2).notNullable().defaultTo(0);
    t.text('notes');
    t.string('paid_at', 19);
    t.string('created_at', 19).notNullable().index();
    t.string('updated_at', 19).notNullable();
  });

  await knex.schema.createTable('order_items', (t) => {
    t.increments('id');
    t.integer('order_id').unsigned().notNullable().references('orders.id').onDelete('CASCADE');
    t.integer('product_id').unsigned().references('products.id').onDelete('SET NULL');
    t.string('name', 150).notNullable(); // snapshot at order time
    t.string('category', 60);
    t.decimal('price', 10, 2).notNullable();
    t.integer('qty').notNullable();
    t.decimal('gst_rate', 5, 2).notNullable().defaultTo(12);
    t.decimal('total', 12, 2).notNullable();
  });

  await knex.schema.createTable('targets', (t) => {
    t.increments('id');
    t.string('code', 20).notNullable().unique(); // TG001
    t.string('name', 150).notNullable();
    t.string('type', 20).notNullable(); // Doctors | Pharmacy | MR Team
    t.integer('assignee_id').unsigned().references('users.id').onDelete('CASCADE'); // null = whole group
    t.string('metric', 20).notNullable().defaultTo('sales'); // sales (₹ of orders) | visits (MR visits)
    t.decimal('target_value', 14, 2).notNullable();
    t.string('start_date', 10).notNullable();
    t.string('end_date', 10).notNullable();
    t.string('status', 20).notNullable().defaultTo('active'); // active | closed
    t.text('description');
    t.integer('created_by').unsigned().references('users.id').onDelete('SET NULL');
    stamps(t);
  });

  await knex.schema.createTable('attendance', (t) => {
    t.increments('id');
    t.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE');
    t.string('date', 10).notNullable();
    t.string('check_in', 19);
    t.string('check_out', 19);
    t.string('status', 20).notNullable(); // Present | Late | Absent | Leave | Half Day
    t.decimal('latitude', 10, 7);
    t.decimal('longitude', 10, 7);
    t.string('created_at', 19).notNullable();
    t.unique(['user_id', 'date']);
  });

  await knex.schema.createTable('leave_requests', (t) => {
    t.increments('id');
    t.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE');
    t.string('from_date', 10).notNullable();
    t.string('to_date', 10).notNullable();
    t.string('type', 30).notNullable().defaultTo('Casual');
    t.text('reason');
    t.string('status', 20).notNullable().defaultTo('Pending'); // Pending | Approved | Rejected
    t.integer('reviewed_by').unsigned().references('users.id').onDelete('SET NULL');
    stamps(t);
  });

  await knex.schema.createTable('mr_visits', (t) => {
    t.increments('id');
    t.integer('mr_id').unsigned().notNullable().references('users.id').onDelete('CASCADE');
    t.integer('doctor_id').unsigned().notNullable().references('users.id').onDelete('CASCADE');
    t.string('visit_date', 10).notNullable().index();
    t.string('visited_at', 19);
    t.string('status', 20).notNullable().defaultTo('Completed'); // Planned | Completed | Cancelled
    t.text('notes');
    t.text('products'); // free text of products discussed
    t.boolean('sample_given').notNullable().defaultTo(false);
    t.boolean('order_taken').notNullable().defaultTo(false);
    t.decimal('latitude', 10, 7);
    t.decimal('longitude', 10, 7);
    t.decimal('accuracy', 10, 2);
    stamps(t);
  });

  await knex.schema.createTable('notifications', (t) => {
    t.increments('id');
    t.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE').index();
    t.string('title', 200).notNullable();
    t.text('message').notNullable();
    t.string('type', 40);
    t.boolean('is_read').notNullable().defaultTo(false);
    t.string('created_at', 19).notNullable();
  });
}

export async function down(knex) {
  for (const table of [
    'notifications', 'mr_visits', 'leave_requests', 'attendance', 'targets', 'order_items', 'orders',
    'stock_transactions', 'products', 'branches', 'settings', 'users',
  ]) {
    await knex.schema.dropTableIfExists(table);
  }
}
