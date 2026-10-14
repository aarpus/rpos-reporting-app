import type { Metadata } from "next";
import { TransactionReceipt } from "../_components/transaction-detail";

export const metadata: Metadata = {
  title: "Transaction Detail",
};

export default async function TransactionReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TransactionReceipt id={id} />;
}
