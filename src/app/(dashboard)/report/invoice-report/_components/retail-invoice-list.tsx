"use client";

import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/tailgrids/core/tooltip";
import { useStore } from "@/components/store/store-provider";
import { reportingQueryKey } from "@/lib/reporting/query-key";
import { formatInvoiceStamp, type InvoiceListRow } from "@/lib/reporting/retail-invoice";
import { cn } from "@/utils/cn";
import { CalendarDate } from "@internationalized/date";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  LuCalculator,
  LuChartLine,
  LuClock3,
  LuEye,
  LuList,
} from "react-icons/lu";
import {
  RetailReportDateFilter,
  type RetailAppliedDateFilter,
} from "../../_components/retail-report-date-filter";
import {
  RetailReportTable,
  type RetailReportColumn,
} from "../../_components/retail-report-table";
import {
  parseRetailInvoiceFilter,
  serializeRetailInvoiceFilter,
  type RetailInvoiceAppliedFilter,
  type RetailInvoiceRow,
  type RetailInvoiceType,
} from "./retail-invoice-data";
import RetailInvoiceLogDialog from "./retail-invoice-log-dialog";

const noRows: RetailInvoiceRow[] = [];

const inputClass =
  "h-9 w-36 rounded-md border border-card-border bg-card-surface-area px-3 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15";

function StatusBadge({ status }: { status: RetailInvoiceRow["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        status === "Paid"
          ? "bg-badge-success-background text-badge-success-text"
          : status === "Unpaid"
            ? "bg-badge-warning-background text-badge-warning-text"
            : "bg-badge-sky-background text-badge-sky-text",
      )}
    >
      {status}
    </span>
  );
}

function ActionButton({
  label,
  className,
  onPress,
  children,
}: {
  label: string;
  className: string;
  onPress?: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          iconOnly
          size="xs"
          appearance="outline"
          className={cn(
            "size-8 rounded-none border-0 shadow-none [&>svg]:size-3.5",
            className,
          )}
          onPress={onPress ?? (() => undefined)}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="block">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function withListQuery(path: string, query: string) {
  return query ? `${path}?${query}` : path;
}

function InvoiceActions({
  row,
  listQuery,
  onViewLog,
}: {
  row: RetailInvoiceRow;
  listQuery: string;
  onViewLog: (row: RetailInvoiceRow) => void;
}) {
  const router = useRouter();

  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-card-border">
      <ActionButton
        label="View"
        className="bg-background-gray-secondary_alt_2 text-text-secondary hover:opacity-80"
        onPress={() =>
          router.push(
            withListQuery(
              `/report/invoice-report/view/${row.id}/${row.type}`,
              listQuery,
            ),
          )
        }
      >
        <LuEye />
      </ActionButton>
      <ActionButton
        label="Profit Margin"
        className="bg-badge-primary-background text-badge-primary-icon-color hover:opacity-80"
        onPress={() =>
          router.push(
            withListQuery(
              `/report/invoice-report/profit-margin/${row.id}/${row.type}`,
              listQuery,
            ),
          )
        }
      >
        <LuCalculator />
      </ActionButton>
      <ActionButton
        label="Cost Variance"
        className="bg-badge-success-background text-badge-success-icon-color hover:opacity-80"
        onPress={() =>
          router.push(
            withListQuery(
              `/report/invoice-report/cost-variance/${row.id}/${row.type}`,
              listQuery,
            ),
          )
        }
      >
        <LuChartLine />
      </ActionButton>
      <ActionButton
        label="Qty Variance"
        className="bg-badge-warning-background text-badge-warning-icon-color hover:opacity-80"
        onPress={() =>
          router.push(
            withListQuery(
              `/report/invoice-report/qty-variance/${row.id}/${row.type}`,
              listQuery,
            ),
          )
        }
      >
        <LuList />
      </ActionButton>
      <ActionButton
        label="View Log"
        className="bg-badge-sky-background text-badge-sky-icon-color hover:opacity-80"
        onPress={() => onViewLog(row)}
      >
        <LuClock3 />
      </ActionButton>
    </div>
  );
}

function buildColumns(
  listQuery: string,
  onViewLog: (row: RetailInvoiceRow) => void,
): RetailReportColumn<RetailInvoiceRow>[] {
  return [
    {
      id: "date",
      header: "Date/Time",
      cell: (row) => row.dateLabel,
      cellClassName: "whitespace-nowrap",
    },
    {
      id: "supplier",
      header: "Supplier Name",
      cell: (row) => row.supplierName,
      cellClassName: "font-medium whitespace-nowrap text-text-primary",
    },
    {
      id: "invoiceNo",
      header: "Supplier Inv.#",
      cell: (row) => row.supplierInvoiceNo,
      cellClassName: "whitespace-nowrap",
    },
    {
      id: "type",
      header: "Type",
      cell: (row) => row.type,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "discount",
      header: "Discount",
      headerClassName: "text-right",
      cell: (row) => row.discount,
      cellClassName: "text-right tabular-nums",
    },
    {
      id: "shipping",
      header: "Shipping",
      headerClassName: "text-right",
      cell: (row) => row.shipping,
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
      id: "total",
      header: "Total",
      headerClassName: "text-right",
      cell: (row) => row.total,
      cellClassName: "text-right tabular-nums font-medium text-text-primary",
    },
    {
      id: "action",
      header: "Action",
      headerClassName: "text-center",
      cell: (row) => (
        <InvoiceActions
          row={row}
          listQuery={listQuery}
          onViewLog={onViewLog}
        />
      ),
      cellClassName: "text-center",
    },
  ];
}

function InvoiceFilterBar({
  applied,
  suppliers,
  onApply,
  onClear,
}: {
  applied: RetailInvoiceAppliedFilter | null;
  suppliers: string[];
  onApply: (filter: RetailInvoiceAppliedFilter) => void;
  onClear: () => void;
}) {
  const [amountFrom, setAmountFrom] = useState(applied?.amountFrom ?? "");
  const [amountTo, setAmountTo] = useState(applied?.amountTo ?? "");
  const [invoiceType, setInvoiceType] = useState<RetailInvoiceType>(
    applied?.invoiceType ?? "All",
  );
  const [supplierName, setSupplierName] = useState(
    applied?.supplierName ?? "All",
  );
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState(
    applied?.supplierInvoiceNo ?? "",
  );

  function search(date: RetailAppliedDateFilter) {
    onApply({
      date,
      amountFrom,
      amountTo,
      invoiceType,
      supplierName,
      supplierInvoiceNo,
    });
  }

  function reset() {
    setAmountFrom("");
    setAmountTo("");
    setInvoiceType("All");
    setSupplierName("All");
    setSupplierInvoiceNo("");
    onClear();
  }

  return (
    <RetailReportDateFilter
      initialFilter={applied?.date ?? null}
      onSearch={search}
      onReset={reset}
      extraFields={
        <>
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-sm font-normal text-text-secondary">
              Amount From:
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Minimum"
              value={amountFrom}
              onChange={(event) => setAmountFrom(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-sm font-normal text-text-secondary">
              Amount To:
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Maximum"
              value={amountTo}
              onChange={(event) => setAmountTo(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-sm font-normal text-text-secondary">
              Invoice Type:
            </span>
            <Select
              aria-label="Invoice Type"
              value={invoiceType}
              onChange={(key) =>
                setInvoiceType(String(key) as RetailInvoiceType)
              }
            >
              <SelectTrigger
                size="sm"
                className="h-9 min-w-28 border-card-border bg-card-surface-area text-sm"
              >
                <SelectValue />
                <SelectIndicator />
              </SelectTrigger>
              <SelectContent>
                {(["All", "RC", "OP"] as const).map((type) => (
                  <SelectItem key={type} id={type} textValue={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-sm font-normal text-text-secondary">
              Supplier Name:
            </span>
            <Select
              aria-label="Supplier Name"
              value={supplierName}
              onChange={(key) => setSupplierName(String(key))}
            >
              <SelectTrigger
                size="sm"
                className="h-9 min-w-40 border-card-border bg-card-surface-area text-sm"
              >
                <SelectValue />
                <SelectIndicator />
              </SelectTrigger>
              <SelectContent>
                <SelectItem id="All" textValue="All">
                  All
                </SelectItem>
                {suppliers.map((name) => (
                  <SelectItem key={name} id={name} textValue={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-sm font-normal text-text-secondary">
              Supplier Invoice #:
            </span>
            <input
              type="text"
              placeholder="Supplier Invoice #"
              value={supplierInvoiceNo}
              onChange={(event) => setSupplierInvoiceNo(event.target.value)}
              className={cn(inputClass, "w-44")}
            />
          </div>
        </>
      }
    />
  );
}

function filterBounds(applied: RetailInvoiceAppliedFilter) {
  if (applied.date.kind === "single") return { from: applied.date.date, to: applied.date.date };
  const from = applied.date.from.compare(applied.date.to) <= 0 ? applied.date.from : applied.date.to;
  const to = applied.date.from.compare(applied.date.to) <= 0 ? applied.date.to : applied.date.from;
  return { from, to };
}

function listRow(row: InvoiceListRow, timeZone: string): RetailInvoiceRow {
  return {
    id: row.id,
    dateLabel: formatInvoiceStamp(row.invoice_datetime, timeZone),
    date: new CalendarDate(2000, 1, 1),
    supplierName: row.supplier_name,
    supplierInvoiceNo: row.supplier_invoice_no,
    type: row.invoice_type,
    status: row.status,
    discount: row.discount,
    shipping: row.shipping,
    tax: row.tax,
    total: row.total,
    totalValue: 0,
  };
}

export default function RetailInvoiceList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selectedStore } = useStore();
  const listQuery = searchParams.toString();

  const urlApplied = useMemo(
    () => parseRetailInvoiceFilter(new URLSearchParams(listQuery)),
    [listQuery],
  );
  const [syncedQuery, setSyncedQuery] = useState(listQuery);
  const [applied, setApplied] = useState(urlApplied);
  const [logInvoice, setLogInvoice] = useState<RetailInvoiceRow | null>(null);

  if (listQuery !== syncedQuery) {
    setSyncedQuery(listQuery);
    setApplied(urlApplied);
  }

  const filterQuery = applied ? serializeRetailInvoiceFilter(applied) : "";
  const storeCode = selectedStore?.storeCode ?? "";
  const report = useQuery({
    queryKey: reportingQueryKey(storeCode, { report: "invoice-list", applied }),
    enabled: Boolean(storeCode && applied),
    queryFn: async ({ signal }): Promise<{ timezone: string; suppliers: string[]; rows: InvoiceListRow[] }> => {
      const bounds = applied ? filterBounds(applied) : null;
      const params = new URLSearchParams({
        store_code: storeCode,
        from: bounds?.from.toString() ?? "",
        to: bounds?.to.toString() ?? "",
      });
      if (applied?.amountFrom.trim()) params.set("amount_from", applied.amountFrom.trim());
      if (applied?.amountTo.trim()) params.set("amount_to", applied.amountTo.trim());
      if (applied && applied.invoiceType !== "All") params.set("invoice_type", applied.invoiceType);
      if (applied && applied.supplierName !== "All") params.set("supplier_name", applied.supplierName);
      if (applied?.supplierInvoiceNo.trim()) params.set("supplier_invoice_no", applied.supplierInvoiceNo.trim());
      const response = await fetch(`/api/reporting/retail/invoice?${params}`, { signal, cache: "no-store" });
      const body = (await response.json()) as { timezone: string; suppliers: string[]; rows: InvoiceListRow[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load invoices.");
      return body;
    },
  });

  const rows = useMemo(() => {
    if (!applied) return noRows;
    const timezone = report.data?.timezone ?? selectedStore?.timezone ?? "UTC";
    return (report.data?.rows ?? []).map((row) => listRow(row, timezone));
  }, [applied, report.data, selectedStore?.timezone]);

  const suppliers = useMemo(() => {
    const names = report.data?.suppliers ?? [];
    if (applied && applied.supplierName !== "All" && !names.includes(applied.supplierName)) {
      return [applied.supplierName, ...names];
    }
    return names;
  }, [applied, report.data]);

  const columns = useMemo(
    () => buildColumns(filterQuery, setLogInvoice),
    [filterQuery],
  );

  function writeFilter(next: RetailInvoiceAppliedFilter | null) {
    const qs = next ? serializeRetailInvoiceFilter(next) : "";
    setApplied(next);
    setSyncedQuery(qs);
    if (!next) {
      router.replace(pathname);
      return;
    }
    router.replace(`${pathname}?${qs}`);
  }

  return (
    <div className="min-h-full pb-6">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">
          Invoice Report
        </h1>
        <Breadcrumbs
          dividerType="slash"
          items={[
            { href: "/", label: "Dashboard" },
            { href: "/report/invoice-report", label: "Invoice Report" },
          ]}
        />
      </div>

      <div className="space-y-4 px-3 sm:px-5">
        <InvoiceFilterBar
          key={filterQuery || "empty"}
          applied={applied}
          suppliers={suppliers}
          onApply={writeFilter}
          onClear={() => writeFilter(null)}
        />

        {applied && report.error ? (
          <div role="alert" className="text-sm text-error-500">
            {report.error.message}{" "}
            <Button size="xs" appearance="outline" onPress={() => void report.refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        <RetailReportTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          recordLabel="records"
          minWidthClassName="min-w-[64rem]"
          emptyMessage={
            !applied
              ? "Search a date to see invoices."
              : report.isFetching
                ? "Loading invoices."
                : "No invoices found for the selected filters."
          }
        />
      </div>

      <RetailInvoiceLogDialog
        invoice={logInvoice}
        onOpenChange={(isOpen) => {
          if (!isOpen) setLogInvoice(null);
        }}
      />
    </div>
  );
}
