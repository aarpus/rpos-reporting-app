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
