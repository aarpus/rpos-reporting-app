import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/password.mjs";

test("passwords use unique salts and verify only the correct password", async () => {
  const password = "a-long-test-password";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
});

test("malformed hashes are rejected", async () => {
  for (const hash of ["", "plaintext", "scrypt:bad:bad", "bcrypt:abc:def"]) {
    assert.equal(await verifyPassword("password", hash), false);
  }
});
