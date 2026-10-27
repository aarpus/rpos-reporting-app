import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_clockin",
  "clockin",
  "Retail clockin sync failed",
);
