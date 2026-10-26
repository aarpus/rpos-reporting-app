# API documentation

Source: every `src/app/api/**/route.ts` in the working tree. Requests/responses are JSON unless handled by Auth.js. Expected custom failures use `{ "error": "message" }`; uncaught database exceptions in several admin/notification routes use framework error handling, so there is no universal JSON 500 contract. Unsupported verbs are not implemented. No CORS policy is explicitly configured.

## Common authorization and shapes

**Session** means `getRequestUser()` checks a valid session plus active database identity (401 otherwise). **Store** additionally requires active accessible store (403 otherwise). **Admin** adds current database ADMIN role (403 for USER). Store codes in camelCase APIs normalize by trim/uppercase. Reporting query uses `store_code` and resolves its registered schema in a repeatable-read read-only transaction.

| Shape | Fields |
| --- | --- |
| StoreSummary | `storeCode`, `name`, `timezone` |
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
| POST `/api/admin/stores` | `{storeCode,name,timezone}` | 201 `{store: AdminStore}` | 400 parser/provisioning FK/check; 409 uniqueness; 503 missing function/EXECUTE | same |
| PATCH `/api/admin/stores/[storeCode]` | nonempty subset `{name?,timezone?,active?}` | 200 `{store}` | 400 validation; 404 missing store | `src/app/api/admin/stores/[storeCode]/route.ts` |
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

### POST `/api/pos/reporting/orders`

Source `src/app/api/pos/reporting/orders/route.ts`; contract `src/lib/reporting/{pos-auth,snapshot,columns.json,sync}.ts`. Streaming body limit 1,000,000 bytes, strict UTF-8. Registered version must be 1. Errors: 400 malformed body/field/date/value; 401 invalid signature/credential/unprovisioned scope; 403 unavailable scope recheck; 413 size; 409 request/revision/content/ownership/SQL FK or uniqueness conflict; 503 unsupported schema/temporary sync failure.

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

### POST `/api/pos/reporting/batch`

Same POS signature, size limit, and status codes as the order endpoint. Source `src/app/api/pos/reporting/batch/route.ts`. One batch object per request. Upsert key is `batch_code`. Receipts are stored in `sync_master_requests`, separate from order receipts.

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

### POST `/api/pos/reporting/shift`

Same authentication and status codes. Source `src/app/api/pos/reporting/shift/route.ts`. One shift object per request. `batch_code` is required and must already exist on `tbl_rpt_batch` for the signed store. Create the batch before the shift. A missing batch returns 409 `Create the batch before this shift.` Upsert key is `shift_code`.

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

Success: 201 for accepted; 200 duplicate/stale; `{status:"accepted"|"duplicate"|"stale",request_id,source_revision}`. Header Cache-Control=no-store. Retry identical snapshots after temporary failures; changed content needs a new request ID and appropriately higher source revision. See [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md) for the full comparison rules and existing Postman examples in `docs/postman/`.

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
| `/api/pos/reporting/batch` | POST | `src/app/api/pos/reporting/batch/route.ts` |
| `/api/pos/reporting/orders` | POST | `src/app/api/pos/reporting/orders/route.ts` |
| `/api/pos/reporting/shift` | POST | `src/app/api/pos/reporting/shift/route.ts` |
| `/api/push-subscriptions` | POST, DELETE | `src/app/api/push-subscriptions/route.ts` |
| `/api/reporting/orders` | GET | `src/app/api/reporting/orders/route.ts` |
| `/api/reporting/transaction-detail` | GET | `src/app/api/reporting/transaction-detail/route.ts` |
| `/api/store-selection` | POST | `src/app/api/store-selection/route.ts` |
| `/api/stores` | GET | `src/app/api/stores/route.ts` |
