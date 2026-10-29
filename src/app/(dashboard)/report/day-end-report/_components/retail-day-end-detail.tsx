"use client";

import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { cn } from "@/utils/cn";
import { ArrowLeft } from "@tailgrids/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LuUpload } from "react-icons/lu";
import {
  retailDayEndDetail,
  type RetailDayEndDepartment,
  type RetailDayEndLine,
  type RetailDayEndTax,
} from "./retail-day-end-data";

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
  #retail-day-end-print, #retail-day-end-print * {
    color: #111827 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  #retail-day-end-print {
    background: #fff !important;
    padding: 12mm !important;
  }
  #retail-day-end-print .shift-title-bar,
  #retail-day-end-print .shift-title-bar * {
    background: #1f2937 !important;
    color: #fff !important;
  }
  #retail-day-end-print thead,
  #retail-day-end-print thead * {
    background: #f3f4f6 !important;
    color: #111827 !important;
  }
  #retail-day-end-print section {
    background: #fff !important;
    border-color: #e5e7eb !important;
    break-inside: avoid;
  }
}
`;

function formatPrintedAt(date: Date) {
  const months = [
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
  ];
  const month = months[date.getMonth()];
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

function Lines({ rows }: { rows: RetailDayEndLine[] }) {
  return (
    <dl>
      {rows.map((row) => (
        <div
          key={row.label}
          className={cn(
            "flex items-baseline justify-between gap-4 px-4 py-1.5 text-sm",
            row.emphasize && "font-semibold text-text-primary",
            row.divider && "border-t border-card-border",
          )}
        >
          <dt
            className={
              row.emphasize ? "text-text-primary" : "text-text-secondary"
            }
          >
            {row.label}
          </dt>
          <dd className="tabular-nums text-text-primary">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function AmountTable({ total }: { total: string }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-background-gray-secondary_alt_2 text-xs text-text-secondary">
        <tr>
          <th className="px-4 py-2 text-left font-semibold">Reference</th>
          <th className="px-4 py-2 text-right font-semibold">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-t border-card-border font-semibold">
          <td className="px-4 py-2">Total</td>
          <td className="px-4 py-2 text-right tabular-nums">{total}</td>
        </tr>
      </tbody>
    </table>
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
  rows: RetailDayEndDepartment[];
  total: RetailDayEndDepartment;
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
                  label !== "Department Name" &&
                    label !== "Trans#" &&
                    "text-right",
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.trans}-${row.name}`}
              className="border-t border-card-border"
            >
              <td className={bodyCell}>{row.trans}</td>
              <td className={cn(bodyCell, "text-text-primary")}>{row.name}</td>
              <td className={cn(bodyCell, "text-right")}>{row.quantity}</td>
              <td className={cn(bodyCell, "text-right")}>
                {row.discountAmount}
              </td>
              <td className={cn(bodyCell, "text-right")}>
                {row.discountPercent}
              </td>
              <td className={cn(bodyCell, "text-right")}>{row.subTotal}</td>
              <td className={cn(bodyCell, "text-right")}>{row.tax}</td>
              <td className={cn(bodyCell, "text-right")}>{row.total}</td>
              <td className={cn(bodyCell, "text-right")}>{row.share}</td>
            </tr>
          ))}
          <tr className="border-t border-card-border font-semibold text-text-primary">
            <td className={bodyCell} />
            <td className={cn(bodyCell, "text-text-primary")}>{total.name}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.quantity}
            </td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.discountAmount}
            </td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.discountPercent}
            </td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.subTotal}
            </td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.tax}
            </td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.total}
            </td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.share}
            </td>
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
  rows: RetailDayEndTax[];
  total: RetailDayEndTax;
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
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.quantity}
            </td>
            <td className={bodyCell} />
            <td className={bodyCell} />
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.tax}
            </td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.share}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function RetailDayEndDetail() {
  const router = useRouter();
  const { selectedStore } = useStore();
  const detail = retailDayEndDetail;
  const [printedAt, setPrintedAt] = useState("");

  useEffect(() => {
    setPrintedAt(formatPrintedAt(new Date()));
  }, []);

  function exportPdf() {
    const previous = document.title;
    document.title = "DAY END REPORT";
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  return (
    <div id="retail-day-end-print" className="min-h-full px-4 py-4 sm:px-6">
      <style>{printStyles}</style>
      <div className="retail-report-no-print mb-4 flex items-center justify-between gap-3">
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={() => router.push("/report/day-end-report")}
        >
          <ArrowLeft />
          Back
        </Button>
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

      <div className="border border-card-border rounded-lg py-4 px-2">
        <p className="text-center text-sm font-semibold tracking-wide text-text-primary uppercase">
          {selectedStore?.storeCode}
        </p>
        <div className="shift-title-bar mt-3 bg-text-primary px-4 py-2 text-center text-sm font-semibold tracking-wide text-card-surface-area">
          DAY END REPORT
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
      <div className="mt-4">
        <Panel title="Department Sales Detail">
          <DepartmentTable
            rows={detail.departments}
            total={detail.departmentTotal}
          />
        </Panel>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-card-border bg-card-surface-area">
          <Lines rows={detail.summary} />
        </section>
        <Panel title="Cash Status">
          <Lines rows={detail.cashStatus} />
        </Panel>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <Panel title="Sales Breakdown">
          <Lines rows={detail.salesBreakdown} />
        </Panel>
        <div className="space-y-4">
          <Panel title="Paid Out Detail">
            <AmountTable total={detail.paidOutTotal} />
          </Panel>
          <Panel title="Paid In Detail">
            <AmountTable total={detail.paidInTotal} />
          </Panel>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <Panel title="Tax Detail">
          <TaxTable rows={detail.taxes} total={detail.taxTotal} />
        </Panel>

        <Panel title="Cash Acceptor Status">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem]">
              <thead className="bg-background-gray-secondary_alt_2">
                <tr>
                  {[
                    "Cash Acceptor Name",
                    "Opening Recycler Balance",
                    "Closing Recycler Balance",
                    "Opening Cashbox Balance",
                    "Closing Cashbox Balance",
                  ].map((label) => (
                    <th
                      key={label}
                      className={cn(
                        headCell,
                        label !== "Cash Acceptor Name" && "text-right",
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail.cashAcceptors.map((row) => (
                  <tr key={row.name} className="border-t border-card-border">
                    <td className={cn(bodyCell, "text-text-primary")}>
                      {row.name}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.openingRecycler}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.closingRecycler}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.openingCashbox}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.closingCashbox}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Employee Status">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem]">
              <thead className="bg-background-gray-secondary_alt_2">
                <tr>
                  {[
                    "Name",
                    "Clock In Time",
                    "Clock Out Time",
                    "Total Time",
                  ].map((label) => (
                    <th key={label} className={headCell}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail.employees.map((row) => (
                  <tr key={row.name} className="border-t border-card-border">
                    <td className={cn(bodyCell, "text-text-primary")}>
                      {row.name}
                    </td>
                    <td className={bodyCell}>{row.clockIn}</td>
                    <td className={bodyCell}>{row.clockOut}</td>
                    <td className={bodyCell}>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Miscellaneous">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem]">
              <thead className="bg-background-gray-secondary_alt_2">
                <tr>
                  {[
                    "Terminal",
                    "No Sale($)",
                    "Void Count",
                    "Void Amount($)",
                    "Return Count",
                    "Return Deposit",
                    "Return Tax($)",
                    "Return Amt($)",
                  ].map((label) => (
                    <th
                      key={label}
                      className={cn(
                        headCell,
                        label !== "Terminal" && "text-right",
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail.miscellaneous.map((row) => (
                  <tr
                    key={row.terminal}
                    className={cn(
                      "border-t border-card-border",
                      row.terminal === "Total" &&
                        "font-semibold text-text-primary",
                    )}
                  >
                    <td className={cn(bodyCell, "text-text-primary")}>
                      {row.terminal}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>{row.noSale}</td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.voidCount}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.voidAmount}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.returnCount}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.returnDeposit}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.returnTax}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.returnAmount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Promotion Summary">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem]">
              <thead className="bg-background-gray-secondary_alt_2">
                <tr>
                  {[
                    "Name",
                    "No time",
                    "Qty",
                    "Before Sale",
                    "Discount",
                    "After Sale",
                  ].map((label) => (
                    <th
                      key={label}
                      className={cn(headCell, label !== "Name" && "text-right")}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail.promotions.map((row) => (
                  <tr
                    key={row.name}
                    className="border-t border-card-border font-semibold text-text-primary"
                  >
                    <td className={cn(bodyCell, "text-text-primary")}>
                      {row.name}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>{row.count}</td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.quantity}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.beforeSale}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.discount}
                    </td>
                    <td className={cn(bodyCell, "text-right")}>
                      {row.afterSale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
