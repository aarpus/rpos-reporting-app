import type { Metadata } from "next";
import { CreditCardTransactionDetailEntry } from "../_components/credit-card-transaction-detail-entry";

export const metadata: Metadata = {
  title: "Card Transaction Details Report",
};

export default function CreditCardTransactionDetailsPage() {
  return <CreditCardTransactionDetailEntry />;
}
