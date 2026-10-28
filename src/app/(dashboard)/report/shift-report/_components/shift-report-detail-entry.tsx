"use client";

import { useStore } from "@/components/store/store-provider";
import { notFound, useParams } from "next/navigation";
import { shifts } from "./data";
import RetailShiftEndDetail from "./retail-shift-end-detail";
import { retailShifts } from "./retail-shift-data";
import ShiftEndReportView from "./shift-end-report";

export function ShiftReportDetailEntry() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { selectedStore } = useStore();

  if (selectedStore?.storeType === "RETAIL") {
    const shift = retailShifts.find((item) => item.id === id);
    if (!shift) notFound();
    return <RetailShiftEndDetail shift={shift} />;
  }

  if (!shifts.some((item) => item.id === id)) notFound();
  return <ShiftEndReportView shiftId={id} />;
}
