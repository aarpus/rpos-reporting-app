import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_group_detail",
  "group_detail",
  "Retail group_detail sync failed",
);
