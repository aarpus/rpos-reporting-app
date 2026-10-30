import type { Metadata } from "next";
import { InvoiceViewEntry } from "../../../_components/invoice-view-entry";

export const metadata: Metadata = {
  title: "Invoice Report View",
};

export default function InvoiceViewPage() {
  return <InvoiceViewEntry />;
}
