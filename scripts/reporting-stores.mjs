import nextEnv from "@next/env";
import { readFile } from "node:fs/promises";
import { Client } from "pg";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL first.");
const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
await db.connect();
try {
  const [command, argument] = process.argv.slice(2);
  async function provision(storeCode, storeType) {
    const folder = storeType === "RETAIL" ? "retail" : "restaurant";
    let ddl;
    try {
      ddl = await readFile(new URL(`../database/reporting/${folder}/001-tables.sql`, import.meta.url), "utf8");
    } catch (error) {
      if (error.code === "ENOENT" && storeType === "RETAIL") {
        throw new Error("Retail reporting tables are not available yet.");
      }
      throw error;
    }
    if (!/create\s+table/i.test(ddl)) throw new Error(`${storeType} reporting tables are not available yet.`);
    return db.query("SELECT public.provision_store_reporting($1, $2) AS schema_name", [storeCode, ddl]);
  }
  if (command === "provision") {
    const code = argument?.trim().toUpperCase();
    if (!code || code.length > 64) throw new Error("Usage: npm run reporting:stores -- provision STORE_CODE");
    const store = await db.query("SELECT store_type FROM public.stores WHERE store_code = $1", [code]);
    if (!store.rowCount) throw new Error(`Store ${code} was not found.`);
    const result = await provision(code, store.rows[0].store_type);
    console.log(`Store ${code} ready (${result.rows[0].schema_name}).`);
  } else if (command === "provision-all" || command === "upgrade") {
    const stores = await db.query("SELECT store_code, store_type FROM public.stores ORDER BY store_code");
    for (const store of stores.rows) {
      const result = await provision(store.store_code, store.store_type);
      console.log(`Store ${store.store_code} ready (${result.rows[0].schema_name}).`);
    }
  } else if (command === "list") {
    console.table((await db.query(`SELECT s.store_code, s.name, s.store_type, s.active, r.schema_name, r.reporting_version
      FROM public.stores s LEFT JOIN public.store_reporting_schemas r ON r.store_code = s.store_code ORDER BY s.store_code`)).rows);
  } else throw new Error("Expected provision STORE_CODE, provision-all, upgrade, or list.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { await db.end(); }
