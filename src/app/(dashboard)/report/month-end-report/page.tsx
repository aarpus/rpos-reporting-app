import type { Metadata } from "next";
import MonthEndReportView from "./_components/month-end-report";

export const metadata: Metadata = {
  title: "Month End Report",
};

export default function MonthEndReportPage() {
  return <MonthEndReportView />;
}
