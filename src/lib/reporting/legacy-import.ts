import type { Client } from "pg";
import { parseSnapshot, ReportingError, tables, type ReportRow } from "./snapshot.ts";

const orderTables = ["tbl_rpt_order", "tbl_rpt_order_item", "tbl_rpt_payment", "tbl_rpt_card_payment"] as const;
type OrderTable = (typeof orderTables)[number];

// Caller owns a read-only repeatable-read transaction. Read all four source tables
// before syncing so concurrent POS updates cannot produce a mixed order snapshot.
export async function readLegacySnapshots(db: Pick<Client, "query">, storeCode: string, timezone: string) {
  const source = {} as Record<OrderTable, ReportRow[]>;
  for (const table of orderTables) {
    const types = await db.query<{ column_name: string; data_type: string }>("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1", [table]);
    const available = new Map(types.rows.map((row) => [row.column_name, row.data_type]));
    if (!available.size) throw new ReportingError(`Missing source table public.${table}.`);
    const selected = tables[table].fields.filter((field) => available.has(field.name)).map((field) => {
      const name = `"${field.name}"`;
      if (field.kind === "timestamp") return `${name}${available.get(field.name) === "timestamp without time zone" ? " AT TIME ZONE $2" : ""} AS ${name}`;
      if (["decimal", "bigint", "date"].includes(field.kind)) return `${name}::text AS ${name}`;
      return name;
    });
    const needsTimezone = selected.some((entry) => entry.includes("AT TIME ZONE $2"));
    const rows = await db.query(`SELECT ${selected.join(", ")} FROM public.${table} WHERE store_code = $1`, needsTimezone ? [storeCode, timezone] : [storeCode]);
    source[table] = rows.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value])));
  }
  const snapshots = source.tbl_rpt_order.map((order) => parseSnapshot({
    request_id: `public-import:${storeCode}:${order.order_code}`, source_revision: "1", order,
    items: source.tbl_rpt_order_item.filter((row) => row.order_code === order.order_code),
    payments: source.tbl_rpt_payment.filter((row) => row.order_code === order.order_code),
    card_payments: source.tbl_rpt_card_payment.filter((row) => row.order_code === order.order_code),
  }, storeCode));
  const parentCodes = new Set(snapshots.map((snapshot) => snapshot.order.order_code));
  if (parentCodes.size !== snapshots.length) throw new ReportingError("Duplicate source order codes; repair source records before importing.");
  for (const table of ["tbl_rpt_order_item", "tbl_rpt_payment", "tbl_rpt_card_payment"] as const) {
    if (source[table].some((row) => !parentCodes.has(row.order_code))) throw new ReportingError(`Orphan source records in ${table}; repair them before importing.`);
    const codes = source[table].map((row) => row[tables[table].key]);
    if (new Set(codes).size !== codes.length) throw new ReportingError(`Duplicate source record codes in ${table}.`);
  }
  return snapshots;
}
