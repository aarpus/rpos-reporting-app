"use client";

import { useStore } from "@/components/store/store-provider";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { cn } from "@/utils/cn";
import { LuBuilding2, LuLoaderCircle, LuStore } from "react-icons/lu";

export function StoreSelector({
  compact = false,
  iconOnly = false,
}: {
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const { stores, selectedStoreCode, selectedStore, isSwitching, selectStore } = useStore();

  if (!selectedStore) {
    return <span className="text-xs text-text-tertiary">No store access</span>;
  }

  return (
    <Select
      aria-label="Selected store"
      value={selectedStoreCode ?? ""}
      isDisabled={isSwitching || (!iconOnly && stores.length < 2)}
      onChange={(key) => void selectStore(String(key))}
      className={cn("min-w-0", iconOnly ? "w-auto" : compact ? "max-w-42" : "w-58")}
    >
      <SelectTrigger
        iconOnly={iconOnly}
        aria-label={iconOnly ? `Change store. Current store: ${selectedStore.name}` : undefined}
        className={cn(
          "h-10 bg-card-background font-medium text-text-primary",
          compact && "h-9 text-xs",
          iconOnly &&
            "size-11 justify-center rounded-xl border-0 bg-transparent p-0 text-icon-primary shadow-none hover:bg-background-gray-secondary",
        )}
      >
        <span className={cn("flex min-w-0 items-center gap-2", iconOnly && "justify-center")}>
          {isSwitching ? (
            <LuLoaderCircle className="size-4 shrink-0 animate-spin text-primary-500" />
          ) : (
            <LuStore className={cn("shrink-0", iconOnly ? "size-6 text-current" : "size-4 text-icon-secondary")} />
          )}
          {!iconOnly && <SelectValue className="truncate" />}
        </span>
        {!iconOnly && <SelectIndicator />}
      </SelectTrigger>
      <SelectContent
        placement={iconOnly ? "bottom end" : undefined}
        className={iconOnly ? "min-w-64" : undefined}
      >
        {stores.map((store) => (
          <SelectItem
            key={store.storeCode}
            id={store.storeCode}
            textValue={compact ? `${store.storeCode} · ${store.name}` : `${store.name} (${store.storeCode})`}
          >
            {compact ? `${store.storeCode} · ${store.name}` : `${store.name} (${store.storeCode})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SelectedStoreHighlight() {
  const { selectedStore } = useStore();

  if (!selectedStore) {
    return <span className="text-sm text-text-tertiary">No store selected</span>;
  }

  return (
    <div
      className="flex max-w-80 items-center gap-2.5 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-2 shadow-xs"
      aria-label={`Current store: ${selectedStore.name}`}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
        <LuBuilding2 className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold tracking-wider text-primary-500 uppercase">
          Selected store
        </span>
        <span className="block truncate text-sm font-semibold text-text-primary">
          {selectedStore.name}
          <span className="ml-1.5 font-medium text-text-tertiary">({selectedStore.storeCode})</span>
        </span>
      </span>
    </div>
  );
}
