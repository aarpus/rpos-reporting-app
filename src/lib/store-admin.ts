import "server-only";

import { withDb } from "@/lib/db";
import type {
  StoreInput,
  StoreUpdateInput,
} from "@/lib/store-admin-validation";
import type { StoreType } from "@/lib/store-type";
import type { AdminStore, StoreAccessUser } from "@/types/store-admin";
import { createStoreWithReporting } from "@/lib/reporting/store-creation";

type StoreRow = {
  store_code: string;
  name: string;
  timezone: string;
  store_type: StoreType;
  active: boolean;
  assigned_user_count: number;
  created_at: Date;
  updated_at: Date;
};

function toAdminStore(row: StoreRow): AdminStore {
  return {
    storeCode: row.store_code,
    name: row.name,
    timezone: row.timezone,
    storeType: row.store_type,
    active: row.active,
    assignedUserCount: Number(row.assigned_user_count),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const STORE_SELECT = `
  SELECT s.store_code, s.name, s.timezone, s.store_type, s.active, s.created_at, s.updated_at,
         COUNT(u.id)::int AS assigned_user_count
  FROM stores s
  LEFT JOIN store_access a ON a.store_code = s.store_code
  LEFT JOIN auth_users u ON u.id = a.user_id AND u.role = 'USER'
`;

export async function listAdminStores(): Promise<AdminStore[]> {
  return withDb(async (db) => {
    const result = await db.query<StoreRow>(`${STORE_SELECT}
      GROUP BY s.store_code, s.name, s.timezone, s.store_type, s.active, s.created_at, s.updated_at
      ORDER BY s.name, s.store_code`);
    return result.rows.map(toAdminStore);
  });
}

export async function createStore(input: StoreInput): Promise<AdminStore> {
  return withDb(async (db) =>
    toAdminStore(await createStoreWithReporting(db, input)),
  );
}

export async function updateStore(
  storeCode: string,
  input: StoreUpdateInput,
): Promise<AdminStore | null> {
  return withDb(async (db) => {
    const result = await db.query<StoreRow>(
      `
      UPDATE stores
      SET name = COALESCE($2, name),
          timezone = COALESCE($3, timezone),
          active = COALESCE($4, active),
          updated_at = NOW()
      WHERE store_code = $1
      RETURNING store_code, name, timezone, store_type, active, created_at, updated_at,
        (SELECT COUNT(*)::int FROM store_access a
         JOIN auth_users u ON u.id = a.user_id AND u.role = 'USER'
         WHERE a.store_code = stores.store_code) AS assigned_user_count`,
      [
        storeCode,
        input.name ?? null,
        input.timezone ?? null,
        input.active ?? null,
      ],
    );
    return result.rows[0] ? toAdminStore(result.rows[0]) : null;
  });
}

export async function listStoreAccessUsers(
  storeCode: string,
): Promise<StoreAccessUser[] | null> {
  return withDb(async (db) => {
    const store = await db.query("SELECT 1 FROM stores WHERE store_code = $1", [
      storeCode,
    ]);
    if (!store.rowCount) return null;
    const result = await db.query<{
      id: string;
      name: string;
      email: string;
      active: boolean;
      assigned: boolean;
    }>(
      `
      SELECT u.id::text, u.name, u.email, u.active,
             EXISTS (SELECT 1 FROM store_access a WHERE a.user_id = u.id AND a.store_code = $1) AS assigned
      FROM auth_users u
      WHERE u.role = 'USER'
      ORDER BY u.active DESC, u.name, u.email`,
      [storeCode],
    );
    return result.rows;
  });
}

export async function replaceStoreAccess(storeCode: string, userIds: number[]) {
  return withDb(async (db) => {
    await db.query("BEGIN");
    try {
      const store = await db.query(
        "SELECT 1 FROM stores WHERE store_code = $1 FOR UPDATE",
        [storeCode],
      );
      if (!store.rowCount) {
        await db.query("ROLLBACK");
        return { kind: "not-found" as const };
      }

      if (userIds.length) {
        const users = await db.query<{ id: string }>(
          "SELECT id::text FROM auth_users WHERE role = 'USER' AND id = ANY($1::int[])",
          [userIds],
        );
        const found = new Set(users.rows.map((user) => user.id));
        if (userIds.some((id) => !found.has(String(id)))) {
          await db.query("ROLLBACK");
          return { kind: "invalid-user" as const };
        }
      }

      await db.query(
        `
        DELETE FROM store_access a
        USING auth_users u
        WHERE a.user_id = u.id AND u.role = 'USER' AND a.store_code = $1`,
        [storeCode],
      );
      if (userIds.length) {
        await db.query(
          `
          INSERT INTO store_access (user_id, store_code)
          SELECT user_id, $1 FROM unnest($2::int[]) AS selected(user_id)
          ON CONFLICT (user_id, store_code) DO NOTHING`,
          [storeCode, userIds],
        );
      }
      await db.query("COMMIT");
      return { kind: "success" as const, assignedUserCount: userIds.length };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  });
}
