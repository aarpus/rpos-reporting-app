"use client";

import Header from "@/components/common/header";
import MobileBottomNav from "@/components/common/mobile-bottom-nav";
import Sidebar from "@/components/common/sidebar";
import { SheetContent, SheetOverlay, SheetTitle } from "@/components/tailgrids/core/sheet";
import { cn } from "@/utils/cn";
import { StoreProvider } from "@/components/store/store-provider";
import type { StoreSummary } from "@/lib/store-access";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
  stores,
  initialStoreCode,
  role,
}: {
  children: ReactNode;
  stores: StoreSummary[];
  initialStoreCode: string | null;
  role: "ADMIN" | "USER";
}) {
  // XL+ sidebar expand/collapse state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Mobile sheet open state (< xl breakpoint)
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <StoreProvider
      key={`${initialStoreCode ?? "none"}:${stores.map((store) => store.storeCode).join(",")}`}
      stores={stores}
      initialStoreCode={initialStoreCode}
    >
    <div className="flex h-full">
      {/*  Desktop sidebar (xl+) — always in DOM, toggles width  */}
      <aside
        style={{
          width: isSidebarOpen ? "270px" : "72px",
          minWidth: isSidebarOpen ? "270px" : "72px",
          transition:
            "width 300ms cubic-bezier(0.4,0,0.2,1), min-width 300ms cubic-bezier(0.4,0,0.2,1)",
        }}
        className="hidden shrink-0 overflow-hidden xl:block"
      >
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </aside>

      {/*  Mobile sidebar (< xl) — Sheet sliding from the left  */}

      <SheetOverlay isOpen={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-67.5! max-w-67.5! border-r border-card-border bg-card-surface-area p-0"
        >
          <SheetTitle className="sr-only">Sidebar</SheetTitle>
          <Sidebar
            isSidebarOpen={true}
            toggleSidebar={() => {
              setIsMobileSheetOpen(false);
            }}
            onItemClick={() => {
              setIsMobileSheetOpen(false);
            }}
            isMobileSheet
          />
        </SheetContent>
      </SheetOverlay>

      {/*  Main content column  */}
      <div className={cn("min-w-0 flex-1", isSidebarOpen ? "lg:p-4 xl:pr-4" : "lg:py-4 xl:px-4")}>
        <div className="flex h-full flex-col overflow-hidden border-[0.5px] border-card-surface-border bg-card-surface-area lg:rounded-2xl lg:shadow-[0_3px_6px_-2px_rgba(0,0,0,0.02),0_1px_1px_0_rgba(0,0,0,0.04)]">
          <Header onMenuClick={() => setIsMobileSheetOpen(true)} />

          <main className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-384 pb-[calc(5rem+env(safe-area-inset-bottom))] xl:pb-5">
              {stores.length || (role === "ADMIN" && pathname.startsWith("/admin/")) ? children : (
                <div className="m-6 rounded-2xl border border-card-border bg-card-surface-area p-8 text-center">
                  <h1 className="text-xl font-semibold text-text-primary">No store access</h1>
                  <p className="mt-2 text-sm text-text-tertiary">Contact an administrator to get access to an active store.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <MobileBottomNav />
    </div>
    </StoreProvider>
  );
}
