import { NOTIFICATION_TYPES, isNotificationType } from "@/lib/notification-types";
import { withDb } from "@/lib/db";
import { getRequestUser, requireStoreAccess } from "@/lib/store-access";

export async function GET(request: Request) {
  const user = await getRequestUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const storeCode = new URL(request.url).searchParams.get("storeCode");
  const store = await requireStoreAccess(user, storeCode);
  if (!store) return Response.json({ error: "Store not found or not accessible" }, { status: 403 });
  const enabled = await withDb(async (db) => {
    const result = await db.query<{ notification_type: string; enabled: boolean }>(
      `SELECT notification_type, enabled FROM notification_preferences WHERE user_id = $1 AND store_code = $2`,
      [user.id, store.storeCode],
    );
    return new Map(result.rows.map((row) => [row.notification_type, row.enabled]));
  });
  return Response.json({
    store,
    preferences: NOTIFICATION_TYPES.map((item) => ({ ...item, enabled: enabled.get(item.key) ?? false })),
  });
}

export async function PATCH(request: Request) {
  const user = await getRequestUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const store = await requireStoreAccess(user, body?.storeCode);
  if (!store) return Response.json({ error: "Store not found or not accessible" }, { status: 403 });
  if (!isNotificationType(body?.type) || typeof body?.enabled !== "boolean") {
    return Response.json({ error: "Invalid preference" }, { status: 400 });
  }
  await withDb((db) => db.query(
    `INSERT INTO notification_preferences (user_id, store_code, notification_type, enabled, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id, store_code, notification_type)
     DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()`,
    [user.id, store.storeCode, body.type, body.enabled],
  ));
  return Response.json({ type: body.type, enabled: body.enabled });
}
