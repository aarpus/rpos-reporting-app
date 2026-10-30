import { CalendarDate } from "@internationalized/date";

export type RetailInvoiceType = "All" | "RC" | "OP";
export type RetailInvoiceStatus = "Unpaid" | "Paid" | "OP";

export type RetailInvoiceRow = {
  id: string;
  dateLabel: string;
  date: CalendarDate;
  supplierName: string;
  supplierInvoiceNo: string;
  type: "RC" | "OP";
  status: RetailInvoiceStatus;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
  totalValue: number;
};

export const RETAIL_INVOICE_SUPPLIERS = [
  "H.T. Hackney",
  "Tobbaco",
  "Core-Mark",
  "McLane",
] as const;

/** Sample supplier invoices for July 2025. Not a live store read. */
export const retailInvoices: RetailInvoiceRow[] = [
  {
    id: "1",
    dateLabel: "07/01/2025",
    date: new CalendarDate(2025, 7, 1),
    supplierName: "H.T. Hackney",
    supplierInvoiceNo: "HT-784512",
    type: "RC",
    status: "Paid",
    discount: "0.00",
    shipping: "0.00",
    tax: "12.50",
    total: "220.50",
    totalValue: 220.5,
  },
  {
    id: "2",
    dateLabel: "07/02/2025",
    date: new CalendarDate(2025, 7, 2),
    supplierName: "Tobbaco",
    supplierInvoiceNo: "TB-900221",
    type: "OP",
    status: "Unpaid",
    discount: "5.00",
    shipping: "0.00",
    tax: "8.10",
    total: "143.00",
    totalValue: 143,
  },
  {
    id: "3",
    dateLabel: "07/03/2025",
    date: new CalendarDate(2025, 7, 3),
    supplierName: "Core-Mark",
    supplierInvoiceNo: "CM-441098",
    type: "RC",
    status: "Paid",
    discount: "0.00",
    shipping: "15.00",
    tax: "18.75",
    total: "309.19",
    totalValue: 309.19,
  },
  {
    id: "4",
    dateLabel: "07/04/2025",
    date: new CalendarDate(2025, 7, 4),
    supplierName: "H.T. Hackney",
    supplierInvoiceNo: "HT-784590",
    type: "RC",
    status: "Unpaid",
    discount: "0.00",
    shipping: "0.00",
    tax: "0.60",
    total: "10.00",
    totalValue: 10,
  },
  {
    id: "5",
    dateLabel: "07/05/2025",
    date: new CalendarDate(2025, 7, 5),
    supplierName: "McLane",
    supplierInvoiceNo: "ML-228871",
    type: "OP",
    status: "OP",
    discount: "2.50",
    shipping: "8.00",
    tax: "14.20",
    total: "248.75",
    totalValue: 248.75,
  },
  {
    id: "6",
    dateLabel: "07/07/2025",
    date: new CalendarDate(2025, 7, 7),
    supplierName: "Tobbaco",
    supplierInvoiceNo: "TB-900340",
    type: "RC",
    status: "Paid",
    discount: "0.00",
    shipping: "0.00",
    tax: "6.45",
    total: "113.90",
    totalValue: 113.9,
  },
  {
    id: "7",
    dateLabel: "07/08/2025",
    date: new CalendarDate(2025, 7, 8),
    supplierName: "H.T. Hackney",
    supplierInvoiceNo: "HT-784701",
    type: "RC",
    status: "Paid",
    discount: "10.00",
    shipping: "0.00",
    tax: "22.00",
    total: "389.50",
    totalValue: 389.5,
  },
  {
    id: "8",
    dateLabel: "07/09/2025",
    date: new CalendarDate(2025, 7, 9),
    supplierName: "Core-Mark",
    supplierInvoiceNo: "CM-441210",
    type: "OP",
    status: "Unpaid",
    discount: "0.00",
    shipping: "12.00",
    tax: "9.80",
    total: "175.40",
    totalValue: 175.4,
  },
  {
    id: "9",
    dateLabel: "07/10/2025",
    date: new CalendarDate(2025, 7, 10),
    supplierName: "McLane",
    supplierInvoiceNo: "ML-228902",
    type: "RC",
    status: "Paid",
    discount: "0.00",
    shipping: "0.00",
    tax: "4.25",
    total: "75.00",
    totalValue: 75,
  },
  {
    id: "10",
    dateLabel: "07/11/2025",
    date: new CalendarDate(2025, 7, 11),
    supplierName: "Tobbaco",
    supplierInvoiceNo: "TB-900401",
    type: "RC",
    status: "Paid",
    discount: "0.00",
    shipping: "5.00",
    tax: "16.30",
    total: "287.15",
    totalValue: 287.15,
  },
  {
    id: "11",
    dateLabel: "07/12/2025",
    date: new CalendarDate(2025, 7, 12),
    supplierName: "H.T. Hackney",
    supplierInvoiceNo: "HT-784812",
    type: "OP",
    status: "OP",
    discount: "3.00",
    shipping: "0.00",
    tax: "11.10",
    total: "196.00",
    totalValue: 196,
  },
  {
    id: "12",
    dateLabel: "07/14/2025",
    date: new CalendarDate(2025, 7, 14),
    supplierName: "Core-Mark",
    supplierInvoiceNo: "CM-441355",
    type: "RC",
    status: "Unpaid",
    discount: "0.00",
    shipping: "0.00",
    tax: "7.90",
    total: "139.80",
    totalValue: 139.8,
  },
  {
    id: "13",
    dateLabel: "07/15/2025",
    date: new CalendarDate(2025, 7, 15),
    supplierName: "McLane",
    supplierInvoiceNo: "ML-229010",
    type: "RC",
    status: "Paid",
    discount: "0.00",
    shipping: "20.00",
    tax: "25.40",
    total: "450.00",
    totalValue: 450,
  },
  {
    id: "14",
    dateLabel: "07/16/2025",
    date: new CalendarDate(2025, 7, 16),
    supplierName: "Tobbaco",
    supplierInvoiceNo: "TB-900488",
    type: "RC",
    status: "Paid",
    discount: "0.00",
    shipping: "0.00",
    tax: "3.60",
    total: "63.59",
    totalValue: 63.59,
  },
  {
    id: "15",
    dateLabel: "07/18/2025",
    date: new CalendarDate(2025, 7, 18),
    supplierName: "H.T. Hackney",
    supplierInvoiceNo: "HT-784900",
    type: "OP",
    status: "Unpaid",
    discount: "0.00",
    shipping: "0.00",
    tax: "19.25",
    total: "340.00",
    totalValue: 340,
  },
  {
    id: "16",
    dateLabel: "07/20/2025",
    date: new CalendarDate(2025, 7, 20),
    supplierName: "Core-Mark",
    supplierInvoiceNo: "CM-441480",
    type: "RC",
    status: "Paid",
    discount: "7.50",
    shipping: "0.00",
    tax: "13.00",
    total: "229.50",
    totalValue: 229.5,
  },
  {
    id: "17",
    dateLabel: "07/22/2025",
    date: new CalendarDate(2025, 7, 22),
    supplierName: "McLane",
    supplierInvoiceNo: "ML-229155",
    type: "RC",
    status: "Paid",
    discount: "0.00",
    shipping: "10.00",
    tax: "5.80",
    total: "102.40",
    totalValue: 102.4,
  },
  {
    id: "18",
    dateLabel: "07/24/2025",
    date: new CalendarDate(2025, 7, 24),
    supplierName: "Tobbaco",
    supplierInvoiceNo: "TB-900560",
    type: "OP",
    status: "OP",
    discount: "0.00",
    shipping: "0.00",
    tax: "21.00",
    total: "370.00",
    totalValue: 370,
  },
  {
    id: "19",
    dateLabel: "07/26/2025",
    date: new CalendarDate(2025, 7, 26),
    supplierName: "H.T. Hackney",
    supplierInvoiceNo: "HT-785011",
    type: "RC",
    status: "Unpaid",
    discount: "0.00",
    shipping: "0.00",
    tax: "2.10",
    total: "37.00",
    totalValue: 37,
  },
  {
    id: "20",
    dateLabel: "07/28/2025",
    date: new CalendarDate(2025, 7, 28),
    supplierName: "Core-Mark",
    supplierInvoiceNo: "CM-441602",
    type: "RC",
    status: "Paid",
    discount: "0.00",
    shipping: "6.00",
    tax: "15.55",
    total: "274.60",
    totalValue: 274.6,
  },
];

export type RetailInvoiceAppliedFilter = {
  date:
    | { kind: "single"; date: CalendarDate }
    | { kind: "range"; from: CalendarDate; to: CalendarDate };
  amountFrom: string;
  amountTo: string;
  invoiceType: RetailInvoiceType;
  supplierName: string;
  supplierInvoiceNo: string;
};

function parseCalendarDate(value: string | null): CalendarDate | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  try {
    return new CalendarDate(year, month, day);
  } catch {
    return null;
  }
}

/** Serialize applied invoice filters into a query string for list/detail navigation. */
export function serializeRetailInvoiceFilter(
  filter: RetailInvoiceAppliedFilter,
): string {
  const params = new URLSearchParams();
  if (filter.date.kind === "single") {
    params.set("kind", "single");
    params.set("date", filter.date.date.toString());
  } else {
    const from =
      filter.date.from.compare(filter.date.to) <= 0
        ? filter.date.from
        : filter.date.to;
    const to =
      filter.date.from.compare(filter.date.to) <= 0
        ? filter.date.to
        : filter.date.from;
    params.set("kind", "range");
    params.set("from", from.toString());
    params.set("to", to.toString());
  }
  if (filter.amountFrom.trim()) params.set("amountFrom", filter.amountFrom.trim());
  if (filter.amountTo.trim()) params.set("amountTo", filter.amountTo.trim());
  if (filter.invoiceType !== "All") params.set("invoiceType", filter.invoiceType);
  if (filter.supplierName !== "All") {
    params.set("supplierName", filter.supplierName);
  }
  if (filter.supplierInvoiceNo.trim()) {
    params.set("supplierInvoiceNo", filter.supplierInvoiceNo.trim());
  }
  return params.toString();
}

/** Restore applied invoice filters from list/detail query params. */
export function parseRetailInvoiceFilter(
  searchParams: URLSearchParams,
): RetailInvoiceAppliedFilter | null {
  const kind = searchParams.get("kind");
  let date: RetailInvoiceAppliedFilter["date"] | null = null;
  if (kind === "single") {
    const single = parseCalendarDate(searchParams.get("date"));
    if (!single) return null;
    date = { kind: "single", date: single };
  } else if (kind === "range") {
    const from = parseCalendarDate(searchParams.get("from"));
    const to = parseCalendarDate(searchParams.get("to"));
    if (!from || !to) return null;
    date = { kind: "range", from, to };
  } else {
    return null;
  }

  const invoiceTypeRaw = searchParams.get("invoiceType") ?? "All";
  const invoiceType: RetailInvoiceType =
    invoiceTypeRaw === "RC" || invoiceTypeRaw === "OP" || invoiceTypeRaw === "All"
      ? invoiceTypeRaw
      : "All";

  return {
    date,
    amountFrom: searchParams.get("amountFrom") ?? "",
    amountTo: searchParams.get("amountTo") ?? "",
    invoiceType,
    supplierName: searchParams.get("supplierName") ?? "All",
    supplierInvoiceNo: searchParams.get("supplierInvoiceNo") ?? "",
  };
}

export function invoiceReportListHref(query: string) {
  return query ? `/report/invoice-report?${query}` : "/report/invoice-report";
}

function dateBounds(filter: RetailInvoiceAppliedFilter["date"]) {
  if (filter.kind === "single") return { from: filter.date, to: filter.date };
  const from = filter.from.compare(filter.to) <= 0 ? filter.from : filter.to;
  const to = filter.from.compare(filter.to) <= 0 ? filter.to : filter.from;
  return { from, to };
}

export function filterRetailInvoices(
  rows: RetailInvoiceRow[],
  filter: RetailInvoiceAppliedFilter,
) {
  const { from, to } = dateBounds(filter.date);
  const amountFrom = filter.amountFrom.trim()
    ? Number(filter.amountFrom)
    : null;
  const amountTo = filter.amountTo.trim() ? Number(filter.amountTo) : null;
  const invoiceNo = filter.supplierInvoiceNo.trim().toLowerCase();

  return rows.filter((row) => {
    if (row.date.compare(from) < 0 || row.date.compare(to) > 0) return false;
    if (amountFrom !== null && !Number.isNaN(amountFrom) && row.totalValue < amountFrom) {
      return false;
    }
    if (amountTo !== null && !Number.isNaN(amountTo) && row.totalValue > amountTo) {
      return false;
    }
    if (filter.invoiceType !== "All" && row.type !== filter.invoiceType) {
      return false;
    }
    if (
      filter.supplierName !== "All" &&
      row.supplierName !== filter.supplierName
    ) {
      return false;
    }
    if (
      invoiceNo &&
      !row.supplierInvoiceNo.toLowerCase().includes(invoiceNo)
    ) {
      return false;
    }
    return true;
  });
}

export type RetailInvoiceLine = {
  productItemNo: string;
  productName: string;
  supplierItemNo: string;
  qty: string;
  caseCost: string;
  total: string;
};

export type RetailInvoiceDetail = {
  invoice: RetailInvoiceRow;
  invoiceNo: string;
  invoiceDate: string;
  deliveryDate: string;
  vendor: string;
  vendorInvoiceNo: string;
  employeeName: string;
  lines: RetailInvoiceLine[];
  discount: string;
  shippingCharge: string;
  tax: string;
  deposit: string;
  totalAmount: string;
};

const SAMPLE_LINES: RetailInvoiceLine[] = [
  {
    productItemNo: "5947",
    productName: "30ML Salt Nic E-Juice By Teleos The Milk 50Mg 1 EA 1 PK",
    supplierItemNo: "5947",
    qty: "1U",
    caseCost: "10.00",
    total: "10.00",
  },
  {
    productItemNo: "6330",
    productName: "30ML Salt Nic E-Juice By Teleos The Milk 50Mg 1 EA 1 PK",
    supplierItemNo: "6330",
    qty: "1U",
    caseCost: "10.00",
    total: "10.00",
  },
  {
    productItemNo: "8015",
    productName: "30ML Salt Nic E-Juice By Teleos The Milk 50Mg 1 EA 1 PK",
    supplierItemNo: "1234",
    qty: "1U",
    caseCost: "10.00",
    total: "10.00",
  },
  {
    productItemNo: "8016",
    productName: "30ML Salt Nic E-Juice By Teleos The Milk 50Mg 1 EA 1 PK",
    supplierItemNo: "1234",
    qty: "1U",
    caseCost: "10.00",
    total: "10.00",
  },
  {
    productItemNo: "5947",
    productName: "30ML Salt Nic E-Juice By Teleos The Milk 50Mg 1 EA 1 PK",
    supplierItemNo: "5947",
    qty: "1U",
    caseCost: "15.50",
    total: "15.50",
  },
  {
    productItemNo: "6330",
    productName: "30ML Salt Nic E-Juice By Teleos The Milk 50Mg 1 EA 1 PK",
    supplierItemNo: "6330",
    qty: "1U",
    caseCost: "7.50",
    total: "7.50",
  },
];

function formatInvoiceDateTime(date: CalendarDate) {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day} 00:00:00`;
}

function linesForInvoice(invoice: RetailInvoiceRow): RetailInvoiceLine[] {
  // Preview detail for Tobbaco OP matches the uploaded reference totals.
  if (invoice.id === "2" && invoice.type === "OP") {
    return SAMPLE_LINES;
  }
  const seed = Number(invoice.id) || 1;
  const count = Math.min(SAMPLE_LINES.length, 2 + (seed % 4));
  return SAMPLE_LINES.slice(0, count).map((line, index) => {
    const unit = Number((invoice.totalValue / count).toFixed(2));
    const isLast = index === count - 1;
    const total = isLast
      ? Number(
          (
            invoice.totalValue -
            unit * (count - 1)
          ).toFixed(2),
        )
      : unit;
    const formatted = total.toFixed(2);
    return {
      ...line,
      caseCost: formatted,
      total: formatted,
    };
  });
}

/** Sample invoice view detail for list rows. Not a live store read. */
export function getRetailInvoiceDetail(
  id: string,
  type: string,
): RetailInvoiceDetail | null {
  const invoice = retailInvoices.find(
    (row) => row.id === id && row.type === type,
  );
  if (!invoice) return null;

  const lines = linesForInvoice(invoice);
  const isReferencePreview = invoice.id === "2" && invoice.type === "OP";

  return {
    invoice,
    invoiceNo: isReferencePreview ? "123" : invoice.id,
    invoiceDate: formatInvoiceDateTime(invoice.date),
    deliveryDate: formatInvoiceDateTime(invoice.date),
    vendor: invoice.supplierName,
    vendorInvoiceNo: isReferencePreview ? "123" : invoice.supplierInvoiceNo,
    employeeName: "Acute User",
    lines,
    discount: isReferencePreview ? "0" : invoice.discount,
    shippingCharge: isReferencePreview ? "0" : invoice.shipping,
    tax: isReferencePreview ? "0" : invoice.tax,
    deposit: "0.00",
    totalAmount: isReferencePreview ? "63.00" : invoice.total,
  };
}

export type RetailInvoiceProfitLine = {
  no: number;
  productNo: string;
  productName: string;
  supplierItemNo: string;
  invQty: string;
  cost: string;
  unitCost: string;
  extCost: string;
  unitRetail: string;
  caseRetail: string;
  extRetail: string;
  profitAmount: string;
  profitPercent: string;
};

export type RetailInvoiceProfitDetail = {
  invoice: RetailInvoiceRow;
  invoiceNo: string;
  invoiceDateLabel: string;
  vendor: string;
  vendorInvoiceNo: string;
  employeeName: string;
  lines: RetailInvoiceProfitLine[];
  extCostTotal: string;
  extRetailTotal: string;
  profitAmountTotal: string;
  profitPercentTotal: string;
};

const MONEY = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function money(value: number) {
  return MONEY.format(value);
}

function moneyDollar(value: number) {
  return `$${money(value)}`;
}

function formatInvoiceDateLong(date: CalendarDate) {
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
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    new Date(date.year, date.month - 1, date.day, 12),
  );
  const day = String(date.day).padStart(2, "0");
  return `${months[date.month - 1]}-${day}-${date.year}, ${weekday}`;
}

const PROFIT_REFERENCE_LINES: Omit<RetailInvoiceProfitLine, "no">[] = [
  {
    productNo: "6330",
    productName: "3CHI Delta 8 Cartridges Pineapple Express 1G 1 EA 1 PK",
    supplierItemNo: "6330",
    invQty: "1U",
    cost: "10.00",
    unitCost: "10.00",
    extCost: "10.00",
    unitRetail: "19.99",
    caseRetail: "19.99",
    extRetail: "19.99",
    profitAmount: "9.99",
    profitPercent: "49.97",
  },
  {
    productNo: "5947",
    productName: "3CHI Delta 8 Cartridges Watermelon Kush 1G 1 EA 1 PK",
    supplierItemNo: "5947",
    invQty: "1U",
    cost: "10.00",
    unitCost: "10.00",
    extCost: "10.00",
    unitRetail: "19.99",
    caseRetail: "19.99",
    extRetail: "19.99",
    profitAmount: "9.99",
    profitPercent: "49.97",
  },
  {
    productNo: "8015",
    productName: "30ML Salt Nic E-Juice By Teleos The Milk 50Mg 1 EA 1 PK",
    supplierItemNo: "1234",
    invQty: "1U",
    cost: "10.00",
    unitCost: "10.00",
    extCost: "10.00",
    unitRetail: "24.99",
    caseRetail: "24.99",
    extRetail: "24.99",
    profitAmount: "14.99",
    profitPercent: "59.98",
  },
  {
    productNo: "8016",
    productName: "30ML Salt Nic E-Juice By Teleos The Milk 50Mg 1 EA 1 PK",
    supplierItemNo: "1234",
    invQty: "1U",
    cost: "15.50",
    unitCost: "15.50",
    extCost: "15.50",
    unitRetail: "29.99",
    caseRetail: "29.99",
    extRetail: "29.99",
    profitAmount: "14.49",
    profitPercent: "48.32",
  },
  {
    productNo: "5947",
    productName: "3CHI Delta 8 Cartridges Blue Dream 1G 1 EA 1 PK",
    supplierItemNo: "5947",
    invQty: "1U",
    cost: "17.50",
    unitCost: "17.50",
    extCost: "17.50",
    unitRetail: "25.00",
    caseRetail: "25.00",
    extRetail: "25.00",
    profitAmount: "7.50",
    profitPercent: "30.00",
  },
];

function profitLinesForInvoice(
  invoice: RetailInvoiceRow,
): RetailInvoiceProfitLine[] {
  if (invoice.id === "2" && invoice.type === "OP") {
    return PROFIT_REFERENCE_LINES.map((line, index) => ({
      ...line,
      no: index + 1,
    }));
  }

  const viewLines = linesForInvoice(invoice);
  return viewLines.map((line, index) => {
    const cost = Number(line.caseCost);
    const retail = Number((cost * 1.9).toFixed(2));
    const profit = Number((retail - cost).toFixed(2));
    const percent = retail === 0 ? 0 : Number(((profit / retail) * 100).toFixed(2));
    return {
      no: index + 1,
      productNo: line.productItemNo,
      productName: line.productName,
      supplierItemNo: line.supplierItemNo,
      invQty: line.qty,
      cost: money(cost),
      unitCost: money(cost),
      extCost: money(cost),
      unitRetail: money(retail),
      caseRetail: money(retail),
      extRetail: money(retail),
      profitAmount: money(profit),
      profitPercent: percent.toFixed(2),
    };
  });
}

/** Sample profit-margin detail for list rows. Not a live store read. */
export function getRetailInvoiceProfitDetail(
  id: string,
  type: string,
): RetailInvoiceProfitDetail | null {
  const invoice = retailInvoices.find(
    (row) => row.id === id && row.type === type,
  );
  if (!invoice) return null;

  const lines = profitLinesForInvoice(invoice);
  const isReferencePreview = invoice.id === "2" && invoice.type === "OP";
  const extCost = lines.reduce((sum, line) => sum + Number(line.extCost), 0);
  const extRetail = lines.reduce((sum, line) => sum + Number(line.extRetail), 0);
  const profit = Number((extRetail - extCost).toFixed(2));
  const percent =
    extRetail === 0 ? 0 : Number(((profit / extRetail) * 100).toFixed(2));

  return {
    invoice,
    invoiceNo: isReferencePreview ? "56" : invoice.id,
    invoiceDateLabel: isReferencePreview
      ? "Jun-25-2025, Wednesday"
      : formatInvoiceDateLong(invoice.date),
    vendor: invoice.supplierName,
    vendorInvoiceNo: isReferencePreview ? "5947" : invoice.supplierInvoiceNo,
    employeeName: "Acute User",
    lines,
    extCostTotal: moneyDollar(isReferencePreview ? 63 : extCost),
    extRetailTotal: moneyDollar(isReferencePreview ? 119.96 : extRetail),
    profitAmountTotal: moneyDollar(isReferencePreview ? 56.97 : profit),
    profitPercentTotal: `${isReferencePreview ? "47.49" : percent.toFixed(2)}%`,
  };
}

export type RetailInvoiceCostVarianceLine = {
  no: number;
  productItemNo: string;
  productName: string;
  supplierItemNo: string;
  newCost: string;
  previousCost: string;
  differenceAmount: string;
  differencePercent: string;
  averageCost: string;
  retailPrice: string;
};

export type RetailInvoiceCostVarianceDetail = {
  invoice: RetailInvoiceRow;
  invoiceNo: string;
  invoiceDateLabel: string;
  vendor: string;
  vendorInvoiceNo: string;
  employeeName: string;
  lines: RetailInvoiceCostVarianceLine[];
};

const COST_VARIANCE_REFERENCE_LINES: Omit<
  RetailInvoiceCostVarianceLine,
  "no"
>[] = [
  {
    productItemNo: "8015",
    productName: "30Ml Salt Nic E-Juice By Teleos Crunch 1 EA 1 PK",
    supplierItemNo: "1234",
    newCost: "9.995",
    previousCost: "10.00",
    differenceAmount: "-0.01",
    differencePercent: "-0.01",
    averageCost: "10.0000",
    retailPrice: "19.99",
  },
];

function formatCost(value: number, digits = 2) {
  return value.toFixed(digits);
}

function costVarianceLinesForInvoice(
  invoice: RetailInvoiceRow,
): RetailInvoiceCostVarianceLine[] {
  if (invoice.id === "2" && invoice.type === "OP") {
    return COST_VARIANCE_REFERENCE_LINES.map((line, index) => ({
      ...line,
      no: index + 1,
    }));
  }

  const viewLines = linesForInvoice(invoice);
  return viewLines.map((line, index) => {
    const previous = Number(line.caseCost);
    const next = Number((previous * 0.9995).toFixed(3));
    const diff = Number((next - previous).toFixed(2));
    const percent =
      previous === 0 ? 0 : Number(((diff / previous) * 100).toFixed(2));
    const average = Number(((previous + next) / 2).toFixed(4));
    const retail = Number((previous * 1.999).toFixed(2));
    return {
      no: index + 1,
      productItemNo: line.productItemNo,
      productName: line.productName,
      supplierItemNo: line.supplierItemNo,
      newCost: formatCost(next, 3),
      previousCost: formatCost(previous),
      differenceAmount: formatCost(diff),
      differencePercent: formatCost(percent),
      averageCost: formatCost(average, 4),
      retailPrice: formatCost(retail),
    };
  });
}

/** Sample cost-variance detail for list rows. Not a live store read. */
export function getRetailInvoiceCostVarianceDetail(
  id: string,
  type: string,
): RetailInvoiceCostVarianceDetail | null {
  const invoice = retailInvoices.find(
    (row) => row.id === id && row.type === type,
  );
  if (!invoice) return null;

  const isReferencePreview = invoice.id === "2" && invoice.type === "OP";
  return {
    invoice,
    invoiceNo: isReferencePreview ? "56" : invoice.id,
    invoiceDateLabel: isReferencePreview
      ? "Jun-25-2025, Wednesday"
      : formatInvoiceDateLong(invoice.date),
    vendor: invoice.supplierName,
    vendorInvoiceNo: isReferencePreview ? "5947" : invoice.supplierInvoiceNo,
    employeeName: "Acute User",
    lines: costVarianceLinesForInvoice(invoice),
  };
}

export type RetailInvoiceQtyVarianceLine = {
  no: number;
  productItemNo: string;
  productName: string;
  supplierItemNo: string;
  orderedQty: string;
  receivedQty: string;
  difference: string;
  stockInHand: string;
};

export type RetailInvoiceQtyVarianceDetail = {
  invoice: RetailInvoiceRow;
  invoiceNo: string;
  invoiceDateLabel: string;
  vendor: string;
  vendorInvoiceNo: string;
  employeeName: string;
  lines: RetailInvoiceQtyVarianceLine[];
};

const QTY_VARIANCE_REFERENCE_LINES: Omit<RetailInvoiceQtyVarianceLine, "no">[] =
  [
    {
      productItemNo: "5948",
      productName: "30ML Salt Nic E-Juice By Teleos Crunch 50Mg",
      supplierItemNo: "5948",
      orderedQty: "0U",
      receivedQty: "1U",
      difference: "-1U",
      stockInHand: "1U",
    },
  ];

function parseQtyUnits(qty: string) {
  const match = /^(-?\d+(?:\.\d+)?)U$/i.exec(qty.trim());
  return match ? Number(match[1]) : 1;
}

function qtyVarianceLinesForInvoice(
  invoice: RetailInvoiceRow,
): RetailInvoiceQtyVarianceLine[] {
  if (invoice.id === "4" && invoice.type === "RC") {
    return QTY_VARIANCE_REFERENCE_LINES.map((line, index) => ({
      ...line,
      no: index + 1,
    }));
  }

  const viewLines = linesForInvoice(invoice);
  return viewLines.map((line, index) => {
    const received = parseQtyUnits(line.qty);
    const ordered = Math.max(0, received - (index % 2 === 0 ? 1 : 0));
    const difference = ordered - received;
    return {
      no: index + 1,
      productItemNo: line.productItemNo,
      productName: line.productName,
      supplierItemNo: line.supplierItemNo,
      orderedQty: `${ordered}U`,
      receivedQty: `${received}U`,
      difference: `${difference}U`,
      stockInHand: `${received}U`,
    };
  });
}

/** Sample quantity-variance detail for list rows. Not a live store read. */
export function getRetailInvoiceQtyVarianceDetail(
  id: string,
  type: string,
): RetailInvoiceQtyVarianceDetail | null {
  const invoice = retailInvoices.find(
    (row) => row.id === id && row.type === type,
  );
  if (!invoice) return null;

  const isReferencePreview = invoice.id === "4" && invoice.type === "RC";
  return {
    invoice,
    invoiceNo: isReferencePreview ? "INV040725100326" : invoice.id,
    invoiceDateLabel: isReferencePreview
      ? "Jul-04-2025, Friday"
      : formatInvoiceDateLong(invoice.date),
    vendor: invoice.supplierName,
    vendorInvoiceNo: isReferencePreview
      ? "H.T.040725100324"
      : invoice.supplierInvoiceNo,
    employeeName: "Acute User",
    lines: qtyVarianceLinesForInvoice(invoice),
  };
}

export type RetailInvoiceLogEntry = {
  date: string;
  log: string;
};

const INVOICE_LOG_REFERENCE: RetailInvoiceLogEntry[] = [
  {
    date: "2025-06-25 02:40:45",
    log: "[Final Invoice] InvoiceNo: ltestone | User Name: Acute Acute Invoice Date: 6/25/2025 | Delivery Date: 6/25/2025 | Payment Date: 6/25/2025 PO: 2025L62576288 Invoice Note: (SupplierItemNo:1233| Invoice Added Stock :1C1U | NewCost:100.0000)",
  },
  {
    date: "2025-06-25 02:42:26",
    log: "[Invoice Payment] InvoiceNo:ltestone | User Name:Acute Acute Cash:0 | Card:108.33 | Check:0 Refrence:CardNo:123,",
  },
];

function formatShortInvoiceDate(date: CalendarDate) {
  return `${date.month}/${date.day}/${date.year}`;
}

function formatLogTimestamp(date: CalendarDate, hour: number, minute: number) {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

/** Sample invoice activity log for list rows. Not a live store read. */
export function getRetailInvoiceLogEntries(
  id: string,
  type: string,
): RetailInvoiceLogEntry[] | null {
  const invoice = retailInvoices.find(
    (row) => row.id === id && row.type === type,
  );
  if (!invoice) return null;

  if (invoice.id === "2" && invoice.type === "OP") {
    return INVOICE_LOG_REFERENCE;
  }

  const shortDate = formatShortInvoiceDate(invoice.date);
  const invoiceNo = invoice.supplierInvoiceNo;
  return [
    {
      date: formatLogTimestamp(invoice.date, 10, 15),
      log: `[Final Invoice] InvoiceNo: ${invoiceNo} | User Name: Acute User Invoice Date: ${shortDate} | Delivery Date: ${shortDate} | Payment Date: ${shortDate} PO: ${invoice.id}${invoice.type}${invoice.date.year} Invoice Note: (SupplierItemNo:${invoiceNo}| Invoice Added Stock :1C1U | NewCost:${invoice.total})`,
    },
    {
      date: formatLogTimestamp(invoice.date, 10, 18),
      log: `[Invoice Payment] InvoiceNo:${invoiceNo} | User Name:Acute User Cash:0 | Card:${invoice.total} | Check:0 Refrence:CardNo:123,`,
    },
  ];
}
