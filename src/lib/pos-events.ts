import type { NotificationTypeKey } from "@/lib/notification-types";
import { isNotificationType } from "@/lib/notification-types";

type ParsedEvent = {
  eventId: string;
  type: NotificationTypeKey;
  occurredAt: Date;
  data: Record<string, unknown>;
  title: string;
  body: string;
  targetPath: string;
};

export function getNotificationTargetPath(
  type: NotificationTypeKey,
  data: Record<string, unknown>,
) {
  if (type === "SHIFT_END") {
    const shiftNumber = text(data, "shiftNumber", 40);
    return shiftNumber
      ? `/report/shift-report/${encodeURIComponent(shiftNumber)}`
      : null;
  }

  if (type === "DAY_END") {
    const reportId = text(data, "reportId");
    return reportId
      ? `/report/day-end-report/${encodeURIComponent(reportId)}`
      : null;
  }

  if (type === "LOW_STOCK") return "/";

  const transactionId = text(data, "transactionId");
  return transactionId
    ? `/report/transaction-detail/${encodeURIComponent(transactionId)}`
    : null;
}

function text(data: Record<string, unknown>, key: string, max = 160) {
  const value = data[key];
  return typeof value === "string" && value.trim() && value.length <= max
    ? value.trim()
    : null;
}

function dateText(data: Record<string, unknown>, key: string) {
  const value = text(data, key, 40);
  return value && !Number.isNaN(Date.parse(value)) ? value : null;
}

function numberValue(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parsePosEvent(value: unknown): ParsedEvent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const eventId = typeof input.eventId === "string" ? input.eventId.trim() : "";
  const occurredAtText = typeof input.occurredAt === "string" ? input.occurredAt : "";
  const occurredAt = new Date(occurredAtText);
  const data = input.data;
  if (
    !eventId ||
    eventId.length > 160 ||
    !isNotificationType(input.type) ||
    Number.isNaN(occurredAt.valueOf()) ||
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) return null;

  const fields = data as Record<string, unknown>;
  let title: string;
  let body: string;
  let targetPath: string;

  if (input.type === "SHIFT_END") {
    const shiftId = text(fields, "shiftId");
    const shiftNumber = text(fields, "shiftNumber", 40);
    const endedAt = dateText(fields, "endedAt");
    if (!shiftId || !shiftNumber || !endedAt) return null;
    title = `Shift #${shiftNumber} ended`;
    body = `Shift #${shiftNumber} closed at ${new Date(endedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC.`;
    targetPath = getNotificationTargetPath(input.type, fields)!;
  } else if (input.type === "DAY_END") {
    const businessDate = text(fields, "businessDate", 20);
    const reportId = text(fields, "reportId");
    const closedAt = dateText(fields, "closedAt");
    if (!businessDate || !reportId || !closedAt) return null;
    title = "Business day closed";
    body = `Business day ${businessDate} is ready to review.`;
    targetPath = getNotificationTargetPath(input.type, fields)!;
  } else if (input.type === "LOW_STOCK") {
    const productId = text(fields, "productId");
    const sku = text(fields, "sku", 80);
    const productName = text(fields, "productName", 160);
    const currentQuantity = numberValue(fields, "currentQuantity");
    const threshold = numberValue(fields, "threshold");
    if (!productId || !sku || !productName || currentQuantity === null || threshold === null) return null;
    title = `Low stock: ${productName}`;
    body = `${sku} has ${currentQuantity} remaining (threshold ${threshold}).`;
    targetPath = getNotificationTargetPath(input.type, fields)!;
  } else {
    const transactionId = text(fields, "transactionId");
    const action = text(fields, "action", 20);
    const amount = numberValue(fields, "amount");
    const currency = text(fields, "currency", 3);
    const performedAt = dateText(fields, "performedAt");
    if (!transactionId || !["VOID", "REFUND"].includes(action ?? "") || amount === null || !currency || !performedAt) return null;
    const actionLabel = action === "VOID" ? "Void" : "Refund";
    title = `${actionLabel} recorded: ${currency.toUpperCase()} ${amount.toFixed(2)}`;
    body = `Transaction ${transactionId} was ${actionLabel.toLowerCase()}ed.`;
    targetPath = getNotificationTargetPath(input.type, fields)!;
  }

  return { eventId, type: input.type, occurredAt, data: fields, title, body, targetPath };
}
