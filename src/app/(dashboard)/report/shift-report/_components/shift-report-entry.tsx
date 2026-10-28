"use client";

import { useStore } from "@/components/store/store-provider";
import RetailShiftEndList from "./retail-shift-end-list";
import ShiftReportList from "./shift-report-list";

export function ShiftReportEntry() {
  const { selectedStore } = useStore();
  if (selectedStore?.storeType === "RETAIL") return <RetailShiftEndList />;
  return <ShiftReportList />;
}
