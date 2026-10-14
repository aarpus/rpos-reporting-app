import nextEnv from "@next/env";
import { Pool } from "pg";
import { createCipheriv, randomBytes } from "node:crypto";

nextEnv.loadEnvConfig(process.cwd());
const command = process.argv[2];
const storeCode = process.argv[3]?.trim().toUpperCase();
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL first.");
if (!storeCode || storeCode.length > 64) throw new Error("Pass a valid store code.");
const encryptionKey = Buffer.from(process.env.POS_CREDENTIAL_ENCRYPTION_KEY ?? "", "base64");
if (encryptionKey.length !== 32) throw new Error("POS_CREDENTIAL_ENCRYPTION_KEY must be a Base64-encoded 32-byte key.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });

try {
  if (command === "create") {
    const store = await pool.query("SELECT 1 FROM stores WHERE store_code = $1 AND active = TRUE", [storeCode]);
    if (!store.rowCount) throw new Error("Store does not exist or is inactive.");
    const keyId = `pos-${randomBytes(6).toString("hex")}`;
    const secret = randomBytes(32);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(secret), cipher.final(), cipher.getAuthTag()]);
    await pool.query(
      "INSERT INTO pos_credentials (store_code, key_id, encrypted_secret, iv) VALUES ($1, $2, $3, $4)",
      [storeCode, keyId, encrypted.toString("base64"), iv.toString("base64")],
    );
    console.log(JSON.stringify({ storeCode, keyId, secret: secret.toString("base64") }, null, 2));
    console.log("Save this secret in the POS credential store. It will not be shown again.");
  } else if (command === "deactivate") {
    const keyId = process.argv[4]?.trim();
    if (!keyId) throw new Error("Pass the key ID to deactivate.");
    const result = await pool.query(
      "UPDATE pos_credentials SET active = FALSE, rotated_at = NOW() WHERE store_code = $1 AND key_id = $2 AND active = TRUE",
      [storeCode, keyId],
    );
    if (!result.rowCount) throw new Error("Active credential not found.");
    console.log("POS credential deactivated.");
  } else {
    throw new Error("Use: create STORE_CODE or deactivate STORE_CODE KEY_ID");
  }
} finally {
  await pool.end();
}
