"use client";

import { BellIcon, SettingIcon } from "@/components/common/header/icons";
import { useStore } from "@/components/store/store-provider";
import { Button } from "@/components/tailgrids/core/button";
import { OverlayWrapper } from "@/components/tailgrids/core/overlay";
import { Popover } from "@/components/tailgrids/core/popover";
import { ScrollArea, ScrollAreaViewport, ScrollBar } from "@/components/tailgrids/core/scroll-area";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/api/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Header, Heading } from "react-aria-components";
import { LuBellRing } from "react-icons/lu";

function relativeTime(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  return Math.abs(hours) < 24
    ? formatter.format(hours, "hour")
    : formatter.format(Math.round(hours / 24), "day");
}

export function NotificationsButton() {
  const { selectedStoreCode } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["notifications", selectedStoreCode],
    enabled: Boolean(selectedStoreCode),
    queryFn: () => getNotifications(selectedStoreCode!),
    refetchInterval: 30_000,
  });
  const unreadCount = query.data?.unreadCount ?? 0;

  async function openNotification(id: number) {
    if (!selectedStoreCode) return;
    const result = await markNotificationRead(id, selectedStoreCode);
    await queryClient.invalidateQueries({ queryKey: ["notifications", selectedStoreCode] });
    setIsOpen(false);
    router.push(result.targetPath);
  }

  async function markAll() {
    if (!selectedStoreCode) return;
    await markAllNotificationsRead(selectedStoreCode);
    await queryClient.invalidateQueries({ queryKey: ["notifications", selectedStoreCode] });
  }

  return (
    <OverlayWrapper isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button iconOnly appearance="outline" aria-label={`${unreadCount} unread notifications`} className="relative size-10 rounded-lg border border-card-border bg-card-background text-icon-primary shadow-xs">
        <BellIcon />
        {unreadCount > 0 && <span className="absolute top-2 right-2.5 z-1 size-2 rounded-full bg-red-400"><span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-400 opacity-75" /></span>}
      </Button>
      <Popover placement="bottom end" className="w-84.5 overflow-hidden rounded-2xl border border-border-secondary-alt bg-background-white-secondary p-0 shadow-3xl">
        <Header className="flex items-center justify-between border-b border-border-secondary-alt px-5 pt-5 pb-4">
          <div><Heading level={4} className="leading-6 font-semibold text-text-primary">Notifications</Heading><p className="text-xs text-text-tertiary">{unreadCount} unread</p></div>
          <Link className="p-1 text-icon-secondary" href="/settings#notifications" onClick={() => setIsOpen(false)}><SettingIcon /></Link>
        </Header>
        <ScrollArea className="h-96 max-h-96">
          <ScrollAreaViewport>
            {query.isLoading ? <p className="p-5 text-sm text-text-tertiary">Loading…</p> : query.data?.items.length ? (
              <ul className="px-3 py-2">
                {query.data.items.slice(0, 10).map((notification) => (
                  <li key={notification.id}>
                    <button type="button" className="group flex w-full gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-background-gray-secondary_alt" onClick={() => void openNotification(notification.id)}>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-secondary bg-background-gray-primary text-icon-secondary"><LuBellRing className="size-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-text-primary">{notification.title}</span>{!notification.readAt && <span className="size-1.5 shrink-0 rounded-full bg-brand-500" />}</span>
                        <span className="mt-1 line-clamp-2 text-xs text-text-secondary">{notification.body}</span>
                        <span className="mt-2 block text-xs text-text-tertiary">{relativeTime(notification.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="p-5 text-sm text-text-tertiary">No notifications for this store.</p>}
          </ScrollAreaViewport>
          <ScrollBar />
        </ScrollArea>
        <div className="flex items-center justify-between border-t border-border-secondary-alt px-5 py-4">
          <button type="button" disabled={!unreadCount} onClick={() => void markAll()} className="text-xs font-medium text-text-secondary underline disabled:opacity-50">Mark all as read</button>
          <Link href="/notifications" onClick={() => setIsOpen(false)} className="rounded-lg bg-button-primary-background px-3.5 py-1.5 text-xs font-medium text-button-primary-text">View All</Link>
        </div>
      </Popover>
    </OverlayWrapper>
  );
}
