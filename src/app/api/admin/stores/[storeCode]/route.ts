import { getAdminAuthorization } from "@/lib/admin-auth";
import { normalizeStoreCode } from "@/lib/store-access";
import { updateStore } from "@/lib/store-admin";
import { parseStoreUpdate } from "@/lib/store-admin-validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ storeCode: string }> },
) {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;
  const storeCode = normalizeStoreCode((await params).storeCode);
  if (!storeCode) return Response.json({ error: "Store not found." }, { status: 404 });

  const parsed = parseStoreUpdate(await request.json().catch(() => null));
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
  const store = await updateStore(storeCode, parsed.data);
  if (!store) return Response.json({ error: "Store not found." }, { status: 404 });
  return Response.json({ store });
}

