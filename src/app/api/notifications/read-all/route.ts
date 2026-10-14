import { withDb } from "@/lib/db";
import { getRequestUser, requireStoreAccess } from "@/lib/store-access";

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { storeCode?: unknown } | null;
  const store = await requireStoreAccess(user, body?.storeCode);
  if (!store) return Response.json({ error: "Store not found or not accessible" }, { status: 403 });
  const result = await withDb((db) => db.query(
    `UPDATE user_notifications SET read_at = NOW()
     WHERE user_id = $1 AND store_code = $2 AND read_at IS NULL`,
    [user.id, store.storeCode],
  ));
  return Response.json({ updated: result.rowCount ?? 0 });
}
