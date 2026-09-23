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
export type ClockStatus = "Clock In" | "Clocked Out";

export type BreakSession = {
  start: string;
  end: string;
  duration: string;
};

export type ClockSession = {
  id: number;
  dateKey: string;
  dateLabel: string;
  employee: string;
  status: ClockStatus;
  clockIn: string;
  clockOut: string;
  totalBreak: string;
  totalWork: string;
  totalTip: number;
  breaks: BreakSession[];
};

export const reportDate = new CalendarDate(2026, 9, 22);

export const sessions: ClockSession[] = [
  {
    id: 1,
    dateKey: "2026-09-22",
    dateLabel: "09/22/2026",
    employee: "Acute POS",
    status: "Clocked Out",
    clockIn: "16:54",
    clockOut: "17:06",
    totalBreak: "00:00",
    totalWork: "00:11",
    totalTip: 0,
    breaks: [],
  },
  {
    id: 2,
    dateKey: "2026-09-22",
    dateLabel: "09/22/2026",
    employee: "Acute POS",
    status: "Clock In",
    clockIn: "17:22",
    clockOut: "-",
    totalBreak: "00:00",
    totalWork: "00:00",
    totalTip: 0,
    breaks: [],
  },
  {
    id: 3,
    dateKey: "2026-09-22",
    dateLabel: "09/22/2026",
    employee: "Bobby Patel",
    status: "Clock In",
    clockIn: "17:32",
    clockOut: "-",
    totalBreak: "00:00",
    totalWork: "00:00",
    totalTip: 0,
    breaks: [],
  },
  {
    id: 4,
    dateKey: "2026-09-22",
    dateLabel: "09/22/2026",
    employee: "Marco",
    status: "Clocked Out",
    clockIn: "14:23",
    clockOut: "16:54",
    totalBreak: "00:00",
    totalWork: "02:30",
    totalTip: 0,
    breaks: [],
  },
];

export const employeeOptions = ["All Employees", "Acute POS", "Bobby Patel", "Marco"];
export const reportTypeOptions = ["Date", "Employee"];
export const groupByOptions = ["Batchwise", "Daily"];

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new CalendarDate(year, month, day);
}
