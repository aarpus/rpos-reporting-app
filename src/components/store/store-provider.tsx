"use client";

import type { StoreSummary } from "@/lib/store-access";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type StoreContextValue = {
  stores: StoreSummary[];
  selectedStore: StoreSummary | null;
  selectedStoreCode: string | null;
  isSwitching: boolean;
  selectStore: (storeCode: string) => Promise<boolean>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  stores,
  initialStoreCode,
  children,
}: {
  stores: StoreSummary[];
  initialStoreCode: string | null;
  children: ReactNode;
}) {
  const [selectedStoreCode, setSelectedStoreCode] = useState(initialStoreCode);
  const [isSwitching, setIsSwitching] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!initialStoreCode) return;
    void fetch("/api/store-selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeCode: initialStoreCode }),
    });
  }, [initialStoreCode]);

  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, [queryClient]);

  const selectedStore = stores.find((store) => store.storeCode === selectedStoreCode) ?? null;

  const selectStore = useCallback(async (storeCode: string) => {
    if (storeCode === selectedStoreCode) return true;
    if (!stores.some((store) => store.storeCode === storeCode)) return false;
    setIsSwitching(true);
    try {
      const response = await fetch("/api/store-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeCode }),
      });
      if (!response.ok) throw new Error("Store selection failed");
      setSelectedStoreCode(storeCode);
      await queryClient.invalidateQueries();
      router.refresh();
      return true;
    } catch {
      toast.error("Unable to switch store. Please try again.");
      return false;
    } finally {
      setIsSwitching(false);
    }
  }, [queryClient, router, selectedStoreCode, stores]);

  const value = useMemo(
    () => ({ stores, selectedStore, selectedStoreCode, isSwitching, selectStore }),
    [stores, selectedStore, selectedStoreCode, isSwitching, selectStore],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider.");
  return context;
}
