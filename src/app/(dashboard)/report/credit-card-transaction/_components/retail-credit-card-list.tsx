"use client";

import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { reportingQueryKey } from "@/lib/reporting/query-key";
import { CalendarDate } from "@internationalized/date";
import { useQuery } from "@tanstack/react-query";
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
  formatCardStamp,
  type RetailCardTransaction,
} from "./retail-credit-card-data";

const noRows: RetailCardTransaction[] = [];

type CardApiRow = {
  id: string;
  card_datetime: string;
  card_name: string;
  card_no: string;
  result: string | null;
  amount: string;
  auth_code: string;
  station_name: string;
  tender: "credit" | "debit" | "external";
};

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
  const { selectedStore } = useStore();
  const [applied, setApplied] = useState<RetailAppliedDateFilter | null>(null);
  const storeCode = selectedStore?.storeCode ?? "";
  const range = applied ? filterBounds(applied) : null;
  const report = useQuery({
    queryKey: reportingQueryKey(storeCode, { report: "credit-card", range }),
    enabled: Boolean(storeCode && range),
    queryFn: async ({ signal }): Promise<{ timezone: string; rows: CardApiRow[] }> => {
      const params = new URLSearchParams({
        store_code: storeCode,
        from: range?.from.toString() ?? "",
        to: range?.to.toString() ?? "",
      });
      const response = await fetch(`/api/reporting/retail/credit-card-transaction?${params}`, { signal, cache: "no-store" });
      const body = (await response.json()) as { timezone: string; rows: CardApiRow[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load card transactions.");
      return body;
    },
  });

  const rows = useMemo(() => {
    if (!applied) return noRows;
    const timezone = report.data?.timezone ?? selectedStore?.timezone ?? "UTC";
    return (report.data?.rows ?? [])
      .filter((row) => row.tender === "credit" || row.tender === "debit")
      .map((row) => ({
        id: row.id,
        dateLabel: formatCardStamp(row.card_datetime, timezone),
        date: new CalendarDate(2000, 1, 1),
        cardName: row.card_name,
        cardNumber: row.card_no,
        result: row.result ?? "",
        amount: row.amount,
        amountValue: 0,
        authCode: row.auth_code,
        stationName: row.station_name,
        kind: (row.tender === "debit" ? "debit" : "credit") as "credit" | "debit",
      }));
  }, [applied, report.data, selectedStore?.timezone]);

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
        {applied && report.error ? (
          <div role="alert" className="text-sm text-error-500">
            {report.error.message}{" "}
            <Button size="xs" appearance="outline" onPress={() => void report.refetch()}>
              Retry
            </Button>
          </div>
        ) : null}
        <RetailReportTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          recordLabel="records"
          minWidthClassName="min-w-[52rem]"
          emptyMessage={
            !applied
              ? "Search a date to see card transactions."
              : report.isFetching
                ? "Loading card transactions."
                : "No card transactions found for the selected date."
          }
        />
      </div>
    </div>
  );
}
