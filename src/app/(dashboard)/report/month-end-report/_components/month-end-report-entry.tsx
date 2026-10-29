"use client";

import { useStore } from "@/components/store/store-provider";
import MonthEndReportView from "./month-end-report";
import RetailMonthEndReport from "./retail-month-end-report";

export function MonthEndReportEntry() {
  const { selectedStore } = useStore();
  if (selectedStore?.storeType === "RETAIL") return <RetailMonthEndReport />;
  return <MonthEndReportView />;
}
