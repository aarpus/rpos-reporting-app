"use client";

import { Button } from "@/components/tailgrids/core/button";
import { Card, CardHeader, CardTitle } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";
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
import {
  CalendarDate,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "@internationalized/date";
import { ArrowLeft } from "@tailgrids/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  LuBadgePercent,
  LuChartColumn,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuChevronUp,
  LuGift,
  LuReceipt,
  LuReceiptText,
  LuRotateCcw,
  LuSearch,
  LuUndo2,
} from "react-icons/lu";
import { CompactDatePicker, Meta } from "../../_components/report-ui";
import {
  datePresets,
  departmentOptions,
  employeeOptions,
  formatAmount,
  pageSizeOptions,
  paidByOptions,
  parseDateKey,
  reportByOptions,
  today,
  transactionTypeOptions,
  transactions,
  type DatePreset,
  type DepartmentId,
  type EmployeeId,
  type PaidById,
  type ReportById,
  type TransTypeId,
} from "./data";

type FilterState = {
  preset: DatePreset;
  from: CalendarDate;
  to: CalendarDate;
  checkNo: string;
  transactionNo: string;
  creditCard: string;
  menuItem: string;
  sku: string;
  paidBy: PaidById;
  employee: EmployeeId;
  department: DepartmentId;
  transType: TransTypeId;
  reportBy: ReportById;
};

const defaultFilters: FilterState = {
  preset: "today",
  from: today,
  to: today,
  checkNo: "",
  transactionNo: "",
  creditCard: "",
  menuItem: "",
  sku: "",
  paidBy: "all",
  employee: "all",
  department: "all",
  transType: "all",
  reportBy: "batchwise",
};

const columns = [
  "Date / Time",
  "Transaction#",
  "SubTotal",
  "Tax",
  "Discount",
  "Gratuity",
  "Fees",
  "Tips",
  "Total",
  "Paid By",
  "Terminal",
  "Cashier",
  "Trans Type",
] as const;

function rangeForPreset(preset: DatePreset) {
  if (preset === "today") return { from: today, to: today };
  if (preset === "yesterday") {
    const yesterday = today.subtract({ days: 1 });
    return { from: yesterday, to: yesterday };
  }
  if (preset === "this-week") {
    return { from: startOfWeek(today, "en-GB"), to: endOfWeek(today, "en-GB") };
  }
  if (preset === "last-week") {
    const lastWeek = today.subtract({ weeks: 1 });
    return {
      from: startOfWeek(lastWeek, "en-GB"),
      to: endOfWeek(lastWeek, "en-GB"),
    };
  }
  if (preset === "this-month") {
    return { from: startOfMonth(today), to: endOfMonth(today) };
  }
  return { from: today, to: today };
}

function contains(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-[11px] font-medium text-text-secondary">
        {label}
      </span>
      {children}
    </div>
  );
}

export default function TransactionDetailList() {
  const [draft, setDraft] = useState<FilterState>(defaultFilters);
  const [applied, setApplied] = useState<FilterState>(defaultFilters);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const rows = useMemo(() => {
    return transactions.filter((row) => {
      const date = parseDateKey(row.dateKey);
      const inRange =
        date.compare(applied.from) >= 0 && date.compare(applied.to) <= 0;
      if (!inRange) return false;
      if (applied.checkNo && !contains(row.checkNo, applied.checkNo)) {
        return false;
      }
      if (applied.transactionNo && !contains(row.id, applied.transactionNo)) {
        return false;
      }
      if (applied.creditCard && !contains(row.creditCard, applied.creditCard)) {
        return false;
      }
      if (
        applied.menuItem &&
        !row.items.some((item) => contains(item.name, applied.menuItem))
      ) {
        return false;
      }
      if (
        applied.sku &&
        !row.items.some((item) => contains(item.sku, applied.sku))
      ) {
        return false;
      }
      if (
        applied.paidBy !== "all" &&
        !row.paidByKeys.includes(applied.paidBy)
      ) {
        return false;
      }
      if (applied.employee !== "all" && row.employeeId !== applied.employee) {
        return false;
      }
      if (
        applied.department !== "all" &&
        row.departmentId !== applied.department
      ) {
        return false;
      }
      if (applied.transType !== "all" && row.transType !== applied.transType) {
        return false;
      }
      return true;
    });
  }, [applied]);

  const stats = useMemo(() => {
    const paid = rows.filter((row) => row.transType === "PAID");
    const refunds = rows.filter((row) => row.transType === "RETURN");
    const sales = paid.reduce((sum, row) => sum + row.total, 0);
    return {
      sales,
      count: rows.length,
      refunds: Math.abs(refunds.reduce((sum, row) => sum + row.total, 0)),
      average: paid.length ? sales / paid.length : 0,
      tips: rows.reduce((sum, row) => sum + row.tips, 0),
      gratuity: rows.reduce((sum, row) => sum + row.gratuity, 0),
      fees: rows.reduce((sum, row) => sum + row.fees, 0),
    };
  }, [rows]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const fromRow = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRow = Math.min(currentPage * pageSize, rows.length);

  function applyPreset(preset: DatePreset) {
    if (preset === "custom") {
      setDraft((current) => ({ ...current, preset }));
      return;
    }
    setDraft((current) => ({ ...current, preset, ...rangeForPreset(preset) }));
  }

  return (
    <div className="mt-2 space-y-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-3 sm:space-y-2.5 lg:px-4">
      <div>
        <h1 className="text-lg leading-6 font-semibold text-text-primary sm:text-xl">
          Transaction Detail
        </h1>
        <p className="text-[11px] text-text-tertiary">
          View and manage all transactions
        </p>
      </div>

      <Card className="p-0">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="text-sm font-semibold text-text-primary">
            Search{" "}
            <span className="font-normal text-text-tertiary">
              (Tap to collapse or expand)
            </span>
          </span>
          {open ? (
            <LuChevronUp className="size-4 text-text-tertiary" />
          ) : (
            <LuChevronDown className="size-4 text-text-tertiary" />
          )}
        </button>

        {open && (
          <div className="space-y-2.5 border-t border-card-border px-3 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <Field label="Date Filter :" className="sm:w-40">
                <Select
                  aria-label="Date filter"
                  value={draft.preset}
                  onChange={(value) => applyPreset(value as DatePreset)}
                >
                  <SelectTrigger size="sm" className="h-8 py-1 text-xs">
                    <SelectValue />
                    <SelectIndicator />
                  </SelectTrigger>
                  <SelectContent>
                    {datePresets.map((preset) => (
                      <SelectItem
                        key={preset.id}
                        id={preset.id}
                        textValue={preset.label}
                      >
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <CompactDatePicker
                label="From Date :"
                value={draft.from}
                onChange={(value) => {
                  if (!value) return;
                  setDraft((current) => ({
                    ...current,
                    preset: "custom",
                    from: value,
                  }));
                }}
              />
              <CompactDatePicker
                label="To Date :"
                value={draft.to}
                onChange={(value) => {
                  if (!value) return;
                  setDraft((current) => ({
                    ...current,
                    preset: "custom",
                    to: value,
                  }));
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
              <Field label="Check #">
                <Input
                  value={draft.checkNo}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      checkNo: event.target.value,
                    }))
                  }
                  placeholder="Search by Check #"
                  className="h-8 px-2.5 py-1 text-xs"
                />
              </Field>
              <Field label="Transaction #">
                <Input
                  value={draft.transactionNo}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      transactionNo: event.target.value,
                    }))
                  }
                  placeholder="Search by Transaction"
                  className="h-8 px-2.5 py-1 text-xs"
                />
              </Field>
              <Field label="Credit Card">
                <Input
                  value={draft.creditCard}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      creditCard: event.target.value,
                    }))
                  }
                  placeholder="Search by Credit Card"
                  className="h-8 px-2.5 py-1 text-xs"
                />
              </Field>
              <Field label="Menu Item">
                <Input
                  value={draft.menuItem}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      menuItem: event.target.value,
                    }))
                  }
                  placeholder="Search by Menu Item"
                  className="h-8 px-2.5 py-1 text-xs"
                />
              </Field>
              <Field label="SKU">
                <Input
                  value={draft.sku}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sku: event.target.value,
                    }))
                  }
                  placeholder="Search by SKU"
                  className="h-8 px-2.5 py-1 text-xs"
                />
              </Field>
              <FilterSelect
                label="Paid By"
                value={draft.paidBy}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    paidBy: value as PaidById,
                  }))
                }
                items={paidByOptions}
              />
              <FilterSelect
                label="Employee"
                value={draft.employee}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    employee: value as EmployeeId,
                  }))
                }
                items={employeeOptions}
              />
              <FilterSelect
                label="Department"
                value={draft.department}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    department: value as DepartmentId,
                  }))
                }
                items={departmentOptions}
              />
              <FilterSelect
                label="Transaction Type"
                value={draft.transType}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    transType: value as TransTypeId,
                  }))
                }
                items={transactionTypeOptions}
              />
              <FilterSelect
                label="Report By"
                value={draft.reportBy}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    reportBy: value as ReportById,
                  }))
                }
                items={reportByOptions}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="h-8 gap-1.5 px-3 py-1 text-xs [&>svg]:size-3.5"
                onPress={() => {
                  setPage(1);
                  setApplied(draft);
                  setHasAppliedFilters(true);
                }}
              >
                <LuSearch />
                Search
              </Button>
              <Button
                size="sm"
                variant="primary"
                appearance="outline"
                className="h-8 gap-1.5 px-3 py-1 text-xs [&>svg]:size-3.5"
                onPress={() => {
                  setDraft(defaultFilters);
                  setApplied(defaultFilters);
                  setHasAppliedFilters(false);
                  setPage(1);
                  setPageSize(20);
                }}
              >
                <LuRotateCcw />
                Clear
              </Button>
            </div>
          </div>
        )}
      </Card>

      {hasAppliedFilters && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
            <StatCard
              icon={<LuChartColumn className="size-4" />}
              label="Total Sales"
              value={formatAmount(stats.sales)}
              accentClass="border-t-success-500"
              iconClass="bg-badge-success-background text-badge-success-icon-color"
            />
            <StatCard
              icon={<LuReceipt className="size-4" />}
              label="Total Transactions"
              value={String(stats.count)}
              accentClass="border-t-primary-500"
              iconClass="bg-badge-primary-background text-badge-primary-icon-color"
            />
            <StatCard
              icon={<LuUndo2 className="size-4" />}
              label="Total Refunds"
              value={formatAmount(stats.refunds)}
              accentClass="border-t-error-500"
              iconClass="bg-badge-error-background text-badge-error-icon-color"
            />
            <StatCard
              icon={<LuChartColumn className="size-4" />}
              label="Average Sales"
              value={formatAmount(stats.average)}
              accentClass="border-t-info-500"
              iconClass="bg-badge-sky-background text-badge-sky-icon-color"
            />
            <StatCard
              icon={<LuGift className="size-4" />}
              label="Total Tips"
              value={formatAmount(stats.tips)}
              accentClass="border-t-violet-500"
              iconClass="bg-badge-violet-background text-badge-violet-icon-color"
            />
            <StatCard
              icon={<LuBadgePercent className="size-4" />}
              label="Total Gratuity"
              value={formatAmount(stats.gratuity)}
              accentClass="border-t-pink-500"
              iconClass="bg-badge-pink-background text-badge-pink-icon-color"
            />
            <StatCard
              icon={<LuReceiptText className="size-4" />}
              label="Total Fees"
              value={formatAmount(stats.fees)}
              accentClass="border-t-orange-500"
              iconClass="bg-badge-orange-background text-badge-orange-icon-color"
            />
          </div>

          <Card className="overflow-hidden p-0">
        {rows.length === 0 ? (
          <p className="px-6 py-6 text-center text-sm text-text-tertiary">
            No transactions found for the selected filters.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <TableRoot className="w-full min-w-275 rounded-none border-none">
                <TableHeader>
                  <TableRow className="[&_th]:border-t">
                    {columns.map((column) => (
                      <TableHead
                        key={column}
                        className="px-3 py-2.5 text-xs leading-4 font-semibold whitespace-nowrap text-text-secondary"
                      >
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.map((row) => (
                    <TableRow key={row.id} className="[&_td]:border-none">
                      <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap text-text-secondary">
                        {row.dateTime}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap">
                        <Link
                          href={`/report/transaction-detail/${row.id}`}
                          className="font-medium text-primary-500 hover:underline"
                        >
                          {row.id}
                        </Link>
                      </TableCell>
                      <AmountCell value={row.subtotal} />
                      <AmountCell value={row.tax} />
                      <AmountCell value={row.discount} />
                      <AmountCell value={row.gratuity} />
                      <AmountCell value={row.fees} />
                      <AmountCell value={row.tips} />
                      <AmountCell value={row.total} strong />
                      <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap text-text-primary">
                        {row.paidBy}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap text-text-primary">
                        {row.terminal}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap text-text-primary">
                        {row.cashier}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap text-text-primary">
                        {row.transType}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            </div>
            <div className="flex flex-col gap-3 border-t border-card-border px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-center text-xs text-text-tertiary sm:text-left">
                Showing {fromRow} to {toRow} of {rows.length} transactions
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
                      {pageSizeOptions.map((option) => (
                        <SelectItem
                          key={option.id}
                          id={option.id}
                          textValue={option.label}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <nav
                  aria-label="Transaction table pagination"
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
                    onPress={() =>
                      setPage((value) => Math.min(pageCount, value + 1))
                    }
                  >
                    <LuChevronRight />
                  </Button>
                </nav>
              </div>
            </div>
          </>
        )}
          </Card>
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: readonly { id: string; label: string }[];
}) {
  return (
    <Field label={label}>
      <Select
        aria-label={label}
        value={value}
        onChange={(next) => onChange(String(next))}
      >
        <SelectTrigger size="sm" className="h-8 py-1 text-xs">
          <SelectValue />
          <SelectIndicator />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.id} id={item.id} textValue={item.label}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function StatCard({
  icon,
  label,
  value,
  accentClass,
  iconClass,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accentClass: string;
  iconClass: string;
}) {
  return (
    <Card className={cn("border-t-2 p-3", accentClass)}>
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            iconClass,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] text-text-tertiary">{label}</p>
          <p className="text-sm font-semibold tabular-nums text-text-primary">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function AmountCell({ value, strong }: { value: number; strong?: boolean }) {
  return (
    <TableCell
      className={cn(
        "px-3 py-2.5 text-xs whitespace-nowrap tabular-nums",
        strong ? "font-semibold text-text-primary" : "text-text-secondary",
        value < 0 && "text-error-500",
      )}
    >
      {formatAmount(value)}
    </TableCell>
  );
}

export function TransactionReceipt({ id }: { id: string }) {
  const router = useRouter();
  const tx = transactions.find((item) => item.id === id);

  if (!tx) return null;

  return (
    <div className="mt-2 space-y-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-3 sm:space-y-2.5 lg:px-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={() => router.push("/report/transaction-detail")}
        >
          <ArrowLeft />
          Transactions
        </Button>
        <h1 className="text-center text-lg leading-6 font-semibold text-text-primary sm:text-xl">
          Transaction Detail
        </h1>
        <span aria-hidden />
      </div>
      <p className="text-center text-[11px] text-text-tertiary">
        {tx.id} · Check #{tx.checkNo} · {tx.transType}
      </p>

      <Card className="p-0">
        <CardHeader className="px-3 py-2.5">
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-card-border px-3 py-2.5 text-center text-[11px] sm:grid-cols-4">
          <Meta label="Date / Time" value={tx.dateTime} />
          <Meta label="Terminal" value={tx.terminal} />
          <Meta label="Cashier" value={tx.cashier} />
          <Meta label="Paid By" value={tx.paidBy} />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <CardHeader className="px-3 py-2.5">
          <CardTitle className="text-sm">Items</CardTitle>
        </CardHeader>
        <TableRoot className="w-full rounded-none border-none">
          <TableHeader>
            <TableRow className="[&_th]:border-t">
              {["Item", "SKU", "Qty", "Amount"].map((column) => (
                <TableHead
                  key={column}
                  className="px-3 py-2.5 text-xs font-semibold text-text-secondary"
                >
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tx.items.map((item) => (
              <TableRow key={item.sku} className="[&_td]:border-none">
                <TableCell className="px-3 py-2.5 text-sm text-text-primary">
                  {item.name}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-sm text-text-secondary">
                  {item.sku}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-sm tabular-nums text-text-secondary">
                  {item.qty}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-sm tabular-nums text-text-primary">
                  {formatAmount(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableRoot>
      </Card>

      <div className="grid gap-2 md:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <CardHeader className="px-3 py-2.5">
            <CardTitle className="text-sm">Payments</CardTitle>
          </CardHeader>
          <TableRoot className="w-full rounded-none border-none">
            <TableHeader>
              <TableRow className="[&_th]:border-t">
                <TableHead className="px-3 py-2.5 text-xs font-semibold text-text-secondary">
                  Method
                </TableHead>
                <TableHead className="px-3 py-2.5 text-xs font-semibold text-text-secondary">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tx.payments.map((payment) => (
                <TableRow key={payment.method} className="[&_td]:border-none">
                  <TableCell className="px-3 py-2.5 text-sm text-text-primary">
                    {payment.method}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-sm tabular-nums text-text-primary">
                    {formatAmount(payment.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHeader className="px-3 py-2.5">
            <CardTitle className="text-sm">Totals</CardTitle>
          </CardHeader>
          <div className="space-y-1.5 border-t border-card-border px-3 py-2.5 text-sm">
            {[
              ["SubTotal", tx.subtotal],
              ["Tax", tx.tax],
              ["Discount", tx.discount],
              ["Gratuity", tx.gratuity],
              ["Fees", tx.fees],
              ["Tips", tx.tips],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-3">
                <span className="text-text-tertiary">{label}</span>
                <span
                  className={cn(
                    "tabular-nums",
                    Number(value) < 0 ? "text-error-500" : "text-text-primary",
                  )}
                >
                  {formatAmount(Number(value))}
                </span>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-card-border pt-1.5 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatAmount(tx.total)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
