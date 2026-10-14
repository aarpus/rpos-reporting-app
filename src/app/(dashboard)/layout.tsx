import { auth } from "@/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PwaInstallPrompt from "@/components/pwa-install-prompt";
import { getAccessibleStores, SELECTED_STORE_COOKIE } from "@/lib/store-access";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const user = { id: session.user.id, role: session.user.role };
  const stores = await getAccessibleStores(user);
  const requestedStoreCode = (await cookies()).get(SELECTED_STORE_COOKIE)?.value;
  const selectedStoreCode = stores.some((store) => store.storeCode === requestedStoreCode)
    ? requestedStoreCode!
    : stores[0]?.storeCode ?? null;
  return (
    <DashboardLayout
      stores={stores}
      initialStoreCode={selectedStoreCode}
      role={session.user.role}
    >
      {children}
      <PwaInstallPrompt key={session.user.id} userId={session.user.id} />
    </DashboardLayout>
  );
}
