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
import { useStore } from "@/components/store/store-provider";
import { cn } from "@/utils/cn";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LuRotateCcw, LuUpload } from "react-icons/lu";
import {
  retailWeekEndDetailForWeek,
  type RetailWeekEndDepartment,
  type RetailWeekEndLine,
  type RetailWeekEndTax,
} from "./retail-week-end-data";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const SHORT_MONTHS = [
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
] as const;

const PAST_MONTH_COUNT = 24;

type MonthOption = {
  id: string;
  label: string;
  year: number;
  monthIndex: number;
};

type WeekOption = {
  id: string;
  label: string;
  weekNumber: number;
  start: Date;
  end: Date;
};

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
  #retail-week-end-print, #retail-week-end-print * {
    color: #111827 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  #retail-week-end-print {
    background: #fff !important;
    padding: 12mm !important;
  }
  #retail-week-end-print .shift-title-bar,
  #retail-week-end-print .shift-title-bar * {
    background: #1f2937 !important;
    color: #fff !important;
  }
  #retail-week-end-print thead,
  #retail-week-end-print thead * {
    background: #f3f4f6 !important;
    color: #111827 !important;
  }
  #retail-week-end-print section {
    background: #fff !important;
    border-color: #e5e7eb !important;
    break-inside: avoid;
  }
}
`;

function monthId(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function dateId(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function padDay(day: number) {
  return String(day).padStart(2, "0");
}

function formatWeekDate(date: Date) {
  return `${padDay(date.getDate())}-${SHORT_MONTHS[date.getMonth()]}-${date.getFullYear()}`;
}

function buildMonthOptions(now: Date): MonthOption[] {
  const options: MonthOption[] = [];
  for (let offset = 0; offset < PAST_MONTH_COUNT; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1, 12);
    options.push({
      id: monthId(date.getFullYear(), date.getMonth()),
      label: `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`,
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
    });
  }
  return options;
}

function weeksForMonth(year: number, monthIndex: number): WeekOption[] {
  const first = new Date(year, monthIndex, 1, 12);
  const last = new Date(year, monthIndex + 1, 0, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  const firstMonday = new Date(first);
  firstMonday.setDate(first.getDate() - mondayOffset);
  const monthName = MONTH_LABELS[monthIndex];
  const weeks: WeekOption[] = [];

  for (let start = firstMonday, number = 1; start <= last; number += 1) {
    const weekStart = new Date(start);
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weeks.push({
      id: dateId(weekStart),
      weekNumber: number,
      label: `${monthName} Week-${number} (${formatWeekDate(weekStart)} To ${formatWeekDate(weekEnd)})`,
      start: weekStart,
      end: weekEnd,
    });
    start = new Date(start);
    start.setDate(start.getDate() + 7);
  }
  return weeks;
}

function defaultWeekId(weeks: WeekOption[], now: Date) {
  return (
    weeks.find((week) => now >= week.start && now <= week.end)?.id ??
    weeks[0]?.id ??
    ""
  );
}

function formatPrintedAt(date: Date) {
  const month = SHORT_MONTHS[date.getMonth()];
  const day = padDay(date.getDate());
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

function Lines({ rows }: { rows: RetailWeekEndLine[] }) {
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
          <dt className={row.emphasize ? "text-text-primary" : "text-text-secondary"}>
            {row.label}
          </dt>
          <dd className="tabular-nums text-text-primary">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const headCell =
  "px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-text-secondary";
const bodyCell = "px-3 py-2 text-sm whitespace-nowrap text-text-secondary tabular-nums";

function DepartmentTable({
  rows,
  total,
}: {
  rows: RetailWeekEndDepartment[];
  total: RetailWeekEndDepartment;
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
                  label !== "Department Name" && label !== "Trans#" && "text-right",
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.trans}-${row.name}`} className="border-t border-card-border">
              <td className={bodyCell}>{row.trans}</td>
              <td className={cn(bodyCell, "text-text-primary")}>{row.name}</td>
              <td className={cn(bodyCell, "text-right")}>{row.quantity}</td>
              <td className={cn(bodyCell, "text-right")}>{row.discountAmount}</td>
              <td className={cn(bodyCell, "text-right")}>{row.discountPercent}</td>
              <td className={cn(bodyCell, "text-right")}>{row.subTotal}</td>
              <td className={cn(bodyCell, "text-right")}>{row.tax}</td>
              <td className={cn(bodyCell, "text-right")}>{row.total}</td>
              <td className={cn(bodyCell, "text-right")}>{row.share}</td>
            </tr>
          ))}
          <tr className="border-t border-card-border font-semibold text-text-primary">
            <td className={bodyCell} />
            <td className={cn(bodyCell, "text-text-primary")}>{total.name}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.quantity}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.discountAmount}
            </td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>
              {total.discountPercent}
            </td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.subTotal}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.tax}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.total}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.share}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TaxTable({ rows, total }: { rows: RetailWeekEndTax[]; total: RetailWeekEndTax }) {
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
              <th key={label} className={cn(headCell, label !== "TaxName" && "text-right")}>
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
          <tr className="border-t border-card-border font-semibold text-text-primary">
            <td className={cn(bodyCell, "text-text-primary")}>{total.name}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.quantity}</td>
            <td className={bodyCell} />
            <td className={bodyCell} />
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.tax}</td>
            <td className={cn(bodyCell, "text-right text-text-primary")}>{total.share}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  wide = false,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
  wide?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-sm font-normal text-text-secondary">{label}</span>
      <Select aria-label={label} value={value} onChange={(key) => onChange(String(key))}>
        <SelectTrigger
          size="sm"
          className={cn("h-9 border-card-border bg-card-surface-area text-sm", wide ? "min-w-72" : "min-w-44")}
        >
          <SelectValue />
          <SelectIndicator />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} id={option.id} textValue={option.label}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function RetailWeekEndReport() {
  const { selectedStore } = useStore();
  const now = useMemo(() => new Date(), []);
  const monthOptions = useMemo(() => buildMonthOptions(now), [now]);
  const [draftMonth, setDraftMonth] = useState(monthOptions[0]?.id ?? "");
  const [draftWeek, setDraftWeek] = useState("");
  const [appliedWeekId, setAppliedWeekId] = useState<string | null>(null);
  const [printedAt, setPrintedAt] = useState("");

  const selectedMonth =
    monthOptions.find((month) => month.id === draftMonth) ?? monthOptions[0];
  const availableWeeks = useMemo(
    () =>
      selectedMonth
        ? weeksForMonth(selectedMonth.year, selectedMonth.monthIndex)
        : [],
    [selectedMonth],
  );

  useEffect(() => {
    if (!availableWeeks.length) {
      setDraftWeek("");
      return;
    }
    setDraftWeek((current) =>
      availableWeeks.some((week) => week.id === current)
        ? current
        : defaultWeekId(availableWeeks, now),
    );
  }, [availableWeeks, now]);

  useEffect(() => {
    setPrintedAt(formatPrintedAt(new Date()));
  }, [appliedWeekId]);

  const detail = appliedWeekId ? retailWeekEndDetailForWeek(appliedWeekId) : null;

  function changeMonth(monthIdValue: string) {
    setDraftMonth(monthIdValue);
    const month = monthOptions.find((entry) => entry.id === monthIdValue);
    if (!month) return;
    const weeks = weeksForMonth(month.year, month.monthIndex);
    setDraftWeek(defaultWeekId(weeks, now));
  }

  function resetFilters() {
    const firstMonth = monthOptions[0];
    setDraftMonth(firstMonth?.id ?? "");
    const weeks = firstMonth
      ? weeksForMonth(firstMonth.year, firstMonth.monthIndex)
      : [];
    setDraftWeek(defaultWeekId(weeks, now));
    setAppliedWeekId(null);
  }

  function exportPdf() {
    if (!detail) return;
    const previous = document.title;
    document.title = `WEEK END REPORT ${detail.titleRange}`;
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  return (
    <div className="min-h-full pb-6">
      <style>{printStyles}</style>
      <div className="retail-report-no-print flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">
          Week End Report
        </h1>
        <Breadcrumbs
          dividerType="slash"
          items={[
            { href: "/", label: "Dashboard" },
            { href: "/report/week-end-report", label: "Week End Report" },
          ]}
        />
      </div>

      <div className="space-y-4 px-3 sm:px-5">
        <section className="retail-report-no-print rounded-xl border border-card-border bg-card-surface-area px-4 py-4 shadow-xs sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <FilterSelect
              label="Month:"
              value={draftMonth}
              options={monthOptions}
              onChange={changeMonth}
            />
            <FilterSelect
              label="Week:"
              value={draftWeek}
              options={availableWeeks}
              onChange={setDraftWeek}
              wide
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              appearance="outline"
              className="h-9 px-4"
              disabled={!draftWeek}
              onPress={() => setAppliedWeekId(draftWeek)}
            >
              Search Report
            </Button>
            <Button
              size="sm"
              appearance="outline"
              className="h-9 gap-1.5 px-4 [&>svg]:size-3.5"
              onPress={resetFilters}
            >
              <LuRotateCcw /> Reset
            </Button>
          </div>
        </section>

        {appliedWeekId === null ? (
          <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">
              Select a month and week, then search the report.
            </p>
            <p className="mt-1 text-[11px] text-text-tertiary">
              Preview data is available for July Week-2 (07-Jul-2025 To 13-Jul-2025).
            </p>
          </div>
        ) : !detail ? (
          <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
            <p className="text-sm font-medium text-text-secondary">
              No week-end data found for the selected week.
            </p>
            <p className="mt-1 text-[11px] text-text-tertiary">
              Preview data is available for July Week-2 (07-Jul-2025 To 13-Jul-2025).
            </p>
          </div>
        ) : (
          <div id="retail-week-end-print" className="space-y-4">
            <div className="retail-report-no-print flex justify-end">
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
                WEEK END REPORT {detail.titleRange}
              </div>
              <div className="mt-3 flex flex-col gap-1 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
                <p>Date & Time: {printedAt}</p>
                <p>
                  Employee Name:{" "}
                  <span className="font-medium text-text-primary">
                    {detail.employeeName}
                  </span>
                </p>
              </div>
            </div>

            <Panel title="Department Sales Detail">
              <DepartmentTable rows={detail.departments} total={detail.departmentTotal} />
            </Panel>

            <div className="grid items-start gap-4 lg:grid-cols-2">
              <section className="overflow-hidden rounded-lg border border-card-border bg-card-surface-area">
                <Lines rows={detail.summary} />
              </section>
              <Panel title="Sales Breakdown">
                <Lines rows={detail.salesBreakdown} />
              </Panel>
            </div>

            <Panel title="Tax Detail">
              <TaxTable rows={detail.taxes} total={detail.taxTotal} />
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
