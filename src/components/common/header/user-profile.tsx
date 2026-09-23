"use client";

import {
  BillingIcon,
  GearIcon,
  LogoutIcon,
  UserCircleIcon,
} from "@/components/common/header/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/tailgrids/core/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSection,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import { AltArrowDownIcon } from "@/utils/icon";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Spinner } from "@/components/tailgrids/core/spinner";
import { toast } from "sonner";

interface UserProfileMenuItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

export function UserProfileButton() {
  const { data: session } = useSession();
  const [pending, setPending] = useState(false);
  const user: UserProfile = {
    name: session?.user?.name || "Account",
    email: session?.user?.email || "",
    avatarUrl: session?.user?.image || undefined,
  };
  const menuItems: UserProfileMenuItem[] = [
    {
      href: "/profile",
      icon: <UserCircleIcon />,
      label: "View profile",
    },
    {
      href: "#",
      icon: <GearIcon />,
      label: "Account Settings",
    },
    {
      href: "#",
      icon: <BillingIcon />,
      label: "Billing and Plan",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2.5 rounded-lg border-0 p-0 transition-all outline-none focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 focus-visible:ring-offset-1">
        <Avatar>
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} className="size-10 rounded-lg" />}
          <AvatarFallback className="rounded-lg border border-border-secondary-alt bg-background-gray-secondary_alt">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <span className="text-sm leading-5 font-medium text-text-primary">{user.name}</span>

        <AltArrowDownIcon className="text-icon-tertiary transition-transform duration-200 group-aria-expanded:-rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent placement="bottom end" className="w-70 overflow-hidden p-0 shadow-3xl">
        <DropdownMenuHeader className="flex w-full items-center justify-start gap-2 border-b border-border-secondary-alt px-4 py-3">
          <Avatar size="md">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="border border-border-secondary-alt bg-background-gray-secondary_alt">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">{user.name}</span>
            <span className="truncate text-xs text-gray-500">{user.email}</span>
          </span>
        </DropdownMenuHeader>

        <DropdownMenuSection className="p-1.5">
          {menuItems.map((item) => (
            <DropdownMenuItem
              key={item.label}
              href={item.href}
              className="cursor-pointer px-3 py-2.5"
              render={(domProps) =>
                "href" in domProps ? <Link {...domProps} /> : <div {...domProps} />
              }
            >
              <span className="shrink-0 text-icon-secondary group-hover:text-text-primary">
                {item.icon}
              </span>
              <span className="leading-5 font-medium">{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuSection>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          isDisabled={pending}
          shouldCloseOnSelect={false}
          onAction={async () => {
            if (pending) return;
            setPending(true);
            try {
              await signOut({ redirectTo: "/auth" });
            } catch {
              setPending(false);
              toast.error("Unable to sign out. Please try again.");
            }
          }}
          className="m-1.5 w-auto cursor-pointer px-3 py-2.5"
        >
          <span className="text-icon-secondary group-hover:text-text-primary">
            {pending ? <Spinner size="sm" /> : <LogoutIcon />}
          </span>
          <span className="leading-5">{pending ? "Signing out…" : "Logout"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
