import "server-only";
import { Pool } from "pg";

const globalForDb = globalThis as unknown as { postgresPool?: Pool };

export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  if (!globalForDb.postgresPool) {
    globalForDb.postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 10_000,
    });
    globalForDb.postgresPool.on("error", () => console.error("PostgreSQL pool connection failed."));
  }
  return globalForDb.postgresPool;
}
