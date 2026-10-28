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
  cellClassName?: string;
};

export function RetailReportTable<Row>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  recordLabel,
  minWidthClassName = "min-w-[52rem]",
}: {
  columns: RetailReportColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  emptyMessage: string;
  recordLabel: string;
  minWidthClassName?: string;
}) {
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const rowsRef = useRef(rows);

  useEffect(() => {
    if (rowsRef.current === rows) return;
    rowsRef.current = rows;
    setPage(1);
  }, [rows]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const fromRow = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRow = Math.min(currentPage * pageSize, rows.length);

  return (
    <Card className="overflow-hidden p-0">
      <TableRoot
        className={cn("w-full rounded-none border-none", minWidthClassName)}
      >
        <TableHeader className="bg-background-gray-secondary_alt_2">
          <TableRow className="[&_th]:border-t">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className="px-3 py-2.5 text-xs font-semibold whitespace-nowrap text-text-secondary"
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
            pageRows.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn("px-3 py-2.5 text-xs", column.cellClassName)}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </TableRoot>

      <div className="flex flex-col gap-3 border-t border-card-border px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
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
              value={String(pageSize)}
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
    </Card>
  );
}
