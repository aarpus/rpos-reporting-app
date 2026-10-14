"use client";

import { useStore } from "@/components/store/store-provider";
import { Toggle } from "@/components/tailgrids/core/toggle";
import type { NotificationTypeKey } from "@/lib/notification-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LuBell, LuBellOff, LuSmartphone } from "react-icons/lu";
import { toast } from "sonner";

type Preference = {
  key: NotificationTypeKey;
  label: string;
  description: string;
  enabled: boolean;
};

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export function NotificationSettings() {
  const { selectedStore, selectedStoreCode } = useStore();
  const queryClient = useQueryClient();
  const [savingType, setSavingType] = useState<NotificationTypeKey | null>(null);
  const query = useQuery({
    queryKey: ["notification-preferences", selectedStoreCode],
    enabled: Boolean(selectedStoreCode),
    queryFn: async () => {
      const response = await fetch(`/api/notification-preferences?storeCode=${encodeURIComponent(selectedStoreCode!)}`);
      if (!response.ok) throw new Error("Unable to load preferences");
      return response.json() as Promise<{ preferences: Preference[] }>;
    },
  });

  async function updatePreference(type: NotificationTypeKey, enabled: boolean) {
    if (!selectedStoreCode) return;
    setSavingType(type);
    try {
      const response = await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeCode: selectedStoreCode, type, enabled }),
      });
      if (!response.ok) throw new Error("Unable to save preference");
      await queryClient.invalidateQueries({ queryKey: ["notification-preferences", selectedStoreCode] });
      toast.success("Notification preference updated.");
    } catch {
      toast.error("Unable to update notification preference.");
    } finally {
      setSavingType(null);
    }
  }

  return (
    <section id="notifications" className="overflow-hidden rounded-2xl border border-card-border bg-card-surface-area shadow-xs">
      <div className="border-b border-card-border px-5 py-4">
        <h2 className="font-semibold text-text-primary">Store notifications</h2>
        <p className="mt-1 text-xs text-text-tertiary">
          {selectedStore ? `${selectedStore.name} (${selectedStore.storeCode})` : "No store selected"}
        </p>
      </div>
      {query.isLoading ? (
        <p className="px-5 py-6 text-sm text-text-tertiary">Loading notification preferences…</p>
      ) : query.isError ? (
        <p className="px-5 py-6 text-sm text-error-500">Unable to load notification preferences.</p>
      ) : (
        <div className="divide-y divide-card-border">
          {query.data?.preferences.map((preference) => (
            <div key={preference.key} className="flex items-center gap-4 px-5 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-badge-primary-background text-badge-primary-icon-color">
                <LuBell className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-text-primary">{preference.label}</h3>
                <p className="mt-0.5 text-xs leading-5 text-text-tertiary">{preference.description}</p>
              </div>
              <Toggle
                aria-label={`${preference.label} for ${selectedStore?.name ?? "selected store"}`}
                checked={preference.enabled}
                disabled={savingType === preference.key}
                onChange={(event) => void updatePreference(preference.key, event.target.checked)}
              />
            </div>
          ))}
        </div>
      )}
      <PushDeviceSettings />
    </section>
  );
}

function PushDeviceSettings() {
  const pushSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const [status, setStatus] = useState<"checking" | "unsupported" | "blocked" | "disabled" | "enabled">(() => {
    if (!pushSupported) return typeof window === "undefined" ? "checking" : "unsupported";
    return Notification.permission === "denied" ? "blocked" : "checking";
  });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!pushSupported || Notification.permission === "denied") return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setStatus(subscription ? "enabled" : "disabled"))
      .catch(() => setStatus("unsupported"));
  }, [pushSupported]);

  async function enable() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      toast.error("Push notifications are not configured on this deployment.");
      return;
    }
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "disabled");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const response = await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error("Subscription rejected");
      setStatus("enabled");
      toast.success("Push notifications enabled on this device.");
    } catch {
      toast.error("Unable to enable push notifications on this device.");
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push-subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("disabled");
      toast.success("Push notifications disabled on this device.");
    } catch {
      toast.error("Unable to disable push notifications.");
    } finally {
      setPending(false);
    }
  }

  const labels = {
    checking: "Checking this device…",
    unsupported: "Push is not supported on this device.",
    blocked: "Notifications are blocked in browser settings.",
    disabled: "Push is not enabled on this device.",
    enabled: "Push is enabled on this device.",
  };

  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-card-border px-5 py-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-badge-violet-background text-badge-violet-icon-color">
        {status === "enabled" ? <LuSmartphone className="size-5" /> : <LuBellOff className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-text-primary">This device</h3>
        <p className="mt-0.5 text-xs text-text-tertiary">{labels[status]}</p>
      </div>
      {status === "enabled" ? (
        <button type="button" disabled={pending} onClick={() => void disable()} className="rounded-lg border border-card-border px-3 py-2 text-xs font-semibold text-text-secondary disabled:opacity-60">
          Disable
        </button>
      ) : status === "disabled" ? (
        <button type="button" disabled={pending} onClick={() => void enable()} className="rounded-lg bg-primary-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
          {pending ? "Enabling…" : "Enable notifications"}
        </button>
      ) : null}
    </div>
  );
}
