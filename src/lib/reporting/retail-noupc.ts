import type { Client } from "pg";
import { quoteRetailIdent } from "./retail-columns.ts";
import { parseRetailValue } from "./retail-snapshot.ts";
import { ReportingError, businessDate, schemaIdentifier } from "./snapshot.ts";
import type { ReportingScope } from "./sync.ts";

export type NoUpcDetail = {
  department: string;
  transaction_no: string;
  product_name: string;
  sold_qty: string;
  retail_price: string;
  discount: string;
  subtotal: string;
  tax: string;
  total_amount: string;
  member_name: string;
  station_name: string;
  transaction_datetime: string;
  employee_user: string;
};
export type NoUpcSnapshot = { request_id: string; no_upc_detail: NoUpcDetail };
export type NoUpcRecord = NoUpcDetail & { id: string };
export type NoUpcScope = ReportingScope & { timezone: string };
export type NoUpcSubtotal = {
  discount: string;
  subtotal: string;
  tax: string;
  total_amount: string;
};
export type NoUpcGroup<T extends NoUpcDetail = NoUpcDetail> = {
  department: string;
  rows: T[];
  subtotal: NoUpcSubtotal;
};

const detailKeys = new Set([
  "department",
  "transaction_no",
  "product_name",
  "sold_qty",
  "retail_price",
  "discount",
  "subtotal",
  "tax",
  "total_amount",
  "member_name",
  "station_name",
  "transaction_datetime",
  "employee_user",
]);

const zero = BigInt(0);
const hundred = BigInt(100);

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requestId(value: Record<string, unknown>) {
  if (typeof value.request_id !== "string" || !value.request_id.trim() || value.request_id.length > 160 || value.request_id.includes("\u0000"))
    throw new ReportingError("request_id is required (maximum 160 characters).");
  return value.request_id;
}

function presentText(value: unknown, name: string, maxLength: number) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\u0000") || [...value].length > maxLength)
    throw new ReportingError(`Invalid ${name}.`);
  return value;
}

function optionalText(value: unknown, name: string, maxLength: number) {
  if (value === undefined || value === null || value === "") return "";
  return presentText(value, name, maxLength);
}

function timestamp(value: unknown, name: string) {
  return String(parseRetailValue({ name, kind: "timestamp", required: true, notNull: true }, value));
}

function money(value: unknown, name: string) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match || (match[3] && match[3].length > 2) || match[2].length > 12)
    throw new ReportingError(`Invalid ${name}.`);
  const whole = match[2].replace(/^0+(?=\d)/, "");
  const cents = (match[3] ?? "").padEnd(2, "0");
  if (whole === "0" && cents === "00") return "0.00";
  return `${match[1] === "-" ? "-" : ""}${whole}.${cents}`;
}

function soldQty(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match || match[2].length > 18) throw new ReportingError("Invalid sold_qty.");
  const whole = match[2].replace(/^0+(?=\d)/, "");
  const fraction = match[3];
  const numericZero = whole === "0" && (fraction === undefined || /^0+$/.test(fraction));
  const sign = match[1] === "-" ? "-" : "";
  const text = fraction === undefined
    ? (numericZero ? "0" : `${sign}${whole}`)
    : (numericZero ? `0.${fraction}` : `${sign}${whole}.${fraction}`);
  if ([...text].length > 20) throw new ReportingError("Invalid sold_qty.");
  return text;
}

function detail(body: Record<string, unknown>): NoUpcDetail {
  return {
    department: presentText(body.department, "department", 100),
    transaction_no: presentText(body.transaction_no, "transaction_no", 50),
    product_name: presentText(body.product_name, "product_name", 200),
    sold_qty: soldQty(body.sold_qty),
    retail_price: money(body.retail_price, "retail_price"),
    discount: money(body.discount, "discount"),
    subtotal: money(body.subtotal, "subtotal"),
    tax: money(body.tax, "tax"),
    total_amount: money(body.total_amount, "total_amount"),
    member_name: optionalText(body.member_name, "member_name", 100),
    station_name: optionalText(body.station_name, "station_name", 50),
    transaction_datetime: timestamp(body.transaction_datetime, "transaction_datetime"),
    employee_user: optionalText(body.employee_user, "employee_user", 50),
  };
}

export function parseRetailNoUpc(value: unknown): NoUpcSnapshot {
  if (Array.isArray(value) || !object(value) || !("request_id" in value) || !("no_upc_detail" in value) || Object.keys(value).some((key) => key !== "request_id" && key !== "no_upc_detail"))
    throw new ReportingError("Invalid no_upc_detail envelope.");
  if (!object(value.no_upc_detail)) throw new ReportingError("Invalid no_upc_detail.");
  if (Object.keys(value.no_upc_detail).some((key) => !detailKeys.has(key))) throw new ReportingError("Unknown no_upc_detail field.");
  return { request_id: requestId(value), no_upc_detail: detail(value.no_upc_detail) };
}

function storedTime(value: unknown, name: string) {
  const date = value instanceof Date ? value : new Date(typeof value === "string" || typeof value === "number" ? value : "");
  if (!Number.isFinite(date.getTime())) throw new ReportingError(`Invalid stored ${name}.`, 503);
  return date.toISOString();
}

export function storedNoUpc(record: Record<string, unknown>): NoUpcDetail {
  return parseRetailNoUpc({
    request_id: "stored",
    no_upc_detail: {
      department: record.department,
      transaction_no: record.transaction_no,
      product_name: record.product_name,
      sold_qty: record.sold_qty,
      retail_price: String(record.retail_price),
      discount: String(record.discount),
      subtotal: String(record.subtotal),
      tax: String(record.tax),
      total_amount: String(record.total_amount),
      member_name: record.member_name ?? "",
      station_name: record.station_name ?? "",
      transaction_datetime: storedTime(record.transaction_datetime, "transaction_datetime"),
      employee_user: record.employee_user ?? "",
    },
  }).no_upc_detail;
}

function toCents(value: string) {
  const match = /^(-?)(\d+)\.(\d{2})$/.exec(value);
  if (!match) return zero;
  const cents = BigInt(match[2]) * hundred + BigInt(match[3]);
  return match[1] === "-" ? -cents : cents;
}

function fromCents(cents: bigint) {
  const negative = cents < zero;
  const abs = negative ? -cents : cents;
  return `${negative ? "-" : ""}${abs / hundred}.${(abs % hundred).toString().padStart(2, "0")}`;
}

export function groupNoUpcRows<T extends NoUpcDetail>(rows: T[]): Array<NoUpcGroup<T>> {
  const groups: Array<NoUpcGroup<T>> = [];
  const index = new Map<string, NoUpcGroup<T>>();
  for (const row of rows) {
    let group = index.get(row.department);
    if (!group) {
      group = {
        department: row.department,
        rows: [],
        subtotal: { discount: "0.00", subtotal: "0.00", tax: "0.00", total_amount: "0.00" },
      };
      index.set(row.department, group);
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups.map((group) => {
    let discount = zero;
    let subtotal = zero;
    let tax = zero;
    let totalAmount = zero;
    for (const row of group.rows) {
      discount += toCents(row.discount);
      subtotal += toCents(row.subtotal);
      tax += toCents(row.tax);
      totalAmount += toCents(row.total_amount);
    }
    return {
      department: group.department,
      rows: group.rows,
      subtotal: {
        discount: fromCents(discount),
        subtotal: fromCents(subtotal),
        tax: fromCents(tax),
        total_amount: fromCents(totalAmount),
      },
    };
  });
}

export function formatNoUpcStamp(iso: string, timeZone: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`;
}

function detailTable(schemaName: string) {
  return `${schemaIdentifier(schemaName)}.${quoteRetailIdent("tbl_noupc_detail")}`;
}

function detailValues(row: NoUpcDetail) {
  return [
    row.department, row.transaction_no, row.product_name, row.sold_qty, row.retail_price, row.discount,
    row.subtotal, row.tax, row.total_amount, row.member_name, row.station_name, row.transaction_datetime, row.employee_user,
  ];
}

function lineKey(row: NoUpcDetail) {
  return `${row.transaction_no}\u001f${row.product_name}\u001f${row.transaction_datetime}`;
}

async function inDetailTransaction<T>(db: Pick<Client, "query">, scope: ReportingScope, id: string, work: () => Promise<T>) {
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
      `${scope.schemaName}:retail:no-upc:${scope.storeCode}`,
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

export async function syncRetailNoUpc(db: Pick<Client, "query">, scope: ReportingScope, snapshot: NoUpcSnapshot) {
  const row = snapshot.no_upc_detail;
  return inDetailTransaction(db, scope, lineKey(row), async () => {
    const existing = await db.query(
      `SELECT * FROM ${detailTable(scope.schemaName)}
       WHERE "transaction_no" = $1 AND "product_name" = $2 AND "transaction_datetime" = $3::timestamptz
       FOR UPDATE`,
      [row.transaction_no, row.product_name, row.transaction_datetime],
    );
    if ((existing.rowCount ?? 0) > 1) throw new ReportingError("This NoUPC line is already duplicated in this store.", 409);
    const current = existing.rowCount ? storedNoUpc(existing.rows[0] as Record<string, unknown>) : null;
    if (current && JSON.stringify(current) === JSON.stringify(row))
      return { status: "duplicate" as const, request_id: snapshot.request_id, transaction_no: row.transaction_no };
    const values = detailValues(row);
    if (current) {
      const updated = await db.query(
        `UPDATE ${detailTable(scope.schemaName)} SET
          "department" = $1, "sold_qty" = $4, "retail_price" = $5::numeric, "discount" = $6::numeric,
          "subtotal" = $7::numeric, "tax" = $8::numeric, "total_amount" = $9::numeric,
          "member_name" = $10, "station_name" = $11, "employee_user" = $13
         WHERE "transaction_no" = $2 AND "product_name" = $3 AND "transaction_datetime" = $12::timestamptz`,
        values,
      );
      if (updated.rowCount !== 1) throw new ReportingError("Retail row update did not match one record.", 409);
    } else {
      await db.query(
        `INSERT INTO ${detailTable(scope.schemaName)} (
          "department", "transaction_no", "product_name", "sold_qty", "retail_price", "discount",
          "subtotal", "tax", "total_amount", "member_name", "station_name", "transaction_datetime", "employee_user"
        ) VALUES (
          $1, $2, $3, $4, $5::numeric, $6::numeric, $7::numeric, $8::numeric, $9::numeric, $10, $11, $12::timestamptz, $13
        )`,
        values,
      );
    }
    return { status: "accepted" as const, request_id: snapshot.request_id, transaction_no: row.transaction_no };
  });
}

export async function resolveRetailNoUpcScope(db: Pick<Client, "query">, user: { id: string }, storeCode: string): Promise<NoUpcScope> {
  const result = await db.query<{ schema_name: string; timezone: string }>(`
    SELECT r.schema_name, s.timezone
    FROM public.stores s JOIN public.store_reporting_schemas r ON r.store_code = s.store_code
    JOIN public.auth_users u ON u.id = $2
    WHERE s.store_code = $1 AND s.active AND s.store_type = 'RETAIL' AND r.reporting_version = 1 AND u.active
      AND (u.role = 'ADMIN' OR EXISTS (SELECT 1 FROM public.store_access a WHERE a.user_id = u.id AND a.store_code = s.store_code))`, [storeCode, user.id]);
  const scope = result.rows[0];
  if (!scope) throw new ReportingError("Store reporting is unavailable or not accessible.", 403);
  return { schemaName: scope.schema_name, storeCode, timezone: scope.timezone };
}

export function parseNoUpcFilters(params: URLSearchParams) {
  const from = businessDate(params.get("from"));
  const to = businessDate(params.get("to"));
  if (from > to) throw new ReportingError("from must not be after to.");
  return { from, to };
}

const selectSql = `"id"::text AS id, "department", "transaction_no", "product_name", "sold_qty",
  "retail_price"::text AS retail_price, "discount"::text AS discount, "subtotal"::text AS subtotal,
  "tax"::text AS tax, "total_amount"::text AS total_amount, "member_name", "station_name",
  "transaction_datetime", "employee_user"`;

export async function readNoUpcList(db: Pick<Client, "query">, scope: NoUpcScope, filters: { from: string; to: string }) {
  const result = await db.query(
    `SELECT ${selectSql} FROM ${detailTable(scope.schemaName)}
     WHERE ("transaction_datetime" AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
     ORDER BY "transaction_datetime" DESC, "id" DESC`,
    [scope.timezone, filters.from, filters.to],
  );
  return result.rows.map((row) => {
    const record = row as Record<string, unknown>;
    return { id: String(record.id), ...storedNoUpc(record) };
  });
}
