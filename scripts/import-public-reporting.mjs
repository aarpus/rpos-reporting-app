import nextEnv from "@next/env";
import { Client } from "pg";
import { readLegacySnapshots } from "../src/lib/reporting/legacy-import.ts";
import { syncOrderSnapshot } from "../src/lib/reporting/sync.ts";

// Explicit, non-destructive import: originals stay in public; retries are idempotent.
nextEnv.loadEnvConfig(process.cwd());
const storeCode = process.argv[2]?.trim().toUpperCase();
if (!storeCode || storeCode.length > 64 || !process.env.DATABASE_URL) throw new Error("Usage: npm run reporting:import-public -- STORE_CODE (requires DATABASE_URL)");
const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
await db.connect();
try {
  const result = await db.query(`SELECT s.timezone, r.schema_name FROM public.stores s
    JOIN public.store_reporting_schemas r ON r.store_code = s.store_code
    WHERE s.store_code = $1 AND s.active AND r.reporting_version = 1`, [storeCode]);
  const registry = result.rows[0];
  if (!registry) throw new Error("Provision the reporting schema for this store first.");
  // Read a consistent source snapshot before writing store data. No source rows are changed.
  await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const snapshots = await readLegacySnapshots(db, storeCode, registry.timezone);
  await db.query("COMMIT");
  let count = 0;
  for (const snapshot of snapshots) {
    await syncOrderSnapshot(db, { schemaName: registry.schema_name, storeCode }, snapshot);
    count++;
  }
  console.log(`Processed ${count} orders; public source tables are unchanged. Local timestamps used ${registry.timezone}.`);
} catch (error) {
  await db.query("ROLLBACK");
  console.error(error.message);
  process.exitCode = 1;
} finally { await db.end(); }
