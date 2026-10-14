import "server-only";

import { getRequestUser } from "@/lib/store-access";

export async function getAdminAuthorization() {
  const user = await getRequestUser();
  if (!user)
    return {
      user: null,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  if (user.role !== "ADMIN") {
    return {
      user: null,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user, response: null };
}
