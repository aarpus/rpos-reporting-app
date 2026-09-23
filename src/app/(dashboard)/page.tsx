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
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/tailgrids/core/chart";
import { DateInput, DateSegment } from "@/components/tailgrids/core/date-field";
import {
  DatePicker,
  DatePickerGroup,
  DatePickerPopover,
  DatePickerTrigger,
} from "@/components/tailgrids/core/date-picker";
import { FieldLabel } from "@/components/tailgrids/core/field";
import { Toggle } from "@/components/tailgrids/core/toggle";
import { CalendarDate } from "@internationalized/date";
import { Calendar as CalendarIcon } from "@tailgrids/icons";
import { useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  LuClock,
  LuCreditCard,
  LuDollarSign,
  LuFileText,
  LuHandCoins,
  LuPercent,
  LuShoppingBag,
  LuTag,
  LuTrash2,
  LuTrendingUp,
  LuUndo2,
} from "react-icons/lu";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

const stats: [string, string, string, IconType, string, string][] = [
  [
    "Today's Orders",
    "39",
    "1126%",
    LuShoppingBag,
    "border-t-primary-500",
    "bg-badge-primary-background text-badge-primary-icon-color",
  ],
  [
    "Today's Sales",
    "$792.14",
    "170%",
    LuDollarSign,
    "border-t-success-500",
    "bg-badge-success-background text-badge-success-icon-color",
  ],
  [
    "Total Tax",
    "$56.14",
    "196%",
    LuPercent,
    "border-t-info-500",
    "bg-badge-sky-background text-badge-sky-icon-color",
  ],
  [
    "Gross Sales",
    "$848.28",
    "179%",
    LuTrendingUp,
    "border-t-warning-500",
    "bg-badge-warning-background text-badge-warning-icon-color",
  ],
  [
    "Payments Received",
    "$907.73",
    "215%",
    LuCreditCard,
    "border-t-violet-500",
    "bg-badge-violet-background text-badge-violet-icon-color",
  ],
];
const utilities: [string, string, IconType, string][] = [
  [
    "Total Discounts",
    "$67.05",
    LuTag,
    "bg-badge-pink-background text-badge-pink-icon-color",
  ],
  [
    "Tips & Gratuity",
    "$239.16",
    LuHandCoins,
    "bg-badge-success-background text-badge-success-icon-color",
  ],
  [
    "Total Fees",
    "$62.92",
    LuFileText,
    "bg-badge-sky-background text-badge-sky-icon-color",
  ],
  [
    "Refunds",
    "$53.27",
    LuUndo2,
    "bg-badge-warning-background text-badge-warning-icon-color",
  ],
  [
    "Void Transactions",
    "$84.84",
    LuTrash2,
    "bg-badge-error-background text-badge-error-icon-color",
  ],
  [
    "Labor Hours",
    "8:05",
    LuClock,
    "bg-badge-violet-background text-badge-violet-icon-color",
  ],
];
const departments = [
  ["Liquor", "$268.05", "36.97%", "bg-primary-500", "w-full"],
  ["Beer", "$233.94", "32.26%", "bg-success-500", "w-[87%]"],
  ["Food", "$105.52", "14.55%", "bg-warning-500", "w-[39%]"],
  ["Beverages", "$79.68", "10.99%", "bg-violet-500", "w-[30%]"],
  ["Misc", "$37.90", "5.23%", "bg-pink-500", "w-[14%]"],
] as const;
const items = [
  ["Angry Orchard Btl", "7", "9", "3.76%", "$29.26"],
  ["Bacardi Rum", "6", "6", "4.29%", "$33.41"],
  ["Redbull", "6", "6", "3.50%", "$27.26"],
  ["Juice", "6", "6", "2.50%", "$19.44"],
  ["Ice Tea 20oz", "6", "6", "1.53%", "$11.94"],
  ["12in Pepperoni Pizza", "5", "5", "5.57%", "$43.40"],
  ["Canadian Club", "5", "5", "3.41%", "$26.52"],
] as const;
const orders = [
  ["3002", "Dine in", "-$36.00", "Refund", "05:20 PM"],
  ["4001", "Dine in", "$100.47", "Paid", "05:10 PM"],
  ["2003", "Dine in", "-$2.25", "Refund", "05:02 PM"],
  ["2002", "Dine in", "$2.25", "Paid", "05:01 PM"],
  ["2001", "Dine in", "$11.45", "Paid", "05:01 PM"],
  ["3035", "Dine in", "-$4.70", "Void", "02:52 PM"],
  ["2034", "Dine in", "-$56.35", "Void", "02:50 PM"],
] as const;
type PieSlice = {
  name: string;
  value: number;
  displayValue: string;
  percentage: number;
  color: string;
};

const orderSummary: PieSlice[] = [
  {
    name: "Dine-in",
    value: 24,
    displayValue: "24",
    percentage: 70.59,
    color: "var(--primary-500)",
  },
  {
    name: "To-Go",
    value: 5,
    displayValue: "5",
    percentage: 14.71,
    color: "var(--success-500)",
  },
  {
    name: "Delivery",
    value: 5,
    displayValue: "5",
    percentage: 14.71,
    color: "var(--warning-500)",
  },
];
const paymentMethods: PieSlice[] = [
  {
    name: "Credit Card",
    value: 383.26,
    displayValue: "$ 383.26",
    percentage: 42.4,
    color: "var(--primary-500)",
  },
  {
    name: "Cash",
    value: 293.03,
    displayValue: "$ 293.03",
    percentage: 32.42,
    color: "var(--success-500)",
  },
  {
    name: "Gift Card",
    value: 144.61,
    displayValue: "$ 144.61",
    percentage: 16,
    color: "var(--warning-500)",
  },
  {
    name: "Other",
    value: 82.91,
    displayValue: "$ 82.91",
    percentage: 9.18,
    color: "var(--badge-violet-icon-color)",
  },
];
const totalOrders = orderSummary.reduce((sum, item) => sum + item.value, 0);
const totalPayments = paymentMethods.reduce((sum, item) => sum + item.value, 0);
const hourlySales = [
  { hour: "10 AM", sales: 18 },
  { hour: "11 AM", sales: 42 },
  { hour: "12 PM", sales: 128 },
  { hour: "1 PM", sales: 96 },
  { hour: "2 PM", sales: 38 },
  { hour: "3 PM", sales: 24 },
  { hour: "4 PM", sales: 31 },
  { hour: "5 PM", sales: 64 },
  { hour: "6 PM", sales: 142 },
  { hour: "7 PM", sales: 168 },
  { hour: "8 PM", sales: 154 },
  { hour: "9 PM", sales: 88 },
  { hour: "10 PM", sales: 46 },
];

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-card-border bg-card-surface-area shadow-xs">
      <div className="border-b border-card-border px-5 py-3">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}
function PreviewDatePicker() {
  const [previewDate, setPreviewDate] = useState<CalendarDate | null>(
    new CalendarDate(2026, 9, 9),
  );

  return (
    <DatePicker
      className="w-auto flex-row items-center gap-2"
      value={previewDate}
      onChange={setPreviewDate}
    >
      <FieldLabel className="whitespace-nowrap">Preview date</FieldLabel>
      <DatePickerGroup>
        <DateInput className="min-w-48 pr-12">
          {(segment) => <DateSegment segment={segment} />}
        </DateInput>
        <DatePickerTrigger>
          <CalendarIcon className="text-icon-primary" />
        </DatePickerTrigger>
      </DatePickerGroup>
      <DatePickerPopover className="z-50">
        <Calendar
          aria-label="Preview date"
          className="w-fit rounded-2xl p-3 sm:p-3"
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
                <CalendarCell date={date} className="size-8 text-xs sm:size-8" />
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </Calendar>
      </DatePickerPopover>
    </DatePicker>
  );
}

function Details() {
  return (
    <button
      type="button"
      className="mt-auto self-end px-5 pb-4 text-right text-xs font-semibold text-primary-500 transition hover:text-primary-700"
    >
      View details Reports
    </button>
  );
}

export default function HomePage() {
  const [batch, setBatch] = useState(false);
  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 px-2 lg:px-6">
        <div>
          <h1 className="mb-1 text-[28px] leading-8 font-medium text-text-primary">
            Today&apos;s performance
          </h1>
          <p className="text-sm leading-5 text-text-tertiary">
            A live summary of your sales and operations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <PreviewDatePicker />
          <Toggle
            size="md"
            label="Batch wise"
            checked={batch}
            onChange={(event) => setBatch(event.target.checked)}
          />
        </div>
      </div>

      <div className="space-y-5 px-2 lg:px-5">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map(([label, value, change, StatIcon, accent, iconStyle]) => (
            <article
              key={label}
              className={`rounded-2xl border border-card-border border-t-[3px] bg-card-surface-area p-4 shadow-xs ${accent}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-secondary">
                    {label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">
                    {value}
                  </p>
                </div>
                <span
                  className={`grid size-10 place-items-center rounded-xl ${iconStyle}`}
                >
                  <StatIcon className="size-5" />
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-success-500">
                +{change}{" "}
                <span className="font-normal text-text-tertiary">
                  vs. previous date
                </span>
              </p>
            </article>
          ))}
        </section>
        <section className="grid overflow-hidden rounded-2xl border border-card-border bg-card-surface-area sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {utilities.map(([label, value, UtilityIcon, iconStyle]) => (
            <div
              key={label}
              className="flex items-center gap-3 border-b border-card-border px-4 py-4 last:border-b-0 sm:border-r xl:border-b-0"
            >
              <span
                className={`grid size-9 place-items-center rounded-xl ${iconStyle}`}
              >
                <UtilityIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-text-tertiary">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </section>
        <div className="grid gap-5 xl:grid-cols-3">
          <Panel title="Order summary">
            <SummaryPie
              data={orderSummary}
              centerValue={String(totalOrders)}
              centerLabel="Orders"
              valueLabel="Orders"
            />
            <Details />
          </Panel>
          <Panel title="Payment methods">
            <SummaryPie
              data={paymentMethods}
              centerValue={`$${totalPayments.toFixed(2)}`}
              centerLabel="Total"
              valueLabel="Amount"
            />
            <Details />
          </Panel>
          <Panel title="Sales by department">
            <div className="space-y-4 px-5 py-5">
              {departments.map(([name, value, share, color, width]) => (
                <div key={name}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-text-secondary">
                      {name}
                    </span>
                    <span className="text-text-primary">
                      {value}{" "}
                      <em className="ml-1 not-italic text-xs text-text-tertiary">
                        {share}
                      </em>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background-gray-secondary_alt_2">
                    <div className={`h-full rounded-full ${color} ${width}`} />
                  </div>
                </div>
              ))}
            </div>
            <Details />
          </Panel>
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.05fr_1.25fr_1.2fr]">
          <Panel title="Hourly sales overview">
            <div className="h-62 flex-1 px-2 py-4 sm:px-3">
              <ChartContainer
                className="h-full w-full"
                height={248}
                width="100%"
                aspect={undefined}
              >
                <AreaChart
                  data={hourlySales}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="hourlySalesGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--primary-500)"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary-500)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                    interval={1}
                    tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 200]}
                    ticks={[0, 50, 100, 150, 200]}
                    tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <ChartTooltip
                    cursor={{
                      stroke: "var(--primary-500)",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                    content={HourlySalesTooltip}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--primary-500)"
                    strokeWidth={2}
                    fill="url(#hourlySalesGradient)"
                    dot={{
                      r: 3,
                      fill: "var(--primary-500)",
                      stroke: "var(--card-surface-area)",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 5,
                      stroke: "var(--primary-500)",
                      strokeWidth: 2,
                      fill: "var(--card-surface-area)",
                    }}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </Panel>
          <Panel title="Top selling items">
            <DataTable head={["#", "Item", "Qty", "Sales", "Amount"]}>
              {items.map((row, i) => (
                <tr key={row[0]}>
                  <td>{i + 1}</td>
                  <td className="font-medium text-text-primary">{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[3]}</td>
                  <td className="font-medium text-text-primary">{row[4]}</td>
                </tr>
              ))}
            </DataTable>
            <Details />
          </Panel>
          <Panel title="Recent orders">
            <DataTable head={["Check #", "Type", "Amount", "Status", "Time"]}>
              {orders.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td
                    className={
                      row[2].startsWith("-")
                        ? "text-error-500"
                        : "text-text-primary"
                    }
                  >
                    {row[2]}
                  </td>
                  <td>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${row[3] === "Paid" ? "bg-badge-success-background text-badge-success-text" : "bg-badge-error-background text-badge-error-text"}`}
                    >
                      {row[3]}
                    </span>
                  </td>
                  <td>{row[4]}</td>
                </tr>
              ))}
            </DataTable>
            <Details />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SummaryPie({
  data,
  centerValue,
  centerLabel,
  valueLabel,
}: {
  data: PieSlice[];
  centerValue: string;
  centerLabel: string;
  valueLabel: string;
}) {
  return (
    <div className="@container w-full">
      <div className="flex flex-col gap-4 px-5 py-5 @[28rem]:flex-row @[28rem]:items-center @[28rem]:gap-5">
        <div className="mx-auto h-40 w-40 shrink-0 @[28rem]:mx-0">
          <ChartContainer
            className="h-full w-full"
            height={160}
            width="100%"
            aspect={undefined}
          >
            <PieChart>
              <ChartTooltip
                cursor={{ fill: "transparent" }}
                content={(props) => (
                  <SummaryPieTooltip {...props} valueLabel={valueLabel} />
                )}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={2}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          <tspan
                            x={viewBox.cx}
                            dy="-0.3em"
                            className={`fill-text-primary font-semibold ${centerValue.length > 5 ? "text-sm" : "text-xl"}`}
                          >
                            {centerValue}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            dy="1.4em"
                            className="fill-text-tertiary text-xs"
                          >
                            {centerLabel}
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
        <div className="w-full min-w-0 flex-1 space-y-3 text-sm">
          {data.map((item) => (
            <div
              key={item.name}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 sm:gap-x-6"
            >
              <span
                className="truncate font-medium"
                style={{ color: item.color }}
              >
                {item.name}
              </span>
              <b className="shrink-0 text-right font-semibold tabular-nums text-text-primary">
                {item.displayValue}
              </b>
              <span className="w-14 shrink-0 text-right text-xs tabular-nums text-text-tertiary">
                {item.percentage.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HourlySalesTooltip({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as (typeof hourlySales)[number];
    return (
      <div className="rounded-xl border border-card-border bg-card-background p-3 shadow-md">
        <p className="mb-1 text-xs font-semibold text-text-primary">
          {data.hour}
        </p>
        <p className="text-xs text-text-secondary">
          Sales:{" "}
          <span className="font-semibold text-text-primary">
            ${data.sales.toFixed(2)}
          </span>
        </p>
      </div>
    );
  }
  return null;
}

function SummaryPieTooltip({
  active,
  payload,
  valueLabel,
}: TooltipContentProps<ValueType, NameType> & { valueLabel: string }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PieSlice;
    return (
      <div className="rounded-xl border border-card-border bg-card-background p-3 shadow-md">
        <p className="mb-1 text-xs font-semibold text-text-primary">
          {data.name}
        </p>
        <p className="text-xs text-text-secondary">
          {valueLabel}:{" "}
          <span className="font-semibold text-text-primary">
            {data.displayValue}
          </span>
        </p>
        <p className="text-xs text-text-secondary">
          Percentage:{" "}
          <span className="font-semibold text-text-primary">
            {data.percentage.toFixed(2)}%
          </span>
        </p>
      </div>
    );
  }
  return null;
}
function DataTable({
  head,
  children,
}: {
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto px-3 py-3">
      <table className="w-full min-w-95 text-left text-xs">
        <thead className="border-b border-card-border text-text-tertiary">
          <tr>
            {head.map((item) => (
              <th
                key={item}
                className="whitespace-nowrap px-2 py-2 font-medium"
              >
                {item}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border text-text-secondary">
          {children}
        </tbody>
      </table>
      <style>{`td { padding: 9px 8px; white-space: nowrap; }`}</style>
    </div>
  );
}
