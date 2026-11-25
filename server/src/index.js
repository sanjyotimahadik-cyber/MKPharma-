import app from './app.js';
import { ensureAdmin } from './bootstrap.js';
import db from './db.js';

const port = Number(process.env.PORT ?? 4000);

// Apply pending migrations on start and seed an empty database, so a fresh checkout just works.
await db.migrate.latest();
if (!(await db('users').first())) {
  await db.seed.run();
  console.log('Seeded demo data');
}
await ensureAdmin();
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
