"use client";

import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { reportingQueryKey } from "@/lib/reporting/query-key";
import { sumMonthlySalesTaxRows, type MonthlySalesTaxRow } from "@/lib/reporting/retail-monthly-sales-tax";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { LuUpload } from "react-icons/lu";
import { RetailMonthYearFilter } from "../../_components/retail-month-year-filter";

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
  #retail-monthly-sales-tax-print, #retail-monthly-sales-tax-print * {
    color: #111827 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  #retail-monthly-sales-tax-print {
    background: #fff !important;
    padding: 12mm !important;
  }
  #retail-monthly-sales-tax-print .shift-title-bar,
  #retail-monthly-sales-tax-print .shift-title-bar * {
    background: #1f2937 !important;
    color: #fff !important;
  }
  #retail-monthly-sales-tax-print thead,
  #retail-monthly-sales-tax-print thead * {
    background: #f3f4f6 !important;
    color: #111827 !important;
  }
  #retail-monthly-sales-tax-print section {
    background: #fff !important;
    border-color: #e5e7eb !important;
    break-inside: avoid;
  }
}
`;

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type MonthlySalesTaxResponse = {
  employeeName: string;
  columns: string[];
  rows: MonthlySalesTaxRow[];
  error?: string;
};

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

export default function RetailMonthlySalesTaxReport() {
  const { selectedStore } = useStore();
  const [appliedMonthId, setAppliedMonthId] = useState<string | null>(null);
  const [printedAt, setPrintedAt] = useState("");
  const storeCode = selectedStore?.storeCode ?? "";
  const report = useQuery({
    queryKey: reportingQueryKey(storeCode, { report: "monthly-sales-tax", month: appliedMonthId }),
    enabled: Boolean(storeCode && appliedMonthId),
    queryFn: async ({ signal }): Promise<MonthlySalesTaxResponse> => {
      const params = new URLSearchParams({
        store_code: storeCode,
        month: appliedMonthId ?? "",
      });
      const response = await fetch(`/api/reporting/retail/monthly-sales-tax?${params}`, { signal, cache: "no-store" });
      const body = (await response.json()) as MonthlySalesTaxResponse;
      if (!response.ok) throw new Error(body.error ?? "Unable to load monthly sales and tax.");
      return body;
    },
  });

  useEffect(() => {
    setPrintedAt(formatPrintedAt(new Date()));
  }, [appliedMonthId]);

  const grid = useMemo(() => {
    const columns = report.data?.columns ?? [];
    const rows = report.data?.rows ?? [];
    if (columns.length === 0) return null;
    return {
      employeeName: report.data?.employeeName ?? "",
      columns,
      rows: [
        ...rows,
        { cells: ["Total", ...sumMonthlySalesTaxRows(rows)], emphasize: true },
      ],
    };
  }, [report.data]);

  function exportPdf() {
    if (!grid) return;
    const previous = document.title;
    document.title = "MONTHLY SALES AND TAX REPORT";
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
        <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">
          Monthly Sales And Tax Report
        </h1>
        <Breadcrumbs
          dividerType="slash"
          items={[
            { href: "/", label: "Dashboard" },
            {
              href: "/report/monthly-sales-tax",
              label: "Monthly Sales And Tax Report",
            },
          ]}
        />
      </div>

      <div className="space-y-4 px-3 sm:px-5">
        <RetailMonthYearFilter
          onSearch={setAppliedMonthId}
          onReset={() => setAppliedMonthId(null)}
        />

        {appliedMonthId === null ? (
          <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">
              Select a year and month, then search the report.
            </p>
          </div>
        ) : report.error ? (
          <div role="alert" className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-error-500">{report.error.message}</p>
            <Button size="xs" appearance="outline" className="mt-3" onPress={() => void report.refetch()}>
              Retry
            </Button>
          </div>
        ) : report.isFetching && !grid ? (
          <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">Loading monthly sales and tax.</p>
          </div>
        ) : !grid ? (
          <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">
              No monthly sales and tax data found for the selected month.
            </p>
          </div>
        ) : (
          <div id="retail-monthly-sales-tax-print" className="space-y-4">
            <div className="retail-report-no-print flex justify-end">
              <Button
                appearance="outline"
                size="sm"
                className="w-fit gap-1.5"
                onPress={exportPdf}
              >
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
                  MONTHLY SALES AND TAX REPORT
                </div>
                <div className="mt-3 flex flex-col gap-1 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
                  <p>Date & Time: {printedAt}</p>
                  <p>
                    Employee Name:{" "}
                    <span className="font-medium text-text-primary">
                      {grid.employeeName}
                    </span>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border-t border-card-border">
                <table className="w-max min-w-full text-left text-sm">
                  <thead className="bg-background-gray-secondary_alt_2">
                    <tr>
                      {grid.columns.map((label, index) => (
                        <th
                          key={`${label}-${index}`}
                          className={cn(
                            "px-3 py-2 text-xs font-semibold whitespace-nowrap text-text-secondary",
                            index > 0 && "text-right",
                          )}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grid.rows.map((row, rowIndex) => (
                      <tr
                        key={`${row.cells[0]}-${rowIndex}`}
                        className={cn(
                          "border-t border-card-border",
                          row.emphasize &&
                            "bg-background-gray-secondary_alt_2 font-semibold text-text-primary",
                        )}
                      >
                        {row.cells.map((value, index) => (
                          <td
                            key={`${rowIndex}-${index}`}
                            className={cn(
                              "px-3 py-2 whitespace-nowrap tabular-nums text-text-secondary",
                              index === 0 && "text-left text-text-primary",
                              index > 0 && "text-right",
                              row.emphasize && "text-text-primary",
                            )}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
