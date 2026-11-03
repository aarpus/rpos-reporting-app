---
name: Monthly sales tax
overview: Store the monthly sales and tax grid as one month row with jsonb headers and cells, push that grid through one route, and print those headers and cells with a Total row summed on the screen.
todos:
  - id: table
    content: Add tbl_monthly_sales_tax with jsonb columns and rows to retail 001-tables.sql
    status: completed
  - id: api
    content: Add POST push, GET read, and Postman sample JSON
    status: completed
  - id: screen
    content: Print the stored headers and cells, append a Total row summed in cents, and update handover notes plus the PGlite test
    status: completed
isProject: false
---

# Monthly sales and tax

Tax and tender names are not fixed. Sales Tax, Lequer Tax, CGST, and Norfolk are only the July preview. The next store can have different names, and No Tax has a taxable column with no tax-amount column. Do not add a SQL column per header.

Store the printed grid. `columns` is the ordered header list. `rows` is the body, and each row's `cells` lines up with `columns`. The first header is `Date`. The first cell is the row label (`07/01/2025` or `GiftCard`). Money cells are exact decimal strings and may be negative. `emphasize` marks GiftCard. The POS does not send a Total row, and the parser rejects a row whose first cell is `Total`. The screen adds one Total row after the stored rows. Each money column is the sum of that column in cents. The Date cell is `Total`. There is no `retailSyncTables` entry, because the grid is jsonb. Existing store schemas are not altered. New stores get the table from [`database/reporting/retail/001-tables.sql`](database/reporting/retail/001-tables.sql).

## `tbl_monthly_sales_tax`

`report_month` is the first day of the month and the POS upsert key.

```sql
CREATE TABLE __SCHEMA__."tbl_monthly_sales_tax" (
    "id" bigserial PRIMARY KEY NOT NULL,
    "report_month" date NOT NULL,
    "employee_name" varchar(100) NOT NULL DEFAULT '',
    "columns" jsonb NOT NULL,
    "rows" jsonb NOT NULL,
    "created_at" timestamptz(6) NOT NULL DEFAULT now(),
    UNIQUE ("report_month"),
    CHECK (jsonb_typeof("columns") = 'array'),
    CHECK (jsonb_typeof("rows") = 'array')
);
```

## Push API and sample

`POST /api/pos/reporting/retail/monthly-sales-tax`. Same HMAC, `request_id`, and `201 accepted` / `200 duplicate` result as the credit-card route. One object, `{ request_id, monthly_sales_tax }`, upserted by `report_month`. The parser rejects a column list that is empty, a first header other than `Date`, a row whose cell count differs from the header count, a row whose first cell is `Total`, and a money cell that is not a two-decimal string.

```json
{
  "request_id": "example-retail-month-tax-2025-07",
  "monthly_sales_tax": {
    "report_month": "2025-07",
    "employee_name": "Acute User",
    "columns": [
      "Date",
      "Total Sales",
      "Net Sales",
      "Cash",
      "Sales Tax TaxableAmt",
      "Sales Tax TaxAmt"
    ],
    "rows": [
      {
        "cells": ["07/01/2025", "148.25", "139.86", "0.00", "139.86", "8.39"],
        "emphasize": false
      },
      {
        "cells": ["GiftCard", "42.38", "42.38", "0.00", "0.00", "0.00"],
        "emphasize": true
      }
    ]
  }
}
```

Sample file: `docs/postman/store-reporting-retail-monthly-sales-tax.postman_data.json`. One July 2025 object. Post one object per request.

`GET /api/reporting/retail/monthly-sales-tax?store_code&month` returns `{ storeCode, timezone, reportMonth, employeeName, columns, rows }` for that month, or an empty grid when the month has no row. `month` is `YYYY-MM`.

## Screen

[`retail-monthly-sales-tax-report.tsx`](<src/app/(dashboard)/report/monthly-sales-tax/_components/retail-monthly-sales-tax-report.tsx>) keeps the year and month filter. After search it reads this route. Headers come from `columns`. Body cells come from `rows`. After those rows the screen appends one bold Total row. Its Date cell is `Total`. Each later cell is the sum of that column across the stored rows, added in cents from the decimal strings. For the sample, that row is `Total`, `190.63`, `182.24`, `0.00`, `139.86`, `8.39`. The first column stays left-aligned and the rest stay right-aligned. `emphasize` keeps GiftCard bold. The empty copy no longer mentions the July 2025 preview. Export still prints the visible grid, including the Total row.

Add `tbl_monthly_sales_tax` to the retail SQL fingerprint in [`retail-columns.ts`](src/lib/reporting/retail-columns.ts) and [`ddl.ts`](src/lib/reporting/ddl.ts). Update the retail handover notes for this table and the two routes. Extend the retail PGlite test with an upsert, a duplicate, a rejected Total row, a changed column list, and a month read that returns only that month. The read does not include a stored Total row. The sample sums to `190.63`, `182.24`, `0.00`, `139.86`, `8.39`.
