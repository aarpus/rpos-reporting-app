"use client";

import { useStore } from "@/components/store/store-provider";
import { Suspense } from "react";
import RetailInvoiceQtyVariance from "./retail-invoice-qty-variance";

export function InvoiceQtyVarianceEntry() {
  const { selectedStore } = useStore();
  if (selectedStore?.storeType !== "RETAIL") {
    return (
      <div className="px-4 py-6 text-sm text-text-secondary sm:px-6">
        Invoice Report is available for retail stores.
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 text-sm text-text-secondary sm:px-6">
          Loading quantity variance report…
        </div>
      }
    >
      <RetailInvoiceQtyVariance />
    </Suspense>
  );
}
