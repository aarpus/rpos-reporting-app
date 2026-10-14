import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

test("POS HMAC contract has a stable cross-language test vector", () => {
  const storeCode = "DT01";
  const keyId = "pos-test";
  const timestamp = "1790706600";
  const secret = Buffer.from("AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=", "base64");
  const rawBody = '{"eventId":"evt-1","type":"SHIFT_END","occurredAt":"2026-09-29T18:30:00Z","data":{"shiftId":"s-12","shiftNumber":"12","endedAt":"2026-09-29T18:30:00Z"}}';
  const canonical = `${storeCode}\n${keyId}\n${timestamp}\n${rawBody}`;
  const signature = createHmac("sha256", secret).update(canonical).digest("base64");
  assert.equal(signature, "aSlHcqyjKNSiNUNoKj7L+skIMyjzIXNlpr56tFmhFEE=");
});

test("changing the exact JSON bytes changes the signature", () => {
  const secret = Buffer.alloc(32, 7);
  const compact = "DT01\npos-test\n1790706600\n{\"eventId\":\"evt-1\"}";
  const spaced = "DT01\npos-test\n1790706600\n{ \"eventId\": \"evt-1\" }";
  assert.notEqual(
    createHmac("sha256", secret).update(compact).digest("base64"),
    createHmac("sha256", secret).update(spaced).digest("base64"),
  );
});
