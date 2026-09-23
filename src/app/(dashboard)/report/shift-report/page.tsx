import type { Metadata } from "next";
import ShiftReportList from "./_components/shift-report-list";

export const metadata: Metadata = {
  title: "Shift Report",
};

export default function ShiftReportPage() {
  return <ShiftReportList />;
}
