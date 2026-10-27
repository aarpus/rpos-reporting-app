import {
  formatDecimal,
  retailTable,
  type RetailField,
  type RetailRow,
  type RetailTableName,
  type RetailValue,
} from "./retail-columns.ts";
import { ReportingError } from "./snapshot.ts";

export type RetailBatchSnapshot = { request_id: string; batch: RetailRow };
export type RetailShiftSnapshot = { request_id: string; shift: RetailRow };
export type RetailOrderSnapshot = {
  request_id: string;
  checkout_transaction: RetailRow;
  transaction_detail: RetailRow[];
  transaction_payment: RetailRow[];
  transaction_gift_card: RetailRow[];
};
export type RetailEntitySnapshot = { request_id: string; row: RetailRow };

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requestId(value: Record<string, unknown>) {
  if (typeof value.request_id !== "string" || !value.request_id.trim() || value.request_id.length > 160 || value.request_id.includes("\u0000"))
    throw new ReportingError("request_id is required (maximum 160 characters).");
  return value.request_id;
}

function envelope(value: unknown, keys: string[], label: string, path: string) {
  if (Array.isArray(value))
    throw new ReportingError(`This endpoint accepts one ${label} per request, not an array. Send each ${label} separately to ${path}.`);
  if (!object(value) || keys.some((key) => !(key in value)) || Object.keys(value).some((key) => !keys.includes(key)))
    throw new ReportingError(`Invalid ${label} envelope.`);
  return value;
}

function integerText(value: unknown, name: string, signed = true) {
  if (typeof value === "number" && !Number.isSafeInteger(value)) throw new ReportingError(`Send large ${name} values as strings.`);
  if ((typeof value !== "number" && typeof value !== "string") || !/^-?\d+$/.test(String(value))) throw new ReportingError(`Invalid ${name}.`);
  const number = BigInt(String(value));
  if (number > BigInt("9223372036854775807") || number < BigInt(signed ? "-9223372036854775808" : "0"))
    throw new ReportingError(`Invalid ${name}.`);
  return number.toString();
}

function clockTime(value: unknown, name: string) {
  if (typeof value !== "string") throw new ReportingError(`Invalid ${name}.`);
  const match = /^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/.exec(value);
  if (!match) throw new ReportingError(`Invalid ${name}.`);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3]);
  if (hour > 23 || minute > 59 || second > 59) throw new ReportingError(`Invalid ${name}.`);
  const fraction = (match[4] ?? "").replace(/0+$/, "");
  return fraction ? `${match[1]}:${match[2]}:${match[3]}.${fraction}` : `${match[1]}:${match[2]}:${match[3]}`;
}

function byteaHex(value: unknown, name: string) {
  if (typeof value !== "string" || value.includes("\u0000")) throw new ReportingError(`Invalid ${name}.`);
  if (/^\\x[0-9a-fA-F]*$/.test(value)) return `\\x${value.slice(2).toLowerCase()}`;
  if (value === "" || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new ReportingError(`Invalid ${name}.`);
  return `\\x${Buffer.from(value, "base64").toString("hex")}`;
}

function storedBytea(value: unknown, name: string) {
  if (value instanceof Uint8Array) return `\\x${Buffer.from(value).toString("hex")}`;
  return byteaHex(value, name);
}

function presentValue(field: RetailField, value: unknown): RetailValue {
  switch (field.kind) {
    case "string":
    case "text": {
      const limit = field.kind === "text" ? 200_000 : field.maxLength ?? 10_000;
      if (typeof value !== "string" || value.includes("\u0000") || [...value].length > limit || (field.required && !value.trim()))
        throw new ReportingError(`Invalid ${field.name}.`);
      return value;
    }
    case "bigint":
      return integerText(value, field.name);
    case "integer":
    case "smallint": {
      const parsed = Number(integerText(value, field.name));
      const min = field.kind === "smallint" ? -32768 : -2147483648;
      const max = field.kind === "smallint" ? 32767 : 2147483647;
      if (parsed < min || parsed > max) throw new ReportingError(`Invalid ${field.name}.`);
      return parsed;
    }
    case "decimal":
      if (typeof value !== "string" && typeof value !== "number") throw new ReportingError(`Invalid decimal ${field.name}.`);
      if (typeof value === "number" && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER / 100))
        throw new ReportingError(`Send large ${field.name} values as exact decimal strings.`);
      return formatDecimal(String(value), field.precision ?? 18, field.scale ?? 2, field.name);
    case "boolean":
      if (typeof value !== "boolean") throw new ReportingError(`Invalid ${field.name}.`);
      return value;
    case "double": {
      const numeric = typeof value === "number" ? value : typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value) ? Number(value) : Number.NaN;
      if (!Number.isFinite(numeric) || Math.abs(numeric) > 1e15) throw new ReportingError(`Invalid ${field.name}.`);
      return numeric;
    }
    case "timestamp":
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value)))
        throw new ReportingError(`${field.name} must be an ISO timestamp with an offset (millisecond precision).`);
      return new Date(value).toISOString();
    case "time":
      return clockTime(value, field.name);
    case "bytea":
      return byteaHex(value, field.name);
    default:
      throw new ReportingError("Unsupported field.");
  }
}

export function parseRetailValue(field: RetailField, value: unknown): RetailValue {
  if (value === undefined) {
    if (!field.notNull) return null;
    if (field.default !== undefined) return field.default;
    throw new ReportingError(`${field.name} is required.`);
  }
  if (value === null) {
    if (field.notNull) throw new ReportingError(`${field.name} cannot be null.`);
    return null;
  }
  return presentValue(field, value);
}

export function parseRetailRow(tableName: RetailTableName, value: unknown, links: RetailRow = {}): RetailRow {
  if (!object(value)) throw new ReportingError(`Invalid row in ${tableName}.`);
  const table = retailTable(tableName);
  const allowed = new Set(table.fields.map((field) => field.name));
  if (Object.keys(value).some((key) => !allowed.has(key))) throw new ReportingError(`Unknown or server-managed column in ${tableName}.`);
  const row: RetailRow = {};
  for (const field of table.fields) {
    const supplied = Object.prototype.hasOwnProperty.call(value, field.name);
    const linked = !supplied && field.name in links;
    const parsed = parseRetailValue(field, linked ? links[field.name] : supplied ? value[field.name] : undefined);
    if (supplied && field.name in links && parsed !== links[field.name])
      throw new ReportingError(`${field.name} does not match the parent checkout.`);
    row[field.name] = parsed;
  }
  const key = row[table.key];
  const keyText = typeof key === "number" || typeof key === "string" ? String(key) : "";
  if (!/^\d+$/.test(keyText) || BigInt(keyText) <= BigInt(0)) throw new ReportingError(`${table.key} must be a positive id.`);
  return row;
}

function rows(value: unknown, key: string, tableName: RetailTableName, links: RetailRow) {
  if (!Array.isArray(value) || value.length > 2000) throw new ReportingError(`${key} must be a complete array with at most 2000 rows.`);
  const table = retailTable(tableName);
  const seen = new Set<string>();
  const parsed = value.map((row) => parseRetailRow(tableName, row, links));
  for (const row of parsed) {
    const id = String(row[table.key]);
    if (seen.has(id)) throw new ReportingError(`Duplicate ${table.key} in ${key}.`);
    seen.add(id);
  }
  return parsed.sort((left, right) => (BigInt(String(left[table.key])) < BigInt(String(right[table.key])) ? -1 : 1));
}

export function parseRetailBatch(value: unknown): RetailBatchSnapshot {
  const body = envelope(value, ["request_id", "batch"], "batch", "/api/pos/reporting/retail/batch");
  return { request_id: requestId(body), batch: parseRetailRow("tbl_batch", body.batch) };
}

export function parseRetailShift(value: unknown): RetailShiftSnapshot {
  const body = envelope(value, ["request_id", "shift"], "shift", "/api/pos/reporting/retail/shift");
  return { request_id: requestId(body), shift: parseRetailRow("tbl_shift", body.shift) };
}

export function parseRetailOrder(value: unknown): RetailOrderSnapshot {
  const body = envelope(
    value,
    ["request_id", "checkout_transaction", "transaction_detail", "transaction_payment", "transaction_gift_card"],
    "checkout",
    "/api/pos/reporting/retail/orders",
  );
  const checkout = parseRetailRow("tbl_checkout_transaction", body.checkout_transaction);
  const links: RetailRow = {
    transactionid: checkout.transactionid,
    shiftid: checkout.shiftid,
    chkout_id: checkout.transactionid,
  };
  return {
    request_id: requestId(body),
    checkout_transaction: checkout,
    transaction_detail: rows(body.transaction_detail, "transaction_detail", "tbl_transaction_detail", links),
    transaction_payment: rows(body.transaction_payment, "transaction_payment", "tbl_transaction_payment", links),
    transaction_gift_card: rows(body.transaction_gift_card, "transaction_gift_card", "tbl_transaction_gift_card", links),
  };
}

export function parseRetailEntity(value: unknown, envelopeKey: string, tableName: RetailTableName): RetailEntitySnapshot {
  const body = envelope(value, ["request_id", envelopeKey], envelopeKey, `/api/pos/reporting/retail/${envelopeKey}`);
  return { request_id: requestId(body), row: parseRetailRow(tableName, body[envelopeKey]) };
}

export function normalizeRetailStored(field: RetailField, value: unknown): RetailValue {
  if (value === undefined) throw new ReportingError(`Retail column ${field.name} was not returned.`, 503);
  if (value === null) return null;
  if (field.kind === "timestamp") {
    const date = value instanceof Date ? value : new Date(typeof value === "string" || typeof value === "number" ? value : "");
    if (!Number.isFinite(date.getTime())) throw new ReportingError(`Invalid stored ${field.name}.`, 503);
    return date.toISOString();
  }
  if (field.kind === "bytea") return storedBytea(value, field.name);
  if (field.kind === "time") return clockTime(typeof value === "string" ? value : "", field.name);
  return presentValue(field, typeof value === "bigint" ? value.toString() : value);
}

export function retailRowsEqual(tableName: RetailTableName, left: RetailRow, right: RetailRow) {
  return retailTable(tableName).fields.every((field) => Object.is(left[field.name], right[field.name]));
}
