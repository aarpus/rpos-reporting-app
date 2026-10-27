import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_cashmachine_batch",
  "cashmachine_batch",
  "Retail cashmachine_batch sync failed",
);
