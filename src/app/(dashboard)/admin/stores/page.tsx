import { getRequestUser } from "@/lib/store-access";
import { listAdminStores } from "@/lib/store-admin";
import { redirect } from "next/navigation";
import { StoreManagement } from "./store-management";

export default async function StoreManagementPage() {
  const user = await getRequestUser();
  if (!user) redirect("/auth");
  if (user.role !== "ADMIN") redirect("/");

  return <StoreManagement initialStores={await listAdminStores()} />;
}

