import type { Metadata } from "next";
import { InvoiceCostVarianceEntry } from "../../../_components/invoice-cost-variance-entry";

export const metadata: Metadata = {
  title: "Cost Variance Report",
};

export default function InvoiceCostVariancePage() {
  return <InvoiceCostVarianceEntry />;
}
