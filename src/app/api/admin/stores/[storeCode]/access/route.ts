import { getAdminAuthorization } from "@/lib/admin-auth";
import { normalizeStoreCode } from "@/lib/store-access";
import { listStoreAccessUsers, replaceStoreAccess } from "@/lib/store-admin";
import { parseUserIds } from "@/lib/store-admin-validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeCode: string }> },
) {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;
  const storeCode = normalizeStoreCode((await params).storeCode);
  if (!storeCode) return Response.json({ error: "Store not found." }, { status: 404 });

  const users = await listStoreAccessUsers(storeCode);
  if (!users) return Response.json({ error: "Store not found." }, { status: 404 });
  return Response.json({ users });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ storeCode: string }> },
) {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;
  const storeCode = normalizeStoreCode((await params).storeCode);
  if (!storeCode) return Response.json({ error: "Store not found." }, { status: 404 });

  const parsed = parseUserIds(await request.json().catch(() => null));
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
  const result = await replaceStoreAccess(storeCode, parsed.data);
  if (result.kind === "not-found") return Response.json({ error: "Store not found." }, { status: 404 });
  if (result.kind === "invalid-user") {
    return Response.json({ error: "One or more selected users do not exist or are not USER accounts." }, { status: 400 });
  }
  return Response.json({ assignedUserCount: result.assignedUserCount });
}

