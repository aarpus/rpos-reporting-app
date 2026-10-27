-- Store type chooses which reporting SQL file is applied at store creation.
-- Existing stores are restaurant. The provision function executes DDL supplied
-- by the application from that file. reporting_version stays 1.

DO $$ BEGIN
  CREATE TYPE "StoreType" AS ENUM ('RESTAURANT', 'RETAIL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS store_type "StoreType" NOT NULL DEFAULT 'RESTAURANT';

DROP FUNCTION IF EXISTS public.provision_store_reporting(text);

CREATE OR REPLACE FUNCTION public.provision_store_reporting(p_store_code text, p_ddl text) RETURNS text
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $function$
DECLARE
  target_schema text;
  registered_schema text;
  registered_version integer;
  legacy_schema text;
  legacy_version integer;
  selected_type text;
  target_table text;
  column_list text;
  id_column text;
BEGIN
  IF p_ddl IS NULL OR btrim(p_ddl) = '' OR position('__SCHEMA__' IN p_ddl) = 0 OR p_ddl !~* 'CREATE[[:space:]]+TABLE' THEN
    RAISE EXCEPTION 'Reporting table SQL is required' USING ERRCODE = '23514';
  END IF;
  SELECT store_type::text INTO selected_type
    FROM public.stores WHERE store_code = p_store_code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Store not found' USING ERRCODE = '23503'; END IF;
  IF selected_type NOT IN ('RESTAURANT', 'RETAIL') THEN
    RAISE EXCEPTION 'Unsupported store type' USING ERRCODE = '23514';
  END IF;
  SELECT schema_name, reporting_version INTO registered_schema, registered_version
    FROM public.store_reporting_schemas WHERE store_code = p_store_code;
  IF registered_schema IS NOT NULL THEN
    IF registered_version <> 1 THEN RAISE EXCEPTION 'Unsupported store reporting schema version' USING ERRCODE = '23514'; END IF;
    RETURN registered_schema;
  END IF;
  target_schema := 'store_' || regexp_replace(lower(p_store_code), '[^a-z0-9_]', '_', 'g');
  IF target_schema !~ '^store_[a-z0-9_]{1,57}$' THEN
    RAISE EXCEPTION 'Store code must produce a schema suffix of 1 to 57 characters' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = target_schema) THEN
    RAISE EXCEPTION 'A reporting schema for this store code already exists' USING ERRCODE = '23505';
  END IF;
  EXECUTE format('CREATE SCHEMA %I', target_schema);
  EXECUTE replace(replace(p_ddl, '__SCHEMA__', quote_ident(target_schema)), '__STORE_CODE__', quote_literal(p_store_code));

  IF selected_type = 'RESTAURANT' THEN
    EXECUTE format('INSERT INTO %I.reporting_stores (store_code) VALUES ($1)', target_schema) USING p_store_code;

    -- Optional compatibility import from the former customer schema. Preserve
    -- report IDs, revisions, timestamps and receipts; filter EVERY table by store.
    -- Copy only columns present in both schemas so newer report columns keep defaults.
    SELECT c.schema_name, c.reporting_version INTO legacy_schema, legacy_version
      FROM public.stores s JOIN public.customers c ON c.id = s.customer_id
      WHERE s.store_code = p_store_code;
    IF legacy_schema IS NOT NULL AND legacy_version <> 0 THEN
      IF legacy_version <> 1 OR legacy_schema !~ '^customer_[a-z0-9_]{1,48}$' THEN
        RAISE EXCEPTION 'Unsupported legacy reporting schema' USING ERRCODE = '23514';
      END IF;
      FOREACH target_table IN ARRAY ARRAY['tbl_rpt_order', 'tbl_rpt_order_item', 'tbl_rpt_payment', 'tbl_rpt_card_payment', 'sync_requests'] LOOP
        SELECT string_agg(quote_ident(new_columns.column_name), ', ' ORDER BY new_columns.ordinal_position) INTO column_list
          FROM information_schema.columns AS new_columns
          JOIN information_schema.columns AS legacy_columns
            ON legacy_columns.column_name = new_columns.column_name
           AND legacy_columns.table_schema = legacy_schema
           AND legacy_columns.table_name = new_columns.table_name
          WHERE new_columns.table_schema = target_schema
            AND new_columns.table_name = target_table;
        EXECUTE format('INSERT INTO %I.%I (%s) SELECT %s FROM %I.%I WHERE store_code = $1', target_schema, target_table, column_list, column_list, legacy_schema, target_table) USING p_store_code;
        id_column := CASE target_table WHEN 'tbl_rpt_order' THEN 'report_id' WHEN 'tbl_rpt_order_item' THEN 'report_item_id' WHEN 'tbl_rpt_payment' THEN 'report_payment_id' WHEN 'tbl_rpt_card_payment' THEN 'report_card_id' ELSE NULL END;
        IF id_column IS NOT NULL THEN
          EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE((SELECT max(%I) FROM %I.%I), 1), EXISTS(SELECT 1 FROM %I.%I))', format('%I.%I', target_schema, target_table), id_column, id_column, target_schema, target_table, target_schema, target_table);
        END IF;
      END LOOP;
    END IF;
  END IF;

  INSERT INTO public.store_reporting_schemas (store_code, schema_name, reporting_version) VALUES (p_store_code, target_schema, 1);
  RETURN target_schema;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.provision_store_reporting(text, text) FROM PUBLIC;
