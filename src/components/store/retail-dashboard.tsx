"use client";

import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeading,
  NavButton,
} from "@/components/tailgrids/core/calendar";
import { Button } from "@/components/tailgrids/core/button";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/tailgrids/core/chart";
import {
  DatePicker,
  DatePickerGroup,
  DatePickerPopover,
  DatePickerTrigger,
} from "@/components/tailgrids/core/date-picker";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { cn } from "@/utils/cn";
import {
  getLocalTimeZone,
  today,
  type CalendarDate,
} from "@internationalized/date";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  LuBan,
  LuBarcode,
  LuBoxes,
  LuCalendar,
  LuCalendarClock,
  LuCalendarDays,
  LuCalendarRange,
  LuCalendarSync,
  LuChartColumn,
  LuChevronDown,
  LuChevronRight,
  LuClock,
  LuClock3,
  LuCreditCard,
  LuDatabase,
  LuDollarSign,
  LuFileText,
  LuHash,
  LuHourglass,
  LuLayers,
  LuPackage,
  LuReceipt,
  LuReceiptText,
  LuRefreshCw,
  LuShoppingCart,
  LuTrash2,
} from "react-icons/lu";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

type Metric = {
  label: string;
  value: string;
  detail?: string;
  icon: IconType;
  accent: string;
  iconStyle: string;
};

type Shortcut = {
  label: string;
  value: string;
  icon: IconType;
  surface: string;
};

type SalesRow = {
  at: string;
  transactions: number;
  qty: number;
  gross: number;
  net: number;
};

type TrendPoint = {
  day: string;
  gross: number;
  net: number;
};

type InvoiceRow = {
  invoice: string;
  supplier: string;
  qty: number;
  amount: number;
};

type ReminderRow = {
  due: string;
  supplier: string;
  amount: number;
};

const metrics: Metric[] = [
  {
    label: "# Transactions",
    value: "2",
    icon: LuHash,
    accent: "border-t-primary-500",
    iconStyle: "bg-badge-primary-background text-badge-primary-icon-color",
  },
  {
    label: "Gross Sale",
    value: "$41.40",
    icon: LuDollarSign,
    accent: "border-t-success-500",
    iconStyle: "bg-badge-success-background text-badge-success-icon-color",
  },
  {
    label: "Net Sale",
    value: "$37.98",
    icon: LuChartColumn,
    accent: "border-t-violet-500",
    iconStyle: "bg-badge-violet-background text-badge-violet-icon-color",
  },
  {
    label: "# Hold Trans",
    value: "10",
    icon: LuHourglass,
    accent: "border-t-warning-500",
    iconStyle: "bg-badge-warning-background text-badge-warning-icon-color",
  },
  {
    label: "Hold Sale",
    value: "$1,379.71",
    icon: LuBoxes,
    accent: "border-t-info-500",
    iconStyle: "bg-badge-cyan-background text-badge-cyan-icon-color",
  },
  {
    label: "Inventory",
    value: "9107",
    detail: "20864U",
    icon: LuPackage,
    accent: "border-t-error-500",
    iconStyle: "bg-badge-error-background text-badge-error-icon-color",
  },
  {
    label: "Inventory Value",
    value: "$1,006,093.92",
    icon: LuDatabase,
    accent: "border-t-orange-500",
    iconStyle: "bg-badge-orange-background text-badge-orange-icon-color",
  },
];

const shortcuts: Shortcut[] = [
  {
    label: "# Pending PO",
    value: "15",
    icon: LuShoppingCart,
    surface: "bg-badge-sky-background text-badge-sky-text",
  },
  {
    label: "Open Invoices",
    value: "1",
    icon: LuFileText,
    surface: "bg-badge-success-background text-badge-success-text",
  },
  {
    label: "Void Items",
    value: "3",
    icon: LuBan,
    surface: "bg-badge-pink-background text-badge-pink-text",
  },
  {
    label: "Discard Trans",
    value: "2",
    icon: LuTrash2,
    surface: "bg-badge-violet-background text-badge-violet-text",
  },
];

const salesRows: SalesRow[] = [
  {
    at: "10/26/2026 6:12 AM",
    transactions: 2,
    qty: 36,
    gross: 41.4,
    net: 37.98,
  },
  {
    at: "10/26/2026 10:51 AM",
    transactions: 38,
    qty: 908,
    gross: 1166.44,
    net: 1068.39,
  },
  {
    at: "10/23/2026 12:54 PM",
    transactions: 17,
    qty: 190,
    gross: 429.82,
    net: 394.33,
  },
  {
    at: "10/22/2026 12:48 PM",
    transactions: 3,
    qty: 63,
    gross: 140.92,
    net: 128.83,
  },
  {
    at: "10/19/2026 7:04 AM",
    transactions: 2,
    qty: 42,
    gross: 56.66,
    net: 51.98,
  },
  {
    at: "10/19/2026 6:53 AM",
    transactions: 1,
    qty: 18,
    gross: 18.52,
    net: 16.99,
  },
  {
    at: "10/19/2026 11:53 AM",
    transactions: 28,
    qty: 495,
    gross: 715.09,
    net: 656.07,
  },
];

const trend: TrendPoint[] = [
  { day: "Oct 19", gross: 715.09, net: 656.07 },
  { day: "Oct 20", gross: 56.66, net: 51.98 },
  { day: "Oct 21", gross: 18.52, net: 16.99 },
  { day: "Oct 22", gross: 140.92, net: 128.83 },
  { day: "Oct 23", gross: 429.82, net: 394.33 },
  { day: "Oct 24", gross: 1166.44, net: 1068.39 },
  { day: "Oct 26", gross: 41.4, net: 37.98 },
];

const invoices: InvoiceRow[] = [
  { invoice: "Brea23102623320", supplier: "Breakthru", qty: 1, amount: 18.17 },
  { invoice: "2323", supplier: "Full Tilt Brewing Llc", qty: 10, amount: 10 },
  { invoice: "123", supplier: "Breakthru", qty: 26, amount: 121.33 },
];

const reminders: ReminderRow[] = [
  { due: "10/23/2026 12:00:00 AM", supplier: "Breakthru", amount: 18.17 },
  {
    due: "10/22/2026 12:00:00 AM",
    supplier: "Full Tilt Brewing Llc",
    amount: 10,
  },
  { due: "10/21/2026 12:00:00 AM", supplier: "Breakthru", amount: 121.33 },
  { due: "10/16/2026 12:00:00 AM", supplier: "Breakthru", amount: 56 },
  {
    due: "10/1/2026 12:00:00 AM",
    supplier: "Dmv Distributing",
    amount: 638.34,
  },
  {
    due: "10/1/2026 12:00:00 AM",
    supplier: "Backup Beverages",
    amount: 1007.1,
  },
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const quantity = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const businessDateLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function sumBy<T>(rows: T[], read: (row: T) => number) {
  return rows.reduce((total, row) => total + read(row), 0);
}

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatBusinessDate(value: CalendarDate) {
  const formatted = businessDateLabel.format(value.toDate(getLocalTimeZone()));
  const isToday = value.compare(today(getLocalTimeZone())) === 0;
  return isToday ? `Today (${formatted})` : formatted;
}

function niceMax(value: number) {
  if (value <= 0) return 100;
  const padded = value * 1.35;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  const step = magnitude / 2;
  return Math.ceil(padded / step) * step;
}

function Panel({
  icon: Icon,
  title,
  action,
  children,
  footer,
}: {
  icon: IconType;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-card-border bg-card-surface-area shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-badge-primary-background text-badge-primary-icon-color">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        </div>
        {action}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
      {footer ? <div className="mt-auto">{footer}</div> : null}
    </section>
  );
}

function ViewAll() {
  return (
    <Link
      href="/report"
      className="rounded-full border border-card-border bg-card-surface-area px-3 py-1 text-xs font-semibold text-text-primary shadow-xs transition hover:bg-background-gray-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20"
    >
      View All
    </Link>
  );
}

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
  accent,
  iconStyle,
}: Metric) {
  return (
    <article
      className={cn(
        "h-full rounded-2xl border border-card-border border-t-[3px] bg-card-surface-area p-4 shadow-xs",
        accent,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">
            {value}
          </p>
          {detail ? (
            <p className="mt-1 text-xs font-medium text-text-tertiary">{detail}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            iconStyle,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function ShortcutTile({ label, value, icon: Icon, surface }: Shortcut) {
  return (
    <Link
      href="/report"
      className={cn(
        "flex h-full min-h-[72px] items-center gap-3 rounded-xl px-3 py-3 shadow-xs transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20",
        surface,
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-card-surface-area shadow-xs">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium opacity-80">
          {label}
        </span>
        <span className="mt-0.5 block text-lg font-semibold tracking-tight">
          {value}
        </span>
      </span>
      <LuChevronRight
        className="ml-auto size-4 shrink-0 opacity-70"
        aria-hidden="true"
      />
    </Link>
  );
}

function BusinessDateControl({
  value,
  onChange,
}: {
  value: CalendarDate;
  onChange: (value: CalendarDate) => void;
}) {
  return (
    <DatePicker
      aria-label="Business date"
      className="w-auto gap-0"
      value={value}
      onChange={(next) => {
        if (next) onChange(next);
      }}
    >
      <DatePickerGroup>
        <DatePickerTrigger className="static! top-auto! right-auto! inline-flex! h-10 translate-none! items-center gap-2 rounded-xl border border-card-border bg-button-outline-background px-3 text-sm font-medium text-button-outline-text shadow-xs outline-none hover:bg-button-outline-hover-background focus-visible:ring-4 focus-visible:ring-primary-500/20">
          <LuCalendar
            className="size-4 text-icon-secondary"
            aria-hidden="true"
          />
          <span className="whitespace-nowrap">{formatBusinessDate(value)}</span>
          <LuChevronDown
            className="size-4 text-icon-tertiary"
            aria-hidden="true"
          />
        </DatePickerTrigger>
      </DatePickerGroup>
      <DatePickerPopover className="z-50">
        <Calendar
          aria-label="Business date"
          className="w-fit rounded-2xl border border-card-border bg-dropdowns-background p-3 shadow-lg"
        >
          <CalendarHeader className="mb-2">
            <NavButton slot="previous" className="size-8" />
            <CalendarHeading className="text-sm font-medium" />
            <NavButton slot="next" className="size-8" />
          </CalendarHeader>
          <CalendarGrid>
            <CalendarGridHeader className="pb-1 text-[0.65rem]" />
            <CalendarGridBody>
              {(date) => (
                <CalendarCell
                  date={date}
                  className="size-8 text-xs sm:size-8"
                />
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </Calendar>
      </DatePickerPopover>
    </DatePicker>
  );
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-card-border bg-dropdowns-background px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-text-secondary">{label}</p>
      <p className="mt-1 font-semibold text-text-primary">
        {money.format(Number(payload[0]?.value ?? 0))}
      </p>
    </div>
  );
}

function SalesTrendChart({
  metric,
  range,
}: {
  metric: "gross" | "net";
  range: "7" | "3";
}) {
  const points = range === "3" ? trend.slice(-3) : trend;
  const max = niceMax(Math.max(...points.map((point) => point[metric])));
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];

  return (
    <div className="h-full min-h-72 overflow-x-auto px-2 pt-3 pb-2">
      <div className="h-full min-h-72 min-w-[40rem]">
        <ChartContainer className="h-full w-full" height="100%" width="100%">
          <BarChart
            data={points}
            margin={{ top: 28, right: 12, left: 4, bottom: 0 }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              stroke="var(--card-border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              dy={8}
              interval={0}
              tick={{ fill: "var(--color-text-tertiary)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={64}
              domain={[0, max]}
              ticks={ticks}
              tickFormatter={(value: number) =>
                `$${Number(value).toLocaleString("en-US")}`
              }
              tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fill: "var(--badge-primary-background)" }}
              content={TrendTooltip}
            />
            <Bar
              dataKey={metric}
              fill="var(--primary-500)"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
            >
              <LabelList
                dataKey={metric}
                position="top"
                offset={8}
                formatter={(value) => money.format(Number(value))}
                style={{
                  fill: "var(--text-secondary)",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

export function RetailDashboard({ storeName }: { storeName: string }) {
  const { data: session } = useSession();
  const [businessDate, setBusinessDate] = useState(() =>
    today(getLocalTimeZone()),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [metric, setMetric] = useState<"gross" | "net">("gross");
  const [range, setRange] = useState<"7" | "3">("7");
  const refreshTimer = useRef<number | null>(null);
  const userName = session?.user?.name?.trim();
  const greeting = greetingFor(new Date());

  useEffect(() => {
    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    };
  }, []);

  const salesTotals = useMemo(
    () => ({
      transactions: sumBy(salesRows, (row) => row.transactions),
      qty: sumBy(salesRows, (row) => row.qty),
      gross: sumBy(salesRows, (row) => row.gross),
      net: sumBy(salesRows, (row) => row.net),
    }),
    [],
  );
  const invoiceQty = sumBy(invoices, (row) => row.qty);
  const invoiceAmount = sumBy(invoices, (row) => row.amount);
  const reminderAmount = sumBy(reminders, (row) => row.amount);

  function refresh() {
    setBusinessDate(today(getLocalTimeZone()));
    setRefreshing(true);
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => setRefreshing(false), 700);
  }

  return (
    <div className="space-y-4 px-2 py-4 sm:px-4 lg:px-5">
      <p className="sr-only">
        Sample preview for {storeName}. These dashboard figures are not live
        retail totals.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            {greeting}
            {userName ? `, ${userName}` : ""}
            <span className="text-text-secondary"> · {storeName}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BusinessDateControl
            value={businessDate}
            onChange={setBusinessDate}
          />
          <Button
            appearance="outline"
            size="sm"
            className="h-10 gap-2 rounded-xl px-3.5 py-0 text-sm"
            onPress={refresh}
          >
            <LuRefreshCw
              className={cn("size-4", refreshing && "animate-spin")}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>
      </div>

      <section
        aria-label="Sales and inventory summary"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7"
      >
        {metrics.map((item) => (
          <MetricTile key={item.label} {...item} />
        ))}
      </section>

      <section
        aria-label="Open work"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {shortcuts.map((item) => (
          <ShortcutTile key={item.label} {...item} />
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel icon={LuReceipt} title="Sales Detail" action={<ViewAll />}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <caption className="sr-only">Sample sales detail</caption>
              <thead>
                <tr className="text-xs font-medium text-text-tertiary">
                  <th className="px-4 py-2.5 text-left font-medium">
                    Date & Time
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    # Trans
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    Qty Sold
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    Gross Sales
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    Net Sales
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesRows.map((row, index) => (
                  <tr
                    key={row.at}
                    className={cn(
                      "border-t border-card-border text-text-secondary",
                      index === 0 &&
                        "bg-badge-primary-background text-text-primary",
                    )}
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap">{row.at}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {row.transactions}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {quantity.format(row.qty)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {money.format(row.gross)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {money.format(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-card-border bg-background-gray-secondary text-sm font-semibold text-text-primary">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {salesTotals.transactions}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {quantity.format(salesTotals.qty)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {money.format(salesTotals.gross)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {money.format(salesTotals.net)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        <Panel
          icon={LuChartColumn}
          title="Sales Trend"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="Sales trend metric"
                className="w-auto gap-0"
                value={metric}
                onChange={(key) => {
                  if (key === "gross" || key === "net") setMetric(key);
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="h-8 min-w-32 gap-2 rounded-lg px-2.5 py-0 text-xs"
                >
                  <SelectValue />
                  <SelectIndicator />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem id="gross" textValue="Gross Sales">
                    Gross Sales
                  </SelectItem>
                  <SelectItem id="net" textValue="Net Sales">
                    Net Sales
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                aria-label="Sales trend range"
                className="w-auto gap-0"
                value={range}
                onChange={(key) => {
                  if (key === "7" || key === "3") setRange(key);
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="h-8 min-w-32 gap-2 rounded-lg px-2.5 py-0 text-xs"
                >
                  <SelectValue />
                  <SelectIndicator />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem id="7" textValue="Last 7 Days">
                    Last 7 Days
                  </SelectItem>
                  <SelectItem id="3" textValue="Last 3 Days">
                    Last 3 Days
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          <SalesTrendChart metric={metric} range={range} />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          icon={LuFileText}
          title="Invoices (Last 7 Days)"
          action={<ViewAll />}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border bg-background-gray-primary px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
                <span className="grid size-8 place-items-center rounded-lg bg-badge-primary-background text-badge-primary-icon-color">
                  <LuLayers className="size-4" aria-hidden="true" />
                </span>
                Total Qty : {quantity.format(invoiceQty)}
              </span>
              <span className="text-sm font-semibold text-text-primary">
                Total Amount : {money.format(invoiceAmount)}
              </span>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <caption className="sr-only">
                Sample invoices for the last 7 days
              </caption>
              <thead>
                <tr className="text-xs font-medium text-text-tertiary">
                  <th className="px-4 py-2.5 text-left font-medium">
                    Invoice No
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium">
                    Supplier
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium">Qty</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((row, index) => (
                  <tr
                    key={row.invoice}
                    className={cn(
                      "border-t border-card-border text-text-secondary",
                      index === 0 &&
                        "bg-badge-primary-background text-text-primary",
                    )}
                  >
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap text-text-primary">
                      {row.invoice}
                    </td>
                    <td className="px-3 py-2.5">{row.supplier}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {quantity.format(row.qty)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {money.format(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          icon={LuClock}
          title="Invoice Payment Reminder"
          action={<ViewAll />}
          footer={
            <div className="flex items-center justify-end gap-2 border-t border-card-border bg-badge-error-background px-4 py-3">
              <span className="grid size-8 place-items-center rounded-full bg-error-500 text-white-100">
                <LuDollarSign className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-error-500">
                Total Amount : {money.format(reminderAmount)}
              </span>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <caption className="sr-only">
                Sample invoice payment reminders
              </caption>
              <thead>
                <tr className="text-xs font-medium text-text-tertiary">
                  <th className="px-4 py-2.5 text-left font-medium">
                    Due Date
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium">
                    Supplier
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((row, index) => (
                  <tr
                    key={`${row.due}-${row.supplier}`}
                    className={cn(
                      "border-t border-card-border text-text-secondary",
                      index === 0 &&
                        "bg-badge-primary-background text-text-primary",
                    )}
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap">{row.due}</td>
                    <td className="px-3 py-2.5">{row.supplier}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {money.format(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const quickReports: Array<{
  title: string;
  description: string;
  href?: string;
  icon: IconType;
  iconClassName: string;
}> = [
  {
    title: "Transaction Journal",
    description: "Review posted sales transactions.",
    icon: LuReceiptText,
    iconClassName: "bg-badge-primary-background text-badge-primary-icon-color",
  },
  {
    title: "Day-End Report",
    description: "Review completed day-end batches and totals.",
    icon: LuCalendarClock,
    iconClassName: "bg-badge-sky-background text-badge-sky-icon-color",
  },
  {
    title: "Shift End Report",
    description: "Find shifts by a single date or a date range.",
    href: "/report/shift-report",
    icon: LuClock3,
    iconClassName: "bg-badge-pink-background text-badge-pink-icon-color",
  },
  {
    title: "Credit Card Transaction Details",
    description: "Review card payments and settlement details.",
    icon: LuCreditCard,
    iconClassName: "bg-badge-violet-background text-badge-violet-icon-color",
  },
  {
    title: "Week End Report",
    description: "Summarize sales for a selected week.",
    icon: LuCalendarRange,
    iconClassName: "bg-badge-success-background text-badge-success-icon-color",
  },
  {
    title: "Month End Report",
    description: "Summarize sales for a selected month.",
    icon: LuCalendarDays,
    iconClassName: "bg-badge-warning-background text-badge-warning-icon-color",
  },
  {
    title: "Year End Report",
    description: "Summarize sales for a selected year.",
    icon: LuCalendarSync,
    iconClassName: "bg-badge-orange-background text-badge-orange-icon-color",
  },
  {
    title: "Monthly Sales and Tax Report",
    description: "Review monthly sales totals and tax collected.",
    icon: LuChartColumn,
    iconClassName: "bg-badge-cyan-background text-badge-cyan-icon-color",
  },
  {
    title: "Invoice Report",
    description: "Review supplier invoices and payments.",
    icon: LuFileText,
    iconClassName: "bg-badge-error-background text-badge-error-icon-color",
  },
  {
    title: "NoUPC Details Report",
    description: "Review items sold without a UPC.",
    icon: LuBarcode,
    iconClassName: "bg-badge-primary-background text-badge-primary-icon-color",
  },
];

export function RetailReports({ storeName }: { storeName: string }) {
  return (
    <div className="space-y-6 px-3 py-6 sm:px-5 lg:px-6">
      <div>
        <p className="text-sm font-medium text-primary-500">Retail POS</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
          Retail reports
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-tertiary">
          Quick reports for {storeName}.
        </p>
      </div>

      <section aria-label="Quick reports" className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-text-tertiary uppercase">
          Quick reports
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickReports.map((report) => {
            const Icon = report.icon;
            const body = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <span className={`grid size-11 place-items-center rounded-xl ${report.iconClassName}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {report.href ? (
                    <LuChevronRight className="size-5 text-icon-tertiary transition-transform group-hover:translate-x-1 group-hover:text-primary-500" />
                  ) : null}
                </div>
                <h3 className="mt-4 text-base font-semibold text-text-primary">{report.title}</h3>
                <p className="mt-1 text-sm leading-5 text-text-tertiary">{report.description}</p>
                {report.href ? null : (
                  <p className="mt-3 text-xs font-medium text-text-tertiary">Coming next</p>
                )}
              </>
            );

            if (report.href) {
              return (
                <Link
                  key={report.title}
                  href={report.href}
                  className="group flex min-h-36 flex-col rounded-2xl border border-card-border bg-card-surface-area p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20"
                >
                  {body}
                </Link>
              );
            }

            return (
              <article
                key={report.title}
                className="flex min-h-36 flex-col rounded-2xl border border-card-border bg-card-surface-area p-5 shadow-xs"
              >
                {body}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
