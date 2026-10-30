"use client";

import { Button } from "@/components/tailgrids/core/button";
import { useStore } from "@/components/store/store-provider";
import { cn } from "@/utils/cn";
import { ArrowLeft } from "@tailgrids/icons";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { LuUpload } from "react-icons/lu";
import {
  getRetailInvoiceDetail,
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
  #retail-invoice-view-print, #retail-invoice-view-print * {
    color: #111827 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  #retail-invoice-view-print {
    background: #fff !important;
    padding: 12mm !important;
  }
  #retail-invoice-view-print .shift-title-bar,
  #retail-invoice-view-print .shift-title-bar * {
    background: #1f2937 !important;
    color: #fff !important;
  }
  #retail-invoice-view-print thead,
  #retail-invoice-view-print thead * {
    background: #f3f4f6 !important;
    color: #111827 !important;
  }
}
`;

const headCell =
  "px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-text-secondary";
const bodyCell =
  "px-3 py-2 text-sm whitespace-nowrap text-text-secondary";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-x-3 py-1 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-medium text-text-primary">{value}</dd>
    </div>
  );
}

export default function RetailInvoiceView() {
  const router = useRouter();
  const params = useParams<{ id: string; type: string }>();
  const searchParams = useSearchParams();
  const { selectedStore } = useStore();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const type = Array.isArray(params.type) ? params.type[0] : params.type;
  const listHref = invoiceReportListHref(searchParams.toString());

  const detail = useMemo(
    () => (id && type ? getRetailInvoiceDetail(id, type) : null),
    [id, type],
  );

  function exportPdf() {
    const previous = document.title;
    document.title = "INVOICE REPORT";
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
            Invoice not found for id {id} and type {type}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="retail-invoice-view-print" className="min-h-full px-4 py-4 sm:px-6">
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
          INVOICE REPORT
        </div>

        <div className="mt-4 grid gap-4 border-t border-card-border pt-4 sm:grid-cols-2">
          <dl>
            <MetaRow label="Invoice No :" value={detail.invoiceNo} />
            <MetaRow label="Invoice Date :" value={detail.invoiceDate} />
            <MetaRow label="Delivery Date :" value={detail.deliveryDate} />
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
          <table className="w-full min-w-[48rem]">
            <thead className="bg-background-gray-secondary_alt_2">
              <tr>
                {[
                  { label: "Product Item#", align: "left" as const },
                  { label: "Product Name", align: "left" as const },
                  { label: "Supplier Item#", align: "right" as const },
                  { label: "Qty", align: "right" as const },
                  { label: "Case Cost", align: "right" as const },
                  { label: "Total", align: "right" as const },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={cn(headCell, col.align === "right" && "text-right")}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detail.lines.map((line, index) => (
                <tr
                  key={`${line.productItemNo}-${index}`}
                  className="border-t border-card-border"
                >
                  <td className={cn(bodyCell, "text-text-primary")}>
                    {line.productItemNo}
                  </td>
                  <td className={cn(bodyCell, "max-w-md whitespace-normal text-text-primary")}>
                    {line.productName}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.supplierItemNo}
                  </td>
                  <td className={cn(bodyCell, "text-right")}>{line.qty}</td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.caseCost}
                  </td>
                  <td className={cn(bodyCell, "text-right tabular-nums")}>
                    {line.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <dl className="w-full max-w-xs space-y-1.5 rounded-lg border border-card-border bg-card-surface-area px-4 py-3 text-sm">
          {[
            { label: "Discount", value: detail.discount },
            { label: "Shipping Charge", value: detail.shippingCharge },
            { label: "Tax", value: detail.tax },
            { label: "Deposit", value: detail.deposit },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-6"
            >
              <dt className="text-text-secondary">{row.label}</dt>
              <dd className="tabular-nums text-text-primary">{row.value}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-6 border-t border-card-border pt-2 font-semibold">
            <dt className="text-text-primary">Total Amount</dt>
            <dd className="tabular-nums text-text-primary">{detail.totalAmount}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
