import type { Metadata } from "next";
import { DayEndReportDetailEntry } from "../_components/day-end-report-detail-entry";

export const metadata: Metadata = {
  title: "Day End Report",
};

export default function DayEndDetailPage() {
  return <DayEndReportDetailEntry />;
}
