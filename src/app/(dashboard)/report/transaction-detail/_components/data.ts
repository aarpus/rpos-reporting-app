import { CalendarDate } from "@internationalized/date";

export const datePresets = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this-week", label: "This Week" },
  { id: "last-week", label: "Last Week" },
  { id: "this-month", label: "This Month" },
  { id: "custom", label: "Custom" },
] as const;

export type DatePreset = (typeof datePresets)[number]["id"];

export const paidByOptions = [
  { id: "all", label: "All" },
  { id: "cash", label: "Cash" },
  { id: "credit-card", label: "Credit Card" },
  { id: "external-pay", label: "External Pay" },
  { id: "gift-card", label: "Gift Card" },
] as const;

export const employeeOptions = [
  { id: "all", label: "All" },
  { id: "marco-jack", label: "Marco JACK" },
  { id: "mahir", label: "Mahir" },
] as const;

export const departmentOptions = [
  { id: "all", label: "All" },
  { id: "beer", label: "Beer" },
  { id: "beverages", label: "Beverages" },
  { id: "food", label: "Food" },
  { id: "liquor", label: "Liquor" },
  { id: "misc", label: "Misc" },
] as const;

export const transactionTypeOptions = [
  { id: "all", label: "All" },
  { id: "PAID", label: "PAID" },
  { id: "RETURN", label: "RETURN" },
  { id: "VOID", label: "VOID" },
] as const;

export const reportByOptions = [
  { id: "batchwise", label: "Batchwise" },
  { id: "transaction", label: "Transaction" },
  { id: "daily", label: "Daily" },
] as const;

export const pageSizeOptions = [
  { id: "10", label: "10" },
  { id: "20", label: "20" },
  { id: "50", label: "50" },
] as const;

export type PaidById = (typeof paidByOptions)[number]["id"];
export type EmployeeId = (typeof employeeOptions)[number]["id"];
export type DepartmentId = (typeof departmentOptions)[number]["id"];
export type TransTypeId = (typeof transactionTypeOptions)[number]["id"];
export type ReportById = (typeof reportByOptions)[number]["id"];
export type TransType = Exclude<TransTypeId, "all">;

export type TransactionItem = {
  name: string;
  sku: string;
  qty: number;
  amount: number;
};

export type TransactionPayment = {
  method: string;
  amount: number;
};

export type Transaction = {
  id: string;
  checkNo: string;
  dateTime: string;
  dateKey: string;
  subtotal: number;
  tax: number;
  discount: number;
  gratuity: number;
  fees: number;
  tips: number;
  total: number;
  paidBy: string;
  paidByKeys: Exclude<PaidById, "all">[];
  terminal: string;
  cashier: string;
  employeeId: Exclude<EmployeeId, "all">;
  transType: TransType;
  creditCard: string;
  departmentId: Exclude<DepartmentId, "all">;
  items: TransactionItem[];
  payments: TransactionPayment[];
};

export const today = new CalendarDate(2026, 9, 14);

export const transactions: Transaction[] = [
  {
    id: "RPOSD1042883",
    checkNo: "42883",
    dateTime: "09/14/2026 02:24 PM",
    dateKey: "2026-09-14",
    subtotal: 11.46,
    tax: 0.96,
    discount: -0.57,
    gratuity: 1.24,
    fees: 1.63,
    tips: 0,
    total: 14.71,
    paidBy: "Cash, External Pay",
    paidByKeys: ["cash", "external-pay"],
    terminal: "SM67",
    cashier: "Marco JACK",
    employeeId: "marco-jack",
    transType: "PAID",
    creditCard: "",
    departmentId: "food",
    items: [
      { name: "12in Pepperoni Pizza", sku: "PZ-12-PEP", qty: 1, amount: 12.03 },
    ],
    payments: [
      { method: "Cash", amount: 7.35 },
      { method: "External Pay", amount: 7.36 },
    ],
  },
  {
    id: "RPOSD1042751",
    checkNo: "42751",
    dateTime: "09/13/2026 07:18 PM",
    dateKey: "2026-09-13",
    subtotal: 28.0,
    tax: 2.24,
    discount: 0,
    gratuity: 0,
    fees: 0.5,
    tips: 4.2,
    total: 34.94,
    paidBy: "Credit Card",
    paidByKeys: ["credit-card"],
    terminal: "MS27",
    cashier: "Mahir",
    employeeId: "mahir",
    transType: "PAID",
    creditCard: "**** 4412",
    departmentId: "beer",
    items: [{ name: "Craft IPA Pint", sku: "BR-IPA-PT", qty: 2, amount: 28.0 }],
    payments: [{ method: "Credit Card", amount: 34.94 }],
  },
  {
    id: "RPOSD1041990",
    checkNo: "41990",
    dateTime: "09/12/2026 01:05 PM",
    dateKey: "2026-09-12",
    subtotal: -8.0,
    tax: -0.64,
    discount: 0,
    gratuity: 0,
    fees: 0,
    tips: 0,
    total: -8.64,
    paidBy: "Cash",
    paidByKeys: ["cash"],
    terminal: "SM67",
    cashier: "Marco JACK",
    employeeId: "marco-jack",
    transType: "RETURN",
    creditCard: "",
    departmentId: "beverages",
    items: [{ name: "Fountain Soda", sku: "BV-SODA", qty: 1, amount: -8.0 }],
    payments: [{ method: "Cash", amount: -8.64 }],
  },
  {
    id: "RPOSD1041755",
    checkNo: "41755",
    dateTime: "09/10/2026 08:42 PM",
    dateKey: "2026-09-10",
    subtotal: 18.5,
    tax: 1.48,
    discount: 0,
    gratuity: 2.0,
    fees: 0,
    tips: 0,
    total: 21.98,
    paidBy: "Gift Card",
    paidByKeys: ["gift-card"],
    terminal: "N1",
    cashier: "Mahir",
    employeeId: "mahir",
    transType: "PAID",
    creditCard: "",
    departmentId: "liquor",
    items: [{ name: "House Margarita", sku: "LQ-MARG", qty: 1, amount: 18.5 }],
    payments: [{ method: "Gift Card", amount: 21.98 }],
  },
];

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new CalendarDate(year, month, day);
}

export function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
