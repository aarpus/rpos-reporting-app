import { withDb } from "@/lib/db";
import { isNotificationType } from "@/lib/notification-types";
import { getNotificationTargetPath } from "@/lib/pos-events";
import { getRequestUser, requireStoreAccess } from "@/lib/store-access";

export async function POST(request: Request, context: RouteContext<"/api/notifications/[id]/read">) {
  const user = await getRequestUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { storeCode?: unknown } | null;
  const store = await requireStoreAccess(user, body?.storeCode);
  if (!store) return Response.json({ error: "Store not found or not accessible" }, { status: 403 });
  const { id } = await context.params;
  const result = await withDb((db) => db.query<{
    target_path: string;
    notification_type: string;
    payload: unknown;
  }>(
    `UPDATE user_notifications n SET read_at = COALESCE(read_at, NOW())
     FROM notification_events e
     WHERE n.id = $1 AND n.user_id = $2 AND n.store_code = $3
       AND e.id = n.notification_event_id
     RETURNING e.target_path, e.notification_type, e.payload`,
    [id, user.id, store.storeCode],
  ));
  const row = result.rows[0];
  if (!row) return Response.json({ error: "Notification not found" }, { status: 404 });
  const payload = row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
    ? row.payload as Record<string, unknown>
    : null;
  const currentTargetPath = isNotificationType(row.notification_type) && payload
    ? getNotificationTargetPath(row.notification_type, payload)
    : null;
  return Response.json({ read: true, targetPath: currentTargetPath ?? row.target_path });
}
