// Version 2: refresh the deployed asset after enabling Cloudflare PWA headers.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Keep all authenticated application traffic on the network. The service
// worker exists for PWA lifecycle support and intentionally stores no data.
self.addEventListener("fetch", () => {});
