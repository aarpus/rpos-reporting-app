"use client";

import { useStore } from "@/components/store/store-provider";
import { useParams } from "next/navigation";
import DayEndReportView from "./day-end-report";
import RetailDayEndDetail from "./retail-day-end-detail";

export function DayEndReportDetailEntry() {
  const params = useParams<{ id: string }>();
  const { selectedStore } = useStore();

  if (selectedStore?.storeType === "RETAIL") {
    return <RetailDayEndDetail id={params.id} />;
  }

  return <DayEndReportView batchId={params.id} />;
}
