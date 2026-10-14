CREATE TABLE public.customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  schema_name VARCHAR(63) NOT NULL UNIQUE
    CHECK (schema_name ~ '^customer_[a-z0-9_]{1,48}$'),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  reporting_version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

-- Existing locations must be explicitly assigned; do not guess ownership.
ALTER TABLE public.stores ADD COLUMN customer_id INTEGER REFERENCES public.customers(id) ON DELETE RESTRICT;
ALTER TABLE public.stores ADD CONSTRAINT stores_customer_code_unique UNIQUE (customer_id, store_code);
CREATE INDEX ON public.stores(customer_id);

CREATE FUNCTION public.register_reporting_store() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE customer_schema text; version integer;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.customer_id IS NOT NULL AND NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
    RAISE EXCEPTION 'Store customer ownership is immutable after assignment' USING ERRCODE = '23514';
  END IF;
  IF NEW.customer_id IS NOT NULL THEN
    SELECT schema_name, reporting_version INTO customer_schema, version
      FROM public.customers WHERE id = NEW.customer_id AND active = TRUE;
    IF customer_schema IS NULL OR version < 1 THEN
      RAISE EXCEPTION 'Customer reporting schema is not ready' USING ERRCODE = '23514';
    END IF;
    EXECUTE format('INSERT INTO %I.reporting_stores (store_code, customer_id) VALUES ($1, $2) ON CONFLICT (store_code) DO NOTHING', customer_schema)
      USING NEW.store_code, NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER stores_reporting_membership AFTER INSERT OR UPDATE OF customer_id ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.register_reporting_store();
