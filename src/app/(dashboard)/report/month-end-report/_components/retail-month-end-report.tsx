"use client";

import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { cn } from "@/utils/cn";
import { useEffect, useState, type ReactNode } from "react";
import { LuUpload } from "react-icons/lu";
import { RetailMonthYearFilter } from "../../_components/retail-month-year-filter";
import {
  retailMonthEndDetailForMonth,
  type RetailMonthEndDepartment,
  type RetailMonthEndLine,
  type RetailMonthEndTax,
} from "./retail-month-end-data";

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

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-card-border bg-card-surface-area">
      <h2 className="border-b border-card-border px-4 py-2 text-xs font-semibold tracking-wide text-text-primary uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Lines({ rows }: { rows: RetailMonthEndLine[] }) {
  return (
    <dl>
      {rows.map((row, index) => (
        <div
          key={`${row.label}-${index}`}
          className={cn(
            "flex items-baseline justify-between gap-4 px-4 py-1.5 text-sm",
            row.emphasize && "font-semibold text-text-primary",
            row.divider && "border-t border-card-border",
          )}
        >
          <dt className={row.emphasize ? "text-text-primary" : "text-text-secondary"}>
            {row.label}
          </dt>
          <dd className="tabular-nums text-text-primary">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const headCell =
  "px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-text-secondary";
const bodyCell =
  "px-3 py-2 text-sm whitespace-nowrap text-text-secondary tabular-nums";

function DepartmentTable({
  rows,
  total,
}: {
  rows: RetailMonthEndDepartment[];
  total: RetailMonthEndDepartment;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem]">
        <thead className="bg-background-gray-secondary_alt_2">
          <tr>
            {[
              "Trans#",
              "Department Name",
              "Quantity",
              "Disc(AMT)($)",
              "Disc(%)",
              "Sub Total($)",
              "Tax($)",
              "Total Amount($)",
              "Dept Sales(%)",
            ].map((label) => (
              <th
                key={label}
                className={cn(
                  headCell,
                  label !== "Department Name" && label !== "Trans#" && "text-right",
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.trans}-${row.name}`} className="border-t border-card-border">
              <td className={bodyCell}>{row.trans}</td>
              <td className={cn(bodyCell, "text-text-primary")}>{row.name}</td>
              <td className={cn(bodyCell, "text-right")}>{row.quantity}</td>
              <td className={cn(bodyCell, "text-right")}>{row.discountAmount}</td>
              <td className={cn(bodyCell, "text-right")}>{row.discountPercent}</td>
              <td className={cn(bodyCell, "text-right")}>{row.subTotal}</td>
              <td className={cn(bodyCell, "text-right")}>{row.tax}</td>
              <td className={cn(bodyCell, "text-right")}>{row.total}</td>
              <td className={cn(bodyCell, "text-right")}>{row.share}</td>
            </tr>
          ))}
          <tr className="border-t border-card-border font-semibold text-text-primary">
            <td className={bodyCell} />
            <td className={cn(bodyCell, "text-text-primary")}>{total.name}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.quantity}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.discountAmount}
            </td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.discountPercent}
            </td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.subTotal}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.tax}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.total}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.share}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TaxTable({
  rows,
  total,
}: {
  rows: RetailMonthEndTax[];
  total: RetailMonthEndTax;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem]">
        <thead className="bg-background-gray-secondary_alt_2">
          <tr>
            {[
              "TaxName",
              "Qty",
              "TaxRate",
              "Taxable Amount($)",
              "Tax Amount($)",
              "Tax Sales(%)",
            ].map((label) => (
              <th
                key={label}
                className={cn(headCell, label !== "TaxName" && "text-right")}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-card-border">
              <td className={cn(bodyCell, "text-text-primary")}>{row.name}</td>
              <td className={cn(bodyCell, "text-right")}>{row.quantity}</td>
              <td className={cn(bodyCell, "text-right")}>{row.rate}</td>
              <td className={cn(bodyCell, "text-right")}>{row.taxable}</td>
              <td className={cn(bodyCell, "text-right")}>{row.tax}</td>
              <td className={cn(bodyCell, "text-right")}>{row.share}</td>
            </tr>
          ))}
          <tr className="border-t border-card-border font-semibold text-text-primary">
            <td className={cn(bodyCell, "text-text-primary")}>{total.name}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.quantity}</td>
            <td className={bodyCell} />
            <td className={bodyCell} />
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.tax}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.share}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function RetailMonthEndReport() {
  const { selectedStore } = useStore();
  const [appliedMonthId, setAppliedMonthId] = useState<string | null>(null);
  const [printedAt, setPrintedAt] = useState("");

  useEffect(() => {
    setPrintedAt(formatPrintedAt(new Date()));
  }, [appliedMonthId]);

  const detail = appliedMonthId
    ? retailMonthEndDetailForMonth(appliedMonthId)
    : null;

  function exportPdf() {
    if (!detail) return;
    const previous = document.title;
    document.title = `MONTH END REPORT ${detail.titleRange}`;
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
            <p className="mt-1 text-[11px] text-text-tertiary">
              Preview data is available for July 2025.
            </p>
          </div>
        ) : !detail ? (
          <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">
              No month-end data found for the selected month.
            </p>
            <p className="mt-1 text-[11px] text-text-tertiary">
              Preview data is available for July 2025.
            </p>
          </div>
        ) : (
          <div id="retail-month-end-print" className="space-y-4">
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

            <div className="rounded-lg border border-card-border px-2 py-4">
              <p className="text-center text-sm font-semibold tracking-wide text-text-primary uppercase">
                {selectedStore?.storeCode}
              </p>
              <div className="shift-title-bar mt-3 bg-text-primary px-4 py-2 text-center text-sm font-semibold tracking-wide text-card-surface-area">
                MONTH END REPORT {detail.titleRange}
              </div>
              <div className="mt-3 flex flex-col gap-1 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
                <p>Date & Time: {printedAt}</p>
                <p>
                  Employee Name:{" "}
                  <span className="font-medium text-text-primary">
                    {detail.employeeName}
                  </span>
                </p>
              </div>
            </div>

            <Panel title="Department Sales Detail">
              <DepartmentTable
                rows={detail.departments}
                total={detail.departmentTotal}
              />
            </Panel>

            <div className="grid items-start gap-4 lg:grid-cols-2">
              <section className="overflow-hidden rounded-lg border border-card-border bg-card-surface-area">
                <Lines rows={detail.summary} />
              </section>
              <Panel title="Sales Breakdown">
                <Lines rows={detail.salesBreakdown} />
              </Panel>
            </div>

            <Panel title="Tax Detail">
              <TaxTable rows={detail.taxes} total={detail.taxTotal} />
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
