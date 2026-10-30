import type { Metadata } from "next";
import { TransactionJournalEntry } from "./_components/transaction-journal-entry";

export const metadata: Metadata = {
  title: "Transaction Journal Report",
};

export default function TransactionJournalPage() {
  return <TransactionJournalEntry />;
}
