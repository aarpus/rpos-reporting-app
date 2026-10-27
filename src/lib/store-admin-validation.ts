import { isStoreType, type StoreType } from "./store-type.ts";

export type { StoreType };

export type StoreInput = {
  storeCode: string;
  name: string;
  timezone: string;
  storeType: StoreType;
};

export type StoreUpdateInput = {
  name?: string;
  timezone?: string;
  active?: boolean;
};

export function isValidTimeZone(value: string) {
  if (value.length === 0 || value.length > 80) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function parseStoreInput(value: unknown):
  | { data: StoreInput; error?: never }
  | { data?: never; error: string } {
  if (!value || typeof value !== "object") return { error: "Invalid request body." };
  const body = value as Record<string, unknown>;
  const storeCode = typeof body.storeCode === "string" ? body.storeCode.trim().toUpperCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const timezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
  const storeType = body.storeType;

  if (!isStoreType(storeType)) {
    return { error: "Select Restaurant POS or Retail POS." };
  }
  if (!storeCode || storeCode.length > 64) {
    return { error: "Store code is required and must be 64 characters or fewer." };
  }
  if (!name || name.length > 160) {
    return { error: "Store name is required and must be 160 characters or fewer." };
  }
  if (!isValidTimeZone(timezone)) return { error: "Select a valid IANA timezone." };
  return { data: { storeCode, name, timezone, storeType } };
}

export function parseStoreUpdate(value: unknown):
  | { data: StoreUpdateInput; error?: never }
  | { data?: never; error: string } {
  if (!value || typeof value !== "object") return { error: "Invalid request body." };
  const body = value as Record<string, unknown>;
  if ("storeType" in body) return { error: "Store type cannot be changed." };
  const data: StoreUpdateInput = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 160) {
      return { error: "Store name is required and must be 160 characters or fewer." };
    }
    data.name = body.name.trim();
  }
  if ("timezone" in body) {
    if (typeof body.timezone !== "string" || !isValidTimeZone(body.timezone.trim())) {
      return { error: "Select a valid IANA timezone." };
    }
    data.timezone = body.timezone.trim();
  }
  if ("active" in body) {
    if (typeof body.active !== "boolean") return { error: "Active status must be true or false." };
    data.active = body.active;
  }
  if (Object.keys(data).length === 0) return { error: "No store changes were provided." };
  return { data };
}

export function parseUserIds(value: unknown):
  | { data: number[]; error?: never }
  | { data?: never; error: string } {
  if (!value || typeof value !== "object") return { error: "Invalid request body." };
  const userIds = (value as Record<string, unknown>).userIds;
  if (!Array.isArray(userIds) || userIds.length > 10_000) {
    return { error: "userIds must be an array with no more than 10,000 entries." };
  }

  const parsed = userIds.map((id) => {
    if (typeof id === "number" && Number.isSafeInteger(id) && id > 0) return id;
    if (typeof id === "string" && /^[1-9]\d*$/.test(id)) {
      const numericId = Number(id);
      return Number.isSafeInteger(numericId) ? numericId : null;
    }
    return null;
  });
  if (parsed.some((id) => id === null)) return { error: "Every user ID must be a positive integer." };
  return { data: [...new Set(parsed as number[])] };
}

