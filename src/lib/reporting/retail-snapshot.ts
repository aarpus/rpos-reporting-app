import {
  formatDecimal,
  type RetailField,
  type RetailValue,
} from "./retail-columns.ts";
import { ReportingError } from "./snapshot.ts";

export type ShiftReportLine = { label: string; value: string };
export type ShiftReportStatus = "Open" | "Close";
export type ShiftEndReport = {
  shiftid: string;
  stationname: string;
  batch_number: string;
  shift: number;
  start_time: string;
  end_time: string | null;
  status: ShiftReportStatus;
  employeename: string | null;
  employeeid: number | null;
  totaltime: string | null;
  sale: ShiftReportLine[];
  taxes: ShiftReportLine[];
  sale_breakdown: ShiftReportLine[];
  terminalcashstatus: ShiftReportLine[];
  miscellaneous: ShiftReportLine[];
  terminalcashtransfer: ShiftReportLine[];
};
export type RetailShiftSnapshot = { request_id: string; shift: ShiftEndReport };

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

const shiftReportCards = ["sale", "taxes", "sale_breakdown", "terminalcashstatus", "miscellaneous", "terminalcashtransfer"] as const;
const shiftReportKeys = new Set<string>([
  "shiftid",
  "stationname",
  "batch_number",
  "shift",
  "start_time",
  "end_time",
  "status",
  "employeename",
  "employeeid",
  "totaltime",
  ...shiftReportCards,
]);

function requiredText(value: unknown, name: string, maxLength: number) {
  return String(parseRetailValue({ name, kind: "string", required: true, notNull: true, maxLength }, value));
}

function optionalText(value: unknown, name: string, maxLength: number) {
  if (value === undefined || value === null) return null;
  return requiredText(value, name, maxLength);
}

function positiveInteger(value: unknown, name: string) {
  const parsed = Number(parseRetailValue({ name, kind: "integer", required: true, notNull: true }, value));
  if (parsed <= 0) throw new ReportingError(`${name} must be a positive id.`);
  return parsed;
}

function optionalPositiveInteger(value: unknown, name: string) {
  if (value === undefined || value === null) return null;
  return positiveInteger(value, name);
}

function positiveBigint(value: unknown, name: string) {
  const parsed = String(parseRetailValue({ name, kind: "bigint", required: true, notNull: true }, value));
  if (BigInt(parsed) <= BigInt(0)) throw new ReportingError(`${name} must be a positive id.`);
  return parsed;
}

function reportTimestamp(value: unknown, name: string) {
  return String(parseRetailValue({ name, kind: "timestamp", required: true, notNull: true }, value));
}

function optionalTimestamp(value: unknown, name: string) {
  if (value === undefined || value === null) return null;
  return reportTimestamp(value, name);
}

function cardLines(value: unknown, name: string): ShiftReportLine[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 200) throw new ReportingError(`${name} must be an array with at most 200 lines.`);
  return value.map((line) => {
    if (!object(line) || Object.keys(line).some((key) => key !== "label" && key !== "value"))
      throw new ReportingError(`Invalid ${name} line.`);
    return {
      label: requiredText(line.label, `${name} label`, 80),
      value: requiredText(line.value, `${name} value`, 40),
    };
  });
}

export function parseRetailShift(value: unknown): RetailShiftSnapshot {
  const body = envelope(value, ["request_id", "shift"], "shift", "/api/pos/reporting/retail/shift");
  if (!object(body.shift)) throw new ReportingError("Invalid shift.");
  if (Object.keys(body.shift).some((key) => !shiftReportKeys.has(key))) throw new ReportingError("Unknown shift field.");
  const status = body.shift.status;
  if (status !== "Open" && status !== "Close") throw new ReportingError("Invalid status.");
  const end_time = optionalTimestamp(body.shift.end_time, "end_time");
  if (status === "Close" && !end_time) throw new ReportingError("end_time is required when status is Close.");
  const shift: ShiftEndReport = {
    shiftid: positiveBigint(body.shift.shiftid, "shiftid"),
    stationname: requiredText(body.shift.stationname, "stationname", 100),
    batch_number: positiveBigint(body.shift.batch_number, "batch_number"),
    shift: positiveInteger(body.shift.shift, "shift"),
    start_time: reportTimestamp(body.shift.start_time, "start_time"),
    end_time,
    status,
    employeename: optionalText(body.shift.employeename, "employeename", 100),
    employeeid: optionalPositiveInteger(body.shift.employeeid, "employeeid"),
    totaltime: optionalText(body.shift.totaltime, "totaltime", 20),
    sale: cardLines(body.shift.sale, "sale"),
    taxes: cardLines(body.shift.taxes, "taxes"),
    sale_breakdown: cardLines(body.shift.sale_breakdown, "sale_breakdown"),
    terminalcashstatus: cardLines(body.shift.terminalcashstatus, "terminalcashstatus"),
    miscellaneous: cardLines(body.shift.miscellaneous, "miscellaneous"),
    terminalcashtransfer: cardLines(body.shift.terminalcashtransfer, "terminalcashtransfer"),
  };
  return { request_id: requestId(body), shift };
}
