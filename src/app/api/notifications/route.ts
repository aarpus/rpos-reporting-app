import { withDb } from "@/lib/db";
import { getRequestUser, requireStoreAccess } from "@/lib/store-access";

export async function GET(request: Request) {
  const user = await getRequestUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const store = await requireStoreAccess(
    user,
    url.searchParams.get("storeCode"),
  );
  if (!store)
    return Response.json(
      { error: "Store not found or not accessible" },
      { status: 403 },
    );
  const cursorValue = url.searchParams.get("cursor");
  const cursor =
    cursorValue && !Number.isNaN(Date.parse(cursorValue))
      ? new Date(cursorValue)
      : null;
  const result = await withDb((db) =>
    db.query<{
      id: number;
      type: string;
      title: string;
      body: string;
      target_path: string;
      read_at: Date | null;
      created_at: Date;
    }>(
      `SELECT n.id, e.notification_type AS type, e.title, e.body, e.target_path,
            n.read_at, n.created_at
     FROM user_notifications n
     JOIN notification_events e ON e.id = n.notification_event_id
     WHERE n.user_id = $1 AND n.store_code = $2
       AND n.created_at >= NOW() - INTERVAL '90 days'
       AND ($3::timestamptz IS NULL OR n.created_at < $3)
     ORDER BY n.created_at DESC, n.id DESC
     LIMIT 31`,
      [user.id, store.storeCode, cursor],
    ),
  );
  const rows = result.rows.slice(0, 30);
  const unreadCountResult = await withDb((db) =>
    db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM user_notifications
     WHERE user_id = $1 AND store_code = $2 AND read_at IS NULL
       AND created_at >= NOW() - INTERVAL '90 days'`,
      [user.id, store.storeCode],
    ),
  );
  return Response.json({
    store,
    unreadCount: Number(unreadCountResult.rows[0]?.count ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      targetPath: row.target_path,
      readAt: row.read_at?.toISOString() ?? null,
      createdAt: row.created_at.toISOString(),
    })),
    nextCursor:
      result.rows.length > 30
        ? (rows.at(-1)?.created_at.toISOString() ?? null)
        : null,
  });
}
