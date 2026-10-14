import { getAdminAuthorization } from "@/lib/admin-auth";
import { createUser, listAdminUsers } from "@/lib/user-admin";
import { parseUserInput } from "@/lib/user-admin-validation";

export async function GET() {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;
  return Response.json({ users: await listAdminUsers() });
}

export async function POST(request: Request) {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;

  const parsed = parseUserInput(await request.json().catch(() => null));
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
  try {
    return Response.json({ user: await createUser(parsed.data) }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    throw error;
  }
}
