import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHmac, webcrypto } from "node:crypto";
import { parseSnapshot } from "../src/lib/reporting/snapshot.ts";

const collection = JSON.parse(await readFile(new URL("../docs/postman/store-reporting-10-orders.postman_collection.json", import.meta.url), "utf8"));
const signingScript = collection.event.find((event) => event.listen === "prerequest").script.exec.join("\n");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

test("supplied dummy collection has ten valid individual snapshots for all four tables", async () => {
  assert.equal(collection.item.length, 10);
  let items = 0, payments = 0, cards = 0;
  const requestIds = new Set();
  const orderCodes = new Set();
  for (const entry of collection.item) {
    assert.equal(entry.request.method, "POST");
    assert.equal(entry.request.url.raw, "{{baseUrl}}/api/pos/reporting/restaurant/orders");
    const payload = JSON.parse(entry.request.body.raw.replaceAll("{{storeCode}}", "ACUTERPOS"));
    const snapshot = parseSnapshot(payload, "ACUTERPOS");
    requestIds.add(snapshot.request_id);
    orderCodes.add(snapshot.order.order_code);
    items += snapshot.items.length;
    payments += snapshot.payments.length;
    cards += snapshot.card_payments.length;
  }
  assert.equal(requestIds.size, 10);
  assert.equal(orderCodes.size, 10);
  assert.deepEqual([items, payments, cards], [20, 15, 12]);
  const single = JSON.parse(await readFile(new URL("../docs/postman/store-reporting-single-order.json", import.meta.url), "utf8"));
  assert.deepEqual(single, JSON.parse(collection.item[0].request.body.raw));
});

test("array payload is rejected with an actionable single-snapshot message", () => {
  const array = collection.item.map((entry) => JSON.parse(entry.request.body.raw));
  assert.throws(() => parseSnapshot(array, "ACUTERPOS"), (error) => error.status === 400 && /one order snapshot object per request, not an array/.test(error.message));
});

test("Postman Web Crypto script matches the server HMAC for every supplied request and keeps payload IDs stable", async () => {
  const key = Buffer.alloc(32, 7);
  for (const entry of collection.item) {
    const variables = new Map([["storeCode", "ACUTERPOS"], ["keyId", "pos-test"], ["posSecret", key.toString("base64")]]);
    const headers = new Map();
    const originalBody = entry.request.body.raw;
    const replaceIn = (text) => text.replace(/\{\{(\w+)\}\}/g, (_, name) => variables.get(name) ?? `{{${name}}}`);
    const pm = {
      variables: { get: (name) => variables.get(name), set: (name, value) => variables.set(name, value), replaceIn },
      request: { body: { mode: "raw", raw: originalBody }, headers: { upsert: ({ key, value }) => headers.set(key, value) } },
    };
    const execute = new AsyncFunction("pm", "crypto", "TextEncoder", "atob", "btoa", signingScript);
    await execute(pm, webcrypto, TextEncoder, atob, btoa);
    assert.equal(pm.request.body.raw, originalBody);
    const rawBody = replaceIn(originalBody);
    const canonical = `ACUTERPOS\npos-test\n${headers.get("X-POS-Timestamp")}\n${rawBody}`;
    assert.equal(headers.get("X-POS-Signature"), createHmac("sha256", key).update(canonical).digest("base64"));
    assert.equal(headers.get("X-Store-Code"), "ACUTERPOS");
    assert.equal(headers.get("Content-Type"), "application/json");
    const firstSignature = headers.get("X-POS-Signature");
    await execute(pm, webcrypto, TextEncoder, atob, btoa);
    assert.equal(JSON.parse(replaceIn(pm.request.body.raw)).request_id, JSON.parse(rawBody).request_id);
    assert.ok(firstSignature);
  }
});
