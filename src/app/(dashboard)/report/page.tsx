import type { Metadata } from "next";
import { ReportIndex } from "./report-index";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <ReportIndex />;
}
