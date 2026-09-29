"use client";

import { cn } from "@/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuBell, LuChartNoAxesCombined, LuHouse, LuSettings } from "react-icons/lu";

const tabs = [
  { label: "Home", href: "/", icon: LuHouse },
  { label: "Report", href: "/report", icon: LuChartNoAxesCombined },
  { label: "Notifications", href: "/notifications", icon: LuBell },
  { label: "Settings", href: "/settings", icon: LuSettings },
] as const;

function isActiveTab(pathname: string, href: string) {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-card-border bg-card-surface-area/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl xl:hidden"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-4 px-2">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = isActiveTab(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors",
                active
                  ? "text-primary-500"
                  : "text-text-tertiary hover:text-text-primary",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-11 place-items-center rounded-full transition-colors",
                  active && "bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="truncate">{label}</span>
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
