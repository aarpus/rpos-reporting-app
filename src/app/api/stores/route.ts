import { getAccessibleStores, getRequestUser } from "@/lib/store-access";

export async function GET() {
  const user = await getRequestUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ stores: await getAccessibleStores(user) });
}
