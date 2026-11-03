import type { Client } from "pg";
import { quoteRetailIdent } from "./retail-columns.ts";
import { ReportingError, schemaIdentifier } from "./snapshot.ts";
import type { ReportingScope } from "./sync.ts";

export type MonthlySalesTaxRow = { cells: string[]; emphasize: boolean };
export type MonthlySalesTaxReport = {
  report_month: string;
  employee_name: string;
  columns: string[];
  rows: MonthlySalesTaxRow[];
};
export type MonthlySalesTaxSnapshot = { request_id: string; monthly_sales_tax: MonthlySalesTaxReport };
export type MonthlySalesTaxScope = ReportingScope & { timezone: string };
export type MonthlySalesTaxRead = {
  reportMonth: string;
  employeeName: string;
  columns: string[];
  rows: MonthlySalesTaxRow[];
};

const bodyKeys = new Set(["report_month", "employee_name", "columns", "rows"]);
const rowKeys = new Set(["cells", "emphasize"]);
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

function reportMonth(value: unknown, name = "report_month") {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value))
    throw new ReportingError(`${name} must be YYYY-MM.`);
  return value;
}

function header(value: unknown, index: number) {
  if (typeof value !== "string" || !value.trim() || value.includes("\u0000") || [...value].length > 80)
    throw new ReportingError(`Invalid columns[${index}].`);
  return value;
}

function amount(value: unknown, name: string) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match || (match[3] && match[3].length > 2) || match[2].length > 12)
    throw new ReportingError(`Invalid ${name}.`);
  const negative = match[1] === "-";
  const whole = match[2].replace(/^0+(?=\d)/, "");
  const cents = (match[3] ?? "").padEnd(2, "0");
  if (whole === "0" && cents === "00") return "0.00";
  return `${negative ? "-" : ""}${whole}.${cents}`;
}

function rowLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.includes("\u0000") || [...value].length > 40)
    throw new ReportingError("Invalid row label.");
  if (value === "Total") throw new ReportingError("A Total row is not stored.");
  return value;
}

function gridRow(value: unknown, columns: number, index: number): MonthlySalesTaxRow {
  if (!object(value) || Object.keys(value).some((key) => !rowKeys.has(key)))
    throw new ReportingError(`Invalid rows[${index}].`);
  if (!Array.isArray(value.cells) || value.cells.length !== columns)
    throw new ReportingError(`rows[${index}] must have ${columns} cells.`);
  if (value.emphasize !== undefined && typeof value.emphasize !== "boolean")
    throw new ReportingError(`Invalid rows[${index}] emphasize.`);
  return {
    cells: value.cells.map((cell, cellIndex) => cellIndex === 0 ? rowLabel(cell) : amount(cell, `rows[${index}].cells[${cellIndex}]`)),
    emphasize: value.emphasize === true,
  };
}

export function parseRetailMonthlySalesTax(value: unknown): MonthlySalesTaxSnapshot {
  if (Array.isArray(value) || !object(value) || !("request_id" in value) || !("monthly_sales_tax" in value) || Object.keys(value).some((key) => key !== "request_id" && key !== "monthly_sales_tax"))
    throw new ReportingError("Invalid monthly_sales_tax envelope.");
  if (!object(value.monthly_sales_tax) || Object.keys(value.monthly_sales_tax).some((key) => !bodyKeys.has(key)))
    throw new ReportingError("Invalid monthly_sales_tax.");
  const body = value.monthly_sales_tax;
  if (!Array.isArray(body.columns) || body.columns.length === 0 || body.columns.length > 80)
    throw new ReportingError("columns must be a non-empty array.");
  const columns = body.columns.map(header);
  if (columns[0] !== "Date") throw new ReportingError("The first column must be Date.");
  if (!Array.isArray(body.rows) || body.rows.length > 62)
    throw new ReportingError("rows must be an array with at most 62 rows.");
  const employee = body.employee_name === undefined ? "" : body.employee_name;
  if (typeof employee !== "string" || employee.includes("\u0000") || [...employee].length > 100)
    throw new ReportingError("Invalid employee_name.");
  return {
    request_id: requestId(value),
    monthly_sales_tax: {
      report_month: reportMonth(body.report_month),
      employee_name: employee,
      columns,
      rows: body.rows.map((row, index) => gridRow(row, columns.length, index)),
    },
  };
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

export function sumMonthlySalesTaxRows(rows: MonthlySalesTaxRow[]) {
  const width = Math.max(0, ...rows.map((row) => row.cells.length - 1));
  const totals = Array.from({ length: width }, () => zero);
  for (const row of rows) {
    for (let index = 0; index < width; index += 1) totals[index] += toCents(row.cells[index + 1] ?? "0.00");
  }
  return totals.map(fromCents);
}

function parseJson(value: unknown, name: string) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new ReportingError(`Invalid stored ${name}.`, 503);
  }
}

function monthFromDate(value: unknown) {
  const text = typeof value === "string" ? value : "";
  const match = /^(\d{4}-(?:0[1-9]|1[0-2]))-\d{2}/.exec(text);
  if (!match) throw new ReportingError("Invalid stored report_month.", 503);
  return match[1];
}

export function storedMonthlySalesTax(record: Record<string, unknown>): MonthlySalesTaxReport {
  return parseRetailMonthlySalesTax({
    request_id: "stored",
    monthly_sales_tax: {
      report_month: monthFromDate(record.report_month),
      employee_name: record.employee_name ?? "",
      columns: parseJson(record.columns, "columns"),
      rows: parseJson(record.rows, "rows"),
    },
  }).monthly_sales_tax;
}

function taxTable(schemaName: string) {
  return `${schemaIdentifier(schemaName)}.${quoteRetailIdent("tbl_monthly_sales_tax")}`;
}

function taxValues(report: MonthlySalesTaxReport) {
  return [`${report.report_month}-01`, report.employee_name, JSON.stringify(report.columns), JSON.stringify(report.rows)];
}

async function inTaxTransaction<T>(db: Pick<Client, "query">, scope: ReportingScope, id: string, work: () => Promise<T>) {
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
      `${scope.schemaName}:retail:monthly-sales-tax:${scope.storeCode}`,
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

export async function syncRetailMonthlySalesTax(db: Pick<Client, "query">, scope: ReportingScope, snapshot: MonthlySalesTaxSnapshot) {
  const month = snapshot.monthly_sales_tax.report_month;
  return inTaxTransaction(db, scope, month, async () => {
    const existing = await db.query(
      `SELECT "report_month"::text AS report_month, "employee_name", "columns", "rows"
       FROM ${taxTable(scope.schemaName)} WHERE "report_month" = $1::date FOR UPDATE`,
      [`${month}-01`],
    );
    if ((existing.rowCount ?? 0) > 1) throw new ReportingError("report_month is already duplicated in this store.", 409);
    const current = existing.rowCount ? storedMonthlySalesTax(existing.rows[0] as Record<string, unknown>) : null;
    if (current && JSON.stringify(current) === JSON.stringify(snapshot.monthly_sales_tax))
      return { status: "duplicate" as const, request_id: snapshot.request_id, report_month: month };
    const values = taxValues(snapshot.monthly_sales_tax);
    if (current) {
      const updated = await db.query(
        `UPDATE ${taxTable(scope.schemaName)} SET "employee_name" = $2, "columns" = $3::jsonb, "rows" = $4::jsonb
         WHERE "report_month" = $1::date`,
        values,
      );
      if (updated.rowCount !== 1) throw new ReportingError("Retail row update did not match one record.", 409);
    } else {
      await db.query(
        `INSERT INTO ${taxTable(scope.schemaName)} ("report_month", "employee_name", "columns", "rows")
         VALUES ($1::date, $2, $3::jsonb, $4::jsonb)`,
        values,
      );
    }
    return { status: "accepted" as const, request_id: snapshot.request_id, report_month: month };
  });
}

export async function resolveRetailMonthlySalesTaxScope(db: Pick<Client, "query">, user: { id: string }, storeCode: string): Promise<MonthlySalesTaxScope> {
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

export function parseMonthlySalesTaxMonth(params: URLSearchParams) {
  return reportMonth(params.get("month"), "month");
}

const emptyGrid = { employeeName: "", columns: [] as string[], rows: [] as MonthlySalesTaxRow[] };

export async function readMonthlySalesTax(db: Pick<Client, "query">, scope: MonthlySalesTaxScope, month: string): Promise<MonthlySalesTaxRead> {
  const result = await db.query(
    `SELECT "report_month"::text AS report_month, "employee_name", "columns", "rows"
     FROM ${taxTable(scope.schemaName)} WHERE "report_month" = $1::date`,
    [`${month}-01`],
  );
  if (!result.rowCount) return { reportMonth: month, ...emptyGrid };
  const report = storedMonthlySalesTax(result.rows[0] as Record<string, unknown>);
  return { reportMonth: report.report_month, employeeName: report.employee_name, columns: report.columns, rows: report.rows };
}
