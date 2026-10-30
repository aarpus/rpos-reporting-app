"use client";

import { useStore } from "@/components/store/store-provider";
import { Suspense } from "react";
import RetailInvoiceProfitMargin from "./retail-invoice-profit-margin";

export function InvoiceProfitMarginEntry() {
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
          Loading profit margin report…
        </div>
      }
    >
      <RetailInvoiceProfitMargin />
    </Suspense>
  );
}
