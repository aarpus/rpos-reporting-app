import type { Client } from "pg";
import { quoteRetailIdent, retailTable, type RetailRow, type RetailTableName } from "./retail-columns.ts";
import {
  normalizeRetailStored,
  retailRowsEqual,
  type RetailBatchSnapshot,
  type RetailEntitySnapshot,
  type RetailOrderSnapshot,
  type RetailShiftSnapshot,
} from "./retail-snapshot.ts";
import { ReportingError, schemaIdentifier } from "./snapshot.ts";
import type { ReportingScope } from "./sync.ts";

export type RetailSyncResult = {
  status: "accepted" | "duplicate";
  request_id: string;
  batchid?: string;
  shiftid?: string;
  transactionid?: string;
};

function qualified(schemaName: string, table: RetailTableName) {
  return `${schemaIdentifier(schemaName)}.${quoteRetailIdent(table)}`;
}

function storedRow(tableName: RetailTableName, record: Record<string, unknown>) {
  const table = retailTable(tableName);
  const folded = new Map(Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]));
  const row: RetailRow = {};
  for (const field of table.fields) {
    const value = Object.prototype.hasOwnProperty.call(record, field.name) ? record[field.name] : folded.get(field.name.toLowerCase());
    row[field.name] = normalizeRetailStored(field, value);
  }
  return row;
}

function sameRows(tableName: RetailTableName, left: RetailRow[], right: RetailRow[]) {
  const key = retailTable(tableName).key;
  const sort = (rows: RetailRow[]) => [...rows].sort((a, b) => (BigInt(String(a[key])) < BigInt(String(b[key])) ? -1 : 1));
  const [sortedLeft, sortedRight] = [sort(left), sort(right)];
  return sortedLeft.length === sortedRight.length && sortedLeft.every((row, index) => retailRowsEqual(tableName, row, sortedRight[index]));
}

async function assertRetailScope(db: Pick<Client, "query">, scope: ReportingScope) {
  const active = await db.query(
    `SELECT 1 FROM public.stores s JOIN public.store_reporting_schemas r ON r.store_code = s.store_code
     WHERE s.store_code = $1 AND r.schema_name = $2
     AND s.active AND s.store_type = 'RETAIL' AND r.reporting_version = 1
     FOR SHARE OF s, r`,
    [scope.storeCode, scope.schemaName],
  );
  if (!active.rowCount) throw new ReportingError("Store reporting scope unavailable.", 403);
}

async function lockRetail(db: Pick<Client, "query">, scope: ReportingScope, kind: string, id: string) {
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))", [
    `${scope.schemaName}:retail:${kind}:${scope.storeCode}`,
    id,
  ]);
}

async function readOne(db: Pick<Client, "query">, scope: ReportingScope, tableName: RetailTableName, id: string) {
  const table = retailTable(tableName);
  const result = await db.query(
    `SELECT * FROM ${qualified(scope.schemaName, tableName)} WHERE ${quoteRetailIdent(table.key)} = $1::bigint FOR UPDATE`,
    [id],
  );
  if (!result.rowCount) return null;
  if (result.rowCount > 1) throw new ReportingError(`${table.key} is already duplicated in this store.`, 409);
  return storedRow(tableName, result.rows[0] as Record<string, unknown>);
}

async function readOwned(db: Pick<Client, "query">, scope: ReportingScope, tableName: RetailTableName, ownerColumn: string, ownerId: string) {
  const result = await db.query(
    `SELECT * FROM ${qualified(scope.schemaName, tableName)} WHERE ${quoteRetailIdent(ownerColumn)} = $1::bigint FOR UPDATE`,
    [ownerId],
  );
  return result.rows.map((row) => storedRow(tableName, row as Record<string, unknown>));
}

async function assertOwnedIds(
  db: Pick<Client, "query">,
  scope: ReportingScope,
  tableName: RetailTableName,
  ownerColumn: string,
  ownerId: string,
  ids: string[],
) {
  if (!ids.length) return;
  const table = retailTable(tableName);
  const result = await db.query(
    `SELECT 1 FROM ${qualified(scope.schemaName, tableName)}
     WHERE ${quoteRetailIdent(table.key)} = ANY($1::bigint[])
     AND ${quoteRetailIdent(ownerColumn)} IS DISTINCT FROM $2::bigint
     LIMIT 1`,
    [ids, ownerId],
  );
  if (result.rowCount) throw new ReportingError(`${table.key} already belongs to another transaction.`, 409);
}

async function insertRows(db: Pick<Client, "query">, scope: ReportingScope, tableName: RetailTableName, rows: RetailRow[]) {
  if (!rows.length) return;
  const sql = qualified(scope.schemaName, tableName);
  await db.query(`INSERT INTO ${sql} SELECT * FROM jsonb_populate_recordset(NULL::${sql}, $1::jsonb)`, [JSON.stringify(rows)]);
}

async function updateRow(db: Pick<Client, "query">, scope: ReportingScope, tableName: RetailTableName, row: RetailRow) {
  const table = retailTable(tableName);
  const fields = table.fields.filter((field) => field.name !== table.key);
  const assignments = fields.map((field, index) => `${quoteRetailIdent(field.name)} = $${index + 2}`);
  const result = await db.query(
    `UPDATE ${qualified(scope.schemaName, tableName)} SET ${assignments.join(", ")} WHERE ${quoteRetailIdent(table.key)} = $1::bigint`,
    [row[table.key], ...fields.map((field) => row[field.name])],
  );
  if (result.rowCount !== 1) throw new ReportingError("Retail row update did not match one record.", 409);
}

async function advanceIdentity(db: Pick<Client, "query">, scope: ReportingScope, tableName: RetailTableName) {
  const table = retailTable(tableName);
  const max = await db.query<{ max_id: string }>(
    `SELECT COALESCE(MAX(${quoteRetailIdent(table.key)}), 0)::text AS max_id FROM ${qualified(scope.schemaName, tableName)}`,
  );
  if (BigInt(max.rows[0]?.max_id ?? "0") <= BigInt(0)) return;
  const sequence = await db.query<{ sequence: string | null }>(
    "SELECT pg_get_serial_sequence($1, $2) AS sequence",
    [`${schemaIdentifier(scope.schemaName)}.${quoteRetailIdent(tableName)}`, table.key],
  );
  if (!sequence.rows[0]?.sequence) return;
  await db.query("SELECT setval($1::regclass, $2::bigint, true)", [sequence.rows[0].sequence, max.rows[0].max_id]);
}

async function inRetailTransaction<T>(db: Pick<Client, "query">, scope: ReportingScope, kind: string, id: string, work: () => Promise<T>) {
  await db.query("BEGIN");
  try {
    await assertRetailScope(db, scope);
    await lockRetail(db, scope, kind, id);
    const result = await work();
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

export async function syncRetailBatch(db: Pick<Client, "query">, scope: ReportingScope, snapshot: RetailBatchSnapshot): Promise<RetailSyncResult> {
  const batchid = String(snapshot.batch.batchid);
  return inRetailTransaction(db, scope, "batch", batchid, async () => {
    const existing = await readOne(db, scope, "tbl_batch", batchid);
    if (existing && retailRowsEqual("tbl_batch", existing, snapshot.batch))
      return { status: "duplicate" as const, request_id: snapshot.request_id, batchid };
    if (existing) await updateRow(db, scope, "tbl_batch", snapshot.batch);
    else await insertRows(db, scope, "tbl_batch", [snapshot.batch]);
    await advanceIdentity(db, scope, "tbl_batch");
    return { status: "accepted" as const, request_id: snapshot.request_id, batchid };
  });
}

export async function syncRetailShift(db: Pick<Client, "query">, scope: ReportingScope, snapshot: RetailShiftSnapshot): Promise<RetailSyncResult> {
  const shiftid = String(snapshot.shift.shiftid);
  return inRetailTransaction(db, scope, "shift", shiftid, async () => {
    const parent = await db.query(
      `SELECT 1 FROM ${qualified(scope.schemaName, "tbl_batch")} WHERE ${quoteRetailIdent("batchid")} = $1::bigint FOR SHARE`,
      [snapshot.shift.batchid],
    );
    if (!parent.rowCount) throw new ReportingError("Create the batch before this shift.", 409);
    if (parent.rowCount > 1) throw new ReportingError("batchid is already duplicated in this store.", 409);
    const existing = await readOne(db, scope, "tbl_shift", shiftid);
    if (existing && retailRowsEqual("tbl_shift", existing, snapshot.shift))
      return { status: "duplicate" as const, request_id: snapshot.request_id, shiftid };
    if (existing) await updateRow(db, scope, "tbl_shift", snapshot.shift);
    else await insertRows(db, scope, "tbl_shift", [snapshot.shift]);
    await advanceIdentity(db, scope, "tbl_shift");
    return { status: "accepted" as const, request_id: snapshot.request_id, shiftid };
  });
}

export async function syncRetailOrder(db: Pick<Client, "query">, scope: ReportingScope, snapshot: RetailOrderSnapshot): Promise<RetailSyncResult> {
  const transactionid = String(snapshot.checkout_transaction.transactionid);
  return inRetailTransaction(db, scope, "transaction", transactionid, async () => {
    const shift = await db.query<{ batchid: string }>(
      `SELECT ${quoteRetailIdent("batchid")}::text AS batchid FROM ${qualified(scope.schemaName, "tbl_shift")} WHERE ${quoteRetailIdent("shiftid")} = $1::bigint FOR SHARE`,
      [snapshot.checkout_transaction.shiftid],
    );
    if (!shift.rowCount) throw new ReportingError("Create the shift before this transaction.", 409);
    if (shift.rowCount > 1) throw new ReportingError("shiftid is already duplicated in this store.", 409);
    if (snapshot.transaction_payment.some((payment) => payment.batchid !== shift.rows[0].batchid))
      throw new ReportingError("Payment batchid does not match the shift batch.", 409);
    const existing = await readOne(db, scope, "tbl_checkout_transaction", transactionid);
    const details = existing ? await readOwned(db, scope, "tbl_transaction_detail", "transactionid", transactionid) : [];
    const payments = existing ? await readOwned(db, scope, "tbl_transaction_payment", "chkout_id", transactionid) : [];
    const giftCards = existing ? await readOwned(db, scope, "tbl_transaction_gift_card", "transactionid", transactionid) : [];
    if (
      existing &&
      retailRowsEqual("tbl_checkout_transaction", existing, snapshot.checkout_transaction) &&
      sameRows("tbl_transaction_detail", details, snapshot.transaction_detail) &&
      sameRows("tbl_transaction_payment", payments, snapshot.transaction_payment) &&
      sameRows("tbl_transaction_gift_card", giftCards, snapshot.transaction_gift_card)
    )
      return { status: "duplicate" as const, request_id: snapshot.request_id, transactionid };
    // Checkout totals stay as supplied. Payment rows, including card attempts, are not added into those totals.
    await assertOwnedIds(db, scope, "tbl_transaction_detail", "transactionid", transactionid, snapshot.transaction_detail.map((row) => String(row.transactiondetailid)));
    await assertOwnedIds(db, scope, "tbl_transaction_payment", "chkout_id", transactionid, snapshot.transaction_payment.map((row) => String(row.id_payment)));
    await assertOwnedIds(db, scope, "tbl_transaction_gift_card", "transactionid", transactionid, snapshot.transaction_gift_card.map((row) => String(row.id_transaction)));
    await db.query(`DELETE FROM ${qualified(scope.schemaName, "tbl_transaction_detail")} WHERE ${quoteRetailIdent("transactionid")} = $1::bigint`, [transactionid]);
    await db.query(`DELETE FROM ${qualified(scope.schemaName, "tbl_transaction_payment")} WHERE ${quoteRetailIdent("chkout_id")} = $1::bigint`, [transactionid]);
    await db.query(`DELETE FROM ${qualified(scope.schemaName, "tbl_transaction_gift_card")} WHERE ${quoteRetailIdent("transactionid")} = $1::bigint`, [transactionid]);
    if (existing) await updateRow(db, scope, "tbl_checkout_transaction", snapshot.checkout_transaction);
    else await insertRows(db, scope, "tbl_checkout_transaction", [snapshot.checkout_transaction]);
    await insertRows(db, scope, "tbl_transaction_detail", snapshot.transaction_detail);
    await insertRows(db, scope, "tbl_transaction_payment", snapshot.transaction_payment);
    await insertRows(db, scope, "tbl_transaction_gift_card", snapshot.transaction_gift_card);
    for (const table of ["tbl_checkout_transaction", "tbl_transaction_detail", "tbl_transaction_payment", "tbl_transaction_gift_card"] as const)
      await advanceIdentity(db, scope, table);
    return { status: "accepted" as const, request_id: snapshot.request_id, transactionid };
  });
}

export async function syncRetailEntity(
  db: Pick<Client, "query">,
  scope: ReportingScope,
  tableName: RetailTableName,
  snapshot: RetailEntitySnapshot,
): Promise<RetailSyncResult> {
  const table = retailTable(tableName);
  const id = String(snapshot.row[table.key]);
  return inRetailTransaction(db, scope, tableName, id, async () => {
    const existing = await readOne(db, scope, tableName, id);
    if (existing && retailRowsEqual(tableName, existing, snapshot.row))
      return { status: "duplicate", request_id: snapshot.request_id, [table.key]: id };
    if (existing) await updateRow(db, scope, tableName, snapshot.row);
    else await insertRows(db, scope, tableName, [snapshot.row]);
    await advanceIdentity(db, scope, tableName);
    return { status: "accepted", request_id: snapshot.request_id, [table.key]: id };
  });
}
