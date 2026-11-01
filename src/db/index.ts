import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "./schema";

/**
 * DATABASE_URL must be provided at runtime (Vercel → Project → Settings →
 * Environment Variables). We intentionally do NOT throw at import time:
 * `next build` imports every route handler module while collecting page data,
 * so throwing here would make the Vercel build fail before it ever runs.
 * Instead we warn loudly and let the first real query surface a clear error.
 */
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "[db] DATABASE_URL is not set. The build will continue, but every database " +
      "request will fail until you configure DATABASE_URL in your environment."
  );
}

/**
 * Managed Postgres providers used on Vercel (Neon, Supabase, Vercel Postgres,
 * Railway, Render) require TLS. Local dev does not. Detect and adapt so the
 * same code works in both places without extra config.
 */
function buildPoolConfig(connectionString: string): PoolConfig {
  const isLocal =
    /@(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(connectionString) ||
    connectionString.includes("@localhost") ||
    connectionString.includes("@127.0.0.1");

  return {
    connectionString,
    // Serverless functions are short-lived; keep the pool small so we don't
    // exhaust the database's connection limit across concurrent invocations.
    max: Number(process.env.PGPOOL_MAX ?? 5),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    ssl: isLocal
      ? undefined
      : {
          rejectUnauthorized: false,
        },
  };
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool(
    buildPoolConfig(
      databaseUrl || "postgresql://user:pass@127.0.0.1:5432/placeholder"
    )
  );

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool, { schema });
