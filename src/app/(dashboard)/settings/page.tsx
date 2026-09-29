import ThemeToggle from "@/components/common/header/theme-toggle";
import Link from "next/link";
import { LuBell, LuChevronRight, LuMoonStar, LuShieldCheck } from "react-icons/lu";

export default function SettingsPage() {
  return (
    <div className="space-y-6 px-3 py-6 sm:px-5 lg:px-6">
      <div>
        <p className="text-sm font-medium text-primary-500">Preferences</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
          Settings
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">
          Manage how the reporting dashboard looks and keeps you informed.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-card-border bg-card-surface-area shadow-xs">
        <div className="border-b border-card-border px-5 py-4">
          <h2 className="font-semibold text-text-primary">App preferences</h2>
        </div>

        <div className="flex items-center gap-4 px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-badge-violet-background text-badge-violet-icon-color">
            <LuMoonStar className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text-primary">Appearance</h3>
            <p className="mt-0.5 text-xs leading-5 text-text-tertiary">
              Switch between light and dark mode.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <Link
          href="/notifications"
          className="flex items-center gap-4 border-t border-card-border px-5 py-4 transition hover:bg-background-gray-secondary"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-badge-primary-background text-badge-primary-icon-color">
            <LuBell className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            <p className="mt-0.5 text-xs leading-5 text-text-tertiary">
              Review recent alerts and account activity.
            </p>
          </div>
          <LuChevronRight className="size-5 shrink-0 text-icon-tertiary" aria-hidden="true" />
        </Link>

        <div className="flex items-center gap-4 border-t border-card-border px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-badge-success-background text-badge-success-icon-color">
            <LuShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Protected account</h3>
            <p className="mt-0.5 text-xs leading-5 text-text-tertiary">
              Your dashboard session is secured by sign-in authentication.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
