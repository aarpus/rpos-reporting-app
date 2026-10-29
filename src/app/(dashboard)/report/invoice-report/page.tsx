import type { Metadata } from "next";
import { InvoiceReportEntry } from "./_components/invoice-report-entry";

export const metadata: Metadata = {
  title: "Invoice Report",
};

export default function InvoiceReportPage() {
  return <InvoiceReportEntry />;
}
