import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_store_account_transaction",
  "store_account_transaction",
  "Retail store_account_transaction sync failed",
);
