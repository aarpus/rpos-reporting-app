import { delay } from "@/utils/delay";
import {
  homeOverviewStatsRawData,
  inventoryOverviewRawData,
  lastTransactionsRawData,
  salesChartMonthlyRawData,
  salesChartYearlyRawData,
  topProductsRawData,
  trafficSourcesRawData,
} from "./data";
import type {
  Granularity,
  HomeOverviewStatsRawResponse,
  InventoryOverviewRawResponse,
  LastTransactionsRawResponse,
  SalesChartRawResponse,
  TopProductsRawResponse,
  TrafficSourcesRawResponse,
} from "./types";

export type * from "./types";

export async function getHomeOverviewStats(_storeCode: string): Promise<HomeOverviewStatsRawResponse> {
  void _storeCode;
  await delay(860);
  return homeOverviewStatsRawData;
}

export async function getSalesChartData(
  _storeCode: string,
  granularity: Granularity = "monthly",
): Promise<SalesChartRawResponse> {
  void _storeCode;
  await delay(1200);
  return granularity === "yearly" ? salesChartYearlyRawData : salesChartMonthlyRawData;
}

export async function getInventoryOverviewData(_storeCode: string): Promise<InventoryOverviewRawResponse> {
  void _storeCode;
  await delay(1200);
  return inventoryOverviewRawData;
}

export async function getTopProductsData(_storeCode: string): Promise<TopProductsRawResponse> {
  void _storeCode;
  await delay(900);
  return topProductsRawData;
}

export async function getTrafficSourcesData(_storeCode: string): Promise<TrafficSourcesRawResponse> {
  void _storeCode;
  await delay(1000);
  return trafficSourcesRawData;
}

export async function getLastTransactionsData(_storeCode: string): Promise<LastTransactionsRawResponse> {
  void _storeCode;
  await delay(950);
  return lastTransactionsRawData;
}
