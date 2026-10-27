import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_station_transaction",
  "station_transaction",
  "Retail station_transaction sync failed",
);
