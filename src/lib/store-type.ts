export type StoreType = "RESTAURANT" | "RETAIL";

export function isStoreType(value: unknown): value is StoreType {
  return value === "RESTAURANT" || value === "RETAIL";
}

export function storeTypeLabel(storeType: StoreType) {
  return storeType === "RETAIL" ? "Retail POS" : "Restaurant POS";
}
