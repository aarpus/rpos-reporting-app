# API documentation

Source: every `src/app/api/**/route.ts` in the working tree. Requests/responses are JSON unless handled by Auth.js. Expected custom failures use `{ "error": "message" }`; uncaught database exceptions in several admin/notification routes use framework error handling, so there is no universal JSON 500 contract. Unsupported verbs are not implemented. No CORS policy is explicitly configured.

## Common authorization and shapes

**Session** means `getRequestUser()` checks a valid session plus active database identity (401 otherwise). **Store** additionally requires active accessible store (403 otherwise). **Admin** adds current database ADMIN role (403 for USER). Store codes in camelCase APIs normalize by trim/uppercase. Reporting query uses `store_code` and resolves its registered schema in a repeatable-read read-only transaction.

| Shape | Fields |
| --- | --- |
| StoreSummary | `storeCode`, `name`, `timezone`, `storeType` (`RESTAURANT` or `RETAIL`) |
| AdminStore | StoreSummary + `active`, `assignedUserCount`, `createdAt`, `updatedAt` (ISO timestamps) |
| AdminUser | `id` string, `name`, `email`, `active`, `assignedStoreCount`, `createdAt` |
| StoreAccessUser | `id` string, `name`, `email`, `active`, `assigned` |
| UserAccessStore | `storeCode`, `name`, `active`, `assigned` |

These shapes are implemented in `src/types/{store-admin,user-admin}.ts` and `src/lib/store-access.ts`. Password hashes and credential secrets are not returned by admin APIs.

## Authentication

`GET, POST /api/auth/[...nextauth]` delegates to `handlers` from `src/auth.ts`, runtime nodejs. It is the Auth.js protocol endpoint, not a custom REST envelope. Used subpaths include GET `session`, `csrf`, `providers`, `signin` and POST `callback/credentials`, `signout`. Credential callback takes form-encoded `email`, `password`, Auth.js CSRF fields and redirect configuration. Session JSON provides user identity/name/email/role and expiry when authenticated; the exact library protocol is owned by installed NextAuth. Prefer `signIn`/`signOut` from `next-auth/react` as the existing UI does. No public registration or password-reset endpoint exists.

## Store context

| Method/path | Authorization | Input | Success | Expected failures | Source |
| --- | --- | --- | --- | --- | --- |
| GET `/api/stores` | Session | none | 200 `{stores: StoreSummary[]}` | 401 | `src/app/api/stores/route.ts` |
| POST `/api/store-selection` | Store | `{storeCode}` | 200 `{store}` + HttpOnly selection cookie | 401/403 | `src/app/api/store-selection/route.ts` |

## Administration

| Method/path | Input | Success | Validation/errors | Source |
| --- | --- | --- | --- | --- |
| GET `/api/admin/stores` | none | 200 `{stores: AdminStore[]}` including inactive stores | Admin 401/403 | `src/app/api/admin/stores/route.ts` |
| POST `/api/admin/stores` | `{storeCode,name,timezone,storeType}` where `storeType` is `RESTAURANT` or `RETAIL` | 201 `{store: AdminStore}` | 400 parser/provisioning FK/check; 409 uniqueness; 503 missing function/EXECUTE or retail table SQL | same |
| PATCH `/api/admin/stores/[storeCode]` | nonempty subset `{name?,timezone?,active?}` | 200 `{store}` | 400 validation, including any attempt to send `storeType`; 404 missing store | `src/app/api/admin/stores/[storeCode]/route.ts` |
| GET `/api/admin/stores/[storeCode]/access` | path code | 200 `{users: StoreAccessUser[]}` (USER accounts only) | 404 missing store | `src/app/api/admin/stores/[storeCode]/access/route.ts` |
| GET `/api/admin/stores/[storeCode]/pos-credentials` | path code | 200 `{credentials:[{keyId,active,createdAt}]}`; no secrets | 404 missing/invalid store | `src/app/api/admin/stores/[storeCode]/pos-credentials/route.ts` |
| POST same POS credential path | empty body | 201 `{storeCode,keyId,secret}`; secret returned once | 404 missing/invalid store; 409 inactive store; 503 missing or invalid `POS_CREDENTIAL_ENCRYPTION_KEY` | same |
| PUT same access path | `{userIds: (number|string)[]}` | 200 `{assignedUserCount}` | 400 invalid IDs/unknown or non-USER; 404 store | same |
| GET `/api/admin/users` | none | 200 `{users: AdminUser[]}` (USER only) | Admin 401/403 | `src/app/api/admin/users/route.ts` |
| POST `/api/admin/users` | `{name,email,password}` | 201 `{user: AdminUser}` with USER role | 400 validation; 409 duplicate email | same |
| PATCH `/api/admin/users/[userId]` | nonempty supported subset `{name?,email?,password?,active?}` | 200 `{user}` | 400 validation; 404 absent/non-USER; 409 email | `src/app/api/admin/users/[userId]/route.ts` |
| GET `/api/admin/users/[userId]/access` | positive safe integer path | 200 `{stores: UserAccessStore[]}` | 404 absent/non-USER/invalid path | `src/app/api/admin/users/[userId]/access/route.ts` |
| PUT same access path | `{storeCodes: string[]}` | 200 `{assignedStoreCount}` | 400 invalid/unknown code; 404 user | same |

All admin rows require Admin authorization (401/403). Access PUT replaces assignments; empty array clears them. Validators deduplicate arrays up to 10,000 entries. Name/email/password/timezone limits and blank password semantics are in [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md). Validators ignore unsupported admin fields rather than offering generic role/schema mutation.

## Inbox, preferences and device subscriptions

| Method/path | Authorization/input | Success | Validation/errors | Source |
| --- | --- | --- | --- | --- |
| GET `/api/notification-preferences` | Store; query `storeCode` | 200 `{store,preferences:[{key,label,description,enabled}]}` | 401/403 | `src/app/api/notification-preferences/route.ts` |
| PATCH same | Store; `{storeCode,type,enabled}` | 200 `{type,enabled}` | 400 unsupported type/nonboolean, 401/403 | same |
| GET `/api/notifications` | Store; `storeCode`, optional ISO `cursor` | 200 `{store,unreadCount,items,nextCursor}` | 401/403; malformed cursor silently becomes null | `src/app/api/notifications/route.ts` |
| POST `/api/notifications/[id]/read` | Store; `{storeCode}` | 200 `{read:true,targetPath}` | 401/403/404; invalid integer DB input is not explicitly mapped | `src/app/api/notifications/[id]/read/route.ts` |
| POST `/api/notifications/read-all` | Store; `{storeCode}` | 200 `{updated:number}` | 401/403 | `src/app/api/notifications/read-all/route.ts` |
| POST `/api/push-subscriptions` | Session; `{endpoint,expirationTime?,keys:{p256dh,auth}}` | 200 `{subscribed:true}` | 400 endpoint/key types or endpoint >4096; 401 | `src/app/api/push-subscriptions/route.ts` |
| DELETE same | Session; `{endpoint}` | 200 `{subscribed:false}` even if no owned row | 400 nonstring endpoint; 401 | same |

Inbox items contain `id` number, `type`, `title`, `body`, `targetPath`, nullable ISO `readAt`, ISO `createdAt`. Reads cover the latest 90 days, return at most 30, and obtain a 31st row to determine nextCursor. Preference types are SHIFT_END, DAY_END, LOW_STOCK, VOID_REFUND. Missing preference rows default false. Subscription endpoint conflict can transfer the endpoint to the current authenticated user; DELETE is user-scoped. Numeric expirationTime is milliseconds; invalid dates become null.

## Signed POS protocol

Both POS POST endpoints require `X-Store-Code`, `X-POS-Key-Id` (trimmed, up to 80), `X-POS-Timestamp` (epoch seconds within 300 seconds of server time), and `X-POS-Signature` (base64 HMAC-SHA256). Canonical signed text is:

```text
NORMALIZED_STORE_CODE\nKEY_ID\nTIMESTAMP\nEXACT_RAW_JSON_BODY
```

Decode the shared base64 secret to bytes for HMAC. Sign the final transmitted text; whitespace changes invalidate it. No session cookie is required. Credential and store must be active. Generate a new timestamp/signature for retries while retaining stable request/event identity and content.

### POST `/api/pos/notification-events`

Source `src/app/api/pos/notification-events/route.ts`, parser `src/lib/pos-events.ts`. Raw text length >32,000 returns 413 (character count after full body read, not a streaming byte limit). Headers/timestamp/credential/signature failures return 401. Invalid JSON/event or optional body storeCode mismatch returns 400.

Envelope: `{eventId,type,occurredAt,data,storeCode?}`. Event ID is trimmed nonempty up to 160; occurredAt must parse as a date. Required data by type:

| Type | Required data |
| --- | --- |
| SHIFT_END | `shiftId` text <=160, `shiftNumber` <=40, date-parsable `endedAt` |
| DAY_END | `businessDate` text <=20, `reportId` <=160, date-parsable `closedAt` |
| LOW_STOCK | `productId` <=160, `sku` <=80, `productName` <=160, finite numeric `currentQuantity`, `threshold` |
| VOID_REFUND | `transactionId` <=160, `action` VOID/REFUND, finite numeric `amount`, `currency` text <=3, date-parsable `performedAt` |

Unknown extra envelope/data fields are not strictly rejected by this parser. Success 202 `{status:"accepted",eventId,recipients,push:{delivered,failed}}`; duplicate 200 `{status:"duplicate",eventId}`. Generated title/body/targetPath come from server parser. Duplicates do not fan out/push again. Unhandled DB/decryption/push-configuration exceptions are not mapped to a uniform retry envelope. Longer generated text versus database column limits is a boundary to review.

### POST `/api/pos/reporting/restaurant/orders`

Source `src/app/api/pos/reporting/restaurant/orders/route.ts`; contract `src/lib/reporting/{pos-auth,snapshot,columns.json,sync}.ts`. Streaming body limit 1,000,000 bytes, strict UTF-8. Registered version must be 1. Errors: 400 malformed body/field/date/value; 401 invalid signature/credential/unprovisioned scope; 403 unavailable scope recheck; 413 size; 409 request/revision/content/ownership/SQL FK or uniqueness conflict; 503 unsupported schema/temporary sync failure.

Required envelope:

```json
{
  "request_id": "example-order-1-revision-1",
  "source_revision": "1",
  "order": {
    "store_code": "EXAMPLE",
    "order_code": "ORDER-1",
    "business_date": "2026-10-14",
    "created_at": "2026-10-14T10:00:00Z"
  },
  "items": [],
  "payments": [],
  "card_payments": []
}
```

This is a minimal illustrative contract, not an executable signed request or a real provisioned store. Empty children are valid and intentionally reconcile to none. Each array <=2,000. Orders may include optional `employee_name` (max 100). Payments may include optional `station_name` (max 100). Order `batch_code` and `shift_code` are text references only; create the batch and shift through their own endpoints. See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for every allowed payload column, kind/default/nullability and physical SQL columns. Required fields cannot be null; server IDs/timestamps/revision/hash fields cannot be submitted in row objects. Request ID <=160, revision positive bigint. Child ownership/date/card-payment relationships are mandatory. A 10-order sample is `docs/postman/store-reporting-batch-shift-10-orders.postman_data.json`.

### POST `/api/pos/reporting/restaurant/batch`

Same POS signature, size limit, and status codes as the order endpoint. Source `src/app/api/pos/reporting/restaurant/batch/route.ts`. One batch object per request. Upsert key is `batch_code`. Receipts are stored in `sync_master_requests`, separate from order receipts.

```json
{
  "request_id": "example-batch-1-revision-1",
  "source_revision": "1",
  "batch": {
    "store_code": "EXAMPLE",
    "batch_code": "BATCH-20261014"
  }
}
```

### POST `/api/pos/reporting/restaurant/shift`

Same authentication and status codes. Source `src/app/api/pos/reporting/restaurant/shift/route.ts`. One shift object per request. `batch_code` is required and must already exist on `tbl_rpt_batch` for the signed store. Create the batch before the shift. A missing batch returns 409 `Create the batch before this shift.` Upsert key is `shift_code`.

```json
{
  "request_id": "example-shift-1-revision-1",
  "source_revision": "1",
  "shift": {
    "store_code": "EXAMPLE",
    "shift_code": "SHIFT-AM",
    "batch_code": "BATCH-20261014"
  }
}
```

Sample bodies: `docs/postman/store-reporting-batch.postman_data.json` and `docs/postman/store-reporting-shift.postman_data.json`. Post the batch sample before the shift sample.

These three routes accept a store only when `public.stores.store_type` is `RESTAURANT`. A retail store receives 403 `Restaurant reporting is not available for this store.` The caller does not send a store type. The signed `X-Store-Code` selects the registered store, and the server reads its type.

### POST `/api/pos/reporting/retail/shift`

Source `src/app/api/pos/reporting/retail/shift/route.ts`, `src/lib/reporting/retail-snapshot.ts`, `retail-sync.ts`. Same HMAC headers, 1 MB UTF-8 limit, and active credential checks as the restaurant routes. The store must be `RETAIL`; a restaurant store receives 403 `Retail reporting is not available for this store.` Registered reporting version must be 1.

The body is one object, `{ request_id, shift }`. It does not use `store_code`, `batch_code`, `order_code`, or `source_revision`. `request_id` is required for the response and is not stored. The same `shiftid` with the same content returns 200 `{status:"duplicate",request_id,shiftid}`; changed content overwrites that id and returns 201 `{status:"accepted",request_id,shiftid}`. Header Cache-Control=no-store. The route writes `tbl_shift_end_report` only.

```json
{
  "request_id": "example-retail-shift-1",
  "shift": {
    "shiftid": "201",
    "stationname": "REG1",
    "batch_number": "5",
    "shift": "2",
    "start_time": "2026-10-27T04:05:00Z",
    "end_time": "2026-10-27T10:12:28Z",
    "status": "Close",
    "employeename": "Ada",
    "employeeid": "4",
    "totaltime": "06:07:28",
    "sale": [{ "label": "Beer", "value": "520.00" }],
    "taxes": [{ "label": "Total", "value": "46.80" }],
    "sale_breakdown": [{ "label": "Cash", "value": "351.85" }],
    "terminalcashstatus": [{ "label": "Opening Balance", "value": "23.23" }],
    "miscellaneous": [{ "label": "No Sale Hit Count", "value": "0" }],
    "terminalcashtransfer": []
  }
}
```

`shiftid`, `batch_number`, `shift`, and `employeeid` are positive integers, sent as strings or numbers. `end_time` may be null while `status` is `Open`; `Close` requires `end_time`. Each card is an ordered array of `{ "label", "value" }` strings, at most 200 lines. Omitted cards are stored as `[]`. Money stays an exact decimal string. Same content for that `shiftid` returns duplicate; changed content overwrites the row.

### POST `/api/pos/reporting/retail/day-end-report`

Source `src/app/api/pos/reporting/retail/day-end-report/route.ts`, `src/lib/reporting/retail-day-end.ts`. Same HMAC auth and `201 accepted` / `200 duplicate` result as the shift route. The body is `{ request_id, day_end }`. Upsert is by `batchid`. This route does not write `tbl_batch`. `Close` requires `end_date_time`. `Open` may leave `end_date_time` null. Sample rows: `docs/postman/store-reporting-retail-day-end-report.postman_data.json`.

```json
{
  "request_id": "example-retail-day-end-5",
  "day_end": {
    "batchid": "5",
    "batch_number": "5",
    "start_date_time": "2026-10-27T04:00:00Z",
    "end_date_time": "2026-10-27T23:05:00Z",
    "status": "Close",
    "employeename": "Ada",
    "department_sales": { "rows": [], "total": null },
    "sales_summary": [{ "label": "Net Sales Amount", "value": "520.00" }],
    "cash_status": [],
    "sales_breakdown": [],
    "paid_out": { "rows": [], "total": "15.00" },
    "paid_in": { "rows": [], "total": "" },
    "tax_detail": { "rows": [], "total": null },
    "cash_acceptor": [],
    "employee_status": [],
    "miscellaneous": [],
    "promotion_summary": []
  }
}
```

Card sections are ordered `{ "label", "value" }` arrays. `department_sales` and `tax_detail` are `{ "rows", "total" }`. `paid_out` and `paid_in` are `{ "rows", "total" }` where `total` is the amount string. Omitted sections use the table defaults. There is no separate week or month body.

### POST `/api/pos/reporting/retail/transaction-journal`

Source `src/app/api/pos/reporting/retail/transaction-journal/route.ts`, `src/lib/reporting/retail-transaction-journal.ts`. Same HMAC auth and `201 accepted` / `200 duplicate` result as the shift route. The body is `{ request_id, transaction_journal }`. Upsert is by `transactionid`. `transaction_number` is the displayed transaction code and is not the upsert key. Amount columns are exact strings. `lines` is `{ "rows", "total" }`. `credit_card` and `paid_by_amounts` are ordered `{ "label", "value" }` arrays. Sample rows: `docs/postman/store-reporting-retail-transaction-journal.postman_data.json`. Each file is an array; Postman must send one object per request.

```json
{
  "request_id": "example-retail-journal-301",
  "transaction_journal": {
    "transactionid": "301",
    "transaction_date_time": "2026-10-27T10:20:00Z",
    "stationname": "W22",
    "transaction_number": "ACFG866202",
    "qty": "1.00",
    "discount": "0.00",
    "sub_total": "19.99",
    "tax": "1.20",
    "deposit": "0.00",
    "total": "21.19",
    "paid_by": "Card",
    "cashier": "111",
    "lines": { "rows": [], "total": null },
    "credit_card": [{ "label": "Auth Code", "value": "123456" }],
    "paid_by_amounts": [{ "label": "Card", "value": "21.19" }]
  }
}
```

### POST `/api/pos/reporting/retail/credit-card-transaction`

Source `src/app/api/pos/reporting/retail/credit-card-transaction/route.ts`, `src/lib/reporting/retail-credit-card.ts`. Same HMAC auth and `201 accepted` / `200 duplicate` result as the shift route. The body is `{ request_id, credit_card }`. Upsert is by `transactionid` into `tbl_creditcard_detail`. `tender` is `credit`, `debit`, or `external`. `transaction_type` is required only when `tender` is `external`. Amount is a two-decimal number and may be negative. Sample rows: `docs/postman/store-reporting-retail-credit-card.postman_data.json`. Postman must send one object per request.

### POST `/api/pos/reporting/retail/monthly-sales-tax`

Source `src/app/api/pos/reporting/retail/monthly-sales-tax/route.ts`, `src/lib/reporting/retail-monthly-sales-tax.ts`. Same HMAC auth and `201 accepted` / `200 duplicate` result as the shift route. The body is `{ request_id, monthly_sales_tax }`. Upsert is by `report_month` (`YYYY-MM`) into `tbl_monthly_sales_tax`. `columns` is the ordered header list and the first header is `Date`. `rows` is `{ "cells", "emphasize" }`, and each `cells` list matches the header count. Money cells are two-decimal strings. A row whose first cell is `Total` is rejected. Sample rows: `docs/postman/store-reporting-retail-monthly-sales-tax.postman_data.json`. Postman must send one object per request.

### POST `/api/pos/reporting/retail/invoice`

Source `src/app/api/pos/reporting/retail/invoice/route.ts`, `src/lib/reporting/retail-invoice.ts`. Same HMAC auth and `201 accepted` / `200 duplicate` result as the shift route. The body is `{ request_id, invoice }`. Upsert is by `invoiceid` and `invoice_type` into `tbl_invoice_report`. Header amounts are two-decimal numbers and may be negative. `lines`, `profit_lines`, `cost_lines`, `qty_lines`, and `log` are arrays of at most 200 rows. Line money stays an exact string. `profit_totals` is printed as sent. Sample rows: `docs/postman/store-reporting-retail-invoice.postman_data.json`. Postman must send one object per request.

### POST `/api/pos/reporting/retail/no-upc-detail`

Source `src/app/api/pos/reporting/retail/no-upc-detail/route.ts`, `src/lib/reporting/retail-noupc.ts`. Same HMAC auth and `201 accepted` / `200 duplicate` result as the shift route. The body is `{ request_id, no_upc_detail }`. Upsert is by `transaction_no`, `product_name`, and `transaction_datetime` into `tbl_noupc_detail`. `sold_qty` is an exact number string and may be negative. Money is a two-decimal number and may be negative. Sample rows: `docs/postman/store-reporting-retail-no-upc-detail.postman_data.json`. Postman must send one object per request.

These additional retail routes use the same authentication, one-object envelope, column rules, and `201 accepted` / `200 duplicate` result. The envelope key matches the path. The response includes `request_id` and that table's POS id.

| Path | Table | POS id |
| --- | --- | --- |
| `/api/pos/reporting/retail/station_transaction` | `tbl_station_transaction` | `stationtrasactionid` |
| `/api/pos/reporting/retail/store_account_transaction` | `tbl_store_account_transaction` | `storeaccounttransactionid` |
| `/api/pos/reporting/retail/station_cash_transfer` | `tbl_station_cash_transfer` | `stationcashtransferid` |
| `/api/pos/reporting/retail/invoice` | `tbl_invoice` | `id_invoice` |
| `/api/pos/reporting/retail/invoice_payment` | `tbl_invoice_payment` | `id_payment` |
| `/api/pos/reporting/retail/clockin` | `tbl_clockin` | `clockinid` |
| `/api/pos/reporting/retail/nosale` | `tbl_nosale` | `nosaleid` |
| `/api/pos/reporting/retail/account_payment` | `tbl_account_payment` | `Acc_Pay_id` |
| `/api/pos/reporting/retail/group_detail` | `tbl_group_detail` | `Group_Id` |
| `/api/pos/reporting/retail/store` | `tbl_store` | `storeid` |
| `/api/pos/reporting/retail/Coupon` | `tbl_Coupon` | `Coupon_Id` |
| `/api/pos/reporting/retail/Online_Platform_Master` | `tbl_Online_Platform_Master` | `OLpm_id` |
| `/api/pos/reporting/retail/cashmachine_transaction` | `tbl_cashmachine_transaction` | `id` |
| `/api/pos/reporting/retail/cashmachine_master` | `tbl_cashmachine_master` | `cashmachine_id` |
| `/api/pos/reporting/retail/cashmachine_batch` | `tbl_cashmachine_batch` | `cmachine_batchid` |

```json
{
  "request_id": "example-retail-station-1",
  "station_transaction": {
    "stationtrasactionid": "701",
    "employeeid": "4",
    "shiftid": "201",
    "stationid": "3"
  }
}
```

Restaurant success: 201 for accepted; 200 duplicate/stale; `{status:"accepted"|"duplicate"|"stale",request_id,source_revision}`. Header Cache-Control=no-store. Retry identical snapshots after temporary failures; changed content needs a new request ID and appropriately higher source revision. See [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md) for the full comparison rules and existing Postman examples in `docs/postman/`.

## Live reporting reads

### GET `/api/reporting/orders`

Source `src/app/api/reporting/orders/route.ts`, `src/lib/reporting/read.ts`. Session and registered Store authorization. Required query `store_code`, `from`, `to` (valid inclusive business dates, from<=to). Optional `limit` 1–200 default 50, nonnegative safe-integer `offset` default 0, `order_code` nonempty <=50.

200 response:

```text
{storeCode, filters:{from,to,limit,offset,orderCode?},
 totals:{order_count,order_total,item_subtotal,payment_amount,last_synced_at},
 orders:[{order_code,order_number,business_date,station_code,shift_code,
          order_status,payment_status,total,paid_amount,balance_amount,
          is_void,is_return,source_revision,rpt_updated_on}],
 detail:null|{order,items,payments,card_payments}}
```

Money/revision are strings; date string YYYY-MM-DD; serialized timestamps ISO; nullable source columns stay null. Detail returns raw SQL rows (including server columns) from the four tables. Optional order_code selects detail only, within dates; totals/list remain date-range-wide. Expected 400 filters, 401 session, 403 unavailable/denied schema, 404 missing detail, 503 unexpected query failure. Cache-Control private,no-store.

### GET `/api/reporting/transaction-detail`

Source `src/app/api/reporting/transaction-detail/route.ts`, `src/lib/reporting/transaction-read.ts`, `transaction-types.ts`. Required store_code; either `from`,`to` or `order_code` (<=50). Order-code detail bypasses date/search filtering. Pagination limit 1–200 default 20, offset default 0. Optional trimmed search: `check_no`, `transaction_no`, `menu_item` (<=500); `credit_card` <=150; `sku` <=100; `paid_by`,`department`,`trans_type` <=50. Check/transaction/card/item/SKU use case-insensitive literal substring; tender/department/status exact matching. Unknown query parameters are not rejected or implemented as filters.

200 `{storeCode,timezone,rows,count,totals,options,detail}`. Rows: `id` order code, `checkNo`, `createdAt`, string amounts `subtotal,tax,discount,gratuity,fees,tips,total`, `paidBy`, `terminal`, placeholder `cashier`, `transType`. Totals: decimal strings `sales,refunds,average,tips,gratuity,fees`. Options: `tenders:string[]`, `departments:{id,label}[]`, `statuses:string[]`, drawn from all store data. Detail is null or a row plus `items:[{id,name,sku,qty,amount}]` and `payments:[{id,method,amount}]`. Count is total matching orders before pagination. Expected errors/cache headers match order reads; missing receipt is 404.

### GET `/api/reporting/retail/shift-end`

Source `src/app/api/reporting/retail/shift-end/route.ts`, `src/lib/reporting/retail-shift-read.ts`. Session and registered store authorization. The store must be `RETAIL`. Required query `store_code`. List mode also requires `from` and `to` (inclusive YYYY-MM-DD, from<=to). Detail mode sends `id`, the report row id, and does not use the dates.

List 200 `{storeCode,timezone,rows}`. Each row is `id`, `shiftid`, `stationname`, `batch_number`, `shift`, `start_time`, `end_time`, `status`. A row matches when its start date in the store timezone is on or before `to`, and its end date is on or after `from`. An open row with a null end stays in range when its start is on or before `to`. Detail 200 `{storeCode,timezone,shift}` adds `employeename`, `employeeid`, `totaltime`, and the card arrays `sale`, `taxes`, `sale_breakdown`, `terminalcashstatus`, `miscellaneous`, `terminalcashtransfer`. Timestamps are ISO. Missing id is 404. Expected 400 filters, 401 session, 403 unavailable/denied schema, 503 unexpected query failure. Cache-Control private,no-store.

### GET `/api/reporting/retail/day-end`

Source `src/app/api/reporting/retail/day-end/route.ts`, `src/lib/reporting/retail-day-end.ts`. Same session, retail store, and date-overlap rules as Shift End. List mode requires `store_code`, `from`, and `to`. Detail mode sends `id`.

List 200 `{storeCode,timezone,rows}`. Each row is one stored day-end batch, including every section. Rows are ordered by `start_date_time`. Detail 200 `{storeCode,timezone,batch}`. Week End and Month End call this list with the selected week's first and last day, or the selected month's first and last day. The screen adds those batches into Department Sales, the sales-total card, Sales Breakdown, and Tax Detail. Missing id is 404. A missing `tbl_day_end_report` on an already provisioned schema returns 503.

### GET `/api/reporting/retail/transaction-journal`

Source `src/app/api/reporting/retail/transaction-journal/route.ts`, `src/lib/reporting/retail-transaction-journal.ts`. Same session and retail-store rules as Shift End. List mode requires `store_code`, `from`, and `to`. Optional `transaction_number` is a case-insensitive substring of the displayed transaction code, maximum 50 characters. Detail mode sends `id`, the report row id.

List 200 `{storeCode,timezone,rows}`. A row matches when the store-local date of `transaction_date_time` is between `from` and `to`. Detail 200 `{storeCode,timezone,transaction}`. Each record includes the amount strings, `lines`, `credit_card`, and `paid_by_amounts`. Missing id is 404. A missing `tbl_transaction_journal_report` on an already provisioned schema returns 503.

### GET `/api/reporting/retail/credit-card-transaction`

Source `src/app/api/reporting/retail/credit-card-transaction/route.ts`, `src/lib/reporting/retail-credit-card.ts`. Same session and retail-store rules as Shift End. Requires `store_code`, `from`, and `to`.

200 `{storeCode,timezone,rows}`. A row matches when the store-local date of `card_datetime` is between `from` and `to`. Amounts are decimal strings. The list uses rows whose `tender` is `credit` or `debit`. View Details uses `external` rows for External Pay. A missing `tbl_creditcard_detail` on an already provisioned schema returns 503.

### GET `/api/reporting/retail/monthly-sales-tax`

Source `src/app/api/reporting/retail/monthly-sales-tax/route.ts`, `src/lib/reporting/retail-monthly-sales-tax.ts`. Same session and retail-store rules as Shift End. Requires `store_code` and `month` (`YYYY-MM`).

200 `{storeCode,timezone,reportMonth,employeeName,columns,rows}`. A missing month returns an empty `columns` and `rows` list. The screen adds the Total row. A missing `tbl_monthly_sales_tax` on an already provisioned schema returns 503.

### GET `/api/reporting/retail/invoice`

Source `src/app/api/reporting/retail/invoice/route.ts`, `src/lib/reporting/retail-invoice.ts`. Same session and retail-store rules as Shift End. List mode requires `store_code`, `from`, and `to`. Optional `amount_from`, `amount_to`, `invoice_type` (`RC` or `OP`), exact `supplier_name`, and a case-insensitive `supplier_invoice_no` substring narrow the list. Detail mode sends `id` and `type`.

List 200 `{storeCode,timezone,suppliers,rows}`. A row matches when the store-local date of `invoice_datetime` is between `from` and `to`. `suppliers` is the distinct supplier names in that date match, before the supplier filter. List rows do not include the line arrays. Detail 200 `{storeCode,timezone,invoice}`. Missing id is 404. A missing `tbl_invoice_report` on an already provisioned schema returns 503.

### GET `/api/reporting/retail/no-upc-detail`

Source `src/app/api/reporting/retail/no-upc-detail/route.ts`, `src/lib/reporting/retail-noupc.ts`. Same session and retail-store rules as Shift End. Requires `store_code`, `from`, and `to`.

200 `{storeCode,timezone,rows}`. A row matches when the store-local date of `transaction_datetime` is between `from` and `to`. Amounts are decimal strings. The screen groups the rows by department and adds a Sub Total. A missing `tbl_noupc_detail` on an already provisioned schema returns 503.

These endpoints have different date and monetary semantics: consult [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md) before aligning them.

## Verified route export inventory

Generated from route source files, including the Auth.js handler re-export. HEAD/OPTIONS framework behavior is not an additional custom handler.

| Path | Exports | Source |
| --- | --- | --- |
| `/api/admin/stores/[storeCode]/access` | GET, PUT | `src/app/api/admin/stores/[storeCode]/access/route.ts` |
| `/api/admin/stores/[storeCode]/pos-credentials` | GET, POST | `src/app/api/admin/stores/[storeCode]/pos-credentials/route.ts` |
| `/api/admin/stores/[storeCode]` | PATCH | `src/app/api/admin/stores/[storeCode]/route.ts` |
| `/api/admin/stores` | GET, POST | `src/app/api/admin/stores/route.ts` |
| `/api/admin/users/[userId]/access` | GET, PUT | `src/app/api/admin/users/[userId]/access/route.ts` |
| `/api/admin/users/[userId]` | PATCH | `src/app/api/admin/users/[userId]/route.ts` |
| `/api/admin/users` | GET, POST | `src/app/api/admin/users/route.ts` |
| `/api/auth/[...nextauth]` | GET, POST | `src/app/api/auth/[...nextauth]/route.ts` |
| `/api/notification-preferences` | GET, PATCH | `src/app/api/notification-preferences/route.ts` |
| `/api/notifications/[id]/read` | POST | `src/app/api/notifications/[id]/read/route.ts` |
| `/api/notifications/read-all` | POST | `src/app/api/notifications/read-all/route.ts` |
| `/api/notifications` | GET | `src/app/api/notifications/route.ts` |
| `/api/pos/notification-events` | POST | `src/app/api/pos/notification-events/route.ts` |
| `/api/pos/reporting/restaurant/batch` | POST | `src/app/api/pos/reporting/restaurant/batch/route.ts` |
| `/api/pos/reporting/restaurant/orders` | POST | `src/app/api/pos/reporting/restaurant/orders/route.ts` |
| `/api/pos/reporting/restaurant/shift` | POST | `src/app/api/pos/reporting/restaurant/shift/route.ts` |
| `/api/pos/reporting/retail/shift` | POST | `src/app/api/pos/reporting/retail/shift/route.ts` |
| `/api/pos/reporting/retail/day-end-report` | POST | `src/app/api/pos/reporting/retail/day-end-report/route.ts` |
| `/api/pos/reporting/retail/transaction-journal` | POST | `src/app/api/pos/reporting/retail/transaction-journal/route.ts` |
| `/api/pos/reporting/retail/credit-card-transaction` | POST | `src/app/api/pos/reporting/retail/credit-card-transaction/route.ts` |
| `/api/pos/reporting/retail/monthly-sales-tax` | POST | `src/app/api/pos/reporting/retail/monthly-sales-tax/route.ts` |
| `/api/pos/reporting/retail/invoice` | POST | `src/app/api/pos/reporting/retail/invoice/route.ts` |
| `/api/pos/reporting/retail/no-upc-detail` | POST | `src/app/api/pos/reporting/retail/no-upc-detail/route.ts` |
| `/api/push-subscriptions` | POST, DELETE | `src/app/api/push-subscriptions/route.ts` |
| `/api/reporting/orders` | GET | `src/app/api/reporting/orders/route.ts` |
| `/api/reporting/retail/shift-end` | GET | `src/app/api/reporting/retail/shift-end/route.ts` |
| `/api/reporting/retail/day-end` | GET | `src/app/api/reporting/retail/day-end/route.ts` |
| `/api/reporting/retail/transaction-journal` | GET | `src/app/api/reporting/retail/transaction-journal/route.ts` |
| `/api/reporting/retail/credit-card-transaction` | GET | `src/app/api/reporting/retail/credit-card-transaction/route.ts` |
| `/api/reporting/retail/monthly-sales-tax` | GET | `src/app/api/reporting/retail/monthly-sales-tax/route.ts` |
| `/api/reporting/retail/invoice` | GET | `src/app/api/reporting/retail/invoice/route.ts` |
| `/api/reporting/retail/no-upc-detail` | GET | `src/app/api/reporting/retail/no-upc-detail/route.ts` |
| `/api/reporting/transaction-detail` | GET | `src/app/api/reporting/transaction-detail/route.ts` |
| `/api/store-selection` | POST | `src/app/api/store-selection/route.ts` |
| `/api/stores` | GET | `src/app/api/stores/route.ts` |
