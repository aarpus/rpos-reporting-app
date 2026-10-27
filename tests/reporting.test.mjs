import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  parseBatchSnapshot,
  parseShiftSnapshot,
  parseSnapshot,
  snapshotHash,
  schemaIdentifier,
  tables,
} from "../src/lib/reporting/snapshot.ts";
import { syncBatchSnapshot, syncOrderSnapshot, syncShiftSnapshot } from "../src/lib/reporting/sync.ts";
import {
  parseReportFilters,
  readOrderReport,
  resolveReportingScope,
} from "../src/lib/reporting/read.ts";
import { reportingQueryKey } from "../src/lib/reporting/query-key.ts";
import { readLegacySnapshots } from "../src/lib/reporting/legacy-import.ts";
import { reportingInstallationSql } from "../src/lib/reporting/installation.ts";
import {
  createStoreWithReporting,
  StoreReportingSetupError,
} from "../src/lib/reporting/store-creation.ts";

const restaurantDdlUrl = new URL("../database/reporting/restaurant/001-tables.sql", import.meta.url);
const storeTypeMigrationUrl = new URL("../prisma/migrations/20261026000000_store_type/migration.sql", import.meta.url);

async function provisionRestaurant(db, storeCode) {
  const ddl = await readFile(restaurantDdlUrl, "utf8");
  return db.query("SELECT public.provision_store_reporting($1::text, $2::text) AS schema_name", [storeCode, ddl]);
}

function snapshot(
  store = "DT01",
  revision = "1",
  request = "request-1",
  orderCode = "ORDER-1",
) {
  const common = {
    store_code: store,
    order_code: orderCode,
    business_date: "2026-10-08",
  };
  return {
    request_id: request,
    source_revision: revision,
    order: {
      ...common,
      order_number: "1",
      created_at: "2026-10-09T01:00:00+05:30",
      total: "50.00",
      is_return: false,
    },
    items: [
      {
        ...common,
        order_number: "1",
        order_item_code: `${orderCode}-I1`,
        quantity: "1",
        subtotal: "20.00",
        item_name: "Item one",
      },
      {
        ...common,
        order_number: "1",
        order_item_code: `${orderCode}-I2`,
        quantity: "1",
        subtotal: "30.00",
      },
    ],
    payments: [
      {
        ...common,
        payment_code: `${orderCode}-P1`,
        payment_amount: "20.00",
        split_code: "SPLIT-1",
      },
      {
        ...common,
        payment_code: `${orderCode}-P2`,
        payment_amount: "30.00",
        split_code: "SPLIT-2",
      },
    ],
    card_payments: [
      {
        ...common,
        card_payment_code: `${orderCode}-C1`,
        payment_code: `${orderCode}-P1`,
        total_amount: "20.00",
        response_code: "DECLINED",
      },
      {
        ...common,
        card_payment_code: `${orderCode}-C2`,
        payment_code: `${orderCode}-P1`,
        total_amount: "20.00",
        response_code: "00",
      },
      {
        ...common,
        card_payment_code: `${orderCode}-C3`,
        payment_code: `${orderCode}-P2`,
        total_amount: "30.00",
        response_code: "00",
      },
    ],
  };
}

test("missing SQL provisioning function is repairable without resetting a db-push database", async (t) => {
  const engine = new PGlite();
  const db = {
    query: async (sql, values = []) => {
      const result = await engine.query(sql, values);
      return {
        rows: result.rows,
        rowCount: result.affectedRows || result.rows.length,
      };
    },
  };
  t.after(() => engine.close());
  for (const migration of [
    "20260922000000_init",
    "20260929000000_store_notifications",
    "20261009000000_customer_reporting",
  ]) {
    await engine.exec(
      await readFile(
        new URL(
          `../prisma/migrations/${migration}/migration.sql`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
  }
  // Mimic db push: the model table exists, but custom SQL functions do not.
  await engine.exec(`CREATE TABLE public.store_reporting_schemas (
    store_code varchar(64) PRIMARY KEY REFERENCES public.stores(store_code),
    schema_name varchar(63) NOT NULL UNIQUE, reporting_version integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now());`);
  const input = {
    storeCode: "CREATE-TEST",
    name: "Store creation test",
    timezone: "Asia/Kolkata",
    storeType: "RESTAURANT",
  };
  await assert.rejects(
    createStoreWithReporting(db, input),
    StoreReportingSetupError,
  );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM public.stores WHERE store_code = $1",
        [input.storeCode],
      )
    ).rows[0].n,
    0,
  );
  const migration = await readFile(
    new URL(
      "../prisma/migrations/20261012000000_store_reporting/migration.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await engine.exec(reportingInstallationSql(migration));
  await db.query(
    "INSERT INTO public.stores (store_code, name, timezone, updated_at) VALUES ('LEGACY-TEST', $1, $2, NOW())",
    [input.name, input.timezone],
  );
  const legacySchema = (await db.query("SELECT public.provision_store_reporting('LEGACY-TEST') AS schema_name")).rows[0].schema_name;
  assert.match(legacySchema, /^store_[a-f0-9]{32}$/);
  await engine.exec(await readFile(new URL("../prisma/migrations/20261013000000_store_code_schema_names/migration.sql", import.meta.url), "utf8"));
  await engine.exec(await readFile(new URL("../prisma/migrations/20261014000000_reporting_batch_shift/migration.sql", import.meta.url), "utf8"));
  assert.equal((await db.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'tbl_rpt_order' AND column_name = 'employee_name'", [legacySchema])).rows[0].n, 1);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = $1 AND table_name IN ('tbl_rpt_batch', 'tbl_rpt_shift')", [legacySchema])).rows[0].n, 2);
  assert.equal((await db.query("SELECT public.provision_store_reporting('LEGACY-TEST') AS schema_name")).rows[0].schema_name, legacySchema);
  await engine.exec(await readFile(storeTypeMigrationUrl, "utf8"));
  const created = await createStoreWithReporting(db, input);
  assert.equal(created.store_code, input.storeCode);
  const mapping = (
    await db.query(
      "SELECT schema_name, reporting_version FROM public.store_reporting_schemas WHERE store_code = $1",
      [input.storeCode],
    )
  ).rows[0];
  assert.equal(mapping.reporting_version, 1);
  assert.equal(mapping.schema_name, "store_create_test");
  await assert.rejects(
    createStoreWithReporting(db, { ...input, storeCode: "CREATE_TEST" }),
    (error) => error.code === "23505",
  );
  assert.equal((await db.query("SELECT count(*)::int AS n FROM public.stores WHERE store_code = 'CREATE_TEST'")).rows[0].n, 0);
  const longestCode = "A".repeat(57);
  await createStoreWithReporting(db, { ...input, storeCode: longestCode });
  const longestSchema = (await db.query("SELECT schema_name FROM public.store_reporting_schemas WHERE store_code = $1", [longestCode])).rows[0].schema_name;
  assert.equal(longestSchema, "store_" + longestCode.toLowerCase());
  assert.equal(schemaIdentifier(longestSchema), `"${longestSchema}"`);
  await assert.rejects(
    createStoreWithReporting(db, { ...input, storeCode: "A".repeat(58) }),
    (error) => error.code === "23514",
  );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = $1 AND table_name LIKE 'tbl_rpt_%'",
        [mapping.schema_name],
      )
    ).rows[0].n,
    6,
  );
  await db.query(
    `INSERT INTO ${mapping.schema_name}.tbl_rpt_order (store_code, order_code, business_date, created_at, source_revision, snapshot_hash)
    VALUES ($1, 'KEEP-ORDER', '2026-10-12', now(), 1, $2)`,
    [input.storeCode, "a".repeat(64)],
  );
  await engine.exec(reportingInstallationSql(migration));
  await engine.exec(await readFile(new URL("../prisma/migrations/20261013000000_store_code_schema_names/migration.sql", import.meta.url), "utf8"));
  await engine.exec(await readFile(new URL("../prisma/migrations/20261014000000_reporting_batch_shift/migration.sql", import.meta.url), "utf8"));
  assert.deepEqual(
    (
      await db.query(
        "SELECT schema_name, reporting_version FROM public.store_reporting_schemas WHERE store_code = $1",
        [input.storeCode],
      )
    ).rows[0],
    mapping,
  );
  assert.equal(
    (
      await db.query(
        `SELECT count(*)::int AS n FROM ${mapping.schema_name}.tbl_rpt_order`,
      )
    ).rows[0].n,
    1,
  );
  await assert.rejects(
    createStoreWithReporting(db, input),
    (error) => error.code === "23505",
  );
  const retail = await createStoreWithReporting(db, { ...input, storeCode: "RETAIL1", storeType: "RETAIL" });
  assert.equal(retail.store_type, "RETAIL");
  const retailSchema = (await db.query("SELECT schema_name FROM public.store_reporting_schemas WHERE store_code = 'RETAIL1'")).rows[0].schema_name;
  assert.equal(retailSchema, "store_retail1");
  assert.equal((await db.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = $1", [retailSchema])).rows[0].n, 22);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'tbl_rpt_order'", [retailSchema])).rows[0].n, 0);
});

test("snapshot validation enforces complete arrays, store ownership, relations, and precise values", () => {
  const source = snapshot();
  assert.equal(
    parseSnapshot(source, "DT01").order.created_at,
    "2026-10-08T19:30:00.000Z",
  );
  assert.equal(parseSnapshot(source, "DT01").order.business_date, "2026-10-08");
  assert.throws(() => parseSnapshot(source, "WS01"), /store_code/);
  for (const modify of [
    (x) => delete x.items,
    (x) => x.items.push(x.items[0]),
    (x) => (x.items[0].order_code = "OTHER"),
    (x) => (x.card_payments[0].payment_code = "MISSING"),
    (x) => (x.order.created_at = "2026-10-09T01:00:00"),
    (x) => (x.order.business_date = "2026-02-30"),
    (x) => (x.order.total = "0.001"),
    (x) => (x.order.report_id = 1),
    (x) => (x.customer_schema = "store_ws01"),
    (x) => (x.source_revision = 0),
    (x) => (x.order.order_id = Number.MAX_SAFE_INTEGER + 1),
  ]) {
    const input = structuredClone(source);
    modify(input);
    assert.throws(() => parseSnapshot(input, "DT01"));
  }
  const large = structuredClone(source);
  large.order.total = "9999999999999999.99";
  large.order.order_id = "9223372036854775807";
  assert.equal(parseSnapshot(large, "DT01").order.total, large.order.total);
  const omitted = parseSnapshot(source, "DT01");
  assert.equal(omitted.order.employee_name, null);
  const withBatch = structuredClone(source);
  withBatch.batch = { store_code: "DT01", batch_code: "BATCH-A" };
  assert.throws(() => parseSnapshot(withBatch, "DT01"), /envelope/);
  assert.throws(() => parseShiftSnapshot({ request_id: "s", source_revision: "1", shift: { store_code: "DT01", shift_code: "SHIFT-AM" } }, "DT01"), /batch_code/);
  const batch = parseBatchSnapshot({ request_id: "b", source_revision: "1", batch: { store_code: "DT01", batch_code: "BATCH-A" } }, "DT01");
  assert.equal(batch.batch.batch_code, "BATCH-A");
});

test("customer-to-store cutover preserves each store's data, revisions, receipts and report IDs", async (t) => {
  const engine = new PGlite();
  const db = {
    query: async (sql, values = []) => {
      const result = await engine.query(sql, values);
      return {
        rows: result.rows,
        rowCount: result.affectedRows || result.rows.length,
      };
    },
  };
  t.after(() => engine.close());
  for (const migration of [
    "20260922000000_init",
    "20260929000000_store_notifications",
    "20261009000000_customer_reporting",
  ]) {
    await engine.exec(
      await readFile(
        new URL(
          `../prisma/migrations/${migration}/migration.sql`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
  }
  await engine.exec(
    "INSERT INTO public.customers(name, schema_name) VALUES ('Legacy', 'customer_legacy'); CREATE SCHEMA customer_legacy;",
  );
  const legacySql = await readFile(
    new URL("../database/reporting/legacy-customer-001.sql", import.meta.url),
    "utf8",
  );
  await engine.exec(
    legacySql
      .replaceAll("__SCHEMA__", "customer_legacy")
      .replaceAll("__CUSTOMER_ID__", "1"),
  );
  await engine.exec(
    "UPDATE public.customers SET reporting_version = 1; UPDATE public.stores SET customer_id = 1 WHERE store_code IN ('DT01', 'AP01');",
  );
  for (const store of ["DT01", "AP01"]) {
    const parsed = parseSnapshot(snapshot(store, "9", "legacy-request"), store);
    const hash = snapshotHash(parsed);
    for (const [table, rows] of [
      [
        "tbl_rpt_order",
        [{ ...parsed.order, source_revision: "9", snapshot_hash: hash }],
      ],
      ["tbl_rpt_order_item", parsed.items],
      ["tbl_rpt_payment", parsed.payments],
      ["tbl_rpt_card_payment", parsed.card_payments],
    ]) {
      for (const row of rows) {
        const fields = Object.keys(row);
        const values = fields.map((field) =>
          tables[table].fields.find((entry) => entry.name === field)?.kind ===
          "jsonb"
            ? JSON.stringify(row[field])
            : row[field],
        );
        await db.query(
          `INSERT INTO customer_legacy.${table} (${fields.join(", ")}) VALUES (${fields.map((_, index) => `$${index + 1}`).join(", ")})`,
          values,
        );
      }
    }
    await db.query(
      "INSERT INTO customer_legacy.sync_requests (store_code, request_id, order_code, source_revision, snapshot_hash, result) VALUES ($1, 'legacy-request', 'ORDER-1', 9, $2, 'accepted')",
      [store, hash],
    );
  }
  const oldOrder = (
    await db.query(
      "SELECT report_id, rpt_created_on FROM customer_legacy.tbl_rpt_order WHERE store_code = 'DT01'",
    )
  ).rows[0];
  await engine.exec(
    await readFile(
      new URL(
        "../prisma/migrations/20261012000000_store_reporting/migration.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await engine.exec(await readFile(new URL("../prisma/migrations/20261013000000_store_code_schema_names/migration.sql", import.meta.url), "utf8"));
  await engine.exec(await readFile(new URL("../prisma/migrations/20261014000000_reporting_batch_shift/migration.sql", import.meta.url), "utf8"));
  await engine.exec(await readFile(storeTypeMigrationUrl, "utf8"));
  const dt = (await provisionRestaurant(db, "DT01")).rows[0].schema_name;
  const ap = (await provisionRestaurant(db, "AP01")).rows[0].schema_name;
  assert.notEqual(dt, ap);
  assert.equal(
    (await db.query(`SELECT count(*)::int AS n FROM ${dt}.tbl_rpt_order`))
      .rows[0].n,
    1,
  );
  assert.deepEqual(
    (
      await db.query(
        `SELECT report_id, rpt_created_on FROM ${dt}.tbl_rpt_order`,
      )
    ).rows[0],
    oldOrder,
  );
  assert.equal(
    (await db.query(`SELECT count(*)::int AS n FROM ${dt}.tbl_rpt_order_item`))
      .rows[0].n,
    2,
  );
  assert.equal(
    (await db.query(`SELECT count(*)::int AS n FROM ${dt}.tbl_rpt_payment`))
      .rows[0].n,
    2,
  );
  assert.equal(
    (
      await db.query(
        `SELECT count(*)::int AS n FROM ${dt}.tbl_rpt_card_payment`,
      )
    ).rows[0].n,
    3,
  );
  const scope = { storeCode: "DT01", schemaName: dt };
  assert.equal(
    (
      await syncOrderSnapshot(
        db,
        scope,
        parseSnapshot(snapshot("DT01", "9", "legacy-request"), "DT01"),
      )
    ).status,
    "duplicate",
  );
  assert.equal(
    (
      await provisionRestaurant(db, "DT01")
    ).rows[0].schema_name,
    dt,
  );
  const fresh = parseSnapshot(
    snapshot("DT01", "1", "new-order", "ORDER-NEW"),
    "DT01",
  );
  await syncOrderSnapshot(db, scope, fresh);
  assert.ok(
    (
      await db.query(
        `SELECT report_id FROM ${dt}.tbl_rpt_order WHERE order_code = 'ORDER-NEW'`,
      )
    ).rows[0].report_id > oldOrder.report_id,
  );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM customer_legacy.tbl_rpt_order",
      )
    ).rows[0].n,
    2,
  );
  await db.query("UPDATE public.customers SET active = FALSE WHERE id = 1");
  const adminId = "22222222-2222-2222-2222-222222222222";
  await db.query(
    "INSERT INTO public.auth_users(id, name, email, password_hash, role) VALUES ($1, 'Admin', 'admin@example.test', 'unused', 'ADMIN')",
    [adminId],
  );
  assert.equal(
    (await resolveReportingScope(db, { id: adminId, role: "ADMIN" }, "DT01"))
      .schemaName,
    dt,
  );
});

test("canonical payload identity ignores object order and child order, but detects actual changes", () => {
  const first = parseSnapshot(snapshot(), "DT01");
  const other = snapshot("DT01", "1", "another-request");
  other.items.reverse();
  other.payments.reverse();
  other.order = Object.fromEntries(Object.entries(other.order).reverse());
  assert.equal(snapshotHash(first), snapshotHash(parseSnapshot(other, "DT01")));
  other.order.total = "51.00";
  assert.notEqual(
    snapshotHash(first),
    snapshotHash(parseSnapshot(other, "DT01")),
  );
  assert.throws(() =>
    schemaIdentifier(
      'store_dt01"; DROP SCHEMA public;--',
    ),
  );
});

test("report filter validation and cache keys isolate stores and filters", () => {
  const filters = parseReportFilters(
    new URLSearchParams("from=2026-10-08&to=2026-10-09"),
  );
  assert.equal(filters.limit, 50);
  assert.throws(() =>
    parseReportFilters(new URLSearchParams("from=2026-10-09&to=2026-10-08")),
  );
  assert.throws(() =>
    parseReportFilters(
      new URLSearchParams("from=2026-10-08&to=2026-10-09&limit=9999"),
    ),
  );
  assert.notDeepEqual(
    reportingQueryKey("DT01", filters),
    reportingQueryKey("AP01", filters),
  );
  assert.notDeepEqual(
    reportingQueryKey("DT01", filters),
    reportingQueryKey("WS01", filters),
  );
});

test("PostgreSQL reporting migrations, atomic snapshots, isolation and aggregation", async (t) => {
  const engine = new PGlite();
  const db = {
    query: async (sql, values = []) => {
      const result = await engine.query(sql, values);
      return {
        rows: result.rows,
        rowCount: result.affectedRows || result.rows.length,
      };
    },
  };
  t.after(() => engine.close());
  for (const file of [
    "20260922000000_init",
    "20260929000000_store_notifications",
    "20261009000000_customer_reporting",
  ]) {
    await engine.exec(
      await readFile(
        new URL(`../prisma/migrations/${file}/migration.sql`, import.meta.url),
        "utf8",
      ),
    );
  }
  await engine.exec(
    await readFile(
      new URL(
        "../prisma/migrations/20261012000000_store_reporting/migration.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await engine.exec(await readFile(new URL("../prisma/migrations/20261013000000_store_code_schema_names/migration.sql", import.meta.url), "utf8"));
  await engine.exec(await readFile(new URL("../prisma/migrations/20261014000000_reporting_batch_shift/migration.sql", import.meta.url), "utf8"));
  await engine.exec(await readFile(storeTypeMigrationUrl, "utf8"));
  for (const store of ["DT01", "AP01", "WS01"])
    await provisionRestaurant(db, store);
  const scope = {
    schemaName: "store_dt01",
    storeCode: "DT01",
  };
  const sync = (input, selected = scope) =>
    syncOrderSnapshot(db, selected, parseSnapshot(input, selected.storeCode));

  await t.test(
    "accepts snapshot and preserves supplied columns, split payments and unsuccessful attempts",
    async () => {
      assert.equal((await sync(snapshot())).status, "accepted");
      const order = (
        await db.query(
          "SELECT * FROM store_dt01.tbl_rpt_order",
        )
      ).rows[0];
      assert.equal(order.source_revision, 1);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM store_dt01.tbl_rpt_card_payment",
          )
        ).rows[0].n,
        3,
      );
      const fields = (
        await db.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema = 'store_dt01' AND table_name = 'tbl_rpt_card_payment'",
        )
      ).rows.map((row) => row.column_name);
      assert.ok(fields.includes("response_text"));
    },
  );
  await t.test(
    "duplicate retries, same revision conflicts, stale revisions and request reuse",
    async () => {
      const before = (
        await db.query(
          "SELECT report_id, rpt_created_on, rpt_updated_on FROM store_dt01.tbl_rpt_order WHERE store_code = 'DT01'",
        )
      ).rows[0];
      assert.equal((await sync(snapshot())).status, "duplicate");
      assert.equal(
        (await sync(snapshot("DT01", "1", "same-version"))).status,
        "duplicate",
      );
      assert.deepEqual(
        (
          await db.query(
            "SELECT report_id, rpt_created_on, rpt_updated_on FROM store_dt01.tbl_rpt_order WHERE store_code = 'DT01'",
          )
        ).rows[0],
        before,
      );
      const conflict = snapshot("DT01", "1", "conflict");
      conflict.order.total = "51.00";
      await assert.rejects(sync(conflict), /same source_revision/);
      const changedRequest = snapshot("DT01", "2", "request-1");
      await assert.rejects(sync(changedRequest), /request_id/);
      assert.equal(
        (await sync(snapshot("DT01", "2", "newer"))).status,
        "accepted",
      );
      const after = (
        await db.query(
          "SELECT report_id, rpt_created_on, rpt_updated_on FROM store_dt01.tbl_rpt_order WHERE store_code = 'DT01'",
        )
      ).rows[0];
      assert.equal(after.report_id, before.report_id);
      assert.deepEqual(after.rpt_created_on, before.rpt_created_on);
      assert.ok(
        new Date(after.rpt_updated_on) >= new Date(before.rpt_updated_on),
      );
      assert.equal(
        (await sync(snapshot("DT01", "1", "older"))).status,
        "stale",
      );
    },
  );
  await t.test(
    "composite card relationship rejects a payment from a different order",
    async () => {
      const other = snapshot("DT01", "1", "another-parent", "ORDER-OTHER");
      await sync(other);
      await assert.rejects(
        db.query(`INSERT INTO store_dt01.tbl_rpt_card_payment
      (store_code, order_code, business_date, card_payment_code, payment_code)
      VALUES ('DT01', 'ORDER-1', '2026-10-08', 'WRONG-PARENT-CARD', 'ORDER-OTHER-P1')`),
      );
      // Remove this fixture in dependency order to keep aggregate assertions scoped.
      await db.query(
        "DELETE FROM store_dt01.tbl_rpt_card_payment WHERE order_code = 'ORDER-OTHER'",
      );
      await db.query(
        "DELETE FROM store_dt01.tbl_rpt_payment WHERE order_code = 'ORDER-OTHER'",
      );
      await db.query(
        "DELETE FROM store_dt01.tbl_rpt_order_item WHERE order_code = 'ORDER-OTHER'",
      );
      await db.query(
        "DELETE FROM store_dt01.tbl_rpt_order WHERE order_code = 'ORDER-OTHER'",
      );
    },
  );
  await t.test(
    "same source codes can exist in separate store schemas",
    async () => {
      await sync(snapshot("AP01"), {
        schemaName: "store_ap01",
        storeCode: "AP01",
      });
      await sync(snapshot("WS01"), {
        schemaName: "store_ws01",
        storeCode: "WS01",
      });
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM store_dt01.tbl_rpt_order",
          )
        ).rows[0].n,
        1,
      );
      await assert.rejects(
        sync(snapshot("WS01", "2", "bad-scope"), {
          ...scope,
          storeCode: "WS01",
        }),
        /scope unavailable/,
      );
      await assert.rejects(
        db.query(
          "INSERT INTO store_dt01.reporting_stores (store_code) VALUES ('WS01')",
        ),
      );
    },
  );
  await t.test(
    "a conflicting child rolls back parent, all children and request receipt",
    async () => {
      const bad = snapshot("DT01", "1", "bad-order", "ORDER-2");
      bad.items[1].order_item_code = "ORDER-1-I1";
      await assert.rejects(sync(bad), /another order/);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM store_dt01.tbl_rpt_order WHERE order_code = 'ORDER-2'",
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM store_dt01.tbl_rpt_order_item WHERE order_code = 'ORDER-2'",
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM store_dt01.sync_requests WHERE request_id = 'bad-order'",
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await t.test(
    "report totals avoid item/payment multiplication and card double counting",
    async () => {
      const filters = parseReportFilters(
        new URLSearchParams("from=2026-10-08&to=2026-10-08&order_code=ORDER-1"),
      );
      const report = await readOrderReport(db, scope, filters);
      assert.equal(report.totals.order_count, 1);
      assert.equal(report.totals.order_total, "50.00");
      assert.equal(report.totals.item_subtotal, "50.00");
      assert.equal(report.totals.payment_amount, "50.00");
      assert.equal(report.detail.card_payments.length, 3);
      assert.equal(report.orders[0].business_date, "2026-10-08");
    },
  );
  await t.test(
    "newer snapshots reconcile omissions and preserve raw refund/void meanings",
    async () => {
      const changed = snapshot("DT01", "3", "remove-children");
      changed.items = [changed.items[0]];
      changed.payments = [changed.payments[0]];
      changed.card_payments = [
        changed.card_payments[0],
        changed.card_payments[1],
      ];
      changed.order.total = "-20.00";
      changed.order.is_return = true;
      changed.items[0].is_void = true;
      await sync(changed);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM store_dt01.tbl_rpt_payment WHERE store_code = 'DT01'",
          )
        ).rows[0].n,
        1,
      );
      const empty = snapshot("DT01", "4", "empty-children");
      empty.items = [];
      empty.payments = [];
      empty.card_payments = [];
      await sync(empty);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM store_dt01.tbl_rpt_order_item WHERE store_code = 'DT01'",
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await t.test(
    "server access uses existing store assignments and denies unassigned or inactive stores",
    async () => {
      const id = "11111111-1111-1111-1111-111111111111";
      await db.query(
        "INSERT INTO public.auth_users(id, name, email, password_hash, role) VALUES ($1, 'User', 'user@example.test', 'unused', 'USER')",
        [id],
      );
      await db.query(
        "INSERT INTO public.store_access(user_id, store_code) VALUES ($1, 'DT01')",
        [id],
      );
      const user = { id, role: "ADMIN" }; // A claimed role cannot bypass the database role.
      assert.equal(
        (await resolveReportingScope(db, user, "DT01")).storeCode,
        "DT01",
      );
      await assert.rejects(
        resolveReportingScope(db, user, "AP01"),
        /not accessible/,
      );
      await assert.rejects(
        resolveReportingScope(db, user, "WS01"),
        /not accessible/,
      );
      await db.query(
        "UPDATE public.stores SET active = FALSE WHERE store_code = 'DT01'",
      );
      await assert.rejects(
        resolveReportingScope(db, user, "DT01"),
        /not accessible/,
      );
    },
  );
  await t.test(
    "legacy local timestamp import preserves business dates, converts timezone and leaves source intact",
    async () => {
      await engine.exec(`UPDATE public.stores SET active = TRUE WHERE store_code = 'DT01';
      CREATE TABLE public.tbl_rpt_order AS SELECT store_code, order_code, order_number, business_date,
        created_at AT TIME ZONE 'Asia/Kolkata' AS created_at, total FROM store_ap01.tbl_rpt_order WHERE store_code = 'AP01';
      CREATE TABLE public.tbl_rpt_order_item AS SELECT store_code, order_code, order_number, business_date, order_item_code, subtotal FROM store_ap01.tbl_rpt_order_item WHERE store_code = 'AP01';
      CREATE TABLE public.tbl_rpt_payment AS SELECT store_code, order_code, business_date, payment_code, payment_amount FROM store_ap01.tbl_rpt_payment WHERE store_code = 'AP01';
      CREATE TABLE public.tbl_rpt_card_payment AS SELECT store_code, order_code, business_date, payment_code, card_payment_code FROM store_ap01.tbl_rpt_card_payment WHERE store_code = 'AP01';`);
      const imported = await readLegacySnapshots(db, "AP01", "Asia/Kolkata");
      assert.equal(imported.length, 1);
      assert.equal(imported[0].order.created_at, "2026-10-08T19:30:00.000Z");
      assert.equal(imported[0].order.business_date, "2026-10-08");
      assert.equal(imported[0].payments.length, 2);
      assert.equal(
        (await db.query("SELECT count(*)::int AS n FROM public.tbl_rpt_order"))
          .rows[0].n,
        1,
      );
      await db.query(
        "INSERT INTO public.tbl_rpt_payment (store_code, order_code, business_date, payment_code) VALUES ('AP01', 'MISSING', '2026-10-08', 'ORPHAN')",
      );
      await assert.rejects(
        readLegacySnapshots(db, "AP01", "Asia/Kolkata"),
        /Orphan/,
      );
    },
  );
  await t.test(
    "batch is created before a related shift, and orders do not remove them",
    async () => {
      const columns = (
        await db.query(
          "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'store_dt01' AND ((table_name = 'tbl_rpt_order' AND column_name = 'employee_name') OR (table_name = 'tbl_rpt_payment' AND column_name = 'station_name') OR table_name IN ('tbl_rpt_batch', 'tbl_rpt_shift', 'sync_master_requests'))",
        )
      ).rows;
      assert.ok(columns.some((row) => row.column_name === "employee_name"));
      assert.ok(columns.some((row) => row.column_name === "station_name"));
      assert.ok(columns.some((row) => row.table_name === "tbl_rpt_batch"));
      assert.ok(columns.some((row) => row.table_name === "tbl_rpt_shift"));
      assert.ok(columns.some((row) => row.table_name === "sync_master_requests"));
      const missingShift = parseShiftSnapshot({
        request_id: "shift-missing",
        source_revision: "1",
        shift: { store_code: "DT01", shift_code: "SHIFT-AM", batch_code: "MISSING-BATCH" },
      }, "DT01");
      await assert.rejects(syncShiftSnapshot(db, scope, missingShift), /Create the batch/);
      assert.equal(
        (await db.query("SELECT count(*)::int AS n FROM store_dt01.tbl_rpt_shift")).rows[0].n,
        0,
      );
      const opened = parseBatchSnapshot({
        request_id: "batch-1",
        source_revision: "1",
        batch: { store_code: "DT01", batch_code: "BATCH-20261012", batchstart: "2026-10-08T09:00:00+05:30" },
      }, "DT01");
      assert.equal((await syncBatchSnapshot(db, scope, opened)).status, "accepted");
      const shift = parseShiftSnapshot({
        request_id: "shift-1",
        source_revision: "1",
        shift: { store_code: "DT01", shift_code: "SHIFT-AM", batch_code: "BATCH-20261012", shiftopenbal: "100.00" },
      }, "DT01");
      assert.equal((await syncShiftSnapshot(db, scope, shift)).status, "accepted");
      assert.equal(
        (await db.query("SELECT isopen, shiftopenbal::text FROM store_dt01.tbl_rpt_shift")).rows[0].shiftopenbal,
        "100.00",
      );
      const order = snapshot("DT01", "1", "named-order", "ORDER-NAMED");
      order.order.employee_name = "Asha Rao";
      order.order.batch_code = "BATCH-20261012";
      order.order.shift_code = "SHIFT-AM";
      order.payments[0].station_name = "Front Counter";
      assert.equal((await sync(order)).status, "accepted");
      assert.equal(
        (await db.query("SELECT employee_name FROM store_dt01.tbl_rpt_order WHERE order_code = 'ORDER-NAMED'")).rows[0].employee_name,
        "Asha Rao",
      );
      assert.equal(
        (await db.query("SELECT count(*)::int AS n FROM store_dt01.tbl_rpt_batch")).rows[0].n,
        1,
      );
      const closed = parseBatchSnapshot({
        request_id: "batch-2",
        source_revision: "2",
        batch: { store_code: "DT01", batch_code: "BATCH-20261012", isbatchclose: 1, batchend: "2026-10-08T22:00:00+05:30" },
      }, "DT01");
      assert.equal((await syncBatchSnapshot(db, scope, closed)).status, "accepted");
      const extra = parseBatchSnapshot({
        request_id: "batch-other",
        source_revision: "1",
        batch: { store_code: "DT01", batch_code: "BATCH-OTHER" },
      }, "DT01");
      assert.equal((await syncBatchSnapshot(db, scope, extra)).status, "accepted");
      assert.deepEqual(
        (await db.query("SELECT batch_code FROM store_dt01.tbl_rpt_batch ORDER BY batch_code")).rows.map((row) => row.batch_code),
        ["BATCH-20261012", "BATCH-OTHER"],
      );
      assert.equal(
        (await db.query("SELECT isbatchclose FROM store_dt01.tbl_rpt_batch WHERE batch_code = 'BATCH-20261012'")).rows[0].isbatchclose,
        1,
      );
    },
  );
});
