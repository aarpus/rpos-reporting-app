export type RetailShiftStatus = "Open" | "Close";

export type RetailShiftLine = {
  label: string;
  value: string;
  emphasize?: boolean;
  divider?: boolean;
};

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

export function decorateShiftLines(lines: { label: string; value: string }[]): RetailShiftLine[] {
  return lines.map((line) => ({
    label: line.label,
    value: line.value,
    emphasize: emphasized.has(line.label),
    divider: divided.has(line.label),
  }));
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((item) => item.type === type)?.value ?? "";
}

export function formatShiftStamp(iso: string | null, timeZone: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const month = part(parts, "month");
  const day = part(parts, "day");
  const year = part(parts, "year");
  const hour = part(parts, "hour");
  const minute = part(parts, "minute");
  const second = part(parts, "second");
  const meridiem = part(parts, "dayPeriod").toUpperCase();
  return `${month}-${day}-${year} ${hour}:${minute}:${second} ${meridiem}`;
}

export function formatShiftTitle(iso: string, timeZone: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  return `${part(parts, "month").toUpperCase()}-${part(parts, "day")}-${part(parts, "year")}`;
}
