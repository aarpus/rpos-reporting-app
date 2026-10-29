import type { Metadata } from "next";
import { MonthEndReportEntry } from "./_components/month-end-report-entry";

export const metadata: Metadata = {
  title: "Month End Report",
};

export default function MonthEndReportPage() {
  return <MonthEndReportEntry />;
}
