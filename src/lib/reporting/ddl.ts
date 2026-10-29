import restaurantReportingSql from "../../../database/reporting/restaurant/001-tables.sql";
import retailReportingSql from "../../../database/reporting/retail/001-tables.sql";
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

// Separate literal imports. A dynamic path is rewritten by Turbopack to the
// restaurant file, and a runtime disk read is empty on the Cloudflare Worker.
function reportingSql(storeType: StoreType) {
  return storeType === "RETAIL" ? retailReportingSql : restaurantReportingSql;
}

export async function loadReportingDdl(storeType: StoreType): Promise<string> {
  const sql = reportingSql(storeType);
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
