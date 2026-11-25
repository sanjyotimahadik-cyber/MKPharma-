// Knex config shared by the app (src/db.js) and the knex CLI (npm run db:*).
const env = process.env;

const fromUrl = (url) => {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1) || 'postgres',
  };
};

const postgres = async () => {
  // Return counts (bigint) and decimals as numbers, like the other drivers' callers expect.
  const { default: pg } = await import('pg');
  pg.types.setTypeParser(20, Number);
  pg.types.setTypeParser(1700, parseFloat);
  return {
    client: 'pg',
    connection: {
      ...fromUrl(env.DATABASE_URL),
      // DB_PASSWORD (if set) wins, so a password with #, ? or @ needs no URL encoding.
      ...(env.DB_PASSWORD ? { password: env.DB_PASSWORD } : {}),
      // Hosted Postgres (Supabase, Neon, …) needs TLS; set DB_SSL=false for a local server.
      ssl: env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    },
    pool: { min: 0, max: Number(env.DB_POOL_MAX ?? 10) },
  };
};

const connection =
  env.DB_CLIENT === 'postgres'
    ? await postgres()
    : env.DB_CLIENT === 'mysql'
    ? {
        client: 'mysql2',
        connection: {
          host: env.DB_HOST ?? '127.0.0.1',
          port: Number(env.DB_PORT ?? 3306),
          user: env.DB_USER ?? 'root',
          password: env.DB_PASSWORD ?? '',
          database: env.DB_NAME ?? 'mk_animal_health',
          dateStrings: true,
        },
      }
    : {
        client: 'better-sqlite3',
        connection: { filename: env.SQLITE_FILE ?? 'data/dev.sqlite3' },
        useNullAsDefault: true,
        pool: { afterCreate: (conn, done) => done(null, conn.pragma('foreign_keys = ON')) },
      };

export default {
  ...connection,
  migrations: { directory: './migrations' },
  seeds: { directory: './seeds' },
};
