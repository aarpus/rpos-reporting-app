import type { Metadata } from "next";
import { TransactionJournalViewEntry } from "../../_components/transaction-journal-view-entry";

export const metadata: Metadata = {
  title: "Transaction Journal Detail",
};

export default function TransactionJournalViewPage() {
  return <TransactionJournalViewEntry />;
}
