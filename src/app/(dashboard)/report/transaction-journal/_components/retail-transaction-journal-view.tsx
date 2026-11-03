"use client";

import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { reportingQueryKey } from "@/lib/reporting/query-key";
import { cn } from "@/utils/cn";
import { ArrowLeft } from "@tailgrids/icons";
import { useQuery } from "@tanstack/react-query";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LuUpload } from "react-icons/lu";
import { formatShiftStamp } from "../../shift-report/_components/retail-shift-data";
import {
  formatJournalPrintedAt,
  parseRetailJournalFilter,
  transactionJournalListHref,
  type RetailJournalDetail,
  type RetailJournalLine,
} from "./retail-transaction-journal-data";

const printStyles = `
@media print {
  @page { margin: 0; }
  html {
    color-scheme: light !important;
    background: #fff !important;
  }
  html, body {
    height: auto !important;
    overflow: visible !important;
    background: #fff !important;
    color: #111827 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  aside, header, nav, .retail-report-no-print { display: none !important; }
  body, body * {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  body,
  body > div,
  main {
    background: #fff !important;
    color: #111827 !important;
  }
  #retail-transaction-journal-view-print {
    background: #fff !important;
    color: #111827 !important;
    padding: 12mm !important;
  }
  #retail-transaction-journal-view-print,
  #retail-transaction-journal-view-print * {
    color: #111827 !important;
    background-color: #fff !important;
    border-color: #e5e7eb !important;
    box-shadow: none !important;
  }
  #retail-transaction-journal-view-print .shift-title-bar,
  #retail-transaction-journal-view-print .shift-title-bar *,
  #retail-transaction-journal-view-print thead,
  #retail-transaction-journal-view-print thead *,
  #retail-transaction-journal-view-print .panel-title,
  #retail-transaction-journal-view-print .panel-title * {
    background-color: #1f2937 !important;
    color: #fff !important;
  }
  #retail-transaction-journal-view-print .bg-background-gray-secondary_alt_2,
  #retail-transaction-journal-view-print .bg-background-gray-secondary_alt_2 * {
    background-color: #f3f4f6 !important;
    color: #111827 !important;
  }
}
`;

const headCell =
  "px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-card-surface-area";
const bodyCell = "px-3 py-2 text-sm whitespace-nowrap text-text-secondary";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-x-3 py-1 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-medium text-text-primary">{value}</dd>
    </div>
  );
}

function PaidByRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5 text-sm">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="tabular-nums font-medium text-text-primary">{value}</dd>
    </div>
  );
}

type JournalDetailResponse = {
  timezone: string;
  transaction: {
    id: string;
    transaction_date_time: string;
    stationname: string;
    transaction_number: string;
    total: string;
    cashier: string | null;
    lines: { rows: RetailJournalLine[]; total: RetailJournalDetail["lineTotals"] & { retail?: string } | null };
    credit_card: Array<{ label: string; value: string }>;
    paid_by_amounts: Array<{ label: string; value: string }>;
  } | null;
};

function cardValue(lines: Array<{ label: string; value: string }>, label: string) {
  return lines.find((line) => line.label.toLowerCase() === label.toLowerCase())?.value ?? "";
}

export default function RetailTransactionJournalView() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { selectedStore } = useStore();
  const [printedAt, setPrintedAt] = useState("");
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const listQuery = searchParams.toString();
  const listHref = transactionJournalListHref(listQuery);
  const listFilter = useMemo(
    () => parseRetailJournalFilter(new URLSearchParams(listQuery)),
    [listQuery],
  );

  const storeCode = selectedStore?.storeCode ?? "";
  const report = useQuery({
    queryKey: reportingQueryKey(storeCode, { report: "transaction-journal", id }),
    enabled: Boolean(storeCode && id),
    queryFn: async ({ signal }): Promise<JournalDetailResponse> => {
      const params = new URLSearchParams({ store_code: storeCode, id: id ?? "" });
      const response = await fetch(`/api/reporting/retail/transaction-journal?${params}`, { signal, cache: "no-store" });
      if (response.status === 404) return { timezone: selectedStore?.timezone ?? "UTC", transaction: null };
      const body = (await response.json()) as JournalDetailResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load this transaction.");
      return body;
    },
  });
  const loaded = report.data?.transaction;
  const timezone = report.data?.timezone ?? selectedStore?.timezone ?? "UTC";
  const detail = useMemo(() => {
    if (!loaded) return null;
    const lineTotal = loaded.lines.total;
    return {
      transaction: {
        dateTimeLabel: formatShiftStamp(loaded.transaction_date_time, timezone),
        stationId: loaded.stationname,
        transactionNo: loaded.transaction_number,
        total: loaded.total,
        cashier: loaded.cashier ?? "",
      },
      lines: loaded.lines.rows,
      lineTotals: {
        discount: lineTotal?.discount ?? "",
        amount: lineTotal?.amount ?? "",
        tax: lineTotal?.tax ?? "",
        deposit: lineTotal?.deposit ?? "",
        total: lineTotal?.total ?? "",
      },
      cardDetail: {
        authCode: cardValue(loaded.credit_card, "Auth Code"),
        card: cardValue(loaded.credit_card, "Card"),
        reference: cardValue(loaded.credit_card, "Reference"),
        dateTime: cardValue(loaded.credit_card, "Date Time"),
        amount: cardValue(loaded.credit_card, "Amount"),
        transactionType: cardValue(loaded.credit_card, "Transaction Type"),
      },
      paidBy: {
        cash: cardValue(loaded.paid_by_amounts, "Cash"),
        check: cardValue(loaded.paid_by_amounts, "Check"),
        card: cardValue(loaded.paid_by_amounts, "Card"),
        giftCard: cardValue(loaded.paid_by_amounts, "GiftCard"),
        storeCreditCard: cardValue(loaded.paid_by_amounts, "StoreCreditCard"),
        foodStamp: cardValue(loaded.paid_by_amounts, "FoodStamp"),
        ebt: cardValue(loaded.paid_by_amounts, "EBT"),
        voucher: cardValue(loaded.paid_by_amounts, "Voucher"),
        account: cardValue(loaded.paid_by_amounts, "Account"),
        papodw2: cardValue(loaded.paid_by_amounts, "Papodw2"),
      },
    };
  }, [loaded, timezone]);

  useEffect(() => {
    setPrintedAt(formatJournalPrintedAt(new Date()));
  }, []);

  function exportPdf() {
    const previous = document.title;
    document.title = "TRANSACTION JOURNAL REPORT";
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  if (report.isSuccess && !loaded) notFound();
  if (!detail) {
    return (
      <div className="px-4 py-4 text-sm text-text-secondary sm:px-6">
        {report.error ? report.error.message : "Loading transaction."}
      </div>
    );
  }

  const { transaction, lines, lineTotals, cardDetail, paidBy } = detail;

  return (
    <div
      id="retail-transaction-journal-view-print"
      className="min-h-full px-4 py-4 sm:px-6"
    >
      <style>{printStyles}</style>
      <div className="retail-report-no-print mb-4 flex items-center justify-between gap-3">
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={() => router.push(listHref)}
        >
          <ArrowLeft />
          Back
        </Button>
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
          TRANSACTION JOURNAL REPORT
        </div>

        <div className="mt-4 grid gap-4 border-t border-card-border pt-4 sm:grid-cols-2">
          <dl>
            <MetaRow label="DateTime :" value={printedAt} />
            <MetaRow label="Terminal :" value="All" />
            <MetaRow
              label="Transaction :"
              value={
                listFilter?.transactionNo.trim()
                  ? listFilter.transactionNo.trim()
                  : "All Transaction"
              }
            />
          </dl>
          <dl>
            <MetaRow label="DateTime :" value={transaction.dateTimeLabel} />
            <MetaRow label="Employee Name :" value="Acute User" />
            <MetaRow label="Selected Employee :" value="All" />
          </dl>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-card-border bg-card-surface-area">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem]">
            <thead className="bg-text-primary">
              <tr>
                {[
                  { label: "Quantity", align: "left" as const },
                  { label: "Item#", align: "left" as const },
                  { label: "Product Name", align: "left" as const },
                  { label: "Retail", align: "right" as const },
                  { label: "Discount", align: "right" as const },
                  { label: "Amount", align: "right" as const },
                  { label: "Tax", align: "right" as const },
                  { label: "Deposit", align: "right" as const },
                  { label: "Total", align: "right" as const },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={cn(
                      headCell,
                      col.align === "right" && "text-right",
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-card-border bg-background-gray-secondary_alt_2">
                <td
                  colSpan={9}
                  className="px-3 py-2 text-sm whitespace-nowrap text-text-primary"
                >
                  <span className="font-medium">Date/Time :</span>{" "}
                  {transaction.dateTimeLabel}
                  <span className="mx-3 text-text-tertiary">|</span>
                  <span className="font-medium">Terminal Name :</span>{" "}
                  {transaction.stationId}
                  <span className="mx-3 text-text-tertiary">|</span>
                  <span className="font-medium">Trans.# :</span>{" "}
                  {transaction.transactionNo}
                  <span className="mx-3 text-text-tertiary">|</span>
                  <span className="font-medium">Total :</span>{" "}
                  {transaction.total}
                  <span className="mx-3 text-text-tertiary">|</span>
                  <span className="font-medium">Cashier :</span>{" "}
                  {transaction.cashier}
                </td>
              </tr>
              {lines.map((line) => (
                <tr
                  key={`${line.itemNo}-${line.productName}`}
                  className="border-t border-card-border"
                >
                  <td className={cn(bodyCell, "text-text-primary")}>
                    {line.quantity}
                  </td>
                  <td className={cn(bodyCell, "text-text-primary")}>
                    {line.itemNo}
                  </td>
                  <td
                    className={cn(
                      bodyCell,
                      "max-w-md whitespace-normal text-text-primary",
                    )}
                  >
                    {line.productName}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.retail}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.discount}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.amount}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.tax}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.deposit}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.total}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-card-border bg-background-gray-secondary_alt_2">
                <td colSpan={3} className={cn(bodyCell, "font-semibold text-text-primary")}>
                  Total
                </td>
                <td className={cn(bodyCell, "text-right")} />
                <td
                  className={cn(
                    bodyCell,
                    "text-right font-semibold tabular-nums text-text-primary",
                  )}
                >
                  {lineTotals.discount}
                </td>
                <td
                  className={cn(
                    bodyCell,
                    "text-right font-semibold tabular-nums text-text-primary",
                  )}
                >
                  {lineTotals.amount}
                </td>
                <td
                  className={cn(
                    bodyCell,
                    "text-right font-semibold tabular-nums text-text-primary",
                  )}
                >
                  {lineTotals.tax}
                </td>
                <td
                  className={cn(
                    bodyCell,
                    "text-right font-semibold tabular-nums text-text-primary",
                  )}
                >
                  {lineTotals.deposit}
                </td>
                <td
                  className={cn(
                    bodyCell,
                    "text-right font-semibold tabular-nums text-text-primary",
                  )}
                >
                  {lineTotals.total}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-card-border bg-card-surface-area">
          <div className="panel-title bg-text-primary px-4 py-2 text-sm font-semibold tracking-wide text-card-surface-area">
            CREDIT CARD DETAIL
          </div>
          <dl className="space-y-1 px-4 py-3">
            <MetaRow label="Auth Code :" value={cardDetail.authCode || "\u00a0"} />
            <MetaRow label="Card :" value={cardDetail.card} />
            <MetaRow label="Reference :" value={cardDetail.reference || "\u00a0"} />
            <MetaRow label="Date Time :" value={cardDetail.dateTime} />
            <MetaRow label="Amount :" value={cardDetail.amount} />
            <MetaRow
              label="Transaction Type :"
              value={cardDetail.transactionType}
            />
          </dl>
        </section>

        <section className="overflow-hidden rounded-lg border border-card-border bg-card-surface-area">
          <div className="panel-title bg-text-primary px-4 py-2 text-sm font-semibold tracking-wide text-card-surface-area">
            PAID BY
          </div>
          <dl className="px-4 py-3">
            <PaidByRow label="Cash :" value={paidBy.cash} />
            <PaidByRow label="Check :" value={paidBy.check} />
            <PaidByRow label="Card :" value={paidBy.card} />
            <PaidByRow label="GiftCard :" value={paidBy.giftCard} />
            <PaidByRow label="StoreCreditCard :" value={paidBy.storeCreditCard} />
            <PaidByRow label="FoodStamp :" value={paidBy.foodStamp} />
            <PaidByRow label="EBT :" value={paidBy.ebt} />
            <PaidByRow label="Voucher :" value={paidBy.voucher} />
            <PaidByRow label="Account :" value={paidBy.account} />
            <PaidByRow label="Papodw2 :" value={paidBy.papodw2} />
          </dl>
        </section>
      </div>
    </div>
  );
}
