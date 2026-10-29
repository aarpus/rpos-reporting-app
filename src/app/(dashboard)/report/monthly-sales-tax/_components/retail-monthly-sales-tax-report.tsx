"use client";

import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";
import { LuUpload } from "react-icons/lu";
import { RetailMonthYearFilter } from "../../_components/retail-month-year-filter";
import {
  retailMonthlySalesTaxForMonth,
  type RetailMonthlySalesTaxRow,
} from "./retail-monthly-sales-tax-data";

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

const TABLE_HEADERS = [
  "Date",
  "Total Sales",
  "Net Sales",
  "Total Tax",
  "Deposit Amount",
  "Cash",
  "Cheque",
  "Card",
  "Account",
  "StoreCredit",
  "Giftcard",
  "Sales Tax TaxableAmt",
  "Sales Tax TaxAmt",
  "Lequer Tax TaxableAmt",
  "Lequer Tax TaxAmt",
  "Cgst TaxableAmt",
  "Cgst TaxAmt",
  "No Tax TaxableAmt",
  "Norfolk TaxableAmt",
  "Norfolk TaxAmt",
] as const;

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

function rowValues(row: RetailMonthlySalesTaxRow) {
  return [
    row.date,
    row.totalSales,
    row.netSales,
    row.totalTax,
    row.depositAmount,
    row.cash,
    row.cheque,
    row.card,
    row.account,
    row.storeCredit,
    row.giftcard,
    row.salesTaxTaxable,
    row.salesTaxAmt,
    row.lequerTaxTaxable,
    row.lequerTaxAmt,
    row.cgstTaxable,
    row.cgstTaxAmt,
    row.noTaxTaxable,
    row.norfolkTaxable,
    row.norfolkTaxAmt,
  ];
}

export default function RetailMonthlySalesTaxReport() {
  const { selectedStore } = useStore();
  const [appliedMonthId, setAppliedMonthId] = useState<string | null>(null);
  const [printedAt, setPrintedAt] = useState("");

  useEffect(() => {
    setPrintedAt(formatPrintedAt(new Date()));
  }, [appliedMonthId]);

  const detail = appliedMonthId
    ? retailMonthlySalesTaxForMonth(appliedMonthId)
    : null;

  function exportPdf() {
    if (!detail) return;
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
            <p className="mt-1 text-[11px] text-text-tertiary">
              Preview data is available for July 2025.
            </p>
          </div>
        ) : !detail ? (
          <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">
              No monthly sales and tax data found for the selected month.
            </p>
            <p className="mt-1 text-[11px] text-text-tertiary">
              Preview data is available for July 2025.
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
                      {detail.employeeName}
                    </span>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border-t border-card-border">
                <table className="w-full min-w-[96rem] text-left text-sm">
                  <thead className="bg-background-gray-secondary_alt_2">
                    <tr>
                      {TABLE_HEADERS.map((label) => (
                        <th
                          key={label}
                          className={cn(
                            "px-3 py-2 text-xs font-semibold whitespace-nowrap text-text-secondary",
                            label !== "Date" && "text-right",
                          )}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.rows.map((row) => {
                      const values = rowValues(row);
                      return (
                        <tr
                          key={row.date}
                          className={cn(
                            "border-t border-card-border",
                            row.emphasize &&
                              "bg-background-gray-secondary_alt_2 font-semibold text-text-primary",
                          )}
                        >
                          {values.map((value, index) => (
                            <td
                              key={`${row.date}-${TABLE_HEADERS[index]}`}
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
                      );
                    })}
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
