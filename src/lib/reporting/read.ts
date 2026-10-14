import type { Client } from "pg";
import { ReportingError, businessDate, schemaIdentifier } from "./snapshot.ts";
import type { ReportingScope } from "./sync.ts";

export type ReportFilters = { from: string; to: string; limit: number; offset: number; orderCode?: string };

export function parseReportFilters(params: URLSearchParams): ReportFilters {
  const from = businessDate(params.get("from"));
  const to = businessDate(params.get("to"));
  if (from > to) throw new ReportingError("from must not be after to.");
  const limit = params.get("limit") ?? "50";
  const offset = params.get("offset") ?? "0";
  if (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 200 || !/^\d+$/.test(offset) || !Number.isSafeInteger(Number(offset))) throw new ReportingError("Invalid pagination.");
  const orderCode = params.get("order_code") ?? undefined;
  if (orderCode !== undefined && (!orderCode || orderCode.length > 50)) throw new ReportingError("Invalid order_code.");
  return { from, to, limit: Number(limit), offset: Number(offset), orderCode };
}

// Resolve scope and access on the SAME connection/transaction used for reading.
export async function resolveReportingScope(db: Pick<Client, "query">, user: { id: string; role: string }, storeCode: string): Promise<ReportingScope & { timezone: string }> {
  const result = await db.query<{ schema_name: string; timezone: string }>(`
    SELECT r.schema_name, s.timezone
    FROM public.stores s JOIN public.store_reporting_schemas r ON r.store_code = s.store_code
    JOIN public.auth_users u ON u.id = $2
    WHERE s.store_code = $1 AND s.active AND r.reporting_version = 1 AND u.active
      AND (u.role = 'ADMIN' OR EXISTS (SELECT 1 FROM public.store_access a WHERE a.user_id = u.id AND a.store_code = s.store_code))`, [storeCode, user.id]);
  const row = result.rows[0];
  if (!row) throw new ReportingError("Store reporting is unavailable or not accessible.", 403);
  return { schemaName: row.schema_name, storeCode, timezone: row.timezone };
}

export async function readOrderReport(db: Pick<Client, "query">, scope: ReportingScope, filters: ReportFilters) {
  const schema = schemaIdentifier(scope.schemaName);
  const where = "store_code = $1 AND business_date BETWEEN $2::date AND $3::date";
  const values = [scope.storeCode, filters.from, filters.to];
  // These sums each read exactly one source table. Card attempts are not tender revenue.
  const totals = await db.query(`SELECT
    (SELECT count(*)::int FROM ${schema}.tbl_rpt_order WHERE ${where}) AS order_count,
    (SELECT COALESCE(sum(total), 0)::text FROM ${schema}.tbl_rpt_order WHERE ${where}) AS order_total,
    (SELECT COALESCE(sum(subtotal), 0)::text FROM ${schema}.tbl_rpt_order_item WHERE ${where}) AS item_subtotal,
    (SELECT COALESCE(sum(payment_amount), 0)::text FROM ${schema}.tbl_rpt_payment WHERE ${where}) AS payment_amount,
    (SELECT max(received_at) FROM ${schema}.sync_requests WHERE store_code = $1 AND result = 'accepted') AS last_synced_at`, values);
  const orders = await db.query(`SELECT order_code, order_number, business_date::text, station_code, shift_code,
    order_status, payment_status, total::text, paid_amount::text, balance_amount::text,
    is_void, is_return, source_revision::text, rpt_updated_on
    FROM ${schema}.tbl_rpt_order WHERE ${where}
    ORDER BY business_date DESC, order_code LIMIT $4 OFFSET $5`, [...values, filters.limit, filters.offset]);
  let detail = null;
  if (filters.orderCode) {
    const parent = await db.query(`SELECT * FROM ${schema}.tbl_rpt_order WHERE store_code = $1 AND order_code = $2 AND business_date BETWEEN $3::date AND $4::date`, [scope.storeCode, filters.orderCode, filters.from, filters.to]);
    if (!parent.rowCount) throw new ReportingError("Order not found.", 404);
    const children = [];
    for (const table of ["tbl_rpt_order_item", "tbl_rpt_payment", "tbl_rpt_card_payment"]) {
      children.push((await db.query(`SELECT * FROM ${schema}.${table} WHERE store_code = $1 AND order_code = $2`, [scope.storeCode, filters.orderCode])).rows);
    }
    detail = { order: parent.rows[0], items: children[0], payments: children[1], card_payments: children[2] };
  }
  return { storeCode: scope.storeCode, filters, totals: totals.rows[0], orders: orders.rows, detail };
}
