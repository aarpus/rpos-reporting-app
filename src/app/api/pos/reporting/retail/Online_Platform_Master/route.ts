import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_Online_Platform_Master",
  "Online_Platform_Master",
  "Retail Online_Platform_Master sync failed",
);
