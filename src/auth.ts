import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { withDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password.mjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/auth", error: "/auth" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials) {
        if (
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        )
          return null;
        const email = credentials.email.trim().toLowerCase();
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          email.length > 254 ||
          !credentials.password ||
          credentials.password.length > 256
        )
          return null;
        return withDb(async (db) => {
          // Atomic, database-backed throttling works across application instances.
          const attempts = await db.query<{ attempts: number }>(
            `
        INSERT INTO auth_login_attempts (email, attempts, window_start) VALUES ($1, 1, NOW())
        ON CONFLICT (email) DO UPDATE SET
          attempts = CASE WHEN auth_login_attempts.window_start < NOW() - INTERVAL '15 minutes' THEN 1 ELSE auth_login_attempts.attempts + 1 END,
          window_start = CASE WHEN auth_login_attempts.window_start < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE auth_login_attempts.window_start END
        RETURNING attempts`,
            [email],
          );
          if (attempts.rows[0].attempts > 10) return null;
          const result = await db.query<{
            id: string;
            name: string;
            email: string;
            password_hash: string;
          }>(
            "SELECT id, name, email, password_hash FROM auth_users WHERE email = $1 AND active = TRUE",
            [email],
          );
          const user = result.rows[0];
          const dummyHash = `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`;
          const valid = await verifyPassword(
            credentials.password,
            user?.password_hash ?? dummyHash,
          );
          if (!user || !valid) return null;
          await db.query("DELETE FROM auth_login_attempts WHERE email = $1", [
            email,
          ]);
          return { id: user.id, name: user.name, email: user.email };
        });
      },
    }),
  ],
});
