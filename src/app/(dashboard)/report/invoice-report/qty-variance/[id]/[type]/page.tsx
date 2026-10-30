import type { Metadata } from "next";
import { InvoiceQtyVarianceEntry } from "../../../_components/invoice-qty-variance-entry";

export const metadata: Metadata = {
  title: "Quantity Variance Report",
};

export default function InvoiceQtyVariancePage() {
  return <InvoiceQtyVarianceEntry />;
}
