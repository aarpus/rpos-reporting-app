"use client";

import { useStore } from "@/components/store/store-provider";
import { reportingQueryKey } from "@/lib/reporting/query-key";
import {
  formatInvoiceLongDate,
  formatInvoiceStamp,
  type InvoiceReport,
} from "@/lib/reporting/retail-invoice";
import { useQuery } from "@tanstack/react-query";

export function useInvoiceDetail(id: string | undefined, type: string | undefined) {
  const { selectedStore } = useStore();
  const storeCode = selectedStore?.storeCode ?? "";
  const valid = type === "RC" || type === "OP";
  return useQuery({
    queryKey: reportingQueryKey(storeCode, { report: "invoice-detail", id, type }),
    enabled: Boolean(storeCode && id && valid),
    queryFn: async ({ signal }): Promise<{ timezone: string; invoice: InvoiceReport }> => {
      const params = new URLSearchParams({ store_code: storeCode, id: id ?? "", type: type ?? "" });
      const response = await fetch(`/api/reporting/retail/invoice?${params}`, { signal, cache: "no-store" });
      const body = (await response.json()) as { timezone: string; invoice: InvoiceReport; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to load invoice.");
      return body;
    },
  });
}

export function toInvoiceView(invoice: InvoiceReport, timeZone: string) {
  return {
    invoiceNo: invoice.invoice_no,
    invoiceDate: formatInvoiceStamp(invoice.invoice_datetime, timeZone),
    deliveryDate: formatInvoiceStamp(invoice.delivery_datetime, timeZone),
    vendor: invoice.supplier_name,
    vendorInvoiceNo: invoice.supplier_invoice_no,
    employeeName: invoice.employee_name,
    lines: invoice.lines.map((line) => ({
      productItemNo: line.product_item_no,
      productName: line.product_name,
      supplierItemNo: line.supplier_item_no,
      qty: line.qty,
      caseCost: line.case_cost,
      total: line.total,
    })),
    discount: invoice.discount,
    shippingCharge: invoice.shipping,
    tax: invoice.tax,
    deposit: invoice.deposit,
    totalAmount: invoice.total,
  };
}

export function toProfitDetail(invoice: InvoiceReport, timeZone: string) {
  return {
    invoiceNo: invoice.invoice_no,
    invoiceDateLabel: formatInvoiceLongDate(invoice.invoice_datetime, timeZone),
    vendor: invoice.supplier_name,
    vendorInvoiceNo: invoice.supplier_invoice_no,
    employeeName: invoice.employee_name,
    lines: invoice.profit_lines.map((line, index) => ({
      no: index + 1,
      productNo: line.product_no,
      productName: line.product_name,
      supplierItemNo: line.supplier_item_no,
      invQty: line.inv_qty,
      cost: line.cost,
      unitCost: line.unit_cost,
      extCost: line.ext_cost,
      unitRetail: line.unit_retail,
      caseRetail: line.case_retail,
      extRetail: line.ext_retail,
      profitAmount: line.profit_amount,
      profitPercent: line.profit_percent,
    })),
    extCostTotal: invoice.profit_totals.ext_cost,
    extRetailTotal: invoice.profit_totals.ext_retail,
    profitAmountTotal: invoice.profit_totals.profit_amount,
    profitPercentTotal: invoice.profit_totals.profit_percent,
  };
}

export function toCostDetail(invoice: InvoiceReport, timeZone: string) {
  return {
    invoiceNo: invoice.invoice_no,
    invoiceDateLabel: formatInvoiceLongDate(invoice.invoice_datetime, timeZone),
    vendor: invoice.supplier_name,
    vendorInvoiceNo: invoice.supplier_invoice_no,
    employeeName: invoice.employee_name,
    lines: invoice.cost_lines.map((line, index) => ({
      no: index + 1,
      productItemNo: line.product_item_no,
      productName: line.product_name,
      supplierItemNo: line.supplier_item_no,
      newCost: line.new_cost,
      previousCost: line.previous_cost,
      differenceAmount: line.difference_amount,
      differencePercent: line.difference_percent,
      averageCost: line.average_cost,
      retailPrice: line.retail_price,
    })),
  };
}

export function toQtyDetail(invoice: InvoiceReport, timeZone: string) {
  return {
    invoiceNo: invoice.invoice_no,
    invoiceDateLabel: formatInvoiceLongDate(invoice.invoice_datetime, timeZone),
    vendor: invoice.supplier_name,
    vendorInvoiceNo: invoice.supplier_invoice_no,
    employeeName: invoice.employee_name,
    lines: invoice.qty_lines.map((line, index) => ({
      no: index + 1,
      productItemNo: line.product_item_no,
      productName: line.product_name,
      supplierItemNo: line.supplier_item_no,
      orderedQty: line.ordered_qty,
      receivedQty: line.received_qty,
      difference: line.difference,
      stockInHand: line.stock_in_hand,
    })),
  };
}
