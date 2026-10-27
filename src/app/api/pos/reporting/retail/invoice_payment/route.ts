import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_invoice_payment",
  "invoice_payment",
  "Retail invoice_payment sync failed",
);
