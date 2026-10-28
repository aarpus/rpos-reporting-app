import type { Metadata } from "next";
import { ShiftReportDetailEntry } from "../_components/shift-report-detail-entry";

export const metadata: Metadata = {
  title: "Shift End Report",
};

export default function ShiftEndReportPage() {
  return <ShiftReportDetailEntry />;
}
