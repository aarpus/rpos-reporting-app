import type { Metadata } from "next";
import YearEndReportView from "./_components/year-end-report";

export const metadata: Metadata = {
  title: "Year End Report",
};

export default function YearEndReportPage() {
  return <YearEndReportView />;
}
