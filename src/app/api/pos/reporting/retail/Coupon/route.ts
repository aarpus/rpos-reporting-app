import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_Coupon",
  "Coupon",
  "Retail Coupon sync failed",
);
