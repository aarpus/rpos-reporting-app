import type { Client } from "pg";
import { quoteRetailIdent } from "./retail-columns.ts";
import { parseRetailValue } from "./retail-snapshot.ts";
import { ReportingError, businessDate, schemaIdentifier } from "./snapshot.ts";
import type { ReportingScope } from "./sync.ts";

export type JournalLine = {
  quantity: string;
  itemNo: string;
  productName: string;
  retail: string;
  discount: string;
  amount: string;
  tax: string;
  deposit: string;
  total: string;
};
export type JournalLineTotal = {
  retail: string;
  discount: string;
  amount: string;
  tax: string;
  deposit: string;
  total: string;
};
export type JournalLabel = { label: string; value: string };
export type TransactionJournal = {
  transactionid: string;
  transaction_date_time: string;
  stationname: string;
  transaction_number: string;
  qty: string;
  discount: string;
  sub_total: string;
  tax: string;
  deposit: string;
  total: string;
  paid_by: string | null;
  cashier: string | null;
  lines: { rows: JournalLine[]; total: JournalLineTotal | null };
  credit_card: JournalLabel[];
  paid_by_amounts: JournalLabel[];
};
export type TransactionJournalSnapshot = { request_id: string; transaction_journal: TransactionJournal };
export type TransactionJournalRecord = TransactionJournal & { id: string };
export type TransactionJournalScope = ReportingScope & { timezone: string };

const journalKeys = new Set([
  "transactionid",
  "transaction_date_time",
  "stationname",
  "transaction_number",
  "qty",
  "discount",
  "sub_total",
  "tax",
  "deposit",
  "total",
  "paid_by",
  "cashier",
  "lines",
  "credit_card",
  "paid_by_amounts",
]);
const lineKeys = ["quantity", "itemNo", "productName", "retail", "discount", "amount", "tax", "deposit", "total"] as const;
const totalKeys = ["retail", "discount", "amount", "tax", "deposit", "total"] as const;

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requestId(value: Record<string, unknown>) {
  if (typeof value.request_id !== "string" || !value.request_id.trim() || value.request_id.length > 160 || value.request_id.includes("\u0000"))
    throw new ReportingError("request_id is required (maximum 160 characters).");
  return value.request_id;
}

function text(value: unknown, name: string, maxLength: number) {
  return String(parseRetailValue({ name, kind: "string", required: true, notNull: true, maxLength }, value));
}

function optionalText(value: unknown, name: string, maxLength: number) {
  if (value === undefined || value === null || value === "") return null;
  return text(value, name, maxLength);
}

function cell(value: unknown, name: string, maxLength: number) {
  if (typeof value !== "string" || value.includes("\u0000") || [...value].length > maxLength)
    throw new ReportingError(`Invalid ${name}.`);
  return value;
}

function positiveBigint(value: unknown, name: string) {
  const parsed = String(parseRetailValue({ name, kind: "bigint", required: true, notNull: true }, value));
  if (BigInt(parsed) <= BigInt(0)) throw new ReportingError(`${name} must be a positive id.`);
  return parsed;
}

function timestamp(value: unknown, name: string) {
  return String(parseRetailValue({ name, kind: "timestamp", required: true, notNull: true }, value));
}

function labelLine(value: unknown, name: string): JournalLabel {
  if (!object(value) || Object.keys(value).some((key) => key !== "label" && key !== "value"))
    throw new ReportingError(`Invalid ${name} line.`);
  return { label: text(value.label, `${name} label`, 80), value: cell(value.value, `${name} value`, 80) };
}

function labelLines(value: unknown, name: string): JournalLabel[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 50) throw new ReportingError(`${name} must be an array with at most 50 lines.`);
  return value.map((item) => labelLine(item, name));
}

function lineRow(value: unknown): JournalLine {
  if (!object(value) || lineKeys.some((key) => !(key in value)) || Object.keys(value).some((key) => !lineKeys.includes(key as (typeof lineKeys)[number])))
    throw new ReportingError("Invalid journal line.");
  return {
    quantity: cell(value.quantity, "quantity", 40),
    itemNo: cell(value.itemNo, "itemNo", 40),
    productName: cell(value.productName, "productName", 200),
    retail: cell(value.retail, "retail", 40),
    discount: cell(value.discount, "discount", 40),
    amount: cell(value.amount, "amount", 40),
    tax: cell(value.tax, "tax", 40),
    deposit: cell(value.deposit, "deposit", 40),
    total: cell(value.total, "total", 40),
  };
}

function lineTotal(value: unknown): JournalLineTotal | null {
  if (value === undefined || value === null) return null;
  if (!object(value) || totalKeys.some((key) => !(key in value)) || Object.keys(value).some((key) => !totalKeys.includes(key as (typeof totalKeys)[number])))
    throw new ReportingError("Invalid journal line total.");
  return {
    retail: cell(value.retail, "retail", 40),
    discount: cell(value.discount, "discount", 40),
    amount: cell(value.amount, "amount", 40),
    tax: cell(value.tax, "tax", 40),
    deposit: cell(value.deposit, "deposit", 40),
    total: cell(value.total, "total", 40),
  };
}

function lines(value: unknown): TransactionJournal["lines"] {
  if (value === undefined) return { rows: [], total: null };
  if (!object(value) || Object.keys(value).some((key) => key !== "rows" && key !== "total"))
    throw new ReportingError("Invalid lines.");
  if (!Array.isArray(value.rows) || value.rows.length > 2000) throw new ReportingError("lines.rows must be an array with at most 2000 rows.");
  return { rows: value.rows.map(lineRow), total: lineTotal(value.total) };
}

export function parseRetailTransactionJournal(value: unknown): TransactionJournalSnapshot {
  if (Array.isArray(value) || !object(value) || !("request_id" in value) || !("transaction_journal" in value) || Object.keys(value).some((key) => key !== "request_id" && key !== "transaction_journal"))
    throw new ReportingError("Invalid transaction_journal envelope.");
  if (!object(value.transaction_journal)) throw new ReportingError("Invalid transaction_journal.");
  if (Object.keys(value.transaction_journal).some((key) => !journalKeys.has(key))) throw new ReportingError("Unknown transaction_journal field.");
  const body = value.transaction_journal;
  return {
    request_id: requestId(value),
    transaction_journal: {
      transactionid: positiveBigint(body.transactionid, "transactionid"),
      transaction_date_time: timestamp(body.transaction_date_time, "transaction_date_time"),
      stationname: text(body.stationname, "stationname", 100),
      transaction_number: text(body.transaction_number, "transaction_number", 50),
      qty: text(body.qty, "qty", 40),
      discount: text(body.discount, "discount", 40),
      sub_total: text(body.sub_total, "sub_total", 40),
      tax: text(body.tax, "tax", 40),
      deposit: text(body.deposit, "deposit", 40),
      total: text(body.total, "total", 40),
      paid_by: optionalText(body.paid_by, "paid_by", 50),
      cashier: optionalText(body.cashier, "cashier", 100),
      lines: lines(body.lines),
      credit_card: labelLines(body.credit_card, "credit_card"),
      paid_by_amounts: labelLines(body.paid_by_amounts, "paid_by_amounts"),
    },
  };
}

function storedTime(value: unknown, name: string) {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(typeof value === "string" || typeof value === "number" ? value : "");
  if (!Number.isFinite(date.getTime())) throw new ReportingError(`Invalid stored ${name}.`, 503);
  return date.toISOString();
}

function parseJson(value: unknown, name: string) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new ReportingError(`Invalid stored ${name}.`, 503);
  }
}

export function storedTransactionJournal(record: Record<string, unknown>): TransactionJournal {
  const when = storedTime(record.transaction_date_time, "transaction_date_time");
  if (!when) throw new ReportingError("Invalid stored transaction journal.", 503);
  return parseRetailTransactionJournal({
    request_id: "stored",
    transaction_journal: {
      transactionid: String(record.transactionid),
      transaction_date_time: when,
      stationname: record.stationname,
      transaction_number: record.transaction_number,
      qty: record.qty,
      discount: record.discount,
      sub_total: record.sub_total,
      tax: record.tax,
      deposit: record.deposit,
      total: record.total,
      paid_by: record.paid_by ?? null,
      cashier: record.cashier ?? null,
      lines: parseJson(record.lines, "lines"),
      credit_card: parseJson(record.credit_card, "credit_card"),
      paid_by_amounts: parseJson(record.paid_by_amounts, "paid_by_amounts"),
    },
  }).transaction_journal;
}

function journalTable(schemaName: string) {
  return `${schemaIdentifier(schemaName)}.${quoteRetailIdent("tbl_transaction_journal_report")}`;
}

function journalValues(report: TransactionJournal) {
  return [
    report.transactionid,
    report.transaction_date_time,
    report.stationname,
    report.transaction_number,
    report.qty,
    report.discount,
    report.sub_total,
    report.tax,
    report.deposit,
    report.total,
    report.paid_by,
    report.cashier,
    JSON.stringify(report.lines),
    JSON.stringify(report.credit_card),
    JSON.stringify(report.paid_by_amounts),
  ];
}

async function inJournalTransaction<T>(db: Pick<Client, "query">, scope: ReportingScope, id: string, work: () => Promise<T>) {
  await db.query("BEGIN");
  try {
    const active = await db.query(
      `SELECT 1 FROM public.stores s JOIN public.store_reporting_schemas r ON r.store_code = s.store_code
       WHERE s.store_code = $1 AND r.schema_name = $2
       AND s.active AND s.store_type = 'RETAIL' AND r.reporting_version = 1
       FOR SHARE OF s, r`,
      [scope.storeCode, scope.schemaName],
    );
    if (!active.rowCount) throw new ReportingError("Store reporting scope unavailable.", 403);
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))", [
      `${scope.schemaName}:retail:transaction-journal:${scope.storeCode}`,
      id,
    ]);
    const result = await work();
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

export async function syncRetailTransactionJournal(db: Pick<Client, "query">, scope: ReportingScope, snapshot: TransactionJournalSnapshot) {
  const transactionid = snapshot.transaction_journal.transactionid;
  return inJournalTransaction(db, scope, transactionid, async () => {
    const existing = await db.query(`SELECT * FROM ${journalTable(scope.schemaName)} WHERE "transactionid" = $1::bigint FOR UPDATE`, [transactionid]);
    if ((existing.rowCount ?? 0) > 1) throw new ReportingError("transactionid is already duplicated in this store.", 409);
    const current = existing.rowCount ? storedTransactionJournal(existing.rows[0] as Record<string, unknown>) : null;
    if (current && JSON.stringify(current) === JSON.stringify(snapshot.transaction_journal))
      return { status: "duplicate" as const, request_id: snapshot.request_id, transactionid };
    const values = journalValues(snapshot.transaction_journal);
    if (current) {
      const updated = await db.query(
        `UPDATE ${journalTable(scope.schemaName)} SET
          "transaction_date_time" = $2::timestamptz, "stationname" = $3, "transaction_number" = $4,
          "qty" = $5, "discount" = $6, "sub_total" = $7, "tax" = $8, "deposit" = $9, "total" = $10,
          "paid_by" = $11, "cashier" = $12, "lines" = $13::jsonb, "credit_card" = $14::jsonb, "paid_by_amounts" = $15::jsonb
         WHERE "transactionid" = $1::bigint`,
        values,
      );
      if (updated.rowCount !== 1) throw new ReportingError("Retail row update did not match one record.", 409);
    } else {
      await db.query(
        `INSERT INTO ${journalTable(scope.schemaName)} (
          "transactionid", "transaction_date_time", "stationname", "transaction_number", "qty", "discount",
          "sub_total", "tax", "deposit", "total", "paid_by", "cashier", "lines", "credit_card", "paid_by_amounts"
        ) VALUES (
          $1::bigint, $2::timestamptz, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb, $15::jsonb
        )`,
        values,
      );
    }
    return { status: "accepted" as const, request_id: snapshot.request_id, transactionid };
  });
}

export async function resolveRetailJournalScope(db: Pick<Client, "query">, user: { id: string }, storeCode: string): Promise<TransactionJournalScope> {
  const result = await db.query<{ schema_name: string; timezone: string }>(`
    SELECT r.schema_name, s.timezone
    FROM public.stores s JOIN public.store_reporting_schemas r ON r.store_code = s.store_code
    JOIN public.auth_users u ON u.id = $2
    WHERE s.store_code = $1 AND s.active AND s.store_type = 'RETAIL' AND r.reporting_version = 1 AND u.active
      AND (u.role = 'ADMIN' OR EXISTS (SELECT 1 FROM public.store_access a WHERE a.user_id = u.id AND a.store_code = s.store_code))`, [storeCode, user.id]);
  const row = result.rows[0];
  if (!row) throw new ReportingError("Store reporting is unavailable or not accessible.", 403);
  return { schemaName: row.schema_name, storeCode, timezone: row.timezone };
}

export function parseJournalFilters(params: URLSearchParams) {
  const from = businessDate(params.get("from"));
  const to = businessDate(params.get("to"));
  if (from > to) throw new ReportingError("from must not be after to.");
  const transactionNumber = params.get("transaction_number") ?? "";
  if (transactionNumber.length > 50 || transactionNumber.includes("\u0000")) throw new ReportingError("Invalid transaction_number.");
  return { from, to, transactionNumber: transactionNumber.trim() };
}

export function parseJournalId(value: string) {
  if (!/^\d+$/.test(value) || value.length > 19 || BigInt(value) <= BigInt(0) || BigInt(value) > BigInt("9223372036854775807"))
    throw new ReportingError("Invalid transaction journal id.");
  return value;
}

const selectSql = `"id"::text AS id, "transactionid"::text AS transactionid, "transaction_date_time", "stationname", "transaction_number",
  "qty", "discount", "sub_total", "tax", "deposit", "total", "paid_by", "cashier", "lines", "credit_card", "paid_by_amounts"`;

function recordFrom(row: Record<string, unknown>): TransactionJournalRecord {
  return { id: String(row.id), ...storedTransactionJournal(row) };
}

export async function readJournalList(db: Pick<Client, "query">, scope: TransactionJournalScope, filters: { from: string; to: string; transactionNumber: string }) {
  const pattern = filters.transactionNumber.replace(/[\\%_]/g, (char) => `\\${char}`);
  const result = await db.query(
    `SELECT ${selectSql} FROM ${journalTable(scope.schemaName)}
     WHERE ("transaction_date_time" AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
       AND ($4::text = '' OR "transaction_number" ILIKE $4 ESCAPE '\\')
     ORDER BY "transaction_date_time" ASC, "id" ASC`,
    [scope.timezone, filters.from, filters.to, pattern ? `%${pattern}%` : ""],
  );
  return result.rows.map((row) => recordFrom(row as Record<string, unknown>));
}

export async function readJournalDetail(db: Pick<Client, "query">, scope: TransactionJournalScope, id: string): Promise<TransactionJournalRecord | null> {
  const result = await db.query(`SELECT ${selectSql} FROM ${journalTable(scope.schemaName)} WHERE "id" = $1::bigint`, [id]);
  if (!result.rowCount) return null;
  return recordFrom(result.rows[0] as Record<string, unknown>);
}
