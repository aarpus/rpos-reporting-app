import type { Metadata } from "next";
import { InvoiceProfitMarginEntry } from "../../../_components/invoice-profit-margin-entry";

export const metadata: Metadata = {
  title: "Invoice Profit Margin Report",
};

export default function InvoiceProfitMarginPage() {
  return <InvoiceProfitMarginEntry />;
}
