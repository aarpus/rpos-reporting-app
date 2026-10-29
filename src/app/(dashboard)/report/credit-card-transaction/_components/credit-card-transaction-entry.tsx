"use client";

import { useStore } from "@/components/store/store-provider";
import RetailCreditCardList from "./retail-credit-card-list";

export function CreditCardTransactionEntry() {
  const { selectedStore } = useStore();
  if (selectedStore?.storeType !== "RETAIL") {
    return (
      <div className="px-4 py-6 text-sm text-text-secondary sm:px-6">
        Card Transaction Details is available for retail stores.
      </div>
    );
  }
  return <RetailCreditCardList />;
}
