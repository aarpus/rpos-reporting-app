"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FiDownload, FiMoreVertical, FiShare2, FiX } from "react-icons/fi";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<InstallChoice>;
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const userAgent =
    typeof navigator === "undefined" ? "" : navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isMobile = /android|iphone|ipad|ipod|mobile/.test(userAgent);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as NavigatorWithStandalone).standalone === true;

    if (standalone) {
      return;
    }

    const showTimer = window.setTimeout(() => setIsOpen(true), 900);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsOpen(true);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // The app remains usable when service workers are unavailable.
      });
    }

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    primaryButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  async function install() {
    if (!installPrompt) {
      setIsOpen(false);
      return;
    }

    setIsInstalling(true);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      setIsOpen(false);
    } finally {
      setIsInstalling(false);
    }
  }

  if (!isOpen) return null;

  const hasNativePrompt = Boolean(installPrompt);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-description"
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#111118] text-white shadow-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-violet-600/35 via-indigo-500/15 to-transparent" />
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close install prompt"
          className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/75 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        >
          <FiX className="size-5" aria-hidden="true" />
        </button>

        <div className="relative px-6 pt-8 pb-6 sm:px-8 sm:pt-9 sm:pb-8">
          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg shadow-violet-950/40">
              <Image src="/icon.png" alt="" fill sizes="64px" priority />
            </div>
            <div className="min-w-0 pr-8">
              <p className="text-xs font-semibold tracking-[0.18em] text-violet-300 uppercase">
                Install application
              </p>
              <h2
                id="pwa-install-title"
                className="mt-1 text-2xl font-semibold tracking-tight"
              >
                AcutePOS
              </h2>
            </div>
          </div>

          <p
            id="pwa-install-description"
            className="mt-6 text-sm leading-6 text-white/70"
          >
            Install the reporting dashboard for one-tap access and a focused,
            full-screen experience on this device.
          </p>

          {!hasNativePrompt && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              {isIos ? (
                <p className="flex items-start gap-3 text-sm leading-6 text-white/80">
                  <FiShare2
                    className="mt-1 size-4 shrink-0 text-violet-300"
                    aria-hidden="true"
                  />
                  <span>
                    Tap <strong className="text-white">Share</strong>, then
                    choose{" "}
                    <strong className="text-white">Add to Home Screen</strong>.
                  </span>
                </p>
              ) : (
                <p className="flex items-start gap-3 text-sm leading-6 text-white/80">
                  <FiMoreVertical
                    className="mt-1 size-4 shrink-0 text-violet-300"
                    aria-hidden="true"
                  />
                  <span>
                    Open the browser menu and choose
                    <strong className="text-white">
                      {isMobile ? " Add to Home screen" : " Install AcutePOS"}
                    </strong>
                    .
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-11 rounded-xl px-5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
            >
              Not now
            </button>
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={install}
              disabled={isInstalling}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-semibold shadow-lg shadow-violet-950/30 transition hover:from-violet-500 hover:to-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-wait disabled:opacity-70"
            >
              <FiDownload className="size-4" aria-hidden="true" />
              {hasNativePrompt
                ? isInstalling
                  ? "Opening install..."
                  : "Install app"
                : "Got it"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
