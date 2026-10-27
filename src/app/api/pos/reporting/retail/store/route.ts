import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_store",
  "store",
  "Retail store sync failed",
);
