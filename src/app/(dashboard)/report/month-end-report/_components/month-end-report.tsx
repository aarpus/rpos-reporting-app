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
import { useState, type ReactNode } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import {
  DenseTable,
  ReportCard,
  Td,
  TotalRow,
  amountClass,
  money,
} from "../../_components/report-ui";

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

const today = new Date();
const currentMonthIndex = today.getMonth();
const currentYear = today.getFullYear();
const years = [String(currentYear), String(currentYear - 1)];

type Selection = { month: string; year: string };

const summary = [
  ["Net Sales", 0],
  ["Total Tax", 0],
  ["Total Discounts", 0],
  ["Total Tips", 0],
  ["Total Fees", 0],
  ["Gross Sales", 0],
  ["Total Refunds", 0],
  ["Total Voids", 0],
  ["Payments Received", 0],
] as const;

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-1 sm:w-40">
      <span className="text-[11px] font-medium text-text-secondary">{label}</span>
      <Select
        aria-label={label}
        value={value}
        onChange={(key) => onChange(String(key))}
      >
        <SelectTrigger className="h-8 py-1 text-xs" size="sm">
          <SelectValue />
          <SelectIndicator />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} id={option} textValue={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ZeroTotal({ columns, label = "Total" }: { columns: number; label?: string }) {
  return (
    <TotalRow>
      <Td> </Td>
      <Td>{label}</Td>
      {Array.from({ length: columns - 2 }, (_, index) => (
        <Td key={index} align="right">{index === columns - 3 ? "0.00" : "0"}</Td>
      ))}
    </TotalRow>
  );
}

function Pair({ children }: { children: ReactNode }) {
  return <div className="grid gap-2 lg:grid-cols-2">{children}</div>;
}

export default function MonthEndReportView() {
  const [draft, setDraft] = useState<Selection>({
    month: monthNames[currentMonthIndex],
    year: years[0],
  });
  const [applied, setApplied] = useState<Selection | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const availableMonths =
    draft.year === String(currentYear)
      ? monthNames.slice(0, currentMonthIndex + 1)
      : monthNames;

  function changeYear(year: string) {
    setDraft((current) => {
      const allowedMonths =
        year === String(currentYear)
          ? monthNames.slice(0, currentMonthIndex + 1)
          : monthNames;
      return {
        year,
        month: allowedMonths.includes(current.month)
          ? current.month
          : allowedMonths[allowedMonths.length - 1],
      };
    });
  }

  return (
    <div className="mt-2 space-y-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-3 sm:space-y-2.5 lg:px-4">
      <div>
        <h1 className="text-lg leading-6 font-semibold text-text-primary sm:text-xl">
          Month End Report
        </h1>
        <p className="text-[11px] text-text-tertiary">
          View a consolidated report for the selected month
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
                options={years}
                onChange={changeYear}
              />
              <FilterSelect
                label="Month"
                value={draft.month}
                options={availableMonths}
                onChange={(month) =>
                  setDraft((current) => ({ ...current, month }))
                }
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

      {!applied ? (
        <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
          <p className="text-sm font-medium text-text-secondary">
            Select a month and year, then generate the report.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          <header className="rounded-lg border border-card-border bg-card-surface-area px-3 py-3 text-center">
            <p className="text-base font-bold text-text-primary">AcutePOS</p>
            <h2 className="text-lg font-bold tracking-wide text-text-primary uppercase">
              Month End Report
            </h2>
            <p className="text-sm font-semibold text-text-secondary">
              {applied.month} {applied.year}
            </p>
            <div className="mt-2 flex flex-col justify-between gap-1 border-t border-card-border pt-2 text-[11px] text-text-tertiary sm:flex-row">
              <span>Date Time: 2026-09-21 04:18 PM</span>
              <span>User Name: Acute POS</span>
            </div>
          </header>

          <ReportCard title="1. Summary overview">
            <div className="grid grid-cols-2 divide-x divide-y divide-card-border sm:grid-cols-3 xl:grid-cols-6">
              {summary.map(([label, value]) => (
                <div key={label} className="px-2 py-1.5">
                  <p className="text-[10px] leading-4 text-text-tertiary">{label}</p>
                  <p className={amountClass(value, true)}>{money(value)}</p>
                </div>
              ))}
              <div className="px-2 py-1.5">
                <p className="text-[10px] leading-4 text-text-tertiary">Transactions</p>
                <p className="font-semibold tabular-nums text-text-primary">0</p>
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[10px] leading-4 text-text-tertiary">Total Working Hours</p>
                <p className="font-semibold tabular-nums text-text-primary">22:22</p>
              </div>
            </div>
          </ReportCard>

          <ReportCard title="2. Department sales summary">
            <DenseTable minWidth="46rem" head={[
              { label: "#" }, { label: "Department" }, { label: "Trans", align: "right" },
              { label: "Qty", align: "right" }, { label: "Amount", align: "right" },
              { label: "Discount", align: "right" }, { label: "Disc %", align: "right" },
              { label: "Subtotal", align: "right" }, { label: "Tax", align: "right" },
              { label: "Total", align: "right" }, { label: "Sales %", align: "right" },
            ]}>
              <tr><Td>1</Td><Td className="font-medium text-text-primary">Gift Card</Td><Td align="right"> </Td><Td align="right">0</Td>{Array.from({ length: 7 }, (_, i) => <Td key={i} align="right">0.00</Td>)}</tr>
              <TotalRow><Td> </Td><Td>Grand total</Td><Td align="right"> </Td><Td align="right">0</Td><Td align="right">0.00</Td><Td align="right">0.00</Td><Td align="right">100.00</Td><Td align="right">0.00</Td><Td align="right">0.00</Td><Td align="right">0.00</Td><Td align="right">100.00</Td></TotalRow>
            </DenseTable>
          </ReportCard>

          <Pair>
            <ReportCard title="3. Order type / service summary">
              <DenseTable head={[{ label: "#" }, { label: "Order type" }, { label: "Count", align: "right" }, { label: "Amount", align: "right" }]}><ZeroTotal columns={4} /></DenseTable>
            </ReportCard>
            <ReportCard title="4. Tax summary">
              <DenseTable head={[{ label: "#" }, { label: "Tax name" }, { label: "Taxable", align: "right" }, { label: "Tax", align: "right" }]}><ZeroTotal columns={4} /></DenseTable>
            </ReportCard>
          </Pair>

          <Pair>
            <ReportCard title="5. Tender / payment summary">
              <DenseTable minWidth="28rem" head={[{ label: "#" }, { label: "Tender" }, { label: "Count", align: "right" }, { label: "Sale", align: "right" }, { label: "Return", align: "right" }, { label: "Void", align: "right" }, { label: "Net amount", align: "right" }]}><ZeroTotal columns={7} /></DenseTable>
            </ReportCard>
            <ReportCard title="6. Tips & fees summary">
              <DenseTable head={[{ label: "#" }, { label: "Description" }, { label: "Count", align: "right" }, { label: "Amount", align: "right" }]}>
                {["Total Gratuity", "Non Cash Tips", "Cash Tips", "Non Cash Tips Withheld", "Gratuity Withheld"].map((label, index) => <tr key={label}><Td>{index + 1}</Td><Td>{label}</Td><Td align="right">0</Td><Td align="right">0.00</Td></tr>)}
                <ZeroTotal columns={4} label="TOTAL" />
              </DenseTable>
            </ReportCard>
          </Pair>

          <Pair>
            <ReportCard title="7. Card payment summary">
              <DenseTable head={[{ label: "#" }, { label: "Card" }, { label: "Count", align: "right" }, { label: "Sale", align: "right" }, { label: "Tip", align: "right" }, { label: "Total", align: "right" }]}><ZeroTotal columns={6} label="TOTAL" /></DenseTable>
            </ReportCard>
            <ReportCard title="8. Device amount summary">
              <DenseTable minWidth="27rem" head={[{ label: "#" }, { label: "Device name" }, { label: "Count", align: "right" }, { label: "Card amount", align: "right" }, { label: "Surcharge", align: "right" }, { label: "Total amount", align: "right" }]}><ZeroTotal columns={6} label="TOTAL" /></DenseTable>
            </ReportCard>
          </Pair>

          <ReportCard title="9. Cash audit summary">
            <DenseTable minWidth="64rem" head={[{ label: "#" }, { label: "Shift" }, { label: "Employee" }, { label: "Open", align: "right" }, { label: "Sales", align: "right" }, { label: "Tip", align: "right" }, { label: "Close", align: "right" }, { label: "Total cash", align: "right" }, { label: "Gratuity", align: "right" }, { label: "Non cash tip", align: "right" }, { label: "Cash tip", align: "right" }, { label: "Tip withheld", align: "right" }, { label: "Gratuity withheld", align: "right" }, { label: "Owed", align: "right" }, { label: "Received", align: "right" }]}>
              <tr><Td>1</Td><Td>1</Td><Td>Emp One</Td>{Array.from({ length: 12 }, (_, i) => <Td key={i} align="right">0.00</Td>)}</tr>
              <TotalRow><Td> </Td><Td> </Td><Td>TOTAL</Td>{Array.from({ length: 12 }, (_, i) => <Td key={i} align="right">0.00</Td>)}</TotalRow>
            </DenseTable>
          </ReportCard>

          <Pair>
            <ReportCard title="10. Rounding adjustment summary">
              <DenseTable head={[{ label: "" }, { label: "Description" }, { label: "Amount", align: "right" }]}>
                {["# Cash Transactions (0)", "+ve Rounding Adj. Amount (0)", "-ve Rounding Adj. Amount (0)"].map((label) => <tr key={label}><Td>•</Td><Td>{label}</Td><Td align="right">0.00</Td></tr>)}
                <TotalRow><Td> </Td><Td>TOTAL ROUNDING ADJUSTMENT</Td><Td align="right">0.00</Td></TotalRow>
              </DenseTable>
            </ReportCard>
            <ReportCard title="11. External payment summary">
              <DenseTable head={[{ label: "#" }, { label: "Type" }, { label: "Count", align: "right" }, { label: "Amount", align: "right" }]}><EmptyTableRow columns={4} /></DenseTable>
            </ReportCard>
          </Pair>

          <Pair>
            <ReportCard title="12. Gift card detail">
              <DenseTable head={[{ label: "#" }, { label: "Gift card detail" }, { label: "Count", align: "right" }]}><ZeroTotal columns={3} label="TOTAL" /></DenseTable>
            </ReportCard>
            <ReportCard title="14. Void items">
              <DenseTable head={[{ label: "#" }, { label: "Void reason" }, { label: "Count", align: "right" }]}><ZeroTotal columns={3} label="TOTAL" /></DenseTable>
            </ReportCard>
          </Pair>

          <ReportCard title="15. Return / void transaction">
            <DenseTable head={[{ label: "#" }, { label: "Check #" }, { label: "Type" }, { label: "Amount", align: "right" }]}><EmptyTableRow columns={4} /></DenseTable>
          </ReportCard>

          <ReportCard title="16. Discount summary">
            <DenseTable minWidth="42rem" head={[{ label: "#" }, { label: "Check #" }, { label: "Discount name" }, { label: "Discount reason" }, { label: "Discount before", align: "right" }, { label: "Discount amount", align: "right" }, { label: "Discount after", align: "right" }]}>
              <TotalRow><Td> </Td><Td> </Td><Td>TOTAL</Td><Td> </Td><Td align="right"> </Td><Td align="right">0.00</Td><Td align="right"> </Td></TotalRow>
            </DenseTable>
          </ReportCard>

          <ReportCard title="17. Employee clock in / out">
            <DenseTable minWidth="40rem" head={[{ label: "#" }, { label: "Employee" }, { label: "#Trans", align: "right" }, { label: "Role name" }, { label: "Working days", align: "right" }, { label: "Total break" }, { label: "Work hours" }]}>
              <tr><Td>1</Td><Td>Emp One</Td><Td align="right">0</Td><Td>Bartender</Td><Td align="right">2</Td><Td>00:00</Td><Td>22:22</Td></tr>
              <TotalRow><Td> </Td><Td> </Td><Td align="right">0</Td><Td> </Td><Td align="right">2</Td><Td>00:00</Td><Td>22:22</Td></TotalRow>
            </DenseTable>
          </ReportCard>

          <ReportCard title="18. Menu item stock status">
            <DenseTable minWidth="34rem" head={[{ label: "#" }, { label: "Product name" }, { label: "Before qty", align: "right" }, { label: "Sold qty", align: "right" }, { label: "Received qty", align: "right" }, { label: "After qty", align: "right" }]}>
              <tr><Td>1</Td><Td> </Td><Td align="right">0.00</Td><Td align="right">0.00</Td><Td align="right">0.00</Td><Td align="right">0.00</Td></tr>
            </DenseTable>
          </ReportCard>
        </div>
      )}
    </div>
  );
}

function EmptyTableRow({ columns }: { columns: number }) {
  return <tr>{Array.from({ length: columns }, (_, index) => <Td key={index}> </Td>)}</tr>;
}
