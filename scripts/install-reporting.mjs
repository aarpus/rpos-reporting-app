import nextEnv from "@next/env";
import { Client } from "pg";
import { readFile } from "node:fs/promises";
import { reportingInstallationSql } from "../src/lib/reporting/installation.ts";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL first.");
const baseSql = reportingInstallationSql(await readFile(new URL("../prisma/migrations/20261012000000_store_reporting/migration.sql", import.meta.url), "utf8"));
const namingSql = await readFile(new URL("../prisma/migrations/20261013000000_store_code_schema_names/migration.sql", import.meta.url), "utf8");
const sql = baseSql + "\n" + namingSql;
const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
await db.connect();
try {
  await db.query("BEGIN");
  await db.query("SELECT pg_advisory_xact_lock(hashtext('reporting-installation'))");
  const prerequisites = await db.query(`SELECT to_regclass('public.stores') IS NOT NULL
    AND to_regclass('public.customers') IS NOT NULL
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'customer_id') AS ready`);
  if (!prerequisites.rows[0].ready) throw new Error("Apply the Prisma schema or tracked migrations before installing reporting functions.");
  await db.query(sql);
  await db.query("COMMIT");
  console.log("Store reporting provisioning function installed. Existing data and schema mappings preserved.");
} catch (error) {
  await db.query("ROLLBACK");
  console.error(error.message);
  process.exitCode = 1;
} finally { await db.end(); }
