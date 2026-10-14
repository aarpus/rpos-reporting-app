import "server-only";

import { withDb } from "@/lib/db";
import { hashPassword } from "@/lib/password.mjs";
import type { UserInput, UserUpdateInput } from "@/lib/user-admin-validation";
import type { AdminUser, UserAccessStore } from "@/types/user-admin";

type UserRow = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  assigned_store_count: number;
  created_at: Date;
};

function toAdminUser(row: UserRow): AdminUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    active: row.active,
    assignedStoreCount: Number(row.assigned_store_count),
    createdAt: row.created_at.toISOString(),
  };
}

const USER_SELECT = `
  SELECT u.id::text, u.name, u.email, u.active, u.created_at,
         COUNT(a.store_code)::int AS assigned_store_count
  FROM auth_users u
  LEFT JOIN store_access a ON a.user_id = u.id
`;

export async function listAdminUsers(): Promise<AdminUser[]> {
  return withDb(async (db) => {
    const result = await db.query<UserRow>(`${USER_SELECT}
      WHERE u.role = 'USER'
      GROUP BY u.id, u.name, u.email, u.active, u.created_at
      ORDER BY u.active DESC, u.name, u.email`);
    return result.rows.map(toAdminUser);
  });
}

export async function createUser(input: UserInput): Promise<AdminUser> {
  const passwordHash = await hashPassword(input.password);
  return withDb(async (db) => {
    const result = await db.query<UserRow>(`
      INSERT INTO auth_users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'USER')
      RETURNING id::text, name, email, active, created_at,
                0::int AS assigned_store_count`, [input.name, input.email, passwordHash]);
    return toAdminUser(result.rows[0]);
  });
}

export async function updateUser(userId: number, input: UserUpdateInput): Promise<AdminUser | null> {
  const passwordHash = input.password ? await hashPassword(input.password) : null;
  return withDb(async (db) => {
    const result = await db.query<UserRow>(`
      UPDATE auth_users
      SET name = COALESCE($2, name),
          email = COALESCE($3, email),
          password_hash = COALESCE($4, password_hash),
          active = COALESCE($5, active)
      WHERE id = $1 AND role = 'USER'
      RETURNING id::text, name, email, active, created_at,
        (SELECT COUNT(*)::int FROM store_access a WHERE a.user_id = auth_users.id) AS assigned_store_count`,
      [userId, input.name ?? null, input.email ?? null, passwordHash, input.active ?? null]);
    return result.rows[0] ? toAdminUser(result.rows[0]) : null;
  });
}

export async function listUserAccessStores(userId: number): Promise<UserAccessStore[] | null> {
  return withDb(async (db) => {
    const user = await db.query("SELECT 1 FROM auth_users WHERE id = $1 AND role = 'USER'", [userId]);
    if (!user.rowCount) return null;
    const result = await db.query<{
      store_code: string;
      name: string;
      active: boolean;
      assigned: boolean;
    }>(`
      SELECT s.store_code, s.name, s.active,
             EXISTS (SELECT 1 FROM store_access a WHERE a.user_id = $1 AND a.store_code = s.store_code) AS assigned
      FROM stores s
      ORDER BY s.active DESC, s.name, s.store_code`, [userId]);
    return result.rows.map((row) => ({
      storeCode: row.store_code,
      name: row.name,
      active: row.active,
      assigned: row.assigned,
    }));
  });
}

export async function replaceUserAccess(userId: number, storeCodes: string[]) {
  return withDb(async (db) => {
    await db.query("BEGIN");
    try {
      const user = await db.query(
        "SELECT 1 FROM auth_users WHERE id = $1 AND role = 'USER' FOR UPDATE",
        [userId],
      );
      if (!user.rowCount) {
        await db.query("ROLLBACK");
        return { kind: "not-found" as const };
      }

      if (storeCodes.length) {
        const stores = await db.query<{ store_code: string }>(
          "SELECT store_code FROM stores WHERE store_code = ANY($1::varchar[])",
          [storeCodes],
        );
        const found = new Set(stores.rows.map((store) => store.store_code));
        if (storeCodes.some((storeCode) => !found.has(storeCode))) {
          await db.query("ROLLBACK");
          return { kind: "invalid-store" as const };
        }
      }

      await db.query("DELETE FROM store_access WHERE user_id = $1", [userId]);
      if (storeCodes.length) {
        await db.query(`
          INSERT INTO store_access (user_id, store_code)
          SELECT $1, store_code FROM unnest($2::varchar[]) AS selected(store_code)
          ON CONFLICT (user_id, store_code) DO NOTHING`, [userId, storeCodes]);
      }
      await db.query("COMMIT");
      return { kind: "success" as const, assignedStoreCount: storeCodes.length };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  });
}
