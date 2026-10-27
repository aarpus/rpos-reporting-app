import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { parseTransactionFilters, readTransactionReport } from "../src/lib/reporting/transaction-read.ts";
import { resolveReportingScope } from "../src/lib/reporting/read.ts";

const filters = (extra = {}) => parseTransactionFilters(new URLSearchParams({ from: "2026-10-13", to: "2026-10-13", ...extra }));

test("transaction filter validation and independent receipt lookup", () => {
  for (const extra of [{ from: "2026-02-30" }, { to: "2026-10-12" }, { limit: "201" }, { limit: "0" }, { offset: "-1" }, { offset: "9007199254740992" }, { order_code: "" }, { sku: "x".repeat(101) }]) {
    assert.throws(() => filters(extra));
  }
  const detail = parseTransactionFilters(new URLSearchParams({ order_code: "ORDER-1" }));
  assert.equal(detail.from, undefined);
  assert.equal(detail.orderCode, "ORDER-1");
});

test("transaction aggregates, searches, pagination, scope, receipts and local date boundaries", async t => {
  const engine = new PGlite();
  t.after(() => engine.close());
  const db = { query: async (sql, values = []) => {
    const result = await engine.query(sql, values);
    return { rows: result.rows, rowCount: result.rows.length };
  } };
  await engine.exec(`CREATE TABLE public.stores (store_code varchar(64) PRIMARY KEY, timezone text, active boolean, store_type text NOT NULL DEFAULT 'RESTAURANT');
    CREATE TABLE public.auth_users (id text PRIMARY KEY, role text, active boolean);
    CREATE TABLE public.store_access (user_id text, store_code text);
    CREATE TABLE public.store_reporting_schemas (store_code text, schema_name text, reporting_version int);
    INSERT INTO public.stores (store_code, timezone, active) VALUES ('DT01', 'Asia/Kolkata', true), ('WS01', 'America/New_York', true);
    INSERT INTO public.auth_users VALUES ('user', 'USER', true), ('admin', 'ADMIN', true);
    INSERT INTO public.store_access VALUES ('user', 'DT01');
    INSERT INTO public.store_reporting_schemas VALUES ('DT01', 'store_dt01', 1), ('WS01', 'store_ws01', 1);`);
  const migration = await readFile(new URL("../prisma/migrations/20261013000000_store_code_schema_names/migration.sql", import.meta.url), "utf8");
  const ddl = migration.slice(migration.indexOf("CREATE TABLE __SCHEMA__.reporting_stores"), migration.indexOf("CREATE TABLE __SCHEMA__.tbl_rpt_card_payment"));
  for (const [code, schema] of [["DT01", "store_dt01"], ["WS01", "store_ws01"]]) {
    await engine.exec(`CREATE SCHEMA ${schema};` + ddl.replaceAll("__SCHEMA__", schema).replaceAll("__STORE_CODE__", `'${code}'`) + `INSERT INTO ${schema}.reporting_stores VALUES ('${code}');`);
  }
  const scope = await resolveReportingScope(db, { id: "user", role: "USER" }, "DT01");
  await assert.rejects(resolveReportingScope(db, { id: "user", role: "USER" }, "WS01"), error => error.status === 403);
  const order = async (schema, store, code, created, status = "PAID") => db.query(`INSERT INTO ${schema}.tbl_rpt_order
    (store_code, order_code, checkid, business_date, created_at, source_revision, snapshot_hash, payment_status, station_code, gratuity, fees)
    VALUES ($1, $2, '42', '2026-10-01', $3, 1, 'hash', $4, 'POS-1', 2, 3)`, [store, code, created, status]);
  await order("store_dt01", "DT01", "ORDER-1", "2026-10-13T00:00:00+05:30");
  await order("store_dt01", "DT01", "EMPTY", "2026-10-13T23:59:59+05:30", "VOID");
  await order("store_dt01", "DT01", "BEFORE", "2026-10-12T23:59:59+05:30");
  await order("store_dt01", "DT01", "AFTER", "2026-10-14T00:00:00+05:30");
  await engine.exec(`INSERT INTO store_dt01.tbl_rpt_order_item
    (store_code, order_code, order_number, order_item_code, business_date, subtotal, tax_amt, tran_discount_tax, item_discount_tax, tran_discount, item_discount, item_name, menu_item_code, department_code, department_name)
    VALUES ('DT01', 'ORDER-1', '1', 'I1', '2026-10-01', 10, 1, .1, .2, -.5, -.2, 'Pizza', 'SKU-1', 'FOOD', 'Food'),
      ('DT01', 'ORDER-1', '1', 'I2', '2026-10-01', 20, 2, .2, .3, -1, -.3, 'Drink', 'SKU-2', 'DRINK', 'Drinks');
    INSERT INTO store_dt01.tbl_rpt_payment
    (store_code, order_code, payment_code, business_date, tender_name, total_amount, change_amount, tip_amount, mask_pan)
    VALUES ('DT01', 'ORDER-1', 'P1', '2026-10-01', 'Cash', 20, 5, 1, NULL),
      ('DT01', 'ORDER-1', 'P2', '2026-10-01', 'Credit Card', 22, 0, 2, '**** 1234'),
      ('DT01', 'ORDER-1', 'P3', '2026-10-01', 'Cash', 3, 0, 0, NULL);`);
  const report = await readTransactionReport(db, scope, filters({ limit: "1" }));
  assert.equal(report.count, 2);
  assert.equal(report.rows.length, 1);
  assert.equal(report.rows[0].id, "EMPTY");
  assert.equal(report.rows[0].total, "0");
  assert.equal(report.rows[0].paidBy, "—");
  assert.equal(report.totals.sales, "40.00");
  assert.equal(report.totals.average, "40.0000000000000000");
  assert.equal(report.totals.tips, "3.00");
  assert.equal(report.totals.gratuity, "4.00");
  assert.equal(report.totals.fees, "6.00");
  for (const extra of [{ check_no: "42" }, { transaction_no: "ORDER-1" }, { credit_card: "1234" }, { menu_item: "piz" }, { sku: "SKU-1" }, { paid_by: "Cash" }, { department: "FOOD" }, { trans_type: "PAID" }, { offset: "1", limit: "1" }]) {
    const result = await readTransactionReport(db, scope, filters(extra));
    const row = result.rows.find(r => r.id === "ORDER-1");
    assert.ok(row);
    assert.equal(row.subtotal, "30.00");
    assert.equal(row.tax, "3.80");
    assert.equal(row.discount, "-2.00");
    assert.equal(row.total, "40.00");
    assert.equal(row.paidBy, "Cash, Credit Card");
    assert.equal(row.terminal, "POS-1");
    assert.equal(row.cashier, "—");
  }
  assert.equal((await readTransactionReport(db, scope, filters({ menu_item: "%" }))).count, 0);
  const receipt = await readTransactionReport(db, scope, parseTransactionFilters(new URLSearchParams({ order_code: "ORDER-1" })));
  assert.equal(receipt.detail.items.length, 2);
  assert.equal(receipt.detail.payments.length, 3);
  assert.equal(receipt.detail.payments[0].amount, "15.00");
  await assert.rejects(readTransactionReport(db, scope, filters({ order_code: "missing" })), error => error.status === 404);
  await order("store_dt01", "DT01", "RETURN", "2026-10-13T12:00:00+05:30", "RETURN");
  await engine.exec(`INSERT INTO store_dt01.tbl_rpt_payment (store_code, order_code, payment_code, business_date, total_amount, tip_amount) VALUES ('DT01', 'RETURN', 'RP1', '2026-10-01', -8.64, -1);`);
  const refunds = await readTransactionReport(db, scope, filters());
  assert.equal(refunds.totals.refunds, "8.64");
  assert.equal(refunds.totals.tips, "2.00");
  assert.deepEqual(refunds.options.statuses, ["PAID", "RETURN", "VOID"]);
  assert.deepEqual(refunds.options.tenders, ["Cash", "Credit Card"]);
  assert.equal(refunds.options.departments.length, 2);
  // New York's fall DST transition produces a 25-hour local day.
  const west = await resolveReportingScope(db, { id: "admin", role: "ADMIN" }, "WS01");
  await order("store_ws01", "WS01", "DST-START", "2026-11-01T04:00:00Z");
  await order("store_ws01", "WS01", "DST-END", "2026-11-02T04:59:59Z");
  await order("store_ws01", "WS01", "NEXT-DAY", "2026-11-02T05:00:00Z");
  const dst = await readTransactionReport(db, west, filters({ from: "2026-11-01", to: "2026-11-01" }));
  assert.equal(dst.count, 2);
  assert.deepEqual(dst.rows.map(r => r.id), ["DST-END", "DST-START"]);
  await assert.rejects(readTransactionReport(db, west, filters({ order_code: "ORDER-1" })), error => error.status === 404);
});
