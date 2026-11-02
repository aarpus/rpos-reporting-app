import type { Client } from "pg";
import { quoteRetailIdent } from "./retail-columns.ts";
import { parseRetailValue } from "./retail-snapshot.ts";
import { ReportingError, businessDate, schemaIdentifier } from "./snapshot.ts";
import type { ReportingScope } from "./sync.ts";

export type DayEndLine = { label: string; value: string };
export type DayEndDepartment = {
  trans: string;
  name: string;
  quantity: string;
  discountAmount: string;
  discountPercent: string;
  subTotal: string;
  tax: string;
  total: string;
  share: string;
};
export type DayEndTax = {
  name: string;
  quantity: string;
  rate: string;
  taxable: string;
  tax: string;
  share: string;
};
export type DayEndCashAcceptor = {
  name: string;
  openingRecycler: string;
  closingRecycler: string;
  openingCashbox: string;
  closingCashbox: string;
};
export type DayEndEmployee = { name: string; clockIn: string; clockOut: string; total: string };
export type DayEndMiscellaneous = {
  terminal: string;
  noSale: string;
  voidCount: string;
  voidAmount: string;
  returnCount: string;
  returnDeposit: string;
  returnTax: string;
  returnAmount: string;
};
export type DayEndPromotion = {
  name: string;
  count: string;
  quantity: string;
  beforeSale: string;
  discount: string;
  afterSale: string;
};
export type DayEndAmount = { rows: DayEndLine[]; total: string };
export type DayEndReport = {
  batchid: string;
  batch_number: number;
  start_date_time: string;
  end_date_time: string | null;
  status: "Open" | "Close";
  employeename: string | null;
  department_sales: { rows: DayEndDepartment[]; total: DayEndDepartment | null };
  sales_summary: DayEndLine[];
  cash_status: DayEndLine[];
  sales_breakdown: DayEndLine[];
  paid_out: DayEndAmount;
  paid_in: DayEndAmount;
  tax_detail: { rows: DayEndTax[]; total: DayEndTax | null };
  cash_acceptor: DayEndCashAcceptor[];
  employee_status: DayEndEmployee[];
  miscellaneous: DayEndMiscellaneous[];
  promotion_summary: DayEndPromotion[];
};
export type DayEndSnapshot = { request_id: string; day_end: DayEndReport };
export type DayEndRecord = DayEndReport & { id: string };
export type DayEndScope = ReportingScope & { timezone: string };

const dayEndKeys = new Set([
  "batchid",
  "batch_number",
  "start_date_time",
  "end_date_time",
  "status",
  "employeename",
  "department_sales",
  "sales_summary",
  "cash_status",
  "sales_breakdown",
  "paid_out",
  "paid_in",
  "tax_detail",
  "cash_acceptor",
  "employee_status",
  "miscellaneous",
  "promotion_summary",
]);

const departmentKeys = ["trans", "name", "quantity", "discountAmount", "discountPercent", "subTotal", "tax", "total", "share"] as const;
const taxKeys = ["name", "quantity", "rate", "taxable", "tax", "share"] as const;
const acceptorKeys = ["name", "openingRecycler", "closingRecycler", "openingCashbox", "closingCashbox"] as const;
const employeeKeys = ["name", "clockIn", "clockOut", "total"] as const;
const miscellaneousKeys = ["terminal", "noSale", "voidCount", "voidAmount", "returnCount", "returnDeposit", "returnTax", "returnAmount"] as const;
const promotionKeys = ["name", "count", "quantity", "beforeSale", "discount", "afterSale"] as const;

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

function cellText(value: unknown, name: string, maxLength: number) {
  if (typeof value !== "string" || value.includes("\u0000") || [...value].length > maxLength)
    throw new ReportingError(`Invalid ${name}.`);
  return value;
}

function optionalText(value: unknown, name: string, maxLength: number) {
  if (value === undefined || value === null) return null;
  return text(value, name, maxLength);
}

function positiveBigint(value: unknown, name: string) {
  const parsed = String(parseRetailValue({ name, kind: "bigint", required: true, notNull: true }, value));
  if (BigInt(parsed) <= BigInt(0)) throw new ReportingError(`${name} must be a positive id.`);
  return parsed;
}

function positiveInteger(value: unknown, name: string) {
  const parsed = Number(parseRetailValue({ name, kind: "integer", required: true, notNull: true }, value));
  if (parsed <= 0) throw new ReportingError(`${name} must be a positive id.`);
  return parsed;
}

function timestamp(value: unknown, name: string) {
  return String(parseRetailValue({ name, kind: "timestamp", required: true, notNull: true }, value));
}

function line(value: unknown, name: string): DayEndLine {
  if (!object(value) || Object.keys(value).some((key) => key !== "label" && key !== "value"))
    throw new ReportingError(`Invalid ${name} line.`);
  return { label: text(value.label, `${name} label`, 80), value: cellText(value.value, `${name} value`, 40) };
}

function lines(value: unknown, name: string): DayEndLine[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 200) throw new ReportingError(`${name} must be an array with at most 200 lines.`);
  return value.map((item) => line(item, name));
}

function cells<T extends string>(value: unknown, name: string, keys: readonly T[]): Record<T, string> {
  if (!object(value) || keys.some((key) => !(key in value)) || Object.keys(value).some((key) => !keys.includes(key as T)))
    throw new ReportingError(`Invalid ${name} row.`);
  return Object.fromEntries(keys.map((key) => [key, cellText(value[key], `${name} ${key}`, 80)])) as Record<T, string>;
}

function tableRows<T extends string>(value: unknown, name: string, keys: readonly T[]) {
  if (!Array.isArray(value) || value.length > 200) throw new ReportingError(`${name} must be an array with at most 200 rows.`);
  return value.map((row) => cells(row, name, keys));
}

function grouped<T extends string>(value: unknown, name: string, keys: readonly T[], emptyTotal: null | ""): { rows: Array<Record<T, string>>; total: Record<T, string> | null } | DayEndAmount {
  if (value === undefined) return emptyTotal === null ? { rows: [], total: null } : { rows: [], total: "" };
  if (!object(value) || Object.keys(value).some((key) => key !== "rows" && key !== "total"))
    throw new ReportingError(`Invalid ${name}.`);
  if (emptyTotal === "") {
    return { rows: lines(value.rows ?? [], name), total: value.total === undefined || value.total === null || value.total === "" ? "" : text(value.total, `${name} total`, 40) };
  }
  return {
    rows: tableRows(value.rows ?? [], name, keys),
    total: value.total === undefined || value.total === null ? null : cells(value.total, name, keys),
  };
}

export function parseRetailDayEnd(value: unknown): DayEndSnapshot {
  if (Array.isArray(value) || !object(value) || !("request_id" in value) || !("day_end" in value) || Object.keys(value).some((key) => key !== "request_id" && key !== "day_end"))
    throw new ReportingError("Invalid day_end envelope.");
  if (!object(value.day_end)) throw new ReportingError("Invalid day_end.");
  if (Object.keys(value.day_end).some((key) => !dayEndKeys.has(key))) throw new ReportingError("Unknown day_end field.");
  const status = value.day_end.status;
  if (status !== "Open" && status !== "Close") throw new ReportingError("Invalid status.");
  const end_date_time = value.day_end.end_date_time === undefined || value.day_end.end_date_time === null
    ? null
    : timestamp(value.day_end.end_date_time, "end_date_time");
  if (status === "Close" && !end_date_time) throw new ReportingError("end_date_time is required when status is Close.");
  const department = grouped(value.day_end.department_sales, "department_sales", departmentKeys, null) as { rows: DayEndDepartment[]; total: DayEndDepartment | null };
  const tax = grouped(value.day_end.tax_detail, "tax_detail", taxKeys, null) as { rows: DayEndTax[]; total: DayEndTax | null };
  return {
    request_id: requestId(value),
    day_end: {
      batchid: positiveBigint(value.day_end.batchid, "batchid"),
      batch_number: positiveInteger(value.day_end.batch_number, "batch_number"),
      start_date_time: timestamp(value.day_end.start_date_time, "start_date_time"),
      end_date_time,
      status,
      employeename: optionalText(value.day_end.employeename, "employeename", 100),
      department_sales: department,
      sales_summary: lines(value.day_end.sales_summary, "sales_summary"),
      cash_status: lines(value.day_end.cash_status, "cash_status"),
      sales_breakdown: lines(value.day_end.sales_breakdown, "sales_breakdown"),
      paid_out: grouped(value.day_end.paid_out, "paid_out", departmentKeys, "") as DayEndAmount,
      paid_in: grouped(value.day_end.paid_in, "paid_in", departmentKeys, "") as DayEndAmount,
      tax_detail: tax,
      cash_acceptor: (value.day_end.cash_acceptor === undefined ? [] : tableRows(value.day_end.cash_acceptor, "cash_acceptor", acceptorKeys)) as DayEndCashAcceptor[],
      employee_status: (value.day_end.employee_status === undefined ? [] : tableRows(value.day_end.employee_status, "employee_status", employeeKeys)) as DayEndEmployee[],
      miscellaneous: (value.day_end.miscellaneous === undefined ? [] : tableRows(value.day_end.miscellaneous, "miscellaneous", miscellaneousKeys)) as DayEndMiscellaneous[],
      promotion_summary: (value.day_end.promotion_summary === undefined ? [] : tableRows(value.day_end.promotion_summary, "promotion_summary", promotionKeys)) as DayEndPromotion[],
    },
  };
}

function sameReport(left: DayEndReport, right: DayEndReport) {
  return JSON.stringify(left) === JSON.stringify(right);
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

export function storedDayEnd(record: Record<string, unknown>): DayEndReport {
  const status = record.status;
  if (status !== "Open" && status !== "Close") throw new ReportingError("Invalid stored status.", 503);
  const batchNumber = Number(record.batch_number);
  const start = storedTime(record.start_date_time, "start_date_time");
  if (!Number.isSafeInteger(batchNumber) || batchNumber <= 0 || !start) throw new ReportingError("Invalid stored day-end report.", 503);
  const parsed = parseRetailDayEnd({
    request_id: "stored",
    day_end: {
      batchid: String(record.batchid),
      batch_number: batchNumber,
      start_date_time: start,
      end_date_time: storedTime(record.end_date_time, "end_date_time"),
      status,
      employeename: record.employeename ?? null,
      department_sales: parseJson(record.department_sales, "department_sales"),
      sales_summary: parseJson(record.sales_summary, "sales_summary"),
      cash_status: parseJson(record.cash_status, "cash_status"),
      sales_breakdown: parseJson(record.sales_breakdown, "sales_breakdown"),
      paid_out: parseJson(record.paid_out, "paid_out"),
      paid_in: parseJson(record.paid_in, "paid_in"),
      tax_detail: parseJson(record.tax_detail, "tax_detail"),
      cash_acceptor: parseJson(record.cash_acceptor, "cash_acceptor"),
      employee_status: parseJson(record.employee_status, "employee_status"),
      miscellaneous: parseJson(record.miscellaneous, "miscellaneous"),
      promotion_summary: parseJson(record.promotion_summary, "promotion_summary"),
    },
  });
  return parsed.day_end;
}

function dayEndTable(schemaName: string) {
  return `${schemaIdentifier(schemaName)}.${quoteRetailIdent("tbl_day_end_report")}`;
}

const jsonColumns = [
  "department_sales",
  "sales_summary",
  "cash_status",
  "sales_breakdown",
  "paid_out",
  "paid_in",
  "tax_detail",
  "cash_acceptor",
  "employee_status",
  "miscellaneous",
  "promotion_summary",
] as const;

function dayEndValues(report: DayEndReport) {
  return [
    report.batchid,
    report.batch_number,
    report.start_date_time,
    report.end_date_time,
    report.status,
    report.employeename,
    ...jsonColumns.map((column) => JSON.stringify(report[column])),
  ];
}

async function inDayEndTransaction<T>(db: Pick<Client, "query">, scope: ReportingScope, id: string, work: () => Promise<T>) {
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
      `${scope.schemaName}:retail:day-end:${scope.storeCode}`,
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

export async function syncRetailDayEnd(db: Pick<Client, "query">, scope: ReportingScope, snapshot: DayEndSnapshot) {
  const batchid = snapshot.day_end.batchid;
  return inDayEndTransaction(db, scope, batchid, async () => {
    const existing = await db.query(
      `SELECT * FROM ${dayEndTable(scope.schemaName)} WHERE "batchid" = $1::bigint FOR UPDATE`,
      [batchid],
    );
    if ((existing.rowCount ?? 0) > 1) throw new ReportingError("batchid is already duplicated in this store.", 409);
    const current = existing.rowCount ? storedDayEnd(existing.rows[0] as Record<string, unknown>) : null;
    if (current && sameReport(current, snapshot.day_end))
      return { status: "duplicate" as const, request_id: snapshot.request_id, batchid };
    const values = dayEndValues(snapshot.day_end);
    const jsonSets = jsonColumns.map((column, index) => `"${column}" = $${index + 7}::jsonb`).join(", ");
    if (current) {
      const updated = await db.query(
        `UPDATE ${dayEndTable(scope.schemaName)} SET
          "batch_number" = $2::integer, "start_date_time" = $3::timestamptz, "end_date_time" = $4::timestamptz,
          "status" = $5, "employeename" = $6, ${jsonSets}
         WHERE "batchid" = $1::bigint`,
        values,
      );
      if (updated.rowCount !== 1) throw new ReportingError("Retail row update did not match one record.", 409);
    } else {
      const names = ["batchid", "batch_number", "start_date_time", "end_date_time", "status", "employeename", ...jsonColumns];
      const casts = ["$1::bigint", "$2::integer", "$3::timestamptz", "$4::timestamptz", "$5", "$6", ...jsonColumns.map((_, index) => `$${index + 7}::jsonb`)];
      await db.query(
        `INSERT INTO ${dayEndTable(scope.schemaName)} (${names.map((name) => `"${name}"`).join(", ")}) VALUES (${casts.join(", ")})`,
        values,
      );
    }
    return { status: "accepted" as const, request_id: snapshot.request_id, batchid };
  });
}

export async function resolveRetailDayEndScope(db: Pick<Client, "query">, user: { id: string }, storeCode: string): Promise<DayEndScope> {
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

export function parseDayEndFilters(params: URLSearchParams) {
  const from = businessDate(params.get("from"));
  const to = businessDate(params.get("to"));
  if (from > to) throw new ReportingError("from must not be after to.");
  return { from, to };
}

export function parseDayEndId(value: string) {
  if (!/^\d+$/.test(value) || value.length > 19 || BigInt(value) <= BigInt(0) || BigInt(value) > BigInt("9223372036854775807"))
    throw new ReportingError("Invalid day-end report id.");
  return value;
}

const selectSql = `"id"::text AS id, "batchid"::text AS batchid, "batch_number", "start_date_time", "end_date_time", "status", "employeename",
  "department_sales", "sales_summary", "cash_status", "sales_breakdown", "paid_out", "paid_in", "tax_detail",
  "cash_acceptor", "employee_status", "miscellaneous", "promotion_summary"`;

function recordFrom(row: Record<string, unknown>): DayEndRecord {
  return { id: String(row.id), ...storedDayEnd(row) };
}

export async function readDayEndList(db: Pick<Client, "query">, scope: DayEndScope, filters: { from: string; to: string }) {
  const result = await db.query(
    `SELECT ${selectSql} FROM ${dayEndTable(scope.schemaName)}
     WHERE ("start_date_time" AT TIME ZONE $1)::date <= $3::date
       AND ("end_date_time" IS NULL OR ("end_date_time" AT TIME ZONE $1)::date >= $2::date)
     ORDER BY "start_date_time" ASC, "id" ASC`,
    [scope.timezone, filters.from, filters.to],
  );
  return result.rows.map((row) => recordFrom(row as Record<string, unknown>));
}

export async function readDayEndDetail(db: Pick<Client, "query">, scope: DayEndScope, id: string): Promise<DayEndRecord | null> {
  const result = await db.query(`SELECT ${selectSql} FROM ${dayEndTable(scope.schemaName)} WHERE "id" = $1::bigint`, [id]);
  if (!result.rowCount) return null;
  return recordFrom(result.rows[0] as Record<string, unknown>);
}
