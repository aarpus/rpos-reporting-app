"use client";

import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { cn } from "@/utils/cn";
import { ArrowLeft } from "@tailgrids/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuUpload } from "react-icons/lu";
import {
  retailShiftDetail,
  shiftDurationLabel,
  shiftTitleDate,
  type RetailShiftLine,
  type RetailShiftRow,
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

export default function RetailShiftEndDetail({
  shift,
}: {
  shift: RetailShiftRow;
}) {
  const router = useRouter();
  const { selectedStore } = useStore();
  const detail = retailShiftDetail(shift.id);
  const titleDate = shiftTitleDate(shift.end);
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

  if (!detail) return null;

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
          <MetaRow label="Station :" value={shift.terminal} />
          <MetaRow label="Shift :" value={String(shift.shift)} />
          <MetaRow label="Start Time :" value={shift.startLabel} />
          <MetaRow label="End Time :" value={shift.endLabel} />
        </dl>
        <dl>
          <MetaRow label="Employee Name :" value={detail.employeeName} />
          <MetaRow label="Employee ID :" value={detail.employeeId} />
          <MetaRow
            label="Total Time :"
            value={shiftDurationLabel(shift.startLabel, shift.endLabel)}
          />
        </dl>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Section title="Sales" rows={detail.sales} />
          <Section title="Miscellaneous" rows={detail.miscellaneous} />
        </div>
        <div className="space-y-4">
          <Section title="Taxes" rows={detail.taxes} />
          <Section title="Sales Breakdown" rows={detail.payments} />
          <Section title="Terminal Cash Status" rows={detail.cashStatus} />
        </div>
      </div>
    </div>
  );
}
