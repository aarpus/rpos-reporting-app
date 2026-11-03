import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseRetailShift } from "../src/lib/reporting/retail-snapshot.ts";
import { parseRetailDayEnd } from "../src/lib/reporting/retail-day-end.ts";
import { parseRetailTransactionJournal } from "../src/lib/reporting/retail-transaction-journal.ts";
import { parseRetailCreditCard } from "../src/lib/reporting/retail-credit-card.ts";
import { parseRetailMonthlySalesTax } from "../src/lib/reporting/retail-monthly-sales-tax.ts";
import { parseRetailInvoice } from "../src/lib/reporting/retail-invoice.ts";
import { parseRetailNoUpc } from "../src/lib/reporting/retail-noupc.ts";

async function bodies(name) {
  return JSON.parse(await readFile(new URL(`../docs/postman/${name}`, import.meta.url), "utf8"));
}

test("retail report postman samples match the remaining push routes", async () => {
  const shifts = await bodies("store-reporting-retail-shift.postman_data.json");
  const days = await bodies("store-reporting-retail-day-end-report.postman_data.json");
  const journals = await bodies("store-reporting-retail-transaction-journal.postman_data.json");
  const cards = await bodies("store-reporting-retail-credit-card.postman_data.json");
  const months = await bodies("store-reporting-retail-monthly-sales-tax.postman_data.json");
  const invoices = await bodies("store-reporting-retail-invoice.postman_data.json");
  const noUpc = await bodies("store-reporting-retail-no-upc-detail.postman_data.json");
  assert.ok(shifts.length >= 1);
  assert.ok(days.length >= 1);
  assert.equal(journals.length, 2);
  assert.equal(cards.length, 3);
  assert.equal(months.length, 1);
  assert.equal(invoices.length, 2);
  assert.equal(noUpc.length, 3);
  shifts.forEach((body) => parseRetailShift(body));
  days.forEach((body) => parseRetailDayEnd(body));
  journals.forEach((body) => parseRetailTransactionJournal(body));
  cards.forEach((body) => parseRetailCreditCard(body));
  months.forEach((body) => parseRetailMonthlySalesTax(body));
  invoices.forEach((body) => parseRetailInvoice(body));
  noUpc.forEach((body) => parseRetailNoUpc(body));
  assert.equal(journals[0].transaction_journal.transaction_number, "ACFG866202");
  assert.equal(journals[1].transaction_journal.paid_by, "Cash");
});
