import "server-only";

import webpush from "web-push";
import { withDb } from "@/lib/db";

export type PushDelivery = {
  endpoint: string;
  p256dh: string;
  auth: string;
  notificationId: number;
  storeCode: string;
  title: string;
  body: string;
};

function configureVapid() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushDeliveries(deliveries: PushDelivery[]) {
  if (!configureVapid()) return { delivered: 0, failed: deliveries.length };
  let delivered = 0;
  let failed = 0;

  for (let offset = 0; offset < deliveries.length; offset += 10) {
    const batch = deliveries.slice(offset, offset + 10);
    await Promise.all(batch.map(async (delivery) => {
      try {
        await webpush.sendNotification(
          { endpoint: delivery.endpoint, keys: { p256dh: delivery.p256dh, auth: delivery.auth } },
          JSON.stringify({
            notificationId: delivery.notificationId,
            storeCode: delivery.storeCode,
            title: delivery.title,
            body: delivery.body,
            clickUrl: `/notifications?storeCode=${encodeURIComponent(delivery.storeCode)}&notificationId=${encodeURIComponent(delivery.notificationId)}`,
          }),
          { TTL: 60 * 60, urgency: "high" },
        );
        delivered += 1;
      } catch (error) {
        failed += 1;
        const statusCode = typeof error === "object" && error && "statusCode" in error
          ? Number(error.statusCode)
          : 0;
        if (statusCode === 404 || statusCode === 410) {
          await withDb((db) => db.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [delivery.endpoint]));
        } else {
          await withDb((db) => db.query(
            `UPDATE push_subscriptions SET failure_count = failure_count + 1 WHERE endpoint = $1`,
            [delivery.endpoint],
          ));
          console.error("Web Push delivery failed", { statusCode, storeCode: delivery.storeCode });
        }
      }
    }));
  }
  return { delivered, failed };
}
