"use client";

import { useStore } from "@/components/store/store-provider";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/api/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LuBell, LuBellRing } from "react-icons/lu";
import { toast } from "sonner";

export default function NotificationsPage() {
  const { selectedStore, selectedStoreCode, selectStore, stores } = useStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const deepLinkHandled = useRef(false);
  const query = useQuery({
    queryKey: ["notifications", selectedStoreCode],
    enabled: Boolean(selectedStoreCode),
    queryFn: () => getNotifications(selectedStoreCode!),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (deepLinkHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const storeCode = params.get("storeCode")?.toUpperCase();
    const notificationId = params.get("notificationId");
    if (!storeCode || !notificationId || !stores.some((store) => store.storeCode === storeCode)) return;
    deepLinkHandled.current = true;
    void (async () => {
      if (storeCode !== selectedStoreCode && !(await selectStore(storeCode))) return;
      try {
        const result = await markNotificationRead(notificationId, storeCode);
        await queryClient.invalidateQueries({ queryKey: ["notifications", storeCode] });
        router.replace(result.targetPath);
      } catch {
        toast.error("Unable to open this notification.");
      }
    })();
  }, [queryClient, router, selectStore, selectedStoreCode, stores]);

  async function open(id: number) {
    if (!selectedStoreCode) return;
    const result = await markNotificationRead(id, selectedStoreCode);
    await queryClient.invalidateQueries({ queryKey: ["notifications", selectedStoreCode] });
    router.push(result.targetPath);
  }

  async function markAll() {
    if (!selectedStoreCode) return;
    await markAllNotificationsRead(selectedStoreCode);
    await queryClient.invalidateQueries({ queryKey: ["notifications", selectedStoreCode] });
  }

  return (
    <div className="space-y-6 px-3 py-6 sm:px-5 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-medium text-primary-500">{selectedStore ? `${selectedStore.name} · ${selectedStore.storeCode}` : "Updates"}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">Notifications</h1><p className="mt-2 text-sm text-text-tertiary">POS activity and operational alerts for the selected store.</p></div>
        <button type="button" disabled={!query.data?.unreadCount} onClick={() => void markAll()} className="rounded-lg border border-card-border px-3 py-2 text-xs font-semibold text-text-secondary disabled:opacity-50">Mark all as read</button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-card-border bg-card-surface-area shadow-xs">
        <div className="flex items-center gap-3 border-b border-card-border px-4 py-4 sm:px-5"><span className="grid size-10 place-items-center rounded-xl bg-badge-primary-background text-badge-primary-icon-color"><LuBell className="size-5" /></span><div><h2 className="font-semibold text-text-primary">Recent activity</h2><p className="text-xs text-text-tertiary">{query.data?.unreadCount ?? 0} unread notifications</p></div></div>
        {query.isLoading ? <p className="p-5 text-sm text-text-tertiary">Loading notifications…</p> : query.isError ? <p className="p-5 text-sm text-error-500">Unable to load notifications.</p> : query.data?.items.length ? (
          <ul className="divide-y divide-card-border">
            {query.data.items.map((notification) => (
              <li key={notification.id}><button type="button" onClick={() => void open(notification.id)} className="flex w-full gap-3 px-4 py-4 text-left transition hover:bg-background-gray-secondary sm:gap-4 sm:px-5"><span className="grid size-10 shrink-0 place-items-center rounded-full border border-card-border bg-background-gray-secondary text-icon-secondary"><LuBellRing className="size-5" /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className="text-sm font-semibold text-text-primary">{notification.title}</span><time className="shrink-0 text-xs text-text-tertiary">{new Date(notification.createdAt).toLocaleString()}</time></span><span className="mt-1 block text-sm leading-5 text-text-secondary">{notification.body}</span></span>{!notification.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary-500" aria-label="Unread" />}</button></li>
            ))}
          </ul>
        ) : <p className="p-5 text-sm text-text-tertiary">No notifications for this store.</p>}
      </section>
    </div>
  );
}
