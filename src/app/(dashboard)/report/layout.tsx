"use client";

import { RetailReports } from "@/components/store/retail-dashboard";
import { useStore } from "@/components/store/store-provider";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function isRetailShiftReport(pathname: string) {
  return (
    pathname === "/report/shift-report" ||
    /^\/report\/shift-report\/[^/]+$/.test(pathname)
  );
}

export default function ReportLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { selectedStore } = useStore();
  const retailReportOpen = isRetailShiftReport(pathname);
  if (selectedStore?.storeType === "RETAIL" && pathname !== "/report" && !retailReportOpen) {
    return <RetailReports storeName={selectedStore.name} />;
  }
  return children;
}
