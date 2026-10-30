"use client";

import { useStore } from "@/components/store/store-provider";
import { Suspense } from "react";
import RetailTransactionJournalReport from "./retail-transaction-journal-report";

export function TransactionJournalEntry() {
  const { selectedStore } = useStore();
  if (selectedStore?.storeType !== "RETAIL") {
    return (
      <div className="px-4 py-6 text-sm text-text-secondary sm:px-6">
        Transaction Journal Report is available for retail stores.
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 text-sm text-text-secondary sm:px-6">
          Loading transaction journal…
        </div>
      }
    >
      <RetailTransactionJournalReport />
    </Suspense>
  );
}
