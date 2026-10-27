# Store-wise reporting

For runnable Postman requests, the supplied ten-order dummy dataset, signing
scripts and expected test results, see
[Store reporting setup and Postman testing](store-reporting-sync-testing.md).

Each store has its own reporting schema containing the four supplied tables.
Users are login accounts (`auth_users`), and the existing `store_access` grants
control which stores they can select. There is no customer-business selection or
customer dependency when reading or syncing reports. Accounts, stores, grants and
POS credentials remain shared in `public`.

```text
user ? assigned stores ? selected store ? registered store schema ? reports
DT01 ? store_dt01 ? DT01 orders/items/payments/card transactions
AP01 ? store_ap01            ? AP01 orders/items/payments/card transactions
```

New schema names use `store_` plus the lowercase store code, with punctuation replaced
by underscores (for example, `DT01` becomes `store_dt01`). The suffix must fit
within 57 characters; codes that normalize to the same name are rejected. Existing
registered schemas keep their names and data. Apply the latest migrations or run
`npm run reporting:install` to update provisioning. Schema mappings are registered in
`public.store_reporting_schemas`. Do not accept schema names from the browser or
POS. Each schema's membership check allows exactly its owning store, including
when two stores have identical POS record codes. POS `customer_code` and
`customer_name` columns describe the order's purchaser; they do not route schemas.

## Provision existing stores

Apply migrations and provision the stores that already exist:

```powershell
npm run db:deploy
npm run prisma:generate
npm run reporting:stores -- provision-all
npm run reporting:stores -- list
```

For one store, use `npm run reporting:stores -- provision DT01`. Provisioning is
idempotent and transactional per store. New stores created through Admin ? Stores
get their schema in the same transaction as store creation. User store grants are
unchanged; no customer creation or assignment command is needed. Direct SQL-created
stores must be provisioned explicitly.

For a database managed with `prisma db push`, use `npm run prisma:push`: it now
installs the reporting function after syncing tables. To repair a database where
the tables exist but the function is missing, run `npm run reporting:install`.
The installer reuses the tracked reporting SQL, preserves existing mappings and
data, and can be safely rerun. It does not change Prisma migration history or
replay earlier table-creation migrations against an already populated database.

Provisioning uses the version-1 table definitions installed by the tracked
`20261012000000_store_reporting` migration. The function creates all tables before
registering the schema ready. Future table changes require a new tracked migration
and explicit version upgrade; do not silently change the deployed version-1 SQL.

The provisioning database role needs CREATE privileges. If migration and runtime
roles differ, grant the backend role EXECUTE on
`public.provision_store_reporting(text)` and the required table/sequence/schema
privileges. The function uses invoker privileges and is not publicly executable.
Only trusted backend roles receive SQL access; user authorization happens through
the existing store access API checks.

## Cut over from the previous customer schemas

Pause POS writes during the deployment/cutover, apply the new migration, deploy
this application version and run `reporting:stores -- provision-all`. For each
store with a previous version-1 customer schema, provisioning copies only that
store's four reporting tables and sync receipts into its new schema. It preserves
report IDs, source revisions and ingestion timestamps, and advances generated ID
sequences. A failed provision rolls back that store's entire cutover; rerunning
resumes stores not yet provisioned. Do not mix old and new application writers.

Legacy customer tables, ownership metadata and customer schemas are retained only
as compatibility archives, so existing data is not deleted. The old customer-store
trigger and customer management command/API are removed. Active reporting queries,
POS authentication, user access checks and the store form do not use those archives.
The Prisma `LegacyReportingCustomer` model only preserves the legacy database
mapping; it is not an application customer concept.

The earlier authentication migrations use UUID IDs while the current Prisma
models use integer IDs. This migration does not alter those existing IDs. Keep
your established database baseline; do not reset a populated database to resolve
that unrelated difference. Direct `prisma db push` does not install the provisioning
function: use the `npm run prisma:push` wrapper or run `npm run reporting:install`
afterward. Migration-managed databases should use the tracked migrations.

## Complete order snapshot

Send `POST /api/pos/reporting/restaurant/orders` with the same four HMAC headers and exact
UTF-8 signing procedure documented in [POS notification API](pos-notification-api.md).
Each request contains **one complete order**, including all current child rows.

```json
{
  "request_id": "b57a1df4-91ef-493b-9133-64b0e50dba42",
  "source_revision": "1",
  "order": {
    "store_code": "DT01",
    "order_code": "ORDER-1001",
    "order_number": "1001",
    "business_date": "2026-10-08",
    "created_at": "2026-10-09T01:00:00+05:30",
    "total": "12.50",
    "paid_amount": "12.50"
  },
  "items": [{
    "store_code": "DT01",
    "order_code": "ORDER-1001",
    "order_number": "1001",
    "order_item_code": "ITEM-1001-1",
    "business_date": "2026-10-08",
    "item_name": "Coffee",
    "quantity": "1.00",
    "subtotal": "12.50"
  }],
  "payments": [{
    "store_code": "DT01",
    "order_code": "ORDER-1001",
    "payment_code": "PAYMENT-1001-1",
    "business_date": "2026-10-08",
    "tender_name": "Cash",
    "payment_amount": "12.50"
  }],
  "card_payments": []
}
```

Column names match the supplied SQL, including PostgreSQL's lowercase
`comno_header`. Send exact monetary values and large integer IDs as strings.
Amounts fit `numeric(18,2)`. All event timestamps need an explicit offset with
at most millisecond precision. `business_date` comes from the POS business day,
not the calendar date of a UTC timestamp. Optional columns reset to their
documented SQL defaults or null when omitted in a newer full snapshot.

The four record codes must be stable and unique **within the store across all
stations**. Children must match the parent store, order and business date. Card
transactions must refer to a payment included in this snapshot. Include failed
card attempts when they belong in the intended history. Report IDs, sync timestamps,
schema names, and unknown columns cannot be supplied. All child arrays are
required, even when empty. Optional `order.employee_name` and `payment.station_name`
are text up to 100 characters. The request limit is 1 MB and 2,000 rows per child array.

Post batches to `POST /api/pos/reporting/restaurant/batch` and shifts to
`POST /api/pos/reporting/restaurant/shift` before relying on those codes. Each request is one
object with `request_id`, `source_revision`, and `batch` or `shift`. A shift's
`batch_code` must already exist for the store, so create the batch first. The order
endpoint does not accept `batch` or `shift` objects.

Persist the source revision with the POS order; increment it for every correction.
Do not generate a new revision on retry. Persist the exact snapshot with its
request ID in a durable local outbox **before** attempting HTTP delivery. Retry
timeouts, network failures and `5xx` with the same payload/request ID, regenerating
only the signing timestamp and signature. Delete the outbox entry only after a
successful acknowledgement. Quarantine `4xx` failures for correction rather than
dropping data. The POS application is external to this repository; its outbox must
be implemented there.

Responses:

| HTTP | status | Meaning |
|---|---|---|
| 201 | accepted | Complete snapshot committed |
| 200 | duplicate | Identical content already processed |
| 200 | stale | A newer source revision is already stored |
| 409 | error | Request ID reused with different content, revision conflict, or ownership conflict |
| 400/413 | error | Invalid or oversized snapshot |
| 401/403 | error | Credential or store scope rejected |
| 503 | error | Retry later; no acknowledgement |

Successful bodies include `request_id` and `source_revision`. Newer snapshots
upsert children while retaining web report IDs, then remove omitted children in
dependency order. All writes and the request receipt share one transaction.
Request receipts are retained to detect conflicting reuse; size their retention
before introducing cleanup. An acknowledged stale snapshot should be removed from
the outbox because it must not overwrite newer data.

## Web reports

Open **Store Order Reporting** in the sidebar (`/report/orders`). Select a store,
choose business dates, and view orders, item details, split payments and card
attempts. Last successful sync is shown in the store's timezone.

`GET /api/reporting/orders?store_code=DT01&from=2026-10-08&to=2026-10-09`
supports `limit` (1–200, default 50), `offset` (default 0), and optional
`order_code` for full detail. It verifies the current database user and store
grant, resolves the selected store?s registered schema, and reads a consistent snapshot.
Platform ADMIN accounts can access all active stores. USER accounts
can access only explicitly granted stores. Responses are private and not cached
by HTTP. Browser cache keys include store and filters; switching scope
resets detail and filters.

Totals are **raw POS sums**, including void and return rows as supplied. Order
totals, item subtotals and payment amounts are independently aggregated. Card
amounts are not added again to tender totals. Net revenue, tax allocation and
status-specific filtering require a separate documented POS accounting contract.
Other existing sample dashboard/report screens have not been reinterpreted as
these accounting reports.

## Import existing public reporting tables

If you already created/populated the supplied four tables in `public`, first set
the correct IANA timezone on each store, provision its schema, then run:

```powershell
npm run reporting:import-public -- DT01
```

This explicitly reads the store's four source tables, converts local timestamps
using the registered timezone, validates all snapshots and imports them at source
revision 1. Source tables remain unchanged. Generated web report IDs may differ;
POS codes are the stable identity; report ingestion timestamps are set at import.
Stop source changes during import and begin
subsequent POS snapshots at revision 2 or higher. Ambiguous local times around
daylight-saving transitions require correcting source data with known offsets
before import. Per-order commits make a failed run resumable with the same IDs;
conflicting revision-1 data needs reconciliation rather than silent overwriting.

## Verification

`npm run test:reporting` runs validation and real PostgreSQL semantics in a
disposable PGlite database, including the tracked migrations. No configured live
database is mutated by these tests. Also run `npm run test:auth`,
`npx tsc --noEmit`, and `npm run build`.
