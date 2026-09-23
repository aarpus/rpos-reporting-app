import type { Metadata } from "next";
import TransactionDetailList from "./_components/transaction-detail";

export const metadata: Metadata = {
  title: "Transaction Detail",
};

export default function TransactionDetailPage() {
  return <TransactionDetailList />;
}
