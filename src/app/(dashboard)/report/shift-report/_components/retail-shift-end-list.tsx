"use client";

import { Breadcrumbs } from "@/components/tailgrids/core/breadcrumbs";
import { Button } from "@/components/tailgrids/core/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/tailgrids/core/tooltip";
import { cn } from "@/utils/cn";
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
import { retailShifts, type RetailShiftRow } from "./retail-shift-data";

const noRows: RetailShiftRow[] = [];

function overlaps(row: RetailShiftRow, from: RetailShiftRow["start"], to: RetailShiftRow["start"]) {
  return row.start.compare(to) <= 0 && row.end.compare(from) >= 0;
}

function StatusBadge({ status }: { status: RetailShiftRow["status"] }) {
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

function ViewShiftButton({ row }: { row: RetailShiftRow }) {
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

const columns: RetailReportColumn<RetailShiftRow>[] = [
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

export default function RetailShiftEndList() {
  const [applied, setApplied] = useState<RetailAppliedDateFilter | null>(null);

  const rows = useMemo(() => {
    if (!applied) return noRows;
    if (applied.kind === "single") {
      return retailShifts.filter((row) =>
        overlaps(row, applied.date, applied.date),
      );
    }
    const from =
      applied.from.compare(applied.to) <= 0 ? applied.from : applied.to;
    const to =
      applied.from.compare(applied.to) <= 0 ? applied.to : applied.from;
    return retailShifts.filter((row) => overlaps(row, from, to));
  }, [applied]);

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
        <RetailReportTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          recordLabel="shifts"
          emptyMessage="No shifts found for the selected date. Preview shifts run from Jul 14, 2025 through Jul 16, 2025."
        />
      </div>
    </div>
  );
}
