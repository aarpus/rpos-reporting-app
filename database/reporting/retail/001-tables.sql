CREATE TABLE __SCHEMA__."tbl_shift_end_report" (
    "id" bigserial PRIMARY KEY NOT NULL,
    "shiftid" bigint NOT NULL,
    "stationname" varchar(100) NOT NULL,
    "batch_number" bigint NOT NULL,
    "shift" integer NOT NULL,
    "start_time" timestamptz(6) NOT NULL,
    "end_time" timestamptz(6),
    "status" varchar(10) NOT NULL,
    "employeename" varchar(100),
    "employeeid" integer,
    "totaltime" varchar(20),
    "sale" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "taxes" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "sale_breakdown" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "terminalcashstatus" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "miscellaneous" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "terminalcashtransfer" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "created_at" timestamptz(6) NOT NULL DEFAULT now(),
    UNIQUE ("shiftid"),
    CHECK ("status" IN ('Open', 'Close'))
);
CREATE INDEX "tbl_shift_end_report_times_idx" ON __SCHEMA__."tbl_shift_end_report" ("start_time", "end_time");

CREATE TABLE __SCHEMA__."tbl_day_end_report" (
    "id" bigserial PRIMARY KEY NOT NULL,
    "batchid" bigint NOT NULL,
    "batch_number" integer NOT NULL,
    "start_date_time" timestamptz(6) NOT NULL,
    "end_date_time" timestamptz(6),
    "status" varchar(10) NOT NULL,
    "employeename" varchar(100),
    "department_sales" jsonb NOT NULL DEFAULT '{"rows":[],"total":null}'::jsonb,
    "sales_summary" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "cash_status" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "sales_breakdown" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "paid_out" jsonb NOT NULL DEFAULT '{"rows":[],"total":""}'::jsonb,
    "paid_in" jsonb NOT NULL DEFAULT '{"rows":[],"total":""}'::jsonb,
    "tax_detail" jsonb NOT NULL DEFAULT '{"rows":[],"total":null}'::jsonb,
    "cash_acceptor" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "employee_status" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "miscellaneous" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "promotion_summary" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "created_at" timestamptz(6) NOT NULL DEFAULT now(),
    UNIQUE ("batchid"),
    CHECK ("status" IN ('Open', 'Close'))
);
CREATE INDEX "tbl_day_end_report_times_idx" ON __SCHEMA__."tbl_day_end_report" ("start_date_time", "end_date_time");

CREATE TABLE __SCHEMA__."tbl_transaction_journal_report" (
    "id" bigserial PRIMARY KEY NOT NULL,
    "transactionid" bigint NOT NULL,
    "transaction_date_time" timestamptz(6) NOT NULL,
    "stationname" varchar(100) NOT NULL,
    "transaction_number" varchar(50) NOT NULL,
    "qty" varchar(40) NOT NULL,
    "discount" varchar(40) NOT NULL,
    "sub_total" varchar(40) NOT NULL,
    "tax" varchar(40) NOT NULL,
    "deposit" varchar(40) NOT NULL,
    "total" varchar(40) NOT NULL,
    "paid_by" varchar(50),
    "cashier" varchar(100),
    "lines" jsonb NOT NULL DEFAULT '{"rows":[],"total":null}'::jsonb,
    "credit_card" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "paid_by_amounts" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "created_at" timestamptz(6) NOT NULL DEFAULT now(),
    UNIQUE ("transactionid")
);
CREATE INDEX "tbl_transaction_journal_report_time_idx" ON __SCHEMA__."tbl_transaction_journal_report" ("transaction_date_time");

CREATE TABLE __SCHEMA__."tbl_creditcard_detail" (
    "id" bigserial PRIMARY KEY NOT NULL,
    "transactionid" bigint NOT NULL,
    "card_datetime" timestamptz(6) NOT NULL,
    "card_name" varchar(30) NOT NULL DEFAULT '',
    "card_no" varchar(20) NOT NULL DEFAULT '',
    "cust_name" varchar(100),
    "result" varchar(30),
    "amount" numeric(14,2) NOT NULL DEFAULT 0,
    "exp_date" varchar(10),
    "auth_code" varchar(30) NOT NULL DEFAULT '',
    "name_on_card" varchar(100),
    "station_name" varchar(50) NOT NULL DEFAULT '',
    "tender" varchar(10) NOT NULL,
    "transaction_type" varchar(50),
    "created_at" timestamptz(6) NOT NULL DEFAULT now(),
    UNIQUE ("transactionid"),
    CHECK ("tender" IN ('credit', 'debit', 'external')),
    CHECK (("tender" = 'external') = ("transaction_type" IS NOT NULL))
);
CREATE INDEX "tbl_creditcard_detail_time_idx" ON __SCHEMA__."tbl_creditcard_detail" ("card_datetime");

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
