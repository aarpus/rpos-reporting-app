"use client";

import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { reportingQueryKey } from "@/lib/reporting/query-key";
import { cn } from "@/utils/cn";
import { ArrowLeft } from "@tailgrids/icons";
import { useQuery } from "@tanstack/react-query";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LuUpload } from "react-icons/lu";
import {
  type RetailDayEndDepartment,
  type RetailDayEndLine,
  type RetailDayEndTax,
} from "./retail-day-end-data";
import { formatShiftStamp, formatShiftTitle } from "../../shift-report/_components/retail-shift-data";
import { sumDayEndPeriod } from "./sum-day-end-period";

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
      {rows.map((row, index) => (
        <div
          key={`${row.label}-${index}`}
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

function AmountTable({ rows, total }: { rows: RetailDayEndLine[]; total: string }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-background-gray-secondary_alt_2 text-xs text-text-secondary">
        <tr>
          <th className="px-4 py-2 text-left font-semibold">Reference</th>
          <th className="px-4 py-2 text-right font-semibold">Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.label}-${index}`} className="border-t border-card-border">
            <td className="px-4 py-2 text-text-secondary">{row.label}</td>
            <td className="px-4 py-2 text-right tabular-nums text-text-primary">{row.value}</td>
          </tr>
        ))}
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
  total: RetailDayEndDepartment | null;
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
          {total ? (
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
          ) : null}
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
  total: RetailDayEndTax | null;
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
          {total ? (
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
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export type DayEndBatch = {
  id: string;
  batch_number: number;
  start_date_time: string;
  end_date_time: string | null;
  status: "Open" | "Close";
  employeename: string | null;
  department_sales: { rows: RetailDayEndDepartment[]; total: RetailDayEndDepartment | null };
  sales_summary: RetailDayEndLine[];
  cash_status: RetailDayEndLine[];
  sales_breakdown: RetailDayEndLine[];
  paid_out: { rows: RetailDayEndLine[]; total: string };
  paid_in: { rows: RetailDayEndLine[]; total: string };
  tax_detail: { rows: RetailDayEndTax[]; total: RetailDayEndTax | null };
  cash_acceptor: Array<{
    name: string;
    openingRecycler: string;
    closingRecycler: string;
    openingCashbox: string;
    closingCashbox: string;
  }>;
  employee_status: Array<{ name: string; clockIn: string; clockOut: string; total: string }>;
  miscellaneous: Array<{
    terminal: string;
    noSale: string;
    voidCount: string;
    voidAmount: string;
    returnCount: string;
    returnDeposit: string;
    returnTax: string;
    returnAmount: string;
  }>;
  promotion_summary: Array<{
    name: string;
    count: string;
    quantity: string;
    beforeSale: string;
    discount: string;
    afterSale: string;
  }>;
};

export type DayEndPanelDetail = {
  employeeName: string;
  departments: RetailDayEndDepartment[];
  departmentTotal: RetailDayEndDepartment | null;
  summary: RetailDayEndLine[];
  cashStatus: RetailDayEndLine[];
  salesBreakdown: RetailDayEndLine[];
  paidOutRows: RetailDayEndLine[];
  paidOutTotal: string;
  paidInRows: RetailDayEndLine[];
  paidInTotal: string;
  taxes: RetailDayEndTax[];
  taxTotal: RetailDayEndTax | null;
  cashAcceptors: DayEndBatch["cash_acceptor"];
  employees: DayEndBatch["employee_status"];
  miscellaneous: DayEndBatch["miscellaneous"];
  promotions: DayEndBatch["promotion_summary"];
};

const boldLine = /^(net sales|tax paid|gross sales|no of transaction|total|available balance|sales total)\b/i;

function decorate(rows: RetailDayEndLine[]): RetailDayEndLine[] {
  return rows.map((row) => ({
    ...row,
    emphasize: boldLine.test(row.label),
    divider: /^(total|available balance|sales total)\b/i.test(row.label),
  }));
}

export function viewFromDayEnd(batch: DayEndBatch): DayEndPanelDetail {
  return {
    employeeName: batch.employeename ?? "",
    departments: batch.department_sales.rows,
    departmentTotal: batch.department_sales.total,
    summary: decorate(batch.sales_summary),
    cashStatus: decorate(batch.cash_status),
    salesBreakdown: decorate(batch.sales_breakdown),
    paidOutRows: batch.paid_out.rows,
    paidOutTotal: batch.paid_out.total,
    paidInRows: batch.paid_in.rows,
    paidInTotal: batch.paid_in.total,
    taxes: batch.tax_detail.rows,
    taxTotal: batch.tax_detail.total,
    cashAcceptors: batch.cash_acceptor,
    employees: batch.employee_status,
    miscellaneous: batch.miscellaneous,
    promotions: batch.promotion_summary,
  };
}

export function RetailDayEndPanels({ detail }: { detail: DayEndPanelDetail }) {
  return (
    <>
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
            <AmountTable rows={detail.paidOutRows} total={detail.paidOutTotal} />
          </Panel>
          <Panel title="Paid In Detail">
            <AmountTable rows={detail.paidInRows} total={detail.paidInTotal} />
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
    </>
  );
}

type DayEndDetailResponse = { timezone: string; batch: DayEndBatch | null };

export default function RetailDayEndDetail({ id }: { id: string }) {
  const router = useRouter();
  const { selectedStore } = useStore();
  const storeCode = selectedStore?.storeCode ?? "";
  const report = useQuery({
    queryKey: reportingQueryKey(storeCode, { report: "day-end", id }),
    enabled: Boolean(storeCode),
    queryFn: async ({ signal }): Promise<DayEndDetailResponse> => {
      const params = new URLSearchParams({ store_code: storeCode, id });
      const response = await fetch(`/api/reporting/retail/day-end?${params}`, { signal, cache: "no-store" });
      if (response.status === 404) return { timezone: selectedStore?.timezone ?? "UTC", batch: null };
      const body = (await response.json()) as DayEndDetailResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load this batch.");
      return body;
    },
  });
  const batch = report.data?.batch;
  const timezone = report.data?.timezone ?? selectedStore?.timezone ?? "UTC";
  const detail = batch ? viewFromDayEnd(batch) : null;
  const titleDate = batch ? formatShiftTitle(batch.end_date_time ?? batch.start_date_time, timezone) : "";
  const [printedAt, setPrintedAt] = useState("");

  useEffect(() => {
    setPrintedAt(formatPrintedAt(new Date()));
  }, [id]);

  function exportPdf() {
    const previous = document.title;
    document.title = `DAY END REPORT ${titleDate}`;
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  if (report.isSuccess && !batch) notFound();
  if (!batch || !detail) {
    return (
      <div className="px-4 py-4 text-sm text-text-secondary sm:px-6">
        {report.error ? report.error.message : "Loading batch."}
      </div>
    );
  }

  return (
    <div id="retail-day-end-print" className="min-h-full px-4 py-4 sm:px-6">
      <style>{printStyles}</style>
      <div className="retail-report-no-print mb-4 flex items-center justify-between gap-3">
        <Button appearance="outline" size="sm" className="w-fit gap-1.5" onPress={() => router.push("/report/day-end-report")}>
          <ArrowLeft />
          Back
        </Button>
        <Button appearance="outline" size="sm" className="w-fit gap-1.5" onPress={exportPdf}>
          <LuUpload />
          Export
        </Button>
      </div>
      <div className="border border-card-border rounded-lg py-4 px-2">
        <p className="text-center text-sm font-semibold tracking-wide text-text-primary uppercase">{selectedStore?.storeCode}</p>
        <div className="shift-title-bar mt-3 bg-text-primary px-4 py-2 text-center text-sm font-semibold tracking-wide text-card-surface-area">
          DAY END REPORT {titleDate}
        </div>
        <div className="mt-3 flex flex-col gap-1 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>
            Batch #{batch.batch_number} · {formatShiftStamp(batch.start_date_time, timezone)}
            {batch.end_date_time ? ` to ${formatShiftStamp(batch.end_date_time, timezone)}` : ""} · {batch.status}
          </p>
          <p>
            Employee Name: <span className="font-medium text-text-primary">{detail.employeeName}</span>
          </p>
        </div>
        <p className="mt-1 text-sm text-text-secondary">Printed: {printedAt}</p>
      </div>
      <RetailDayEndPanels detail={detail} />
    </div>
  );
}

export function RetailPeriodSummary({ rows }: { rows: DayEndBatch[] }) {
  const summary = sumDayEndPeriod(rows);
  return (
    <div className="space-y-4">
      <Panel title="Department Sales Detail">
        <DepartmentTable rows={summary.departments} total={summary.departmentTotal} />
      </Panel>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-card-border bg-card-surface-area">
          <Lines rows={decorate(summary.summary)} />
        </section>
        <Panel title="Sales Breakdown">
          <Lines rows={decorate(summary.salesBreakdown)} />
        </Panel>
      </div>
      <Panel title="Tax Detail">
        <TaxTable rows={summary.taxes} total={summary.taxTotal} />
      </Panel>
    </div>
  );
}
