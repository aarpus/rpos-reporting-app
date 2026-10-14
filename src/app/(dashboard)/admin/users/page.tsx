import { getRequestUser } from "@/lib/store-access";
import { listAdminUsers } from "@/lib/user-admin";
import { redirect } from "next/navigation";
import { UserManagement } from "./user-management";

export default async function UserManagementPage() {
  const user = await getRequestUser();
  if (!user) redirect("/auth");
  if (user.role !== "ADMIN") redirect("/");

  return <UserManagement initialUsers={await listAdminUsers()} />;
}
