import type { Client } from "pg";
import { quoteRetailIdent } from "./retail-columns.ts";
import { parseRetailValue } from "./retail-snapshot.ts";
import { ReportingError, businessDate, schemaIdentifier } from "./snapshot.ts";
import type { ReportingScope } from "./sync.ts";

export type CardTender = "credit" | "debit" | "external";
export type CreditCardDetail = {
  transactionid: string;
  card_datetime: string;
  card_name: string;
  card_no: string;
  cust_name: string | null;
  result: string | null;
  amount: string;
  exp_date: string | null;
  auth_code: string;
  name_on_card: string | null;
  station_name: string;
  tender: CardTender;
  transaction_type: string | null;
};
export type CreditCardSnapshot = { request_id: string; credit_card: CreditCardDetail };
export type CreditCardRecord = CreditCardDetail & { id: string };
export type CreditCardScope = ReportingScope & { timezone: string };

const cardKeys = new Set([
  "transactionid",
  "card_datetime",
  "card_name",
  "card_no",
  "cust_name",
  "result",
  "amount",
  "exp_date",
  "auth_code",
  "name_on_card",
  "station_name",
  "tender",
  "transaction_type",
]);

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requestId(value: Record<string, unknown>) {
  if (typeof value.request_id !== "string" || !value.request_id.trim() || value.request_id.length > 160 || value.request_id.includes("\u0000"))
    throw new ReportingError("request_id is required (maximum 160 characters).");
  return value.request_id;
}

function boundedText(value: unknown, name: string, maxLength: number) {
  if (typeof value !== "string" || value.includes("\u0000") || [...value].length > maxLength)
    throw new ReportingError(`Invalid ${name}.`);
  return value;
}

function requiredText(value: unknown, name: string, maxLength: number) {
  if (value === undefined) return "";
  return boundedText(value, name, maxLength);
}

function optionalText(value: unknown, name: string, maxLength: number) {
  if (value === undefined || value === null || value === "") return null;
  return boundedText(value, name, maxLength);
}

function positiveBigint(value: unknown, name: string) {
  const parsed = String(parseRetailValue({ name, kind: "bigint", required: true, notNull: true }, value));
  if (BigInt(parsed) <= BigInt(0)) throw new ReportingError(`${name} must be a positive id.`);
  return parsed;
}

function timestamp(value: unknown, name: string) {
  return String(parseRetailValue({ name, kind: "timestamp", required: true, notNull: true }, value));
}

function amount(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match || match[3] && match[3].length > 2 || match[2].length > 12)
    throw new ReportingError("Invalid amount.");
  const negative = match[1] === "-";
  const whole = match[2].replace(/^0+(?=\d)/, "");
  const cents = (match[3] ?? "").padEnd(2, "0");
  if (whole === "0" && cents === "00") return "0.00";
  return `${negative ? "-" : ""}${whole}.${cents}`;
}

function tender(value: unknown): CardTender {
  if (value === "credit" || value === "debit" || value === "external") return value;
  throw new ReportingError("tender must be credit, debit, or external.");
}

export function parseRetailCreditCard(value: unknown): CreditCardSnapshot {
  if (Array.isArray(value) || !object(value) || !("request_id" in value) || !("credit_card" in value) || Object.keys(value).some((key) => key !== "request_id" && key !== "credit_card"))
    throw new ReportingError("Invalid credit_card envelope.");
  if (!object(value.credit_card)) throw new ReportingError("Invalid credit_card.");
  if (Object.keys(value.credit_card).some((key) => !cardKeys.has(key))) throw new ReportingError("Unknown credit_card field.");
  const body = value.credit_card;
  const kind = tender(body.tender);
  const transactionType = optionalText(body.transaction_type, "transaction_type", 50);
  if ((kind === "external") !== (transactionType !== null))
    throw new ReportingError("transaction_type is required only for an external tender.");
  return {
    request_id: requestId(value),
    credit_card: {
      transactionid: positiveBigint(body.transactionid, "transactionid"),
      card_datetime: timestamp(body.card_datetime, "card_datetime"),
      card_name: requiredText(body.card_name, "card_name", 30),
      card_no: requiredText(body.card_no, "card_no", 20),
      cust_name: optionalText(body.cust_name, "cust_name", 100),
      result: optionalText(body.result, "result", 30),
      amount: amount(body.amount),
      exp_date: optionalText(body.exp_date, "exp_date", 10),
      auth_code: requiredText(body.auth_code, "auth_code", 30),
      name_on_card: optionalText(body.name_on_card, "name_on_card", 100),
      station_name: requiredText(body.station_name, "station_name", 50),
      tender: kind,
      transaction_type: transactionType,
    },
  };
}

function storedTime(value: unknown, name: string) {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(typeof value === "string" || typeof value === "number" ? value : "");
  if (!Number.isFinite(date.getTime())) throw new ReportingError(`Invalid stored ${name}.`, 503);
  return date.toISOString();
}

export function storedCreditCard(record: Record<string, unknown>): CreditCardDetail {
  const when = storedTime(record.card_datetime, "card_datetime");
  if (!when) throw new ReportingError("Invalid stored credit card.", 503);
  return parseRetailCreditCard({
    request_id: "stored",
    credit_card: {
      transactionid: String(record.transactionid),
      card_datetime: when,
      card_name: record.card_name ?? "",
      card_no: record.card_no ?? "",
      cust_name: record.cust_name ?? null,
      result: record.result ?? null,
      amount: String(record.amount),
      exp_date: record.exp_date ?? null,
      auth_code: record.auth_code ?? "",
      name_on_card: record.name_on_card ?? null,
      station_name: record.station_name ?? "",
      tender: record.tender,
      transaction_type: record.transaction_type ?? null,
    },
  }).credit_card;
}

function cardTable(schemaName: string) {
  return `${schemaIdentifier(schemaName)}.${quoteRetailIdent("tbl_creditcard_detail")}`;
}

function cardValues(row: CreditCardDetail) {
  return [
    row.transactionid,
    row.card_datetime,
    row.card_name,
    row.card_no,
    row.cust_name,
    row.result,
    row.amount,
    row.exp_date,
    row.auth_code,
    row.name_on_card,
    row.station_name,
    row.tender,
    row.transaction_type,
  ];
}

async function inCardTransaction<T>(db: Pick<Client, "query">, scope: ReportingScope, id: string, work: () => Promise<T>) {
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
      `${scope.schemaName}:retail:credit-card:${scope.storeCode}`,
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

export async function syncRetailCreditCard(db: Pick<Client, "query">, scope: ReportingScope, snapshot: CreditCardSnapshot) {
  const transactionid = snapshot.credit_card.transactionid;
  return inCardTransaction(db, scope, transactionid, async () => {
    const existing = await db.query(`SELECT * FROM ${cardTable(scope.schemaName)} WHERE "transactionid" = $1::bigint FOR UPDATE`, [transactionid]);
    if ((existing.rowCount ?? 0) > 1) throw new ReportingError("transactionid is already duplicated in this store.", 409);
    const current = existing.rowCount ? storedCreditCard(existing.rows[0] as Record<string, unknown>) : null;
    if (current && JSON.stringify(current) === JSON.stringify(snapshot.credit_card))
      return { status: "duplicate" as const, request_id: snapshot.request_id, transactionid };
    const values = cardValues(snapshot.credit_card);
    if (current) {
      const updated = await db.query(
        `UPDATE ${cardTable(scope.schemaName)} SET
          "card_datetime" = $2::timestamptz, "card_name" = $3, "card_no" = $4, "cust_name" = $5, "result" = $6,
          "amount" = $7::numeric, "exp_date" = $8, "auth_code" = $9, "name_on_card" = $10, "station_name" = $11,
          "tender" = $12, "transaction_type" = $13
         WHERE "transactionid" = $1::bigint`,
        values,
      );
      if (updated.rowCount !== 1) throw new ReportingError("Retail row update did not match one record.", 409);
    } else {
      await db.query(
        `INSERT INTO ${cardTable(scope.schemaName)} (
          "transactionid", "card_datetime", "card_name", "card_no", "cust_name", "result", "amount",
          "exp_date", "auth_code", "name_on_card", "station_name", "tender", "transaction_type"
        ) VALUES (
          $1::bigint, $2::timestamptz, $3, $4, $5, $6, $7::numeric, $8, $9, $10, $11, $12, $13
        )`,
        values,
      );
    }
    return { status: "accepted" as const, request_id: snapshot.request_id, transactionid };
  });
}

export async function resolveRetailCreditCardScope(db: Pick<Client, "query">, user: { id: string }, storeCode: string): Promise<CreditCardScope> {
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

export function parseCreditCardFilters(params: URLSearchParams) {
  const from = businessDate(params.get("from"));
  const to = businessDate(params.get("to"));
  if (from > to) throw new ReportingError("from must not be after to.");
  return { from, to };
}

const selectSql = `"id"::text AS id, "transactionid"::text AS transactionid, "card_datetime", "card_name", "card_no",
  "cust_name", "result", "amount"::text AS amount, "exp_date", "auth_code", "name_on_card", "station_name", "tender", "transaction_type"`;

export async function readCreditCardList(db: Pick<Client, "query">, scope: CreditCardScope, filters: { from: string; to: string }) {
  const result = await db.query(
    `SELECT ${selectSql} FROM ${cardTable(scope.schemaName)}
     WHERE ("card_datetime" AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
     ORDER BY "card_datetime" ASC, "id" ASC`,
    [scope.timezone, filters.from, filters.to],
  );
  return result.rows.map((row) => {
    const record = row as Record<string, unknown>;
    return { id: String(record.id), ...storedCreditCard(record) };
  });
}
