import type { Client } from "pg";
import type { StoreInput } from "../store-admin-validation.ts";

export class StoreReportingSetupError extends Error {
  constructor() {
    super(
      "Store creation is unavailable until reporting database setup is completed.",
    );
  }
}

type CreatedStoreRow = {
  store_code: string;
  name: string;
  timezone: string;
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
      to_regprocedure('public.provision_store_reporting(text)') IS NOT NULL AS installed,
      COALESCE(has_function_privilege(current_user, to_regprocedure('public.provision_store_reporting(text)'), 'EXECUTE'), FALSE) AS allowed`);
    if (!setup.rows[0]?.installed || !setup.rows[0]?.allowed)
      throw new StoreReportingSetupError();
    const result = await db.query<CreatedStoreRow>(
      `
      INSERT INTO public.stores (store_code, name, timezone, updated_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING store_code, name, timezone, active, created_at, updated_at,
                0::int AS assigned_user_count`,
      [input.storeCode, input.name, input.timezone],
    );
    await db.query("SELECT public.provision_store_reporting($1::text)", [
      input.storeCode,
    ]);
    await db.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await db.query("ROLLBACK");
    if ((error as { code?: string }).code === "42883")
      throw new StoreReportingSetupError();
    throw error;
  }
}
