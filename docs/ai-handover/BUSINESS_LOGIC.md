# Business logic and invariants

## Access and administration

`src/lib/store-access.ts`: store codes trim and uppercase; ADMIN can access every active store, USER requires `store_access`. APIs re-read active user/role. Selected cookie is a preference, not an authorization grant. Stores are global identities; customer ownership is legacy and does not determine current access.

`store-admin-validation.ts`: code 1–64 characters, name 1–160, timezone 1–80 and accepted by Intl. SQL provisioning additionally limits the sanitized schema suffix to 57 characters and rejects collisions. Store updates allow name/timezone/active only; codes are immutable through the API.

`user-admin-validation.ts`: trimmed name 1–120, lowercase valid email up to 254, password 8–256. Blank password on PATCH means leave it unchanged. Role is not editable. CLI administrator creation has a different policy: password must be nonempty and at most 256, with no eight-character minimum.

Assignments deduplicate up to 10,000 positive user IDs or normalized store codes. Store-centric assignment allows only USER identities; user-centric assignment targets only USER accounts. Inactive users/stores may be assigned but cannot access until active. PUT performs replacement under a transaction and row lock. Review cross-orientation concurrency before changing assignment logic.

## Snapshot contract

Sources: `src/lib/reporting/snapshot.ts`, `columns.json`, `sync.ts`, SQL tables.

- Exactly one order envelope per request. Only `request_id`, `source_revision`, `order`, `items`, `payments`, and `card_payments` are accepted. Every child array is required and capped at 2,000.
- Batch and shift use `POST /api/pos/reporting/restaurant/batch` and `POST /api/pos/reporting/restaurant/shift`. Each envelope is `request_id`, `source_revision`, and one `batch` or `shift` object. Create the batch before any shift that references its `batch_code`. A shift whose batch is missing is rejected and not stored.
- Unknown/server-managed row fields are rejected. Missing required fields fail. Missing optional fields become their declared default or null. Explicit null fails for required fields or fields with non-null defaults.
- Child `store_code`, `order_code`, and `business_date` must match the parent; cards must reference a payment in the same snapshot. Child codes are unique in their array and cannot move between orders in SQL upsert logic.
- Large integers must be strings; bigint bounds are enforced. Revisions are positive bigint values. Decimals fit numeric(18,2), normalize to two decimal places, and signed values are retained. JSON objects/arrays cannot contain null characters and nesting is limited to 30.
- Business date is a valid YYYY-MM-DD. Timestamps require explicit offset and seconds with optional 1–3 fractional digits; normalization produces UTC ISO strings. Business date is supplied by POS, not recalculated from timestamps.
- Hash covers normalized content including revision, excludes `request_id`, sorts object keys and child codes. This content hash differs from HMAC, which covers exact raw request text.
- Same request ID + changed hash: 409. Same request ID + same content: duplicate unless its recorded result was stale. New request ID + lower revision: stale. Equal revision + changed content: 409. Equal revision + equal content: duplicate. Higher revision: accepted.
- Accepted order snapshots upsert all supplied fields, remove omitted children (cards before payments before items), and retain server IDs/creation timestamps on updates. Empty arrays intentionally remove all children. Parent, children, and the order receipt either all commit or all roll back. Order `batch_code` and `shift_code` do not insert or delete batch and shift rows.
- Accepted batch and shift snapshots upsert by `batch_code` or `shift_code`, keep their own `source_revision` and `snapshot_hash`, and record receipts in `sync_master_requests`. The same request-id, revision, and hash rules apply. A shift write also requires the referenced batch row and shares that transaction with its receipt.
- POS flags and totals are retained without deriving a new order state machine or reconciling money. No validation guarantees totals equal item sums, low-stock quantity is below threshold, or payment status matches flags.

## Retail snapshot contract

Sources: `src/lib/reporting/retail-snapshot.ts`, `retail-sync.ts`, `retail-columns.ts`, and `database/reporting/retail/001-tables.sql`.

- Restaurant ingestion is `POST /api/pos/reporting/restaurant/batch`, `/shift`, and `/orders`. Retail ingestion is `POST /api/pos/reporting/retail/batch`, `/shift`, and `/orders`. The registered `store_type` is the only selector. Restaurant routes reject `RETAIL`; retail routes reject `RESTAURANT`.
- Retail checkout envelopes are `request_id`, `checkout_transaction`, `transaction_detail`, `transaction_payment`, and `transaction_gift_card`. The other retail routes are one `request_id` plus one row whose key matches the path (`station_transaction`, `store_account_transaction`, `station_cash_transfer`, `invoice`, `invoice_payment`, `clockin`, `nosale`, `account_payment`, `group_detail`, `store`, `Coupon`, `Online_Platform_Master`, `cashmachine_transaction`, `cashmachine_master`, `cashmachine_batch`). Every physical column is accepted. The POS id is required. There is no `source_revision`. Identical stored content returns duplicate. Different content for the same POS id overwrites it. Nullable columns that are omitted are stored blank. `NOT NULL` columns with a default use that default when omitted. `NOT NULL` columns without a default must be sent.
- Create the checkout only after a `tbl_shift` row exists. Payment `batchid` must match that shift. Child ids cannot move to another checkout. Omitted children are deleted. `POST /api/pos/reporting/retail/shift` upserts `tbl_shift_end_report` by `shiftid`. It does not write `tbl_shift` and does not require `tbl_batch`. Card columns are ordered `{label,value}` arrays. The retail Shift End read keeps a shift when its store-local start date is on or before the filter end and its end date is on or after the filter start. A null end stays included when the start date is on or before the filter end.
- Column rules follow the retail SQL type, nullability, default, and numeric scale. Checkout totals are stored as supplied. Payment rows are not summed into those totals, so a card attempt does not become checkout revenue by itself.

## Calculations and date semantics

`read.ts`: orders use inclusive `business_date BETWEEN from AND to`. Totals separately count orders, sum order `total`, item `subtotal`, and payment `payment_amount`. Void/return rows are included as supplied; card attempts are excluded. Last sync is the latest accepted receipt for the store across all dates. Optional order detail does not filter the list or aggregate totals.

`transaction-read.ts`: dates are store-local boundaries on order `created_at` with an exclusive start of the day after `to`, handling DST. Detail by order code bypasses date/search filters. Each selected order contributes once:

| Value | Formula |
| --- | --- |
| Subtotal | Sum item `subtotal` |
| Tax | Sum item `tax_amt + tran_discount_tax + item_discount_tax` |
| Discount | Sum item `tran_discount + item_discount` |
| Gratuity / fees | Order `gratuity` / `fees` |
| Tips | Sum payment `tip_amount` |
| Total | Sum payment `total_amount - change_amount` |
| Sales | Sum transaction totals whose order `payment_status = 'PAID'` |
| Refunds | Absolute value of sum totals whose status is `RETURN` |
| Average | Average transaction total for `PAID` orders |

No additional void/capture filters are applied to those payment sums. Item/tender searches select whole orders; they do not restrict the items/payments subsequently totaled. Tender names concatenate uniquely. Cashier is a placeholder. Monetary API results remain decimal strings; transaction UI converts them to JavaScript numbers for display.

## Notifications

`pos-events.ts` creates SHIFT_END, DAY_END, LOW_STOCK, VOID_REFUND labels/targets; VOID_REFUND action accepts VOID or REFUND. `notification_preferences` opts in per user/store/type. Ingestion enforces active recipient identity and assignment. Retention is 90 days for inbox reads; read-all updates all ages. Cleanup runs only for newly accepted events, while duplicate events return before cleanup and push. Event time does not determine inbox ordering; database creation time does.
