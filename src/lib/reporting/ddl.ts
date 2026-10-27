import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { StoreType } from "../store-type.ts";

export class StoreReportingSetupError extends Error {
  constructor() {
    super(
      "Store creation is unavailable until reporting database setup is completed.",
    );
  }
}

export class RetailReportingTablesError extends Error {
  constructor() {
    super("Retail reporting tables are not available yet.");
  }
}

// Keep these as separate literal paths. A dynamic new URL() is rewritten by
// Turbopack to the restaurant file, so a retail store would get restaurant tables.
function ddlPath(storeType: StoreType) {
  const directory = join(process.cwd(), "database", "reporting");
  return storeType === "RETAIL"
    ? join(directory, "retail", "001-tables.sql")
    : join(directory, "restaurant", "001-tables.sql");
}

export async function loadReportingDdl(storeType: StoreType): Promise<string> {
  let sql = "";
  try {
    sql = await readFile(ddlPath(storeType), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const retailSql = sql.includes("tbl_checkout_transaction");
  const restaurantSql = sql.includes("tbl_rpt_order");
  if (
    !/create\s+table/i.test(sql) ||
    !sql.includes("__SCHEMA__") ||
    (storeType === "RETAIL" ? !retailSql || restaurantSql : !restaurantSql)
  ) {
    throw storeType === "RETAIL"
      ? new RetailReportingTablesError()
      : new StoreReportingSetupError();
  }
  return sql;
}
