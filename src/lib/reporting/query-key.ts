export function reportingQueryKey(storeCode: string | null, filters: unknown) {
  return ["reporting", storeCode, filters] as const;
}
