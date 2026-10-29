"use client";

import { Button } from "@/components/tailgrids/core/button";
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  NavButton,
} from "@/components/tailgrids/core/calendar";
import {
  DatePicker,
  DatePickerGroup,
  DatePickerPopover,
} from "@/components/tailgrids/core/date-picker";
import { cn } from "@/utils/cn";
import {
  CalendarDate,
  getLocalTimeZone,
  type DateValue,
} from "@internationalized/date";
import { useContext, useState, type ContextType, type ReactNode } from "react";
import { Button as AriaButton, CalendarStateContext } from "react-aria-components";
import { LuRotateCcw } from "react-icons/lu";
import {
  RetailDateRangeFilter,
  type CalendarRange,
} from "./retail-date-range-filter";

export type { CalendarRange };

export type RetailAppliedDateFilter =
  | { kind: "single"; date: CalendarDate }
  | { kind: "range"; from: CalendarDate; to: CalendarDate };

const dayLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const fieldClass =
  "flex h-9 min-w-44 items-center gap-2 rounded-md border bg-card-surface-area px-3 text-left text-sm outline-none transition focus:ring-4 focus:ring-primary-500/15";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const yearStart = 2000;
const yearEnd = new Date().getFullYear() + 5;

type CalendarPanel = "days" | "months" | "years";

function focusCalendarDate(
  state: NonNullable<ContextType<typeof CalendarStateContext>>,
  month: number,
  year: number,
) {
  const focused = state.focusedDate;
  const next = focused.set({ day: 1, month, year });
  const maxDay = next.calendar.getDaysInMonth(next);
  state.setFocusedDate(next.set({ day: Math.min(focused.day, maxDay) }));
}

function MonthYearControls({
  panel,
  onPanelChange,
}: {
  panel: CalendarPanel;
  onPanelChange: (panel: CalendarPanel) => void;
}) {
  const state = useContext(CalendarStateContext);
  if (!state) return null;
  const month = monthNames[state.focusedDate.month - 1]?.slice(0, 3);
  const year = state.focusedDate.year;

  return (
    <div className="flex flex-1 items-center justify-center gap-1">
      <button
        type="button"
        aria-label="Select month"
        aria-pressed={panel === "months"}
        className="rounded-md px-2 py-1 text-sm font-medium text-text-primary hover:bg-background-gray-secondary"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onPanelChange(panel === "months" ? "days" : "months");
        }}
      >
        {month}
      </button>
      <button
        type="button"
        aria-label="Select year"
        aria-pressed={panel === "years"}
        className="rounded-md px-2 py-1 text-sm font-medium text-text-primary hover:bg-background-gray-secondary"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onPanelChange(panel === "years" ? "days" : "years");
        }}
      >
        {year}
      </button>
    </div>
  );
}

function MonthPicker({ onDone }: { onDone: () => void }) {
  const state = useContext(CalendarStateContext);
  if (!state) return null;

  return (
    <div className="grid grid-cols-3 gap-1" role="listbox" aria-label="Month">
      {monthNames.map((name, index) => {
        const month = index + 1;
        const selected = state.focusedDate.month === month;
        return (
          <button
            key={name}
            type="button"
            role="option"
            aria-selected={selected}
            className={cn(
              "rounded-md px-2 py-2 text-xs font-medium",
              selected
                ? "bg-primary-500 text-white-100"
                : "text-text-secondary hover:bg-background-gray-secondary",
            )}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              focusCalendarDate(state, month, state.focusedDate.year);
              onDone();
            }}
          >
            {name.slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
}

function YearPicker({ onDone }: { onDone: () => void }) {
  const state = useContext(CalendarStateContext);
  if (!state) return null;
  const years = Array.from(
    { length: yearEnd - yearStart + 1 },
    (_, index) => yearStart + index,
  );

  return (
    <div
      className="grid max-h-52 grid-cols-3 gap-1 overflow-y-auto"
      role="listbox"
      aria-label="Year"
    >
      {years.map((year) => {
        const selected = state.focusedDate.year === year;
        return (
          <button
            key={year}
            type="button"
            role="option"
            aria-selected={selected}
            className={cn(
              "rounded-md px-2 py-2 text-xs font-medium tabular-nums",
              selected
                ? "bg-primary-500 text-white-100"
                : "text-text-secondary hover:bg-background-gray-secondary",
            )}
            ref={
              selected
                ? (node) => node?.scrollIntoView({ block: "nearest" })
                : undefined
            }
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              focusCalendarDate(state, state.focusedDate.month, year);
              onDone();
            }}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
}

function formatDay(value: DateValue) {
  return dayLabel.format(
    new CalendarDate(value.year, value.month, value.day).toDate(
      getLocalTimeZone(),
    ),
  );
}

export function RetailReportDateFilter({
  onSearch,
  onReset,
  extraActions,
  extraFields,
}: {
  onSearch: (filter: RetailAppliedDateFilter) => void;
  onReset: () => void;
  extraActions?: ReactNode;
  extraFields?: ReactNode;
}) {
  const [singleDate, setSingleDate] = useState<CalendarDate | null>(null);
  const [range, setRange] = useState<CalendarRange | null>(null);
  const [singleOpen, setSingleOpen] = useState(false);
  const [calendarPanel, setCalendarPanel] = useState<CalendarPanel>("days");
  const [filterKey, setFilterKey] = useState(0);

  const canSearch = singleDate !== null || range !== null;

  function chooseSingle(value: CalendarDate | null) {
    setSingleDate(value);
    if (value) setRange(null);
  }

  function search() {
    if (singleDate) {
      onSearch({ kind: "single", date: singleDate });
      return;
    }
    if (range) {
      onSearch({ kind: "range", from: range.start, to: range.end });
    }
  }

  function reset() {
    setSingleDate(null);
    setRange(null);
    setSingleOpen(false);
    setCalendarPanel("days");
    setFilterKey((value) => value + 1);
    onReset();
  }

  return (
    <section className="rounded-xl border border-card-border bg-card-surface-area px-4 py-4 shadow-xs sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-normal text-text-secondary">
              Single Date:
            </span>
            <DatePicker
              aria-label="Single date"
              className="w-auto"
              value={singleDate}
              onChange={chooseSingle}
              isOpen={singleOpen}
              onOpenChange={(open) => {
                setSingleOpen(open);
                if (!open) setCalendarPanel("days");
              }}
            >
              <DatePickerGroup className="w-fit">
                <AriaButton
                  className={cn(
                    fieldClass,
                    "w-44",
                    singleDate
                      ? "border-primary-500 text-text-primary"
                      : "border-card-border text-text-tertiary",
                  )}
                >
                  {singleDate ? formatDay(singleDate) : "Single Date"}
                </AriaButton>
              </DatePickerGroup>
              <DatePickerPopover className="z-50">
                <Calendar
                  aria-label="Single date"
                  className="w-fit rounded-2xl p-3"
                >
                  <CalendarHeader className="mb-2">
                    <NavButton slot="previous" className="size-8" />
                    <MonthYearControls
                      panel={calendarPanel}
                      onPanelChange={setCalendarPanel}
                    />
                    <NavButton slot="next" className="size-8" />
                  </CalendarHeader>
                  {calendarPanel === "months" ? (
                    <MonthPicker onDone={() => setCalendarPanel("days")} />
                  ) : calendarPanel === "years" ? (
                    <YearPicker onDone={() => setCalendarPanel("days")} />
                  ) : (
                    <CalendarGrid>
                      <CalendarGridHeader className="pb-1 text-[0.65rem]" />
                      <CalendarGridBody>
                        {(date) => (
                          <CalendarCell
                            date={date}
                            className="size-8 text-xs sm:size-8"
                          />
                        )}
                      </CalendarGridBody>
                    </CalendarGrid>
                  )}
                </Calendar>
              </DatePickerPopover>
            </DatePicker>
          </div>
          <button
            type="button"
            className="w-fit text-xs font-normal text-info-500 hover:underline"
            onClick={() => setSingleOpen(true)}
          >
            Single Date filter
          </button>
        </div>

        <div className="flex items-center gap-3 sm:pt-0">
          <span className="text-sm font-medium text-text-secondary">
            Date From-To:
          </span>
          <RetailDateRangeFilter
            key={filterKey}
            value={range}
            onChange={(next) => {
              setRange(next);
              setSingleDate(null);
            }}
          />
        </div>
        {extraFields}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          appearance="outline"
          className="h-9 px-4"
          disabled={!canSearch}
          onPress={search}
        >
          Search Report
        </Button>
        <Button
          size="sm"
          appearance="outline"
          className="h-9 gap-1.5 px-4 [&>svg]:size-3.5"
          onPress={reset}
        >
          <LuRotateCcw /> Reset
        </Button>
        {extraActions}
      </div>
    </section>
  );
}
