import { getAdminAuthorization } from "@/lib/admin-auth";
import { listUserAccessStores, replaceUserAccess } from "@/lib/user-admin";
import { parseStoreCodes, parseUserId } from "@/lib/user-admin-validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;
  const userId = parseUserId((await params).userId);
  if (!userId) return Response.json({ error: "User not found." }, { status: 404 });

  const stores = await listUserAccessStores(userId);
  if (!stores) return Response.json({ error: "User not found." }, { status: 404 });
  return Response.json({ stores });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;
  const userId = parseUserId((await params).userId);
  if (!userId) return Response.json({ error: "User not found." }, { status: 404 });

  const parsed = parseStoreCodes(await request.json().catch(() => null));
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
  const result = await replaceUserAccess(userId, parsed.data);
  if (result.kind === "not-found") return Response.json({ error: "User not found." }, { status: 404 });
  if (result.kind === "invalid-store") {
    return Response.json({ error: "One or more selected stores do not exist." }, { status: 400 });
  }
  return Response.json({ assignedStoreCount: result.assignedStoreCount });
}
