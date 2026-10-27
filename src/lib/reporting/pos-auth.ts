import "server-only";
import { withDb } from "@/lib/db";
import { decryptPosSecret, verifyPosSignature } from "@/lib/pos-signature";
import { normalizeStoreCode } from "@/lib/store-access";
import type { StoreType } from "@/lib/store-type";
import { ReportingError } from "./snapshot";
import type { ReportingScope } from "./sync";

export async function authenticateReportingPos(
  request: Request,
  storeType: StoreType = "RESTAURANT",
): Promise<{ scope: ReportingScope; body: unknown }> {
  const storeCode = normalizeStoreCode(request.headers.get("x-store-code"));
  const keyId = request.headers.get("x-pos-key-id")?.trim();
  const timestamp = request.headers.get("x-pos-timestamp")?.trim();
  const signature = request.headers.get("x-pos-signature")?.trim();
  if (
    !storeCode ||
    !keyId ||
    keyId.length > 80 ||
    !timestamp ||
    !/^\d+$/.test(timestamp) ||
    !signature ||
    Math.abs(Date.now() / 1000 - Number(timestamp)) > 300
  )
    throw new ReportingError(
      "Invalid or expired POS authentication headers.",
      401,
    );
  const reader = request.body?.getReader();
  if (!reader) throw new ReportingError("Missing snapshot body.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    length += next.value.byteLength;
    if (length > 1_000_000) {
      await reader.cancel();
      throw new ReportingError("Snapshot exceeds 1 MB.", 413);
    }
    chunks.push(next.value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let rawBody: string;
  try {
    rawBody = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ReportingError("Invalid UTF-8 body.");
  }
  const credential = await withDb(
    async (db) =>
      (
        await db.query<{
          encrypted_secret: string;
          iv: string;
          schema_name: string;
          reporting_version: number;
          store_type: string;
        }>(
          `SELECT p.encrypted_secret, p.iv, r.schema_name, r.reporting_version, s.store_type
    FROM public.pos_credentials p JOIN public.stores s ON s.store_code = p.store_code
    JOIN public.store_reporting_schemas r ON r.store_code = s.store_code
    WHERE p.store_code = $1 AND p.key_id = $2 AND p.active AND s.active`,
          [storeCode, keyId],
        )
      ).rows[0],
  );
  if (!credential)
    throw new ReportingError(
      "Invalid POS credential or unprovisioned store.",
      401,
    );
  const secret = await decryptPosSecret(
    credential.encrypted_secret,
    credential.iv,
  );
  if (
    !(await verifyPosSignature(
      `${storeCode}\n${keyId}\n${timestamp}\n${rawBody}`,
      signature,
      secret,
    ))
  )
    throw new ReportingError("Invalid POS signature.", 401);
  if (credential.store_type !== storeType)
    throw new ReportingError(
      storeType === "RETAIL"
        ? "Retail reporting is not available for this store."
        : "Restaurant reporting is not available for this store.",
      403,
    );
  if (credential.reporting_version !== 1)
    throw new ReportingError("Store reporting schema is not ready.", 503);
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw new ReportingError("Invalid JSON body.");
  }
  return { scope: { schemaName: credential.schema_name, storeCode }, body };
}
