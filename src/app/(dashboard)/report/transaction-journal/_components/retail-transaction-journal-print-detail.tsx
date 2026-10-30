"use client";

import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { useStore } from "@/components/store/store-provider";
import { cn } from "@/utils/cn";
import { ArrowLeft } from "@tailgrids/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuPrinter } from "react-icons/lu";
import {
  formatJournalPrintedAt,
  formatJournalPrintRangeLabel,
  getRetailJournalPrintGroups,
  parseRetailJournalFilter,
  transactionJournalListHref,
  type RetailJournalPrintGroup,
} from "./retail-transaction-journal-data";

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
  #retail-transaction-journal-print-detail {
    background: #fff !important;
    color: #111827 !important;
    padding: 12mm !important;
  }
  #retail-transaction-journal-print-detail,
  #retail-transaction-journal-print-detail * {
    color: #111827 !important;
    background-color: #fff !important;
    border-color: #e5e7eb !important;
    box-shadow: none !important;
  }
  #retail-transaction-journal-print-detail .shift-title-bar,
  #retail-transaction-journal-print-detail .shift-title-bar * {
    background-color: #1f2937 !important;
    color: #fff !important;
  }
  #retail-transaction-journal-print-detail thead,
  #retail-transaction-journal-print-detail thead *,
  #retail-transaction-journal-print-detail .journal-group-header,
  #retail-transaction-journal-print-detail .journal-group-header *,
  #retail-transaction-journal-print-detail .bg-background-gray-secondary_alt_2,
  #retail-transaction-journal-print-detail .bg-background-gray-secondary_alt_2 * {
    background-color: #f3f4f6 !important;
    color: #111827 !important;
  }
}
`;

const pageSizeChoices = [10, 20, 50] as const;

const headCell =
  "px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-text-secondary";
const bodyCell = "px-3 py-2 text-sm whitespace-nowrap text-text-secondary";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-x-3 py-0.5 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-medium text-text-primary">{value}</dd>
    </div>
  );
}

function TransactionGroupRows({ group }: { group: RetailJournalPrintGroup }) {
  const { transaction, lines, subtotal } = group;
  return (
    <>
      <tr className="journal-group-header border-t border-card-border bg-background-gray-secondary_alt_2">
        <td
          colSpan={9}
          className="px-3 py-2 text-sm font-medium whitespace-normal text-text-primary"
        >
          Date/Time : {transaction.dateTimeLabel}
          <span className="mx-2 text-text-tertiary">|</span>
          Terminal Name : {transaction.stationId}
          <span className="mx-2 text-text-tertiary">|</span>
          Trans.# : {transaction.transactionNo}
          <span className="mx-2 text-text-tertiary">|</span>
          Total : {transaction.total}
          <span className="mx-2 text-text-tertiary">|</span>
          Cashier : {transaction.cashier}
        </td>
      </tr>
      {lines.map((line, index) => (
        <tr
          key={`${transaction.id}-${line.itemNo || "promo"}-${index}`}
          className="border-t border-card-border"
        >
          <td className={cn(bodyCell, "text-right tabular-nums text-text-primary")}>
            {line.quantity}
          </td>
          <td className={cn(bodyCell, "text-text-primary")}>{line.itemNo}</td>
          <td
            className={cn(
              bodyCell,
              "max-w-md whitespace-normal text-text-primary",
            )}
          >
            {line.productName}
          </td>
          <td className={cn(bodyCell, "text-right tabular-nums")}>{line.retail}</td>
          <td className={cn(bodyCell, "text-right tabular-nums")}>
            {line.discount}
          </td>
          <td className={cn(bodyCell, "text-right tabular-nums")}>{line.amount}</td>
          <td className={cn(bodyCell, "text-right tabular-nums")}>{line.tax}</td>
          <td className={cn(bodyCell, "text-right tabular-nums")}>
            {line.deposit}
          </td>
          <td className={cn(bodyCell, "text-right tabular-nums")}>{line.total}</td>
        </tr>
      ))}
      <tr className="border-t border-card-border bg-background-gray-secondary_alt_2">
        <td colSpan={3} className={cn(bodyCell, "font-semibold text-text-primary")}>
          Subtotal
        </td>
        <td
          className={cn(
            bodyCell,
            "text-right font-semibold tabular-nums text-text-primary",
          )}
        >
          {subtotal.retail}
        </td>
        <td
          className={cn(
            bodyCell,
            "text-right font-semibold tabular-nums text-text-primary",
          )}
        >
          {subtotal.discount}
        </td>
        <td
          className={cn(
            bodyCell,
            "text-right font-semibold tabular-nums text-text-primary",
          )}
        >
          {subtotal.amount}
        </td>
        <td
          className={cn(
            bodyCell,
            "text-right font-semibold tabular-nums text-text-primary",
          )}
        >
          {subtotal.tax}
        </td>
        <td
          className={cn(
            bodyCell,
            "text-right font-semibold tabular-nums text-text-primary",
          )}
        >
          {subtotal.deposit}
        </td>
        <td
          className={cn(
            bodyCell,
            "text-right font-semibold tabular-nums text-text-primary",
          )}
        >
          {subtotal.total}
        </td>
      </tr>
    </>
  );
}

export default function RetailTransactionJournalPrintDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedStore } = useStore();
  const listQuery = searchParams.toString();
  const listHref = transactionJournalListHref(listQuery);
  const [printedAt, setPrintedAt] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filter = useMemo(
    () => parseRetailJournalFilter(new URLSearchParams(listQuery)),
    [listQuery],
  );

  const groups = useMemo(
    () => (filter ? getRetailJournalPrintGroups(filter) : []),
    [filter],
  );

  useEffect(() => {
    setPrintedAt(formatJournalPrintedAt(new Date()));
  }, [filter]);

  useEffect(() => {
    setPage(1);
  }, [groups, pageSize]);

  const pageCount = Math.max(1, Math.ceil(groups.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageGroups = groups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const fromRow = groups.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRow = Math.min(currentPage * pageSize, groups.length);

  function printPage() {
    const previous = document.title;
    document.title = "TRANSACTION JOURNAL REPORT";
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  if (!filter) {
    return (
      <div className="min-h-full space-y-4 px-4 py-6 sm:px-6">
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={() => router.push(listHref)}
        >
          <ArrowLeft />
          Back
        </Button>
        <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
          <p className="text-sm font-medium text-text-secondary">
            Open Print Transaction Detail from a searched Transaction Journal
            report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="retail-transaction-journal-print-detail"
      className="min-h-full px-4 py-4 sm:px-6"
    >
      <style>{printStyles}</style>
      <div className="retail-report-no-print mb-4 flex items-center justify-between gap-3">
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={() => router.push(listHref)}
        >
          <ArrowLeft />
          Back
        </Button>
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={printPage}
        >
          <LuPrinter />
          Print
        </Button>
      </div>

      <div className="rounded-lg border border-card-border px-2 py-4">
        <p className="text-center text-sm font-semibold tracking-wide text-text-primary uppercase">
          {selectedStore?.storeCode}
        </p>
        <div className="shift-title-bar mt-3 bg-text-primary px-4 py-2 text-center text-sm font-semibold tracking-wide text-card-surface-area">
          TRANSACTION JOURNAL REPORT
        </div>
        <p className="mt-3 text-center text-sm font-medium text-text-primary">
          {formatJournalPrintRangeLabel(filter.date)}
        </p>
        <div className="mt-4 grid gap-4 border-t border-card-border pt-4 sm:grid-cols-2">
          <dl>
            <MetaRow label="DateTime :" value={printedAt} />
            <MetaRow label="Terminal :" value="All" />
            <MetaRow
              label="Transaction :"
              value={
                filter.transactionNo.trim()
                  ? filter.transactionNo.trim()
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

      <Card className="mt-4 overflow-hidden p-0">
        <div className="retail-report-no-print flex items-center gap-2 border-b border-card-border px-3 py-3">
          <span className="text-xs text-text-secondary">Show</span>
          <Select
            aria-label="Show entries"
            value={String(pageSize)}
            onChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="h-8 w-20 py-1 text-xs">
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectContent>
              {pageSizeChoices.map((value) => (
                <SelectItem
                  key={value}
                  id={String(value)}
                  textValue={String(value)}
                >
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-text-secondary">entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem]">
            <thead className="bg-background-gray-secondary_alt_2">
              <tr>
                {[
                  { label: "Quantity", align: "right" as const },
                  { label: "Item#", align: "left" as const },
                  { label: "Product Name", align: "left" as const },
                  { label: "Retail", align: "right" as const },
                  { label: "Discount", align: "right" as const },
                  { label: "Amount", align: "right" as const },
                  { label: "Tax", align: "right" as const },
                  { label: "Deposit", align: "right" as const },
                  { label: "Total", align: "right" as const },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={cn(
                      headCell,
                      col.align === "right" && "text-right",
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageGroups.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-center text-sm text-text-tertiary"
                  >
                    No transaction detail found for the selected filters.
                  </td>
                </tr>
              ) : (
                pageGroups.map((group) => (
                  <TransactionGroupRows
                    key={group.transaction.id}
                    group={group}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="retail-report-no-print flex flex-col gap-3 border-t border-card-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-xs text-text-tertiary sm:text-left">
            Showing {fromRow} to {toRow} of {groups.length} records
          </p>
          <nav
            aria-label="Print detail pagination"
            className="flex items-center justify-center gap-1.5"
          >
            <Button
              size="xs"
              appearance="outline"
              iconOnly
              className="size-8"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onPress={() => setPage((value) => Math.max(1, value - 1))}
            >
              <LuChevronLeft />
            </Button>
            <span className="min-w-20 text-center text-xs font-medium tabular-nums text-text-secondary">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              size="xs"
              appearance="outline"
              iconOnly
              className="size-8"
              aria-label="Next page"
              disabled={currentPage >= pageCount}
              onPress={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              <LuChevronRight />
            </Button>
          </nav>
        </div>
      </Card>
    </div>
  );
}
