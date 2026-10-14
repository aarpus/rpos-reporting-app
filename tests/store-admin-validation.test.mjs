import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidTimeZone,
  parseStoreInput,
  parseStoreUpdate,
  parseUserIds,
} from "../src/lib/store-admin-validation.ts";

test("store input normalizes the code and trims editable fields", () => {
  assert.deepEqual(parseStoreInput({
    storeCode: " dt01 ",
    name: " Downtown Store ",
    timezone: " Asia/Kolkata ",
  }), {
    data: { storeCode: "DT01", name: "Downtown Store", timezone: "Asia/Kolkata" },
  });
});

test("store input rejects missing fields, oversized values, and invalid timezones", () => {
  assert.equal("error" in parseStoreInput({ storeCode: "", name: "Store", timezone: "UTC" }), true);
  assert.equal("error" in parseStoreInput({ storeCode: "A".repeat(65), name: "Store", timezone: "UTC" }), true);
  assert.equal("error" in parseStoreInput({ storeCode: "A", name: " ", timezone: "UTC" }), true);
  assert.equal("error" in parseStoreInput({ storeCode: "A", name: "Store", timezone: "Moon/Base" }), true);
  assert.equal(isValidTimeZone("UTC"), true);
});

test("store update accepts supported fields and rejects empty updates", () => {
  assert.deepEqual(parseStoreUpdate({ name: " Airport ", active: false }), {
    data: { name: "Airport", active: false },
  });
  assert.equal("error" in parseStoreUpdate({}), true);
  assert.equal("error" in parseStoreUpdate({ active: "yes" }), true);
});

test("access user IDs are positive integers and are deduplicated", () => {
  assert.deepEqual(parseUserIds({ userIds: [1, "2", 1] }), { data: [1, 2] });
  assert.equal("error" in parseUserIds({ userIds: [0] }), true);
  assert.equal("error" in parseUserIds({ userIds: ["abc"] }), true);
  assert.equal("error" in parseUserIds({}), true);
});

