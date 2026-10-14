# Store reporting: setup, Postman dummy data and API testing

## Why the uploaded JSON failed

`postman_reporting_10_orders_store_code_first.json` is an **array of ten snapshots**.
`POST /api/pos/reporting/orders` accepts **one snapshot object per request**.
The individual orders are valid after resolving `{{storeCode}}`, but sending the
outer array produces a 400 envelope error. An order snapshot writes its order,
items, payments and card transactions together in one transaction.

Use either:

- [One valid request body](postman/store-reporting-single-order.json): paste its entire object into Body > raw > JSON.
- [Ready-to-import 10-request Postman collection](postman/store-reporting-10-orders.postman_collection.json): use Collection Runner to send all ten snapshots separately.

The collection preserves all records and values from your supplied file. The
original Downloads file is unchanged. This endpoint has no bulk-array mode.
Do not simply remove the outer brackets while leaving multiple objects behind;
that would not be valid JSON.

## 1. Create a store and verify its schema

After database setup, Admin > Stores creates the store and its own reporting
schema atomically. The corresponding administrator-session API is:

```http
POST /api/admin/stores
Content-Type: application/json
```

```json
{"storeCode":"ACUTERPOS","name":"Acute POS test store","timezone":"Asia/Kolkata"}
```

If this store already exists, skip creation. A new store returns 201 with
`{"store": {...}}`; an existing code returns 409. The store code is permanent.
The login account's existing store grants control which store it may report on.
There is no customer-business schema selection.

Check provisioning:

```powershell
npm run reporting:stores -- list
npm run reporting:stores -- provision ACUTERPOS
```

Provision is idempotent. If SQL tables exist but the provisioning function is
missing, repair custom SQL setup with `npm run reporting:install`.
`npm run prisma:push` also installs this function after syncing model tables.
Migration-managed databases use `npm run db:deploy` instead of replaying old
migrations against a database whose tables were created with db push.
See [deployment and schema details](pos-reporting-api.md).

## 2. Keep or assign user access

Already-assigned users need no changes. When necessary, an authenticated ADMIN
can update assignments using:

```http
PUT /api/admin/stores/ACUTERPOS/access
Content-Type: application/json
```

```json
{"userIds":[123]}
```

Replace 123 with an actual USER account ID. This is a **replacement list**:
include every user who should retain access to this store. Success is 200 with
`assignedUserCount`. Admin/store-access APIs require a browser login session;
the POS push API uses separate per-store credentials.

## 3. Issue POS credentials

The server needs `POS_CREDENTIAL_ENCRYPTION_KEY` configured as a Base64-encoded
32-byte encryption key. Reuse the existing server key; do not replace it for
each store. Provision a POS credential for this active store:

```powershell
npm run pos:credential -- create ACUTERPOS
```

Save the returned `keyId` and Base64 `secret` in the matching POS credential
store. The returned secret is the **POS signing secret**, not the server's
credential-encryption key. Use an existing issued credential if you already
have its secret. Do not include actual secrets in shared collection exports.

## 4. Import and configure Postman

1. Import `docs/postman/store-reporting-10-orders.postman_collection.json` using Postman Import.
2. Create/select an environment and configure the variables below.
3. Open request `01 - POSTMAN-ORDER-001` and select No Auth. The collection already contains the body and signing script.
4. Send this first request to check credentials. Then run the collection with **one iteration**, selecting all ten requests, to upload the full dataset.
5. Collection signing refreshes the timestamp/signature for every request without changing its request ID or source revision.

| Variable | Example/value | Purpose |
|---|---|---|
| `baseUrl` | `http://localhost:3000` or your deployed HTTPS URL | No trailing slash |
| `storeCode` | `ACUTERPOS` | Registered store with a provisioned schema |
| `keyId` | Issued `pos-...` value | Credential belonging to that store |
| `posSecret` | Issued Base64 secret | Local sensitive environment value |

The collection supplies default `baseUrl` and `storeCode` variables; the active
environment can override them. Add `keyId` and `posSecret` to the environment.
Select that same environment in Collection Runner. The uploaded data uses
`{{storeCode}}` (camelCase). JSON row fields remain `store_code` (snake_case).
They are different names serving different purposes.

Manual Send and Collection Runner **persist dummy records in the selected
server's database**. This guide and collection have not automatically pushed
those records. Reruns reuse the same request IDs and revisions.

## 5. Push endpoint and signing

```http
POST {{baseUrl}}/api/pos/reporting/orders
Content-Type: application/json
X-Store-Code: ACUTERPOS
X-POS-Key-Id: <issued keyId>
X-POS-Timestamp: <current Unix seconds>
X-POS-Signature: <Base64 HMAC-SHA256>
```

No bearer token or browser login cookie is needed for this POS endpoint. The
server validates the store credential and resolves that store's schema.
Schema names are never supplied in the request body.

Canonical signing text, with literal LF newline characters:

```text
STORE_CODE\nKEY_ID\nTIMESTAMP\nEXACT_RESOLVED_RAW_JSON_BODY
```

Decode the issued Base64 secret into bytes before HMAC signing. The timestamp
must be current (within five minutes); it is independent of the order's older
business date. Sign exactly the UTF-8 body that is sent, including whitespace.
Do not reformat the JSON after signing, add JSON comments or use dynamic GUID
variables in the body.

For a new standalone Postman request, copy the single-order JSON body, use
**Body > raw > JSON**, and paste this into **Scripts > Pre-request**:

```javascript
const storeCode = String(pm.variables.get("storeCode") || "").trim().toUpperCase();
const keyId = String(pm.variables.get("keyId") || "").trim();
const secretBase64 = String(pm.variables.get("posSecret") || "").trim();
if (!storeCode || !keyId || !secretBase64) {
  throw new Error("Set storeCode, keyId and posSecret using this store's issued POS credentials.");
}
pm.variables.set("storeCode", storeCode);
if (!pm.request.body || pm.request.body.mode !== "raw") {
  throw new Error("Select Body > raw > JSON.");
}
if (pm.request.body.raw.includes("{{$")) {
  throw new Error("Use stable IDs and dates in the body; do not use dynamic Postman variables for a signed snapshot.");
}
const rawBody = pm.variables.replaceIn(pm.request.body.raw);
if (rawBody.includes("{{")) throw new Error("Resolve all request-body variables before sending.");
const payload = JSON.parse(rawBody);
if (Array.isArray(payload)) throw new Error("Send ONE snapshot object per request, not the 10-order array.");
const timestamp = Math.floor(Date.now() / 1000).toString();
const secret = Uint8Array.from(atob(secretBase64), character => character.charCodeAt(0));
if (secret.length !== 32) throw new Error("posSecret must be the issued Base64-encoded 32-byte POS secret.");
const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
const canonical = `${storeCode}\n${keyId}\n${timestamp}\n${rawBody}`;
const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical)));
const signature = btoa(String.fromCharCode(...signed));
for (const [name, value] of Object.entries({
  "Content-Type": "application/json",
  "X-Store-Code": storeCode,
  "X-POS-Key-Id": keyId,
  "X-POS-Timestamp": timestamp,
  "X-POS-Signature": signature
})) pm.request.headers.upsert({ key: name, value });
```

The imported collection already contains this script at collection level; do
not add a second conflicting signing script to individual requests. It uses
Postman's Web Crypto globals, which are supported by the current sandbox;
built-in CryptoJS is deprecated. See [supported objects](https://learning.postman.com/docs/tests-and-scripts/write-scripts/postman-sandbox-reference/pm-require)
and [request header methods](https://learning.postman.com/latest-v-12/docs/tests-and-scripts/write-scripts/postman-sandbox-reference/pm-request).

## 6. Complete first-order example: all four tables

This is the exact first snapshot from your supplied dataset. Send this object
alone to test one request. The full collection has ten separate such requests.

```json
{
  "request_id": "postman-dummy-order-001-r1",
  "source_revision": "1",
  "order": {
    "store_code": "{{storeCode}}",
    "order_id": 10001,
    "order_code": "POSTMAN-ORDER-001",
    "order_number": "900001",
    "checkid": "CHK001",
    "station_code": "POS-01",
    "shift_code": "SHIFT-AM",
    "batch_code": "BATCH-20261012",
    "order_type": "TAKEAWAY",
    "order_status": "COMPLETED",
    "customer_code": "CUST001",
    "customer_name": "Test Customer 1",
    "subtotal": "52.00",
    "tax": "2.60",
    "discount": "0.00",
    "fees": "0.00",
    "surcharge": "0.00",
    "tip_amount": "0.00",
    "gratuity": "0.00",
    "total": "54.60",
    "paid_amount": "54.60",
    "balance_amount": "0.00",
    "payment_method": "SPLIT",
    "payment_status": "PAID",
    "is_void": false,
    "is_return": false,
    "is_tax_exempt": false,
    "is_split": true,
    "order_fees": {
      "service_fee": "0.00",
      "description": "Test service fee"
    },
    "created_by": 501,
    "created_by_code": "EMP-501",
    "business_date": "2026-10-12",
    "created_at": "2026-10-12T10:30:00+05:30",
    "completed_at": "2026-10-12T10:30:00+05:30"
  },
  "items": [
    {
      "store_code": "{{storeCode}}",
      "order_id": 10001,
      "order_code": "POSTMAN-ORDER-001",
      "order_number": "900001",
      "order_item_id": 20011,
      "order_item_code": "POSTMAN-ITEM-001-01",
      "business_date": "2026-10-12",
      "station_code": "POS-01",
      "shift_code": "SHIFT-AM",
      "batch_code": "BATCH-20261012",
      "department_code": "FOOD",
      "department_name": "Food & Beverage",
      "category_code": "DRINK",
      "category_name": "Beverages",
      "menu_item_code": "MENU-001-1",
      "item_name": "Coffee",
      "quantity": "1.00",
      "price": "21.00",
      "subtotal": "21.00",
      "tax_code": "TAX5",
      "tax_name": "Sales Tax 5%",
      "tax_amt": "1.05",
      "discount_amt": "0.00",
      "gift_card_code": null,
      "tran_discount_code": null,
      "tran_discount_name": null,
      "tran_discount": "0.00",
      "tran_discount_tax": "0.00",
      "item_discount_code": null,
      "item_discount_name": null,
      "item_discount": "0.00",
      "item_discount_tax": "0.00",
      "comno_header": null,
      "combo_group_name": null,
      "combo_discount": "0.00",
      "combo_discount_tax": "0.00",
      "discount_code": null,
      "discount_type": null,
      "discount_reason": null,
      "discount_approved_by": null,
      "cash_price": "21.00",
      "card_price": "21.00",
      "is_discounted_row": false,
      "is_void": false,
      "void_reason": null,
      "is_return": false,
      "return_quantity": "0.00",
      "created_at": "2026-10-12T10:30:00+05:30"
    },
    {
      "store_code": "{{storeCode}}",
      "order_id": 10001,
      "order_code": "POSTMAN-ORDER-001",
      "order_number": "900001",
      "order_item_id": 20012,
      "order_item_code": "POSTMAN-ITEM-001-02",
      "business_date": "2026-10-12",
      "station_code": "POS-01",
      "shift_code": "SHIFT-AM",
      "batch_code": "BATCH-20261012",
      "department_code": "FOOD",
      "department_name": "Food & Beverage",
      "category_code": "FOOD",
      "category_name": "Prepared Food",
      "menu_item_code": "MENU-001-2",
      "item_name": "Sandwich",
      "quantity": "1.00",
      "price": "31.00",
      "subtotal": "31.00",
      "tax_code": "TAX5",
      "tax_name": "Sales Tax 5%",
      "tax_amt": "1.55",
      "discount_amt": "0.00",
      "gift_card_code": null,
      "tran_discount_code": null,
      "tran_discount_name": null,
      "tran_discount": "0.00",
      "tran_discount_tax": "0.00",
      "item_discount_code": null,
      "item_discount_name": null,
      "item_discount": "0.00",
      "item_discount_tax": "0.00",
      "comno_header": null,
      "combo_group_name": null,
      "combo_discount": "0.00",
      "combo_discount_tax": "0.00",
      "discount_code": null,
      "discount_type": null,
      "discount_reason": null,
      "discount_approved_by": null,
      "cash_price": "31.00",
      "card_price": "31.00",
      "is_discounted_row": false,
      "is_void": false,
      "void_reason": null,
      "is_return": false,
      "return_quantity": "0.00",
      "created_at": "2026-10-12T10:30:00+05:30"
    }
  ],
  "payments": [
    {
      "store_code": "{{storeCode}}",
      "payment_id": 30011,
      "payment_code": "POSTMAN-PAYMENT-001-01",
      "order_code": "POSTMAN-ORDER-001",
      "split_code": "SPLIT-001-01",
      "business_date": "2026-10-12",
      "station_code": "POS-01",
      "shift_code": "SHIFT-AM",
      "batch_code": "BATCH-20261012",
      "tender_code": "CARD",
      "tender_name": "Card",
      "payment_amount": "27.30",
      "round_off_amt": "0.00",
      "tip_amount": "0.00",
      "fees": "0.00",
      "surcharge": "0.00",
      "total_amount": "27.30",
      "payable_amount": "27.30",
      "change_amount": "0.00",
      "payment_split_no": 1,
      "payment_status": "CAPTURED",
      "gift_card_no": null,
      "card_type": "VISA",
      "issuer": "Dummy Test Bank",
      "mask_pan": "************4242",
      "tran_type": "SALE",
      "entry_mode": "CHIP",
      "is_void": false,
      "is_capture": true,
      "split_json": {
        "split_code": "SPLIT-001-01",
        "split_no": 1,
        "split_type": "EQUAL",
        "customer_name": "Test Customer 1",
        "split_amount": "27.30",
        "items": [
          {
            "order_item_code": "POSTMAN-ITEM-001-01",
            "split_qty": "0.50",
            "amount": "10.50"
          },
          {
            "order_item_code": "POSTMAN-ITEM-001-02",
            "split_qty": "0.50",
            "amount": "15.50"
          }
        ]
      },
      "created_on": "2026-10-12T10:30:00+05:30"
    },
    {
      "store_code": "{{storeCode}}",
      "payment_id": 30012,
      "payment_code": "POSTMAN-PAYMENT-001-02",
      "order_code": "POSTMAN-ORDER-001",
      "split_code": "SPLIT-001-02",
      "business_date": "2026-10-12",
      "station_code": "POS-01",
      "shift_code": "SHIFT-AM",
      "batch_code": "BATCH-20261012",
      "tender_code": "CASH",
      "tender_name": "Cash",
      "payment_amount": "27.30",
      "round_off_amt": "0.00",
      "tip_amount": "0.00",
      "fees": "0.00",
      "surcharge": "0.00",
      "total_amount": "27.30",
      "payable_amount": "27.30",
      "change_amount": "0.00",
      "payment_split_no": 2,
      "payment_status": "CAPTURED",
      "gift_card_no": null,
      "card_type": null,
      "issuer": null,
      "mask_pan": null,
      "tran_type": "SALE",
      "entry_mode": null,
      "is_void": false,
      "is_capture": false,
      "split_json": {
        "split_code": "SPLIT-001-02",
        "split_no": 2,
        "split_type": "EQUAL",
        "customer_name": "Test Customer 1",
        "split_amount": "27.30",
        "items": [
          {
            "order_item_code": "POSTMAN-ITEM-001-01",
            "split_qty": "0.50",
            "amount": "10.50"
          },
          {
            "order_item_code": "POSTMAN-ITEM-001-02",
            "split_qty": "0.50",
            "amount": "15.50"
          }
        ]
      },
      "created_on": "2026-10-12T10:30:00+05:30"
    }
  ],
  "card_payments": [
    {
      "store_code": "{{storeCode}}",
      "card_payment_id": 40111,
      "card_payment_code": "POSTMAN-CARD-001-01-01",
      "payment_code": "POSTMAN-PAYMENT-001-01",
      "order_code": "POSTMAN-ORDER-001",
      "split_code": "SPLIT-001-01",
      "business_date": "2026-10-12",
      "station_code": "POS-01",
      "shift_code": "SHIFT-AM",
      "batch_code": "BATCH-20261012",
      "device_type": "PAX",
      "device_serial_no": "TEST-DEVICE-001",
      "mid": "TEST-MID-001",
      "tid": "TEST-TID-001",
      "tran_id": "TEST-TRAN-001-1-1",
      "rrn": "TEST-RRN-001-1-1",
      "stan_id": "00111",
      "auth_code": null,
      "tran_type": "SALE",
      "entry_mode": "CHIP",
      "card_type": "VISA",
      "issuer": "Dummy Test Bank",
      "mask_pan": "************4242",
      "sale_amount": "27.30",
      "tip_amount": "0.00",
      "surcharge_amount": "0.00",
      "total_amount": "27.30",
      "response_code": "05",
      "response_text": "Dummy declined attempt",
      "is_void": false,
      "is_capture": false,
      "created_on": "2026-10-12T10:30:00+05:30"
    },
    {
      "store_code": "{{storeCode}}",
      "card_payment_id": 40112,
      "card_payment_code": "POSTMAN-CARD-001-01-02",
      "payment_code": "POSTMAN-PAYMENT-001-01",
      "order_code": "POSTMAN-ORDER-001",
      "split_code": "SPLIT-001-01",
      "business_date": "2026-10-12",
      "station_code": "POS-01",
      "shift_code": "SHIFT-AM",
      "batch_code": "BATCH-20261012",
      "device_type": "PAX",
      "device_serial_no": "TEST-DEVICE-001",
      "mid": "TEST-MID-001",
      "tid": "TEST-TID-001",
      "tran_id": "TEST-TRAN-001-1-2",
      "rrn": "TEST-RRN-001-1-2",
      "stan_id": "00112",
      "auth_code": "AUTH001",
      "tran_type": "SALE",
      "entry_mode": "CHIP",
      "card_type": "VISA",
      "issuer": "Dummy Test Bank",
      "mask_pan": "************4242",
      "sale_amount": "27.30",
      "tip_amount": "0.00",
      "surcharge_amount": "0.00",
      "total_amount": "27.30",
      "response_code": "00",
      "response_text": "Dummy approved attempt",
      "is_void": false,
      "is_capture": true,
      "created_on": "2026-10-12T10:30:00+05:30"
    }
  ]
}
```

Required fields:

| Record | Required data |
|---|---|
| Envelope | `request_id`, positive `source_revision`, `order`, `items`, `payments`, `card_payments` |
| Order | `store_code`, `order_code`, `business_date`, offset-bearing `created_at` |
| Item | `store_code`, `order_code`, `order_number`, `order_item_code`, `business_date` |
| Payment | `store_code`, `order_code`, `payment_code`, `business_date` |
| Card transaction | `store_code`, `order_code`, `payment_code`, `card_payment_code`, `business_date` |

All three child arrays must be present, including when empty. Child store,
order and business date must match the parent. Each card record must reference
an included payment. Codes must be stable and unique within the store across
stations. Optional columns reset to their defaults/null if omitted from a newer
full snapshot. Monetary values use decimal strings fitting `numeric(18,2)`;
large integer IDs use strings. Actual timestamps require an explicit offset
and at most millisecond precision. `business_date` remains the POS business date.
The body limit is 1,000,000 bytes; each child array allows at most 2,000 rows.

## 7. Expected results and totals

First successful submission of the first order:

```json
{"status":"accepted","request_id":"postman-dummy-order-001-r1","source_revision":"1"}
```

HTTP 201 means the complete snapshot has committed. An identical retry returns
HTTP 200 with `status: "duplicate"`. A newer revision is required to correct an
existing order; changing only the request ID does not bypass a revision conflict.

If all ten supplied snapshots are new and accepted, these are the fixture counts:

| Table | Rows belonging to this dataset |
|---|---:|
| `tbl_rpt_order` | 10 |
| `tbl_rpt_order_item` | 20 |
| `tbl_rpt_payment` | 15 |
| `tbl_rpt_card_payment` | 12 |

The supplied records have business date **2026-10-12**. Set the web report's From
and To filters to that date; its default date may be today instead.
For this dataset alone, raw order totals are **629.20**, item subtotals are
**610.00**, and payment amounts are **419.70**. These reflect the supplied
records, including their void/return flags and amounts; the API does not invent
accounting adjustments or enforce that those three sums agree. Card attempts
are not added to tender totals. Other existing store data can change the UI's
aggregate counts/totals; use the SQL filters below to inspect only these fixtures.

## 8. Read the synced data

Log in as a user already assigned to the store, select it, and open
`/report/orders`. In Postman, report reads require an authenticated web session
cookie; POS HMAC headers alone do not authenticate these GET endpoints.

```http
GET {{baseUrl}}/api/reporting/orders?store_code={{storeCode}}&from=2026-10-12&to=2026-10-12&limit=50
```

To include the first order's items, payments and card attempts:

```http
GET {{baseUrl}}/api/reporting/orders?store_code={{storeCode}}&from=2026-10-12&to=2026-10-12&order_code=POSTMAN-ORDER-001
```

The response includes `storeCode`, `filters`, `totals`, `orders` and optional
`detail`. USER accounts can read only granted stores; ADMIN accounts can read
all active stores. Selecting another store changes the schema and resets detail.
Successful sync time is displayed using the store's timezone.

Read-only SQL verification:

```sql
SELECT store_code, schema_name, reporting_version
FROM public.store_reporting_schemas
WHERE store_code = 'ACUTERPOS';
```

Use the returned schema name in place of `store_schema_name` below. The array of
codes restricts the checks to the ten uploaded fixtures, excluding unrelated data.

```sql
WITH fixture_orders AS (
  SELECT 'POSTMAN-ORDER-' || lpad(n::text, 3, '0') AS order_code
  FROM generate_series(1, 10) AS series(n)
)
SELECT
  (SELECT count(*) FROM "store_schema_name".tbl_rpt_order WHERE store_code = 'ACUTERPOS' AND order_code IN (SELECT order_code FROM fixture_orders)) AS orders,
  (SELECT count(*) FROM "store_schema_name".tbl_rpt_order_item WHERE store_code = 'ACUTERPOS' AND order_code IN (SELECT order_code FROM fixture_orders)) AS items,
  (SELECT count(*) FROM "store_schema_name".tbl_rpt_payment WHERE store_code = 'ACUTERPOS' AND order_code IN (SELECT order_code FROM fixture_orders)) AS payments,
  (SELECT count(*) FROM "store_schema_name".tbl_rpt_card_payment WHERE store_code = 'ACUTERPOS' AND order_code IN (SELECT order_code FROM fixture_orders)) AS card_transactions;
```

## 9. Retry, correction and error tests

Clone the first request for mutation tests so the original collection stays
reusable. Every correction must still include the complete intended child arrays.

| Test | Change/action | Expected outcome |
|---|---|---|
| Fresh fixture | Send a new order snapshot | 201 `accepted` |
| Identical retry | Send unchanged body again | 200 `duplicate`; no extra rows |
| Corrected snapshot | New request ID, revision `2`, change `customer_name` and keep every child | 201 `accepted`; original web report IDs remain |
| Same revision conflict | New request ID at revision `2`, change content again | 409; prior data remains |
| Request ID reuse | Reuse a prior request ID with changed content/revision | 409 |
| Older snapshot | After revision 2, send revision 1 with a new request ID | 200 `stale`; latest data remains |
| Removed children | At revision `3` and new request ID, omit an item/payment and all cards referring to the removed payment | 201; omitted rows removed together |
| Empty children | At a newer revision, send all three arrays empty | 201; existing children removed |
| Wrong child store | Change one item's `store_code` | 400 |
| Missing payment | Change card `payment_code` to one absent from the snapshot | 400; no writes |
| Wrong signature | Override the signature after signing | 401 |
| Expired timestamp | Sign using a timestamp older than five minutes | 401 |
| Array body | Send the original ten-order array in one POST | 400 with single-snapshot instructions |
| Unassigned web user | Read a store not granted to the logged-in USER | 403 |

For negative-signature/timestamp tests, temporarily adjust the signing script
and sign the intended negative-test content; otherwise the normal script will
refresh headers and undo your changes. Keep these changes in cloned requests.

If previous dummy data used these same codes with different revision-1 content,
the collection can correctly return 409. Use a newer source revision and new
request ID to replace that same order, or create a new consistent set of parent,
item, payment and card codes to test a different order. Do not merely regenerate
request IDs automatically on every send.

| HTTP result | What to do |
|---|---|
| 200 `duplicate` / `stale` | Acknowledged; remove this outbox entry |
| 201 `accepted` | Committed; remove this outbox entry |
| 400 | Correct fields/envelope; preserve data for investigation |
| 401 | Check store credentials, current timestamp and signed bytes |
| 403 | Check store activation/scope or web-user access |
| 409 | Reconcile source revision, reused request ID or ownership conflict |
| 413 | Reduce snapshot size; do not send partial children as a full snapshot |
| 503 / timeout / network failure | Retry the same snapshot/request ID with fresh signing headers |

Each order is atomic, but ten separate HTTP requests are **not** one shared
transaction. A runner interruption can leave earlier orders committed; rerun
the collection to safely retry unchanged snapshots. The external POS needs a
durable outbox retaining snapshots until acknowledged.

## 10. Automated checks

```powershell
npm run test:auth
npm run test:reporting
node --test --test-isolation=none tests/postman-reporting.test.mjs
npx tsc --noEmit
```

Automated database tests use disposable PGlite databases and do not push dummy
records into your configured server. Postman fixture tests validate all ten
individual envelopes and check the collection's Web Crypto signature against
Node's HMAC implementation. A script interoperability check is not a claim that
Postman's desktop UI or a live upload has been executed.

See [POS reporting API details](pos-reporting-api.md) and
[credential/signing reference](pos-notification-api.md) for integration context.
