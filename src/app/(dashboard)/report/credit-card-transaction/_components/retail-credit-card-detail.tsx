"use client";

import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { cn } from "@/utils/cn";
import { CalendarDate, parseDate } from "@internationalized/date";
import { ArrowLeft } from "@tailgrids/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LuUpload } from "react-icons/lu";
import {
  RetailReportTable,
  type RetailReportColumn,
} from "../../_components/retail-report-table";
import {
  cardBrandSummary,
  cardTerminalSummary,
  cardTypeSummary,
  externalPayTerminalSummary,
  externalPayTotalAmount,
  externalPayTypeSummary,
  filterCardTransactions,
  filterExternalPayTransactions,
  retailCardTransactions,
  retailExternalPayTransactions,
  type RetailCardTransaction,
  type RetailExternalPayTransaction,
} from "./retail-credit-card-data";

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
  #retail-credit-card-print, #retail-credit-card-print * {
    color: #111827 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  #retail-credit-card-print {
    background: #fff !important;
    padding: 12mm !important;
  }
  #retail-credit-card-print .shift-title-bar,
  #retail-credit-card-print .shift-title-bar * {
    background: #1f2937 !important;
    color: #fff !important;
  }
  #retail-credit-card-print thead,
  #retail-credit-card-print thead * {
    background: #f3f4f6 !important;
    color: #111827 !important;
  }
  #retail-credit-card-print section {
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

const headCell =
  "px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-text-secondary";
const bodyCell =
  "px-3 py-2 text-sm whitespace-nowrap text-text-secondary tabular-nums";

function SummaryTable({
  headers,
  rows,
}: {
  headers: [string, string, string];
  rows: Array<{ label: string; count: string; amount: string; strong?: boolean }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[20rem]">
        <thead className="bg-background-gray-secondary_alt_2">
          <tr>
            {headers.map((label, index) => (
              <th
                key={label}
                className={cn(headCell, index > 0 && "text-right")}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.label}-${row.count}-${row.amount}`}
              className={cn(
                "border-t border-card-border",
                row.strong && "font-semibold text-text-primary",
              )}
            >
              <td className={cn(bodyCell, "text-text-primary")}>{row.label}</td>
              <td className={cn(bodyCell, "text-right")}>{row.count}</td>
              <td className={cn(bodyCell, "text-right")}>{row.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const transactionColumns: RetailReportColumn<RetailCardTransaction>[] = [
  {
    id: "date",
    header: "Date",
    cell: (row) => row.dateLabel,
    cellClassName: "whitespace-nowrap",
  },
  {
    id: "cardNumber",
    header: "CardNo",
    cell: (row) => row.cardNumber,
    cellClassName: "whitespace-nowrap tabular-nums",
  },
  {
    id: "authCode",
    header: "Auth Code",
    cell: (row) => row.authCode,
    cellClassName: "tabular-nums",
  },
  {
    id: "card",
    header: "Card",
    cell: (row) => row.cardName || "—",
  },
  {
    id: "result",
    header: "Result",
    cell: (row) => row.result,
  },
  {
    id: "amount",
    header: "Amount",
    cell: (row) => row.amount,
    cellClassName: "text-right tabular-nums",
  },
  {
    id: "station",
    header: "Station Name",
    cell: (row) => row.stationName,
    cellClassName: "font-medium whitespace-nowrap text-text-primary",
  },
];

function parseBounds(searchParams: URLSearchParams): {
  from: CalendarDate;
  to: CalendarDate;
} | null {
  const kind = searchParams.get("kind");
  try {
    if (kind === "single") {
      const date = searchParams.get("date");
      if (!date) return null;
      const parsed = parseDate(date);
      return { from: parsed, to: parsed };
    }
    if (kind === "range") {
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      if (!from || !to) return null;
      return { from: parseDate(from), to: parseDate(to) };
    }
  } catch {
    return null;
  }
  return null;
}

export default function RetailCreditCardDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedStore } = useStore();
  const [printedAt, setPrintedAt] = useState("");
  const [query, setQuery] = useState("");

  const bounds = useMemo(
    () => parseBounds(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const cardRows = useMemo(() => {
    if (!bounds) return [] as RetailCardTransaction[];
    return filterCardTransactions(
      retailCardTransactions,
      bounds.from,
      bounds.to,
    );
  }, [bounds]);

  const externalRows = useMemo(() => {
    if (!bounds) return [] as RetailExternalPayTransaction[];
    return filterExternalPayTransactions(
      retailExternalPayTransactions,
      bounds.from,
      bounds.to,
    );
  }, [bounds]);

  const visibleCardRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return cardRows;
    return cardRows.filter((row) =>
      [
        row.dateLabel,
        row.cardName,
        row.cardNumber,
        row.result,
        row.amount,
        row.authCode,
        row.stationName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [cardRows, query]);

  useEffect(() => {
    setPrintedAt(formatPrintedAt(new Date()));
  }, []);

  function exportPdf() {
    const previous = document.title;
    document.title = "CARD TRANSACTION DETAILS REPORT";
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  if (!bounds || cardRows.length === 0) {
    return (
      <div className="min-h-full space-y-4 px-4 py-6 sm:px-6">
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={() => router.push("/report/credit-card-transaction")}
        >
          <ArrowLeft />
          Back
        </Button>
        <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
          <p className="text-sm font-medium text-text-secondary">
            No card transaction details found for the selected date.
          </p>
        </div>
      </div>
    );
  }

  const typeRows = cardTypeSummary(cardRows).map((row) => ({
    ...row,
    strong: row.label === "Total",
  }));
  const terminalRows = cardTerminalSummary(cardRows).map((row) => ({
    ...row,
    strong: row.label === "Total",
  }));
  const brandRows = cardBrandSummary(cardRows);
  const externalTypeRows = externalPayTypeSummary(externalRows).map((row) => ({
    ...row,
    strong: row.label === "Total",
  }));
  const externalTerminalRows = externalPayTerminalSummary(externalRows).map(
    (row) => ({
      ...row,
      strong: row.label === "Total",
    }),
  );

  return (
    <div id="retail-credit-card-print" className="min-h-full px-4 py-4 sm:px-6">
      <style>{printStyles}</style>
      <div className="retail-report-no-print mb-4 flex items-center justify-between gap-3">
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={() => router.push("/report/credit-card-transaction")}
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

      <div className="rounded-lg border border-card-border px-2 py-4">
        <p className="text-center text-sm font-semibold tracking-wide text-text-primary uppercase">
          {selectedStore?.storeCode}
        </p>
        <div className="shift-title-bar mt-3 bg-text-primary px-4 py-2 text-center text-sm font-semibold tracking-wide text-card-surface-area">
          CARD TRANSACTION DETAILS REPORT
        </div>
        <div className="mt-3 flex flex-col gap-1 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>Date & Time: {printedAt}</p>
          <p>
            Employee Name:{" "}
            <span className="font-medium text-text-primary">Acute User</span>
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <div className="retail-report-no-print flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-text-primary">
              Card Transactions
            </h2>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              Search:
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 w-44 rounded-md border border-card-border bg-card-surface-area px-3 text-sm text-text-primary outline-none focus:ring-4 focus:ring-primary-500/15"
                placeholder="Search"
              />
            </label>
          </div>
          <RetailReportTable
            columns={transactionColumns}
            rows={visibleCardRows}
            rowKey={(row) => row.id}
            recordLabel="entries"
            minWidthClassName="min-w-[48rem]"
            emptyMessage="No card transactions match the search."
          />
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Panel title="Card Transactions">
            <SummaryTable
              headers={["Transaction Type", "Count", "Amount($)"]}
              rows={typeRows}
            />
          </Panel>
          <Panel title="Card Transactions by Terminal">
            <SummaryTable
              headers={[
                "Station Name",
                "Transaction Count",
                "Transaction Amount($)",
              ]}
              rows={terminalRows}
            />
          </Panel>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Panel title="Summary Report">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem]">
                <thead className="bg-background-gray-secondary_alt_2">
                  <tr>
                    {["Card Name", "Total Transaction", "Total($)"].map(
                      (label, index) => (
                        <th
                          key={label}
                          className={cn(headCell, index > 0 && "text-right")}
                        >
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {brandRows.map((row, index) => {
                    const showGroup =
                      !row.isTotal &&
                      !row.isSubtotal &&
                      (index === 0 || brandRows[index - 1]?.group !== row.group);
                    const label = row.isTotal
                      ? row.name
                      : row.isSubtotal
                        ? `SubTotal`
                        : row.name;
                    return (
                      <tr
                        key={`${row.group}-${row.name}-${index}`}
                        className={cn(
                          "border-t border-card-border",
                          (row.isSubtotal || row.isTotal) &&
                            "font-semibold text-text-primary",
                        )}
                      >
                        <td className={cn(bodyCell, "text-text-primary")}>
                          {showGroup ? (
                            <span>
                              <span className="font-semibold">{row.group}</span>
                              {" / "}
                              {label}
                            </span>
                          ) : (
                            label
                          )}
                        </td>
                        <td className={cn(bodyCell, "text-right")}>{row.count}</td>
                        <td className={cn(bodyCell, "text-right")}>{row.amount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="External Pay Transactions">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem]">
                <thead className="bg-background-gray-secondary_alt_2">
                  <tr>
                    {[
                      "Date/Time",
                      "Transaction Type",
                      "Amount($)",
                      "Station Name",
                    ].map((label, index) => (
                      <th
                        key={label}
                        className={cn(headCell, index === 2 && "text-right")}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {externalRows.map((row) => (
                    <tr key={row.id} className="border-t border-card-border">
                      <td className={bodyCell}>{row.dateLabel}</td>
                      <td className={cn(bodyCell, "text-text-primary")}>
                        {row.type}
                      </td>
                      <td className={cn(bodyCell, "text-right")}>{row.amount}</td>
                      <td className={bodyCell}>{row.stationName}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-card-border font-semibold text-text-primary">
                    <td className={bodyCell} />
                    <td className={cn(bodyCell, "text-text-primary")}>Total</td>
                    <td className={cn(bodyCell, "text-right")}>
                      {externalPayTotalAmount(externalRows)}
                    </td>
                    <td className={bodyCell} />
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Panel title="Total External Pay Transactions">
            <SummaryTable
              headers={["Transaction Type", "Count", "Amount($)"]}
              rows={externalTypeRows}
            />
          </Panel>
          <Panel title="External Pay Transactions by Terminal">
            <SummaryTable
              headers={[
                "Station Name",
                "Transaction Count",
                "Transaction Amount($)",
              ]}
              rows={externalTerminalRows}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
