"use client";

import { RetailReports } from "@/components/store/retail-dashboard";
import { useStore } from "@/components/store/store-provider";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function ReportLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { selectedStore } = useStore();
  if (selectedStore?.storeType === "RETAIL" && pathname !== "/report") {
    return <RetailReports storeName={selectedStore.name} />;
  }
  return children;
}
