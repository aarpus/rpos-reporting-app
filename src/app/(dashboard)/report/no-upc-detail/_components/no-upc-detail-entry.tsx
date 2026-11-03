"use client";

import { useStore } from "@/components/store/store-provider";
import RetailNoUpcDetailReport from "./retail-no-upc-detail-report";

export function NoUpcDetailEntry() {
  const { selectedStore } = useStore();
  if (selectedStore?.storeType !== "RETAIL") {
    return (
      <div className="px-4 py-6 text-sm text-text-secondary sm:px-6">
        NoUPC Details Report is available for retail stores.
      </div>
    );
  }
  return <RetailNoUpcDetailReport />;
}
