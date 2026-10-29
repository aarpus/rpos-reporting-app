"use client";

import { MenuIcon } from "@/components/common/header/icons";
import ThemeToggle from "@/components/common/header/theme-toggle";
import { UserProfileButton } from "@/components/common/header/user-profile";
import { ThreeDots } from "@/components/common/sidebar/icon";
import { cn } from "@/utils/cn";
import Image from "next/image";
import { useTheme } from "next-themes";
import React from "react";
import { NotificationsButton } from "./notifications";
import SearchBar from "./searchbar";
import {
  SelectedStoreHighlight,
  StoreSelector,
} from "@/components/store/store-selector";

const emptySubscribe = () => () => {};

//  Main Header
export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const { resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b-[0.5px] border-card-border bg-card-surface-area px-2 py-4 lg:px-5">
        {/* Mobile layout (< xl): menu | store selector and quick access */}
        <div className="flex items-center xl:hidden">
          {/* Left: Menu / Hamburger */}
          <div className="flex flex-1 justify-start">
            <button
              id="mobile-menu-toggle"
              onClick={onMenuClick}
              aria-label="Open sidebar menu"
              className="rounded-md px-1.5 py-1 text-icon-tertiary transition-colors hover:text-text-primary"
            >
              <MenuIcon />
            </button>
          </div>

          {/* Center: Logo */}
          <div className="flex min-w-0 items-center justify-center px-2">
            <Image
              src={isDark ? "/images/logo-light.png" : "/images/logo.png"}
              alt="Dashboard logo"
              width={300}
              height={64}
              className="h-8 w-auto max-w-full object-contain"
              priority
              loading="eager"
            />
          </div>

          {/* Right: Store selector and three-dot */}
          <div className="flex flex-1 items-center justify-end gap-1">
            <StoreSelector iconOnly />
            <button
              id="mobile-info-toggle"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              aria-label="Open quick access"
              className={cn(
                "rounded-md px-1.5 py-3 transition-colors",
                isDrawerOpen
                  ? "bg-background-gray-secondary text-text-primary"
                  : "text-icon-tertiary hover:text-text-primary",
              )}
            >
              <ThreeDots />
            </button>
          </div>
        </div>

        {/* Desktop layout (xl+) */}
        <div className="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-5 xl:grid">
          {/* Left Side - Search */}
          <div className="min-w-0">
            <div className="max-w-xs">
              <SearchBar />
            </div>
          </div>

          {/* Center - Active store */}
          <SelectedStoreHighlight />

          {/* Right Side - Actions */}
          <div className="flex min-w-0 items-center justify-end gap-2.5">
            <StoreSelector />
            <ThemeToggle />
            <NotificationsButton />
            <UserProfileButton />
          </div>
        </div>
      </header>

      {/* Mobile Info */}
      <MobileInfoDrawer isOpen={isDrawerOpen} />
    </>
  );
}

// Mobile Info
function MobileInfoDrawer({ isOpen }: { isOpen: boolean }) {
  return (
    <div className={cn("xl:hidden", isOpen ? "block" : "hidden")}>
      <div className="px-5 py-4 shadow-xs">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <NotificationsButton />
            <ThemeToggle />
            <SearchBar />
          </div>

          {/* Right Side - Actions */}
          <UserProfileButton />
        </div>
      </div>
    </div>
  );
}
