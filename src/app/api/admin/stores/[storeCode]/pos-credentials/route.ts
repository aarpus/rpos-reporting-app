import { getAdminAuthorization } from "@/lib/admin-auth";
import {
  createPosCredential,
  listPosCredentials,
  PosCredentialKeyError,
} from "@/lib/pos-credentials";
import { normalizeStoreCode } from "@/lib/store-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeCode: string }> },
) {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;
  const storeCode = normalizeStoreCode((await params).storeCode);
  if (!storeCode)
    return Response.json({ error: "Store not found." }, { status: 404 });

  const result = await listPosCredentials(storeCode);
  if (result.kind === "not-found") {
    return Response.json({ error: "Store not found." }, { status: 404 });
  }
  return Response.json({ credentials: result.credentials });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ storeCode: string }> },
) {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;
  const storeCode = normalizeStoreCode((await params).storeCode);
  if (!storeCode)
    return Response.json({ error: "Store not found." }, { status: 404 });

  try {
    const result = await createPosCredential(storeCode);
    if (result.kind === "not-found") {
      return Response.json({ error: "Store not found." }, { status: 404 });
    }
    if (result.kind === "inactive") {
      return Response.json(
        { error: "Activate the store before creating a POS credential." },
        { status: 409 },
      );
    }
    return Response.json(result.credential, { status: 201 });
  } catch (error) {
    if (error instanceof PosCredentialKeyError) {
      console.error(
        "POS_CREDENTIAL_ENCRYPTION_KEY must be a Base64-encoded 32-byte key.",
      );
      return Response.json(
        { error: "POS credential encryption is not configured." },
        { status: 503 },
      );
    }
    throw error;
  }
}
