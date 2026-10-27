"use client";

import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { reportingQueryKey } from "@/lib/reporting/query-key";
import type { TransactionReport, TransactionRow } from "@/lib/reporting/transaction-types";
import { useQuery } from "@tanstack/react-query";
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
  today,
} from "@internationalized/date";
import { ArrowLeft } from "@tailgrids/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
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
  employeeOptions,
  formatAmount,
  pageSizeOptions,
  reportByOptions,
  type DatePreset,
  type DepartmentId,
  type EmployeeId,
  type PaidById,
  type ReportById,
  type TransTypeId,
} from "./data";

async function fetchReport(params: URLSearchParams, signal: AbortSignal): Promise<TransactionReport> {
  const response = await fetch(`/api/reporting/transaction-detail?${params}`, {
    signal,
    cache: "no-store",
  });
  const body = await response.json() as TransactionReport & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Unable to load transactions.");
  return body;
}

function displayRow(row: TransactionRow, timezone: string) {
  return {
    ...row,
    dateTime: new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(row.createdAt)),
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    discount: Number(row.discount),
    gratuity: Number(row.gratuity),
    fees: Number(row.fees),
    tips: Number(row.tips),
    total: Number(row.total),
  };
}

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

function createDefaultFilters(timezone: string): FilterState {
  const currentDate = today(timezone);
  return {
    preset: "today",
    from: currentDate,
    to: currentDate,
    checkNo: "",
    transactionNo: "",
    creditCard: "",
    menuItem: "",
    sku: "",
    paidBy: "all",
    employee: "all",
    department: "all",
    transType: "all",
    reportBy: "transaction",
  };
}

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

function rangeForPreset(preset: DatePreset, timezone: string) {
  const currentDate = today(timezone);
  if (preset === "today") return { from: currentDate, to: currentDate };
  if (preset === "yesterday") {
    const yesterday = currentDate.subtract({ days: 1 });
    return { from: yesterday, to: yesterday };
  }
  if (preset === "this-week") {
    return {
      from: startOfWeek(currentDate, "en-GB"),
      to: endOfWeek(currentDate, "en-GB"),
    };
  }
  if (preset === "last-week") {
    const lastWeek = currentDate.subtract({ weeks: 1 });
    return {
      from: startOfWeek(lastWeek, "en-GB"),
      to: endOfWeek(lastWeek, "en-GB"),
    };
  }
  if (preset === "this-month") {
    return { from: startOfMonth(currentDate), to: endOfMonth(currentDate) };
  }
  return { from: currentDate, to: currentDate };
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
  const { selectedStore } = useStore();
  if (!selectedStore) return <p className="p-6 text-text-secondary">Select a store to view transactions.</p>;
  if (selectedStore.storeType !== "RESTAURANT") {
    return <p className="p-6 text-text-secondary">Select a restaurant store to open transaction detail.</p>;
  }
  return <StoreTransactions key={selectedStore.storeCode} storeCode={selectedStore.storeCode} timezone={selectedStore.timezone} />;
}

function StoreTransactions({ storeCode, timezone }: { storeCode: string; timezone: string }) {
  const [draft, setDraft] = useState<FilterState>(() => createDefaultFilters(timezone));
  const [applied, setApplied] = useState<FilterState>(() => createDefaultFilters(timezone));
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const params = new URLSearchParams({
    store_code: storeCode,
    from: applied.from.toString(),
    to: applied.to.toString(),
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  for (const [key, value] of Object.entries({
    check_no: applied.checkNo,
    transaction_no: applied.transactionNo,
    credit_card: applied.creditCard,
    menu_item: applied.menuItem,
    sku: applied.sku,
    paid_by: applied.paidBy,
    department: applied.department,
    trans_type: applied.transType,
  })) {
    if (value && value !== "all") params.set(key, value);
  }
  const report = useQuery({
    queryKey: reportingQueryKey(storeCode, { report: "transaction-detail", params: params.toString() }),
    queryFn: ({ signal }) => fetchReport(params, signal),
    enabled: hasAppliedFilters,
  });
  const rows = (report.data?.rows ?? []).map(row => displayRow(row, timezone));
  const count = report.data?.count ?? 0;
  const totals = report.data?.totals;
  const stats = {
    count,
    sales: Number(totals?.sales ?? 0),
    refunds: Number(totals?.refunds ?? 0),
    average: Number(totals?.average ?? 0),
    tips: Number(totals?.tips ?? 0),
    gratuity: Number(totals?.gratuity ?? 0),
    fees: Number(totals?.fees ?? 0),
  };
  const options = report.data?.options;
  const paidByOptions = [{ id: "all", label: "All" }, ...(options?.tenders ?? []).map(value => ({ id: value, label: value }))];
  const departmentOptions = [{ id: "all", label: "All" }, ...(options?.departments ?? [])];
  const transactionTypeOptions = [{ id: "all", label: "All" }, ...(options?.statuses ?? []).map(value => ({ id: value, label: value }))];
  const pageCount = Math.max(1, Math.ceil(count / pageSize));
  // A background refresh can reduce the number of available pages.
  if (report.data && page > pageCount) setPage(pageCount);
  const currentPage = page;
  const pagedRows = rows;
  const fromRow = count === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRow = Math.min(currentPage * pageSize, count);

  function applyPreset(preset: DatePreset) {
    if (preset === "custom") {
      setDraft((current) => ({ ...current, preset }));
      return;
    }
    setDraft((current) => ({ ...current, preset, ...rangeForPreset(preset, timezone) }));
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
                disabled
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
                disabled
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

            {draft.from.compare(draft.to) > 0 && <p role="alert" className="text-sm text-error-500">From date must not be after To date.</p>}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="h-8 gap-1.5 px-3 py-1 text-xs [&>svg]:size-3.5"
                onPress={() => {
                  if (draft.from.compare(draft.to) > 0) return;
                  if (hasAppliedFilters && page === 1 && JSON.stringify(applied) === JSON.stringify(draft)) void report.refetch();
                  setPage(1);
                  setApplied({ ...draft });
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
                  const filters = createDefaultFilters(timezone);
                  setDraft(filters);
                  setApplied(filters);
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

      {hasAppliedFilters && report.isFetching && <p className="p-3 text-text-secondary">Loading transactions…</p>}
      {hasAppliedFilters && report.error && <div role="alert" className="p-3 text-error-500">{report.error.message} <Button size="sm" onPress={() => void report.refetch()}>Retry</Button></div>}
      {hasAppliedFilters && report.data && !report.error && (
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
                          href={`/report/transaction-detail/${encodeURIComponent(row.id)}`}
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
                Showing {fromRow} to {toRow} of {count} transactions
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
  disabled = false,
}: {
  disabled?: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: readonly { id: string; label: string }[];
}) {
  return (
    <Field label={label}>
      <Select
        aria-label={label}
        isDisabled={disabled}
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
  const { selectedStore } = useStore();
  if (!selectedStore) return <p className="p-6 text-text-secondary">Select a store to view this transaction.</p>;
  if (selectedStore.storeType !== "RESTAURANT") {
    return <p className="p-6 text-text-secondary">Select a restaurant store to open this transaction.</p>;
  }
  return <StoreReceipt key={selectedStore.storeCode} id={id} storeCode={selectedStore.storeCode} timezone={selectedStore.timezone} />;
}

function StoreReceipt({ id, storeCode, timezone }: { id: string; storeCode: string; timezone: string }) {
  const router = useRouter();
  const report = useQuery({
    queryKey: reportingQueryKey(storeCode, { report: "transaction-detail", orderCode: id }),
    queryFn: ({ signal }) => fetchReport(new URLSearchParams({ store_code: storeCode, order_code: id }), signal),
  });
  if (report.isPending) return <p className="p-6 text-text-secondary">Loading transaction…</p>;
  if (report.error) return <div role="alert" className="p-6 text-error-500">{report.error.message} <Button onPress={() => void report.refetch()}>Retry</Button> <Link href="/report/transaction-detail">Transactions</Link></div>;
  if (!report.data?.detail) return <p className="p-6">Transaction not found.</p>;
  const detail = report.data.detail;
  const tx = { ...displayRow(detail, timezone), items: detail.items.map(item => ({ ...item, qty: Number(item.qty), amount: Number(item.amount) })), payments: detail.payments.map(payment => ({ ...payment, amount: Number(payment.amount) })) };

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
              <TableRow key={item.id} className="[&_td]:border-none">
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
                <TableRow key={payment.id} className="[&_td]:border-none">
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
