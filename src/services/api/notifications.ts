import type { NotificationTypeKey } from "@/lib/notification-types";

export type InboxNotification = {
  id: number;
  type: NotificationTypeKey;
  title: string;
  body: string;
  targetPath: string;
  readAt: string | null;
  createdAt: string;
};

export type InboxResponse = {
  unreadCount: number;
  items: InboxNotification[];
  nextCursor: string | null;
};

async function responseJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error("Request failed");
  return response.json() as Promise<T>;
}

export function getNotifications(storeCode: string) {
  return fetch(`/api/notifications?storeCode=${encodeURIComponent(storeCode)}`, { cache: "no-store" })
    .then(responseJson<InboxResponse>);
}

export function markNotificationRead(id: string | number, storeCode: string) {
  return fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storeCode }),
  }).then(responseJson<{ read: true; targetPath: string }>);
}

export function markAllNotificationsRead(storeCode: string) {
  return fetch("/api/notifications/read-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storeCode }),
  }).then(responseJson<{ updated: number }>);
}
