import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { ReportingError } from "../src/lib/reporting/snapshot.ts";
import { parseRetailShift } from "../src/lib/reporting/retail-snapshot.ts";
import { syncRetailShift } from "../src/lib/reporting/retail-sync.ts";
import { readShiftEndDetail, readShiftEndList } from "../src/lib/reporting/retail-shift-read.ts";
import { parseRetailDayEnd, readDayEndDetail, readDayEndList, syncRetailDayEnd } from "../src/lib/reporting/retail-day-end.ts";
import {
  parseRetailTransactionJournal,
  readJournalDetail,
  readJournalList,
  syncRetailTransactionJournal,
} from "../src/lib/reporting/retail-transaction-journal.ts";
import { parseRetailCreditCard, readCreditCardList, syncRetailCreditCard } from "../src/lib/reporting/retail-credit-card.ts";
import {
  parseRetailMonthlySalesTax,
  readMonthlySalesTax,
  sumMonthlySalesTaxRows,
  syncRetailMonthlySalesTax,
} from "../src/lib/reporting/retail-monthly-sales-tax.ts";
import { parseRetailInvoice, readInvoiceDetail, readInvoiceList, syncRetailInvoice } from "../src/lib/reporting/retail-invoice.ts";
import { groupNoUpcRows, parseRetailNoUpc, readNoUpcList, syncRetailNoUpc } from "../src/lib/reporting/retail-noupc.ts";

const retailDdlUrl = new URL("../database/reporting/retail/001-tables.sql", import.meta.url);

function database(engine) {
  return {
    query: async (sql, values = []) => {
      const result = await engine.query(sql, values);
      return { rows: result.rows, rowCount: result.affectedRows || result.rows.length };
    },
  };
}

async function retailDb() {
  const engine = new PGlite();
  const ddl = (await readFile(retailDdlUrl, "utf8")).replaceAll("__SCHEMA__", '"store_rs01"');
  await engine.exec(`
    CREATE SCHEMA store_rs01;
    CREATE TABLE public.stores (store_code varchar(64) PRIMARY KEY, active boolean NOT NULL, store_type text NOT NULL);
    CREATE TABLE public.store_reporting_schemas (
      store_code varchar(64) PRIMARY KEY,
      schema_name text NOT NULL,
      reporting_version integer NOT NULL
    );
    INSERT INTO public.stores VALUES ('RS01', true, 'RETAIL');
    INSERT INTO public.store_reporting_schemas VALUES ('RS01', 'store_rs01', 1);
    ${ddl}
  `);
  return { engine, db: database(engine), scope: { schemaName: "store_rs01", storeCode: "RS01" } };
}

const shift = {
  request_id: "retail-shift-1",
  shift: {
    shiftid: "201",
    stationname: "REG1",
    batch_number: "5",
    shift: "2",
    start_time: "2026-10-27T04:05:00Z",
    end_time: "2026-10-27T10:12:28Z",
    status: "Close",
    employeename: "Ada",
    employeeid: "4",
    totaltime: "06:07:28",
    sale: [{ label: "Beer", value: "520.00" }, { label: "Wine", value: "140.00" }],
    taxes: [{ label: "Total", value: "46.80" }],
    sale_breakdown: [{ label: "Cash", value: "351.85" }],
    terminalcashstatus: [{ label: "Opening Balance", value: "23.23" }],
    miscellaneous: [{ label: "No Sale Hit Count", value: "0" }],
    terminalcashtransfer: [],
  },
};

test("retail shift payloads reject unknown fields", () => {
  const parsedShift = parseRetailShift(shift);
  assert.equal(parsedShift.shift.status, "Close");
  assert.equal(parsedShift.shift.sale[1].label, "Wine");
  assert.throws(() => parseRetailShift({ ...shift, shift: { ...shift.shift, batchid: "101" } }), ReportingError);
});

test("retail shift upserts stay inside the retail schema", async () => {
  const { engine, db, scope } = await retailDb();
  assert.equal((await syncRetailShift(db, scope, parseRetailShift(shift))).status, "accepted");
  assert.equal((await syncRetailShift(db, scope, parseRetailShift(shift))).status, "duplicate");
  const closedAgain = parseRetailShift({
    ...shift,
    request_id: "retail-shift-2",
    shift: { ...shift.shift, sale: [{ label: "Beer", value: "530.00" }, { label: "Wine", value: "140.00" }] },
  });
  assert.equal((await syncRetailShift(db, scope, closedAgain)).status, "accepted");
  assert.equal((await syncRetailShift(db, scope, closedAgain)).status, "duplicate");
  const reportScope = { ...scope, timezone: "UTC" };
  const listed = await readShiftEndList(db, reportScope, { from: "2026-10-27", to: "2026-10-27" });
  assert.equal(listed.length, 1);
  assert.equal(listed[0].batch_number, "5");
  assert.equal(listed[0].status, "Close");
  const later = await readShiftEndList(db, reportScope, { from: "2026-10-28", to: "2026-10-28" });
  assert.equal(later.length, 0);
  const detail = await readShiftEndDetail(db, reportScope, listed[0].id);
  assert.equal(detail?.sale[0].value, "530.00");
  assert.equal(detail?.totaltime, "06:07:28");
  assert.equal(detail?.employeename, "Ada");
  const openShift = parseRetailShift({
    request_id: "retail-shift-open",
    shift: {
      shiftid: "301",
      stationname: "REG2",
      batch_number: "6",
      shift: "3",
      start_time: "2026-10-01T08:00:00Z",
      status: "Open",
    },
  });
  assert.equal((await syncRetailShift(db, scope, openShift)).status, "accepted");
  const openListed = await readShiftEndList(db, reportScope, { from: "2026-10-28", to: "2026-10-28" });
  assert.deepEqual(openListed.map((row) => row.shiftid), ["301"]);
  const reports = await engine.query(`SELECT "sale"->0->>'value' AS beer FROM store_rs01."tbl_shift_end_report" WHERE "shiftid" = 201`);
  assert.equal(reports.rows[0].beer, "530.00");
  await engine.query("UPDATE public.stores SET store_type = 'RESTAURANT' WHERE store_code = 'RS01'");
  await assert.rejects(
    syncRetailShift(db, scope, parseRetailShift({ ...shift, request_id: "retail-shift-3" })),
    (error) => error instanceof ReportingError && error.status === 403,
  );
  await engine.close();
});

const dayEnd = {
  request_id: "retail-day-end-5",
  day_end: {
    batchid: "5",
    batch_number: "5",
    start_date_time: "2026-10-27T04:00:00Z",
    end_date_time: "2026-10-27T23:05:00Z",
    status: "Close",
    employeename: "Ada",
    department_sales: {
      rows: [{ trans: "12", name: "Beer", quantity: "18", discountAmount: "4.00", discountPercent: "0.76", subTotal: "520.00", tax: "46.80", total: "566.80", share: "61.20" }],
      total: { trans: "", name: "Total", quantity: "18", discountAmount: "4.00", discountPercent: "0.76", subTotal: "520.00", tax: "46.80", total: "566.80", share: "100.00" },
    },
    sales_summary: [{ label: "Net Sales Amount", value: "520.00" }],
    paid_out: { rows: [], total: "15.00" },
    paid_in: { rows: [], total: "" },
  },
};

test("day-end batches upsert once and stay visible for the day, week, and month", async () => {
  const { engine, db, scope } = await retailDb();
  const reportScope = { ...scope, timezone: "America/New_York" };
  assert.throws(() => parseRetailDayEnd({ ...dayEnd, day_end: { ...dayEnd.day_end, end_date_time: null } }), ReportingError);
  const parsed = parseRetailDayEnd(dayEnd);
  assert.equal((await syncRetailDayEnd(db, scope, parsed)).status, "accepted");
  assert.equal((await syncRetailDayEnd(db, scope, parsed)).status, "duplicate");
  const open = parseRetailDayEnd({
    request_id: "retail-day-end-6",
    day_end: {
      batchid: "6",
      batch_number: "6",
      start_date_time: "2026-10-28T04:00:00Z",
      status: "Open",
    },
  });
  assert.equal((await syncRetailDayEnd(db, scope, open)).status, "accepted");
  const day = await readDayEndList(db, reportScope, { from: "2026-10-27", to: "2026-10-27" });
  assert.deepEqual(day.map((row) => row.batchid), ["5"]);
  const week = await readDayEndList(db, reportScope, { from: "2026-10-26", to: "2026-11-01" });
  assert.deepEqual(week.map((row) => row.batchid), ["5", "6"]);
  const month = await readDayEndList(db, reportScope, { from: "2026-10-01", to: "2026-10-31" });
  assert.deepEqual(month.map((row) => row.batchid), ["5", "6"]);
  const detail = await readDayEndDetail(db, reportScope, day[0].id);
  assert.equal(detail?.department_sales.rows[0].name, "Beer");
  assert.equal(detail?.department_sales.total?.name, "Total");
  assert.equal(detail?.paid_out.total, "15.00");
  assert.equal(detail?.sales_summary.length, 1);
  const changed = parseRetailDayEnd({
    ...dayEnd,
    request_id: "retail-day-end-5b",
    day_end: { ...dayEnd.day_end, sales_summary: [{ label: "Net Sales Amount", value: "530.00" }] },
  });
  assert.equal((await syncRetailDayEnd(db, scope, changed)).status, "accepted");
  assert.equal((await readDayEndDetail(db, reportScope, day[0].id))?.sales_summary[0].value, "530.00");
  await engine.close();
});

test("transaction journal upserts by transaction id and filters by store date and number", async () => {
  const { engine, db, scope } = await retailDb();
  const reportScope = { ...scope, timezone: "UTC" };
  const samples = JSON.parse(await readFile(new URL("../docs/postman/store-reporting-retail-transaction-journal.postman_data.json", import.meta.url), "utf8"));
  const first = parseRetailTransactionJournal(samples[0]);
  const second = parseRetailTransactionJournal(samples[1]);
  assert.equal((await syncRetailTransactionJournal(db, scope, first)).status, "accepted");
  assert.equal((await syncRetailTransactionJournal(db, scope, first)).status, "duplicate");
  assert.equal((await syncRetailTransactionJournal(db, scope, second)).status, "accepted");
  const day = await readJournalList(db, reportScope, { from: "2026-10-27", to: "2026-10-27", transactionNumber: "" });
  assert.deepEqual(day.map((row) => row.transaction_number), ["ACFG866202"]);
  const numbered = await readJournalList(db, reportScope, { from: "2026-10-27", to: "2026-10-28", transactionNumber: "866203" });
  assert.deepEqual(numbered.map((row) => row.transactionid), ["302"]);
  const detail = await readJournalDetail(db, reportScope, day[0].id);
  assert.equal(detail?.lines.rows[0].itemNo, "7726");
  assert.equal(detail?.credit_card[0].label, "Auth Code");
  assert.equal(detail?.paid_by, "Card");
  const changed = parseRetailTransactionJournal({
    ...samples[0],
    request_id: "example-retail-journal-301b",
    transaction_journal: { ...samples[0].transaction_journal, total: "22.00" },
  });
  assert.equal((await syncRetailTransactionJournal(db, scope, changed)).status, "accepted");
  assert.equal((await readJournalDetail(db, reportScope, day[0].id))?.total, "22.00");
  await engine.close();
});

test("credit card rows upsert once and split card charges from external pay by date", async () => {
  const { engine, db, scope } = await retailDb();
  const reportScope = { ...scope, timezone: "UTC" };
  const samples = JSON.parse(await readFile(new URL("../docs/postman/store-reporting-retail-credit-card.postman_data.json", import.meta.url), "utf8"));
  const debit = parseRetailCreditCard(samples[0]);
  const credit = parseRetailCreditCard(samples[1]);
  const external = parseRetailCreditCard(samples[2]);
  assert.equal((await syncRetailCreditCard(db, scope, debit)).status, "accepted");
  assert.equal((await syncRetailCreditCard(db, scope, debit)).status, "duplicate");
  assert.equal((await syncRetailCreditCard(db, scope, credit)).status, "accepted");
  assert.equal((await syncRetailCreditCard(db, scope, external)).status, "accepted");
  const day = await readCreditCardList(db, reportScope, { from: "2026-10-27", to: "2026-10-27" });
  assert.deepEqual(day.map((row) => row.tender), ["debit", "credit"]);
  assert.equal(day[1].amount, "-1.00");
  const nextDay = await readCreditCardList(db, reportScope, { from: "2026-10-28", to: "2026-10-28" });
  assert.deepEqual(nextDay.map((row) => row.transaction_type), ["ExternalPay"]);
  const changed = parseRetailCreditCard({
    ...samples[0],
    request_id: "example-retail-card-401b",
    credit_card: { ...samples[0].credit_card, amount: "30.00" },
  });
  assert.equal((await syncRetailCreditCard(db, scope, changed)).status, "accepted");
  assert.equal((await readCreditCardList(db, reportScope, { from: "2026-10-27", to: "2026-10-27" }))[0].amount, "30.00");
  await engine.close();
});

test("monthly sales tax upserts one month grid and leaves the total to the reader", async () => {
  const { engine, db, scope } = await retailDb();
  const reportScope = { ...scope, timezone: "UTC" };
  const samples = JSON.parse(await readFile(new URL("../docs/postman/store-reporting-retail-monthly-sales-tax.postman_data.json", import.meta.url), "utf8"));
  const month = parseRetailMonthlySalesTax(samples[0]);
  assert.equal((await syncRetailMonthlySalesTax(db, scope, month)).status, "accepted");
  assert.equal((await syncRetailMonthlySalesTax(db, scope, month)).status, "duplicate");
  assert.throws(
    () => parseRetailMonthlySalesTax({
      ...samples[0],
      monthly_sales_tax: {
        ...samples[0].monthly_sales_tax,
        rows: [...samples[0].monthly_sales_tax.rows, { cells: ["Total", "1.00", "1.00", "0.00", "0.00", "0.00"], emphasize: true }],
      },
    }),
    (error) => error instanceof ReportingError,
  );
  const read = await readMonthlySalesTax(db, reportScope, "2025-07");
  assert.equal(read.reportMonth, "2025-07");
  assert.equal(read.employeeName, "Acute User");
  assert.equal(read.rows.some((row) => row.cells[0] === "Total"), false);
  assert.deepEqual(sumMonthlySalesTaxRows(read.rows), ["190.63", "182.24", "0.00", "139.86", "8.39"]);
  const empty = await readMonthlySalesTax(db, reportScope, "2025-08");
  assert.deepEqual(empty.columns, []);
  assert.deepEqual(empty.rows, []);
  const changed = parseRetailMonthlySalesTax({
    ...samples[0],
    request_id: "example-retail-month-tax-2025-07b",
    monthly_sales_tax: {
      ...samples[0].monthly_sales_tax,
      columns: ["Date", "Total Sales"],
      rows: [{ cells: ["07/02/2025", "10.00"], emphasize: false }],
    },
  });
  assert.equal((await syncRetailMonthlySalesTax(db, scope, changed)).status, "accepted");
  const next = await readMonthlySalesTax(db, reportScope, "2025-07");
  assert.deepEqual(next.columns, ["Date", "Total Sales"]);
  assert.deepEqual(next.rows[0].cells, ["07/02/2025", "10.00"]);
  await engine.close();
});

test("invoice rows upsert once and filter by date and type", async () => {
  const { engine, db, scope } = await retailDb();
  const reportScope = { ...scope, timezone: "UTC" };
  const samples = JSON.parse(await readFile(new URL("../docs/postman/store-reporting-retail-invoice.postman_data.json", import.meta.url), "utf8"));
  const open = parseRetailInvoice(samples[0]);
  const received = parseRetailInvoice(samples[1]);
  assert.equal((await syncRetailInvoice(db, scope, open)).status, "accepted");
  assert.equal((await syncRetailInvoice(db, scope, open)).status, "duplicate");
  assert.equal((await syncRetailInvoice(db, scope, received)).status, "accepted");
  const day = await readInvoiceList(db, reportScope, {
    from: "2025-07-02", to: "2025-07-02", amountFrom: null, amountTo: null, invoiceType: null, supplierName: null, supplierInvoiceNo: "",
  });
  assert.deepEqual(day.rows.map((row) => row.invoice_type), ["OP"]);
  assert.equal(day.rows[0].total, "143.00");
  const typed = await readInvoiceList(db, reportScope, {
    from: "2025-07-02", to: "2025-07-04", amountFrom: null, amountTo: null, invoiceType: "RC", supplierName: null, supplierInvoiceNo: "",
  });
  assert.deepEqual(typed.rows.map((row) => row.id), ["4"]);
  assert.deepEqual(typed.suppliers, ["H.T. Hackney", "Tobbaco"]);
  const detail = await readInvoiceDetail(db, reportScope, { id: "2", type: "OP" });
  assert.equal(detail.lines[0].product_item_no, "5947");
  assert.equal(detail.cost_lines[0].new_cost, "9.995");
  assert.equal(detail.log[0].log, "[Final Invoice] InvoiceNo: TB-900221");
  await assert.rejects(() => readInvoiceDetail(db, reportScope, { id: "9", type: "RC" }), (error) => error instanceof ReportingError && error.status === 404);
  const changed = parseRetailInvoice({
    ...samples[0],
    request_id: "example-retail-invoice-2b",
    invoice: { ...samples[0].invoice, total: "150.00" },
  });
  assert.equal((await syncRetailInvoice(db, scope, changed)).status, "accepted");
  assert.equal((await readInvoiceDetail(db, reportScope, { id: "2", type: "OP" })).total, "150.00");
  await engine.close();
});

test("no upc lines upsert once, filter by date, and sum a department", async () => {
  const { engine, db, scope } = await retailDb();
  const reportScope = { ...scope, timezone: "UTC" };
  const samples = JSON.parse(await readFile(new URL("../docs/postman/store-reporting-retail-no-upc-detail.postman_data.json", import.meta.url), "utf8"));
  const coils = parseRetailNoUpc(samples[0]);
  const cleaner = parseRetailNoUpc(samples[1]);
  const charcoal = parseRetailNoUpc(samples[2]);
  assert.equal((await syncRetailNoUpc(db, scope, coils)).status, "accepted");
  assert.equal((await syncRetailNoUpc(db, scope, coils)).status, "duplicate");
  assert.equal((await syncRetailNoUpc(db, scope, cleaner)).status, "accepted");
  assert.equal((await syncRetailNoUpc(db, scope, charcoal)).status, "accepted");
  const july = await readNoUpcList(db, reportScope, { from: "2025-07-07", to: "2025-07-07" });
  assert.deepEqual(july.map((row) => row.department), ["Coils-Pods", "Cleaner"]);
  const groups = groupNoUpcRows(july);
  assert.equal(groups[0].department, "Coils-Pods");
  assert.deepEqual(groups[0].subtotal, { discount: "0.00", subtotal: "3.22", tax: "0.19", total_amount: "3.41" });
  const april = await readNoUpcList(db, reportScope, { from: "2025-04-28", to: "2025-04-28" });
  assert.equal(april[0].sold_qty, "-1");
  assert.equal(april[0].subtotal, "-1.00");
  assert.equal(april[0].total_amount, "-1.00");
  const changed = parseRetailNoUpc({
    ...samples[0],
    request_id: "example-retail-noupc-1b",
    no_upc_detail: { ...samples[0].no_upc_detail, total_amount: "4.00" },
  });
  assert.equal((await syncRetailNoUpc(db, scope, changed)).status, "accepted");
  const next = await readNoUpcList(db, reportScope, { from: "2025-07-07", to: "2025-07-07" });
  assert.equal(next.find((row) => row.department === "Coils-Pods")?.total_amount, "4.00");
  assert.equal(groupNoUpcRows(next)[0].subtotal.total_amount, "4.00");
  await engine.close();
});
