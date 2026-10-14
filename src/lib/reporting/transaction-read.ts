import type { Client } from "pg";
import { businessDate, ReportingError, schemaIdentifier } from "./snapshot.ts";
import type { ReportingScope } from "./sync.ts";
import type { TransactionDetail, TransactionReport, TransactionRow } from "./transaction-types.ts";

export type TransactionFilters = {
  from?: string; to?: string; orderCode?: string; limit: number; offset: number;
  checkNo: string; transactionNo: string; creditCard: string; menuItem: string;
  sku: string; paidBy: string; department: string; transType: string;
};

export function parseTransactionFilters(params: URLSearchParams): TransactionFilters {
  const text = (key: string, max = 500) => {
    const value = (params.get(key) ?? "").trim();
    if (value.length > max) throw new ReportingError(`Invalid ${key}.`);
    return value;
  };
  const orderCode = text("order_code", 50) || undefined;
  if (params.has("order_code") && !orderCode) throw new ReportingError("Invalid order_code.");
  const from = orderCode ? undefined : businessDate(params.get("from"));
  const to = orderCode ? undefined : businessDate(params.get("to"));
  if (from && to && from > to) throw new ReportingError("from must not be after to.");
  const limit = params.get("limit") ?? "20";
  const offset = params.get("offset") ?? "0";
  if (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 200 || !/^\d+$/.test(offset) || !Number.isSafeInteger(Number(offset))) {
    throw new ReportingError("Invalid pagination.");
  }
  return { from, to, orderCode, limit: Number(limit), offset: Number(offset),
    checkNo: text("check_no"), transactionNo: text("transaction_no"), creditCard: text("credit_card", 150),
    menuItem: text("menu_item"), sku: text("sku", 100), paidBy: text("paid_by", 50),
    department: text("department", 50), transType: text("trans_type", 50) };
}

export async function readTransactionReport(
  db: Pick<Client, "query">, scope: ReportingScope & { timezone: string }, filters: TransactionFilters,
): Promise<TransactionReport> {
  const schema = schemaIdentifier(scope.schemaName);
  const values: unknown[] = [scope.storeCode];
  const bind = (value: unknown) => { values.push(value); return `$${values.length}`; };
  const conditions = ["o.store_code = $1"];
  if (filters.orderCode) {
    conditions.push(`o.order_code = ${bind(filters.orderCode)}`);
  } else {
    const timezone = bind(scope.timezone);
    conditions.push(`o.created_at >= (${bind(filters.from)}::date::timestamp AT TIME ZONE ${timezone})`);
    conditions.push(`o.created_at < ((${bind(filters.to)}::date + 1)::timestamp AT TIME ZONE ${timezone})`);
  }
  // Literal substring searches: user input cannot become a SQL LIKE pattern.
  const contains = (column: string, value: string) => `strpos(lower(COALESCE(${column}, '')), lower(${bind(value)})) > 0`;
  if (!filters.orderCode) {
    if (filters.checkNo) conditions.push(contains("o.checkid", filters.checkNo));
    if (filters.transactionNo) conditions.push(contains("o.order_code", filters.transactionNo));
    if (filters.transType) conditions.push(`o.payment_status = ${bind(filters.transType)}`);
    for (const [value, column] of [[filters.menuItem, "item_name"], [filters.sku, "menu_item_code"]]) {
      if (value) conditions.push(`EXISTS (SELECT 1 FROM ${schema}.tbl_rpt_order_item i WHERE i.store_code = o.store_code AND i.order_code = o.order_code AND ${contains(`i.${column}`, value)})`);
    }
    if (filters.department) conditions.push(`EXISTS (SELECT 1 FROM ${schema}.tbl_rpt_order_item i WHERE i.store_code = o.store_code AND i.order_code = o.order_code AND i.department_code = ${bind(filters.department)})`);
    if (filters.creditCard) conditions.push(`EXISTS (SELECT 1 FROM ${schema}.tbl_rpt_payment p WHERE p.store_code = o.store_code AND p.order_code = o.order_code AND ${contains("p.mask_pan", filters.creditCard)})`);
    if (filters.paidBy) conditions.push(`EXISTS (SELECT 1 FROM ${schema}.tbl_rpt_payment p WHERE p.store_code = o.store_code AND p.order_code = o.order_code AND p.tender_name = ${bind(filters.paidBy)})`);
  }
  const cte = `WITH selected_orders AS (
    SELECT o.* FROM ${schema}.tbl_rpt_order o WHERE ${conditions.join(" AND ")}
  ), item_totals AS (
    SELECT i.store_code, i.order_code, sum(i.subtotal) AS subtotal,
      sum(i.tax_amt + i.tran_discount_tax + i.item_discount_tax) AS tax,
      sum(i.tran_discount + i.item_discount) AS discount
    FROM ${schema}.tbl_rpt_order_item i JOIN selected_orders o USING (store_code, order_code)
    GROUP BY i.store_code, i.order_code
  ), payment_totals AS (
    SELECT p.store_code, p.order_code, sum(p.tip_amount) AS tips,
      sum(p.total_amount - p.change_amount) AS total,
      string_agg(DISTINCT NULLIF(p.tender_name, ''), ', ' ORDER BY NULLIF(p.tender_name, '')) AS paid_by
    FROM ${schema}.tbl_rpt_payment p JOIN selected_orders o USING (store_code, order_code)
    GROUP BY p.store_code, p.order_code
  ), transactions AS (
    SELECT o.order_code AS id, COALESCE(NULLIF(o.checkid, ''), '—') AS "checkNo",
      o.created_at AS "createdAt", COALESCE(i.subtotal, 0) AS subtotal,
      COALESCE(i.tax, 0) AS tax, COALESCE(i.discount, 0) AS discount, o.gratuity, o.fees,
      COALESCE(p.tips, 0) AS tips, COALESCE(p.total, 0) AS total,
      COALESCE(p.paid_by, '—') AS "paidBy", COALESCE(NULLIF(o.station_code, ''), '—') AS terminal,
      '—' AS cashier, COALESCE(NULLIF(o.payment_status, ''), '—') AS "transType"
    FROM selected_orders o LEFT JOIN item_totals i USING (store_code, order_code)
    LEFT JOIN payment_totals p USING (store_code, order_code)
  )`;
  const summary = (await db.query(`${cte} SELECT count(*)::int AS count,
    COALESCE(sum(total) FILTER (WHERE "transType" = 'PAID'), 0)::text AS sales,
    abs(COALESCE(sum(total) FILTER (WHERE "transType" = 'RETURN'), 0))::text AS refunds,
    COALESCE(avg(total) FILTER (WHERE "transType" = 'PAID'), 0)::text AS average,
    COALESCE(sum(tips), 0)::text AS tips, COALESCE(sum(gratuity), 0)::text AS gratuity,
    COALESCE(sum(fees), 0)::text AS fees FROM transactions`, values)).rows[0];
  const rows = (await db.query<TransactionRow>(`${cte} SELECT id, "checkNo", "createdAt",
    subtotal::text, tax::text, discount::text, gratuity::text, fees::text, tips::text, total::text,
    "paidBy", terminal, cashier, "transType" FROM transactions
    ORDER BY "createdAt" DESC, id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, filters.orderCode ? 1 : filters.limit, filters.orderCode ? 0 : filters.offset])).rows;
  // Dropdowns use store data rather than the currently selected tender/department.
  const tenders = (await db.query(`SELECT DISTINCT tender_name AS value FROM ${schema}.tbl_rpt_payment WHERE store_code = $1 AND NULLIF(tender_name, '') IS NOT NULL ORDER BY value`, [scope.storeCode])).rows.map(r => r.value as string);
  const departments = (await db.query(`SELECT department_code AS id, COALESCE(max(NULLIF(department_name, '')), department_code) AS label FROM ${schema}.tbl_rpt_order_item WHERE store_code = $1 AND NULLIF(department_code, '') IS NOT NULL GROUP BY department_code ORDER BY label`, [scope.storeCode])).rows as { id: string; label: string }[];
  const statuses = (await db.query(`SELECT DISTINCT payment_status AS value FROM ${schema}.tbl_rpt_order WHERE store_code = $1 AND NULLIF(payment_status, '') IS NOT NULL ORDER BY value`, [scope.storeCode])).rows.map(r => r.value as string);
  let detail: TransactionDetail | null = null;
  if (filters.orderCode) {
    if (!rows.length) throw new ReportingError("Transaction not found.", 404);
    const items = (await db.query(`SELECT order_item_code AS id, COALESCE(NULLIF(item_name, ''), '—') AS name,
      COALESCE(NULLIF(menu_item_code, ''), '—') AS sku, quantity::text AS qty, subtotal::text AS amount
      FROM ${schema}.tbl_rpt_order_item WHERE store_code = $1 AND order_code = $2 ORDER BY order_item_code`, [scope.storeCode, filters.orderCode])).rows as TransactionDetail["items"];
    const payments = (await db.query(`SELECT payment_code AS id, COALESCE(NULLIF(tender_name, ''), '—') AS method,
      (total_amount - change_amount)::text AS amount FROM ${schema}.tbl_rpt_payment
      WHERE store_code = $1 AND order_code = $2 ORDER BY payment_split_no, payment_code`, [scope.storeCode, filters.orderCode])).rows as TransactionDetail["payments"];
    detail = { ...rows[0], items, payments };
  }
  const { count, ...totals } = summary;
  return { storeCode: scope.storeCode, timezone: scope.timezone, rows, count, totals,
    options: { tenders, departments, statuses }, detail };
}
