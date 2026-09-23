"use client";

import { Button } from "@/components/tailgrids/core/button";
import { cn } from "@/utils/cn";
import { ArrowLeft } from "@tailgrids/icons";
import { useRouter } from "next/navigation";
import {
  amountClass,
  DenseTable,
  Meta,
  money,
  pct,
  ReportCard,
  Td,
  TotalRow,
} from "../../_components/report-ui";
import {
  shiftCardPayments,
  shiftCardPaymentTotal,
  shiftCashAudit,
  shiftDepartmentTotal,
  shiftDepartments,
  shiftDiscountTotal,
  shiftDiscounts,
  shiftReportMeta,
  shiftReturnsVoids,
  shiftReturnsVoidsTotal,
  shiftSummary,
  shiftVoidItems,
  shifts,
} from "./data";

export default function ShiftEndReportView({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const shift = shifts.find((item) => item.id === shiftId) ?? shifts[1];

  return (
    <div className="mt-2 space-y-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-3 sm:space-y-2.5 lg:px-4">
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Button
            appearance="outline"
            size="sm"
            className="w-fit gap-1.5"
            onPress={() => router.push("/report/shift-report")}
          >
            <ArrowLeft />
            Shift report
          </Button>
          <h1 className="text-center text-lg leading-6 font-semibold text-text-primary sm:text-xl">
            {shiftReportMeta.title}
          </h1>
          <span aria-hidden />
        </div>
        <p className="text-center text-[11px] leading-4 text-text-tertiary">
          Shift #{shift.shiftNo} · {shift.station} · {shiftReportMeta.userName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-lg border border-card-border bg-card-surface-area px-2 py-1.5 text-center text-[11px] leading-4 sm:grid-cols-4">
        <Meta label="Business date" value={shiftReportMeta.businessDateLabel} />
        <Meta label="Day start" value={shiftReportMeta.dayStart} />
        <Meta
          label="Day end"
          value={shift.dateLabel.split(" ").slice(-2).join(" ")}
        />
        <Meta label="Printed" value={shiftReportMeta.printedAt} />
      </div>

      <ReportCard title="1. Summary overview">
        <div className="grid grid-cols-2 divide-x divide-y divide-card-border sm:grid-cols-3 xl:grid-cols-6">
          {shiftSummary.map((item) => (
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
          {shiftDepartments.map((row) => (
            <tr key={row.name}>
              <Td>{row.no}</Td>
              <Td className="font-medium text-text-primary">{row.name}</Td>
              <Td align="right">{row.trans}</Td>
              <Td align="right">{row.qty}</Td>
              <Td align="right">{money(row.amount)}</Td>
              <Td align="right" className={amountClass(row.discount)}>
                {money(row.discount)}
              </Td>
              <Td align="right">{pct(row.discountPct)}</Td>
              <Td align="right">{money(row.subtotal)}</Td>
              <Td align="right">{money(row.tax)}</Td>
              <Td align="right" className="font-medium text-text-primary">
                {money(row.total)}
              </Td>
              <Td align="right">{pct(row.salesPct)}</Td>
            </tr>
          ))}
          <TotalRow>
            <Td> </Td>
            <Td>Grand total</Td>
            <Td align="right">{shiftDepartmentTotal.trans}</Td>
            <Td align="right">{shiftDepartmentTotal.qty}</Td>
            <Td align="right">{money(shiftDepartmentTotal.amount)}</Td>
            <Td
              align="right"
              className={amountClass(shiftDepartmentTotal.discount)}
            >
              {money(shiftDepartmentTotal.discount)}
            </Td>
            <Td align="right">{pct(shiftDepartmentTotal.discountPct)}</Td>
            <Td align="right">{money(shiftDepartmentTotal.subtotal)}</Td>
            <Td align="right">{money(shiftDepartmentTotal.tax)}</Td>
            <Td align="right">{money(shiftDepartmentTotal.total)}</Td>
            <Td align="right">{pct(shiftDepartmentTotal.salesPct)}</Td>
          </TotalRow>
        </DenseTable>
      </ReportCard>

      <ReportCard title="3. Cash audit summary">
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
          <tr>
            <Td>{shiftCashAudit.no}</Td>
            <Td>{shiftCashAudit.shift}</Td>
            <Td className="font-medium text-text-primary">
              {shiftCashAudit.employee}
            </Td>
            <Td align="right">{money(shiftCashAudit.open)}</Td>
            <Td align="right">{money(shiftCashAudit.sales)}</Td>
            <Td align="right">{money(shiftCashAudit.tip)}</Td>
            <Td align="right">{money(shiftCashAudit.close)}</Td>
            <Td align="right">{money(shiftCashAudit.total)}</Td>
            <Td align="right">{money(shiftCashAudit.cashGratuity)}</Td>
            <Td align="right">{money(shiftCashAudit.nonCashTip)}</Td>
            <Td align="right">{money(shiftCashAudit.cashTip)}</Td>
            <Td align="right">{money(shiftCashAudit.nonCashTipWithheld)}</Td>
            <Td align="right">{money(shiftCashAudit.gratuityWithheld)}</Td>
            <Td
              align="right"
              className={amountClass(shiftCashAudit.owedToRest)}
            >
              {money(shiftCashAudit.owedToRest)}
            </Td>
            <Td align="right">{money(shiftCashAudit.received)}</Td>
          </tr>
          <TotalRow>
            <Td> </Td>
            <Td> </Td>
            <Td>Total</Td>
            <Td align="right">{money(shiftCashAudit.open)}</Td>
            <Td align="right">{money(shiftCashAudit.sales)}</Td>
            <Td align="right">{money(shiftCashAudit.tip)}</Td>
            <Td align="right">{money(shiftCashAudit.close)}</Td>
            <Td align="right">{money(shiftCashAudit.total)}</Td>
            <Td align="right">{money(shiftCashAudit.cashGratuity)}</Td>
            <Td align="right">{money(shiftCashAudit.nonCashTip)}</Td>
            <Td align="right">{money(shiftCashAudit.cashTip)}</Td>
            <Td align="right">{money(shiftCashAudit.nonCashTipWithheld)}</Td>
            <Td align="right">{money(shiftCashAudit.gratuityWithheld)}</Td>
            <Td
              align="right"
              className={amountClass(shiftCashAudit.owedToRest)}
            >
              {money(shiftCashAudit.owedToRest)}
            </Td>
            <Td align="right">{money(shiftCashAudit.received)}</Td>
          </TotalRow>
        </DenseTable>
      </ReportCard>

      <div className="grid gap-2 sm:grid-cols-2">
        <ReportCard title="4. Card payment summary">
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
            {shiftCardPayments.map((row) => (
              <tr key={row.name}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.name}</Td>
                <Td align="right">{row.count}</Td>
                <Td align="right">{money(row.sale)}</Td>
                <Td align="right">{money(row.tip)}</Td>
                <Td align="right" className="font-medium text-text-primary">
                  {money(row.total)}
                </Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td>Total</Td>
              <Td align="right">{shiftCardPaymentTotal.count}</Td>
              <Td align="right">{money(shiftCardPaymentTotal.sale)}</Td>
              <Td align="right">{money(shiftCardPaymentTotal.tip)}</Td>
              <Td align="right">{money(shiftCardPaymentTotal.total)}</Td>
            </TotalRow>
          </DenseTable>
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
            {shiftVoidItems.map((row) => (
              <tr key={row.reason}>
                <Td>{row.no}</Td>
                <Td className="font-medium text-text-primary">{row.reason}</Td>
                <Td align="right">{row.count}</Td>
                <Td>{row.employee}</Td>
                <Td align="right">{shift.shiftNo}</Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td>Total</Td>
              <Td align="right">
                {shiftVoidItems.reduce((sum, row) => sum + row.count, 0)}
              </Td>
              <Td> </Td>
              <Td> </Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <ReportCard title="5. Return / void transaction" className="min-w-0">
          <DenseTable
            minWidth="34rem"
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
            {shiftReturnsVoids.map((row) => (
              <tr key={`${row.check}-${row.type}`}>
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
                <Td>{shift.station}</Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td> </Td>
              <Td>Total</Td>
              <Td> </Td>
              <Td align="right" className={amountClass(shiftReturnsVoidsTotal)}>
                {money(shiftReturnsVoidsTotal)}
              </Td>
              <Td> </Td>
              <Td> </Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>

        <ReportCard title="7. Discount summary" className="min-w-0">
          <DenseTable
            minWidth="36rem"
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
            {shiftDiscounts.map((row) => (
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
                <Td align="right" className={amountClass(row.after)}>
                  {money(row.after)}
                </Td>
              </tr>
            ))}
            <TotalRow>
              <Td> </Td>
              <Td> </Td>
              <Td>Total</Td>
              <Td> </Td>
              <Td align="right">{money(shiftDiscountTotal.before)}</Td>
              <Td
                align="right"
                className={amountClass(shiftDiscountTotal.amount)}
              >
                {money(shiftDiscountTotal.amount)}
              </Td>
              <Td align="right">{money(shiftDiscountTotal.after)}</Td>
            </TotalRow>
          </DenseTable>
        </ReportCard>
      </div>
    </div>
  );
}
