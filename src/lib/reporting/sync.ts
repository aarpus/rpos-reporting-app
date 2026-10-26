import type { Client } from "pg";
import {
  ReportingError,
  schemaIdentifier,
  snapshotHash,
  tables,
  type BatchSnapshot,
  type OrderSnapshot,
  type ReportingTable,
  type ReportRow,
  type ShiftSnapshot,
} from "./snapshot.ts";

export type ReportingScope = { schemaName: string; storeCode: string };
export type SyncResult = {
  status: "accepted" | "duplicate" | "stale";
  request_id: string;
  source_revision: string;
};

// The caller provides a connected client; this function owns the transaction.
export async function syncOrderSnapshot(
  db: Pick<Client, "query">,
  scope: ReportingScope,
  snapshot: OrderSnapshot,
): Promise<SyncResult> {
  const schema = schemaIdentifier(scope.schemaName);
  const hash = snapshotHash(snapshot);
  const orderCode = snapshot.order.order_code;
  if (
    [
      snapshot.order,
      ...snapshot.items,
      ...snapshot.payments,
      ...snapshot.card_payments,
    ].some((row) => row.store_code !== scope.storeCode)
  )
    throw new ReportingError(
      "Snapshot store does not match reporting scope.",
      403,
    );
  await db.query("BEGIN");
  try {
    const active = await db.query(
      `SELECT 1 FROM public.stores s JOIN public.store_reporting_schemas r ON r.store_code = s.store_code
      WHERE s.store_code = $1 AND r.schema_name = $2
      AND s.active AND r.reporting_version = 1 FOR SHARE OF s, r`,
      [scope.storeCode, scope.schemaName],
    );
    if (!active.rowCount)
      throw new ReportingError("Store reporting scope unavailable.", 403);
    // Serialize request-ID reuse and concurrent revisions, including first insert.
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))", [
      `${scope.schemaName}:request:${scope.storeCode}`,
      snapshot.request_id,
    ]);
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))", [
      `${scope.schemaName}:order:${scope.storeCode}`,
      orderCode,
    ]);
    const previous = await db.query<{
      snapshot_hash: string;
      result: SyncResult["status"];
    }>(
      `SELECT snapshot_hash, result FROM ${schema}.sync_requests WHERE store_code = $1 AND request_id = $2`,
      [scope.storeCode, snapshot.request_id],
    );
    if (previous.rows[0]) {
      if (previous.rows[0].snapshot_hash !== hash)
        throw new ReportingError(
          "request_id was already used for different content.",
          409,
        );
      await db.query("COMMIT");
      return {
        status: previous.rows[0].result === "stale" ? "stale" : "duplicate",
        request_id: snapshot.request_id,
        source_revision: snapshot.source_revision,
      };
    }
    const existing = await db.query<{
      source_revision: string;
      snapshot_hash: string;
    }>(
      `SELECT source_revision::text, snapshot_hash FROM ${schema}.tbl_rpt_order WHERE store_code = $1 AND order_code = $2 FOR UPDATE`,
      [scope.storeCode, orderCode],
    );
    let status: SyncResult["status"] = "accepted";
    if (existing.rows[0]) {
      const revision = BigInt(existing.rows[0].source_revision);
      if (revision > BigInt(snapshot.source_revision)) status = "stale";
      else if (revision === BigInt(snapshot.source_revision)) {
        if (existing.rows[0].snapshot_hash !== hash)
          throw new ReportingError(
            "Conflicting content at the same source_revision.",
            409,
          );
        status = "duplicate";
      }
    }
    if (status === "accepted") {
      await upsert(db, schema, "tbl_rpt_order", [
        {
          ...snapshot.order,
          source_revision: snapshot.source_revision,
          snapshot_hash: hash,
        },
      ]);
      await upsert(db, schema, "tbl_rpt_order_item", snapshot.items);
      await upsert(db, schema, "tbl_rpt_payment", snapshot.payments);
      await upsert(db, schema, "tbl_rpt_card_payment", snapshot.card_payments);
      // Remove dependants before payments. Empty arrays intentionally remove all children.
      for (const [table, rows] of [
        ["tbl_rpt_card_payment", snapshot.card_payments],
        ["tbl_rpt_payment", snapshot.payments],
        ["tbl_rpt_order_item", snapshot.items],
      ] as const) {
        await db.query(
          `DELETE FROM ${schema}.${table} WHERE store_code = $1 AND order_code = $2 AND NOT (${tables[table].key} = ANY($3::varchar[]))`,
          [
            scope.storeCode,
            orderCode,
            rows.map((row) => row[tables[table].key]),
          ],
        );
      }
    }
    await db.query(
      `INSERT INTO ${schema}.sync_requests (store_code, request_id, order_code, source_revision, snapshot_hash, result) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        scope.storeCode,
        snapshot.request_id,
        orderCode,
        snapshot.source_revision,
        hash,
        status,
      ],
    );
    await db.query("COMMIT");
    return {
      status,
      request_id: snapshot.request_id,
      source_revision: snapshot.source_revision,
    };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

async function upsert(
  db: Pick<Client, "query">,
  schema: string,
  table: ReportingTable,
  rows: ReportRow[],
) {
  if (!rows.length) return;
  const fields = tables[table].fields.map((field) => field.name);
  if (
    table === "tbl_rpt_order" ||
    table === "tbl_rpt_batch" ||
    table === "tbl_rpt_shift"
  )
    fields.push("source_revision", "snapshot_hash");
  const names = fields.map((field) => `"${field}"`);
  const key = tables[table].key;
  const orderChild =
    table !== "tbl_rpt_order" &&
    table !== "tbl_rpt_batch" &&
    table !== "tbl_rpt_shift";
  const result = await db.query(
    `INSERT INTO ${schema}.${table} AS target (${names.join(", ")})
    SELECT ${names.join(", ")} FROM jsonb_populate_recordset(NULL::${schema}.${table}, $1::jsonb) WHERE TRUE
    ON CONFLICT (store_code, ${key}) DO UPDATE SET
      ${fields
        .filter((field) => field !== "store_code" && field !== key)
        .map((field) => `"${field}" = EXCLUDED."${field}"`)
        .join(", ")}, rpt_updated_on = now()
    ${orderChild ? "WHERE target.order_code = EXCLUDED.order_code" : ""}
    RETURNING ${key}`,
    [JSON.stringify(rows)],
  );
  if (result.rowCount !== rows.length)
    throw new ReportingError(
      "A child record code already belongs to another order.",
      409,
    );
}

export async function syncBatchSnapshot(
  db: Pick<Client, "query">,
  scope: ReportingScope,
  snapshot: BatchSnapshot,
): Promise<SyncResult> {
  return syncMaster(
    db,
    scope,
    "batch",
    "tbl_rpt_batch",
    snapshot.request_id,
    snapshot.source_revision,
    snapshot.batch,
    String(snapshot.batch.batch_code),
  );
}

export async function syncShiftSnapshot(
  db: Pick<Client, "query">,
  scope: ReportingScope,
  snapshot: ShiftSnapshot,
): Promise<SyncResult> {
  return syncMaster(
    db,
    scope,
    "shift",
    "tbl_rpt_shift",
    snapshot.request_id,
    snapshot.source_revision,
    snapshot.shift,
    String(snapshot.shift.shift_code),
  );
}

async function syncMaster(
  db: Pick<Client, "query">,
  scope: ReportingScope,
  kind: "batch" | "shift",
  table: "tbl_rpt_batch" | "tbl_rpt_shift",
  requestId: string,
  sourceRevision: string,
  row: ReportRow,
  code: string,
): Promise<SyncResult> {
  const schema = schemaIdentifier(scope.schemaName);
  const snapshot = {
    request_id: requestId,
    source_revision: sourceRevision,
    [kind]: row,
  };
  const hash = snapshotHash(snapshot);
  if (row.store_code !== scope.storeCode)
    throw new ReportingError(
      "Snapshot store does not match reporting scope.",
      403,
    );
  await db.query("BEGIN");
  try {
    const active = await db.query(
      `SELECT 1 FROM public.stores s JOIN public.store_reporting_schemas r ON r.store_code = s.store_code
      WHERE s.store_code = $1 AND r.schema_name = $2
      AND s.active AND r.reporting_version = 1 FOR SHARE OF s, r`,
      [scope.storeCode, scope.schemaName],
    );
    if (!active.rowCount)
      throw new ReportingError("Store reporting scope unavailable.", 403);
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))", [
      `${scope.schemaName}:master-request:${scope.storeCode}`,
      requestId,
    ]);
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))", [
      `${scope.schemaName}:${kind}:${scope.storeCode}`,
      code,
    ]);
    const previous = await db.query<{
      snapshot_hash: string;
      result: SyncResult["status"];
    }>(
      `SELECT snapshot_hash, result FROM ${schema}.sync_master_requests WHERE store_code = $1 AND request_id = $2`,
      [scope.storeCode, requestId],
    );
    if (previous.rows[0]) {
      if (previous.rows[0].snapshot_hash !== hash)
        throw new ReportingError(
          "request_id was already used for different content.",
          409,
        );
      await db.query("COMMIT");
      return {
        status: previous.rows[0].result === "stale" ? "stale" : "duplicate",
        request_id: requestId,
        source_revision: sourceRevision,
      };
    }
    if (kind === "shift") {
      const parent = await db.query(
        `SELECT 1 FROM ${schema}.tbl_rpt_batch WHERE store_code = $1 AND batch_code = $2 FOR SHARE`,
        [scope.storeCode, row.batch_code],
      );
      if (!parent.rowCount)
        throw new ReportingError("Create the batch before this shift.", 409);
    }
    const key = tables[table].key;
    const existing = await db.query<{
      source_revision: string;
      snapshot_hash: string;
    }>(
      `SELECT source_revision::text, snapshot_hash FROM ${schema}.${table} WHERE store_code = $1 AND "${key}" = $2 FOR UPDATE`,
      [scope.storeCode, code],
    );
    let status: SyncResult["status"] = "accepted";
    if (existing.rows[0]) {
      const revision = BigInt(existing.rows[0].source_revision);
      if (revision > BigInt(sourceRevision)) status = "stale";
      else if (revision === BigInt(sourceRevision)) {
        if (existing.rows[0].snapshot_hash !== hash)
          throw new ReportingError(
            "Conflicting content at the same source_revision.",
            409,
          );
        status = "duplicate";
      }
    }
    if (status === "accepted") {
      await upsert(db, schema, table, [
        { ...row, source_revision: sourceRevision, snapshot_hash: hash },
      ]);
    }
    await db.query(
      `INSERT INTO ${schema}.sync_master_requests (store_code, request_id, entity_kind, entity_code, source_revision, snapshot_hash, result) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [scope.storeCode, requestId, kind, code, sourceRevision, hash, status],
    );
    await db.query("COMMIT");
    return { status, request_id: requestId, source_revision: sourceRevision };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}
