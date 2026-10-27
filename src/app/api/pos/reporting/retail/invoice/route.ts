import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_invoice",
  "invoice",
  "Retail invoice sync failed",
);
