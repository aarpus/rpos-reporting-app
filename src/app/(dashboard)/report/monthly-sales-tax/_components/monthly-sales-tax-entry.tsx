"use client";

import { useStore } from "@/components/store/store-provider";
import RetailMonthlySalesTaxReport from "./retail-monthly-sales-tax-report";

export function MonthlySalesTaxEntry() {
  const { selectedStore } = useStore();
  if (selectedStore?.storeType !== "RETAIL") {
    return (
      <div className="px-4 py-6 text-sm text-text-secondary sm:px-6">
        Monthly Sales And Tax Report is available for retail stores.
      </div>
    );
  }
  return <RetailMonthlySalesTaxReport />;
}
