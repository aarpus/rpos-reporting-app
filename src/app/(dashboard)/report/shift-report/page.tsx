import type { Metadata } from "next";
import { ShiftReportEntry } from "./_components/shift-report-entry";

export const metadata: Metadata = {
  title: "Shift End Report",
};

export default function ShiftReportPage() {
  return <ShiftReportEntry />;
}
