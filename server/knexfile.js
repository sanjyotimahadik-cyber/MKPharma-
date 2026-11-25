// Knex config shared by the app (src/db.js) and the knex CLI (npm run db:*).
const env = process.env;

const connection =
  env.DB_CLIENT === 'mysql'
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
