import { withDb } from "@/lib/db";
import { getRequestUser } from "@/lib/store-access";

type SubscriptionBody = {
  endpoint?: unknown;
  expirationTime?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
};

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as SubscriptionBody | null;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (
    typeof body?.endpoint !== "string" || body.endpoint.length > 4096 ||
    typeof p256dh !== "string" || typeof auth !== "string"
  ) return Response.json({ error: "Invalid push subscription" }, { status: 400 });
  const expiration = typeof body.expirationTime === "number" ? new Date(body.expirationTime) : null;
  await withDb((db) => db.query(
    `INSERT INTO push_subscriptions
       (user_id, endpoint, p256dh, auth, expiration_time, user_agent, failure_count, last_seen_at)
     VALUES ($1, $2, $3, $4, $5, $6, 0, NOW())
     ON CONFLICT (endpoint) DO UPDATE SET
       user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
       expiration_time = EXCLUDED.expiration_time, user_agent = EXCLUDED.user_agent,
       failure_count = 0, last_seen_at = NOW()`,
    [user.id, body.endpoint, p256dh, auth,
      expiration && !Number.isNaN(expiration.valueOf()) ? expiration : null,
      request.headers.get("user-agent")?.slice(0, 500) ?? null],
  ));
  return Response.json({ subscribed: true });
}

export async function DELETE(request: Request) {
  const user = await getRequestUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== "string") return Response.json({ error: "Invalid endpoint" }, { status: 400 });
  await withDb((db) => db.query(
    `DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2`,
    [body.endpoint, user.id],
  ));
  return Response.json({ subscribed: false });
}
