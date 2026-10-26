import "server-only";

import { createCipheriv, randomBytes } from "node:crypto";
import { withDb } from "@/lib/db";
import type {
  IssuedPosCredential,
  PosCredentialSummary,
} from "@/types/store-admin";

export class PosCredentialKeyError extends Error {
  constructor() {
    super("POS credential encryption is not configured.");
    this.name = "PosCredentialKeyError";
  }
}

export type PosCredentialListResult =
  | { kind: "not-found" }
  | { kind: "ok"; credentials: PosCredentialSummary[] };

export type PosCredentialCreateResult =
  | { kind: "not-found" }
  | { kind: "inactive" }
  | { kind: "created"; credential: IssuedPosCredential };

function encryptionKey() {
  const key = Buffer.from(
    process.env.POS_CREDENTIAL_ENCRYPTION_KEY ?? "",
    "base64",
  );
  if (key.length !== 32) throw new PosCredentialKeyError();
  return key;
}

export async function listPosCredentials(
  storeCode: string,
): Promise<PosCredentialListResult> {
  return withDb(async (db) => {
    const store = await db.query("SELECT 1 FROM stores WHERE store_code = $1", [
      storeCode,
    ]);
    if (!store.rowCount) return { kind: "not-found" };
    const result = await db.query<{
      key_id: string;
      active: boolean;
      created_at: Date;
    }>(
      `
      SELECT key_id, active, created_at
      FROM pos_credentials
      WHERE store_code = $1
      ORDER BY created_at DESC, key_id`,
      [storeCode],
    );
    return {
      kind: "ok",
      credentials: result.rows.map((row) => ({
        keyId: row.key_id,
        active: row.active,
        createdAt: row.created_at.toISOString(),
      })),
    };
  });
}

export async function createPosCredential(
  storeCode: string,
): Promise<PosCredentialCreateResult> {
  const key = encryptionKey();
  return withDb(async (db) => {
    const store = await db.query<{ active: boolean }>(
      "SELECT active FROM stores WHERE store_code = $1",
      [storeCode],
    );
    const row = store.rows[0];
    if (!row) return { kind: "not-found" };
    if (!row.active) return { kind: "inactive" };

    const secret = randomBytes(32);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const keyId = `pos-${randomBytes(6).toString("hex")}`;
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const encrypted = Buffer.concat([
        cipher.update(secret),
        cipher.final(),
        cipher.getAuthTag(),
      ]);
      try {
        await db.query(
          "INSERT INTO pos_credentials (store_code, key_id, encrypted_secret, iv) VALUES ($1, $2, $3, $4)",
          [storeCode, keyId, encrypted.toString("base64"), iv.toString("base64")],
        );
        return {
          kind: "created",
          credential: {
            storeCode,
            keyId,
            secret: secret.toString("base64"),
          },
        };
      } catch (error) {
        if ((error as { code?: string }).code !== "23505" || attempt === 2) {
          throw error;
        }
      }
    }
    throw new Error("Unable to issue a POS credential.");
  });
}
