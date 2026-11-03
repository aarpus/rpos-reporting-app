"use client";

import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { reportingQueryKey } from "@/lib/reporting/query-key";
import { formatNoUpcStamp, groupNoUpcRows, type NoUpcRecord } from "@/lib/reporting/retail-noupc";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { LuUpload } from "react-icons/lu";
import {
  RetailReportDateFilter,
  type RetailAppliedDateFilter,
} from "../../_components/retail-report-date-filter";

const printStyles = `
@media print {
  @page { margin: 0; }
  html, body {
    height: auto !important;
    overflow: visible !important;
    background: #fff !important;
  }
  aside, header, nav, .retail-report-no-print { display: none !important; }
  body, body div {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    box-shadow: none !important;
  }
  #retail-no-upc-print, #retail-no-upc-print * {
    color: #111827 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  #retail-no-upc-print {
    background: #fff !important;
    padding: 12mm !important;
  }
  #retail-no-upc-print .shift-title-bar,
  #retail-no-upc-print .shift-title-bar * {
    background: #1f2937 !important;
    color: #fff !important;
  }
  #retail-no-upc-print thead,
  #retail-no-upc-print thead * {
    background: #f3f4f6 !important;
    color: #111827 !important;
  }
  #retail-no-upc-print .no-upc-department,
  #retail-no-upc-print .no-upc-department * {
    background: #f0fdf4 !important;
    color: #166534 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  #retail-no-upc-print .no-upc-subtotal,
  #retail-no-upc-print .no-upc-subtotal * {
    background: #fffbeb !important;
    color: #111827 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  #retail-no-upc-print section {
    background: #fff !important;
    border-color: #e5e7eb !important;
    break-inside: avoid;
  }
}
`;

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const headers = [
  "Department",
  "Transaction No",
  "Product Name",
  "Sold Qty",
  "Retail Price",
  "Discount",
  "Subtotal",
  "Tax",
  "Total Amount",
  "Member Name",
  "Station Name",
  "Transaction Date",
  "Employee User",
] as const;

const moneyHeaders = new Set(["Retail Price", "Discount", "Subtotal", "Tax", "Total Amount"]);

type NoUpcResponse = {
  timezone: string;
  rows: NoUpcRecord[];
  error?: string;
};

function filterBounds(applied: RetailAppliedDateFilter) {
  if (applied.kind === "single") return { from: applied.date, to: applied.date };
  const from = applied.from.compare(applied.to) <= 0 ? applied.from : applied.to;
  const to = applied.from.compare(applied.to) <= 0 ? applied.to : applied.from;
  return { from, to };
}

function formatPrintedAt(date: Date) {
  const month = SHORT_MONTHS[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const hours24 = date.getHours();
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours = String(hours24 % 12 || 12).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${month}-${day}-${date.getFullYear()} ${hours}:${minutes}:${seconds} ${meridiem}`;
}

function lineCells(row: NoUpcRecord, timezone: string) {
  return [
    row.department,
    row.transaction_no,
    row.product_name,
    row.sold_qty,
    row.retail_price,
    row.discount,
    row.subtotal,
    row.tax,
    row.total_amount,
    row.member_name,
    row.station_name,
    formatNoUpcStamp(row.transaction_datetime, timezone),
    row.employee_user,
  ];
}

export default function RetailNoUpcDetailReport() {
  const { data: session } = useSession();
  const { selectedStore } = useStore();
  const [applied, setApplied] = useState<RetailAppliedDateFilter | null>(null);
  const [printedAt, setPrintedAt] = useState("");
  const storeCode = selectedStore?.storeCode ?? "";
  const range = applied ? filterBounds(applied) : null;
  const report = useQuery({
    queryKey: reportingQueryKey(storeCode, { report: "no-upc-detail", range }),
    enabled: Boolean(storeCode && range),
    queryFn: async ({ signal }): Promise<NoUpcResponse> => {
      const params = new URLSearchParams({
        store_code: storeCode,
        from: range?.from.toString() ?? "",
        to: range?.to.toString() ?? "",
      });
      const response = await fetch(`/api/reporting/retail/no-upc-detail?${params}`, { signal, cache: "no-store" });
      const body = (await response.json()) as NoUpcResponse;
      if (!response.ok) throw new Error(body.error ?? "Unable to load the NoUPC report.");
      return body;
    },
  });

  useEffect(() => {
    setPrintedAt(formatPrintedAt(new Date()));
  }, [applied]);

  const timezone = report.data?.timezone ?? selectedStore?.timezone ?? "UTC";
  const groups = useMemo(() => groupNoUpcRows(report.data?.rows ?? []), [report.data?.rows]);
  const employeeName = session?.user?.name?.trim() || "—";

  function exportPdf() {
    if (groups.length === 0) return;
    const previous = document.title;
    document.title = "NO UPC REPORT";
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  return (
    <div className="min-h-full pb-6">
      <style>{printStyles}</style>
      <div className="retail-report-no-print flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">NoUPC Details Report</h1>
        <Breadcrumbs
          dividerType="slash"
          items={[
            { href: "/", label: "Dashboard" },
            { href: "/report/no-upc-detail", label: "NoUPC Details Report" },
          ]}
        />
      </div>

      <div className="space-y-4 px-3 sm:px-5">
        <div className="retail-report-no-print">
          <RetailReportDateFilter onSearch={setApplied} onReset={() => setApplied(null)} />
        </div>

        {applied === null ? (
          <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">Search a date to see the report.</p>
          </div>
        ) : report.error ? (
          <div role="alert" className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-error-500">{report.error.message}</p>
            <Button size="xs" appearance="outline" className="mt-3" onPress={() => void report.refetch()}>
              Retry
            </Button>
          </div>
        ) : report.isFetching && groups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">Loading the NoUPC report.</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">No NoUPC lines found for the selected date.</p>
          </div>
        ) : (
          <div id="retail-no-upc-print" className="space-y-4">
            <div className="retail-report-no-print flex justify-end">
              <Button appearance="outline" size="sm" className="w-fit gap-1.5" onPress={exportPdf}>
                <LuUpload />
                Export
              </Button>
            </div>

            <section className="overflow-hidden rounded-lg border border-card-border bg-card-surface-area">
              <div className="px-2 py-4">
                <p className="text-center text-sm font-semibold tracking-wide text-text-primary uppercase">
                  {selectedStore?.storeCode}
                </p>
                <div className="shift-title-bar mt-3 bg-text-primary px-4 py-2 text-center text-sm font-semibold tracking-wide text-card-surface-area">
                  NO UPC REPORT
                </div>
                <div className="mt-3 flex flex-col gap-1 px-2 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
                  <p>Date Time: {printedAt}</p>
                  <p>
                    Employee Name: <span className="font-medium text-text-primary">{employeeName}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t border-card-border p-3">
                {groups.map((group) => (
                  <div key={group.department} className="overflow-hidden rounded-md border border-card-border">
                    <div className="no-upc-department bg-badge-success-background px-3 py-2 text-sm font-semibold text-badge-success-icon-color">
                      {group.department}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-max min-w-full text-left text-sm">
                        <thead className="bg-background-gray-secondary_alt_2">
                          <tr>
                            {headers.map((label) => (
                              <th
                                key={label}
                                className={cn(
                                  "px-3 py-2 text-xs font-semibold whitespace-nowrap text-text-secondary",
                                  moneyHeaders.has(label) && "text-right",
                                )}
                              >
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map((row) => (
                            <tr key={row.id} className="border-t border-card-border">
                              {lineCells(row, timezone).map((value, index) => (
                                <td
                                  key={`${row.id}-${headers[index]}`}
                                  className={cn(
                                    "px-3 py-2 whitespace-nowrap text-text-primary",
                                    moneyHeaders.has(headers[index]) && "text-right tabular-nums",
                                    headers[index] === "Sold Qty" && "text-right tabular-nums",
                                  )}
                                >
                                  {value}
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr className="no-upc-subtotal border-t border-card-border bg-badge-warning-background font-semibold text-text-primary">
                            <td className="px-3 py-2 whitespace-nowrap">Sub Total</td>
                            <td className="px-3 py-2" />
                            <td className="px-3 py-2" />
                            <td className="px-3 py-2" />
                            <td className="px-3 py-2" />
                            <td className="px-3 py-2 text-right tabular-nums">{group.subtotal.discount}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{group.subtotal.subtotal}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{group.subtotal.tax}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{group.subtotal.total_amount}</td>
                            <td className="px-3 py-2" />
                            <td className="px-3 py-2" />
                            <td className="px-3 py-2" />
                            <td className="px-3 py-2" />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
