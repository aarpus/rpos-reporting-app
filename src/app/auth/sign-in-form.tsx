"use client";

import { useRef, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { Button } from "@/components/tailgrids/core/button";
import { TextField } from "@/components/tailgrids/core/text-field";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import { Spinner } from "@/components/tailgrids/core/spinner";

export default function SignInForm({ callbackUrl, hasError }: { callbackUrl: string; hasError: boolean }) {
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState(hasError ? "Unable to sign in. Please try again." : "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email: data.get("email"), password: data.get("password"), redirect: false, redirectTo: callbackUrl,
      });
      if (!result || result.error) {
        setError(result?.error === "CredentialsSignin"
          ? "Unable to sign in. Check your email and password. If you have tried several times, wait 15 minutes."
          : "Sign-in is temporarily unavailable. Please try again shortly.");
      } else {
        window.location.assign(callbackUrl);
        return;
      }
    } catch {
      setError("Could not connect. Please check your connection and try again.");
    }
    submitting.current = false;
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="mt-7 min-w-0 space-y-5" aria-busy={pending}>
      <TextField name="email" type="email" required disabled={pending} className="gap-2">
        <Label className="text-sm font-medium text-[var(--auth-heading)]">Email address</Label>
        <div className="relative">
          <FiMail aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[var(--auth-muted)]" />
          <Input autoComplete="username" placeholder="you@company.com" maxLength={254} required className="h-12 w-full border-[var(--auth-input-border)] bg-[var(--auth-input)] pr-4 pl-11 text-[var(--auth-heading)] shadow-sm placeholder:text-[var(--auth-placeholder)] focus:border-violet-500 focus:ring-violet-500/20" />
        </div>
      </TextField>
      <TextField name="password" type={showPassword ? "text" : "password"} required disabled={pending} className="gap-2">
        <Label className="text-sm font-medium text-[var(--auth-heading)]">Password</Label>
        <div className="relative">
          <FiLock aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[var(--auth-muted)]" />
          <Input autoComplete="current-password" placeholder="Enter your password" maxLength={256} required className="h-12 w-full border-[var(--auth-input-border)] bg-[var(--auth-input)] pr-12 pl-11 text-[var(--auth-heading)] shadow-sm placeholder:text-[var(--auth-placeholder)] focus:border-violet-500 focus:ring-violet-500/20" />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            disabled={pending}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--auth-muted)] transition hover:bg-[var(--auth-soft)] hover:text-[var(--auth-heading)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-500 disabled:pointer-events-none"
          >
            {showPassword ? <FiEyeOff aria-hidden="true" className="size-[18px]" /> : <FiEye aria-hidden="true" className="size-[18px]" />}
          </button>
        </div>
      </TextField>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <label className="flex cursor-pointer items-center gap-2.5 text-[var(--auth-muted)]">
          <input name="remember" type="checkbox" disabled={pending} className="size-4 rounded border-[var(--auth-input-border)] bg-[var(--auth-input)] text-violet-600 focus:ring-2 focus:ring-violet-500/30 focus:ring-offset-0" />
          Remember me
        </label>
        <span aria-disabled="true" className="font-medium text-[var(--auth-accent)]" title="Contact your administrator to reset your password">
          Forgot password?
        </span>
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/8 p-3 text-sm text-[var(--auth-heading)]">{error}</p>}
      <Button
        type="submit"
        disabled={pending}
        pending={pending}
        className="group h-12 w-full bg-gradient-to-r from-[#5b4ff6] to-[#7c3aed] shadow-[0_10px_24px_rgba(91,79,246,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(91,79,246,0.3)] focus:ring-violet-400/40"
        size="lg"
      >
        {pending && <Spinner size="sm" />}
        <span aria-live="polite">{pending ? "Signing in…" : "Sign in"}</span>
        {!pending && <FiArrowRight aria-hidden="true" className="ml-auto size-[18px] transition-transform group-hover:translate-x-0.5" />}
      </Button>
    </form>
  );
}
