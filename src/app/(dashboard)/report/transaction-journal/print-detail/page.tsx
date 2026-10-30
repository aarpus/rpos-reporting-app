import type { Metadata } from "next";
import { TransactionJournalPrintDetailEntry } from "../_components/transaction-journal-print-detail-entry";

export const metadata: Metadata = {
  title: "Transaction Journal Print Detail",
};

export default function TransactionJournalPrintDetailPage() {
  return <TransactionJournalPrintDetailEntry />;
}
