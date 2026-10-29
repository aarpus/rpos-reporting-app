import type { Metadata } from "next";
import { WeekEndReportEntry } from "./_components/week-end-report-entry";

export const metadata: Metadata = {
  title: "Week End Report",
};

export default function WeekEndReportPage() {
  return <WeekEndReportEntry />;
}
