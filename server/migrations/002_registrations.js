// Self-registration: a request waits here until an admin approves (creating the user) or rejects it.

export async function up(knex) {
  await knex.schema.createTable('registration_requests', (t) => {
    t.increments('id');
    t.string('role', 20).notNullable(); // requested role: employee | mr | doctor | pharmacy (never admin)
    t.string('name', 150).notNullable();
    t.string('email', 150).notNullable().index();
    t.string('phone', 20).notNullable();
    t.string('password_hash', 255).notNullable(); // copied to the user on approval
    t.text('meta'); // role-specific JSON, same keys as users.meta
    t.string('status', 20).notNullable().defaultTo('Pending').index(); // Pending | Approved | Rejected
    t.string('approved_role', 20); // role actually granted (admin may change it)
    t.text('note'); // admin's reason when rejecting
    t.integer('user_id').unsigned().references('users.id').onDelete('SET NULL'); // created account
    t.integer('reviewed_by').unsigned().references('users.id').onDelete('SET NULL');
    t.string('reviewed_at', 19);
    t.string('created_at', 19).notNullable();
    t.string('updated_at', 19).notNullable();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('registration_requests');
}
