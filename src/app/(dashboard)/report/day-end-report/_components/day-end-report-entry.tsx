"use client";

import { useStore } from "@/components/store/store-provider";
import DayEndReportView from "./day-end-report";
import RetailDayEndList from "./retail-day-end-list";

export function DayEndReportEntry() {
  const { selectedStore } = useStore();
  if (selectedStore?.storeType === "RETAIL") return <RetailDayEndList />;
  return <DayEndReportView />;
}
