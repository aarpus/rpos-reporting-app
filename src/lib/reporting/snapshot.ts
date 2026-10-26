import { createHash } from "node:crypto";
import columns from "./columns.json" with { type: "json" };

export const tables = columns;
export type ReportingTable = keyof typeof tables;
export type ReportRow = Record<string, unknown>;
type Field = { name: string; kind: string; required: boolean; maxLength?: number; default?: unknown };
export type OrderSnapshot = {
  request_id: string;
  source_revision: string;
  order: ReportRow;
  items: ReportRow[];
  payments: ReportRow[];
  card_payments: ReportRow[];
};
export type BatchSnapshot = {
  request_id: string;
  source_revision: string;
  batch: ReportRow;
};
export type ShiftSnapshot = {
  request_id: string;
  source_revision: string;
  shift: ReportRow;
};

export class ReportingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function object(value: unknown): value is ReportRow {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function positiveRevision(value: unknown): string {
  const text = integer(value, false);
  if (BigInt(text) <= BigInt(0)) throw new ReportingError("source_revision must be positive.");
  return text;
}

function integer(value: unknown, signed = true): string {
  if (typeof value === "number" && !Number.isSafeInteger(value)) throw new ReportingError("Send large integers as strings.");
  if ((typeof value !== "number" && typeof value !== "string") || !/^-?\d+$/.test(String(value))) throw new ReportingError("Invalid integer.");
  const number = BigInt(String(value));
  if (number > BigInt("9223372036854775807") || number < BigInt(signed ? "-9223372036854775808" : "0")) throw new ReportingError("Integer out of range.");
  return number.toString();
}

export function businessDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new ReportingError("Invalid business_date; use YYYY-MM-DD.");
  return value;
}

function fieldValue(field: Field, value: unknown): unknown {
  if (value === undefined) {
    if (field.required) throw new ReportingError(`${field.name} is required.`);
    return field.default ?? null;
  }
  if (value === null) {
    if (field.required || field.default !== undefined) throw new ReportingError(`${field.name} cannot be null.`);
    return null;
  }
  switch (field.kind) {
    case "string":
      if (typeof value !== "string" || value.includes("\u0000") || [...value].length > (field.maxLength ?? 10000) || (field.required && !value.trim())) throw new ReportingError(`Invalid ${field.name}.`);
      return value;
    case "bigint": return integer(value);
    case "integer": {
      const parsed = Number(integer(value));
      if (parsed < -2147483648 || parsed > 2147483647) throw new ReportingError(`Invalid ${field.name}.`);
      return parsed;
    }
    case "decimal": {
      if (typeof value !== "string" && typeof value !== "number") throw new ReportingError(`Invalid decimal ${field.name}.`);
      if (typeof value === "number" && Math.abs(value) > Number.MAX_SAFE_INTEGER / 100) throw new ReportingError(`Send large ${field.name} values as exact decimal strings.`);
      const match = /^(-?)(\d{1,16})(?:\.(\d{1,2}))?$/.exec(String(value));
      if (!match) throw new ReportingError(`${field.name} must fit numeric(18,2); send exact decimal strings.`);
      const whole = BigInt(match[2]).toString();
      const fraction = (match[3] ?? "").padEnd(2, "0");
      return `${whole === "0" && fraction === "00" ? "" : match[1]}${whole}.${fraction}`;
    }
    case "boolean":
      if (typeof value !== "boolean") throw new ReportingError(`Invalid ${field.name}.`);
      return value;
    case "date": return businessDate(value);
    case "timestamp":
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new ReportingError(`${field.name} must be an ISO timestamp with an offset (millisecond precision).`);
      businessDate(value.slice(0, 10));
      return new Date(value).toISOString();
    case "jsonb":
      if (!object(value) && !Array.isArray(value)) throw new ReportingError(`Invalid JSON ${field.name}.`);
      validateJson(value);
      return value;
    default: throw new ReportingError("Unsupported field.");
  }
}

function parseRow(table: ReportingTable, value: unknown, storeCode: string): ReportRow {
  if (!object(value)) throw new ReportingError(`Invalid row in ${table}.`);
  const fields: Field[] = tables[table].fields;
  const allowed = new Set(fields.map((field) => field.name));
  if (Object.keys(value).some((key) => !allowed.has(key))) throw new ReportingError(`Unknown or server-managed column in ${table}.`);
  const row = Object.fromEntries(fields.map((field) => [field.name, fieldValue(field, value[field.name])]));
  if (row.store_code !== storeCode) throw new ReportingError("Row store_code does not match signed store.");
  return row;
}

function requestIdentity(value: ReportRow): { request_id: string; source_revision: string } {
  if (typeof value.request_id !== "string" || !value.request_id.trim() || value.request_id.length > 160 || value.request_id.includes("\u0000")) throw new ReportingError("request_id is required (maximum 160 characters).");
  return { request_id: value.request_id, source_revision: positiveRevision(value.source_revision) };
}

export function parseSnapshot(value: unknown, storeCode: string): OrderSnapshot {
  if (Array.isArray(value)) throw new ReportingError("This endpoint accepts one order snapshot object per request, not an array. Send each order separately to /api/pos/reporting/orders.");
  const envelopeKeys = ["request_id", "source_revision", "order", "items", "payments", "card_payments"];
  if (!object(value) || Object.keys(value).some((key) => !envelopeKeys.includes(key))) throw new ReportingError("Invalid snapshot envelope.");
  const identity = requestIdentity(value);
  const order = parseRow("tbl_rpt_order", value.order, storeCode);
  const envelope = value;
  function children(key: string, table: ReportingTable): ReportRow[] {
    const list = envelope[key];
    if (!Array.isArray(list) || list.length > 2000) throw new ReportingError(`${key} must be a complete array with at most 2000 rows.`);
    const rows = list.map((row) => parseRow(table, row, storeCode));
    const codes = new Set();
    for (const row of rows) {
      if (row.order_code !== order.order_code || row.business_date !== order.business_date) throw new ReportingError("Child order_code and business_date must match the order.");
      const code = row[tables[table].key];
      if (codes.has(code)) throw new ReportingError(`Duplicate code in ${key}.`);
      codes.add(code);
    }
    return rows.sort((a, b) => {
      const left = String(a[tables[table].key]);
      const right = String(b[tables[table].key]);
      return left < right ? -1 : left > right ? 1 : 0;
    });
  }
  const items = children("items", "tbl_rpt_order_item");
  const payments = children("payments", "tbl_rpt_payment");
  const cardPayments = children("card_payments", "tbl_rpt_card_payment");
  const paymentCodes = new Set(payments.map((row) => row.payment_code));
  if (cardPayments.some((row) => !paymentCodes.has(row.payment_code))) throw new ReportingError("Every card transaction must reference a payment in this snapshot.");
  return { ...identity, order, items, payments, card_payments: cardPayments };
}

export function parseBatchSnapshot(value: unknown, storeCode: string): BatchSnapshot {
  return parseMasterSnapshot(value, storeCode, "batch", "tbl_rpt_batch", "/api/pos/reporting/batch");
}

export function parseShiftSnapshot(value: unknown, storeCode: string): ShiftSnapshot {
  return parseMasterSnapshot(value, storeCode, "shift", "tbl_rpt_shift", "/api/pos/reporting/shift");
}

function parseMasterSnapshot<K extends "batch" | "shift">(value: unknown, storeCode: string, key: K, table: ReportingTable, path: string): { request_id: string; source_revision: string } & Record<K, ReportRow> {
  if (Array.isArray(value)) throw new ReportingError(`This endpoint accepts one ${key} object per request, not an array. Send each ${key} separately to ${path}.`);
  if (!object(value) || Object.keys(value).some((entry) => !["request_id", "source_revision", key].includes(entry))) throw new ReportingError(`Invalid ${key} envelope.`);
  const identity = requestIdentity(value);
  const row = parseRow(table, value[key], storeCode);
  return { ...identity, [key]: row } as { request_id: string; source_revision: string } & Record<K, ReportRow>;
}

function validateJson(value: unknown, depth = 0): void {
  if (depth > 30) throw new ReportingError("JSON nesting is too deep.");
  if (typeof value === "string" && value.includes("\u0000")) throw new ReportingError("JSON cannot contain null characters.");
  if (typeof value === "number" && !Number.isFinite(value)) throw new ReportingError("Invalid JSON number.");
  if (Array.isArray(value)) value.forEach((entry) => validateJson(entry, depth + 1));
  else if (object(value)) for (const [key, entry] of Object.entries(value)) { validateJson(key, depth + 1); validateJson(entry, depth + 1); }
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (object(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

export function snapshotHash(snapshot: { request_id: string }): string {
  const { request_id: _requestId, ...content } = snapshot;
  void _requestId;
  return createHash("sha256").update(JSON.stringify(canonical(content))).digest("hex");
}

export function schemaIdentifier(schema: string): string {
  if (!/^store_[a-z0-9_]{1,57}$/.test(schema)) throw new ReportingError("Invalid registered store schema.", 503);
  return `"${schema}"`;
}

