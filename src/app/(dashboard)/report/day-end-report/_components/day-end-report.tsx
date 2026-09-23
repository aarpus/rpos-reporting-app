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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/tailgrids/core/tooltip";
import { cn } from "@/utils/cn";
import {
  CalendarDate,
  endOfMonth,
  endOfWeek,
  getLocalTimeZone,
  startOfMonth,
  startOfWeek,
  today,
} from "@internationalized/date";
import { ArrowLeft } from "@tailgrids/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LuEye, LuRotateCcw } from "react-icons/lu";
import { CompactDatePicker } from "../../_components/report-ui";
import {
  cardPayments,
  cardPaymentTotal,
  cashAudit,
  cashAuditTotal,
  clockIns,
  clockInTotal,
  departmentTotal,
  departments,
  devices,
  deviceTotal,
  discountTotal,
  discounts,
  externalPayments,
  externalPaymentTotal,
  giftCardPaymentTotal,
  giftCardPayments,
  orderTypeTotal,
  orderTypes,
  reportMeta,
  returnsVoids,
  returnsVoidsTotal,
  rounding,
  roundingTotal,
  summaryOverview,
  taxTotal,
  taxes,
  tenderTotal,
  tenders,
  tipsFees,
  tipsFeesTotal,
  voidItems,
} from "./data";

function money(value: number) {
  const formatted = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}

function pct(value: number) {
  return `${value.toFixed(2)}%`;
}

function amountClass(value: number, strong = false) {
  return cn(
    "tabular-nums",
    strong && "font-semibold",
    value < 0 ? "text-error-500" : "text-text-primary",
  );
}

function ReportCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-card-border bg-card-surface-area",
        className,
      )}
    >
      <h2 className="border-b border-card-border bg-background-gray-secondary_alt_2 px-2 py-1 text-[10px] font-semibold tracking-wide text-text-tertiary uppercase sm:px-2.5 sm:text-[11px]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function DenseTable({
  minWidth,
  head,
  children,
}: {
  minWidth?: string;
  head: { label: string; align?: "left" | "right" }[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-left text-[11px] leading-4"
        style={minWidth ? { minWidth } : undefined}
      >
        <thead className="text-[10px] text-text-tertiary">
          <tr>
            {head.map((col) => (
              <th
                key={col.label}
                className={cn(
                  "px-1.5 py-1 font-medium whitespace-nowrap",
                  col.align === "right" && "text-right",
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border text-text-secondary">
          {children}
        </tbody>
      </table>
    </div>
  );
}

function Td({
  children,
  align = "left",
  className,
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-1.5 py-1 whitespace-nowrap",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}

function TotalRow({ children }: { children: ReactNode }) {
  return (
    <tr className="bg-background-gray-secondary_alt_2 font-semibold text-text-primary">
      {children}
    </tr>
  );
}

function EmptyState({ label = "No records" }: { label?: string }) {
  return (
    <p className="px-2 py-2 text-[11px] text-text-tertiary">{label}</p>
  );
}

const datePresets = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this-week", label: "This Week" },
  { id: "last-week", label: "Last Week" },
  { id: "this-month", label: "This Month" },
  { id: "custom", label: "Custom" },
] as const;

type DatePreset = (typeof datePresets)[number]["id"];
type DateFilters = { preset: DatePreset; from: CalendarDate; to: CalendarDate };

const currentDate = today(getLocalTimeZone());
const defaultFilters: DateFilters = {
  preset: "today",
  from: currentDate,
  to: currentDate,
};

const dayEndBatches = [
  { id: "293", endedAt: "Sep-21-2026 06:01 PM", date: new CalendarDate(2026, 9, 21) },
  { id: "292", endedAt: "Sep-21-2026 04:59 PM", date: new CalendarDate(2026, 9, 21) },
  { id: "291", endedAt: "Sep-21-2026 04:17 PM", date: new CalendarDate(2026, 9, 21) },
  { id: "290", endedAt: "Sep-21-2026 03:28 PM", date: new CalendarDate(2026, 9, 21) },
  { id: "4", endedAt: "Sep-10-2026 02:54 PM", date: new CalendarDate(2026, 9, 10) },
];

function rangeForPreset(preset: DatePreset) {
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

function dateLabel(date: CalendarDate) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date.toDate(getLocalTimeZone()));
}

export default function DayEndReportView({ batchId }: { batchId?: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<DateFilters>(defaultFilters);
  const [applied, setApplied] = useState<DateFilters>(defaultFilters);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);

  function applyPreset(preset: DatePreset) {
    setDraft((current) => ({ ...current, preset, ...rangeForPreset(preset) }));
  }

  const filteredBatches = dayEndBatches.filter(
    (batch) =>
      batch.date.compare(applied.from) >= 0 &&
      batch.date.compare(applied.to) <= 0,
  );
  const selectedBatch = dayEndBatches.find((batch) => batch.id === batchId);
  const detailDateLabel =
    batchId === "4"
      ? reportMeta.businessDateLabel
      : selectedBatch
        ? dateLabel(selectedBatch.date)
        : reportMeta.businessDateLabel;

  if (!batchId) {
    return (
      <div className="mt-2 space-y-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-3 sm:space-y-2.5 lg:px-4">
        <div>
          <h1 className="text-lg leading-6 font-semibold text-text-primary sm:text-xl">
            {reportMeta.title}
          </h1>
          <p className="text-[11px] leading-4 text-text-tertiary">
            Search day-end batches and open the complete report
          </p>
        </div>

        <ReportCard title="Filters">
            <div className="space-y-2 px-2 py-2 sm:px-2.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex w-full flex-col gap-1 sm:w-40">
                  <span className="text-[11px] font-medium text-text-secondary">
                    Date Filter
                  </span>
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
                        <SelectItem key={preset.id} id={preset.id} textValue={preset.label}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <CompactDatePicker
                  label="From Date"
                  value={draft.from}
                  onChange={(value) => {
                    if (!value) return;
                    setDraft((current) => ({ ...current, preset: "custom", from: value }));
                  }}
                />
                <CompactDatePicker
                  label="To Date"
                  value={draft.to}
                  onChange={(value) => {
                    if (!value) return;
                    setDraft((current) => ({ ...current, preset: "custom", to: value }));
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 px-3 py-1 text-xs"
                  onPress={() => {
                    setApplied(draft);
                    setHasAppliedFilters(true);
                  }}
                >
                  Generate report
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
                  }}
                >
                  <LuRotateCcw />
                  Reset filter
                </Button>
              </div>
            </div>
        </ReportCard>

        {hasAppliedFilters && (
          <Card className="overflow-hidden p-0">
            {filteredBatches.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-text-tertiary">
                No day-end batches found for the selected dates.
              </p>
            ) : (
              <TableRoot className="w-full rounded-none border-none">
                <TableHeader>
                  <TableRow className="[&_th]:border-t">
                    <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold whitespace-nowrap text-text-secondary">
                      Day End Date
                    </TableHead>
                    <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                      Batch #
                    </TableHead>
                    <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                      <div className="flex items-center justify-center">Action</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => (
                    <TableRow key={batch.id} className="[&_td]:border-none">
                      <TableCell className="px-6 py-3.5 text-sm leading-5 whitespace-nowrap text-text-secondary">
                        {batch.endedAt}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium whitespace-nowrap text-text-primary">
                        {batch.id}
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
                        <div className="flex items-center justify-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/report/day-end-report/${batch.id}`}
                                aria-label={`View day end report for batch ${batch.id}`}
                                className="inline-flex size-8 items-center justify-center rounded-lg bg-badge-primary-background text-badge-primary-icon-color transition hover:bg-primary-100"
                              >
                                <LuEye className="size-4" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent className="block">
                              <p>View day end report</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            )}
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-3 sm:space-y-2.5 lg:px-4">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <Button
          appearance="outline"
          size="sm"
          className="w-fit self-start gap-1.5"
          onPress={() => router.push("/report/day-end-report")}
        >
          <ArrowLeft />
          Day End report
        </Button>
        <p className="text-base font-bold text-text-primary">
          {reportMeta.brand}
        </p>
        <h1 className="text-lg leading-6 font-semibold text-text-primary sm:text-xl">
          {reportMeta.title}
        </h1>
        <div className="flex w-full flex-col justify-between gap-1 border-t border-card-border pt-2 text-[11px] leading-4 text-text-tertiary sm:flex-row">
          <span>Date Time: {reportMeta.printedAt}</span>
          <span>User Name: {reportMeta.userName}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-lg border border-card-border bg-card-surface-area px-2 py-1.5 text-center text-[11px] leading-4 sm:grid-cols-3 xl:grid-cols-6">
        <Meta label="Business date" value={detailDateLabel} />
        <Meta label="Day start" value={reportMeta.dayStart} />
        <Meta label="Day end" value={reportMeta.dayEnd} />
        <Meta label="Batch" value={batchId} />
        <Meta label="Terminal / Station" value={reportMeta.terminals} />
        <Meta label="Printed" value={reportMeta.printedAt} />
      </div>

      <ReportCard title="1. Summary overview">
        <div className="grid grid-cols-2 divide-x divide-y divide-card-border sm:grid-cols-3 xl:grid-cols-6">
          {summaryOverview.map((item) => (
            <div key={item.label} className="px-2 py-1.5">
              <p className="text-[10px] leading-4 text-text-tertiary">
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-sm leading-5 font-semibold tabular-nums",
                  item.kind === "text" || item.kind === "count"
                    ? "text-text-primary"
                    : amountClass(item.value as number),
                )}
              >
                {item.kind === "text"
                  ? item.value
                  : item.kind === "count"
                    ? item.value
                    : money(item.value as number)}
              </p>
            </div>
          ))}
        </div>
      </ReportCard>

      <ReportCard title="2. Department sales summary">
        <DenseTable
          minWidth="46rem"
          head={[
            { label: "#" },
            { label: "Department" },
            { label: "Trans", align: "right" },
            { label: "Qty", align: "right" },
            { label: "Amount", align: "right" },
            { label: "Discount", align: "right" },
            { label: "Disc %", align: "right" },
            { label: "Subtotal", align: "right" },
            { label: "Tax", align: "right" },
            { label: "Total", align: "right" },
            { label: "Sales %", align: "right" },
          ]}
        >
          {departments.map((row) => (
            <tr key={row.name}>
              <Td>{row.no}</Td>
              <Td className="font-medium text-text-primary">{row.name}</Td>
              <Td align="right">{row.trans}</Td>
              <Td align="right">{row.qty}</Td>
              <Td align="right" className="text-success-500">{money(row.amount)}</Td>
              <Td align="right" className={amountClass(row.discount)}>
                {money(row.discount)}
              </Td>
              <Td align="right" className={row.discount < 0 ? "text-error-500" : "text-success-500"}>{pct(row.discountPct)}</Td>
              <Td align="right" className="text-success-500">{money(row.subtotal)}</Td>
              <Td align="right" className="text-success-500">{money(row.tax)}</Td>
              <Td align="right" className="font-medium text-success-500">
                {money(row.total)}
              </Td>
              <Td align="right" className="text-success-500">{pct(row.salesPct)}</Td>
            </tr>
          ))}
          <TotalRow>
            <Td> </Td>
            <Td>Grand total</Td>
            <Td align="right">{departmentTotal.trans}</Td>
            <Td align="right">{departmentTotal.qty}</Td>
            <Td align="right">{money(departmentTotal.amount)}</Td>
            <Td align="right" className={amountClass(departmentTotal.discount)}>
              {money(departmentTotal.discount)}
            </Td>
            <Td align="right">{pct(departmentTotal.discountPct)}</Td>
            <Td align="right">{money(departmentTotal.subtotal)}</Td>
            <Td align="right">{money(departmentTotal.tax)}</Td>
            <Td align="right">{money(departmentTotal.total)}</Td>
            <Td align="right">{pct(departmentTotal.salesPct)}</Td>
          </TotalRow>
        </DenseTable>
      </ReportCard>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <ReportCard title="3. Order type / service summary">
          <DenseTable
            head={[
              { label: "#" },
              { label: "Order type" },
              { label: "Count", align: "right" },
              { label: "Amount", align: "right" },
            ]}
          >
            {orderTypes.map((row) => (
              <tr key={row.name}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.name}</Td>
                <Td align="right">{row.count}</Td>
                <Td align="right" className="text-success-500">{money(row.amount)}</Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td>Total</Td>
              <Td align="right">{orderTypeTotal.count}</Td>
              <Td align="right">{money(orderTypeTotal.amount)}</Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>

        <ReportCard title="4. Tax summary">
          <DenseTable
            head={[
              { label: "#" },
              { label: "Tax name" },
              { label: "Taxable", align: "right" },
              { label: "Tax", align: "right" },
            ]}
          >
            {taxes.map((row) => (
              <tr key={row.name}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.name}</Td>
                <Td align="right" className="text-success-500">{money(row.taxable)}</Td>
                <Td align="right" className="text-success-500">{money(row.tax)}</Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td>Total</Td>
              <Td align="right">{money(taxTotal.taxable)}</Td>
              <Td align="right">{money(taxTotal.tax)}</Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>

        <ReportCard title="6. Tips & fees summary" className="sm:col-span-2 xl:col-span-1">
          <DenseTable
            head={[
              { label: "#" },
              { label: "Description" },
              { label: "Count", align: "right" },
              { label: "Amount", align: "right" },
            ]}
          >
            {tipsFees.map((row) => (
              <tr key={row.name}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.name}</Td>
                <Td align="right">{row.count}</Td>
                <Td align="right" className="text-success-500">{money(row.amount)}</Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td>Total</Td>
              <Td align="right">{tipsFeesTotal.count}</Td>
              <Td align="right">{money(tipsFeesTotal.amount)}</Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>
      </div>

      <ReportCard title="5. Tender / payment summary">
        <DenseTable
          minWidth="34rem"
          head={[
            { label: "#" },
            { label: "Tender" },
            { label: "Count", align: "right" },
            { label: "Sale", align: "right" },
            { label: "Return", align: "right" },
            { label: "Void", align: "right" },
            { label: "Net amount", align: "right" },
          ]}
        >
          {tenders.map((row) => (
            <tr key={row.name}>
              <Td>{row.no}</Td>
              <Td className="font-medium text-text-primary">{row.name}</Td>
              <Td align="right">{row.count}</Td>
              <Td align="right" className="text-success-500">{money(row.sale)}</Td>
              <Td align="right" className="text-success-500">
                {money(row.ret)}
              </Td>
              <Td align="right" className={amountClass(row.voidAmt)}>
                {money(row.voidAmt)}
              </Td>
              <Td align="right" className={cn("font-medium", row.name === "Cash" ? "text-error-500" : "text-success-500")}>
                {money(row.net)}
              </Td>
            </tr>
          ))}
          <TotalRow>
            <Td> </Td>
            <Td>Total</Td>
            <Td align="right">{tenderTotal.count}</Td>
            <Td align="right">{money(tenderTotal.sale)}</Td>
            <Td align="right" className={amountClass(tenderTotal.ret)}>
              {money(tenderTotal.ret)}
            </Td>
            <Td align="right" className={amountClass(tenderTotal.voidAmt)}>
              {money(tenderTotal.voidAmt)}
            </Td>
            <Td align="right">{money(tenderTotal.net)}</Td>
          </TotalRow>
        </DenseTable>
      </ReportCard>

      <div className="grid gap-2 sm:grid-cols-2">
        <ReportCard title="7. Card payment summary">
          <DenseTable
            head={[
              { label: "#" },
              { label: "Card" },
              { label: "Count", align: "right" },
              { label: "Sale", align: "right" },
              { label: "Tip", align: "right" },
              { label: "Total", align: "right" },
            ]}
          >
            {cardPayments.map((row) => (
              <tr key={row.name}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.name}</Td>
                <Td align="right">{row.count}</Td>
                <Td align="right" className="text-success-500">{money(row.sale)}</Td>
                <Td align="right" className="text-success-500">{money(row.tip)}</Td>
                <Td align="right" className="font-medium text-success-500">
                  {money(row.total)}
                </Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td>Total</Td>
              <Td align="right">{cardPaymentTotal.count}</Td>
              <Td align="right">{money(cardPaymentTotal.sale)}</Td>
              <Td align="right">{money(cardPaymentTotal.tip)}</Td>
              <Td align="right">{money(cardPaymentTotal.total)}</Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>

        <ReportCard title="8. Device amount summary">
          <DenseTable
            head={[
              { label: "#" },
              { label: "Device" },
              { label: "Count", align: "right" },
              { label: "Card amount", align: "right" },
              { label: "Surcharge", align: "right" },
              { label: "Total", align: "right" },
            ]}
          >
            {devices.map((row) => (
              <tr key={row.name}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.name}</Td>
                <Td align="right">{row.count}</Td>
                <Td align="right" className="text-success-500">{money(row.cardAmount)}</Td>
                <Td align="right" className="text-success-500">{money(row.surcharge)}</Td>
                <Td align="right" className="font-medium text-success-500">
                  {money(row.total)}
                </Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td>Total</Td>
              <Td align="right">{deviceTotal.count}</Td>
              <Td align="right">{money(deviceTotal.cardAmount)}</Td>
              <Td align="right">{money(deviceTotal.surcharge)}</Td>
              <Td align="right">{money(deviceTotal.total)}</Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>
      </div>

      <ReportCard title="9. Cash audit summary">
        <DenseTable
          minWidth="58rem"
          head={[
            { label: "#" },
            { label: "Shift" },
            { label: "Employee" },
            { label: "Open", align: "right" },
            { label: "Sales", align: "right" },
            { label: "Tip", align: "right" },
            { label: "Close", align: "right" },
            { label: "Total", align: "right" },
            { label: "Cash grat.", align: "right" },
            { label: "NC tip", align: "right" },
            { label: "Cash tip", align: "right" },
            { label: "NC withheld", align: "right" },
            { label: "Grat. withheld", align: "right" },
            { label: "Owed to rest", align: "right" },
            { label: "Received", align: "right" },
          ]}
        >
          {cashAudit.map((row) => (
            <tr key={row.employee}>
              <Td>{row.no}</Td>
              <Td>{row.shift}</Td>
              <Td className="font-medium text-text-primary">{row.employee}</Td>
              <Td align="right" className="text-success-500">{money(row.open)}</Td>
              <Td align="right" className="text-success-500">{money(row.sales)}</Td>
              <Td align="right" className="text-success-500">{money(row.tip)}</Td>
              <Td align="right" className="text-success-500">{money(row.close)}</Td>
              <Td align="right" className="text-success-500">{money(row.total)}</Td>
              <Td align="right" className="text-success-500">{money(row.cashGratuity)}</Td>
              <Td align="right" className="text-success-500">{money(row.nonCashTip)}</Td>
              <Td align="right" className="text-success-500">{money(row.cashTip)}</Td>
              <Td align="right" className="text-success-500">{money(row.nonCashTipWithheld)}</Td>
              <Td align="right" className="text-success-500">{money(row.gratuityWithheld)}</Td>
              <Td align="right" className={row.owedToRest < 0 ? "text-error-500" : "text-success-500"}>
                {money(row.owedToRest)}
              </Td>
              <Td align="right" className="text-success-500">{money(row.received)}</Td>
            </tr>
          ))}
          <TotalRow>
            <Td> </Td>
            <Td> </Td>
            <Td>Total</Td>
            <Td align="right">{money(cashAuditTotal.open)}</Td>
            <Td align="right">{money(cashAuditTotal.sales)}</Td>
            <Td align="right">{money(cashAuditTotal.tip)}</Td>
            <Td align="right">{money(cashAuditTotal.close)}</Td>
            <Td align="right">{money(cashAuditTotal.total)}</Td>
            <Td align="right">{money(cashAuditTotal.cashGratuity)}</Td>
            <Td align="right">{money(cashAuditTotal.nonCashTip)}</Td>
            <Td align="right">{money(cashAuditTotal.cashTip)}</Td>
            <Td align="right">{money(cashAuditTotal.nonCashTipWithheld)}</Td>
            <Td align="right">{money(cashAuditTotal.gratuityWithheld)}</Td>
            <Td align="right" className={amountClass(cashAuditTotal.owedToRest)}>
              {money(cashAuditTotal.owedToRest)}
            </Td>
            <Td align="right">{money(cashAuditTotal.received)}</Td>
          </TotalRow>
        </DenseTable>
      </ReportCard>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <ReportCard title="10. Rounding adjustment summary">
          <div className="px-2 py-1">
            {rounding.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-3 py-0.5 text-[11px] leading-4"
              >
                <span className="text-text-secondary">{row.label}</span>
                <span className={amountClass(row.amount)}>{money(row.amount)}</span>
              </div>
            ))}
            <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-card-border pt-1 text-[11px] leading-4 font-semibold">
              <span>Total rounding adjustment</span>
              <span className={amountClass(roundingTotal)}>
                {money(roundingTotal)}
              </span>
            </div>
          </div>
        </ReportCard>

        <ReportCard title="11. External payment summary">
          <DenseTable
            head={[
              { label: "#" },
              { label: "Type" },
              { label: "Count", align: "right" },
              { label: "Amount", align: "right" },
            ]}
          >
            {externalPayments.map((row) => (
              <tr key={row.type}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.type}</Td>
                <Td align="right">{row.count}</Td>
                <Td align="right" className="text-success-500">{money(row.amount)}</Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td>Total</Td>
              <Td align="right">{externalPaymentTotal.count}</Td>
              <Td align="right">{money(externalPaymentTotal.amount)}</Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>

        <ReportCard title="12. Gift card payment summary">
          <DenseTable
            head={[
              { label: "#" },
              { label: "Gift card" },
              { label: "Count", align: "right" },
              { label: "Amount", align: "right" },
            ]}
          >
            {giftCardPayments.map((row) => (
              <tr key={row.name}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.name}</Td>
                <Td align="right">{row.count}</Td>
                <Td align="right" className="text-success-500">{money(row.amount)}</Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td>Total</Td>
              <Td align="right">{giftCardPaymentTotal.count}</Td>
              <Td align="right">{money(giftCardPaymentTotal.amount)}</Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <ReportCard title="13. Gift card purchase summary">
          <EmptyState />
        </ReportCard>
        <ReportCard title="14. Void items">
          <DenseTable
            head={[
              { label: "#" },
              { label: "Void reason" },
              { label: "Count", align: "right" },
              { label: "Employee" },
              { label: "Shift", align: "right" },
            ]}
          >
            {voidItems.map((row) => (
              <tr key={row.reason}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.reason}</Td>
                <Td align="right">{row.count}</Td>
                <Td>{row.employee}</Td>
                <Td align="right">{row.shift}</Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td>Total</Td>
              <Td align="right">
                {voidItems.reduce((sum, row) => sum + row.count, 0)}
              </Td>
              <Td> </Td>
              <Td> </Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <ReportCard title="15. Return / void transaction" className="min-w-0">
          <DenseTable
            minWidth="36rem"
            head={[
              { label: "#" },
              { label: "Check #" },
              { label: "Type" },
              { label: "Tender" },
              { label: "Amount", align: "right" },
              { label: "Performed by" },
              { label: "Terminal" },
            ]}
          >
            {returnsVoids.map((row) => (
              <tr key={`${row.check}-${row.type}-${row.amount}`}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.check}</Td>
                <Td>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[10px] font-semibold",
                      row.type === "VOID"
                        ? "bg-badge-error-background text-badge-error-text"
                        : "bg-badge-warning-background text-badge-warning-text",
                    )}
                  >
                    {row.type}
                  </span>
                </Td>
                <Td>{row.tender}</Td>
                <Td align="right" className={amountClass(row.amount, true)}>
                  {money(row.amount)}
                </Td>
                <Td>{row.by}</Td>
                <Td>{row.terminal}</Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td> </Td>
              <Td>Total</Td>
              <Td> </Td>
              <Td align="right" className={amountClass(returnsVoidsTotal)}>
                {money(returnsVoidsTotal)}
              </Td>
              <Td> </Td>
              <Td> </Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>

        <ReportCard title="16. Discount summary" className="min-w-0">
          <DenseTable
            minWidth="40rem"
            head={[
              { label: "#" },
              { label: "Check #" },
              { label: "Discount name" },
              { label: "Reason" },
              { label: "Before", align: "right" },
              { label: "Amount", align: "right" },
              { label: "After", align: "right" },
            ]}
          >
            {discounts.map((row) => (
              <tr key={`${row.no}-${row.check}`}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.check}</Td>
                <Td>{row.name}</Td>
                <Td>{row.reason}</Td>
                <Td align="right" className={amountClass(row.before)}>
                  {money(row.before)}
                </Td>
                <Td align="right" className={amountClass(row.amount)}>
                  {money(row.amount)}
                </Td>
                <Td
                  align="right"
                  className={
                    row.after < 0 ? "text-success-500" : "text-error-500"
                  }
                >
                  {money(row.after)}
                </Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td> </Td>
              <Td>Total</Td>
              <Td> </Td>
              <Td align="right">{money(discountTotal.before)}</Td>
              <Td align="right" className={amountClass(discountTotal.amount)}>
                {money(discountTotal.amount)}
              </Td>
              <Td align="right">{money(discountTotal.after)}</Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>
      </div>

      <ReportCard title="17. Employee clock in / out">
        <DenseTable
          minWidth="44rem"
          head={[
            { label: "#" },
            { label: "Employee" },
            { label: "#Trans", align: "right" },
            { label: "Role" },
            { label: "Clock in" },
            { label: "Clock out" },
            { label: "Break" },
            { label: "Work hours" },
            { label: "Total sale", align: "right" },
          ]}
        >
          {clockIns.map((row) => (
            <tr key={row.employee}>
              <Td>{row.no}</Td>
              <Td className="font-medium text-text-primary">{row.employee}</Td>
              <Td align="right">{row.trans}</Td>
              <Td>{row.role}</Td>
              <Td>{row.clockIn}</Td>
              <Td>{row.clockOut}</Td>
              <Td>{row.breakHours}</Td>
              <Td>{row.workHours}</Td>
              <Td align="right">{money(row.totalSale)}</Td>
            </tr>
          ))}
          <TotalRow>
            <Td> </Td>
            <Td>Total</Td>
            <Td align="right">{clockInTotal.trans}</Td>
            <Td> </Td>
            <Td> </Td>
            <Td> </Td>
            <Td>{clockInTotal.breakHours}</Td>
            <Td>{clockInTotal.workHours}</Td>
            <Td align="right">{money(clockInTotal.totalSale)}</Td>
          </TotalRow>
        </DenseTable>
      </ReportCard>

      <ReportCard title="18. Menu item stock status">
        <EmptyState />
      </ReportCard>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[10px] text-text-tertiary">{label}</p>
      <p className="truncate font-medium text-text-primary">{value}</p>
    </div>
  );
}
