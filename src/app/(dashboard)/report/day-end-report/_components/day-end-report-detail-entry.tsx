"use client";

import { useStore } from "@/components/store/store-provider";
import { notFound, useParams } from "next/navigation";
import DayEndReportView from "./day-end-report";
import RetailDayEndDetail from "./retail-day-end-detail";
import { retailDayEndBatches } from "./retail-day-end-data";

export function DayEndReportDetailEntry() {
  const params = useParams<{ id: string }>();
  const { selectedStore } = useStore();

  if (selectedStore?.storeType === "RETAIL") {
    const batch = retailDayEndBatches.find((item) => item.id === params.id);
    if (!batch) notFound();
    return <RetailDayEndDetail />;
  }

  return <DayEndReportView batchId={params.id} />;
}
