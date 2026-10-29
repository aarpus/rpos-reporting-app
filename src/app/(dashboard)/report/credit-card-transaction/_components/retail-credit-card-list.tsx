"use client";

import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  RetailReportDateFilter,
  type RetailAppliedDateFilter,
} from "../../_components/retail-report-date-filter";
import {
  RetailReportTable,
  type RetailReportColumn,
} from "../../_components/retail-report-table";
import {
  filterCardTransactions,
  retailCardTransactions,
  type RetailCardTransaction,
} from "./retail-credit-card-data";

const noRows: RetailCardTransaction[] = [];

function filterBounds(applied: RetailAppliedDateFilter) {
  if (applied.kind === "single") {
    return { from: applied.date, to: applied.date };
  }
  const from =
    applied.from.compare(applied.to) <= 0 ? applied.from : applied.to;
  const to = applied.from.compare(applied.to) <= 0 ? applied.to : applied.from;
  return { from, to };
}

function toQuery(applied: RetailAppliedDateFilter) {
  if (applied.kind === "single") {
    return `kind=single&date=${applied.date.toString()}`;
  }
  const { from, to } = filterBounds(applied);
  return `kind=range&from=${from.toString()}&to=${to.toString()}`;
}

const columns: RetailReportColumn<RetailCardTransaction>[] = [
  {
    id: "date",
    header: "Date",
    cell: (row) => row.dateLabel,
    cellClassName: "whitespace-nowrap",
  },
  {
    id: "cardName",
    header: "Card Name",
    cell: (row) => row.cardName || "—",
    cellClassName: "whitespace-nowrap",
  },
  {
    id: "cardNumber",
    header: "Card#",
    cell: (row) => row.cardNumber,
    cellClassName: "whitespace-nowrap tabular-nums",
  },
  {
    id: "result",
    header: "Result",
    cell: (row) => row.result,
  },
  {
    id: "amount",
    header: "Amount($)",
    cell: (row) => row.amount,
    cellClassName: "text-right tabular-nums",
  },
  {
    id: "authCode",
    header: "AuthCode",
    cell: (row) => row.authCode,
    cellClassName: "tabular-nums",
  },
  {
    id: "station",
    header: "Station Name",
    cell: (row) => row.stationName,
    cellClassName: "font-medium whitespace-nowrap text-text-primary",
  },
];

export default function RetailCreditCardList() {
  const router = useRouter();
  const [applied, setApplied] = useState<RetailAppliedDateFilter | null>(null);

  const rows = useMemo(() => {
    if (!applied) return noRows;
    const { from, to } = filterBounds(applied);
    return filterCardTransactions(retailCardTransactions, from, to);
  }, [applied]);

  return (
    <div className="min-h-full pb-6">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">
          Card Transaction Details
        </h1>
        <Breadcrumbs
          dividerType="slash"
          items={[
            { href: "/", label: "Dashboard" },
            {
              href: "/report/credit-card-transaction",
              label: "Card Transaction Details",
            },
          ]}
        />
      </div>

      <div className="space-y-4 px-3 sm:px-5">
        <RetailReportDateFilter
          onSearch={setApplied}
          onReset={() => setApplied(null)}
          extraActions={
            rows.length > 0 && applied ? (
              <Button
                size="sm"
                appearance="outline"
                className="h-9 px-4"
                onPress={() =>
                  router.push(
                    `/report/credit-card-transaction/details?${toQuery(applied)}`,
                  )
                }
              >
                View Details
              </Button>
            ) : null
          }
        />
        <RetailReportTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          recordLabel="records"
          minWidthClassName="min-w-[52rem]"
          emptyMessage="No card transactions found for the selected date. Preview transactions run from Apr 8, 2025 through Aug 25, 2025."
        />
      </div>
    </div>
  );
}
