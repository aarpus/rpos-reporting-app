export const datePresets = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this-week", label: "This Week" },
  { id: "last-week", label: "Last Week" },
  { id: "this-month", label: "This Month" },
  { id: "custom", label: "Custom" },
] as const;

export type DatePreset = (typeof datePresets)[number]["id"];

export const employeeOptions = [
  { id: "all", label: "All" },
] as const;

export const reportByOptions = [
  { id: "transaction", label: "Transaction" },
] as const;

export const pageSizeOptions = [
  { id: "10", label: "10" },
  { id: "20", label: "20" },
  { id: "50", label: "50" },
] as const;

export type PaidById = string;
export type EmployeeId = (typeof employeeOptions)[number]["id"];
export type DepartmentId = string;
export type TransTypeId = string;
export type ReportById = (typeof reportByOptions)[number]["id"];
export function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
