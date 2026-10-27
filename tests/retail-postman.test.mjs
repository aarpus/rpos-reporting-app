import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseRetailBatch, parseRetailEntity, parseRetailOrder, parseRetailShift } from "../src/lib/reporting/retail-snapshot.ts";

const directory = new URL("../docs/postman/retail-10/", import.meta.url);
const files = {
  batch: parseRetailBatch,
  shift: parseRetailShift,
  orders: parseRetailOrder,
  station_transaction: (body) => parseRetailEntity(body, "station_transaction", "tbl_station_transaction"),
  store_account_transaction: (body) => parseRetailEntity(body, "store_account_transaction", "tbl_store_account_transaction"),
  station_cash_transfer: (body) => parseRetailEntity(body, "station_cash_transfer", "tbl_station_cash_transfer"),
  invoice: (body) => parseRetailEntity(body, "invoice", "tbl_invoice"),
  invoice_payment: (body) => parseRetailEntity(body, "invoice_payment", "tbl_invoice_payment"),
  clockin: (body) => parseRetailEntity(body, "clockin", "tbl_clockin"),
  nosale: (body) => parseRetailEntity(body, "nosale", "tbl_nosale"),
  account_payment: (body) => parseRetailEntity(body, "account_payment", "tbl_account_payment"),
  group_detail: (body) => parseRetailEntity(body, "group_detail", "tbl_group_detail"),
  store: (body) => parseRetailEntity(body, "store", "tbl_store"),
  Coupon: (body) => parseRetailEntity(body, "Coupon", "tbl_Coupon"),
  Online_Platform_Master: (body) => parseRetailEntity(body, "Online_Platform_Master", "tbl_Online_Platform_Master"),
  cashmachine_transaction: (body) => parseRetailEntity(body, "cashmachine_transaction", "tbl_cashmachine_transaction"),
  cashmachine_master: (body) => parseRetailEntity(body, "cashmachine_master", "tbl_cashmachine_master"),
  cashmachine_batch: (body) => parseRetailEntity(body, "cashmachine_batch", "tbl_cashmachine_batch"),
};

test("retail postman files contain 10 insertable records for every retail route", async () => {
  const collection = JSON.parse(await readFile(new URL("../docs/postman/store-reporting-retail-10.postman_collection.json", import.meta.url), "utf8"));
  assert.equal(collection.item.length, Object.keys(files).length);
  for (const [name, parse] of Object.entries(files)) {
    const bodies = JSON.parse(await readFile(new URL(`${name}.json`, directory), "utf8"));
    assert.equal(bodies.length, 10, name);
    const folder = collection.item.find((entry) => entry.name === name);
    assert.equal(folder.item.length, 10, name);
    bodies.forEach((body, index) => {
      parse(body);
      assert.equal(folder.item[index].request.url.raw, `{{baseUrl}}/api/pos/reporting/retail/${name}`);
      assert.deepEqual(JSON.parse(folder.item[index].request.body.raw), body);
    });
  }
  const orders = JSON.parse(await readFile(new URL("orders.json", directory), "utf8"));
  const shifts = JSON.parse(await readFile(new URL("shift.json", directory), "utf8"));
  orders.forEach((order, index) => {
    assert.equal(order.checkout_transaction.shiftid, shifts[index].shift.shiftid);
    assert.equal(order.transaction_payment[0].batchid, shifts[index].shift.batchid);
  });
});
