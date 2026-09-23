import type { Metadata } from "next";
import WeekEndReportView from "./_components/week-end-report";

export const metadata: Metadata = {
  title: "Week End Report",
};

export default function WeekEndReportPage() {
  return <WeekEndReportView />;
}
