import { CalendarDate } from "@internationalized/date";
import type { RetailAppliedDateFilter } from "../../_components/retail-report-date-filter";

export type RetailJournalRow = {
  id: string;
  date: CalendarDate;
  dateTimeLabel: string;
  stationId: string;
  transactionNo: string;
  qty: string;
  qtyValue: number;
  discount: string;
  discountValue: number;
  subTotal: string;
  subTotalValue: number;
  tax: string;
  taxValue: number;
  deposit: string;
  depositValue: number;
  total: string;
  totalValue: number;
  paidBy: string;
  cashier: string;
};

export type RetailJournalAppliedFilter = {
  date: RetailAppliedDateFilter;
  transactionNo: string;
};

export type RetailJournalTotals = {
  qty: string;
  discount: string;
  subTotal: string;
  tax: string;
  deposit: string;
  total: string;
};

const MONEY = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function money(value: number) {
  return MONEY.format(value);
}

function row(
  partial: Omit<
    RetailJournalRow,
    | "qty"
    | "discount"
    | "subTotal"
    | "tax"
    | "deposit"
    | "total"
    | "qtyValue"
    | "discountValue"
    | "subTotalValue"
    | "taxValue"
    | "depositValue"
    | "totalValue"
  > & {
    qtyValue: number;
    discountValue: number;
    subTotalValue: number;
    taxValue: number;
    depositValue: number;
    totalValue: number;
  },
): RetailJournalRow {
  return {
    id: partial.id,
    date: partial.date,
    dateTimeLabel: partial.dateTimeLabel,
    stationId: partial.stationId,
    transactionNo: partial.transactionNo,
    qtyValue: partial.qtyValue,
    discountValue: partial.discountValue,
    subTotalValue: partial.subTotalValue,
    taxValue: partial.taxValue,
    depositValue: partial.depositValue,
    totalValue: partial.totalValue,
    qty: money(partial.qtyValue),
    discount: money(partial.discountValue),
    subTotal: money(partial.subTotalValue),
    tax: money(partial.taxValue),
    deposit: money(partial.depositValue),
    total: money(partial.totalValue),
    paidBy: partial.paidBy,
    cashier: partial.cashier,
  };
}

/** Sample journal rows for 2025. Not a live store read. */
export const retailJournalTransactions: RetailJournalRow[] = [
  row({
    id: "1",
    date: new CalendarDate(2025, 7, 8),
    dateTimeLabel: "07/08/2025 06:20 AM",
    stationId: "W22",
    transactionNo: "ACFG866202",
    qtyValue: 1,
    discountValue: 0,
    subTotalValue: 19.99,
    taxValue: 1.2,
    depositValue: 0,
    totalValue: 21.19,
    paidBy: "",
    cashier: "111",
  }),
  row({
    id: "2",
    date: new CalendarDate(2025, 7, 8),
    dateTimeLabel: "07/08/2025 06:23 AM",
    stationId: "TOBBACO",
    transactionNo: "ACFG866203",
    qtyValue: 1,
    discountValue: 0,
    subTotalValue: 3.22,
    taxValue: 0.19,
    depositValue: 0,
    totalValue: 3.41,
    paidBy: "",
    cashier: "23",
  }),
  row({
    id: "3",
    date: new CalendarDate(2025, 7, 8),
    dateTimeLabel: "07/08/2025 06:25 AM",
    stationId: "W22",
    transactionNo: "ACFG866204",
    qtyValue: 1,
    discountValue: 0,
    subTotalValue: 4.99,
    taxValue: 0.3,
    depositValue: 0,
    totalValue: 5.29,
    paidBy: "",
    cashier: "111",
  }),
  row({
    id: "4",
    date: new CalendarDate(2025, 7, 8),
    dateTimeLabel: "07/08/2025 06:28 AM",
    stationId: "TOBBACO",
    transactionNo: "ACFG866205",
    qtyValue: 3,
    discountValue: 0,
    subTotalValue: 12.5,
    taxValue: 0.75,
    depositValue: 0,
    totalValue: 13.25,
    paidBy: "Cash",
    cashier: "23",
  }),
  row({
    id: "5",
    date: new CalendarDate(2025, 7, 8),
    dateTimeLabel: "07/08/2025 07:02 AM",
    stationId: "W22",
    transactionNo: "ACFG866210",
    qtyValue: 2,
    discountValue: 1,
    subTotalValue: 18.99,
    taxValue: 1.08,
    depositValue: 0,
    totalValue: 19.07,
    paidBy: "Card",
    cashier: "111",
  }),
  row({
    id: "6",
    date: new CalendarDate(2025, 7, 9),
    dateTimeLabel: "07/09/2025 09:14 AM",
    stationId: "W22",
    transactionNo: "ACFG866301",
    qtyValue: 1,
    discountValue: 0,
    subTotalValue: 9.99,
    taxValue: 0.6,
    depositValue: 0,
    totalValue: 10.59,
    paidBy: "",
    cashier: "45",
  }),
  row({
    id: "7",
    date: new CalendarDate(2025, 7, 9),
    dateTimeLabel: "07/09/2025 11:40 AM",
    stationId: "TOBBACO",
    transactionNo: "ACFG866318",
    qtyValue: 4,
    discountValue: 0,
    subTotalValue: 27.8,
    taxValue: 1.67,
    depositValue: 0,
    totalValue: 29.47,
    paidBy: "Card",
    cashier: "23",
  }),
  row({
    id: "8",
    date: new CalendarDate(2025, 7, 10),
    dateTimeLabel: "07/10/2025 02:15 PM",
    stationId: "W22",
    transactionNo: "ACFG866402",
    qtyValue: 2,
    discountValue: 0,
    subTotalValue: 15.5,
    taxValue: 0.93,
    depositValue: 0.05,
    totalValue: 16.48,
    paidBy: "Cash",
    cashier: "111",
  }),
  row({
    id: "9",
    date: new CalendarDate(2025, 7, 12),
    dateTimeLabel: "07/12/2025 08:05 AM",
    stationId: "TOBBACO",
    transactionNo: "ACFG866510",
    qtyValue: 1,
    discountValue: 0,
    subTotalValue: 6.49,
    taxValue: 0.39,
    depositValue: 0,
    totalValue: 6.88,
    paidBy: "",
    cashier: "23",
  }),
  row({
    id: "10",
    date: new CalendarDate(2025, 7, 15),
    dateTimeLabel: "07/15/2025 05:55 PM",
    stationId: "W22",
    transactionNo: "ACFG866620",
    qtyValue: 5,
    discountValue: 2.5,
    subTotalValue: 42.25,
    taxValue: 2.39,
    depositValue: 0,
    totalValue: 42.14,
    paidBy: "Card",
    cashier: "45",
  }),
  row({
    id: "11",
    date: new CalendarDate(2025, 7, 18),
    dateTimeLabel: "07/18/2025 12:22 PM",
    stationId: "TOBBACO",
    transactionNo: "ACFG866701",
    qtyValue: 2,
    discountValue: 0,
    subTotalValue: 11.98,
    taxValue: 0.72,
    depositValue: 0,
    totalValue: 12.7,
    paidBy: "",
    cashier: "23",
  }),
  row({
    id: "12",
    date: new CalendarDate(2025, 7, 22),
    dateTimeLabel: "07/22/2025 04:48 PM",
    stationId: "W22",
    transactionNo: "ACFG866812",
    qtyValue: 1,
    discountValue: 0,
    subTotalValue: 24.99,
    taxValue: 1.5,
    depositValue: 0,
    totalValue: 26.49,
    paidBy: "Card",
    cashier: "111",
  }),
  row({
    id: "13",
    date: new CalendarDate(2025, 7, 25),
    dateTimeLabel: "07/25/2025 10:11 AM",
    stationId: "TOBBACO",
    transactionNo: "ACFG866901",
    qtyValue: 3,
    discountValue: 0,
    subTotalValue: 8.97,
    taxValue: 0.54,
    depositValue: 0,
    totalValue: 9.51,
    paidBy: "Cash",
    cashier: "23",
  }),
  row({
    id: "14",
    date: new CalendarDate(2025, 7, 28),
    dateTimeLabel: "07/28/2025 07:33 PM",
    stationId: "W22",
    transactionNo: "ACFG867010",
    qtyValue: 2,
    discountValue: 0,
    subTotalValue: 14.5,
    taxValue: 0.87,
    depositValue: 0,
    totalValue: 15.37,
    paidBy: "",
    cashier: "45",
  }),
  row({
    id: "15",
    date: new CalendarDate(2025, 7, 30),
    dateTimeLabel: "07/30/2025 03:09 PM",
    stationId: "TOBBACO",
    transactionNo: "ACFG867120",
    qtyValue: 1,
    discountValue: 0,
    subTotalValue: 7.25,
    taxValue: 0.44,
    depositValue: 0,
    totalValue: 7.69,
    paidBy: "Card",
    cashier: "23",
  }),
];

function dateBounds(filter: RetailAppliedDateFilter) {
  if (filter.kind === "single") return { from: filter.date, to: filter.date };
  const from = filter.from.compare(filter.to) <= 0 ? filter.from : filter.to;
  const to = filter.from.compare(filter.to) <= 0 ? filter.to : filter.from;
  return { from, to };
}

export function filterRetailJournalTransactions(
  rows: RetailJournalRow[],
  filter: RetailJournalAppliedFilter,
) {
  const { from, to } = dateBounds(filter.date);
  const transactionNo = filter.transactionNo.trim().toLowerCase();

  return rows.filter((row) => {
    if (row.date.compare(from) < 0 || row.date.compare(to) > 0) return false;
    if (
      transactionNo &&
      !row.transactionNo.toLowerCase().includes(transactionNo)
    ) {
      return false;
    }
    return true;
  });
}

export function sumRetailJournalRows(rows: RetailJournalRow[]): RetailJournalTotals {
  const qty = rows.reduce((sum, row) => sum + row.qtyValue, 0);
  const discount = rows.reduce((sum, row) => sum + row.discountValue, 0);
  const subTotal = rows.reduce((sum, row) => sum + row.subTotalValue, 0);
  const tax = rows.reduce((sum, row) => sum + row.taxValue, 0);
  const deposit = rows.reduce((sum, row) => sum + row.depositValue, 0);
  const total = rows.reduce((sum, row) => sum + row.totalValue, 0);
  return {
    qty: money(qty),
    discount: money(discount),
    subTotal: money(subTotal),
    tax: money(tax),
    deposit: money(deposit),
    total: money(total),
  };
}

export function formatJournalRangeLabel(filter: RetailAppliedDateFilter) {
  const { from, to } = dateBounds(filter);
  const fmt = (date: CalendarDate) => {
    const month = String(date.month).padStart(2, "0");
    const day = String(date.day).padStart(2, "0");
    return `${month}-${day}-${date.year}`;
  };
  return `DATE: ${fmt(from)} TO DATE: ${fmt(to)}`;
}

export function formatJournalPrintedAt(date: Date) {
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

export function serializeRetailJournalFilter(
  filter: RetailJournalAppliedFilter,
): string {
  const params = new URLSearchParams();
  if (filter.date.kind === "single") {
    params.set("kind", "single");
    params.set("date", filter.date.date.toString());
  } else {
    const { from, to } = dateBounds(filter.date);
    params.set("kind", "range");
    params.set("from", from.toString());
    params.set("to", to.toString());
  }
  if (filter.transactionNo.trim()) {
    params.set("transactionNo", filter.transactionNo.trim());
  }
  return params.toString();
}

export function parseRetailJournalFilter(
  searchParams: URLSearchParams,
): RetailJournalAppliedFilter | null {
  const kind = searchParams.get("kind");
  let date: RetailAppliedDateFilter | null = null;
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
  return {
    date,
    transactionNo: searchParams.get("transactionNo") ?? "",
  };
}

export function transactionJournalListHref(query: string) {
  return query
    ? `/report/transaction-journal?${query}`
    : "/report/transaction-journal";
}

export type RetailJournalLine = {
  quantity: string;
  itemNo: string;
  productName: string;
  retail: string;
  discount: string;
  amount: string;
  tax: string;
  deposit: string;
  total: string;
};

export type RetailJournalCardDetail = {
  authCode: string;
  card: string;
  reference: string;
  dateTime: string;
  amount: string;
  transactionType: string;
};

export type RetailJournalPaidBy = {
  cash: string;
  check: string;
  card: string;
  giftCard: string;
  storeCreditCard: string;
  foodStamp: string;
  ebt: string;
  voucher: string;
  account: string;
  papodw2: string;
};

export type RetailJournalDetail = {
  transaction: RetailJournalRow;
  lines: RetailJournalLine[];
  lineTotals: {
    discount: string;
    amount: string;
    tax: string;
    deposit: string;
    total: string;
  };
  cardDetail: RetailJournalCardDetail;
  paidBy: RetailJournalPaidBy;
};

const REFERENCE_LINES: RetailJournalLine[] = [
  {
    quantity: "1",
    itemNo: "7726",
    productName: "Adalya Hookah Tobacco | 250 Gram Angel Lips 1 EA @ $19.99",
    retail: "19.99",
    discount: "0.00",
    amount: "19.99",
    tax: "1.20",
    deposit: "0.00",
    total: "21.19",
  },
];

const PRINT_SAMPLE_CATALOG: Array<Omit<RetailJournalLine, "quantity">> = [
  {
    itemNo: "8009",
    productName: "Master Pro Master Btl 1EA 10 PK @ $110.00",
    retail: "110.00",
    discount: "0.00",
    amount: "110.00",
    tax: "6.60",
    deposit: "0.00",
    total: "116.60",
  },
  {
    itemNo: "8010",
    productName: "Master Pro Master Btl 1EA 10 PK @ $110.00",
    retail: "110.00",
    discount: "0.00",
    amount: "110.00",
    tax: "6.60",
    deposit: "0.00",
    total: "116.60",
  },
  {
    itemNo: "8011",
    productName: "Master Pro Master Btl 1EA 10 PK @ $110.00",
    retail: "110.00",
    discount: "0.00",
    amount: "110.00",
    tax: "6.60",
    deposit: "0.00",
    total: "116.60",
  },
  {
    itemNo: "5947",
    productName: "3CHI Delta 8 Cartridges Watermelon Kush 1G 1 EA 1 PK @ $19.99",
    retail: "19.99",
    discount: "0.00",
    amount: "19.99",
    tax: "1.20",
    deposit: "0.00",
    total: "21.19",
  },
  {
    itemNo: "6330",
    productName: "3CHI Delta 8 Cartridges Pineapple Express 1G 1 EA 1 PK @ $19.99",
    retail: "19.99",
    discount: "0.00",
    amount: "19.99",
    tax: "1.20",
    deposit: "0.00",
    total: "21.19",
  },
];

function cardDateTimeNear(label: string) {
  // Soften transaction clock by one minute for card auth preview.
  const match =
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i.exec(label);
  if (!match) return label;
  const month = match[1];
  const day = match[2];
  const year = match[3];
  const hour = Number(match[4]);
  const minute = Math.max(0, Number(match[5]) - 1);
  const meridiem = match[6].toUpperCase();
  return `${month}/${day}/${year} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:34 ${meridiem}`;
}

function sumLines(lines: RetailJournalLine[]) {
  return {
    retail: money(lines.reduce((sum, line) => sum + Number(line.retail), 0)),
    discount: money(
      lines.reduce((sum, line) => sum + Number(line.discount), 0),
    ),
    amount: money(lines.reduce((sum, line) => sum + Number(line.amount), 0)),
    tax: money(lines.reduce((sum, line) => sum + Number(line.tax), 0)),
    deposit: money(lines.reduce((sum, line) => sum + Number(line.deposit), 0)),
    total: money(lines.reduce((sum, line) => sum + Number(line.total), 0)),
  };
}

function linesForJournalTransaction(
  transaction: RetailJournalRow,
): RetailJournalLine[] {
  if (transaction.id === "1") return REFERENCE_LINES;

  const seed = Number(transaction.id) || 1;
  const count = Math.min(
    PRINT_SAMPLE_CATALOG.length,
    Math.max(1, Math.round(transaction.qtyValue)),
  );
  const start = (seed - 1) % PRINT_SAMPLE_CATALOG.length;
  const lines: RetailJournalLine[] = [];
  for (let index = 0; index < count; index += 1) {
    const sample =
      PRINT_SAMPLE_CATALOG[(start + index) % PRINT_SAMPLE_CATALOG.length];
    lines.push({
      quantity: "1",
      ...sample,
    });
  }

  if (seed % 4 === 0) {
    lines.push({
      quantity: "",
      itemNo: "",
      productName: "Promo Discount",
      retail: "0.00",
      discount: money(Math.min(5, transaction.discountValue || 1)),
      amount: money(-(Math.min(5, transaction.discountValue || 1))),
      tax: "0.00",
      deposit: "0.00",
      total: money(-(Math.min(5, transaction.discountValue || 1))),
    });
  }

  return lines;
}

export type RetailJournalPrintGroup = {
  transaction: RetailJournalRow;
  lines: RetailJournalLine[];
  subtotal: {
    retail: string;
    discount: string;
    amount: string;
    tax: string;
    deposit: string;
    total: string;
  };
};

/** Sample grouped line detail for print-detail view. Not a live store read. */
export function getRetailJournalPrintGroups(
  filter: RetailJournalAppliedFilter,
): RetailJournalPrintGroup[] {
  return filterRetailJournalTransactions(retailJournalTransactions, filter).map(
    (transaction) => {
      const lines = linesForJournalTransaction(transaction);
      return {
        transaction,
        lines,
        subtotal: sumLines(lines),
      };
    },
  );
}

export function formatJournalPrintRangeLabel(filter: RetailAppliedDateFilter) {
  const { from, to } = dateBounds(filter);
  const fmt = (date: CalendarDate) => {
    const month = String(date.month).padStart(2, "0");
    const day = String(date.day).padStart(2, "0");
    return `${date.year}-${month}-${day}`;
  };
  return `DATE: ${fmt(from)} TO DATE: ${fmt(to)}`;
}

/** Sample transaction journal detail for list rows. Not a live store read. */
export function getRetailJournalDetail(
  id: string,
): RetailJournalDetail | null {
  const transaction = retailJournalTransactions.find((row) => row.id === id);
  if (!transaction) return null;

  const isReference = transaction.id === "1";
  const lines = linesForJournalTransaction(transaction);
  const totals = sumLines(lines);

  const cardAmount = isReference
    ? 5
    : Number((transaction.totalValue * 0.25).toFixed(2));
  const checkAmount = Number((transaction.totalValue - cardAmount).toFixed(2));

  return {
    transaction,
    lines,
    lineTotals: {
      discount: isReference ? "0.00" : totals.discount,
      amount: isReference ? "19.99" : totals.amount,
      tax: isReference ? "1.20" : totals.tax,
      deposit: isReference ? "0.00" : totals.deposit,
      total: isReference ? "21.19" : totals.total,
    },
    cardDetail: {
      authCode: "",
      card: "CreditCard -",
      reference: "",
      dateTime: isReference
        ? "07/08/2025 06:19:34 AM"
        : cardDateTimeNear(transaction.dateTimeLabel),
      amount: isReference ? "5" : String(cardAmount),
      transactionType: "Ext-Pay",
    },
    paidBy: {
      cash: "0.00",
      check: money(isReference ? 16.19 : checkAmount),
      card: money(isReference ? 5 : cardAmount),
      giftCard: "0.00",
      storeCreditCard: "0.00",
      foodStamp: "0.00",
      ebt: "0.00",
      voucher: "0.00",
      account: "0.00",
      papodw2: "0.00",
    },
  };
}
