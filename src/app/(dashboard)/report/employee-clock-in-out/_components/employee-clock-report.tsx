"use client";

import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import {
  Dialog,
  DialogBody,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/tailgrids/core/tooltip";
import { cn } from "@/utils/cn";
import {
  CalendarDate,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "@internationalized/date";
import { useMemo, useState } from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuClock3,
  LuCoffee,
  LuDollarSign,
  LuEye,
  LuLogOut,
  LuRotateCcw,
  LuUserCheck,
  LuUsers,
} from "react-icons/lu";
import { CompactDatePicker, ReportCard } from "../../_components/report-ui";
import {
  datePresets,
  employeeOptions,
  groupByOptions,
  parseDateKey,
  reportDate,
  reportTypeOptions,
  sessions,
  type ClockSession,
  type DatePreset,
} from "./data";

type FilterState = {
  preset: DatePreset;
  from: CalendarDate;
  to: CalendarDate;
  employee: string;
  reportType: string;
  groupBy: string;
};

const defaultFilters: FilterState = {
  preset: "today",
  from: reportDate,
  to: reportDate,
  employee: "All Employees",
  reportType: "Date",
  groupBy: "Batchwise",
};

function rangeForPreset(preset: DatePreset) {
  if (preset === "today") return { from: reportDate, to: reportDate };
  if (preset === "yesterday") {
    const yesterday = reportDate.subtract({ days: 1 });
    return { from: yesterday, to: yesterday };
  }
  if (preset === "this-week") {
    return {
      from: startOfWeek(reportDate, "en-GB"),
      to: endOfWeek(reportDate, "en-GB"),
    };
  }
  if (preset === "last-week") {
    const lastWeek = reportDate.subtract({ weeks: 1 });
    return {
      from: startOfWeek(lastWeek, "en-GB"),
      to: endOfWeek(lastWeek, "en-GB"),
    };
  }
  if (preset === "this-month") {
    return { from: startOfMonth(reportDate), to: endOfMonth(reportDate) };
  }
  return null;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-1 sm:w-44">
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
            <SelectItem key={option} id={option} textValue={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function durationMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatDuration(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function StatusBadge({ status }: { status: ClockSession["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        status === "Clock In"
          ? "bg-badge-success-background text-badge-success-text"
          : "bg-background-gray-secondary_alt_2 text-text-secondary",
      )}
    >
      {status}
    </span>
  );
}

function SessionDialog({
  session,
  onOpenChange,
}: {
  session: ClockSession | null;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const breakRows = Array.from(
    { length: 6 },
    (_, index) => session?.breaks[index],
  );

  return (
    <>
      {session && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px]"
          aria-hidden
        />
      )}
      <Dialog
        isOpen={Boolean(session)}
        onOpenChange={onOpenChange}
        className="z-[60] max-h-[calc(100vh-2rem)] max-w-128 overflow-y-auto p-0"
      >
        {session && (
          <>
            <DialogHeader className="border-b border-card-border px-5 py-4 pr-14">
              <DialogTitle>Clock session detail</DialogTitle>
              <p className="text-xs text-text-tertiary">{session.dateLabel}</p>
            </DialogHeader>
            <DialogBody className="space-y-4 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">
                    {session.employee}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-text-tertiary">
                    Work date
                  </p>
                </div>
                <StatusBadge status={session.status} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-card-border bg-background-gray-secondary_alt_2 px-3 py-2">
                  <p className="text-[10px] text-text-tertiary">Clock in</p>
                  <p className="mt-0.5 text-base font-semibold tabular-nums text-text-primary">
                    {session.clockIn}
                  </p>
                </div>
                <div className="rounded-lg border border-card-border bg-background-gray-secondary_alt_2 px-3 py-2">
                  <p className="text-[10px] text-text-tertiary">Clock out</p>
                  <p className="mt-0.5 text-base font-semibold tabular-nums text-text-primary">
                    {session.clockOut}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-text-secondary">
                  Breaks (HH:MM)
                </p>
                <div className="overflow-hidden rounded-lg border border-card-border">
                  <table className="w-full text-xs">
                    <thead className="bg-background-gray-secondary_alt_2 text-text-tertiary">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-semibold">
                          #
                        </th>
                        <th className="px-2 py-1.5 text-left font-semibold">
                          Start
                        </th>
                        <th className="px-2 py-1.5 text-left font-semibold">
                          End
                        </th>
                        <th className="px-2 py-1.5 text-right font-semibold">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border text-text-secondary">
                      {breakRows.map((item, index) => (
                        <tr key={index}>
                          <td className="px-2 py-1.5">{index + 1}</td>
                          <td className="px-2 py-1.5 tabular-nums">
                            {item?.start ?? "-"}
                          </td>
                          <td className="px-2 py-1.5 tabular-nums">
                            {item?.end ?? "-"}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {item?.duration ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-card-border pt-4">
                <div className="rounded-lg border border-card-border px-3 py-2">
                  <p className="text-[10px] text-text-tertiary">Total work</p>
                  <p className="mt-0.5 text-base font-semibold tabular-nums text-success-500">
                    {session.totalWork}
                  </p>
                </div>
                <div className="rounded-lg border border-card-border px-3 py-2">
                  <p className="text-[10px] text-text-tertiary">Total break</p>
                  <p className="mt-0.5 text-base font-semibold tabular-nums text-warning-500">
                    {session.totalBreak}
                  </p>
                </div>
              </div>
            </DialogBody>
          </>
        )}
      </Dialog>
    </>
  );
}

export default function EmployeeClockReport() {
  const [draft, setDraft] = useState<FilterState>(defaultFilters);
  const [applied, setApplied] = useState<FilterState | null>(defaultFilters);
  const [selectedSession, setSelectedSession] = useState<ClockSession | null>(
    null,
  );
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    if (!applied) return [];
    return sessions.filter((session) => {
      const date = parseDateKey(session.dateKey);
      const inRange =
        date.compare(applied.from) >= 0 && date.compare(applied.to) <= 0;
      const employeeMatch =
        applied.employee === "All Employees" ||
        applied.employee === session.employee;
      return inRange && employeeMatch;
    });
  }, [applied]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const fromRow = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRow = Math.min(currentPage * pageSize, rows.length);
  const uniqueEmployees = new Set(rows.map((row) => row.employee)).size;
  const activeEmployees = new Set(
    rows.filter((row) => row.status === "Clock In").map((row) => row.employee),
  ).size;
  const totalWork = formatDuration(
    rows.reduce((sum, row) => sum + durationMinutes(row.totalWork), 0),
  );
  const totalTip = rows.reduce((sum, row) => sum + row.totalTip, 0);

  function applyPreset(preset: DatePreset) {
    const range = rangeForPreset(preset);
    setDraft((current) => ({ ...current, preset, ...(range ?? {}) }));
  }

  function generateReport() {
    setApplied(draft);
    setPage(1);
  }

  const stats = [
    {
      label: "Total employees",
      value: String(uniqueEmployees),
      icon: LuUsers,
      accentClass: "border-t-primary-500",
      iconClass: "bg-badge-primary-background text-badge-primary-icon-color",
    },
    {
      label: "Active now",
      value: String(activeEmployees),
      icon: LuUserCheck,
      accentClass: "border-t-success-500",
      iconClass: "bg-badge-success-background text-badge-success-icon-color",
    },
    {
      label: "On break",
      value: "0",
      icon: LuCoffee,
      accentClass: "border-t-orange-500",
      iconClass: "bg-badge-orange-background text-badge-orange-icon-color",
    },
    {
      label: "Clocked out",
      value: String(
        rows.filter((row) => row.status === "Clocked Out").length,
      ),
      icon: LuLogOut,
      accentClass: "border-t-error-500",
      iconClass: "bg-badge-error-background text-badge-error-icon-color",
    },
    {
      label: "Total work hours",
      value: totalWork,
      icon: LuClock3,
      accentClass: "border-t-info-500",
      iconClass: "bg-badge-sky-background text-badge-sky-icon-color",
    },
    {
      label: "Total tip",
      value: `$${totalTip.toFixed(2)}`,
      icon: LuDollarSign,
      accentClass: "border-t-violet-500",
      iconClass: "bg-badge-violet-background text-badge-violet-icon-color",
    },
  ];

  return (
    <div className="mt-2 space-y-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-3 sm:space-y-2.5 lg:px-4">
      <div>
        <h1 className="text-lg leading-6 font-semibold text-text-primary sm:text-xl">
          Employee Clock-In / Clock-Out
        </h1>
        <p className="text-[11px] text-text-tertiary">
          Review employee attendance, work time and break activity
        </p>
      </div>

      <ReportCard title="Filters">
        <div className="space-y-3 px-2 py-2.5 sm:px-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex w-full flex-col gap-1 sm:w-44">
              <span className="text-[11px] font-medium text-text-secondary">
                Date filter
              </span>
              <Select
                aria-label="Date filter"
                value={draft.preset}
                onChange={(key) => applyPreset(key as DatePreset)}
              >
                <SelectTrigger size="sm" className="h-8 py-1 text-xs">
                  <SelectValue />
                  <SelectIndicator />
                </SelectTrigger>
                <SelectContent>
                  {datePresets.map((preset) => (
                    <SelectItem
                      key={preset.id}
                      id={preset.id}
                      textValue={preset.label}
                    >
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CompactDatePicker
              label="From date"
              value={draft.from}
              onChange={(value) =>
                value &&
                setDraft((current) => ({
                  ...current,
                  preset: "custom",
                  from: value,
                }))
              }
            />
            <CompactDatePicker
              label="To date"
              value={draft.to}
              onChange={(value) =>
                value &&
                setDraft((current) => ({
                  ...current,
                  preset: "custom",
                  to: value,
                }))
              }
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <FilterSelect
              label="Employee"
              value={draft.employee}
              options={employeeOptions}
              onChange={(employee) =>
                setDraft((current) => ({ ...current, employee }))
              }
            />
            <FilterSelect
              label="Report type"
              value={draft.reportType}
              options={reportTypeOptions}
              onChange={(reportType) =>
                setDraft((current) => ({ ...current, reportType }))
              }
            />
            <FilterSelect
              label="Group by"
              value={draft.groupBy}
              options={groupByOptions}
              onChange={(groupBy) =>
                setDraft((current) => ({ ...current, groupBy }))
              }
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              className="h-8 px-3 py-1 text-xs"
              onPress={generateReport}
            >
              Generate report
            </Button>
            <Button
              size="sm"
              appearance="outline"
              className="h-8 gap-1.5 px-3 py-1 text-xs [&>svg]:size-3.5"
              onPress={() => {
                setDraft(defaultFilters);
                setApplied(defaultFilters);
                setPage(1);
              }}
            >
              <LuRotateCcw /> Reset filter
            </Button>
          </div>
        </div>
      </ReportCard>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={cn("border-t-2 p-3", stat.accentClass)}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    stat.iconClass,
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] text-text-tertiary">
                    {stat.label}
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-text-primary">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden p-0">
        {rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-text-tertiary">
            No clock sessions found for the selected filters.
          </p>
        ) : (
          <>
            <TableRoot className="w-full min-w-[62rem] rounded-none border-none">
              <TableHeader className="bg-background-gray-secondary_alt_2">
                <TableRow className="[&_th]:border-t">
                  {[
                    "#",
                    "Date",
                    "Employee",
                    "Status",
                    "Clock in",
                    "Clock out",
                    "Break count",
                    "Total break",
                    "Total work",
                    "Total tip",
                    "Action",
                  ].map((label) => (
                    <TableHead
                      key={label}
                      className="px-3 py-2.5 text-xs font-semibold whitespace-nowrap text-text-secondary"
                    >
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="px-3 py-2.5 text-xs tabular-nums">
                      {row.id}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs whitespace-nowrap">
                      {row.dateLabel}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs font-medium whitespace-nowrap text-text-primary">
                      {row.employee}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs tabular-nums">
                      {row.clockIn}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs tabular-nums">
                      {row.clockOut}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs tabular-nums">
                      {row.breaks.length}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs tabular-nums">
                      {row.totalBreak}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs font-medium tabular-nums text-text-primary">
                      {row.totalWork}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs tabular-nums">
                      ${row.totalTip.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label={`View ${row.employee} clock session`}
                            iconOnly
                            size="xs"
                            appearance="outline"
                            onPress={() => setSelectedSession(row)}
                          >
                            <LuEye />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="block">
                          <p>View clock session</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>

            <div className="flex flex-col gap-3 border-t border-card-border px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-center text-xs text-text-tertiary sm:text-left">
                Showing {fromRow} to {toRow} of {rows.length} clock sessions
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-center gap-2">
                  <span className="whitespace-nowrap text-xs text-text-secondary">
                    Rows per page:
                  </span>
                  <Select
                    aria-label="Rows per page"
                    value={String(pageSize)}
                    onChange={(value) => {
                      setPage(1);
                      setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger size="sm" className="h-8 w-20 py-1 text-xs">
                      <SelectValue />
                      <SelectIndicator />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50].map((value) => (
                        <SelectItem
                          key={value}
                          id={String(value)}
                          textValue={String(value)}
                        >
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <nav
                  aria-label="Clock session table pagination"
                  className="flex items-center justify-center gap-1.5"
                >
                  <Button
                    size="xs"
                    appearance="outline"
                    iconOnly
                    className="size-8"
                    aria-label="Previous page"
                    disabled={currentPage <= 1}
                    onPress={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    <LuChevronLeft />
                  </Button>
                  <span className="min-w-20 text-center text-xs font-medium tabular-nums text-text-secondary">
                    Page {currentPage} of {pageCount}
                  </span>
                  <Button
                    size="xs"
                    appearance="outline"
                    iconOnly
                    className="size-8"
                    aria-label="Next page"
                    disabled={currentPage >= pageCount}
                    onPress={() =>
                      setPage((value) => Math.min(pageCount, value + 1))
                    }
                  >
                    <LuChevronRight />
                  </Button>
                </nav>
              </div>
            </div>
          </>
        )}
      </Card>

      <SessionDialog
        session={selectedSession}
        onOpenChange={(isOpen) => !isOpen && setSelectedSession(null)}
      />
    </div>
  );
}
