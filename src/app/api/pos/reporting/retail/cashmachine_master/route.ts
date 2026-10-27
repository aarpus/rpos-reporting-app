import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_cashmachine_master",
  "cashmachine_master",
  "Retail cashmachine_master sync failed",
);
