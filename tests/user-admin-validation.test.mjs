import test from "node:test";
import assert from "node:assert/strict";
import {
  parseStoreCodes,
  parseUserId,
  parseUserInput,
  parseUserUpdate,
} from "../src/lib/user-admin-validation.ts";

test("user input normalizes email and trims the name", () => {
  assert.deepEqual(parseUserInput({
    name: " Jane Smith ",
    email: " JANE@Example.com ",
    password: "password123",
  }), {
    data: { name: "Jane Smith", email: "jane@example.com", password: "password123" },
  });
});

test("user input rejects invalid identity and password fields", () => {
  assert.equal("error" in parseUserInput({ name: "", email: "jane@example.com", password: "password123" }), true);
  assert.equal("error" in parseUserInput({ name: "Jane", email: "invalid", password: "password123" }), true);
  assert.equal("error" in parseUserInput({ name: "Jane", email: "jane@example.com", password: "short" }), true);
});

test("user update accepts supported fields and ignores a blank optional password", () => {
  assert.deepEqual(parseUserUpdate({ name: " Jane ", email: " JANE@example.com ", password: "" }), {
    data: { name: "Jane", email: "jane@example.com" },
  });
  assert.deepEqual(parseUserUpdate({ active: false }), { data: { active: false } });
  assert.equal("error" in parseUserUpdate({}), true);
});

test("store codes normalize and deduplicate", () => {
  assert.deepEqual(parseStoreCodes({ storeCodes: [" dt01 ", "AP01", "DT01"] }), {
    data: ["DT01", "AP01"],
  });
  assert.equal("error" in parseStoreCodes({ storeCodes: [""] }), true);
  assert.equal("error" in parseStoreCodes({ storeCodes: [42] }), true);
});

test("user IDs must be positive safe integers", () => {
  assert.equal(parseUserId("12"), 12);
  assert.equal(parseUserId("0"), null);
  assert.equal(parseUserId("abc"), null);
});
