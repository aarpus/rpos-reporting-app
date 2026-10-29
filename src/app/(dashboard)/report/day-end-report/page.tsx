import type { Metadata } from "next";
import { DayEndReportEntry } from "./_components/day-end-report-entry";

export const metadata: Metadata = {
  title: "Day-End Report",
};

export default function DayEndReportPage() {
  return <DayEndReportEntry />;
}
