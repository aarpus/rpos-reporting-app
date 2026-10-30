"use client";

import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { cn } from "@/utils/cn";
import { ArrowLeft } from "@tailgrids/icons";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LuUpload } from "react-icons/lu";
import {
  getRetailInvoiceCostVarianceDetail,
  invoiceReportListHref,
} from "./retail-invoice-data";

const printStyles = `
@media print {
  @page { margin: 0; }
  html, body {
    height: auto !important;
    overflow: visible !important;
    background: #fff !important;
  }
  aside, header, nav, .retail-report-no-print { display: none !important; }
  body, body div {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    box-shadow: none !important;
  }
  #retail-invoice-cost-variance-print, #retail-invoice-cost-variance-print * {
    color: #111827 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  #retail-invoice-cost-variance-print {
    background: #fff !important;
    padding: 12mm !important;
  }
  #retail-invoice-cost-variance-print .shift-title-bar,
  #retail-invoice-cost-variance-print .shift-title-bar * {
    background: #1f2937 !important;
    color: #fff !important;
  }
  #retail-invoice-cost-variance-print thead,
  #retail-invoice-cost-variance-print thead * {
    background: #f3f4f6 !important;
    color: #111827 !important;
  }
}
`;

const headCell =
  "px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-text-secondary";
const bodyCell = "px-3 py-2 text-sm whitespace-nowrap text-text-secondary";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-x-3 py-1 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-medium text-text-primary">{value}</dd>
    </div>
  );
}

function formatPrintedAt(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function RetailInvoiceCostVariance() {
  const router = useRouter();
  const params = useParams<{ id: string; type: string }>();
  const searchParams = useSearchParams();
  const { selectedStore } = useStore();
  const [printedAt, setPrintedAt] = useState("");
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const type = Array.isArray(params.type) ? params.type[0] : params.type;
  const listHref = invoiceReportListHref(searchParams.toString());

  const detail = useMemo(
    () => (id && type ? getRetailInvoiceCostVarianceDetail(id, type) : null),
    [id, type],
  );

  useEffect(() => {
    setPrintedAt(formatPrintedAt(new Date()));
  }, []);

  function exportPdf() {
    const previous = document.title;
    document.title = "COST VARIANCE REPORT";
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  if (!detail) {
    return (
      <div className="min-h-full space-y-4 px-4 py-6 sm:px-6">
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={() => router.push(listHref)}
        >
          <ArrowLeft />
          Back
        </Button>
        <div className="rounded-lg border border-dashed border-card-border bg-card-surface-area px-5 py-10 text-center">
          <p className="text-sm font-medium text-text-secondary">
            Cost variance report not found for id {id} and type {type}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="retail-invoice-cost-variance-print"
      className="min-h-full px-4 py-4 sm:px-6"
    >
      <style>{printStyles}</style>
      <div className="retail-report-no-print mb-4 flex items-center justify-between gap-3">
        <Button
          appearance="outline"
          size="sm"
          className="w-fit gap-1.5"
          onPress={() => router.push(listHref)}
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

      <div className="rounded-lg border border-card-border px-2 py-4">
        <p className="text-center text-sm font-semibold tracking-wide text-text-primary uppercase">
          {selectedStore?.storeCode}
        </p>
        <div className="shift-title-bar mt-3 bg-text-primary px-4 py-2 text-center text-sm font-semibold tracking-wide text-card-surface-area">
          COST VARIANCE REPORT
        </div>

        <div className="mt-4 grid gap-4 border-t border-card-border pt-4 sm:grid-cols-2">
          <dl>
            <MetaRow label="Invoice No :" value={detail.invoiceNo} />
            <MetaRow label="Invoice Date :" value={detail.invoiceDateLabel} />
            <MetaRow label="Date :" value={printedAt} />
          </dl>
          <dl>
            <MetaRow label="Vendor :" value={detail.vendor} />
            <MetaRow label="Vendor's Inv. No :" value={detail.vendorInvoiceNo} />
            <MetaRow label="Employee Name :" value={detail.employeeName} />
          </dl>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-card-border bg-card-surface-area">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem]">
            <thead className="bg-background-gray-secondary_alt_2">
              <tr>
                {[
                  { label: "#", align: "left" as const },
                  { label: "Product Item #", align: "left" as const },
                  { label: "Product Name", align: "left" as const },
                  { label: "Supplier Item#", align: "right" as const },
                  { label: "New Cost", align: "right" as const },
                  { label: "Previous Cost", align: "right" as const },
                  { label: "Difference Amount", align: "right" as const },
                  { label: "Difference (%)", align: "right" as const },
                  { label: "Average Cost", align: "right" as const },
                  { label: "Retail Price", align: "right" as const },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={cn(
                      headCell,
                      col.align === "right" && "text-right",
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detail.lines.map((line) => (
                <tr
                  key={`${line.no}-${line.productItemNo}`}
                  className="border-t border-card-border"
                >
                  <td className={cn(bodyCell, "text-text-primary")}>
                    {line.no}
                  </td>
                  <td className={cn(bodyCell, "text-text-primary")}>
                    {line.productItemNo}
                  </td>
                  <td
                    className={cn(
                      bodyCell,
                      "max-w-sm whitespace-normal text-text-primary",
                    )}
                  >
                    {line.productName}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.supplierItemNo}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.newCost}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.previousCost}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.differenceAmount}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.differencePercent}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.averageCost}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.retailPrice}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
