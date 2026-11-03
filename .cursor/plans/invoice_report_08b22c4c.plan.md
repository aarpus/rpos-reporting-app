---
name: Invoice report
overview: Store each supplier invoice as one row in tbl_invoice_report, push that row through one route, and load the list, view, profit, cost, quantity, and log screens from it.
todos:
  - id: table
    content: Add tbl_invoice_report to retail 001-tables.sql
    status: completed
  - id: api
    content: Add POST push, GET list and detail, and Postman sample JSON
    status: completed
  - id: screens
    content: Load the invoice list, view, profit, cost, quantity, and log from the stored invoice, and update handover notes plus the PGlite test
    status: completed
isProject: false
---

# Invoice report

The list, view, profit margin, cost variance, quantity variance, and log are one invoice. Store that invoice as one row, the same way a day-end batch stores its sections. Do not add a SQL column per product line, and do not add a second table per screen.

List columns are fixed, so they are real columns and the date, amount, type, supplier, and supplier-invoice filters run in SQL. The four line tables and the log are jsonb because each invoice has a different number of rows. Line money stays an exact string: cost variance uses three and four decimal places, and quantity stays text such as `1U`. Header money is `numeric(14,2)` and may be negative. `total` is the list Total and the view Total Amount. Profit footer strings are stored and printed as sent, including `$` and `%`. There is no `retailSyncTables` entry. Existing store schemas are not altered. New stores get the table from [`database/reporting/retail/001-tables.sql`](database/reporting/retail/001-tables.sql).

## `tbl_invoice_report`

`invoiceid` plus `invoice_type` is the POS upsert key and the URL id. `invoice_no` is the Invoice No shown on the detail screens and is not the upsert key.

```sql
CREATE TABLE __SCHEMA__."tbl_invoice_report" (
    "id" bigserial PRIMARY KEY NOT NULL,
    "invoiceid" bigint NOT NULL,
    "invoice_type" varchar(2) NOT NULL,
    "invoice_datetime" timestamptz(6) NOT NULL,
    "delivery_datetime" timestamptz(6) NOT NULL,
    "invoice_no" varchar(50) NOT NULL,
    "supplier_name" varchar(100) NOT NULL,
    "supplier_invoice_no" varchar(50) NOT NULL,
    "status" varchar(10) NOT NULL,
    "employee_name" varchar(100) NOT NULL DEFAULT '',
    "discount" numeric(14,2) NOT NULL DEFAULT 0,
    "shipping" numeric(14,2) NOT NULL DEFAULT 0,
    "tax" numeric(14,2) NOT NULL DEFAULT 0,
    "deposit" numeric(14,2) NOT NULL DEFAULT 0,
    "total" numeric(14,2) NOT NULL DEFAULT 0,
    "lines" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "profit_lines" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "profit_totals" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "cost_lines" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "qty_lines" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "log" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "created_at" timestamptz(6) NOT NULL DEFAULT now(),
    UNIQUE ("invoiceid", "invoice_type"),
    CHECK ("invoice_type" IN ('RC', 'OP')),
    CHECK ("status" IN ('Unpaid', 'Paid', 'OP'))
);
CREATE INDEX "tbl_invoice_report_time_idx"
    ON __SCHEMA__."tbl_invoice_report" ("invoice_datetime");
```

## Push API and sample

`POST /api/pos/reporting/retail/invoice`. Same HMAC, `request_id`, and `201 accepted` / `200 duplicate` result as the other retail routes. One object, `{ request_id, invoice }`, upserted by `invoiceid` and `invoice_type`. A line array has at most 200 rows. Each line has only the keys that screen shows.

```json
{
  "request_id": "example-retail-invoice-2",
  "invoice": {
    "invoiceid": "2",
    "invoice_type": "OP",
    "invoice_datetime": "2025-07-02T10:15:00Z",
    "delivery_datetime": "2025-07-02T10:15:00Z",
    "invoice_no": "123",
    "supplier_name": "Tobbaco",
    "supplier_invoice_no": "TB-900221",
    "status": "Unpaid",
    "employee_name": "Acute User",
    "discount": "5.00",
    "shipping": "0.00",
    "tax": "8.10",
    "deposit": "0.00",
    "total": "143.00",
    "lines": [
      {
        "product_item_no": "5947",
        "product_name": "Salt Nic E-Juice",
        "supplier_item_no": "5947",
        "qty": "1U",
        "case_cost": "10.00",
        "total": "10.00"
      }
    ],
    "profit_lines": [
      {
        "product_no": "5947",
        "product_name": "Salt Nic E-Juice",
        "supplier_item_no": "5947",
        "inv_qty": "1U",
        "cost": "10.00",
        "unit_cost": "10.00",
        "ext_cost": "10.00",
        "unit_retail": "19.99",
        "case_retail": "19.99",
        "ext_retail": "19.99",
        "profit_amount": "9.99",
        "profit_percent": "49.97"
      }
    ],
    "profit_totals": {
      "ext_cost": "$10.00",
      "ext_retail": "$19.99",
      "profit_amount": "$9.99",
      "profit_percent": "49.97%"
    },
    "cost_lines": [
      {
        "product_item_no": "5947",
        "product_name": "Salt Nic E-Juice",
        "supplier_item_no": "5947",
        "new_cost": "9.995",
        "previous_cost": "10.00",
        "difference_amount": "-0.01",
        "difference_percent": "-0.05",
        "average_cost": "9.9975",
        "retail_price": "19.99"
      }
    ],
    "qty_lines": [
      {
        "product_item_no": "5947",
        "product_name": "Salt Nic E-Juice",
        "supplier_item_no": "5947",
        "ordered_qty": "0U",
        "received_qty": "1U",
        "difference": "-1U",
        "stock_in_hand": "1U"
      }
    ],
    "log": [
      {
        "date": "2025-07-02 10:15:00",
        "log": "[Final Invoice] InvoiceNo: TB-900221"
      }
    ]
  }
}
```

Sample file: `docs/postman/store-reporting-retail-invoice.postman_data.json`. One `OP` invoice on 2 Jul 2025 and one `RC` invoice on 4 Jul 2025. Post one object per request.

`GET /api/reporting/retail/invoice?store_code&from&to` returns `{ storeCode, timezone, suppliers, rows }`. A row matches when the store-local date of `invoice_datetime` is between `from` and `to`. Optional `amount_from`, `amount_to`, `invoice_type` (`RC` or `OP`), exact `supplier_name`, and a case-insensitive `supplier_invoice_no` substring narrow that list. Header amounts are decimal strings. `suppliers` is the distinct supplier names in the date match, before the supplier filter. List rows do not include the line arrays.

`GET /api/reporting/retail/invoice?store_code&id&type` returns `{ storeCode, timezone, invoice }` for view, profit, cost, quantity, and log. Missing id is 404.

## Screens

- [`retail-invoice-list.tsx`](<src/app/(dashboard)/report/invoice-report/_components/retail-invoice-list.tsx>) keeps the current filters and action links. Search reads the list route. The supplier dropdown is All plus `suppliers` from that response. The Date/Time cell is the store-local timestamp. The empty copy no longer mentions the July 2025 preview.
- View, profit margin, cost variance, and quantity variance read the detail route for the URL `id` and `type`. Headers and line columns stay as they are. Profit prints `profit_totals`. The row number is the line index plus one.
- The log dialog reads the same detail route when it opens and shows `log`.
- Detail dates are formatted in the store timezone. View keeps `YYYY-MM-DD HH:mm:ss`. Profit, cost, and quantity keep the long date with the weekday.

Add `tbl_invoice_report` to the retail SQL fingerprint in [`retail-columns.ts`](src/lib/reporting/retail-columns.ts) and [`ddl.ts`](src/lib/reporting/ddl.ts). Update the retail handover notes for this table and the two routes. Extend the retail PGlite test with an upsert, a duplicate, a date and type filter, and a detail read that returns the stored lines and log.
