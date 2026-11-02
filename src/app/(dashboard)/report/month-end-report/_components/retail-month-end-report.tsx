"use client";

import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { reportingQueryKey } from "@/lib/reporting/query-key";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LuUpload } from "react-icons/lu";
import { RetailMonthYearFilter } from "../../_components/retail-month-year-filter";
import {
  RetailPeriodSummary,
  type DayEndBatch,
} from "../../day-end-report/_components/retail-day-end-detail";

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
  #retail-month-end-print, #retail-month-end-print * {
    color: #111827 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  #retail-month-end-print {
    background: #fff !important;
    padding: 12mm !important;
  }
  #retail-month-end-print .shift-title-bar,
  #retail-month-end-print .shift-title-bar * {
    background: #1f2937 !important;
    color: #fff !important;
  }
  #retail-month-end-print thead,
  #retail-month-end-print thead * {
    background: #f3f4f6 !important;
    color: #111827 !important;
  }
  #retail-month-end-print section {
    background: #fff !important;
    border-color: #e5e7eb !important;
    break-inside: avoid;
  }
}
`;

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

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function monthRange(monthId: string) {
  const [yearText, monthText] = monthId.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const last = new Date(year, month, 0).getDate();
  const stamp = `${yearText}-${monthText}`;
  return {
    from: `${stamp}-01`,
    to: `${stamp}-${String(last).padStart(2, "0")}`,
    title: `${MONTH_NAMES[month - 1] ?? monthId} ${yearText}`,
  };
}

export default function RetailMonthEndReport() {
  const { selectedStore } = useStore();
  const [appliedMonthId, setAppliedMonthId] = useState<string | null>(null);
  const [printedAt, setPrintedAt] = useState("");
  const applied = appliedMonthId ? monthRange(appliedMonthId) : null;
  const storeCode = selectedStore?.storeCode ?? "";
  const report = useQuery({
    queryKey: reportingQueryKey(storeCode, { report: "month-end", applied }),
    enabled: Boolean(storeCode && applied),
    queryFn: async ({ signal }): Promise<{ timezone: string; rows: DayEndBatch[] }> => {
      const params = new URLSearchParams({
        store_code: storeCode,
        from: applied?.from ?? "",
        to: applied?.to ?? "",
      });
      const response = await fetch(`/api/reporting/retail/day-end?${params}`, { signal, cache: "no-store" });
      const body = (await response.json()) as { timezone: string; rows: DayEndBatch[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load this month.");
      return body;
    },
  });

  useEffect(() => {
    setPrintedAt(formatPrintedAt(new Date()));
  }, [appliedMonthId]);

  const rows = report.data?.rows ?? [];

  function exportPdf() {
    if (!applied || !rows.length) return;
    const previous = document.title;
    document.title = `MONTH END REPORT ${applied.title}`;
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
          Month End Report
        </h1>
        <Breadcrumbs
          dividerType="slash"
          items={[
            { href: "/", label: "Dashboard" },
            { href: "/report/month-end-report", label: "Month End Report" },
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
        ) : report.isFetching ? (
          <p className="text-sm text-text-secondary">Loading the report.</p>
        ) : report.error ? (
          <div role="alert" className="text-sm text-error-500">
            {report.error.message}{" "}
            <Button size="xs" appearance="outline" onPress={() => void report.refetch()}>
              Retry
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">
              No day-end data found for the selected month.
            </p>
          </div>
        ) : (
          <div id="retail-month-end-print" className="space-y-4">
            <div className="retail-report-no-print flex justify-end">
              <Button appearance="outline" size="sm" className="w-fit gap-1.5" onPress={exportPdf}>
                <LuUpload />
                Export
              </Button>
            </div>
            <div className="rounded-lg border border-card-border px-2 py-4">
              <p className="text-center text-sm font-semibold tracking-wide text-text-primary uppercase">
                {selectedStore?.storeCode}
              </p>
              <div className="shift-title-bar mt-3 bg-text-primary px-4 py-2 text-center text-sm font-semibold tracking-wide text-card-surface-area">
                MONTH END REPORT {applied?.title}
              </div>
              <p className="mt-3 text-sm text-text-secondary">Date & Time: {printedAt}</p>
            </div>
            <RetailPeriodSummary rows={rows} />
          </div>
        )}
      </div>
    </div>
  );
}
