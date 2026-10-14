import { withDb } from "@/lib/db";
import { parsePosEvent } from "@/lib/pos-events";
import { decryptPosSecret, verifyPosSignature } from "@/lib/pos-signature";
import { sendPushDeliveries, type PushDelivery } from "@/lib/push";
import { normalizeStoreCode } from "@/lib/store-access";

export const runtime = "nodejs";

type CredentialRow = { encrypted_secret: string; iv: string };

export async function POST(request: Request) {
  const storeCode = normalizeStoreCode(request.headers.get("x-store-code"));
  const keyId = request.headers.get("x-pos-key-id")?.trim();
  const timestamp = request.headers.get("x-pos-timestamp")?.trim();
  const signature = request.headers.get("x-pos-signature")?.trim();
  if (!storeCode || !keyId || keyId.length > 80 || !timestamp || !signature) {
    return Response.json(
      { error: "Missing authentication headers" },
      { status: 401 },
    );
  }
  const timestampNumber = Number(timestamp);
  if (
    !Number.isInteger(timestampNumber) ||
    Math.abs(Date.now() / 1000 - timestampNumber) > 300
  ) {
    return Response.json(
      { error: "Request timestamp expired" },
      { status: 401 },
    );
  }

  const rawBody = await request.text();
  if (rawBody.length > 32_000)
    return Response.json({ error: "Payload too large" }, { status: 413 });
  const credential = await withDb(async (db) => {
    const result = await db.query<CredentialRow>(
      `SELECT c.encrypted_secret, c.iv
       FROM pos_credentials c JOIN stores s ON s.store_code = c.store_code
       WHERE c.store_code = $1 AND c.key_id = $2 AND c.active = TRUE AND s.active = TRUE`,
      [storeCode, keyId],
    );
    return result.rows[0] ?? null;
  });
  if (!credential)
    return Response.json({ error: "Invalid POS credential" }, { status: 401 });
  const secret = await decryptPosSecret(
    credential.encrypted_secret,
    credential.iv,
  );
  const canonical = `${storeCode}\n${keyId}\n${timestamp}\n${rawBody}`;
  if (!(await verifyPosSignature(canonical, signature, secret))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsedBody = (() => {
    try {
      return JSON.parse(rawBody) as unknown;
    } catch {
      return null;
    }
  })();
  if (
    parsedBody &&
    typeof parsedBody === "object" &&
    "storeCode" in parsedBody
  ) {
    if (
      normalizeStoreCode((parsedBody as Record<string, unknown>).storeCode) !==
      storeCode
    ) {
      return Response.json(
        { error: "Body storeCode does not match signed header" },
        { status: 400 },
      );
    }
  }
  const event = parsePosEvent(parsedBody);
  if (!event)
    return Response.json({ error: "Invalid event payload" }, { status: 400 });

  const result = await withDb(async (db) => {
    await db.query("BEGIN");
    try {
      const inserted = await db.query<{ id: number }>(
        `INSERT INTO notification_events
           (event_id, store_code, notification_type, occurred_at, payload, title, body, target_path)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
         ON CONFLICT (store_code, event_id) DO NOTHING
         RETURNING id`,
        [
          event.eventId,
          storeCode,
          event.type,
          event.occurredAt,
          JSON.stringify(event.data),
          event.title,
          event.body,
          event.targetPath,
        ],
      );
      if (!inserted.rowCount) {
        await db.query("COMMIT");
        return {
          duplicate: true,
          deliveries: [] as PushDelivery[],
          recipients: 0,
        };
      }
      const eventRecordId = inserted.rows[0].id;
      const recipients = await db.query<{ id: number }>(
        `SELECT u.id
         FROM auth_users u
         JOIN notification_preferences p
           ON p.user_id = u.id AND p.store_code = $1 AND p.notification_type = $2 AND p.enabled = TRUE
         WHERE u.active = TRUE
           AND (u.role = 'ADMIN' OR EXISTS (
             SELECT 1 FROM store_access a WHERE a.user_id = u.id AND a.store_code = $1
           ))`,
        [storeCode, event.type],
      );
      const notificationIds = new Map<number, number>();
      for (const recipient of recipients.rows) {
        const notification = await db.query<{ id: number }>(
          `INSERT INTO user_notifications (user_id, notification_event_id, store_code)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [recipient.id, eventRecordId, storeCode],
        );
        notificationIds.set(recipient.id, notification.rows[0].id);
      }
      const deliveries: PushDelivery[] = [];
      if (recipients.rows.length) {
        const subscriptions = await db.query<{
          user_id: number;
          endpoint: string;
          p256dh: string;
          auth: string;
        }>(
          `SELECT user_id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ANY($1::integer[])`,
          [recipients.rows.map((recipient) => recipient.id)],
        );
        for (const subscription of subscriptions.rows) {
          deliveries.push({
            endpoint: subscription.endpoint,
            p256dh: subscription.p256dh,
            auth: subscription.auth,
            notificationId: notificationIds.get(subscription.user_id)!,
            storeCode,
            title: event.title,
            body: event.body,
          });
        }
      }
      await db.query(
        `DELETE FROM user_notifications WHERE created_at < NOW() - INTERVAL '90 days'`,
      );
      await db.query(
        `DELETE FROM notification_events e WHERE e.created_at < NOW() - INTERVAL '90 days' AND NOT EXISTS (SELECT 1 FROM user_notifications n WHERE n.notification_event_id = e.id)`,
      );
      await db.query("COMMIT");
      return {
        duplicate: false,
        deliveries,
        recipients: recipients.rows.length,
      };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  });

  if (result.duplicate)
    return Response.json({ status: "duplicate", eventId: event.eventId });
  const push = await sendPushDeliveries(result.deliveries);
  return Response.json(
    {
      status: "accepted",
      eventId: event.eventId,
      recipients: result.recipients,
      push,
    },
    { status: 202 },
  );
}
