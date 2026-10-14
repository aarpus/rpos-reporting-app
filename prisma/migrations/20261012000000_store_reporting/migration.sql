-- Keep legacy customer tables/schemas intact for a non-destructive cutover.
DROP TRIGGER IF EXISTS stores_reporting_membership ON public.stores;
DROP FUNCTION IF EXISTS public.register_reporting_store();

CREATE TABLE public.store_reporting_schemas (
  store_code varchar(64) PRIMARY KEY REFERENCES public.stores(store_code) ON UPDATE RESTRICT ON DELETE RESTRICT,
  schema_name varchar(63) NOT NULL UNIQUE CHECK (schema_name ~ '^store_[a-z0-9_]{1,48}$'),
  reporting_version integer NOT NULL DEFAULT 0,
  created_at timestamptz(6) NOT NULL DEFAULT now()
);

-- Invoker privileges: only the trusted backend/provisioning role may execute DDL.
CREATE FUNCTION public.provision_store_reporting(p_store_code text) RETURNS text
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $function$
DECLARE
  target_schema text;
  registered_schema text;
  registered_version integer;
  legacy_schema text;
  legacy_version integer;
  target_table text;
  column_list text;
  id_column text;
  ddl text := $tables$
CREATE TABLE __SCHEMA__.reporting_stores (
    store_code varchar(64) PRIMARY KEY CHECK (store_code = __STORE_CODE__),
    FOREIGN KEY (store_code) REFERENCES public.stores(store_code) ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE TABLE __SCHEMA__.tbl_rpt_order (
    report_id bigserial PRIMARY KEY,
    order_id bigint,
    order_code varchar(50) NOT NULL,
    order_number varchar(100),
    checkid varchar(20),
    store_code varchar(64) NOT NULL,
    station_code varchar(50),
    shift_code varchar(50),
    batch_code varchar(50),
    order_type varchar(50),
    order_status varchar(50),
    customer_code varchar(40),
    customer_name varchar(200),
    subtotal numeric(18,2) NOT NULL DEFAULT 0,
    tax numeric(18,2) NOT NULL DEFAULT 0,
    discount numeric(18,2) NOT NULL DEFAULT 0,
    fees numeric(18,2) NOT NULL DEFAULT 0,
    surcharge numeric(18,2) NOT NULL DEFAULT 0,
    tip_amount numeric(18,2) NOT NULL DEFAULT 0,
    gratuity numeric(18,2) NOT NULL DEFAULT 0,
    total numeric(18,2) NOT NULL DEFAULT 0,
    paid_amount numeric(18,2) NOT NULL DEFAULT 0,
    balance_amount numeric(18,2) NOT NULL DEFAULT 0,
    payment_method varchar(50),
    payment_status varchar(50),
    is_void boolean NOT NULL DEFAULT false,
    is_return boolean NOT NULL DEFAULT false,
    is_tax_exempt boolean NOT NULL DEFAULT false,
    is_split boolean NOT NULL DEFAULT false,
    order_fees jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by bigint,
    created_by_code varchar(30),
    business_date date NOT NULL,
    created_at timestamptz(6) NOT NULL,
    completed_at timestamptz(6),
    rpt_created_on timestamptz(6) NOT NULL DEFAULT now(),
    rpt_updated_on timestamptz(6) NOT NULL DEFAULT now(),
    source_revision bigint NOT NULL CHECK (source_revision > 0),
    snapshot_hash varchar(64) NOT NULL,
    UNIQUE (store_code, order_code),
    FOREIGN KEY (store_code) REFERENCES __SCHEMA__.reporting_stores(store_code) ON DELETE RESTRICT
);
CREATE INDEX ON __SCHEMA__.tbl_rpt_order(store_code, business_date);

CREATE TABLE __SCHEMA__.tbl_rpt_order_item (
    report_item_id bigserial PRIMARY KEY,
    order_id bigint,
    order_code varchar(50) NOT NULL,
    order_number varchar(100) NOT NULL,
    order_item_id bigint,
    order_item_code varchar(50) NOT NULL,
    business_date date NOT NULL,
    store_code varchar(64) NOT NULL,
    station_code varchar(50),
    shift_code varchar(50),
    batch_code varchar(50),
    department_code varchar(50),
    department_name varchar(200),
    category_code varchar(50),
    category_name varchar(200),
    menu_item_code varchar(100),
    item_name varchar(500),
    quantity numeric(18,2) NOT NULL DEFAULT 0,
    price numeric(18,2) NOT NULL DEFAULT 0,
    subtotal numeric(18,2) NOT NULL DEFAULT 0,
    tax_code varchar(50),
    tax_name varchar(50),
    tax_amt numeric(18,2) NOT NULL DEFAULT 0,
    discount_amt numeric(18,2) NOT NULL DEFAULT 0,
    gift_card_code varchar(50),
    tran_discount_code varchar(50),
    tran_discount_name varchar(50),
    tran_discount numeric(18,2) NOT NULL DEFAULT 0,
    tran_discount_tax numeric(18,2) NOT NULL DEFAULT 0,
    item_discount_code varchar(50),
    item_discount_name varchar(50),
    item_discount numeric(18,2) NOT NULL DEFAULT 0,
    item_discount_tax numeric(18,2) NOT NULL DEFAULT 0,
    comno_header varchar(100),
    combo_group_name varchar(100),
    combo_discount numeric(18,2) NOT NULL DEFAULT 0,
    combo_discount_tax numeric(18,2) NOT NULL DEFAULT 0,
    discount_code varchar(50),
    discount_type varchar(50),
    discount_reason varchar(255),
    discount_approved_by varchar(50),
    cash_price numeric(18,2) NOT NULL DEFAULT 0,
    card_price numeric(18,2) NOT NULL DEFAULT 0,
    is_discounted_row boolean NOT NULL DEFAULT false,
    is_void boolean NOT NULL DEFAULT false,
    void_reason varchar(500),
    is_return boolean NOT NULL DEFAULT false,
    return_quantity numeric(18,2) NOT NULL DEFAULT 0,
    created_at timestamptz(6),
    rpt_created_on timestamptz(6) NOT NULL DEFAULT now(),
    rpt_updated_on timestamptz(6) NOT NULL DEFAULT now(),
    UNIQUE (store_code, order_item_code),
    FOREIGN KEY (store_code) REFERENCES __SCHEMA__.reporting_stores(store_code) ON DELETE RESTRICT,
    FOREIGN KEY (store_code, order_code) REFERENCES __SCHEMA__.tbl_rpt_order(store_code, order_code) ON DELETE RESTRICT
);
CREATE INDEX ON __SCHEMA__.tbl_rpt_order_item(store_code, business_date);
CREATE INDEX ON __SCHEMA__.tbl_rpt_order_item(store_code, order_code);

CREATE TABLE __SCHEMA__.tbl_rpt_payment (
    report_payment_id bigserial PRIMARY KEY,
    payment_id bigint,
    payment_code varchar(50) NOT NULL,
    order_code varchar(50) NOT NULL,
    split_code varchar(50),
    business_date date NOT NULL,
    store_code varchar(64) NOT NULL,
    station_code varchar(50),
    shift_code varchar(50),
    batch_code varchar(50),
    tender_code varchar(50),
    tender_name varchar(50),
    payment_amount numeric(18,2) NOT NULL DEFAULT 0,
    round_off_amt numeric(18,2) NOT NULL DEFAULT 0,
    tip_amount numeric(18,2) NOT NULL DEFAULT 0,
    fees numeric(18,2) NOT NULL DEFAULT 0,
    surcharge numeric(18,2) NOT NULL DEFAULT 0,
    total_amount numeric(18,2) NOT NULL DEFAULT 0,
    payable_amount numeric(18,2) NOT NULL DEFAULT 0,
    change_amount numeric(18,2) NOT NULL DEFAULT 0,
    payment_split_no integer DEFAULT 1,
    payment_status varchar(50),
    gift_card_no varchar(50),
    card_type varchar(50),
    issuer varchar(150),
    mask_pan varchar(150),
    tran_type varchar(50),
    entry_mode varchar(50),
    is_void boolean NOT NULL DEFAULT false,
    is_capture boolean NOT NULL DEFAULT false,
    split_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_on timestamptz(6),
    rpt_created_on timestamptz(6) NOT NULL DEFAULT now(),
    rpt_updated_on timestamptz(6) NOT NULL DEFAULT now(),
    UNIQUE (store_code, payment_code),
    FOREIGN KEY (store_code) REFERENCES __SCHEMA__.reporting_stores(store_code) ON DELETE RESTRICT,
    FOREIGN KEY (store_code, order_code) REFERENCES __SCHEMA__.tbl_rpt_order(store_code, order_code) ON DELETE RESTRICT,
    UNIQUE (store_code, order_code, payment_code)
);
CREATE INDEX ON __SCHEMA__.tbl_rpt_payment(store_code, business_date);
CREATE INDEX ON __SCHEMA__.tbl_rpt_payment(store_code, order_code);

CREATE TABLE __SCHEMA__.tbl_rpt_card_payment (
    report_card_id bigserial PRIMARY KEY,
    card_payment_id bigint,
    card_payment_code varchar(50) NOT NULL,
    payment_code varchar(50) NOT NULL,
    order_code varchar(50) NOT NULL,
    split_code varchar(50),
    business_date date NOT NULL,
    store_code varchar(64) NOT NULL,
    station_code varchar(50),
    shift_code varchar(50),
    batch_code varchar(50),
    device_type varchar(50),
    device_serial_no varchar(100),
    mid varchar(50),
    tid varchar(50),
    tran_id varchar(100),
    rrn varchar(150),
    stan_id varchar(50),
    auth_code varchar(50),
    tran_type varchar(50),
    entry_mode varchar(50),
    card_type varchar(50),
    issuer varchar(150),
    mask_pan varchar(150),
    sale_amount numeric(18,2) NOT NULL DEFAULT 0,
    tip_amount numeric(18,2) NOT NULL DEFAULT 0,
    surcharge_amount numeric(18,2) NOT NULL DEFAULT 0,
    total_amount numeric(18,2) NOT NULL DEFAULT 0,
    response_code varchar(20),
    response_text text,
    is_void boolean NOT NULL DEFAULT false,
    is_capture boolean NOT NULL DEFAULT false,
    created_on timestamptz(6),
    rpt_created_on timestamptz(6) NOT NULL DEFAULT now(),
    rpt_updated_on timestamptz(6) NOT NULL DEFAULT now(),
    UNIQUE (store_code, card_payment_code),
    FOREIGN KEY (store_code) REFERENCES __SCHEMA__.reporting_stores(store_code) ON DELETE RESTRICT,
    FOREIGN KEY (store_code, order_code) REFERENCES __SCHEMA__.tbl_rpt_order(store_code, order_code) ON DELETE RESTRICT,
    FOREIGN KEY (store_code, order_code, payment_code) REFERENCES __SCHEMA__.tbl_rpt_payment(store_code, order_code, payment_code) ON DELETE RESTRICT
);
CREATE INDEX ON __SCHEMA__.tbl_rpt_card_payment(store_code, business_date);
CREATE INDEX ON __SCHEMA__.tbl_rpt_card_payment(store_code, order_code);

CREATE TABLE __SCHEMA__.sync_requests (
    store_code varchar(64) NOT NULL REFERENCES __SCHEMA__.reporting_stores(store_code),
    request_id varchar(160) NOT NULL,
    order_code varchar(50) NOT NULL,
    source_revision bigint NOT NULL,
    snapshot_hash varchar(64) NOT NULL,
    result varchar(20) NOT NULL CHECK (result IN ('accepted', 'duplicate', 'stale')),
    received_at timestamptz(6) NOT NULL DEFAULT now(),
    PRIMARY KEY (store_code, request_id)
);
CREATE INDEX ON __SCHEMA__.sync_requests(store_code, received_at DESC);
$tables$;
BEGIN
  PERFORM 1 FROM public.stores WHERE store_code = p_store_code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Store not found' USING ERRCODE = '23503'; END IF;
  SELECT schema_name, reporting_version INTO registered_schema, registered_version
    FROM public.store_reporting_schemas WHERE store_code = p_store_code;
  IF registered_schema IS NOT NULL THEN
    IF registered_version <> 1 THEN RAISE EXCEPTION 'Unsupported store reporting schema version' USING ERRCODE = '23514'; END IF;
    RETURN registered_schema;
  END IF;
  target_schema := 'store_' || md5(p_store_code);
  EXECUTE format('CREATE SCHEMA %I', target_schema);
  EXECUTE replace(replace(ddl, '__SCHEMA__', quote_ident(target_schema)), '__STORE_CODE__', quote_literal(p_store_code));
  EXECUTE format('INSERT INTO %I.reporting_stores (store_code) VALUES ($1)', target_schema) USING p_store_code;

  -- Optional compatibility import from the former customer schema. Preserve
  -- report IDs, revisions, timestamps and receipts; filter EVERY table by store.
  SELECT c.schema_name, c.reporting_version INTO legacy_schema, legacy_version
    FROM public.stores s JOIN public.customers c ON c.id = s.customer_id
    WHERE s.store_code = p_store_code;
  IF legacy_schema IS NOT NULL AND legacy_version <> 0 THEN
    IF legacy_version <> 1 OR legacy_schema !~ '^customer_[a-z0-9_]{1,48}$' THEN
      RAISE EXCEPTION 'Unsupported legacy reporting schema' USING ERRCODE = '23514';
    END IF;
    FOREACH target_table IN ARRAY ARRAY['tbl_rpt_order', 'tbl_rpt_order_item', 'tbl_rpt_payment', 'tbl_rpt_card_payment', 'sync_requests'] LOOP
      SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO column_list
        FROM information_schema.columns WHERE table_schema = target_schema AND information_schema.columns.table_name = target_table;
      EXECUTE format('INSERT INTO %I.%I (%s) SELECT %s FROM %I.%I WHERE store_code = $1', target_schema, target_table, column_list, column_list, legacy_schema, target_table) USING p_store_code;
      id_column := CASE target_table WHEN 'tbl_rpt_order' THEN 'report_id' WHEN 'tbl_rpt_order_item' THEN 'report_item_id' WHEN 'tbl_rpt_payment' THEN 'report_payment_id' WHEN 'tbl_rpt_card_payment' THEN 'report_card_id' ELSE NULL END;
      IF id_column IS NOT NULL THEN
        EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE((SELECT max(%I) FROM %I.%I), 1), EXISTS(SELECT 1 FROM %I.%I))', format('%I.%I', target_schema, target_table), id_column, id_column, target_schema, target_table, target_schema, target_table);
      END IF;
    END LOOP;
  END IF;
  INSERT INTO public.store_reporting_schemas (store_code, schema_name, reporting_version) VALUES (p_store_code, target_schema, 1);
  RETURN target_schema;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.provision_store_reporting(text) FROM PUBLIC;
