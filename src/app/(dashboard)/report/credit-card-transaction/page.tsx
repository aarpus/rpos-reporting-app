import type { Metadata } from "next";
import { CreditCardTransactionEntry } from "./_components/credit-card-transaction-entry";

export const metadata: Metadata = {
  title: "Card Transaction Details",
};

export default function CreditCardTransactionPage() {
  return <CreditCardTransactionEntry />;
}
