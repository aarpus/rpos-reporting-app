import type { Client } from "pg";
import type { StoreInput } from "../store-admin-validation.ts";
import {
  loadReportingDdl,
  RetailReportingTablesError,
  StoreReportingSetupError,
} from "./ddl.ts";

export { RetailReportingTablesError, StoreReportingSetupError };

type CreatedStoreRow = {
  store_code: string;
  name: string;
  timezone: string;
  store_type: "RESTAURANT" | "RETAIL";
  active: boolean;
  created_at: Date;
  updated_at: Date;
  assigned_user_count: number;
};

export async function createStoreWithReporting(
  db: Pick<Client, "query">,
  input: StoreInput,
): Promise<CreatedStoreRow> {
  await db.query("BEGIN");
  try {
    const setup = await db.query<{
      installed: boolean;
      allowed: boolean;
    }>(`SELECT
      to_regprocedure('public.provision_store_reporting(text, text)') IS NOT NULL AS installed,
      COALESCE(has_function_privilege(current_user, to_regprocedure('public.provision_store_reporting(text, text)'), 'EXECUTE'), FALSE) AS allowed`);
    if (!setup.rows[0]?.installed || !setup.rows[0]?.allowed)
      throw new StoreReportingSetupError();
    const ddl = await loadReportingDdl(input.storeType);
    const result = await db.query<CreatedStoreRow>(
      `
      INSERT INTO public.stores (store_code, name, timezone, store_type, updated_at)
      VALUES ($1, $2, $3, $4::"StoreType", NOW())
      RETURNING store_code, name, timezone, store_type, active, created_at, updated_at,
                0::int AS assigned_user_count`,
      [input.storeCode, input.name, input.timezone, input.storeType],
    );
    await db.query(
      "SELECT public.provision_store_reporting($1::text, $2::text)",
      [input.storeCode, ddl],
    );
    await db.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await db.query("ROLLBACK");
    if ((error as { code?: string }).code === "42883")
      throw new StoreReportingSetupError();
    throw error;
  }
}
