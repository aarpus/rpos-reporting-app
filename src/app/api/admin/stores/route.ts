import { getAdminAuthorization } from "@/lib/admin-auth";
import { createStore, listAdminStores } from "@/lib/store-admin";
import { parseStoreInput } from "@/lib/store-admin-validation";
import {
  RetailReportingTablesError,
  StoreReportingSetupError,
} from "@/lib/reporting/store-creation";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;
  return Response.json({ stores: await listAdminStores() });
}

export async function POST(request: Request) {
  const authorization = await getAdminAuthorization();
  if (authorization.response) return authorization.response;

  const parsed = parseStoreInput(await request.json().catch(() => null));
  if ("error" in parsed)
    return Response.json({ error: parsed.error }, { status: 400 });
  try {
    return Response.json(
      { store: await createStore(parsed.data) },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof StoreReportingSetupError ||
      error instanceof RetailReportingTablesError
    ) {
      console.error(
        "Store reporting setup is incomplete. Run npm run reporting:install against the application's database and grant the backend role EXECUTE if roles differ.",
      );
      return Response.json({ error: error.message }, { status: 503 });
    }
    if (["23503", "23514"].includes((error as { code?: string }).code ?? ""))
      return Response.json(
        { error: "Store reporting schema could not be provisioned." },
        { status: 400 },
      );
    if ((error as { code?: string }).code === "23505") {
      return Response.json(
        { error: "A store with this code already exists." },
        { status: 409 },
      );
    }
    throw error;
  }
}
