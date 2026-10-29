"use client";

import { RetailReports } from "@/components/store/retail-dashboard";
import { useStore } from "@/components/store/store-provider";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function isRetailReportPage(pathname: string) {
  return (
    pathname === "/report/shift-report" ||
    /^\/report\/shift-report\/[^/]+$/.test(pathname) ||
    pathname === "/report/day-end-report" ||
    /^\/report\/day-end-report\/[^/]+$/.test(pathname) ||
    pathname === "/report/week-end-report" ||
    pathname === "/report/month-end-report" ||
    pathname === "/report/credit-card-transaction" ||
    pathname === "/report/credit-card-transaction/details" ||
    pathname === "/report/monthly-sales-tax" ||
    pathname === "/report/invoice-report"
  );
}

export default function ReportLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { selectedStore } = useStore();
  const retailReportOpen = isRetailReportPage(pathname);
  if (selectedStore?.storeType === "RETAIL" && pathname !== "/report" && !retailReportOpen) {
    return <RetailReports storeName={selectedStore.name} />;
  }
  return children;
}
