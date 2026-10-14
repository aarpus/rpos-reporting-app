import { getRequestUser, requireStoreAccess, SELECTED_STORE_COOKIE } from "@/lib/store-access";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { storeCode?: unknown } | null;
  const store = await requireStoreAccess(user, body?.storeCode);
  if (!store) return Response.json({ error: "Store not found or not accessible" }, { status: 403 });
  (await cookies()).set(SELECTED_STORE_COOKIE, store.storeCode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return Response.json({ store });
}
