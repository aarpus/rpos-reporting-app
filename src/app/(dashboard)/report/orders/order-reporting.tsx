"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/components/store/store-provider";
import { reportingQueryKey } from "@/lib/reporting/query-key";

type Order = {
  order_code: string;
  order_number: string | null;
  business_date: string;
  station_code: string | null;
  total: string;
  paid_amount: string;
  balance_amount: string;
  is_void: boolean;
  is_return: boolean;
};
type OrderReport = {
  totals: {
    order_count: number;
    order_total: string;
    item_subtotal: string;
    payment_amount: string;
    last_synced_at: string | null;
  };
  orders: Order[];
  detail: {
    order: Record<string, unknown>;
    items: Record<string, unknown>[];
    payments: Record<string, unknown>[];
    card_payments: Record<string, unknown>[];
  } | null;
};

function dateForStore(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function OrderReporting() {
  const { selectedStore } = useStore();
  if (!selectedStore)
    return (
      <p className="p-6 text-text-secondary">
        Select a store to view reporting.
      </p>
    );
  if (selectedStore.storeType !== "RESTAURANT")
    return (
      <p className="p-6 text-text-secondary">
        Select a restaurant store to open order reporting.
      </p>
    );
  // Reset filters and detail when the scope changes; never retain another store's detail.
  return (
    <StoreOrders
      key={selectedStore.storeCode}
      storeCode={selectedStore.storeCode}
      name={selectedStore.name}
      timezone={selectedStore.timezone}
    />
  );
}

function StoreOrders({
  storeCode,
  name,
  timezone,
}: {
  storeCode: string;
  name: string;
  timezone: string;
}) {
  const [from, setFrom] = useState(() => dateForStore(timezone));
  const [to, setTo] = useState(() => dateForStore(timezone));
  const [filters, setFilters] = useState({
    from,
    to,
    offset: 0,
    orderCode: "",
  });
  const report = useQuery({
    queryKey: reportingQueryKey(storeCode, filters),
    queryFn: async ({ signal }): Promise<OrderReport> => {
      const params = new URLSearchParams({
        store_code: storeCode,
        from: filters.from,
        to: filters.to,
        offset: String(filters.offset),
        limit: "50",
      });
      if (filters.orderCode) params.set("order_code", filters.orderCode);
      const response = await fetch(`/api/reporting/orders?${params}`, {
        signal,
        cache: "no-store",
      });
      const body = (await response.json()) as OrderReport & { error?: string };
      if (!response.ok)
        throw new Error(body.error ?? "Unable to load reporting.");
      return body;
    },
  });
  const inputClass =
    "rounded-lg border border-card-border bg-card-surface-area px-3 py-2 text-sm text-text-primary";
  const buttonClass = `${inputClass} disabled:opacity-50`;
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-text-primary">
        Order Reporting — {name}
      </h1>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters({ from, to, offset: 0, orderCode: "" });
        }}
      >
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="block">From business date</span>
          <input
            type="date"
            required
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="block">To business date</span>
          <input
            type="date"
            required
            min={from}
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className={inputClass}
          />
        </label>
        <button className={buttonClass} type="submit">
          Generate report
        </button>
        <button
          className={buttonClass}
          type="button"
          disabled={report.isFetching}
          onClick={() => void report.refetch()}
        >
          Refresh
        </button>
      </form>
      {report.isPending && (
        <p className="text-text-secondary">Loading reporting…</p>
      )}
      {report.error && (
        <p role="alert" className="text-error-500">
          {report.error.message}
        </p>
      )}
      {report.data && (
        <>
          <p className="text-sm text-text-secondary">
            Last successful sync:{" "}
            {report.data.totals.last_synced_at
              ? new Date(report.data.totals.last_synced_at).toLocaleString(
                  undefined,
                  { timeZone: timezone },
                )
              : "No data synced yet"}
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Orders", report.data.totals.order_count],
              ["Order total", report.data.totals.order_total],
              ["Item subtotal", report.data.totals.item_subtotal],
              ["Payment amount", report.data.totals.payment_amount],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-card-border p-4"
              >
                <p className="text-sm text-text-secondary">{label}</p>
                <p className="text-lg font-semibold text-text-primary">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-tertiary">
            Raw POS totals include void and return records as supplied. Card
            attempts are shown in detail and are not added to payment totals.
          </p>
          <div className="overflow-x-auto rounded-lg border border-card-border">
            <table className="w-full text-left text-sm text-text-primary">
              <thead>
                <tr>
                  {[
                    "Order",
                    "Business date",
                    "Station",
                    "Total",
                    "Paid",
                    "Balance",
                    "Flags",
                    "Detail",
                  ].map((heading) => (
                    <th key={heading} className="p-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.data.orders.map((order) => (
                  <tr
                    key={order.order_code}
                    className="border-t border-card-border"
                  >
                    <td className="p-3">
                      {order.order_number ?? order.order_code}
                    </td>
                    <td className="p-3">{order.business_date}</td>
                    <td className="p-3">{order.station_code ?? "—"}</td>
                    <td className="p-3">{order.total}</td>
                    <td className="p-3">{order.paid_amount}</td>
                    <td className="p-3">{order.balance_amount}</td>
                    <td className="p-3">
                      {[order.is_void && "Void", order.is_return && "Return"]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="p-3">
                      <button
                        className={buttonClass}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            orderCode: order.order_code,
                          })
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!report.data.orders.length && (
              <p className="p-4 text-text-secondary">
                No orders for these business dates.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              className={buttonClass}
              disabled={filters.offset === 0}
              onClick={() =>
                setFilters({
                  ...filters,
                  offset: Math.max(0, filters.offset - 50),
                  orderCode: "",
                })
              }
            >
              Previous
            </button>
            <span className="text-sm text-text-secondary">
              Page {filters.offset / 50 + 1}
            </span>
            <button
              className={buttonClass}
              disabled={filters.offset + 50 >= report.data.totals.order_count}
              onClick={() =>
                setFilters({
                  ...filters,
                  offset: filters.offset + 50,
                  orderCode: "",
                })
              }
            >
              Next
            </button>
          </div>
          {report.data.detail && (
            <section className="space-y-3 rounded-lg border border-card-border p-4">
              <div className="flex justify-between">
                <h2 className="font-semibold text-text-primary">
                  Order {filters.orderCode}
                </h2>
                <button
                  className={buttonClass}
                  onClick={() => setFilters({ ...filters, orderCode: "" })}
                >
                  Close detail
                </button>
              </div>
              {(
                [
                  [
                    "Items",
                    report.data.detail.items,
                    ["item_name", "quantity", "subtotal", "tax_amt"],
                  ],
                  [
                    "Payments",
                    report.data.detail.payments,
                    [
                      "payment_code",
                      "tender_name",
                      "payment_amount",
                      "payment_status",
                    ],
                  ],
                  [
                    "Card transactions",
                    report.data.detail.card_payments,
                    [
                      "card_payment_code",
                      "payment_code",
                      "tran_type",
                      "total_amount",
                      "response_code",
                      "response_text",
                    ],
                  ],
                ] as const
              ).map(([title, rows, fields]) => (
                <div key={title} className="overflow-x-auto">
                  <h3 className="mb-2 font-medium text-text-primary">
                    {title}
                  </h3>
                  <table className="w-full text-left text-sm text-text-secondary">
                    <thead>
                      <tr>
                        {fields.map((field) => (
                          <th key={field} className="p-2">
                            {field.replaceAll("_", " ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={index}>
                          {fields.map((field) => (
                            <td key={field} className="p-2">
                              {String(row[field] ?? "—")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!rows.length && (
                    <p className="text-sm text-text-secondary">No records.</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
