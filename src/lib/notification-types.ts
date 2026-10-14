export const NOTIFICATION_TYPES = [
  { key: "SHIFT_END", label: "Shift ended", description: "Receive an alert when a POS shift closes." },
  { key: "DAY_END", label: "Business day closed", description: "Receive an alert when the business day closes." },
  { key: "LOW_STOCK", label: "Low stock", description: "Receive an alert when stock reaches its threshold." },
  { key: "VOID_REFUND", label: "Void or refund", description: "Receive alerts for voided and refunded transactions." },
] as const;

export type NotificationTypeKey = (typeof NOTIFICATION_TYPES)[number]["key"];

export function isNotificationType(value: unknown): value is NotificationTypeKey {
  return NOTIFICATION_TYPES.some((item) => item.key === value);
}
