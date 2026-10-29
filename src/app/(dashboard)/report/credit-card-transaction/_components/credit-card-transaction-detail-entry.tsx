"use client";

import { useStore } from "@/components/store/store-provider";
import { Suspense } from "react";
import RetailCreditCardDetail from "./retail-credit-card-detail";

export function CreditCardTransactionDetailEntry() {
  const { selectedStore } = useStore();
  if (selectedStore?.storeType !== "RETAIL") {
    return (
      <div className="px-4 py-6 text-sm text-text-secondary sm:px-6">
        Card Transaction Details is available for retail stores.
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 text-sm text-text-secondary sm:px-6">
          Loading card transaction details…
        </div>
      }
    >
      <RetailCreditCardDetail />
    </Suspense>
  );
}
