import { CalendarDate } from "@internationalized/date";

export const stations = ["All", "MJ", "MS27", "N1", "Reg1", "SM67"] as const;

export type Station = (typeof stations)[number];

export const datePresets = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this-week", label: "This Week" },
  { id: "last-week", label: "Last Week" },
  { id: "this-month", label: "This Month" },
  { id: "custom", label: "Custom" },
] as const;

export type DatePreset = (typeof datePresets)[number]["id"];

export const defaultFromDate = new CalendarDate(2026, 9, 7);
export const defaultToDate = new CalendarDate(2026, 9, 13);
export const defaultPreset: DatePreset = "last-week";
export const defaultStation: Station = "MS27";

export type ShiftRow = {
  id: string;
  shiftNo: number;
  dateLabel: string;
  dateKey: string;
  station: Exclude<Station, "All">;
};

export const shifts: ShiftRow[] = [
  {
    id: "12",
    shiftNo: 12,
    dateLabel: "Sep-10-2026 06:25 PM",
    dateKey: "2026-09-10",
    station: "MS27",
  },
  {
    id: "7",
    shiftNo: 7,
    dateLabel: "Sep-10-2026 02:53 PM",
    dateKey: "2026-09-10",
    station: "MS27",
  },
  {
    id: "4",
    shiftNo: 4,
    dateLabel: "Sep-10-2026 01:23 PM",
    dateKey: "2026-09-10",
    station: "MS27",
  },
  {
    id: "8",
    shiftNo: 8,
    dateLabel: "Sep-10-2026 03:10 PM",
    dateKey: "2026-09-10",
    station: "MJ",
  },
  {
    id: "3",
    shiftNo: 3,
    dateLabel: "Sep-09-2026 08:22 PM",
    dateKey: "2026-09-09",
    station: "MS27",
  },
  {
    id: "1",
    shiftNo: 1,
    dateLabel: "Sep-09-2026 08:02 PM",
    dateKey: "2026-09-09",
    station: "MS27",
  },
  {
    id: "5",
    shiftNo: 5,
    dateLabel: "Sep-11-2026 01:40 PM",
    dateKey: "2026-09-11",
    station: "N1",
  },
  {
    id: "9",
    shiftNo: 9,
    dateLabel: "Sep-12-2026 07:15 PM",
    dateKey: "2026-09-12",
    station: "Reg1",
  },
  {
    id: "2",
    shiftNo: 2,
    dateLabel: "Sep-08-2026 09:05 PM",
    dateKey: "2026-09-08",
    station: "SM67",
  },
];

export const shiftReportMeta = {
  title: "Shift End Report",
  businessDateLabel: "Thursday, September 10, 2026",
  station: "MS27",
  dayStart: "02:19 PM",
  dayEnd: "02:53 PM",
  printedAt: "2026-09-14 03:04 PM",
  userName: "Acute POS",
};

export const shiftSummary = [
  { label: "Net Sales", value: 228.96 },
  { label: "Total Tax", value: 13.95 },
  { label: "Total Discounts", value: -30.95 },
  { label: "Total Tips", value: 104.5 },
  { label: "Total Fees", value: 28.94 },
  { label: "Gross Sales", value: 246.9 },
  { label: "Total Refunds", value: -15.72 },
  { label: "Total Voids", value: -6.38 },
  { label: "Payments Received", value: 293.22 },
  { label: "Transactions", value: 9, kind: "count" as const },
  { label: "Total Working Hours", value: "0:34", kind: "text" as const },
];

export const shiftDepartments = [
  {
    no: 1,
    name: "Beer",
    trans: 4,
    qty: 8,
    amount: 31.45,
    discount: -5.1,
    discountPct: 14.21,
    subtotal: 26.35,
    tax: 2.36,
    total: 28.71,
    salesPct: 11.51,
  },
  {
    no: 2,
    name: "Beverages",
    trans: 1,
    qty: 9,
    amount: 26,
    discount: -0.49,
    discountPct: 1.37,
    subtotal: 25.51,
    tax: 1.52,
    total: 27.03,
    salesPct: 11.14,
  },
  {
    no: 3,
    name: "Food",
    trans: 4,
    qty: 6,
    amount: 41.96,
    discount: -4.62,
    discountPct: 12.87,
    subtotal: 37.34,
    tax: 2.24,
    total: 39.58,
    salesPct: 16.31,
  },
  {
    no: 4,
    name: "Gift Card",
    trans: 0,
    qty: 0,
    amount: 0,
    discount: 0,
    discountPct: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
    salesPct: 0,
  },
  {
    no: 5,
    name: "Liquor",
    trans: 3,
    qty: 24,
    amount: 155.44,
    discount: -23.58,
    discountPct: 65.7,
    subtotal: 131.86,
    tax: 11.82,
    total: 143.68,
    salesPct: 57.59,
  },
  {
    no: 6,
    name: "Misc",
    trans: 1,
    qty: 1,
    amount: 10,
    discount: -2.1,
    discountPct: 5.85,
    subtotal: 7.9,
    tax: 0,
    total: 7.9,
    salesPct: 3.45,
  },
];

export const shiftDepartmentTotal = {
  trans: 13,
  qty: 48,
  amount: 264.85,
  discount: -35.89,
  discountPct: 100,
  subtotal: 228.96,
  tax: 17.94,
  total: 246.9,
  salesPct: 100,
};

export const shiftCashAudit = {
  no: 1,
  shift: 2,
  employee: "Marco JACK",
  open: 50,
  sales: 92.05,
  tip: 31.5,
  close: 20,
  total: 173.55,
  cashGratuity: 17.39,
  nonCashTip: 219,
  cashTip: 31.5,
  nonCashTipWithheld: 0,
  gratuityWithheld: 0,
  owedToRest: -114.34,
  received: 267.89,
};

export const shiftCardPayments = [
  { no: 1, name: "VISA", count: 6, sale: 118.94, tip: 40, total: 158.94 },
];

export const shiftCardPaymentTotal = {
  count: 6,
  sale: 118.94,
  tip: 40,
  total: 158.94,
};

export const shiftReturnsVoids = [
  {
    no: 1,
    check: "3007",
    type: "VOID",
    tender: "Cash",
    amount: -1.7,
    by: "Marco JACK",
    approvedBy: "",
    terminal: "MS27",
  },
  {
    no: 2,
    check: "3017",
    type: "RETURN",
    tender: "Creditcard",
    amount: -4.52,
    by: "Marco JACK",
    approvedBy: "",
    terminal: "MS27",
  },
  {
    no: 3,
    check: "3019",
    type: "RETURN",
    tender: "Cash",
    amount: -11.2,
    by: "Marco JACK",
    approvedBy: "",
    terminal: "MS27",
  },
  {
    no: 4,
    check: "3035",
    type: "VOID",
    tender: "Cash",
    amount: -4.7,
    by: "Marco JACK",
    approvedBy: "",
    terminal: "MS27",
  },
];

export const shiftReturnsVoidsTotal = -22.12;

export const shiftVoidItems = [
  {
    no: 1,
    reason: "INCORRECT ITEM ORDERED",
    count: 1,
    employee: "Marco JACK",
    shift: 7,
  },
  {
    no: 2,
    reason: "ITEM NOT AVAILABLE",
    count: 1,
    employee: "Marco JACK",
    shift: 7,
  },
];

export const shiftDiscounts = [
  {
    no: 1,
    check: "3001",
    name: "Custom Discount",
    reason: "TRANSC DISC",
    before: 57.53,
    amount: -6.33,
    after: 51.2,
  },
  {
    no: 2,
    check: "3008",
    name: "Custom Discount",
    reason: "transc disc",
    before: 62.47,
    amount: -15.61,
    after: 46.86,
  },
  {
    no: 3,
    check: "3012",
    name: "Custom Discount",
    reason: "transc disc",
    before: 72.21,
    amount: -7.94,
    after: 64.27,
  },
  {
    no: 4,
    check: "3017",
    name: "Custom Discount",
    reason: "transc disc",
    before: -4.36,
    amount: 1.09,
    after: -3.27,
  },
  {
    no: 5,
    check: "3019",
    name: "Custom Discount",
    reason: "transc disc",
    before: -10.38,
    amount: 1.14,
    after: -9.24,
  },
  {
    no: 6,
    check: "3031",
    name: "Custom Discount",
    reason: "TRANSC DISC",
    before: 40.45,
    amount: -4.45,
    after: 36,
  },
  {
    no: 7,
    check: "3001",
    name: "Custom Discount",
    reason: "ITEM DISC",
    before: 10,
    amount: -1,
    after: 9,
  },
  {
    no: 8,
    check: "3008",
    name: "Custom Discount",
    reason: "itm diosc",
    before: 7.28,
    amount: -0.8,
    after: 6.48,
  },
  {
    no: 9,
    check: "3012",
    name: "Custom Discount",
    reason: "item dsic",
    before: 13.65,
    amount: -1.5,
    after: 12.15,
  },
  {
    no: 10,
    check: "3024",
    name: "Custom Discount",
    reason: "ITEM DISC",
    before: 4.47,
    amount: -0.49,
    after: 3.98,
  },
];

export const shiftDiscountTotal = {
  before: 253.32,
  amount: -35.89,
  after: 217.43,
};

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new CalendarDate(year, month, day);
}
