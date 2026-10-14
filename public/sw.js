// Version 2: refresh the deployed asset after enabling Cloudflare PWA headers.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "AcutePOS", body: event.data.text(), clickUrl: "/notifications" };
  }
  const title = typeof payload.title === "string" ? payload.title : "AcutePOS";
  const body = typeof payload.body === "string" ? payload.body : "New notification";
  const clickUrl = typeof payload.clickUrl === "string" && payload.clickUrl.startsWith("/")
    ? payload.clickUrl
    : "/notifications";
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/favicon.png",
      tag: payload.notificationId || undefined,
      data: { clickUrl },
    }),
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: "ACUTEPOS_NOTIFICATION", payload }));
    }),
    "setAppBadge" in self.navigator ? self.navigator.setAppBadge() : Promise.resolve(),
  ]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const clickUrl = event.notification.data?.clickUrl || "/notifications";
  const absoluteUrl = new URL(clickUrl, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      const client = clients[0];
      if (client) {
        await client.navigate(absoluteUrl);
        return client.focus();
      }
      return self.clients.openWindow(absoluteUrl);
    }),
  );
});

// Keep all authenticated application traffic on the network. The service
// worker exists for PWA lifecycle support and intentionally stores no data.
self.addEventListener("fetch", () => {});
