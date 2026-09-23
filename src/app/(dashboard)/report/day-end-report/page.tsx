import type { Metadata } from "next";
import DayEndReportView from "./_components/day-end-report";

export const metadata: Metadata = {
  title: "Day End Report",
};

export default function DayEndReportPage() {
  return <DayEndReportView />;
}
