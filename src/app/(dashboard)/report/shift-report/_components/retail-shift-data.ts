import { CalendarDate } from "@internationalized/date";

export type RetailShiftStatus = "Close" | "Open";

export type RetailShiftRow = {
  id: string;
  startLabel: string;
  endLabel: string;
  start: CalendarDate;
  end: CalendarDate;
  terminal: string;
  batch: number;
  shift: number;
  status: RetailShiftStatus;
};

export type RetailShiftLine = {
  label: string;
  value: string;
  emphasize?: boolean;
  divider?: boolean;
};

export type RetailShiftDetail = {
  employeeName: string;
  employeeId: string;
  sales: RetailShiftLine[];
  taxes: RetailShiftLine[];
  payments: RetailShiftLine[];
  miscellaneous: RetailShiftLine[];
  cashStatus: RetailShiftLine[];
};

/** Sample preview rows for the retail shift list. Not a live store read. */
export const retailShifts: RetailShiftRow[] = [
  {
    id: "6",
    startLabel: "Jul-16-2025 07:15:39 PM",
    endLabel: "Jul-16-2025 07:20:12 PM",
    start: new CalendarDate(2025, 7, 16),
    end: new CalendarDate(2025, 7, 16),
    terminal: "Ripsma10",
    batch: 5,
    shift: 6,
    status: "Close",
  },
  {
    id: "5",
    startLabel: "Jul-16-2025 05:42:43 PM",
    endLabel: "Jul-16-2025 07:15:01 PM",
    start: new CalendarDate(2025, 7, 16),
    end: new CalendarDate(2025, 7, 16),
    terminal: "Ripsma10",
    batch: 4,
    shift: 5,
    status: "Close",
  },
  {
    id: "4",
    startLabel: "Jul-16-2025 03:24:05 PM",
    endLabel: "Jul-16-2025 07:14:50 PM",
    start: new CalendarDate(2025, 7, 16),
    end: new CalendarDate(2025, 7, 16),
    terminal: "TS",
    batch: 4,
    shift: 4,
    status: "Close",
  },
  {
    id: "3",
    startLabel: "Jul-15-2025 04:04:52 PM",
    endLabel: "Jul-16-2025 03:22:54 PM",
    start: new CalendarDate(2025, 7, 15),
    end: new CalendarDate(2025, 7, 16),
    terminal: "TS",
    batch: 3,
    shift: 3,
    status: "Close",
  },
  {
    id: "2",
    startLabel: "Jul-15-2025 03:02:42 PM",
    endLabel: "Jul-16-2025 03:22:38 PM",
    start: new CalendarDate(2025, 7, 15),
    end: new CalendarDate(2025, 7, 16),
    terminal: "Ripsma10",
    batch: 3,
    shift: 2,
    status: "Close",
  },
  {
    id: "1",
    startLabel: "Jul-14-2025 02:20:10 PM",
    endLabel: "Jul-15-2025 03:02:18 PM",
    start: new CalendarDate(2025, 7, 14),
    end: new CalendarDate(2025, 7, 15),
    terminal: "Ripsma10",
    batch: 2,
    shift: 1,
    status: "Close",
  },
];

const salesLabels = [
  "Beer",
  "GiftCard",
  "Net Sales Amount",
  "Discount",
  "Tax Paid",
  "Gross Sales Amount",
  "Total Transactions",
];
const taxLabels = ["Cgst", "Liquor Tax", "Total"];
const paymentLabels = [
  "Cash",
  "Check",
  "Account",
  "CreditCard",
  "DebitCard",
  "Gift Card",
  "ExternalPay",
  "Store Credit",
  "FoodStamp",
  "EBT",
  "Voucher",
  "Total",
  "Deposit Amount",
];
const miscellaneousLabels = [
  "No Sale Hit Count",
  "Void Items Count",
  "Void Amount",
  "Return Items Count",
  "Return Amount Tax",
  "Return Amount",
];
const cashLabels = [
  "Opening Balance",
  "Cash In Sales",
  "Cash In Received",
  "Cash Out Paid",
  "Cash In Paid",
  "Cash Out Transfer",
  "Expected Cash",
  "Available Cash",
  "Status",
  "Difference",
];

const emphasized = new Set([
  "Net Sales Amount",
  "Discount",
  "Tax Paid",
  "Gross Sales Amount",
  "Total Transactions",
  "Total",
  "Deposit Amount",
  "Difference",
]);

const divided = new Set(["Net Sales Amount", "Total", "Deposit Amount", "Difference"]);

function lines(labels: string[], values: string[]): RetailShiftLine[] {
  return labels.map((label, index) => ({
    label,
    value: values[index] ?? "",
    emphasize: emphasized.has(label),
    divider: divided.has(label),
  }));
}

function detail(
  employeeName: string,
  employeeId: string,
  sales: string[],
  taxes: string[],
  payments: string[],
  miscellaneous: string[],
  cashStatus: string[],
): RetailShiftDetail {
  return {
    employeeName,
    employeeId,
    sales: lines(salesLabels, sales),
    taxes: lines(taxLabels, taxes),
    payments: lines(paymentLabels, payments),
    miscellaneous: lines(miscellaneousLabels, miscellaneous),
    cashStatus: lines(cashLabels, cashStatus),
  };
}

const zeroTenders = ["0.00", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00"];

/** Sample shift-detail figures. Not a live store read. */
const shiftDetails: Record<string, RetailShiftDetail> = {
  "6": detail(
    "Acute User",
    "111",
    ["520.00", "0.00", "520.00", "80.00", "46.80", "566.80", "6"],
    ["0.00", "46.80", "46.80"],
    ["351.85", ...zeroTenders, "351.85", "0.00"],
    ["0", "0", "0.00", "0", "0.00", "0.00"],
    ["23.23", "351.85", "0.00", "0.00", "0.00", "0.00", "535.53", "10.40", "SHORT", "-525.13"],
  ),
  "5": detail(
    "Acute User",
    "111",
    ["186.40", "25.00", "211.40", "12.00", "18.75", "218.15", "4"],
    ["4.20", "14.55", "18.75"],
    ["160.15", ...zeroTenders, "160.15", "0.00"],
    ["1", "0", "0.00", "0", "0.00", "0.00"],
    ["40.00", "160.15", "0.00", "0.00", "0.00", "0.00", "200.15", "198.40", "SHORT", "-1.75"],
  ),
  "4": detail(
    "Priya Shah",
    "118",
    ["96.00", "0.00", "96.00", "0.00", "8.64", "104.64", "2"],
    ["8.64", "0.00", "8.64"],
    ["104.64", ...zeroTenders, "104.64", "0.00"],
    ["0", "1", "6.50", "0", "0.00", "0.00"],
    ["75.00", "104.64", "20.00", "0.00", "0.00", "0.00", "199.64", "199.64", "OK", "0.00"],
  ),
  "3": detail(
    "Priya Shah",
    "118",
    ["310.25", "0.00", "310.25", "15.00", "27.90", "323.15", "5"],
    ["0.00", "27.90", "27.90"],
    ["200.00", "0.00", "0.00", "123.15", ...zeroTenders.slice(0, 7), "323.15", "0.00"],
    ["0", "0", "0.00", "1", "2.40", "18.00"],
    ["50.00", "200.00", "0.00", "18.00", "0.00", "0.00", "232.00", "240.50", "OVER", "8.50"],
  ),
  "2": detail(
    "Acute User",
    "111",
    ["74.50", "0.00", "74.50", "0.00", "6.71", "81.21", "1"],
    ["6.71", "0.00", "6.71"],
    ["81.21", ...zeroTenders, "81.21", "10.00"],
    ["0", "0", "0.00", "0", "0.00", "0.00"],
    ["15.00", "81.21", "0.00", "0.00", "0.00", "0.00", "96.21", "96.21", "OK", "0.00"],
  ),
  "1": detail(
    "Acute User",
    "111",
    ["42.00", "0.00", "42.00", "2.00", "3.78", "43.78", "1"],
    ["3.78", "0.00", "3.78"],
    ["43.78", ...zeroTenders, "43.78", "0.00"],
    ["2", "0", "0.00", "0", "0.00", "0.00"],
    ["100.00", "43.78", "0.00", "0.00", "0.00", "0.00", "143.78", "143.78", "OK", "0.00"],
  ),
};

const monthIndex: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function parseShiftStamp(label: string) {
  const match = label.match(
    /^([A-Za-z]{3})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2}) (AM|PM)$/,
  );
  if (!match) return null;
  const [, month, day, year, hourText, minute, second, meridiem] = match;
  const monthNumber = monthIndex[month];
  if (monthNumber === undefined) return null;
  let hour = Number(hourText) % 12;
  if (meridiem === "PM") hour += 12;
  return new Date(
    Number(year),
    monthNumber,
    Number(day),
    hour,
    Number(minute),
    Number(second),
  );
}

export function shiftDurationLabel(startLabel: string, endLabel: string) {
  const start = parseShiftStamp(startLabel);
  const end = parseShiftStamp(endLabel);
  if (!start || !end) return "";
  const totalSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function retailShiftDetail(id: string) {
  return shiftDetails[id] ?? null;
}

const titleMonths = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function shiftTitleDate(date: CalendarDate) {
  const month = titleMonths[date.month - 1] ?? "";
  return `${month}-${String(date.day).padStart(2, "0")}-${date.year}`;
}
