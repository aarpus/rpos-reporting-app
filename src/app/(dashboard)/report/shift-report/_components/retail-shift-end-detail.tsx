"use client";

import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { cn } from "@/utils/cn";
import { ArrowLeft } from "@tailgrids/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuUpload } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import {
  decorateShiftLines,
  formatShiftStamp,
  formatShiftTitle,
  type RetailShiftLine,
} from "./retail-shift-data";

const printStyles = `
@media print {
  @page { margin: 0; }
  html, body {
    height: auto !important;
    overflow: visible !important;
    background: #fff !important;
  }
  aside, header, nav, .retail-shift-no-print { display: none !important; }
  body, body div {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    box-shadow: none !important;
  }
  #retail-shift-print, #retail-shift-print * {
    color: #111827 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  #retail-shift-print {
    background: #fff !important;
    padding: 12mm !important;
  }
  #retail-shift-print .shift-title-bar,
  #retail-shift-print .shift-title-bar * {
    background: #1f2937 !important;
    color: #fff !important;
  }
  #retail-shift-print section {
    background: #fff !important;
    border-color: #e5e7eb !important;
    break-inside: avoid;
  }
}
`;

function formatPrintedAt(date: Date) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const hours24 = date.getHours();
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours = String(hours24 % 12 || 12).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${month}-${day}-${date.getFullYear()} ${hours}:${minutes}:${seconds} ${meridiem}`;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-x-3 py-1 text-sm">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-medium whitespace-nowrap text-text-primary">
        {value}
      </dd>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: RetailShiftLine[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-card-border bg-card-surface-area">
      <h2 className="border-b border-card-border px-4 py-2 text-xs font-semibold tracking-wide text-text-primary uppercase">
        {title}
      </h2>
      <dl>
        {rows.map((row) => (
          <div
            key={row.label}
            className={cn(
              "flex items-baseline justify-between gap-4 px-4 py-1.5 text-sm",
              row.emphasize && "font-semibold text-text-primary",
              row.divider && "border-t border-card-border",
            )}
          >
            <dt
              className={
                row.emphasize ? "text-text-primary" : "text-text-secondary"
              }
            >
              {row.label}
            </dt>
            <dd className="tabular-nums text-text-primary">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

type ShiftDetail = {
  id: string;
  stationname: string;
  shift: number;
  start_time: string;
  end_time: string | null;
  employeename: string | null;
  employeeid: number | null;
  totaltime: string | null;
  sale: { label: string; value: string }[];
  taxes: { label: string; value: string }[];
  sale_breakdown: { label: string; value: string }[];
  terminalcashstatus: { label: string; value: string }[];
  miscellaneous: { label: string; value: string }[];
  terminalcashtransfer: { label: string; value: string }[];
};

type ShiftDetailResponse = {
  timezone: string;
  shift: ShiftDetail | null;
};

export default function RetailShiftEndDetail({ id }: { id: string }) {
  const router = useRouter();
  const { selectedStore } = useStore();
  const storeCode = selectedStore?.storeCode ?? "";
  const report = useQuery({
    queryKey: ["retail-shift-end", storeCode, id],
    enabled: Boolean(storeCode),
    queryFn: async ({ signal }): Promise<ShiftDetailResponse> => {
      const params = new URLSearchParams({ store_code: storeCode, id });
      const response = await fetch(`/api/reporting/retail/shift-end?${params}`, {
        signal,
        cache: "no-store",
      });
      if (response.status === 404) return { timezone: selectedStore?.timezone ?? "UTC", shift: null };
      const body = (await response.json()) as ShiftDetailResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load this shift.");
      return body;
    },
  });
  const shift = report.data?.shift;
  const timezone = report.data?.timezone ?? selectedStore?.timezone ?? "UTC";
  const titleDate = shift ? formatShiftTitle(shift.end_time ?? shift.start_time, timezone) : "";
  const [printedAt, setPrintedAt] = useState("");

  useEffect(() => {
    setPrintedAt(formatPrintedAt(new Date()));
  }, []);

  function exportPdf() {
    const previous = document.title;
    document.title = `SHIFT END REPORT ${titleDate}`;
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  if (report.isSuccess && !shift) notFound();
  if (!shift) {
    return (
      <div className="px-4 py-4 text-sm text-text-secondary sm:px-6">
        {report.error ? report.error.message : "Loading shift."}
      </div>
    );
  }

  return (
    <div id="retail-shift-print" className="min-h-full px-4 py-4 sm:px-6">
      <style>{printStyles}</style>
      <div className="retail-shift-no-print mb-4 flex items-center justify-between gap-3">
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={() => router.push("/report/shift-report")}
        >
          <ArrowLeft />
          Back
        </Button>
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={exportPdf}
        >
          <LuUpload />
          Export
        </Button>
      </div>
      <div className="border border-card-border rounded-lg py-4 px-2">
        <p className="text-center text-sm font-semibold tracking-wide text-text-primary uppercase">
          {selectedStore?.storeCode}
        </p>
        <div className="shift-title-bar mt-3 bg-text-primary px-4 py-2 text-center text-sm font-semibold tracking-wide text-card-surface-area">
          SHIFT END REPORT {titleDate}
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Date & Time: {printedAt}
        </p>
      </div>
      <div className="mt-4 grid gap-6 border-y border-card-border py-4 sm:grid-cols-2">
        <dl>
          <MetaRow label="Station :" value={shift.stationname} />
          <MetaRow label="Shift :" value={String(shift.shift)} />
          <MetaRow label="Start Time :" value={formatShiftStamp(shift.start_time, timezone)} />
          <MetaRow label="End Time :" value={formatShiftStamp(shift.end_time, timezone)} />
        </dl>
        <dl>
          <MetaRow label="Employee Name :" value={shift.employeename ?? ""} />
          <MetaRow label="Employee ID :" value={shift.employeeid === null ? "" : String(shift.employeeid)} />
          <MetaRow label="Total Time :" value={shift.totaltime ?? ""} />
        </dl>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Section title="Sales" rows={decorateShiftLines(shift.sale)} />
          <Section title="Miscellaneous" rows={decorateShiftLines(shift.miscellaneous)} />
        </div>
        <div className="space-y-4">
          <Section title="Taxes" rows={decorateShiftLines(shift.taxes)} />
          <Section title="Sales Breakdown" rows={decorateShiftLines(shift.sale_breakdown)} />
          <Section title="Terminal Cash Status" rows={decorateShiftLines(shift.terminalcashstatus)} />
          <Section title="Terminal Cash Transfer" rows={decorateShiftLines(shift.terminalcashtransfer)} />
        </div>
      </div>
    </div>
  );
}
