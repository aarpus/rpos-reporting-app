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
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import { cn } from "@/utils/cn";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

const pageSizeChoices = [10, 20, 50] as const;

export type RetailReportColumn<Row> = {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

function isActionColumn<Row>(column: RetailReportColumn<Row>) {
  return column.id === "action" || column.id === "view";
}

export function RetailReportTable<Row>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  recordLabel,
  minWidthClassName = "min-w-[52rem]",
  footerCell,
  pageSizeOverride = null,
}: {
  columns: RetailReportColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  emptyMessage: string;
  recordLabel: string;
  minWidthClassName?: string;
  /** Optional footer cell renderer (e.g. totals). Skipped for empty tables. */
  footerCell?: (column: RetailReportColumn<Row>) => ReactNode;
  /** When set, forces that page size (e.g. print all rows). */
  pageSizeOverride?: number | null;
}) {
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const rowsRef = useRef(rows);
  const effectivePageSize =
    pageSizeOverride && pageSizeOverride > 0 ? pageSizeOverride : pageSize;

  useEffect(() => {
    if (rowsRef.current === rows) return;
    rowsRef.current = rows;
    setPage(1);
  }, [rows]);

  const pageCount = Math.max(1, Math.ceil(rows.length / effectivePageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice(
    (currentPage - 1) * effectivePageSize,
    currentPage * effectivePageSize,
  );
  const fromRow = rows.length === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const toRow = Math.min(currentPage * effectivePageSize, rows.length);
  const detailColumns = columns.filter((column) => !isActionColumn(column));
  const actionColumns = columns.filter((column) => isActionColumn(column));

  const pagination = (
    <div className="retail-report-no-print flex flex-col gap-3 border-t border-card-border px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-center text-xs text-text-tertiary sm:text-left">
        Showing {fromRow} to {toRow} of {rows.length} {recordLabel}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-center gap-2">
          <span className="whitespace-nowrap text-xs text-text-secondary">
            Rows per page:
          </span>
          <Select
            aria-label="Rows per page"
            value={String(effectivePageSize)}
            onChange={(value) => {
              setPage(1);
              setPageSize(Number(value));
            }}
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
        </div>
        <nav
          aria-label={`${recordLabel} table pagination`}
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
    </div>
  );

  return (
    <Card className="overflow-hidden p-0">
      {/* Mobile: stacked cards so all fields stay readable without horizontal scroll */}
      <div className="md:hidden print:hidden">
        {pageRows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-text-tertiary">
            {emptyMessage}
          </p>
        ) : (
          <ul className="divide-y divide-card-border">
            {pageRows.map((row) => (
              <li key={rowKey(row)} className="space-y-3 px-4 py-4">
                <dl className="space-y-2">
                  {detailColumns.map((column) => (
                    <div
                      key={column.id}
                      className="flex items-start justify-between gap-4"
                    >
                      <dt className="shrink-0 text-xs font-medium text-text-tertiary">
                        {column.header}
                      </dt>
                      <dd
                        className={cn(
                          "min-w-0 text-right text-xs break-words text-text-secondary",
                          column.cellClassName,
                          "whitespace-normal",
                        )}
                      >
                        {column.cell(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
                {actionColumns.length > 0 && (
                  <div className="retail-report-no-print flex flex-wrap items-center justify-center gap-2 border-t border-card-border pt-3">
                    {actionColumns.map((column) => (
                      <div key={column.id}>{column.cell(row)}</div>
                    ))}
                  </div>
                )}
              </li>
            ))}
            {footerCell && pageRows.length > 0 && (
              <li className="space-y-2 bg-background-gray-secondary_alt_2 px-4 py-3">
                <dl className="space-y-2">
                  {detailColumns.map((column) => {
                    const content = footerCell(column);
                    if (content == null || content === false) return null;
                    return (
                      <div
                        key={column.id}
                        className="flex items-start justify-between gap-4"
                      >
                        <dt className="shrink-0 text-xs font-semibold text-text-secondary">
                          {column.header}
                        </dt>
                        <dd className="min-w-0 text-right text-xs font-semibold tabular-nums text-text-primary">
                          {content}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Desktop / tablet: full table */}
      <div className="hidden md:block print:block">
        <TableRoot
          className={cn("w-full rounded-none border-none", minWidthClassName)}
        >
          <TableHeader className="bg-background-gray-secondary_alt_2">
            <TableRow className="[&_th]:border-t">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    "px-3 py-2.5 text-xs font-semibold whitespace-nowrap text-text-secondary",
                    isActionColumn(column) && "retail-report-no-print",
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-sm text-text-tertiary"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {pageRows.map((row) => (
                  <TableRow key={rowKey(row)}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          "px-3 py-2.5 text-xs",
                          isActionColumn(column) && "retail-report-no-print",
                          column.cellClassName,
                        )}
                      >
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {footerCell && (
                  <TableRow className="bg-background-gray-secondary_alt_2">
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          "px-3 py-2.5 text-xs font-semibold text-text-primary",
                          isActionColumn(column) && "retail-report-no-print",
                          column.cellClassName,
                        )}
                      >
                        {footerCell(column)}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </TableRoot>
      </div>

      {pagination}
    </Card>
  );
}
