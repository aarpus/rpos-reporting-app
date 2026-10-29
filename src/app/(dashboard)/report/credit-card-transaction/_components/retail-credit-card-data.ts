import { CalendarDate } from "@internationalized/date";

export type RetailCardTransaction = {
  id: string;
  dateLabel: string;
  date: CalendarDate;
  cardName: string;
  cardNumber: string;
  result: string;
  amount: string;
  amountValue: number;
  authCode: string;
  stationName: string;
  kind: "credit" | "debit";
};

export type RetailExternalPayTransaction = {
  id: string;
  dateLabel: string;
  date: CalendarDate;
  type: string;
  amount: string;
  amountValue: number;
  stationName: string;
};

export type RetailCardSummaryRow = {
  label: string;
  count: string;
  amount: string;
};

export type RetailCardBrandRow = {
  group: string;
  name: string;
  count: string;
  amount: string;
  isSubtotal?: boolean;
  isTotal?: boolean;
};

/** Sample card transactions for Apr–Aug 2025. Not a live store read. */
export const retailCardTransactions: RetailCardTransaction[] = [
  {
    id: "1",
    dateLabel: "2025-04-08 14:45:34",
    date: new CalendarDate(2025, 4, 8),
    cardName: "OTHER",
    cardNumber: "***********5426",
    result: "OK",
    amount: "132.00",
    amountValue: 132,
    authCode: "000000",
    stationName: "NRS13",
    kind: "credit",
  },
  {
    id: "2",
    dateLabel: "2025-04-08 15:12:08",
    date: new CalendarDate(2025, 4, 8),
    cardName: "AMEX",
    cardNumber: "***********1005",
    result: "OK",
    amount: "45.50",
    amountValue: 45.5,
    authCode: "824701",
    stationName: "NRS13",
    kind: "credit",
  },
  {
    id: "3",
    dateLabel: "2025-04-15 11:20:44",
    date: new CalendarDate(2025, 4, 15),
    cardName: "VISA",
    cardNumber: "***********4412",
    result: "OK",
    amount: "28.75",
    amountValue: 28.75,
    authCode: "551902",
    stationName: "Tobbaco",
    kind: "debit",
  },
  {
    id: "4",
    dateLabel: "2025-05-02 16:05:19",
    date: new CalendarDate(2025, 5, 2),
    cardName: "OTHER",
    cardNumber: "***********5426",
    result: "OK",
    amount: "63.59",
    amountValue: 63.59,
    authCode: "000000",
    stationName: "NRS13",
    kind: "credit",
  },
  {
    id: "5",
    dateLabel: "2025-05-18 13:41:02",
    date: new CalendarDate(2025, 5, 18),
    cardName: "",
    cardNumber: "***********7781",
    result: "OK",
    amount: "-1.00",
    amountValue: -1,
    authCode: "112033",
    stationName: "Tobbaco",
    kind: "debit",
  },
  {
    id: "6",
    dateLabel: "2025-06-04 10:18:55",
    date: new CalendarDate(2025, 6, 4),
    cardName: "VISA",
    cardNumber: "***********4412",
    result: "OK",
    amount: "19.99",
    amountValue: 19.99,
    authCode: "660214",
    stationName: "Tobbaco",
    kind: "debit",
  },
  {
    id: "7",
    dateLabel: "2025-06-21 17:33:41",
    date: new CalendarDate(2025, 6, 21),
    cardName: "AMEX",
    cardNumber: "***********1005",
    result: "OK",
    amount: "88.40",
    amountValue: 88.4,
    authCode: "903311",
    stationName: "NRS13",
    kind: "credit",
  },
  {
    id: "8",
    dateLabel: "2025-07-09 12:09:27",
    date: new CalendarDate(2025, 7, 9),
    cardName: "OTHER",
    cardNumber: "***********5426",
    result: "OK",
    amount: "56.66",
    amountValue: 56.66,
    authCode: "000000",
    stationName: "NRS13",
    kind: "credit",
  },
  {
    id: "9",
    dateLabel: "2025-07-16 18:22:10",
    date: new CalendarDate(2025, 7, 16),
    cardName: "VISA",
    cardNumber: "***********8890",
    result: "OK",
    amount: "42.18",
    amountValue: 42.18,
    authCode: "774120",
    stationName: "Tobbaco",
    kind: "debit",
  },
  {
    id: "10",
    dateLabel: "2025-07-28 09:55:03",
    date: new CalendarDate(2025, 7, 28),
    cardName: "AMEX",
    cardNumber: "***********1005",
    result: "OK",
    amount: "120.00",
    amountValue: 120,
    authCode: "448201",
    stationName: "NRS13",
    kind: "credit",
  },
  {
    id: "11",
    dateLabel: "2025-08-12 14:07:36",
    date: new CalendarDate(2025, 8, 12),
    cardName: "OTHER",
    cardNumber: "***********5426",
    result: "OK",
    amount: "75.25",
    amountValue: 75.25,
    authCode: "000000",
    stationName: "Tobbaco",
    kind: "credit",
  },
  {
    id: "12",
    dateLabel: "2025-08-25 19:40:58",
    date: new CalendarDate(2025, 8, 25),
    cardName: "VISA",
    cardNumber: "***********4412",
    result: "OK",
    amount: "33.10",
    amountValue: 33.1,
    authCode: "215608",
    stationName: "Tobbaco",
    kind: "debit",
  },
];

/** Sample external-pay rows for the detail report. Not a live store read. */
export const retailExternalPayTransactions: RetailExternalPayTransaction[] = [
  {
    id: "e1",
    dateLabel: "2025-06-24 11:15:22",
    date: new CalendarDate(2025, 6, 24),
    type: "ExternalPay",
    amount: "85.00",
    amountValue: 85,
    stationName: "24Jun25",
  },
  {
    id: "e2",
    dateLabel: "2025-07-03 16:48:09",
    date: new CalendarDate(2025, 7, 3),
    type: "ExternalPay",
    amount: "72.40",
    amountValue: 72.4,
    stationName: "TOBBACO",
  },
  {
    id: "e3",
    dateLabel: "2025-07-19 13:02:51",
    date: new CalendarDate(2025, 7, 19),
    type: "ExternalPay",
    amount: "48.24",
    amountValue: 48.24,
    stationName: "W22",
  },
  {
    id: "e4",
    dateLabel: "2025-08-08 10:27:14",
    date: new CalendarDate(2025, 8, 8),
    type: "ExternalPay",
    amount: "30.00",
    amountValue: 30,
    stationName: "TOBBACO",
  },
];

function money(value: number) {
  const formatted = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-${formatted}` : formatted;
}

function moneySigned(value: number) {
  const formatted = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function filterCardTransactions(
  rows: RetailCardTransaction[],
  from: CalendarDate,
  to: CalendarDate,
) {
  return rows.filter(
    (row) => row.date.compare(from) >= 0 && row.date.compare(to) <= 0,
  );
}

export function filterExternalPayTransactions(
  rows: RetailExternalPayTransaction[],
  from: CalendarDate,
  to: CalendarDate,
) {
  return rows.filter(
    (row) => row.date.compare(from) >= 0 && row.date.compare(to) <= 0,
  );
}

export function cardTypeSummary(
  rows: RetailCardTransaction[],
): RetailCardSummaryRow[] {
  const credit = rows.filter((row) => row.kind === "credit");
  const debit = rows.filter((row) => row.kind === "debit");
  const creditAmount = credit.reduce((sum, row) => sum + row.amountValue, 0);
  const debitAmount = debit.reduce((sum, row) => sum + row.amountValue, 0);
  return [
    {
      label: "CreditCard",
      count: String(credit.length),
      amount: money(creditAmount),
    },
    {
      label: "DebitCard",
      count: String(debit.length),
      amount: money(debitAmount),
    },
    {
      label: "Total",
      count: String(rows.length),
      amount: money(creditAmount + debitAmount),
    },
  ];
}

export function cardTerminalSummary(
  rows: RetailCardTransaction[],
): RetailCardSummaryRow[] {
  const stations = new Map<string, { count: number; amount: number }>();
  for (const row of rows) {
    const current = stations.get(row.stationName) ?? { count: 0, amount: 0 };
    current.count += 1;
    current.amount += row.amountValue;
    stations.set(row.stationName, current);
  }
  const list = [...stations.entries()].map(([label, value]) => ({
    label,
    count: String(value.count),
    amount: money(value.amount),
  }));
  const totalAmount = rows.reduce((sum, row) => sum + row.amountValue, 0);
  list.push({
    label: "Total",
    count: String(rows.length),
    amount: money(totalAmount),
  });
  return list;
}

export function cardBrandSummary(
  rows: RetailCardTransaction[],
): RetailCardBrandRow[] {
  function groupRows(kind: "credit" | "debit", groupLabel: string) {
    const subset = rows.filter((row) => row.kind === kind);
    const brands = new Map<string, { count: number; amount: number }>();
    for (const row of subset) {
      const name = row.cardName.trim() || "OTHER";
      const current = brands.get(name) ?? { count: 0, amount: 0 };
      current.count += 1;
      current.amount += row.amountValue;
      brands.set(name, current);
    }
    const result: RetailCardBrandRow[] = [...brands.entries()].map(
      ([name, value]) => ({
        group: groupLabel,
        name,
        count: String(value.count),
        amount: money(value.amount),
      }),
    );
    const subtotal = subset.reduce((sum, row) => sum + row.amountValue, 0);
    result.push({
      group: groupLabel,
      name: "SubTotal",
      count: String(subset.length),
      amount: money(subtotal),
      isSubtotal: true,
    });
    return result;
  }

  const credit = groupRows("credit", "Credit Card");
  const debit = groupRows("debit", "Debit Card");
  const totalAmount = rows.reduce((sum, row) => sum + row.amountValue, 0);
  return [
    ...credit,
    ...debit,
    {
      group: "",
      name: "Total",
      count: String(rows.length),
      amount: money(totalAmount),
      isTotal: true,
    },
  ];
}

export function externalPayTypeSummary(
  rows: RetailExternalPayTransaction[],
): RetailCardSummaryRow[] {
  const amount = rows.reduce((sum, row) => sum + row.amountValue, 0);
  return [
    {
      label: "ExternalPay",
      count: String(rows.length),
      amount: money(amount),
    },
    {
      label: "Total",
      count: String(rows.length),
      amount: money(amount),
    },
  ];
}

export function externalPayTerminalSummary(
  rows: RetailExternalPayTransaction[],
): RetailCardSummaryRow[] {
  const stations = new Map<string, { count: number; amount: number }>();
  for (const row of rows) {
    const current = stations.get(row.stationName) ?? { count: 0, amount: 0 };
    current.count += 1;
    current.amount += row.amountValue;
    stations.set(row.stationName, current);
  }
  const list = [...stations.entries()].map(([label, value]) => ({
    label,
    count: String(value.count),
    amount: money(value.amount),
  }));
  const totalAmount = rows.reduce((sum, row) => sum + row.amountValue, 0);
  list.push({
    label: "Total",
    count: String(rows.length),
    amount: money(totalAmount),
  });
  return list;
}

export function externalPayTotalAmount(rows: RetailExternalPayTransaction[]) {
  return moneySigned(rows.reduce((sum, row) => sum + row.amountValue, 0));
}
