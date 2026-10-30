import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { ReportingError } from "../src/lib/reporting/snapshot.ts";
import { retailTable } from "../src/lib/reporting/retail-columns.ts";
import { parseRetailBatch, parseRetailEntity, parseRetailOrder, parseRetailShift } from "../src/lib/reporting/retail-snapshot.ts";
import { syncRetailBatch, syncRetailEntity, syncRetailOrder, syncRetailShift } from "../src/lib/reporting/retail-sync.ts";
import { readShiftEndDetail, readShiftEndList } from "../src/lib/reporting/retail-shift-read.ts";

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

const batch = {
  request_id: "retail-batch-1",
  batch: { batchid: "101", BatchStart: "2026-10-27T04:00:00Z", storeid: "7" },
};
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

function order(giftCards) {
  return {
    request_id: "retail-order-1",
    checkout_transaction: {
      transactionid: "301",
      transactiondate: "2026-10-27T04:10:00Z",
      transactionemployeeid: "4",
      shiftid: "201",
      transactiontotal: "12.50",
      transactiondiscount: "1.2",
    },
    transaction_detail: [{
      transactiondetailid: "401",
      productupcode: "UPC1",
      transactiondetaildate: "2026-10-27T04:10:00Z",
      transactiondetailemployeeid: "4",
      transactiondetailitemname: "Milk",
      taxname: "Tax",
      departmentname: "Grocery",
      producttype: "ITEM",
      displayquantity: 1,
    }],
    transaction_payment: [{
      id_payment: "501",
      trans_date_time: "2026-10-27T04:10:00Z",
      employee_id: "4",
      pc_charge_user_id: "user",
      store_id: "7",
      command: "SALE",
      batchid: "101",
    }],
    transaction_gift_card: giftCards,
  };
}

test("retail sync keys come from the retail tables", () => {
  assert.equal(retailTable("tbl_batch").key, "batchid");
  assert.equal(retailTable("tbl_shift").key, "shiftid");
  assert.equal(retailTable("tbl_checkout_transaction").key, "transactionid");
  assert.equal(retailTable("tbl_transaction_detail").key, "transactiondetailid");
  assert.equal(retailTable("tbl_transaction_payment").key, "id_payment");
  assert.equal(retailTable("tbl_transaction_gift_card").key, "id_transaction");
  assert.equal(retailTable("tbl_station_transaction").key, "stationtrasactionid");
  assert.equal(retailTable("tbl_store_account_transaction").key, "storeaccounttransactionid");
  assert.equal(retailTable("tbl_station_cash_transfer").key, "stationcashtransferid");
  assert.equal(retailTable("tbl_invoice").key, "id_invoice");
  assert.equal(retailTable("tbl_invoice_payment").key, "id_payment");
  assert.equal(retailTable("tbl_clockin").key, "clockinid");
  assert.equal(retailTable("tbl_nosale").key, "nosaleid");
  assert.equal(retailTable("tbl_account_payment").key, "Acc_Pay_id");
  assert.equal(retailTable("tbl_group_detail").key, "Group_Id");
  assert.equal(retailTable("tbl_store").key, "storeid");
  assert.equal(retailTable("tbl_Coupon").key, "Coupon_Id");
  assert.equal(retailTable("tbl_Online_Platform_Master").key, "OLpm_id");
  assert.equal(retailTable("tbl_cashmachine_transaction").key, "id");
  assert.equal(retailTable("tbl_cashmachine_master").key, "cashmachine_id");
  assert.equal(retailTable("tbl_cashmachine_batch").key, "cmachine_batchid");
  assert.equal(retailTable("tbl_store").fields.find((field) => field.name === "logo")?.kind, "bytea");
  assert.equal(retailTable("tbl_store").fields.find((field) => field.name === "card_batch_close_time")?.kind, "time");
  assert.ok(retailTable("tbl_cashmachine_transaction").fields.some((field) => field.name === "coin_1_dispense"));
});

test("retail payloads reject restaurant envelope fields and normalize retail scales", () => {
  assert.throws(() => parseRetailBatch({ ...batch, source_revision: "1" }), ReportingError);
  assert.throws(() => parseRetailBatch({ ...batch, batch: { ...batch.batch, store_code: "RS01" } }), ReportingError);
  assert.throws(() => parseRetailOrder({
    ...order([]),
    transaction_detail: [{ ...order([]).transaction_detail[0], transactionid: "999" }],
  }), ReportingError);
  const parsed = parseRetailOrder(order([]));
  assert.equal(parsed.checkout_transaction.transactiondiscount, "1.200");
  assert.equal(parsed.checkout_transaction.transactionebtamount, null);
  const parsedShift = parseRetailShift(shift);
  assert.equal(parsedShift.shift.status, "Close");
  assert.equal(parsedShift.shift.sale[1].label, "Wine");
  assert.throws(() => parseRetailShift({ ...shift, shift: { ...shift.shift, batchid: "101" } }), ReportingError);
  assert.equal(parsed.transaction_detail[0].shiftid, "201");
  const station = parseRetailEntity({
    request_id: "retail-station-1",
    station_transaction: { stationtrasactionid: "701", employeeid: "4", shiftid: "201", stationid: "3" },
  }, "station_transaction", "tbl_station_transaction");
  assert.equal(station.row.openingbalance, null);
  assert.equal(station.row.isregisteropen, 1);
});

test("retail batch, shift, and checkout upserts stay inside the retail schema", async () => {
  const { engine, db, scope } = await retailDb();
  const created = await syncRetailBatch(db, scope, parseRetailBatch(batch));
  assert.deepEqual(created, { status: "accepted", request_id: "retail-batch-1", batchid: "101" });
  const repeat = await syncRetailBatch(db, scope, parseRetailBatch(batch));
  assert.equal(repeat.status, "duplicate");
  const closed = parseRetailBatch({ ...batch, request_id: "retail-batch-2", batch: { ...batch.batch, BatchEnd: "2026-10-27T12:00:00Z" } });
  assert.equal((await syncRetailBatch(db, scope, closed)).status, "accepted");
  assert.equal((await syncRetailBatch(db, scope, closed)).status, "duplicate");

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
  const mirror = await engine.query(`SELECT count(*)::int AS shifts FROM store_rs01."tbl_shift"`);
  const reports = await engine.query(`SELECT "sale"->0->>'value' AS beer FROM store_rs01."tbl_shift_end_report" WHERE "shiftid" = 201`);
  assert.equal(mirror.rows[0].shifts, 0);
  assert.equal(reports.rows[0].beer, "530.00");
  await engine.query(`
    INSERT INTO store_rs01."tbl_shift" (
      "shiftid", "batchid", "ShiftStart", "shiftnumber", "employeeid", "stationid", "stationname", "employeename"
    ) VALUES (201, 101, '2026-10-27T04:05:00Z', 1, 4, 3, 'REG1', 'Ada')
  `);

  const withGift = parseRetailOrder(order([{
    id_transaction: "601",
    transactiondate: "2026-10-27T04:10:00Z",
    amount: "5.00",
    id_gift_card: "88",
  }]));
  assert.equal((await syncRetailOrder(db, scope, withGift)).status, "accepted");
  assert.equal((await syncRetailOrder(db, scope, withGift)).status, "duplicate");
  await assert.rejects(
    syncRetailOrder(db, scope, parseRetailOrder({
      ...order([]),
      request_id: "retail-order-bad-batch",
      transaction_payment: [{ ...order([]).transaction_payment[0], batchid: "999" }],
    })),
    (error) => error instanceof ReportingError && error.status === 409,
  );

  const removed = parseRetailOrder({ ...order([]), request_id: "retail-order-2" });
  assert.equal((await syncRetailOrder(db, scope, removed)).status, "accepted");
  await assert.rejects(
    syncRetailOrder(db, scope, parseRetailOrder({
      ...order([]),
      request_id: "retail-order-steal",
      checkout_transaction: { ...order([]).checkout_transaction, transactionid: "302" },
      transaction_payment: [{ ...order([]).transaction_payment[0], id_payment: "502" }],
    })),
    (error) => error instanceof ReportingError && error.status === 409 && error.message.includes("transactiondetailid"),
  );
  const counts = await engine.query(`
    SELECT
      (SELECT count(*) FROM store_rs01."tbl_checkout_transaction")::int AS transactions,
      (SELECT count(*) FROM store_rs01."tbl_transaction_detail")::int AS details,
      (SELECT count(*) FROM store_rs01."tbl_transaction_payment")::int AS payments,
      (SELECT count(*) FROM store_rs01."tbl_transaction_gift_card")::int AS gifts,
      (SELECT "transactiontotal"::text FROM store_rs01."tbl_checkout_transaction" WHERE "transactionid" = 301) AS total,
      (SELECT "transactiondiscount"::text FROM store_rs01."tbl_checkout_transaction" WHERE "transactionid" = 301) AS discount
  `);
  assert.deepEqual(counts.rows[0], { transactions: 1, details: 1, payments: 1, gifts: 0, total: "12.50", discount: "1.200" });

  const station = parseRetailEntity({
    request_id: "retail-station-1",
    station_transaction: { stationtrasactionid: "701", employeeid: "4", shiftid: "201", stationid: "3" },
  }, "station_transaction", "tbl_station_transaction");
  assert.equal((await syncRetailEntity(db, scope, "tbl_station_transaction", station)).stationtrasactionid, "701");
  assert.equal((await syncRetailEntity(db, scope, "tbl_station_transaction", station)).status, "duplicate");
  const store = parseRetailEntity({
    request_id: "retail-store-1",
    store: { storeid: "7", CompnayID: "1", logo: Buffer.from("ab").toString("base64"), card_batch_close_time: "01:00:00" },
  }, "store", "tbl_store");
  assert.equal(store.row.storename, null);
  assert.equal((await syncRetailEntity(db, scope, "tbl_store", store)).status, "accepted");
  assert.equal((await syncRetailEntity(db, scope, "tbl_store", store)).status, "duplicate");
  const coupon = parseRetailEntity({
    request_id: "retail-coupon-1",
    Coupon: { Coupon_Id: "801", Mastcode: "5" },
  }, "Coupon", "tbl_Coupon");
  assert.equal(coupon.row.Coupon_Name, null);
  assert.equal(coupon.row.Is_reward_allow, null);
  assert.equal((await syncRetailEntity(db, scope, "tbl_Coupon", coupon)).status, "accepted");

  await engine.query("UPDATE public.stores SET store_type = 'RESTAURANT' WHERE store_code = 'RS01'");
  await assert.rejects(
    syncRetailBatch(db, scope, parseRetailBatch({ ...batch, request_id: "retail-batch-3" })),
    (error) => error instanceof ReportingError && error.status === 403,
  );
  await engine.close();
});
