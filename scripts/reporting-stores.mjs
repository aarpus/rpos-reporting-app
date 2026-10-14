import nextEnv from "@next/env";
import { Client } from "pg";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL first.");
const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
await db.connect();
try {
  const [command, argument] = process.argv.slice(2);
  if (command === "provision") {
    const code = argument?.trim().toUpperCase();
    if (!code || code.length > 64) throw new Error("Usage: npm run reporting:stores -- provision STORE_CODE");
    const result = await db.query("SELECT public.provision_store_reporting($1) AS schema_name", [code]);
    console.log(`Store ${code} ready (${result.rows[0].schema_name}).`);
  } else if (command === "provision-all" || command === "upgrade") {
    const stores = await db.query("SELECT store_code FROM public.stores ORDER BY store_code");
    for (const store of stores.rows) {
      const result = await db.query("SELECT public.provision_store_reporting($1) AS schema_name", [store.store_code]);
      console.log(`Store ${store.store_code} ready (${result.rows[0].schema_name}).`);
    }
  } else if (command === "list") {
    console.table((await db.query(`SELECT s.store_code, s.name, s.active, r.schema_name, r.reporting_version
      FROM public.stores s LEFT JOIN public.store_reporting_schemas r ON r.store_code = s.store_code ORDER BY s.store_code`)).rows);
  } else throw new Error("Expected provision STORE_CODE, provision-all, upgrade, or list.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { await db.end(); }
