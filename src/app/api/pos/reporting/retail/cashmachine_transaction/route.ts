import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_cashmachine_transaction",
  "cashmachine_transaction",
  "Retail cashmachine_transaction sync failed",
);
