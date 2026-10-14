import { getAdminAuthorization } from "@/lib/admin-auth";
import { updateUser } from "@/lib/user-admin";
import { parseUserId, parseUserUpdate } from "@/lib/user-admin-validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;
  const userId = parseUserId((await params).userId);
  if (!userId) return Response.json({ error: "User not found." }, { status: 404 });

  const parsed = parseUserUpdate(await request.json().catch(() => null));
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
  try {
    const user = await updateUser(userId, parsed.data);
    if (!user) return Response.json({ error: "User not found." }, { status: 404 });
    return Response.json({ user });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    throw error;
  }
}
