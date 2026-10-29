"use client";

import { Button } from "@/components/tailgrids/core/button";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { cn } from "@/utils/cn";
import { useEffect, useMemo, useState } from "react";
import { LuRotateCcw } from "react-icons/lu";

const MONTH_LABELS = [
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
] as const;

type MonthOption = {
  id: string;
  label: string;
  monthIndex: number;
};

function monthId(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function yearOptions(now: Date) {
  const current = now.getFullYear();
  return [String(current), String(current - 1)];
}

function monthsForYear(year: number, now: Date): MonthOption[] {
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const lastIndex =
    year === currentYear ? currentMonthIndex : MONTH_LABELS.length - 1;
  return MONTH_LABELS.slice(0, lastIndex + 1).map((label, monthIndex) => ({
    id: monthId(year, monthIndex),
    label,
    monthIndex,
  }));
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-sm font-normal text-text-secondary">{label}</span>
      <Select aria-label={label} value={value} onChange={(key) => onChange(String(key))}>
        <SelectTrigger
          size="sm"
          className={cn(
            "h-9 min-w-32 border-card-border bg-card-surface-area text-sm",
          )}
        >
          <SelectValue />
          <SelectIndicator />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} id={option.id} textValue={option.label}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Shared Year + Month filter used by Month End and Monthly Sales and Tax. */
export function RetailMonthYearFilter({
  onSearch,
  onReset,
}: {
  onSearch: (monthId: string) => void;
  onReset: () => void;
}) {
  const now = useMemo(() => new Date(), []);
  const years = useMemo(() => yearOptions(now), [now]);
  const [draftYear, setDraftYear] = useState(years[0] ?? "");
  const [draftMonth, setDraftMonth] = useState("");

  const availableMonths = useMemo(
    () => (draftYear ? monthsForYear(Number(draftYear), now) : []),
    [draftYear, now],
  );

  useEffect(() => {
    if (!availableMonths.length) {
      setDraftMonth("");
      return;
    }
    setDraftMonth((current) =>
      availableMonths.some((month) => month.id === current)
        ? current
        : (availableMonths[availableMonths.length - 1]?.id ?? ""),
    );
  }, [availableMonths]);

  function changeYear(year: string) {
    setDraftYear(year);
    const months = monthsForYear(Number(year), now);
    setDraftMonth(months[months.length - 1]?.id ?? "");
  }

  function resetFilters() {
    const firstYear = years[0] ?? "";
    setDraftYear(firstYear);
    const months = firstYear ? monthsForYear(Number(firstYear), now) : [];
    setDraftMonth(months[months.length - 1]?.id ?? "");
    onReset();
  }

  return (
    <section className="retail-report-no-print rounded-xl border border-card-border bg-card-surface-area px-4 py-4 shadow-xs sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterSelect
          label="Year:"
          value={draftYear}
          options={years.map((year) => ({ id: year, label: year }))}
          onChange={changeYear}
        />
        <FilterSelect
          label="Month:"
          value={draftMonth}
          options={availableMonths}
          onChange={setDraftMonth}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          appearance="outline"
          className="h-9 px-4"
          disabled={!draftMonth}
          onPress={() => onSearch(draftMonth)}
        >
          Search Report
        </Button>
        <Button
          size="sm"
          appearance="outline"
          className="h-9 gap-1.5 px-4 [&>svg]:size-3.5"
          onPress={resetFilters}
        >
          <LuRotateCcw /> Reset
        </Button>
      </div>
    </section>
  );
}
