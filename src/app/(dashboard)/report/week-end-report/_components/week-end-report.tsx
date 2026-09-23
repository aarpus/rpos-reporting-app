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
import { cn } from "@/utils/cn";
import { useState, type ReactNode } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import {
  DenseTable,
  ReportCard,
  Td,
  TotalRow,
} from "../../_components/report-ui";
import {
  cashAudit,
  departments,
  discounts,
  employees,
  orderTypes,
  returnsVoids,
  stock,
  summary,
  taxes,
  tenders,
  tipsFees,
} from "./data";

const monthNames = [
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
];
const shortMonths = [
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
];
const today = new Date();
const currentYear = today.getFullYear();
const currentMonthIndex = today.getMonth();
const years = [String(currentYear), String(currentYear - 1)];

type WeekOption = {
  id: string;
  label: string;
  heading: string;
  start: Date;
  end: Date;
};
type Selection = { year: string; month: string; week: string };

function dateId(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function displayDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")} ${shortMonths[date.getMonth()]}`;
}

function weeksForMonth(year: number, monthIndex: number): WeekOption[] {
  const first = new Date(year, monthIndex, 1, 12);
  const last = new Date(year, monthIndex + 1, 0, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  const firstMonday = new Date(first);
  firstMonday.setDate(first.getDate() - mondayOffset);
  const weeks: WeekOption[] = [];

  for (let start = firstMonday, number = 1; start <= last; number += 1) {
    const weekStart = new Date(start);
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weeks.push({
      id: dateId(weekStart),
      label: `Week ${number} (${displayDate(weekStart)} - ${displayDate(weekEnd)})`,
      heading: `${displayDate(weekStart)} - ${displayDate(weekEnd)} ${weekEnd.getFullYear()}`,
      start: weekStart,
      end: weekEnd,
    });
    start = new Date(start);
    start.setDate(start.getDate() + 7);
  }
  return weeks;
}

function initialWeek() {
  const weeks = weeksForMonth(currentYear, currentMonthIndex);
  return (
    weeks.find((week) => today >= week.start && today <= week.end) ??
    weeks[weeks.length - 1]
  );
}

function number(value: number) {
  return Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function amount(value: number) {
  return value < 0 ? `-${number(value)}` : number(value);
}

function Amount({
  value,
  strong = false,
}: {
  value: number;
  strong?: boolean;
}) {
  return (
    <span
      className={cn(
        "tabular-nums",
        strong && "font-semibold",
        value < 0 && "text-error-500",
      )}
    >
      {amount(value)}
    </span>
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
    <div
      className={cn("flex w-full flex-col gap-1", wide ? "sm:w-56" : "sm:w-40")}
    >
      <span className="text-[11px] font-medium text-text-secondary">
        {label}
      </span>
      <Select
        aria-label={label}
        value={value}
        onChange={(key) => onChange(String(key))}
      >
        <SelectTrigger size="sm" className="h-8 py-1 text-xs">
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

function Pair({ children }: { children: ReactNode }) {
  return <div className="grid gap-2 lg:grid-cols-2">{children}</div>;
}

function Cells({
  values,
  moneyFrom = -1,
}: {
  values: readonly (string | number)[];
  moneyFrom?: number;
}) {
  return (
    <>
      {values.map((value, index) => (
        <Td
          key={index}
          align={index >= moneyFrom && moneyFrom >= 0 ? "right" : "left"}
        >
          {typeof value === "number" && index >= moneyFrom && moneyFrom >= 0 ? (
            <Amount value={value} />
          ) : (
            value
          )}
        </Td>
      ))}
    </>
  );
}

export default function WeekEndReportView() {
  const firstWeek = initialWeek();
  const [draft, setDraft] = useState<Selection>({
    year: String(currentYear),
    month: monthNames[currentMonthIndex],
    week: firstWeek.id,
  });
  const [applied, setApplied] = useState<Selection | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const selectedMonthIndex = monthNames.indexOf(draft.month);
  const availableMonths =
    draft.year === String(currentYear)
      ? monthNames.slice(0, currentMonthIndex + 1)
      : monthNames;
  const availableWeeks = weeksForMonth(Number(draft.year), selectedMonthIndex);
  const appliedWeek = applied
    ? weeksForMonth(
        Number(applied.year),
        monthNames.indexOf(applied.month),
      ).find((week) => week.id === applied.week)
    : null;

  function changeYear(year: string) {
    const allowedMonths =
      year === String(currentYear)
        ? monthNames.slice(0, currentMonthIndex + 1)
        : monthNames;
    const month = allowedMonths.includes(draft.month)
      ? draft.month
      : allowedMonths[allowedMonths.length - 1];
    const weeks = weeksForMonth(Number(year), monthNames.indexOf(month));
    setDraft({ year, month, week: weeks[0].id });
  }

  function changeMonth(month: string) {
    const weeks = weeksForMonth(Number(draft.year), monthNames.indexOf(month));
    const current = weeks.find(
      (week) => today >= week.start && today <= week.end,
    );
    setDraft((value) => ({ ...value, month, week: (current ?? weeks[0]).id }));
  }

  return (
    <div className="mt-2 space-y-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-3 sm:space-y-2.5 lg:px-4">
      <div>
        <h1 className="text-lg leading-6 font-semibold text-text-primary sm:text-xl">
          Week End Report
        </h1>
        <p className="text-[11px] text-text-tertiary">
          View a consolidated report for the selected week
        </p>
      </div>

      <Card className="p-0">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
          onClick={() => setFiltersOpen((value) => !value)}
        >
          <span className="text-sm font-semibold text-text-primary">
            Search{" "}
            <span className="font-normal text-text-tertiary">
              (Tap to collapse or expand)
            </span>
          </span>
          {filtersOpen ? (
            <LuChevronUp className="size-4 text-text-tertiary" />
          ) : (
            <LuChevronDown className="size-4 text-text-tertiary" />
          )}
        </button>
        {filtersOpen && (
          <div className="space-y-2.5 border-t border-card-border px-3 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <FilterSelect
                label="Year"
                value={draft.year}
                options={years.map((value) => ({ id: value, label: value }))}
                onChange={changeYear}
              />
              <FilterSelect
                label="Month"
                value={draft.month}
                options={availableMonths.map((value) => ({
                  id: value,
                  label: value,
                }))}
                onChange={changeMonth}
              />
              <FilterSelect
                label="Week"
                value={draft.week}
                options={availableWeeks}
                onChange={(week) => setDraft((value) => ({ ...value, week }))}
                wide
              />
            </div>
            <Button
              size="sm"
              className="h-8 px-3 py-1 text-xs"
              onPress={() => setApplied(draft)}
            >
              Generate report
            </Button>
          </div>
        )}
      </Card>

      {!applied || !appliedWeek ? (
        <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
          <p className="text-sm font-medium text-text-secondary">
            Select a year, month and week, then generate the report.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          <header className="rounded-lg border border-card-border bg-card-surface-area px-3 py-3 text-center">
            <p className="text-base font-bold text-text-primary">AcutePOS</p>
            <h2 className="text-lg font-bold tracking-wide text-text-primary uppercase">
              Week End Report
            </h2>
            <p className="text-sm font-semibold text-text-secondary">
              {appliedWeek.heading}
            </p>
            <div className="mt-2 flex flex-col justify-between gap-1 border-t border-card-border pt-2 text-[11px] text-text-tertiary sm:flex-row">
              <span>Date Time: 2026-09-21 06:03 PM</span>
              <span>User Name: Marco</span>
            </div>
          </header>

          <ReportCard title="1. Summary overview">
            <div className="grid grid-cols-2 divide-x divide-y divide-card-border sm:grid-cols-3 xl:grid-cols-6">
              {summary.map(([label, value]) => (
                <div key={label} className="px-2 py-1.5">
                  <p className="text-[10px] leading-4 text-text-tertiary">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">
                    <Amount value={value} />
                  </p>
                </div>
              ))}
              <div className="px-2 py-1.5">
                <p className="text-[10px] text-text-tertiary">Transactions</p>
                <p className="font-semibold">77</p>
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[10px] text-text-tertiary">
                  Total Working Hours
                </p>
                <p className="font-semibold">268:08</p>
              </div>
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
                <tr key={row[0]}>
                  <Td>{row[0]}</Td>
                  <Td className="font-medium text-text-primary">{row[1]}</Td>
                  {row.slice(2).map((value, index) => (
                    <Td
                      key={index}
                      align="right"
                      className={cn(
                        [2, 5, 6, 7, 8].includes(index) && "text-success-500",
                      )}
                    >
                      {index < 2 ? value : <Amount value={value as number} />}
                    </Td>
                  ))}
                </tr>
              ))}
              <TotalRow>
                <Td> </Td>
                <Td>Grand total</Td>
                <Td align="right">111</Td>
                <Td align="right">252</Td>
                {[2118.39, -61.24, 100, 2057.15, 123.7, 2180.85, 100].map(
                  (value, index) => (
                    <Td
                      key={index}
                      align="right"
                      className={cn(
                        [0, 3, 4, 5, 6].includes(index) && "text-success-500",
                      )}
                    >
                      <Amount value={value} />
                    </Td>
                  ),
                )}
              </TotalRow>
            </DenseTable>
          </ReportCard>

          <Pair>
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
                  <tr key={row[0]}>
                    <Td>{row[0]}</Td>
                    <Td>{row[1]}</Td>
                    <Td align="right">{row[2]}</Td>
                    <Td align="right" className={cn("text-success-500")}>
                      <Amount value={row[3]} />
                    </Td>
                  </tr>
                ))}
                <TotalRow>
                  <Td> </Td>
                  <Td>Total</Td>
                  <Td align="right">73</Td>
                  <Td align="right">
                    <Amount value={2308.92} />
                  </Td>
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
                  <tr key={row[0]}>
                    <Td>{row[0]}</Td>
                    <Td>{row[1]}</Td>
                    <Td align="right" className="text-success-500">
                      <Amount value={row[2]} />
                    </Td>
                    <Td align="right" className="text-success-500">
                      <Amount value={row[3]} />
                    </Td>
                  </tr>
                ))}
                <TotalRow>
                  <Td> </Td>
                  <Td>Total</Td>
                  <Td align="right">
                    <Amount value={1823.07} />
                  </Td>
                  <Td align="right">
                    <Amount value={129.64} />
                  </Td>
                </TotalRow>
              </DenseTable>
            </ReportCard>
          </Pair>

          <Pair>
            <ReportCard title="5. Tender / payment summary">
              <DenseTable
                minWidth="28rem"
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
                  <tr key={row[0]}>
                    <Td>{row[0]}</Td>
                    <Td>{row[1]}</Td>
                    <Td align="right">{row[2]}</Td>
                    {row.slice(3).map((value, index) => (
                      <Td
                        key={index}
                        align="right"
                        className={cn("text-success-500")}
                      >
                        <Amount value={value as number} />
                      </Td>
                    ))}
                  </tr>
                ))}
                <TotalRow>
                  <Td> </Td>
                  <Td>Total</Td>
                  <Td align="right">95</Td>
                  {[2959.72, -371.54, -23.98, 2588.18].map((value) => (
                    <Td key={value} align="right">
                      <Amount value={value} />
                    </Td>
                  ))}
                </TotalRow>
              </DenseTable>
            </ReportCard>
            <ReportCard title="6. Tips & fees summary">
              <DenseTable
                head={[
                  { label: "#" },
                  { label: "Description" },
                  { label: "Count", align: "right" },
                  { label: "Amount", align: "right" },
                ]}
              >
                {tipsFees.map((row) => (
                  <tr key={row[0]}>
                    <Td>{row[0]}</Td>
                    <Td>{row[1]}</Td>
                    <Td align="right">{row[2]}</Td>
                    <Td align="right" className="text-success-500">
                      <Amount value={row[3]} />
                    </Td>
                  </tr>
                ))}
                <TotalRow>
                  <Td> </Td>
                  <Td>Total</Td>
                  <Td align="right">24</Td>
                  <Td align="right">
                    <Amount value={224.75} />
                  </Td>
                </TotalRow>
              </DenseTable>
            </ReportCard>
          </Pair>

          <Pair>
            <ReportCard title="7. Card payment summary">
              <DenseTable
                head={[
                  { label: "#" },
                  { label: "Card" },
                  { label: "Count" },
                  { label: "Sale", align: "right" },
                  { label: "Tip", align: "right" },
                  { label: "Total", align: "right" },
                ]}
              >
                <tr>
                  <Cells
                    values={[1, "VISA", 25, 797.59, 39, 836.59]}
                    moneyFrom={3}
                  />
                </tr>
                <TotalRow>
                  <Td> </Td>
                  <Td>Total</Td>
                  <Td>25</Td>
                  {[797.59, 39, 836.59].map((value) => (
                    <Td key={value} align="right" className="text-success-500">
                      <Amount value={value} />
                    </Td>
                  ))}
                </TotalRow>
              </DenseTable>
            </ReportCard>
            <ReportCard title="8. Device amount summary">
              <DenseTable
                minWidth="27rem"
                head={[
                  { label: "#" },
                  { label: "Device name" },
                  { label: "Count", align: "right" },
                  { label: "Card amount", align: "right" },
                  { label: "Surcharge", align: "right" },
                  { label: "Total amount", align: "right" },
                ]}
              >
                <tr>
                  <Cells
                    values={[1, "Pay@table", 25, 836.59, 25.13, 861.72]}
                    moneyFrom={3}
                  />
                </tr>
                <TotalRow>
                  <Td> </Td>
                  <Td>Total</Td>
                  <Td align="right">25</Td>
                  {[836.59, 25.13, 861.72].map((value) => (
                    <Td key={value} align="right">
                      <Amount value={value} />
                    </Td>
                  ))}
                </TotalRow>
              </DenseTable>
            </ReportCard>
          </Pair>

          <ReportCard title="9. Cash audit summary">
            <DenseTable
              minWidth="64rem"
              head={[
                { label: "#" },
                { label: "Shift" },
                { label: "Employee" },
                { label: "Open", align: "right" },
                { label: "Sales", align: "right" },
                { label: "Tip", align: "right" },
                { label: "Close", align: "right" },
                { label: "Total cash", align: "right" },
                { label: "Gratuity", align: "right" },
                { label: "Non cash tip", align: "right" },
                { label: "Cash tip", align: "right" },
                { label: "Tip withheld", align: "right" },
                { label: "Gratuity withheld", align: "right" },
                { label: "Owed", align: "right" },
                { label: "Received", align: "right" },
              ]}
            >
              {cashAudit.map((row) => (
                <tr key={row[0]}>
                  <Td>{row[0]}</Td>
                  <Td>{row[1]}</Td>
                  <Td>{row[2]}</Td>
                  {row.slice(3).map((value, index) => (
                    <Td key={index} align="right" className="text-success-500">
                      <Amount value={value as number} />
                    </Td>
                  ))}
                </tr>
              ))}
              <TotalRow>
                <Td> </Td>
                <Td> </Td>
                <Td>Total</Td>
                {[
                  223, 1449.5, 33, 0, 1705.5, 130.12, 53, 33, 0, 6.51, 1498.01,
                  207.49,
                ].map((value, index) => (
                  <Td key={index} align="right">
                    <Amount value={value} />
                  </Td>
                ))}
              </TotalRow>
            </DenseTable>
          </ReportCard>

          <Pair>
            <ReportCard title="10. Rounding adjustment summary">
              <DenseTable
                head={[
                  { label: "" },
                  { label: "Description" },
                  { label: "Amount", align: "right" },
                ]}
              >
                {[
                  ["# Cash Transactions (52)", 0],
                  ["+ve Rounding Adj. Amount (25)", 0.68],
                  ["-ve Rounding Adj. Amount (22)", -0.61],
                ].map(([label, value]) => (
                  <tr key={label as string}>
                    <Td>•</Td>
                    <Td>{label}</Td>
                    <Td align="right">
                      <Amount value={value as number} />
                    </Td>
                  </tr>
                ))}
                <TotalRow>
                  <Td> </Td>
                  <Td>Total rounding adjustment</Td>
                  <Td align="right">
                    <Amount value={0.07} />
                  </Td>
                </TotalRow>
              </DenseTable>
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
                <tr>
                  <Cells values={[1, "Expay", 4, 83.81]} moneyFrom={3} />
                </tr>
                <tr>
                  <Cells
                    values={[2, "External Pay", 8, 125.03]}
                    moneyFrom={3}
                  />
                </tr>
                <TotalRow>
                  <Td> </Td>
                  <Td>Total</Td>
                  <Td align="right">12</Td>
                  <Td align="right">
                    <Amount value={208.84} />
                  </Td>
                </TotalRow>
              </DenseTable>
            </ReportCard>
          </Pair>

          <Pair>
            <ReportCard title="12. Gift card detail">
              <DenseTable
                head={[
                  { label: "#" },
                  { label: "Gift card detail" },
                  { label: "Count", align: "right" },
                ]}
              >
                <tr>
                  <Cells values={[2, "Gift Card Sales", 2]} />
                </tr>
                <tr>
                  <Cells values={[4, "Gift Card Purchase", 1]} />
                </tr>
                <TotalRow>
                  <Td> </Td>
                  <Td>Total</Td>
                  <Td align="right">10</Td>
                </TotalRow>
              </DenseTable>
            </ReportCard>
            <ReportCard title="14. Void items">
              <DenseTable
                head={[
                  { label: "#" },
                  { label: "Void reason" },
                  { label: "Count", align: "right" },
                ]}
              >
                {[
                  [1, "INCORRECT ORDER", 4],
                  [2, "OUT OF STOCK", 4],
                  [3, "VOID REASON SEND REQUEST", 1],
                ].map((row) => (
                  <tr key={row[0]}>
                    <Cells values={row} />
                  </tr>
                ))}
                <TotalRow>
                  <Td> </Td>
                  <Td>Total</Td>
                  <Td align="right">9</Td>
                </TotalRow>
              </DenseTable>
            </ReportCard>
          </Pair>

          <ReportCard title="15. Return / void transaction">
            <DenseTable
              head={[
                { label: "#" },
                { label: "Check #" },
                { label: "Type" },
                { label: "Amount", align: "right" },
              ]}
            >
              {returnsVoids.map((row) => (
                <tr key={row[0]}>
                  <Td>{row[0]}</Td>
                  <Td>{row[1]}</Td>
                  <Td>{row[2]}</Td>
                  <Td align="right">
                    <Amount value={row[3]} />
                  </Td>
                </tr>
              ))}
              <TotalRow>
                <Td> </Td>
                <Td> </Td>
                <Td>Total</Td>
                <Td align="right">
                  <Amount value={-395.53} />
                </Td>
              </TotalRow>
            </DenseTable>
          </ReportCard>

          <ReportCard title="16. Discount summary">
            <DenseTable
              minWidth="42rem"
              head={[
                { label: "#" },
                { label: "Check #" },
                { label: "Discount name" },
                { label: "Discount reason" },
                { label: "Discount before", align: "right" },
                { label: "Discount amount", align: "right" },
                { label: "Discount after", align: "right" },
              ]}
            >
              {discounts.map((row) => (
                <tr key={row[0]}>
                  <Td>{row[0]}</Td>
                  <Td>{row[1]}</Td>
                  <Td>{row[2]}</Td>
                  <Td>{row[3]}</Td>
                  {row.slice(4).map((value, index) => (
                    <Td key={index} align="right">
                      <Amount value={value as number} />
                    </Td>
                  ))}
                </tr>
              ))}
              <TotalRow>
                <Td> </Td>
                <Td> </Td>
                <Td>Total</Td>
                <Td> </Td>
                {[643.79, -75.13, 568.66].map((value) => (
                  <Td key={value} align="right">
                    <Amount value={value} />
                  </Td>
                ))}
              </TotalRow>
            </DenseTable>
          </ReportCard>

          <ReportCard title="17. Employee clock in / out">
            <DenseTable
              minWidth="40rem"
              head={[
                { label: "#" },
                { label: "Employee" },
                { label: "#Trans", align: "right" },
                { label: "Role name" },
                { label: "Working days", align: "right" },
                { label: "Total break", align: "right" },
                { label: "Work hours", align: "right" },
              ]}
            >
              {employees.map((row) => (
                <tr key={row[0]}>
                  <Td>{row[0]}</Td>
                  <Td className="font-medium text-text-primary">{row[1]}</Td>
                  <Td align="right">{row[2]}</Td>
                  <Td>{row[3]}</Td>
                  <Td align="right">{row[4]}</Td>
                  <Td align="right" className="tabular-nums">{row[5]}</Td>
                  <Td align="right" className="tabular-nums">{row[6]}</Td>
                </tr>
              ))}
              <TotalRow>
                <Td> </Td>
                <Td> </Td>
                <Td align="right">73</Td>
                <Td> </Td>
                <Td align="right">15</Td>
                <Td align="right" className="tabular-nums">00:00</Td>
                <Td align="right" className="tabular-nums">268:08</Td>
              </TotalRow>
            </DenseTable>
          </ReportCard>

          <ReportCard title="18. Menu item stock status">
            <DenseTable
              minWidth="34rem"
              head={[
                { label: "#" },
                { label: "Product name" },
                { label: "Before qty", align: "right" },
                { label: "Sold qty", align: "right" },
                { label: "Received qty", align: "right" },
                { label: "After qty", align: "right" },
              ]}
            >
              {stock.map((row) => (
                <tr key={row[0]}>
                  <Td>{row[0]}</Td>
                  <Td>{row[1]}</Td>
                  {row.slice(2).map((value, index) => (
                    <Td key={index} align="right">
                      <Amount value={value as number} />
                    </Td>
                  ))}
                </tr>
              ))}
            </DenseTable>
          </ReportCard>
        </div>
      )}
    </div>
  );
}
