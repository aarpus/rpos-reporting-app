---
name: NoUPC details report
overview: Store each NoUPC sale line in tbl_noupc_detail without a lineid, push it through one route, and print the PDF layout grouped by department with a summed Sub Total under each group.
todos:
  - id: table
    content: Add tbl_noupc_detail to retail 001-tables.sql
    status: completed
  - id: api
    content: Add POST push, GET read, and Postman sample JSON
    status: completed
  - id: screen
    content: Print department groups and summed Sub Total rows, and update handover notes plus the PGlite test
    status: completed
isProject: false
---

# NoUPC details report

The PDF is one table grouped by department. A green bar names the department, the lines follow, and a yellow Sub Total closes the group. There is no grand total. Coils-Pods, Cleaner, Battery, Air Freshner, Charcoal, and Dab are only the sample departments. The next store can have different names, so department stays a column and the screen groups the rows. Do not add one table per department.

Columns are fixed. Qty may be negative (`-1` on a Charcoal line) and the money columns may be negative. Sub Total adds Discount, Subtotal, Tax, and Total Amount in cents. Sold Qty and Retail Price stay blank on that row. Groups are ordered by the newest line in the department, and lines inside a group are newest first. That is the order in the PDF. There is no `retailSyncTables` entry. Existing store schemas are not altered. New stores get the table from [`database/reporting/retail/001-tables.sql`](database/reporting/retail/001-tables.sql).

## `tbl_noupc_detail`

There is no `lineid`. The printed line is the row. A repeat push of the same transaction, product, and time updates that row. `department` is stored on every line and is used only to group the screen. `transaction_no` is the Transaction No column.

```sql
CREATE TABLE __SCHEMA__."tbl_noupc_detail" (
    "id" bigserial PRIMARY KEY NOT NULL,
    "department" varchar(100) NOT NULL,
    "transaction_no" varchar(50) NOT NULL,
    "product_name" varchar(200) NOT NULL,
    "sold_qty" varchar(20) NOT NULL,
    "retail_price" numeric(14,2) NOT NULL DEFAULT 0,
    "discount" numeric(14,2) NOT NULL DEFAULT 0,
    "subtotal" numeric(14,2) NOT NULL DEFAULT 0,
    "tax" numeric(14,2) NOT NULL DEFAULT 0,
    "total_amount" numeric(14,2) NOT NULL DEFAULT 0,
    "member_name" varchar(100) NOT NULL DEFAULT '',
    "station_name" varchar(50) NOT NULL DEFAULT '',
    "transaction_datetime" timestamptz(6) NOT NULL,
    "employee_user" varchar(50) NOT NULL DEFAULT '',
    "created_at" timestamptz(6) NOT NULL DEFAULT now(),
    UNIQUE ("transaction_no", "product_name", "transaction_datetime")
);
CREATE INDEX "tbl_noupc_detail_time_idx"
    ON __SCHEMA__."tbl_noupc_detail" ("transaction_datetime");
```

## Push API and sample

`POST /api/pos/reporting/retail/no-upc-detail`. Same HMAC, `request_id`, and `201 accepted` / `200 duplicate` result as the other retail routes. One object, `{ request_id, no_upc_detail }`, upserted by `transaction_no`, `product_name`, and `transaction_datetime`. `sold_qty` is an exact number string and may be negative. Money is a two-decimal number and may be negative.

```json
{
  "request_id": "example-retail-noupc-1",
  "no_upc_detail": {
    "department": "Coils-Pods",
    "transaction_no": "ACFG76570",
    "product_name": "Coils-Pods-NU @ $ 03.22",
    "sold_qty": "1",
    "retail_price": "3.22",
    "discount": "0.00",
    "subtotal": "3.22",
    "tax": "0.19",
    "total_amount": "3.41",
    "station_name": "W22",
    "transaction_datetime": "2025-07-07T05:07:04Z",
    "employee_user": "111"
  }
}
```

Sample file: `docs/postman/store-reporting-retail-no-upc-detail.postman_data.json`. One Coils-Pods line on 7 Jul 2025, Cleaner one line on 7 Jul 2025, and one Charcoal line with `sold_qty` `-1` and negative money on 28 Apr 2025. Post one object per request.

`GET /api/reporting/retail/no-upc-detail?store_code&from&to` returns `{ storeCode, timezone, rows }`. A row matches when the store-local date of `transaction_datetime` is between `from` and `to`. Amounts are decimal strings. Rows are ordered by `transaction_datetime` descending.

## Screen

Add `/report/no-upc-detail` and open it from the retail sidebar, the retail reports list, and [`report/layout.tsx`](<src/app/(dashboard)/report/layout.tsx>). The page keeps the shared date filter. After search it reads this route.

The print header shows the store code, `NO UPC REPORT`, the printed date and time, and the signed-in user's name as Employee Name. The table columns stay Department, Transaction No, Product Name, Sold Qty, Retail Price, Discount, Subtotal, Tax, Total Amount, Member Name, Station Name, Transaction Date, and Employee User. Transaction Date is the store-local date and time.

Rows are split by `department`. Each group starts with the department name, then its lines, then one Sub Total row. Sub Total sums Discount, Subtotal, Tax, and Total Amount in cents. For the Coils-Pods sample that row is `0.00`, `3.22`, `0.19`, `3.41`. The department bar uses the success background and Sub Total uses the warning background. Export prints the visible groups. The empty copy does not mention a preview month.

Add `tbl_noupc_detail` to the retail SQL fingerprint in [`retail-columns.ts`](src/lib/reporting/retail-columns.ts) and [`ddl.ts`](src/lib/reporting/ddl.ts). Update the retail handover notes for this table and the two routes. Extend the retail PGlite test with an upsert, a duplicate, a date filter, the negative quantity, and the Coils-Pods subtotal.
