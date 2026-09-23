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
import Link from "next/link";
import { useMemo, useState } from "react";
import { LuEye, LuRotateCcw } from "react-icons/lu";
import { CompactDatePicker, ReportCard } from "../../_components/report-ui";
import {
  datePresets,
  defaultFromDate,
  defaultPreset,
  defaultStation,
  defaultToDate,
  parseDateKey,
  shifts,
  stations,
  type DatePreset,
  type Station,
} from "./data";

const today = new CalendarDate(2026, 9, 14);

function rangeForPreset(preset: DatePreset) {
  if (preset === "today") {
    return { from: today, to: today };
  }
  if (preset === "yesterday") {
    const yesterday = today.subtract({ days: 1 });
    return { from: yesterday, to: yesterday };
  }
  if (preset === "this-week") {
    return { from: startOfWeek(today, "en-GB"), to: endOfWeek(today, "en-GB") };
  }
  if (preset === "last-week") {
    const lastWeek = today.subtract({ weeks: 1 });
    return {
      from: startOfWeek(lastWeek, "en-GB"),
      to: endOfWeek(lastWeek, "en-GB"),
    };
  }
  if (preset === "this-month") {
    return { from: startOfMonth(today), to: endOfMonth(today) };
  }
  return { from: defaultFromDate, to: defaultToDate };
}

type FilterState = {
  preset: DatePreset;
  from: CalendarDate;
  to: CalendarDate;
  station: Station;
};

const defaultFilters: FilterState = {
  preset: defaultPreset,
  from: defaultFromDate,
  to: defaultToDate,
  station: defaultStation,
};

export default function ShiftReportList() {
  const [draft, setDraft] = useState<FilterState>(defaultFilters);
  const [applied, setApplied] = useState<FilterState | null>(null);

  const rows = useMemo(() => {
    if (!applied) return [];
    return shifts.filter((shift) => {
      const date = parseDateKey(shift.dateKey);
      const inRange =
        date.compare(applied.from) >= 0 && date.compare(applied.to) <= 0;
      const stationMatch =
        applied.station === "All" || shift.station === applied.station;
      return inRange && stationMatch;
    });
  }, [applied]);

  function applyPreset(preset: DatePreset) {
    if (preset === "custom") {
      setDraft((current) => ({ ...current, preset }));
      return;
    }
    const range = rangeForPreset(preset);
    setDraft((current) => ({ ...current, preset, ...range }));
  }

  return (
    <div className="mt-2 space-y-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:mt-3 sm:space-y-2.5 lg:px-4">
      <div className="flex flex-col items-start gap-1.5 text-center">
        <h1 className="text-lg text-start leading-6 font-semibold text-text-primary sm:text-xl">
          Shift Report
        </h1>
      </div>

      <ReportCard title="Filters">
        <div className="space-y-2 px-2 py-2 sm:px-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex w-full flex-col gap-1 sm:w-40">
              <span className="text-[11px] font-medium text-text-secondary">
                Date filter
              </span>
              <Select
                aria-label="Date filter"
                value={draft.preset}
                onChange={(value) => applyPreset(value as DatePreset)}
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
              onChange={(value) => {
                if (!value) return;
                setDraft((current) => ({
                  ...current,
                  preset: "custom",
                  from: value,
                }));
              }}
            />
            <CompactDatePicker
              label="To date"
              value={draft.to}
              onChange={(value) => {
                if (!value) return;
                setDraft((current) => ({
                  ...current,
                  preset: "custom",
                  to: value,
                }));
              }}
            />
          </div>

          <div>
            <p className="mb-1 text-[11px] font-medium text-text-secondary">
              Station
            </p>
            <div className="flex flex-wrap gap-1.5">
              {stations.map((station) => {
                const selected = draft.station === station;
                return (
                  <button
                    key={station}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({ ...current, station }))
                    }
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                      selected
                        ? "border-primary-500 bg-primary-500 text-white-100"
                        : "border-card-border bg-card-surface-area text-text-secondary hover:border-primary-500 hover:text-text-primary",
                    )}
                  >
                    {station}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              className="h-8 gap-1.5 px-3 py-1 text-xs"
              onPress={() => setApplied(draft)}
            >
              Generate report
            </Button>
            <Button
              size="sm"
              variant="primary"
              appearance="outline"
              className="h-8 gap-1.5 px-3 py-1 text-xs [&>svg]:size-3.5"
              onPress={() => {
                setDraft(defaultFilters);
                setApplied(null);
              }}
            >
              <LuRotateCcw />
              Reset filter
            </Button>
          </div>
        </div>
      </ReportCard>

      {applied && (
        <Card className="overflow-hidden p-0">
          {rows.length === 0 ? (
            <p className="px-6 py-6 text-center text-sm text-text-tertiary">
              No shifts found for the selected filters.
            </p>
          ) : (
            <TableRoot className="w-full rounded-none border-none">
              <TableHeader>
                <TableRow className="[&_th]:border-t">
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Shift #
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold whitespace-nowrap text-text-secondary">
                    Shift date
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    Station
                  </TableHead>
                  <TableHead className="px-6 py-2.5 text-xs leading-4 font-semibold text-text-secondary">
                    <div className="flex items-center justify-center">
                      Action
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="[&_td]:border-none">
                    <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium whitespace-nowrap text-text-primary">
                      {row.shiftNo}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm leading-5 whitespace-nowrap text-text-secondary">
                      {row.dateLabel}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm leading-5 font-medium whitespace-nowrap text-text-primary">
                      {row.station}
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/report/shift-report/${row.id}`}
                              aria-label="View shift document reports"
                              className="inline-flex size-8 items-center justify-center rounded-lg bg-badge-primary-background text-badge-primary-icon-color transition hover:bg-primary-100"
                            >
                              <LuEye className="size-4" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent className="block">
                            <p>View shift document reports</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          )}
        </Card>
      )}
    </div>
  );
}
