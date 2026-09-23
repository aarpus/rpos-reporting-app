"use client";

import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeading,
  NavButton,
} from "@/components/tailgrids/core/calendar";
import { DateInput, DateSegment } from "@/components/tailgrids/core/date-field";
import {
  DatePicker,
  DatePickerGroup,
  DatePickerPopover,
  DatePickerTrigger,
} from "@/components/tailgrids/core/date-picker";
import { FieldLabel } from "@/components/tailgrids/core/field";
import { cn } from "@/utils/cn";
import { CalendarDate } from "@internationalized/date";
import { Calendar as CalendarIcon } from "@tailgrids/icons";
import type { ReactNode } from "react";

export function money(value: number) {
  const formatted = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function pct(value: number) {
  return `${value.toFixed(2)}%`;
}

export function amountClass(value: number, strong = false) {
  return cn(
    "tabular-nums",
    strong && "font-semibold",
    value < 0 ? "text-error-500" : "text-text-primary",
  );
}

export function ReportCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-card-border bg-card-surface-area",
        className,
      )}
    >
      <h2 className="border-b border-card-border bg-background-gray-secondary_alt_2 px-2 py-1 text-[10px] font-semibold tracking-wide text-text-tertiary uppercase sm:px-2.5 sm:text-[11px]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DenseTable({
  minWidth,
  head,
  headerClassName,
  children,
}: {
  minWidth?: string;
  head: { label: string; align?: "left" | "right" }[];
  headerClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-left text-[11px] leading-4"
        style={minWidth ? { minWidth } : undefined}
      >
        <thead
          className={cn("text-[10px] text-text-secondary", headerClassName)}
        >
          <tr>
            {head.map((col) => (
              <th
                key={col.label}
                className={cn(
                  "border-b border-card-border bg-background-gray-secondary_alt_2 px-1.5 py-1.5 font-semibold whitespace-nowrap text-text-tertiary",
                  col.align === "right" && "text-right",
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border text-text-secondary">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  align = "left",
  className,
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-1.5 py-1 whitespace-nowrap",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function TotalRow({ children }: { children: ReactNode }) {
  return (
    <tr className="bg-background-gray-secondary_alt_2 font-semibold text-text-primary">
      {children}
    </tr>
  );
}

export function EmptyState({ label = "No records" }: { label?: string }) {
  return <p className="px-2 py-2 text-[11px] text-text-tertiary">{label}</p>;
}

export function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[10px] text-text-tertiary">{label}</p>
      <p className="truncate font-medium text-text-primary">{value}</p>
    </div>
  );
}

export function CompactDatePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: CalendarDate | null;
  onChange: (value: CalendarDate | null) => void;
}) {
  return (
    <DatePicker
      className="w-auto flex-row items-center gap-1.5"
      value={value}
      onChange={onChange}
    >
      <FieldLabel className="text-[11px] whitespace-nowrap">{label}</FieldLabel>
      <DatePickerGroup>
        <DateInput className="min-w-36 px-2 py-1 pr-8 text-xs">
          {(segment) => <DateSegment segment={segment} />}
        </DateInput>
        <DatePickerTrigger className="right-2">
          <CalendarIcon className="size-4 text-icon-primary" />
        </DatePickerTrigger>
      </DatePickerGroup>
      <DatePickerPopover className="z-50">
        <Calendar aria-label={label} className="w-fit rounded-2xl p-3 sm:p-3">
          <CalendarHeader className="mb-2">
            <NavButton slot="previous" className="size-8" />
            <CalendarHeading className="text-sm font-medium" />
            <NavButton slot="next" className="size-8" />
          </CalendarHeader>
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
        </Calendar>
      </DatePickerPopover>
    </DatePicker>
  );
}
