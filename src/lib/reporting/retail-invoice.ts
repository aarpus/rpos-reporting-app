import type { Client } from "pg";
import { quoteRetailIdent } from "./retail-columns.ts";
import { parseRetailValue } from "./retail-snapshot.ts";
import { ReportingError, businessDate, schemaIdentifier } from "./snapshot.ts";
import type { ReportingScope } from "./sync.ts";

export type InvoiceType = "RC" | "OP";
export type InvoiceStatus = "Unpaid" | "Paid" | "OP";
export type InvoiceLine = {
  product_item_no: string;
  product_name: string;
  supplier_item_no: string;
  qty: string;
  case_cost: string;
  total: string;
};
export type InvoiceProfitLine = {
  product_no: string;
  product_name: string;
  supplier_item_no: string;
  inv_qty: string;
  cost: string;
  unit_cost: string;
  ext_cost: string;
  unit_retail: string;
  case_retail: string;
  ext_retail: string;
  profit_amount: string;
  profit_percent: string;
};
export type InvoiceProfitTotals = {
  ext_cost: string;
  ext_retail: string;
  profit_amount: string;
  profit_percent: string;
};
export type InvoiceCostLine = {
  product_item_no: string;
  product_name: string;
  supplier_item_no: string;
  new_cost: string;
  previous_cost: string;
  difference_amount: string;
  difference_percent: string;
  average_cost: string;
  retail_price: string;
};
export type InvoiceQtyLine = {
  product_item_no: string;
  product_name: string;
  supplier_item_no: string;
  ordered_qty: string;
  received_qty: string;
  difference: string;
  stock_in_hand: string;
};
export type InvoiceLogEntry = { date: string; log: string };
export type InvoiceReport = {
  invoiceid: string;
  invoice_type: InvoiceType;
  invoice_datetime: string;
  delivery_datetime: string;
  invoice_no: string;
  supplier_name: string;
  supplier_invoice_no: string;
  status: InvoiceStatus;
  employee_name: string;
  discount: string;
  shipping: string;
  tax: string;
  deposit: string;
  total: string;
  lines: InvoiceLine[];
  profit_lines: InvoiceProfitLine[];
  profit_totals: InvoiceProfitTotals;
  cost_lines: InvoiceCostLine[];
  qty_lines: InvoiceQtyLine[];
  log: InvoiceLogEntry[];
};
export type InvoiceSnapshot = { request_id: string; invoice: InvoiceReport };
export type InvoiceScope = ReportingScope & { timezone: string };
export type InvoiceListRow = {
  id: string;
  invoice_type: InvoiceType;
  invoice_datetime: string;
  supplier_name: string;
  supplier_invoice_no: string;
  status: InvoiceStatus;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
};
export type InvoiceListFilters = {
  from: string;
  to: string;
  amountFrom: string | null;
  amountTo: string | null;
  invoiceType: InvoiceType | null;
  supplierName: string | null;
  supplierInvoiceNo: string;
};

const bodyKeys = new Set([
  "invoiceid", "invoice_type", "invoice_datetime", "delivery_datetime", "invoice_no", "supplier_name",
  "supplier_invoice_no", "status", "employee_name", "discount", "shipping", "tax", "deposit", "total",
  "lines", "profit_lines", "profit_totals", "cost_lines", "qty_lines", "log",
]);
const lineKeys = ["product_item_no", "product_name", "supplier_item_no", "qty", "case_cost", "total"] as const;
const profitKeys = ["product_no", "product_name", "supplier_item_no", "inv_qty", "cost", "unit_cost", "ext_cost", "unit_retail", "case_retail", "ext_retail", "profit_amount", "profit_percent"] as const;
const costKeys = ["product_item_no", "product_name", "supplier_item_no", "new_cost", "previous_cost", "difference_amount", "difference_percent", "average_cost", "retail_price"] as const;
const qtyKeys = ["product_item_no", "product_name", "supplier_item_no", "ordered_qty", "received_qty", "difference", "stock_in_hand"] as const;
const totalKeys = ["ext_cost", "ext_retail", "profit_amount", "profit_percent"] as const;
const logKeys = ["date", "log"] as const;

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requestId(value: Record<string, unknown>) {
  if (typeof value.request_id !== "string" || !value.request_id.trim() || value.request_id.length > 160 || value.request_id.includes("\u0000"))
    throw new ReportingError("request_id is required (maximum 160 characters).");
  return value.request_id;
}

function positiveBigint(value: unknown, name: string) {
  const parsed = String(parseRetailValue({ name, kind: "bigint", required: true, notNull: true }, value));
  if (BigInt(parsed) <= BigInt(0)) throw new ReportingError(`${name} must be a positive id.`);
  return parsed;
}

function timestamp(value: unknown, name: string) {
  return String(parseRetailValue({ name, kind: "timestamp", required: true, notNull: true }, value));
}

function text(value: unknown, name: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim() || value.includes("\u0000") || [...value].length > maxLength)
    throw new ReportingError(`Invalid ${name}.`);
  return value;
}

function headerAmount(value: unknown, name: string) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match || (match[3] && match[3].length > 2) || match[2].length > 12)
    throw new ReportingError(`Invalid ${name}.`);
  const whole = match[2].replace(/^0+(?=\d)/, "");
  const cents = (match[3] ?? "").padEnd(2, "0");
  if (whole === "0" && cents === "00") return "0.00";
  return `${match[1] === "-" ? "-" : ""}${whole}.${cents}`;
}

function lineAmount(value: unknown, name: string) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  const match = /^(-?)(\d+)(?:\.(\d{1,4}))?$/.exec(raw);
  if (!match || match[2].length > 12) throw new ReportingError(`Invalid ${name}.`);
  const whole = match[2].replace(/^0+(?=\d)/, "");
  const fraction = match[3];
  const zeros = whole === "0" && (fraction === undefined || /^0+$/.test(fraction));
  const body = fraction === undefined ? whole : `${whole}.${fraction}`;
  if (zeros) return fraction === undefined ? "0" : `0.${fraction}`;
  return `${match[1] === "-" ? "-" : ""}${body}`;
}

function invoiceType(value: unknown): InvoiceType {
  if (value === "RC" || value === "OP") return value;
  throw new ReportingError("invoice_type must be RC or OP.");
}

function status(value: unknown): InvoiceStatus {
  if (value === "Unpaid" || value === "Paid" || value === "OP") return value;
  throw new ReportingError("status must be Unpaid, Paid, or OP.");
}

function rows<T extends string>(value: unknown, name: string, keys: readonly T[], read: (row: Record<string, unknown>, key: T, label: string) => string): Array<Record<T, string>> {
  if (!Array.isArray(value) || value.length > 200) throw new ReportingError(`${name} must be an array with at most 200 rows.`);
  return value.map((row, index) => {
    if (!object(row) || Object.keys(row).some((key) => !keys.includes(key as T)))
      throw new ReportingError(`Invalid ${name}[${index}].`);
    return Object.fromEntries(keys.map((key) => [key, read(row, key, `${name}[${index}].${key}`)])) as Record<T, string>;
  });
}

function lineText(row: Record<string, unknown>, key: string, label: string) {
  return text(row[key], label, key.endsWith("name") ? 200 : 50);
}

function lineMoney(row: Record<string, unknown>, key: string, label: string) {
  return lineAmount(row[key], label);
}

function profitTotals(value: unknown): InvoiceProfitTotals {
  if (!object(value) || Object.keys(value).some((key) => !totalKeys.includes(key as (typeof totalKeys)[number])))
    throw new ReportingError("Invalid profit_totals.");
  return Object.fromEntries(totalKeys.map((key) => [key, text(value[key], `profit_totals.${key}`, 40)])) as InvoiceProfitTotals;
}

export function parseRetailInvoice(value: unknown): InvoiceSnapshot {
  if (Array.isArray(value) || !object(value) || !("request_id" in value) || !("invoice" in value) || Object.keys(value).some((key) => key !== "request_id" && key !== "invoice"))
    throw new ReportingError("Invalid invoice envelope.");
  if (!object(value.invoice) || Object.keys(value.invoice).some((key) => !bodyKeys.has(key)))
    throw new ReportingError("Invalid invoice.");
  const body = value.invoice;
  const employee = body.employee_name === undefined ? "" : body.employee_name;
  if (typeof employee !== "string" || employee.includes("\u0000") || [...employee].length > 100)
    throw new ReportingError("Invalid employee_name.");
  return {
    request_id: requestId(value),
    invoice: {
      invoiceid: positiveBigint(body.invoiceid, "invoiceid"),
      invoice_type: invoiceType(body.invoice_type),
      invoice_datetime: timestamp(body.invoice_datetime, "invoice_datetime"),
      delivery_datetime: timestamp(body.delivery_datetime, "delivery_datetime"),
      invoice_no: text(body.invoice_no, "invoice_no", 50),
      supplier_name: text(body.supplier_name, "supplier_name", 100),
      supplier_invoice_no: text(body.supplier_invoice_no, "supplier_invoice_no", 50),
      status: status(body.status),
      employee_name: employee,
      discount: headerAmount(body.discount, "discount"),
      shipping: headerAmount(body.shipping, "shipping"),
      tax: headerAmount(body.tax, "tax"),
      deposit: headerAmount(body.deposit, "deposit"),
      total: headerAmount(body.total, "total"),
      lines: rows(body.lines, "lines", lineKeys, (row, key, label) => key === "case_cost" || key === "total" ? lineMoney(row, key, label) : lineText(row, key, label)) as InvoiceLine[],
      profit_lines: rows(body.profit_lines, "profit_lines", profitKeys, (row, key, label) => key === "product_no" || key === "product_name" || key === "supplier_item_no" || key === "inv_qty" ? lineText(row, key, label) : lineMoney(row, key, label)) as InvoiceProfitLine[],
      profit_totals: profitTotals(body.profit_totals),
      cost_lines: rows(body.cost_lines, "cost_lines", costKeys, (row, key, label) => key === "product_item_no" || key === "product_name" || key === "supplier_item_no" ? lineText(row, key, label) : lineMoney(row, key, label)) as InvoiceCostLine[],
      qty_lines: rows(body.qty_lines, "qty_lines", qtyKeys, (row, key, label) => lineText(row, key, label)) as InvoiceQtyLine[],
      log: rows(body.log, "log", logKeys, (row, key, label) => text(row[key], label, key === "log" ? 2000 : 40)) as InvoiceLogEntry[],
    },
  };
}

function storedTime(value: unknown, name: string) {
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

export function storedInvoice(record: Record<string, unknown>): InvoiceReport {
  return parseRetailInvoice({
    request_id: "stored",
    invoice: {
      invoiceid: String(record.invoiceid),
      invoice_type: record.invoice_type,
      invoice_datetime: storedTime(record.invoice_datetime, "invoice_datetime"),
      delivery_datetime: storedTime(record.delivery_datetime, "delivery_datetime"),
      invoice_no: record.invoice_no,
      supplier_name: record.supplier_name,
      supplier_invoice_no: record.supplier_invoice_no,
      status: record.status,
      employee_name: record.employee_name ?? "",
      discount: String(record.discount),
      shipping: String(record.shipping),
      tax: String(record.tax),
      deposit: String(record.deposit),
      total: String(record.total),
      lines: parseJson(record.lines, "lines"),
      profit_lines: parseJson(record.profit_lines, "profit_lines"),
      profit_totals: parseJson(record.profit_totals, "profit_totals"),
      cost_lines: parseJson(record.cost_lines, "cost_lines"),
      qty_lines: parseJson(record.qty_lines, "qty_lines"),
      log: parseJson(record.log, "log"),
    },
  }).invoice;
}

export function formatInvoiceStamp(iso: string, timeZone: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`;
}

export function formatInvoiceLongDate(iso: string, timeZone: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, month: "short", day: "2-digit", year: "numeric", weekday: "long",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("month")}-${part("day")}-${part("year")}, ${part("weekday")}`;
}

function invoiceTable(schemaName: string) {
  return `${schemaIdentifier(schemaName)}.${quoteRetailIdent("tbl_invoice_report")}`;
}

function invoiceValues(row: InvoiceReport) {
  return [
    row.invoiceid, row.invoice_type, row.invoice_datetime, row.delivery_datetime, row.invoice_no, row.supplier_name,
    row.supplier_invoice_no, row.status, row.employee_name, row.discount, row.shipping, row.tax, row.deposit, row.total,
    JSON.stringify(row.lines), JSON.stringify(row.profit_lines), JSON.stringify(row.profit_totals),
    JSON.stringify(row.cost_lines), JSON.stringify(row.qty_lines), JSON.stringify(row.log),
  ];
}

async function inInvoiceTransaction<T>(db: Pick<Client, "query">, scope: ReportingScope, id: string, work: () => Promise<T>) {
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
      `${scope.schemaName}:retail:invoice:${scope.storeCode}`,
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

const storedSelect = `"invoiceid"::text AS invoiceid, "invoice_type", "invoice_datetime", "delivery_datetime", "invoice_no",
  "supplier_name", "supplier_invoice_no", "status", "employee_name", "discount"::text AS discount, "shipping"::text AS shipping,
  "tax"::text AS tax, "deposit"::text AS deposit, "total"::text AS total, "lines", "profit_lines", "profit_totals", "cost_lines", "qty_lines", "log"`;

export async function syncRetailInvoice(db: Pick<Client, "query">, scope: ReportingScope, snapshot: InvoiceSnapshot) {
  const invoice = snapshot.invoice;
  return inInvoiceTransaction(db, scope, `${invoice.invoiceid}:${invoice.invoice_type}`, async () => {
    const existing = await db.query(
      `SELECT ${storedSelect} FROM ${invoiceTable(scope.schemaName)} WHERE "invoiceid" = $1::bigint AND "invoice_type" = $2 FOR UPDATE`,
      [invoice.invoiceid, invoice.invoice_type],
    );
    if ((existing.rowCount ?? 0) > 1) throw new ReportingError("invoiceid is already duplicated in this store.", 409);
    const current = existing.rowCount ? storedInvoice(existing.rows[0] as Record<string, unknown>) : null;
    if (current && JSON.stringify(current) === JSON.stringify(invoice))
      return { status: "duplicate" as const, request_id: snapshot.request_id, invoiceid: invoice.invoiceid, invoice_type: invoice.invoice_type };
    const values = invoiceValues(invoice);
    if (current) {
      const updated = await db.query(
        `UPDATE ${invoiceTable(scope.schemaName)} SET
          "invoice_datetime" = $3::timestamptz, "delivery_datetime" = $4::timestamptz, "invoice_no" = $5,
          "supplier_name" = $6, "supplier_invoice_no" = $7, "status" = $8, "employee_name" = $9,
          "discount" = $10::numeric, "shipping" = $11::numeric, "tax" = $12::numeric, "deposit" = $13::numeric, "total" = $14::numeric,
          "lines" = $15::jsonb, "profit_lines" = $16::jsonb, "profit_totals" = $17::jsonb, "cost_lines" = $18::jsonb, "qty_lines" = $19::jsonb, "log" = $20::jsonb
         WHERE "invoiceid" = $1::bigint AND "invoice_type" = $2`,
        values,
      );
      if (updated.rowCount !== 1) throw new ReportingError("Retail row update did not match one record.", 409);
    } else {
      await db.query(
        `INSERT INTO ${invoiceTable(scope.schemaName)} (
          "invoiceid", "invoice_type", "invoice_datetime", "delivery_datetime", "invoice_no", "supplier_name", "supplier_invoice_no",
          "status", "employee_name", "discount", "shipping", "tax", "deposit", "total", "lines", "profit_lines", "profit_totals",
          "cost_lines", "qty_lines", "log"
        ) VALUES (
          $1::bigint, $2, $3::timestamptz, $4::timestamptz, $5, $6, $7, $8, $9, $10::numeric, $11::numeric, $12::numeric, $13::numeric,
          $14::numeric, $15::jsonb, $16::jsonb, $17::jsonb, $18::jsonb, $19::jsonb, $20::jsonb
        )`,
        values,
      );
    }
    return { status: "accepted" as const, request_id: snapshot.request_id, invoiceid: invoice.invoiceid, invoice_type: invoice.invoice_type };
  });
}

export async function resolveRetailInvoiceScope(db: Pick<Client, "query">, user: { id: string }, storeCode: string): Promise<InvoiceScope> {
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

function optionalFilterAmount(value: string | null, name: string) {
  if (value === null || value.trim() === "") return null;
  return headerAmount(value, name);
}

export function parseInvoiceFilters(params: URLSearchParams): InvoiceListFilters {
  const from = businessDate(params.get("from"));
  const to = businessDate(params.get("to"));
  if (from > to) throw new ReportingError("from must not be after to.");
  const amountFrom = optionalFilterAmount(params.get("amount_from"), "amount_from");
  const amountTo = optionalFilterAmount(params.get("amount_to"), "amount_to");
  if (amountFrom !== null && amountTo !== null && Number(amountFrom) > Number(amountTo))
    throw new ReportingError("amount_from must not be after amount_to.");
  const type = params.get("invoice_type");
  if (type !== null && type !== "" && type !== "RC" && type !== "OP") throw new ReportingError("invoice_type must be RC or OP.");
  const supplier = params.get("supplier_name")?.trim() ?? "";
  if (supplier.includes("\u0000") || [...supplier].length > 100) throw new ReportingError("Invalid supplier_name.");
  const supplierInvoiceNo = params.get("supplier_invoice_no")?.trim() ?? "";
  if (supplierInvoiceNo.includes("\u0000") || [...supplierInvoiceNo].length > 50) throw new ReportingError("Invalid supplier_invoice_no.");
  return {
    from,
    to,
    amountFrom,
    amountTo,
    invoiceType: type === "RC" || type === "OP" ? type : null,
    supplierName: supplier || null,
    supplierInvoiceNo,
  };
}

export function parseInvoiceIdentity(params: URLSearchParams): { id: string; type: InvoiceType } {
  const id = params.get("id") ?? "";
  if (!/^\d+$/.test(id) || id.length > 19 || BigInt(id) <= BigInt(0) || BigInt(id) > BigInt("9223372036854775807"))
    throw new ReportingError("Invalid invoice id.");
  const type = params.get("type");
  if (type !== "RC" && type !== "OP") throw new ReportingError("type must be RC or OP.");
  return { id, type };
}

export async function readInvoiceList(db: Pick<Client, "query">, scope: InvoiceScope, filters: InvoiceListFilters) {
  const table = invoiceTable(scope.schemaName);
  const suppliers = await db.query(
    `SELECT DISTINCT "supplier_name" FROM ${table}
     WHERE ("invoice_datetime" AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
     ORDER BY "supplier_name" ASC`,
    [scope.timezone, filters.from, filters.to],
  );
  const pattern = filters.supplierInvoiceNo.replace(/[\\%_]/g, (char) => `\\${char}`);
  const result = await db.query(
    `SELECT "invoiceid"::text AS id, "invoice_type", "invoice_datetime", "supplier_name", "supplier_invoice_no", "status",
            "discount"::text AS discount, "shipping"::text AS shipping, "tax"::text AS tax, "total"::text AS total
     FROM ${table}
     WHERE ("invoice_datetime" AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date
       AND ($4::numeric IS NULL OR "total" >= $4::numeric)
       AND ($5::numeric IS NULL OR "total" <= $5::numeric)
       AND ($6::text IS NULL OR "invoice_type" = $6)
       AND ($7::text IS NULL OR "supplier_name" = $7)
       AND ($8::text = '' OR "supplier_invoice_no" ILIKE $8 ESCAPE '\\')
     ORDER BY "invoice_datetime" ASC, "id" ASC`,
    [
      scope.timezone, filters.from, filters.to, filters.amountFrom, filters.amountTo, filters.invoiceType, filters.supplierName,
      pattern ? `%${pattern}%` : "",
    ],
  );
  return {
    suppliers: suppliers.rows.map((row) => String((row as { supplier_name: string }).supplier_name)),
    rows: result.rows.map((row) => {
      const record = row as Record<string, unknown>;
      return {
        id: String(record.id),
        invoice_type: record.invoice_type as InvoiceType,
        invoice_datetime: storedTime(record.invoice_datetime, "invoice_datetime"),
        supplier_name: String(record.supplier_name),
        supplier_invoice_no: String(record.supplier_invoice_no),
        status: record.status as InvoiceStatus,
        discount: String(record.discount),
        shipping: String(record.shipping),
        tax: String(record.tax),
        total: String(record.total),
      };
    }),
  };
}

export async function readInvoiceDetail(db: Pick<Client, "query">, scope: InvoiceScope, identity: { id: string; type: InvoiceType }) {
  const result = await db.query(
    `SELECT ${storedSelect} FROM ${invoiceTable(scope.schemaName)} WHERE "invoiceid" = $1::bigint AND "invoice_type" = $2`,
    [identity.id, identity.type],
  );
  if (!result.rowCount) throw new ReportingError("Invoice not found.", 404);
  return storedInvoice(result.rows[0] as Record<string, unknown>);
}
