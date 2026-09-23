import nextEnv from "@next/env";
import assert from "node:assert/strict";

nextEnv.loadEnvConfig(process.cwd());
const base = process.env.AUTH_URL || "http://localhost:3000";
const cookies = new Map();
async function request(path, options = {}) {
  const response = await fetch(new URL(path, base), {
    ...options,
    redirect: "manual",
    headers: {
      Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join("; "),
      ...options.headers,
    },
  });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";")[0];
    const index = pair.indexOf("=");
    cookies.set(pair.slice(0, index), pair.slice(index + 1));
  }
  return response;
}
async function post(path, fields) {
  const csrf = await (await request("/api/auth/csrf")).json();
  return request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({ csrfToken: csrf.csrfToken, ...fields }),
  });
}

const page = await request("/auth");
assert.equal(page.status, 200);
assert.match(await page.text(), /Sign in to your AcutePOS/);
const protectedPage = await request("/report/transaction-detail");
assert.equal(protectedPage.status, 307);
assert.match(protectedPage.headers.get("location"), /\/auth\?callbackUrl=/);
assert.equal((await request("/api/private-check")).status, 401);
console.log(
  "PASS: auth page, protected deep link, and unauthenticated API response.",
);

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.log(
    "SKIP: credential checks require ADMIN_EMAIL and ADMIN_PASSWORD in .env.local.",
  );
  process.exit(0);
}
const failed = await post("/api/auth/callback/credentials", {
  email: process.env.ADMIN_EMAIL,
  password: "invalid-test-password",
  callbackUrl: base,
});
assert.match((await failed.json()).url, /error=CredentialsSignin/);
assert.equal(await (await request("/api/auth/session")).json(), null);
const login = await post("/api/auth/callback/credentials", {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  callbackUrl: base,
});
assert.ok(
  !(await login.json()).url.includes("error="),
  "Valid credentials must sign in",
);
const session = await (await request("/api/auth/session")).json();
assert.equal(session.user.email, process.env.ADMIN_EMAIL.trim().toLowerCase());
assert.equal((await request("/")).status, 200);
await post("/api/auth/signout", { callbackUrl: `${base}/auth` });
assert.equal(await (await request("/api/auth/session")).json(), null);
assert.equal((await request("/")).status, 307);
console.log(
  "PASS: wrong password, successful sign-in, authenticated dashboard, logout, and revoked browser session.",
);
