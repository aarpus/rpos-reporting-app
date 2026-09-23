import { auth } from "@/auth";
import ThemeToggle from "@/components/common/header/theme-toggle";
import Image from "next/image";
import { redirect } from "next/navigation";
import { FiBarChart2, FiLayers, FiShield } from "react-icons/fi";
import SignInForm from "./sign-in-form";

export const metadata = { title: "Sign in" };

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const target = params.callbackUrl;
  const callbackUrl =
    target?.startsWith("/") &&
    !target.startsWith("//") &&
    !target.includes("\\") &&
    !target.startsWith("/auth") &&
    !target.startsWith("/api/")
      ? target
      : "/";
  if ((await auth())?.user) redirect(callbackUrl);

  const features = [
    { label: "Real-time Reports", icon: FiBarChart2 },
    { label: "Secure Access", icon: FiShield },
    { label: "Multiple Stores", icon: FiLayers },
  ];

  return (
    <main className="auth-page relative h-full overflow-x-hidden overflow-y-auto transition-colors duration-300">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="auth-orb absolute -top-32 -left-28 size-80 rounded-full blur-3xl" />
        <div className="auth-orb absolute top-[38%] -right-36 size-96 rounded-full opacity-70 blur-3xl" />
        <div className="auth-grid absolute inset-0 opacity-40" />
        <div className="auth-arc absolute -right-36 -bottom-44 size-[34rem] rounded-full border-[72px]" />
      </div>

      <div className="absolute top-5 right-5 z-20 sm:top-8 sm:right-8">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-7xl flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
        <div className="grid min-w-0 flex-1 items-center gap-12 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20 lg:py-12">
          <section
            className="hidden max-w-lg lg:block"
            aria-labelledby="auth-value-heading"
          >
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-[var(--auth-border)] bg-[var(--auth-soft)] px-3.5 py-2 text-xs font-semibold tracking-[0.14em] text-[var(--auth-accent)] uppercase shadow-sm">
              <span className="size-1.5 rounded-full bg-violet-500 shadow-[0_0_10px_#7c3aed]" />
              Reporting intelligence
            </div>
            <h1
              id="auth-value-heading"
              className="max-w-md text-5xl leading-[1.08] font-semibold tracking-[-0.045em] text-[var(--auth-heading)] xl:text-6xl"
            >
              Turn Data
              <br />
              Into{" "}
              <span className="bg-gradient-to-r from-[#5b4ff6] to-[#8b5cf6] bg-clip-text text-transparent">
                Decisions
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-[var(--auth-muted)]">
              Real-time insights for a smarter, more profitable business.
            </p>
            <div className="mt-6 h-1 w-12 rounded-full bg-gradient-to-r from-[#5b4ff6] to-[#8b5cf6]" />

            <ul className="mt-10 grid gap-4" aria-label="Platform features">
              {features.map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="flex items-center gap-4 text-sm font-medium text-[var(--auth-heading)]"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl border border-[var(--auth-border)] bg-[var(--auth-soft)] text-[var(--auth-accent)] shadow-sm">
                    <Icon aria-hidden="true" className="size-[18px]" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </section>

          <section
            className="mx-auto min-w-0 w-full max-w-[490px] lg:mx-0 lg:justify-self-end"
            aria-labelledby="sign-in-heading"
          >
            <div className="mb-7 text-center">
              <div className="relative mx-auto h-[52px] w-[244px]">
                <Image
                  src="/images/logo.png"
                  alt="AcutePOS"
                  fill
                  sizes="244px"
                  className="auth-logo-light object-contain"
                  priority
                />
                <Image
                  src="/images/logo-light.png"
                  alt=""
                  fill
                  sizes="244px"
                  className="auth-logo-dark object-contain"
                  priority
                />
              </div>
              <p className="mt-3 text-[10px] font-semibold tracking-[0.24em] text-[var(--auth-muted)] uppercase">
                Smart POS. Smarter Business.
              </p>
            </div>

            <div className="w-full max-w-full rounded-[24px] border border-[var(--auth-card-border)] bg-[var(--auth-card)] p-6 shadow-[var(--auth-card-shadow)] backdrop-blur-xl sm:p-9">
              <h2
                id="sign-in-heading"
                className="text-2xl font-semibold tracking-[-0.025em] text-[var(--auth-heading)] sm:text-[28px]"
              >
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--auth-muted)]">
                Sign in to your AcutePOS reporting dashboard.
              </p>
              <SignInForm
                callbackUrl={callbackUrl}
                hasError={Boolean(params.error)}
              />

              <div className="mt-7 border-t border-[var(--auth-border)] pt-5 text-center text-sm text-[var(--auth-muted)]">
                Need access?{" "}
                <span className="font-medium text-[var(--auth-heading)]">
                  Contact your administrator.
                </span>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-center py-2 text-xs text-[var(--auth-muted)] lg:justify-between">
          <p>© {new Date().getFullYear()} AcutePOS. All rights reserved.</p>
          <p className="hidden tracking-wide lg:block">
            Built for Growing Businesses
          </p>
        </footer>
      </div>
    </main>
  );
}
