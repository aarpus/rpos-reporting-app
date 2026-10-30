"use client";

import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/tailgrids/core/tooltip";
import { useStore } from "@/components/store/store-provider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LuEye, LuFilter } from "react-icons/lu";
import {
  RetailReportDateFilter,
  type RetailAppliedDateFilter,
} from "../../_components/retail-report-date-filter";
import {
  RetailReportTable,
  type RetailReportColumn,
} from "../../_components/retail-report-table";
import {
  filterRetailJournalTransactions,
  formatJournalPrintedAt,
  formatJournalRangeLabel,
  parseRetailJournalFilter,
  retailJournalTransactions,
  serializeRetailJournalFilter,
  sumRetailJournalRows,
  type RetailJournalAppliedFilter,
  type RetailJournalRow,
} from "./retail-transaction-journal-data";

const noRows: RetailJournalRow[] = [];

const inputClass =
  "h-9 w-40 rounded-md border border-card-border bg-card-surface-area px-3 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15";

const printStyles = `
@media print {
  @page { margin: 0; }
  html {
    color-scheme: light !important;
    background: #fff !important;
  }
  html, body {
    height: auto !important;
    overflow: visible !important;
    background: #fff !important;
    color: #111827 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  aside, header, nav, .retail-report-no-print { display: none !important; }
  body, body * {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  body,
  body > div,
  main {
    background: #fff !important;
    color: #111827 !important;
  }
  #retail-transaction-journal-print {
    background: #fff !important;
    color: #111827 !important;
    padding: 12mm !important;
  }
  #retail-transaction-journal-print,
  #retail-transaction-journal-print * {
    color: #111827 !important;
    background-color: #fff !important;
    border-color: #e5e7eb !important;
    box-shadow: none !important;
  }
  #retail-transaction-journal-print .shift-title-bar,
  #retail-transaction-journal-print .shift-title-bar * {
    background-color: #1f2937 !important;
    color: #fff !important;
  }
  #retail-transaction-journal-print thead,
  #retail-transaction-journal-print thead *,
  #retail-transaction-journal-print tfoot,
  #retail-transaction-journal-print tfoot *,
  #retail-transaction-journal-print tr.bg-background-gray-secondary_alt_2,
  #retail-transaction-journal-print tr.bg-background-gray-secondary_alt_2 *,
  #retail-transaction-journal-print .bg-background-gray-secondary_alt_2,
  #retail-transaction-journal-print .bg-background-gray-secondary_alt_2 * {
    background-color: #f3f4f6 !important;
    color: #111827 !important;
  }
}
`;

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-x-3 py-0.5 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-medium text-text-primary">{value}</dd>
    </div>
  );
}

function ViewButton({
  row,
  listQuery,
}: {
  row: RetailJournalRow;
  listQuery: string;
}) {
  const router = useRouter();
  const href = listQuery
    ? `/report/transaction-journal/view/${row.id}?${listQuery}`
    : `/report/transaction-journal/view/${row.id}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label="View"
          iconOnly
          size="xs"
          appearance="outline"
          className="size-8 rounded-md border-card-border bg-background-gray-secondary_alt_2 text-text-secondary shadow-none [&>svg]:size-3.5"
          onPress={() => router.push(href)}
        >
          <LuEye />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="block">
        <p>View</p>
      </TooltipContent>
    </Tooltip>
  );
}

function buildColumns(
  listQuery: string,
): RetailReportColumn<RetailJournalRow>[] {
  return [
    {
      id: "dateTime",
      header: "Date/Time",
      cell: (row) => row.dateTimeLabel,
      cellClassName: "whitespace-nowrap",
    },
    {
      id: "stationId",
      header: "StationID",
      cell: (row) => row.stationId,
      cellClassName: "whitespace-nowrap font-medium text-text-primary",
    },
    {
      id: "transactionNo",
      header: "Transaction#",
      cell: (row) => row.transactionNo,
      cellClassName: "whitespace-nowrap",
    },
    {
      id: "qty",
      header: "Qty",
      headerClassName: "text-right",
      cell: (row) => row.qty,
      cellClassName: "text-right tabular-nums",
    },
    {
      id: "discount",
      header: "Discount",
      headerClassName: "text-right",
      cell: (row) => row.discount,
      cellClassName: "text-right tabular-nums",
    },
    {
      id: "subTotal",
      header: "SubTotal",
      headerClassName: "text-right",
      cell: (row) => row.subTotal,
      cellClassName: "text-right tabular-nums",
    },
    {
      id: "tax",
      header: "Tax",
      headerClassName: "text-right",
      cell: (row) => row.tax,
      cellClassName: "text-right tabular-nums",
    },
    {
      id: "deposit",
      header: "Deposit",
      headerClassName: "text-right",
      cell: (row) => row.deposit,
      cellClassName: "text-right tabular-nums",
    },
    {
      id: "total",
      header: "Total",
      headerClassName: "text-right",
      cell: (row) => row.total,
      cellClassName: "text-right tabular-nums font-medium text-text-primary",
    },
    {
      id: "paidBy",
      header: "PaidBy",
      cell: (row) => row.paidBy || "",
      cellClassName: "whitespace-nowrap",
    },
    {
      id: "cashier",
      header: "Cashier",
      cell: (row) => row.cashier,
      cellClassName: "tabular-nums",
    },
    {
      id: "view",
      header: "View",
      headerClassName: "text-center",
      cell: (row) => <ViewButton row={row} listQuery={listQuery} />,
      cellClassName: "text-center",
    },
  ];
}

function JournalFilterBar({
  applied,
  onApply,
  onClear,
  extraActions,
}: {
  applied: RetailJournalAppliedFilter | null;
  onApply: (filter: RetailJournalAppliedFilter) => void;
  onClear: () => void;
  extraActions?: React.ReactNode;
}) {
  const [transactionNo, setTransactionNo] = useState(
    applied?.transactionNo ?? "",
  );

  function search(date: RetailAppliedDateFilter) {
    onApply({ date, transactionNo });
  }

  function reset() {
    setTransactionNo("");
    onClear();
  }

  return (
    <RetailReportDateFilter
      initialFilter={applied?.date ?? null}
      onSearch={search}
      onReset={reset}
      extraFields={
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm font-normal text-text-secondary">
            Transaction#:
          </span>
          <input
            type="text"
            placeholder="Transaction#"
            value={transactionNo}
            onChange={(event) => setTransactionNo(event.target.value)}
            className={inputClass}
          />
          <Button
            aria-label="More filters"
            iconOnly
            size="sm"
            appearance="outline"
            className="size-9 shrink-0 border-card-border"
            onPress={() => undefined}
          >
            <LuFilter className="size-4" />
          </Button>
        </div>
      }
      extraActions={extraActions}
    />
  );
}

export default function RetailTransactionJournalReport() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selectedStore } = useStore();
  const listQuery = searchParams.toString();

  const urlApplied = useMemo(
    () => parseRetailJournalFilter(new URLSearchParams(listQuery)),
    [listQuery],
  );
  const [syncedQuery, setSyncedQuery] = useState(listQuery);
  const [applied, setApplied] = useState(urlApplied);
  const [printedAt, setPrintedAt] = useState("");
  const [printAllRows, setPrintAllRows] = useState(false);

  if (listQuery !== syncedQuery) {
    setSyncedQuery(listQuery);
    setApplied(urlApplied);
  }

  const filterQuery = applied ? serializeRetailJournalFilter(applied) : "";

  const rows = useMemo(() => {
    if (!applied) return noRows;
    return filterRetailJournalTransactions(retailJournalTransactions, applied);
  }, [applied]);

  const totals = useMemo(() => sumRetailJournalRows(rows), [rows]);
  const hasResults = Boolean(applied) && rows.length > 0;
  const columns = useMemo(() => buildColumns(filterQuery), [filterQuery]);

  useEffect(() => {
    if (!applied) {
      setPrintedAt("");
      return;
    }
    setPrintedAt(formatJournalPrintedAt(new Date()));
  }, [applied]);

  function writeFilter(next: RetailJournalAppliedFilter | null) {
    const qs = next ? serializeRetailJournalFilter(next) : "";
    setApplied(next);
    setSyncedQuery(qs);
    if (!next) {
      router.replace(pathname);
      return;
    }
    router.replace(`${pathname}?${qs}`);
  }

  function openPrintDetail() {
    if (!filterQuery) return;
    router.push(`/report/transaction-journal/print-detail?${filterQuery}`);
  }

  function printSummary() {
    setPrintAllRows(true);
    const previous = document.title;
    document.title = "TRANSACTION JOURNAL SUMMARY";
    const restore = () => {
      document.title = previous;
      setPrintAllRows(false);
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.setTimeout(() => window.print(), 0);
  }

  return (
    <div className="min-h-full pb-6">
      <style>{printStyles}</style>
      <div className="retail-report-no-print flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">
          Transaction Journal Report
        </h1>
        <Breadcrumbs
          dividerType="slash"
          items={[
            { href: "/", label: "Dashboard" },
            {
              href: "/report/transaction-journal",
              label: "Transaction Journal Report",
            },
          ]}
        />
      </div>

      <div className="space-y-4 px-3 sm:px-5">
        <div className="retail-report-no-print">
          <JournalFilterBar
            key={filterQuery || "empty"}
            applied={applied}
            onApply={writeFilter}
            onClear={() => writeFilter(null)}
            extraActions={
              hasResults ? (
                <>
                  <Button
                    size="sm"
                    appearance="outline"
                    className="h-9 px-4"
                    onPress={openPrintDetail}
                  >
                    Print Transaction Detail
                  </Button>
                  <Button
                    size="sm"
                    appearance="outline"
                    className="h-9 px-4"
                    onPress={printSummary}
                  >
                    Print Summary
                  </Button>
                </>
              ) : null
            }
          />
        </div>

        {applied && (
          <div id="retail-transaction-journal-print" className="space-y-4">
            <div className="rounded-lg border border-card-border px-2 py-4">
              <p className="text-center text-sm font-semibold tracking-wide text-text-primary uppercase">
                {selectedStore?.storeCode}
              </p>
              <div className="shift-title-bar mt-3 bg-text-primary px-4 py-2 text-center text-sm font-semibold tracking-wide text-card-surface-area">
                TRANSACTION JOURNAL REPORT
              </div>
              <p className="mt-3 text-center text-sm font-medium text-text-primary">
                {formatJournalRangeLabel(applied.date)}
              </p>
              <div className="mt-4 grid gap-4 border-t border-card-border pt-4 sm:grid-cols-2">
                <dl>
                  <MetaRow label="DateTime :" value={printedAt} />
                  <MetaRow label="Terminal :" value="All" />
                  <MetaRow
                    label="Transaction :"
                    value={
                      applied.transactionNo.trim()
                        ? applied.transactionNo.trim()
                        : "All Transaction"
                    }
                  />
                </dl>
                <dl>
                  <MetaRow label="Employee Name :" value="Acute User" />
                  <MetaRow label="Selected Employee :" value="All" />
                </dl>
              </div>
            </div>

            <RetailReportTable
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              recordLabel="entries"
              minWidthClassName="min-w-[72rem]"
              pageSizeOverride={printAllRows ? Math.max(rows.length, 1) : null}
              emptyMessage="No transactions found for the selected filters. Preview journal rows run through July 2025."
              footerCell={
                rows.length > 0
                  ? (column) => {
                      switch (column.id) {
                        case "dateTime":
                          return "Total:";
                        case "qty":
                          return totals.qty;
                        case "discount":
                          return totals.discount;
                        case "subTotal":
                          return totals.subTotal;
                        case "tax":
                          return totals.tax;
                        case "deposit":
                          return totals.deposit;
                        case "total":
                          return totals.total;
                        default:
                          return null;
                      }
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
