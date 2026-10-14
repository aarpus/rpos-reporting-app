import nextEnv from "@next/env";
import { Pool } from "pg";
import { readFile } from "node:fs/promises";
import { hashPassword } from "../src/lib/password.mjs";

nextEnv.loadEnvConfig(process.cwd());
const command = process.argv[2];
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in .env.local first.");
const target = new URL(process.env.DATABASE_URL);
let pool;
try {
  if (command === "create") {
    const name = decodeURIComponent(target.pathname.slice(1));
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(name)) throw new Error("Use a database name containing letters, numbers, and underscores.");
    target.pathname = "/postgres";
    pool = new Pool({ connectionString: target.toString(), connectionTimeoutMillis: 5000 });
    const existing = await pool.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (!existing.rowCount) await pool.query(`CREATE DATABASE "${name}"`);
    console.log(existing.rowCount ? "Database already exists." : "Database created.");
  } else {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
    if (command === "migrate") {
      await pool.query(await readFile(new URL("../database/001-auth.sql", import.meta.url), "utf8"));
      console.log("Authentication schema is ready.");
    } else if (command === "seed-notification-types") {
      await pool.query(
        `INSERT INTO notification_types (key, label, active) VALUES
           ('SHIFT_END', 'Shift ended', TRUE),
           ('DAY_END', 'Business day closed', TRUE),
           ('LOW_STOCK', 'Low stock', TRUE),
           ('VOID_REFUND', 'Void or refund', TRUE)
         ON CONFLICT (key) DO UPDATE
         SET label = EXCLUDED.label, active = EXCLUDED.active`,
      );
      console.log("Notification types are ready.");
    } else if (command === "create-user") {
      const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const name = process.env.ADMIN_NAME?.trim();
      const password = process.env.ADMIN_PASSWORD;
      if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || name.length > 120 || !password || password.length > 256) {
        throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, and a non-empty ADMIN_PASSWORD (maximum 256 characters) in .env.local.");
      }
      await pool.query("INSERT INTO auth_users (name, email, password_hash, role) VALUES ($1, $2, $3, 'ADMIN')", [name, email, await hashPassword(password)]);
      console.log("Account created. Remove ADMIN_PASSWORD from .env.local.");
    } else if (command === "bootstrap-admin") {
      const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      if (!email) throw new Error("Set ADMIN_EMAIL before bootstrapping the administrator.");
      const result = await pool.query("UPDATE auth_users SET role = 'ADMIN' WHERE email = $1 AND active = TRUE", [email]);
      if (!result.rowCount) throw new Error("No active account matches ADMIN_EMAIL.");
      console.log("Administrator role applied.");
    } else throw new Error("Expected create, migrate, seed-notification-types, create-user, or bootstrap-admin.");
  }
} catch (error) {
  console.error(error.code === "23505" ? "An account with that email already exists; no changes made." : error.message);
  process.exitCode = 1;
} finally {
  await pool?.end();
}
