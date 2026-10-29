"use client";

import { useStore } from "@/components/store/store-provider";
import RetailWeekEndReport from "./retail-week-end-report";
import WeekEndReportView from "./week-end-report";

export function WeekEndReportEntry() {
  const { selectedStore } = useStore();
  if (selectedStore?.storeType === "RETAIL") return <RetailWeekEndReport />;
  return <WeekEndReportView />;
}
