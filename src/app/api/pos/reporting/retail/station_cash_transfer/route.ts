import { createRetailEntityPost } from "@/lib/reporting/retail-route";

export const runtime = "nodejs";

export const POST = createRetailEntityPost(
  "tbl_station_cash_transfer",
  "station_cash_transfer",
  "Retail station_cash_transfer sync failed",
);
