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
import { DenseTable, ReportCard, Td, TotalRow } from "../../_components/report-ui";
import {
  cardPayments,
  cashAudit,
  departments,
  devices,
  discounts,
  employees,
  externalPayments,
  orderTypes,
  returnsVoids,
  stock,
  summary,
  taxes,
  tenders,
  tipsFees,
  voidReasons,
} from "./data";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 3 }, (_, index) => String(currentYear - index));

function number(value: number) {
  return Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Amount({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <span
      className={cn(
        "tabular-nums",
        strong && "font-semibold",
        value < 0 ? "text-error-500" : "text-success-500",
      )}
    >
      {value < 0 ? `-${number(value)}` : number(value)}
    </span>
  );
}

function Pair({ children }: { children: ReactNode }) {
  return <div className="grid gap-2 lg:grid-cols-2">{children}</div>;
}

function Values({ values, moneyFrom = -1 }: { values: readonly (string | number)[]; moneyFrom?: number }) {
  return (
    <>
      {values.map((value, index) => (
        <Td key={index} align={moneyFrom >= 0 && index >= moneyFrom ? "right" : "left"}>
          {typeof value === "number" && moneyFrom >= 0 && index >= moneyFrom ? (
            <Amount value={value} />
          ) : (
            value
          )}
        </Td>
      ))}
    </>
  );
}

export default function YearEndReportView() {
  const [draftYear, setDraftYear] = useState(String(currentYear));
  const [appliedYear, setAppliedYear] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  return (
    <div className="mt-2 space-y-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-3 sm:space-y-2.5 lg:px-4">
      <div>
        <h1 className="text-lg leading-6 font-semibold text-text-primary sm:text-xl">
          Year End Report
        </h1>
        <p className="text-[11px] text-text-tertiary">
          View a consolidated report for the selected year
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
            <div className="flex w-full flex-col gap-1 sm:w-40">
              <span className="text-[11px] font-medium text-text-secondary">Year</span>
              <Select
                aria-label="Year"
                value={draftYear}
                onChange={(key) => setDraftYear(String(key))}
              >
                <SelectTrigger size="sm" className="h-8 py-1 text-xs">
                  <SelectValue />
                  <SelectIndicator />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} id={year} textValue={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              className="h-8 px-3 py-1 text-xs"
              onPress={() => setAppliedYear(draftYear)}
            >
              Generate report
            </Button>
          </div>
        )}
      </Card>

      {!appliedYear ? (
        <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
          <p className="text-sm font-medium text-text-secondary">
            Select a year, then generate the report.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          <header className="rounded-lg border border-card-border bg-card-surface-area px-3 py-3 text-center">
            <p className="text-base font-bold text-text-primary">AcutePOS</p>
            <h2 className="text-lg font-bold tracking-wide text-text-primary uppercase">
              Year End Report
            </h2>
            <p className="text-sm font-semibold text-text-secondary">{appliedYear}</p>
            <div className="mt-2 flex flex-col justify-between gap-1 border-t border-card-border pt-2 text-[11px] text-text-tertiary sm:flex-row">
              <span>Date Time: 2026-09-22 04:50 PM</span>
              <span>User Name: Acute POS</span>
            </div>
          </header>

          <ReportCard title="1. Summary overview">
            <div className="grid grid-cols-2 divide-x divide-y divide-card-border sm:grid-cols-3 xl:grid-cols-6">
              {summary.map(([label, value]) => (
                <div key={label} className="px-2 py-1.5">
                  <p className="text-[10px] leading-4 text-text-tertiary">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold"><Amount value={value} strong /></p>
                </div>
              ))}
              <div className="px-2 py-1.5">
                <p className="text-[10px] text-text-tertiary">Transactions</p>
                <p className="font-semibold tabular-nums text-text-primary">526</p>
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[10px] text-text-tertiary">Total Working Hours</p>
                <p className="font-semibold tabular-nums text-text-primary">13803:54</p>
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
              {departments.map((row) => (
                <tr key={row[0]}>
                  <Td>{row[0]}</Td><Td className="font-medium text-text-primary">{row[1]}</Td>
                  <Td align="right">{row[2]}</Td><Td align="right">{row[3]}</Td>
                  {row.slice(4).map((value, index) => <Td key={index} align="right"><Amount value={value as number} /></Td>)}
                </tr>
              ))}
              <TotalRow>
                <Td> </Td><Td>Grand total</Td><Td align="right">685</Td><Td align="right">1,387</Td>
                {[8441.64, -285.86, 100, 8155.78, 517.78, 8673.56, 100].map((value, index) => <Td key={index} align="right"><Amount value={value} /></Td>)}
              </TotalRow>
            </DenseTable>
          </ReportCard>

          <Pair>
            <ReportCard title="3. Order type / service summary">
              <DenseTable head={[{ label: "#" }, { label: "Order type" }, { label: "Count", align: "right" }, { label: "Amount", align: "right" }]}>
                {orderTypes.map((row) => <tr key={row[0]}><Values values={row} moneyFrom={3} /></tr>)}
                <TotalRow><Td> </Td><Td>Total</Td><Td align="right">502</Td><Td align="right"><Amount value={9783.84} /></Td></TotalRow>
              </DenseTable>
            </ReportCard>
            <ReportCard title="4. Tax summary">
              <DenseTable head={[{ label: "#" }, { label: "Tax name" }, { label: "Taxable", align: "right" }, { label: "Tax", align: "right" }]}>
                {taxes.map((row) => <tr key={row[0]}><Values values={row} moneyFrom={2} /></tr>)}
                <TotalRow><Td> </Td><Td>Total</Td><Td align="right"><Amount value={8417.78} /></Td><Td align="right"><Amount value={612.38} /></Td></TotalRow>
              </DenseTable>
            </ReportCard>
          </Pair>

          <Pair>
            <ReportCard title="5. Tender / payment summary">
              <DenseTable minWidth="28rem" head={[{ label: "#" }, { label: "Tender" }, { label: "Count", align: "right" }, { label: "Sale", align: "right" }, { label: "Return", align: "right" }, { label: "Void", align: "right" }, { label: "Net amount", align: "right" }]}>
                {tenders.map((row) => <tr key={row[0]}><Values values={row} moneyFrom={3} /></tr>)}
                <TotalRow><Td> </Td><Td>Total</Td><Td align="right">598</Td>{[11261.6, -629.42, -192.95, 10632.18].map((value, index) => <Td key={index} align="right"><Amount value={value} /></Td>)}</TotalRow>
              </DenseTable>
            </ReportCard>
            <ReportCard title="6. Tips & fees summary">
              <DenseTable head={[{ label: "#" }, { label: "Description" }, { label: "Count", align: "right" }, { label: "Amount", align: "right" }]}>
                {tipsFees.map((row) => <tr key={row[0]}><Values values={row} moneyFrom={3} /></tr>)}
                <TotalRow><Td> </Td><Td>Total</Td><Td align="right">205</Td><Td align="right"><Amount value={1356.53} /></Td></TotalRow>
              </DenseTable>
            </ReportCard>
          </Pair>

          <Pair>
            <ReportCard title="7. Card payment summary">
              <DenseTable head={[{ label: "#" }, { label: "Card" }, { label: "Count", align: "right" }, { label: "Sale", align: "right" }, { label: "Tip", align: "right" }, { label: "Total", align: "right" }]}>
                {cardPayments.map((row) => <tr key={row[0]}><Values values={row} moneyFrom={3} /></tr>)}
                <TotalRow><Td> </Td><Td>Total</Td><Td align="right">135</Td>{[3401.63, 411.63, 3813.26].map((value, index) => <Td key={index} align="right"><Amount value={value} /></Td>)}</TotalRow>
              </DenseTable>
            </ReportCard>
            <ReportCard title="8. Device amount summary">
              <DenseTable minWidth="27rem" head={[{ label: "#" }, { label: "Device name" }, { label: "Count", align: "right" }, { label: "Card amount", align: "right" }, { label: "Surcharge", align: "right" }, { label: "Total amount", align: "right" }]}>
                {devices.map((row) => <tr key={row[0]}><Values values={row} moneyFrom={3} /></tr>)}
                <TotalRow><Td> </Td><Td>Total</Td><Td align="right">136</Td>{[3817.48, 48.31, 3865.79].map((value, index) => <Td key={index} align="right"><Amount value={value} /></Td>)}</TotalRow>
              </DenseTable>
            </ReportCard>
          </Pair>

          <ReportCard title="9. Cash audit summary">
            <DenseTable minWidth="64rem" head={[
              { label: "#" }, { label: "Shift" }, { label: "Employee" }, { label: "Open", align: "right" },
              { label: "Sales", align: "right" }, { label: "Tip", align: "right" }, { label: "Close", align: "right" },
              { label: "Total cash", align: "right" }, { label: "Gratuity", align: "right" }, { label: "Non cash tip", align: "right" },
              { label: "Cash tip", align: "right" }, { label: "Tip withheld", align: "right" },
              { label: "Gratuity withheld", align: "right" }, { label: "Owed", align: "right" }, { label: "Received", align: "right" },
            ]}>
              {cashAudit.map((row) => <tr key={row[0]}><Values values={row} moneyFrom={3} /></tr>)}
              <TotalRow><Td> </Td><Td> </Td><Td>Total</Td>{[643, 5390.57, 294, 50, 6327.57, 402.37, 610.62, 294, 0, 20.13, 5015.16, 1262.41].map((value, index) => <Td key={index} align="right"><Amount value={value} /></Td>)}</TotalRow>
            </DenseTable>
          </ReportCard>

          <Pair>
            <ReportCard title="10. Rounding adjustment summary">
              <DenseTable head={[{ label: "" }, { label: "Description" }, { label: "Amount", align: "right" }]}>
                {[["# Cash Transactions (358)", 0], ["+ve Rounding Adj. Amount (128)", 2.52], ["-ve Rounding Adj. Amount (134)", -2.31]].map(([label, value]) => (
                  <tr key={label as string}><Td>•</Td><Td>{label}</Td><Td align="right"><Amount value={value as number} /></Td></tr>
                ))}
                <TotalRow><Td> </Td><Td>Total rounding adjustment</Td><Td align="right"><Amount value={0.21} /></Td></TotalRow>
              </DenseTable>
            </ReportCard>
            <ReportCard title="11. External payment summary">
              <DenseTable head={[{ label: "#" }, { label: "Type" }, { label: "Count", align: "right" }, { label: "Amount", align: "right" }]}>
                {externalPayments.map((row) => <tr key={row[0]}><Values values={row} moneyFrom={3} /></tr>)}
                <TotalRow><Td> </Td><Td>Total</Td><Td align="right">70</Td><Td align="right"><Amount value={1259.53} /></Td></TotalRow>
              </DenseTable>
            </ReportCard>
          </Pair>

          <Pair>
            <ReportCard title="12. Gift card detail">
              <DenseTable head={[{ label: "#" }, { label: "Gift card detail" }, { label: "Count", align: "right" }]}>
                <tr><Values values={[1, "Gift Card Sales", 36]} /></tr>
                <tr><Values values={[2, "Gift Card Purchase", 11]} /></tr>
                <TotalRow><Td> </Td><Td>Total</Td><Td align="right">47</Td></TotalRow>
              </DenseTable>
            </ReportCard>
            <ReportCard title="14. Void items">
              <DenseTable head={[{ label: "#" }, { label: "Void reason" }, { label: "Count", align: "right" }]}>
                {voidReasons.map((row, index) => <tr key={`${row[0]}-${index}`}><Values values={row} /></tr>)}
                <TotalRow><Td> </Td><Td>Total</Td><Td align="right">80</Td></TotalRow>
              </DenseTable>
            </ReportCard>
          </Pair>

          <ReportCard title="15. Return / void transaction">
            <DenseTable head={[{ label: "#" }, { label: "Check #" }, { label: "Type" }, { label: "Amount", align: "right" }]}>
              {returnsVoids.map((row) => <tr key={`${row[0]}-${row[1]}`}><Values values={row} moneyFrom={3} /></tr>)}
              <TotalRow><Td> </Td><Td> </Td><Td>Total</Td><Td align="right"><Amount value={-794.48} /></Td></TotalRow>
            </DenseTable>
          </ReportCard>

          <ReportCard title="16. Discount summary">
            <DenseTable minWidth="42rem" head={[{ label: "#" }, { label: "Check #" }, { label: "Discount name" }, { label: "Discount reason" }, { label: "Discount before", align: "right" }, { label: "Discount amount", align: "right" }, { label: "Discount after", align: "right" }]}>
              {discounts.map((row) => <tr key={`${row[0]}-${row[1]}`}><Values values={row} moneyFrom={4} /></tr>)}
              <TotalRow><Td> </Td><Td> </Td><Td>Total</Td><Td> </Td>{[2086.39, -312.48, 1773.91].map((value, index) => <Td key={index} align="right"><Amount value={value} /></Td>)}</TotalRow>
            </DenseTable>
          </ReportCard>

          <ReportCard title="17. Employee clock in / out">
            <DenseTable minWidth="40rem" head={[{ label: "#" }, { label: "Employee" }, { label: "#Trans", align: "right" }, { label: "Role name" }, { label: "Working days", align: "right" }, { label: "Total break", align: "right" }, { label: "Work hours", align: "right" }]}>
              {employees.map((row) => <tr key={row[0]}><Values values={row} /></tr>)}
              <TotalRow><Td> </Td><Td> </Td><Td align="right">478</Td><Td> </Td><Td align="right">580</Td><Td align="right">00:25</Td><Td align="right">13803:54</Td></TotalRow>
            </DenseTable>
          </ReportCard>

          <ReportCard title="18. Menu item stock status">
            <DenseTable minWidth="34rem" head={[{ label: "#" }, { label: "Product name" }, { label: "Before qty", align: "right" }, { label: "Sold qty", align: "right" }, { label: "Received qty", align: "right" }, { label: "After qty", align: "right" }]}>
              {stock.map((row) => <tr key={row[0]}><Values values={row} moneyFrom={2} /></tr>)}
            </DenseTable>
          </ReportCard>
        </div>
      )}
    </div>
  );
}
