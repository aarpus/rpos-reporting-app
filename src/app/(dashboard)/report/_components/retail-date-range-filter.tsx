"use client";

import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  NavButton,
} from "@/components/tailgrids/core/calendar";
import { cn } from "@/utils/cn";
import {
  CalendarDate,
  endOfMonth,
  getLocalTimeZone,
  startOfMonth,
  today,
} from "@internationalized/date";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { I18nProvider, RangeCalendar, RangeCalendarStateContext, type DateRange } from "react-aria-components";
import { LuCalendar, LuChevronDown } from "react-icons/lu";

export type CalendarRange = { start: CalendarDate; end: CalendarDate };

const presets = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last-7", label: "Last 7 Days" },
  { id: "last-30", label: "Last 30 Days" },
  { id: "this-month", label: "This Month" },
  { id: "last-month", label: "Last Month" },
  { id: "custom", label: "Custom Range" },
] as const;

type PresetId = (typeof presets)[number]["id"];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function asCalendarDate(value: { year: number; month: number; day: number }) {
  return new CalendarDate(value.year, value.month, value.day);
}

function sameDay(left: CalendarDate, right: CalendarDate) {
  return left.compare(right) === 0;
}

function rangeFor(preset: Exclude<PresetId, "custom">, current: CalendarDate): CalendarRange {
  if (preset === "today") return { start: current, end: current };
  if (preset === "yesterday") {
    const day = current.subtract({ days: 1 });
    return { start: day, end: day };
  }
  if (preset === "last-7") return { start: current.subtract({ days: 6 }), end: current };
  if (preset === "last-30") return { start: current.subtract({ days: 29 }), end: current };
  if (preset === "this-month") return { start: startOfMonth(current), end: endOfMonth(current) };
  const previous = current.subtract({ months: 1 });
  return { start: startOfMonth(previous), end: endOfMonth(previous) };
}

function matchingPreset(range: CalendarRange, current: CalendarDate): PresetId {
  for (const preset of presets) {
    if (preset.id === "custom") continue;
    const candidate = rangeFor(preset.id, current);
    if (sameDay(candidate.start, range.start) && sameDay(candidate.end, range.end)) return preset.id;
  }
  return "custom";
}

function dashDate(date: CalendarDate) {
  return `${months[date.month - 1]}-${String(date.day).padStart(2, "0")}-${date.year}`;
}

function slashDate(date: CalendarDate) {
  return `${String(date.month).padStart(2, "0")}/${String(date.day).padStart(2, "0")}/${date.year}`;
}

function ordered(range: CalendarRange): CalendarRange {
  return range.start.compare(range.end) <= 0 ? range : { start: range.end, end: range.start };
}

const monthTitle = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

function MonthTitle({ offsetMonths }: { offsetMonths: number }) {
  const state = useContext(RangeCalendarStateContext);
  if (!state) return null;
  const month = state.visibleRange.start.add({ months: offsetMonths });
  return (
    <span className="flex-1 text-center text-xs font-medium text-text-primary">
      {monthTitle.format(month.toDate(getLocalTimeZone()))}
    </span>
  );
}

export function RetailDateRangeFilter({
  value,
  onChange,
}: {
  value: CalendarRange | null;
  onChange: (value: CalendarRange) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState<CalendarRange | null>(value);
  const [active, setActive] = useState<PresetId | null>(value ? matchingPreset(value, today(getLocalTimeZone())) : null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openMenu() {
    const current = today(getLocalTimeZone());
    setDraft(value);
    setActive(value ? matchingPreset(value, current) : null);
    setCustom(value ? matchingPreset(value, current) === "custom" : false);
    setOpen((currentOpen) => !currentOpen);
  }

  function commit(range: CalendarRange) {
    onChange(ordered(range));
    setOpen(false);
    setCustom(false);
  }

  function choosePreset(preset: PresetId) {
    const current = today(getLocalTimeZone());
    if (preset === "custom") {
      setCustom(true);
      setActive("custom");
      setDraft((existing) => existing ?? { start: current, end: current });
      return;
    }
    const next = rangeFor(preset, current);
    setDraft(next);
    setActive(preset);
    if (!custom) commit(next);
  }

  function apply() {
    if (draft) commit(draft);
    else setOpen(false);
  }

  const label = value ? `${dashDate(value.start)} - ${dashDate(value.end)}` : "Start Date - End Date";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={openMenu}
        className={cn(
          "flex h-9 min-w-56 items-center gap-2 rounded-md border bg-card-surface-area px-3 text-left text-sm outline-none transition focus:ring-4 focus:ring-primary-500/15",
          value ? "border-primary-500 text-text-primary" : "border-card-border text-text-tertiary",
        )}
      >
        <LuCalendar className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
        <LuChevronDown className="ml-auto size-4 shrink-0" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          role="dialog"
          aria-label="Date from to"
          className={cn(
            "absolute top-full z-50 mt-1 flex items-start rounded-lg border border-card-border bg-card-surface-area p-2 shadow-lg",
            custom ? "right-0" : "left-0",
          )}
        >
          {custom && draft && (
            <div className="border-r border-card-border pr-2">
              <div className="mb-2 flex gap-2">
                <input
                  readOnly
                  aria-label="Range start"
                  value={slashDate(draft.start)}
                  className="h-8 w-28 rounded-md border border-card-border bg-card-surface-area px-2 text-xs text-text-primary"
                />
                <input
                  readOnly
                  aria-label="Range end"
                  value={slashDate(draft.end)}
                  className="h-8 w-28 rounded-md border border-card-border bg-card-surface-area px-2 text-xs text-text-primary"
                />
              </div>
              <I18nProvider locale="en-US">
                <RangeCalendar
                  aria-label="Custom date range"
                  className="w-fit"
                  visibleDuration={{ months: 2 }}
                  value={draft}
                  onChange={(next: DateRange | null) => {
                    if (!next?.start || !next.end) return;
                    setDraft(ordered({ start: asCalendarDate(next.start), end: asCalendarDate(next.end) }));
                    setActive("custom");
                  }}
                >
                  <div className="flex gap-3">
                    <div>
                      <CalendarHeader className="mb-1">
                        <NavButton slot="previous" className="size-7" />
                        <MonthTitle offsetMonths={0} />
                        <span className="size-7" />
                      </CalendarHeader>
                      <CalendarGrid>
                        <CalendarGridHeader className="pb-1 text-[0.65rem]" />
                        <CalendarGridBody>
                          {(date) => <CalendarCell date={date} className="size-7 text-xs sm:size-7" />}
                        </CalendarGridBody>
                      </CalendarGrid>
                    </div>
                    <div>
                      <CalendarHeader className="mb-1">
                        <span className="size-7" />
                        <MonthTitle offsetMonths={1} />
                        <NavButton slot="next" className="size-7" />
                      </CalendarHeader>
                      <CalendarGrid offset={{ months: 1 }}>
                        <CalendarGridHeader className="pb-1 text-[0.65rem]" />
                        <CalendarGridBody>
                          {(date) => <CalendarCell date={date} className="size-7 text-xs sm:size-7" />}
                        </CalendarGridBody>
                      </CalendarGrid>
                    </div>
                  </div>
                </RangeCalendar>
              </I18nProvider>
            </div>
          )}

          <div className="flex w-40 flex-col gap-1.5">
            {presets.map((preset) => {
              const selected = active === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => choosePreset(preset.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-left text-sm",
                    selected
                      ? "bg-text-primary text-background-50"
                      : "bg-background-gray-secondary text-text-primary hover:bg-background-gray-tertiary",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
            <div className="mt-1 flex gap-1.5">
              <button
                type="button"
                onClick={apply}
                className="flex-1 rounded-md bg-success-500 px-3 py-1.5 text-sm font-medium text-white-100"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-background-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
