import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TransactionReceipt } from "../_components/transaction-detail";
import { transactions } from "../_components/data";

export const metadata: Metadata = {
  title: "Transaction Detail",
};

export default async function TransactionReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    notFound();
  }

  return <TransactionReceipt id={id} />;
}
