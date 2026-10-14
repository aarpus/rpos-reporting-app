import "server-only";

import { auth } from "@/auth";
import { withDb } from "@/lib/db";

export const SELECTED_STORE_COOKIE = "selected_store_code";

export type StoreSummary = {
  storeCode: string;
  name: string;
  timezone: string;
};

export type RequestUser = {
  id: string;
  role: "ADMIN" | "USER";
};

export function normalizeStoreCode(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return normalized.length > 0 && normalized.length <= 64 ? normalized : null;
}

export async function getRequestUser(): Promise<RequestUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return withDb(async (db) => {
    const result = await db.query<RequestUser>(
      `SELECT id, role FROM auth_users WHERE id = $1 AND active = TRUE`,
      [session.user.id],
    );
    return result.rows[0] ?? null;
  });
}

export async function getAccessibleStores(
  user: RequestUser,
): Promise<StoreSummary[]> {
  return withDb(async (db) => {
    const result = await db.query<{
      store_code: string;
      name: string;
      timezone: string;
    }>(
      user.role === "ADMIN"
        ? `SELECT s.store_code, s.name, s.timezone FROM stores s WHERE s.active ORDER BY s.name, s.store_code`
        : `SELECT s.store_code, s.name, s.timezone
           FROM stores s

           JOIN store_access a ON a.store_code = s.store_code
           WHERE a.user_id = $1 AND s.active = TRUE
           ORDER BY s.name, s.store_code`,
      user.role === "ADMIN" ? [] : [user.id],
    );
    return result.rows.map((row) => ({
      storeCode: row.store_code,
      name: row.name,
      timezone: row.timezone,
    }));
  });
}

export async function requireStoreAccess(
  user: RequestUser,
  rawStoreCode: unknown,
) {
  const storeCode = normalizeStoreCode(rawStoreCode);
  if (!storeCode) return null;

  return withDb(async (db) => {
    const result = await db.query<{
      store_code: string;
      name: string;
      timezone: string;
    }>(
      `SELECT s.store_code, s.name, s.timezone
       FROM stores s

       WHERE s.store_code = $1 AND s.active = TRUE
         AND ($2 = 'ADMIN' OR EXISTS (
           SELECT 1 FROM store_access a
           WHERE a.user_id = $3 AND a.store_code = s.store_code
         ))`,
      [storeCode, user.role, user.id],
    );
    const row = result.rows[0];
    return row
      ? { storeCode: row.store_code, name: row.name, timezone: row.timezone }
      : null;
  });
}
