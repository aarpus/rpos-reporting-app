import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ReportingError } from "./snapshot.ts";

export const retailSyncTables = [
  "tbl_batch",
  "tbl_shift",
  "tbl_checkout_transaction",
  "tbl_transaction_detail",
  "tbl_transaction_payment",
  "tbl_transaction_gift_card",
  "tbl_station_transaction",
  "tbl_store_account_transaction",
  "tbl_station_cash_transfer",
  "tbl_invoice",
  "tbl_invoice_payment",
  "tbl_clockin",
  "tbl_nosale",
  "tbl_account_payment",
  "tbl_group_detail",
  "tbl_store",
  "tbl_Coupon",
  "tbl_Online_Platform_Master",
  "tbl_cashmachine_transaction",
  "tbl_cashmachine_master",
  "tbl_cashmachine_batch",
] as const;

export type RetailTableName = (typeof retailSyncTables)[number];
export type RetailValue = string | number | boolean | null;
export type RetailRow = Record<string, RetailValue>;
export type RetailField = {
  name: string;
  kind: "bigint" | "integer" | "smallint" | "decimal" | "string" | "text" | "timestamp" | "time" | "double" | "boolean" | "bytea";
  required: boolean;
  notNull: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
  default?: Exclude<RetailValue, null>;
};
export type RetailTable = { name: RetailTableName; key: string; fields: RetailField[] };

const quoteIdent = /^[A-Za-z_][A-Za-z0-9_]*$/;

function retailSql() {
  const path = join(process.cwd(), "database", "reporting", "retail", "001-tables.sql");
  let sql = "";
  try {
    sql = readFileSync(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (!sql.includes("tbl_checkout_transaction") || sql.includes("tbl_rpt_order") || !/create\s+table/i.test(sql))
    throw new ReportingError("Retail reporting tables are not available yet.", 503);
  return sql;
}

function unquote(value: string) {
  if (value.startsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  return value;
}

function typedDefault(field: Omit<RetailField, "required" | "notNull" | "default">, raw: string | undefined): RetailField["default"] {
  if (raw === undefined) return undefined;
  const text = unquote(raw);
  switch (field.kind) {
    case "decimal":
      return formatDecimal(text, field.precision ?? 18, field.scale ?? 2, field.name);
    case "bigint":
      return BigInt(text).toString();
    case "integer":
    case "smallint":
    case "double":
      return Number(text);
    case "boolean":
      return text === "true";
    case "time":
    case "bytea":
      return text;
    default:
      return text;
  }
}

export function formatDecimal(value: string, precision: number, scale: number, name: string) {
  const wholeDigits = precision - scale;
  if (wholeDigits < 1 || scale < 0) throw new ReportingError(`Invalid ${name}.`);
  const match = new RegExp(`^(-?)(\\d{1,${wholeDigits}})(?:\\.(\\d{1,${scale}}))?$`).exec(value);
  if (!match) throw new ReportingError(`${name} must fit numeric(${precision},${scale}); send exact decimal strings.`);
  if (scale === 0) return `${match[1] === "-" && match[2] !== "0" ? "-" : ""}${BigInt(match[2]).toString()}`;
  const whole = BigInt(match[2]).toString();
  const fraction = (match[3] ?? "").padEnd(scale, "0");
  const sign = whole === "0" && /^0*$/.test(fraction) ? "" : match[1];
  return `${sign}${whole}.${fraction}`;
}

function parseType(source: string, name: string): Omit<RetailField, "name" | "required" | "notNull" | "default"> {
  if (/^double precision\b/i.test(source)) return { kind: "double" };
  if (/^(?:bigint|bigserial)\b/i.test(source)) return { kind: "bigint" };
  if (/^(?:integer|int4?|serial)\b/i.test(source)) return { kind: "integer" };
  if (/^smallint\b/i.test(source)) return { kind: "smallint" };
  if (/^boolean\b/i.test(source)) return { kind: "boolean" };
  if (/^text\b/i.test(source)) return { kind: "text" };
  if (/^timestamptz\b/i.test(source)) return { kind: "timestamp" };
  if (/^time\b/i.test(source)) return { kind: "time" };
  if (/^bytea\b/i.test(source)) return { kind: "bytea" };
  const numeric = /^numeric\((\d+)\s*,\s*(\d+)\)/i.exec(source);
  if (numeric) return { kind: "decimal", precision: Number(numeric[1]), scale: Number(numeric[2]) };
  const varchar = /^varchar\((\d+)\)/i.exec(source);
  if (varchar) return { kind: "string", maxLength: Number(varchar[1]) };
  throw new ReportingError(`Unsupported retail column ${name}.`, 503);
}

function parseColumn(line: string): { field: RetailField; primaryKey: boolean; identity: boolean } | "skip" {
  const trimmed = line.trim().replace(/,$/, "");
  if (!trimmed) return "skip";
  if (/^(unique|constraint|primary|check|foreign)\b/i.test(trimmed)) return "skip";
  const match = /^"([^"]+)"\s+([\s\S]+)$/.exec(trimmed);
  if (!match || !quoteIdent.test(match[1])) throw new ReportingError("Retail table SQL contains an unsupported column.", 503);
  const name = match[1];
  const rest = match[2];
  const identity = /\b(?:bigserial|serial)\b/i.test(rest) || /generated\s+by\s+default\s+as\s+identity/i.test(rest);
  const primaryKey = /\bprimary\s+key\b/i.test(rest);
  const notNull = /\bnot\s+null\b/i.test(rest);
  const defaultMatch = /\bdefault\s+('(?:''|[^'])*'|-?\d+(?:\.\d+)?|true|false)/i.exec(rest);
  const typeSource = rest.replace(/\bdefault\s+(?:'(?:''|[^'])*'|-?\d+(?:\.\d+)?|true|false)/i, "").trim();
  const typed = parseType(typeSource, name);
  const parsedDefault = typedDefault({ name, ...typed }, defaultMatch?.[1]);
  return {
    field: {
      name,
      ...typed,
      notNull: notNull || identity || primaryKey,
      required: (notNull && parsedDefault === undefined) || identity || primaryKey,
      default: parsedDefault,
    },
    primaryKey,
    identity,
  };
}

function loadCatalog(): Record<RetailTableName, RetailTable> {
  const sql = retailSql();
  const tables = {} as Record<RetailTableName, RetailTable>;
  const expression = /CREATE TABLE __SCHEMA__\."([^"]+)"\s*\(([\s\S]*?)\n\);/g;
  for (const match of sql.matchAll(expression)) {
    const name = match[1];
    if (!retailSyncTables.includes(name as RetailTableName)) continue;
    const columns = match[2].split("\n").map(parseColumn).filter((column) => column !== "skip");
    const fields = columns.map((column) => column.field);
    const primary = columns.find((column) => column.primaryKey);
    const identities = columns.filter((column) => column.identity);
    const key = primary?.field.name ?? (identities.length === 1 ? identities[0].field.name : undefined);
    if (!key) throw new ReportingError(`Retail table ${name} has no sync key.`, 503);
    tables[name as RetailTableName] = { name: name as RetailTableName, key, fields };
  }
  for (const name of retailSyncTables) {
    if (!tables[name]) throw new ReportingError(`Retail table ${name} is not available.`, 503);
  }
  return tables;
}

let catalog: Record<RetailTableName, RetailTable> | undefined;

export function retailTable(name: RetailTableName): RetailTable {
  catalog ??= loadCatalog();
  return catalog[name];
}

export function quoteRetailIdent(name: string) {
  if (!quoteIdent.test(name)) throw new ReportingError("Invalid retail column.", 503);
  return `"${name}"`;
}
