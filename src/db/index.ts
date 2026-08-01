import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzle?: NodePgDatabase;
};

function getDb(): NodePgDatabase {
  if (globalForDb.__arenaNextJsDrizzle) {
    return globalForDb.__arenaNextJsDrizzle;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
    });

  globalForDb.__arenaNextJsPostgresqlPool = pool;

  const database = drizzle(pool);
  globalForDb.__arenaNextJsDrizzle = database;

  return database;
}

// Lazily initialise the connection so that merely importing this module does
// not require DATABASE_URL. The error is only raised when the database is
// actually used at runtime, which keeps `next build` (page-data collection)
// working when the variable is not present in the build environment.
export const db = new Proxy({} as NodePgDatabase, {
  get(_target, prop, receiver) {
    const database = getDb();
    const value = Reflect.get(database, prop, receiver);
    return typeof value === "function" ? value.bind(database) : value;
  },
});

export const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    getDb();
    const currentPool = globalForDb.__arenaNextJsPostgresqlPool!;
    const value = Reflect.get(currentPool, prop, receiver);
    return typeof value === "function" ? value.bind(currentPool) : value;
  },
});
