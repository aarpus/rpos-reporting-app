"use client";

import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/tailgrids/core/tooltip";
import { useStore } from "@/components/store/store-provider";
import { reportingQueryKey } from "@/lib/reporting/query-key";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LuEye } from "react-icons/lu";
import {
  RetailReportDateFilter,
  type RetailAppliedDateFilter,
} from "../../_components/retail-report-date-filter";
import {
  RetailReportTable,
  type RetailReportColumn,
} from "../../_components/retail-report-table";
import { formatShiftStamp, type RetailShiftStatus } from "./retail-shift-data";

type ShiftListRow = {
  id: string;
  stationname: string;
  batch_number: string;
  shift: number;
  start_time: string;
  end_time: string | null;
  status: RetailShiftStatus;
};

type ShiftListResponse = {
  timezone: string;
  rows: ShiftListRow[];
};

type DisplayRow = {
  id: string;
  startLabel: string;
  endLabel: string;
  terminal: string;
  batch: string;
  shift: number;
  status: RetailShiftStatus;
};

function StatusBadge({ status }: { status: RetailShiftStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        status === "Close"
          ? "bg-badge-success-background text-badge-success-text"
          : "bg-background-gray-secondary_alt_2 text-text-secondary",
      )}
    >
      {status}
    </span>
  );
}

function ViewShiftButton({ row }: { row: DisplayRow }) {
  const router = useRouter();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={`View shift ${row.shift}`}
          iconOnly
          size="xs"
          appearance="outline"
          onPress={() => router.push(`/report/shift-report/${row.id}`)}
        >
          <LuEye />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="block">
        <p>View shift</p>
      </TooltipContent>
    </Tooltip>
  );
}

const columns: RetailReportColumn<DisplayRow>[] = [
  {
    id: "start",
    header: "Start Date/Time",
    cell: (row) => row.startLabel,
    cellClassName: "whitespace-nowrap",
  },
  {
    id: "end",
    header: "End Date/Time",
    cell: (row) => row.endLabel,
    cellClassName: "whitespace-nowrap",
  },
  {
    id: "terminal",
    header: "Terminal",
    cell: (row) => row.terminal,
    cellClassName: "font-medium whitespace-nowrap text-text-primary",
  },
  {
    id: "batch",
    header: "Batch#",
    cell: (row) => row.batch,
    cellClassName: "tabular-nums",
  },
  {
    id: "shift",
    header: "Shift#",
    cell: (row) => row.shift,
    cellClassName: "tabular-nums",
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
  {
    id: "action",
    header: "Action",
    cell: (row) => <ViewShiftButton row={row} />,
  },
];

function dateRange(applied: RetailAppliedDateFilter) {
  if (applied.kind === "single") {
    const day = applied.date.toString();
    return { from: day, to: day };
  }
  const ordered = applied.from.compare(applied.to) <= 0;
  return {
    from: (ordered ? applied.from : applied.to).toString(),
    to: (ordered ? applied.to : applied.from).toString(),
  };
}

export default function RetailShiftEndList() {
  const { selectedStore } = useStore();
  const [applied, setApplied] = useState<RetailAppliedDateFilter | null>(null);
  const range = useMemo(() => (applied ? dateRange(applied) : null), [applied]);
  const storeCode = selectedStore?.storeCode ?? "";
  const report = useQuery({
    queryKey: reportingQueryKey(storeCode, range),
    enabled: Boolean(storeCode && range),
    queryFn: async ({ signal }): Promise<ShiftListResponse> => {
      const params = new URLSearchParams({
        store_code: storeCode,
        from: range?.from ?? "",
        to: range?.to ?? "",
      });
      const response = await fetch(`/api/reporting/retail/shift-end?${params}`, {
        signal,
        cache: "no-store",
      });
      const body = (await response.json()) as ShiftListResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load shifts.");
      return body;
    },
  });

  const rows = useMemo(() => {
    const timezone = report.data?.timezone ?? selectedStore?.timezone ?? "UTC";
    return (report.data?.rows ?? []).map((row) => ({
      id: row.id,
      startLabel: formatShiftStamp(row.start_time, timezone),
      endLabel: formatShiftStamp(row.end_time, timezone),
      terminal: row.stationname,
      batch: row.batch_number,
      shift: row.shift,
      status: row.status,
    }));
  }, [report.data, selectedStore?.timezone]);

  const emptyMessage = !applied
    ? "Search a date to see shifts."
    : report.isFetching
      ? "Loading shifts."
      : "No shifts found for the selected date.";

  return (
    <div className="min-h-full pb-6">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">
          Shift End Report
        </h1>
        <Breadcrumbs
          dividerType="slash"
          items={[
            { href: "/", label: "Dashboard" },
            { href: "/report/shift-report", label: "Shift End Report" },
          ]}
        />
      </div>

      <div className="space-y-4 px-3 sm:px-5">
        <RetailReportDateFilter
          onSearch={setApplied}
          onReset={() => setApplied(null)}
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
          rows={applied ? rows : []}
          rowKey={(row) => row.id}
          recordLabel="shifts"
          emptyMessage={emptyMessage}
        />
      </div>
    </div>
  );
}
