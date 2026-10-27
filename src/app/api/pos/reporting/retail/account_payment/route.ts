import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_account_payment",
  "account_payment",
  "Retail account_payment sync failed",
);
