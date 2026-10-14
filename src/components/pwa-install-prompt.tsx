"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FiDownload, FiMoreVertical, FiShare2, FiX } from "react-icons/fi";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

// Also remember within this tab if browser storage is unavailable.
const notifiedUsers = new Set<string>();

export default function PwaInstallPrompt({ userId }: { userId: string }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState(false);
  const [platform, setPlatform] = useState({ isIos: false, isMobile: false });
  const installingRef = useRef(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // The app remains usable when service workers are unavailable.
      });
    }

    const storageKey = `acutepos:install-notice:${userId}`;
    const wasShown = () => {
      if (notifiedUsers.has(userId)) return true;
      try {
        return window.localStorage.getItem(storageKey) === "shown";
      } catch {
        return false;
      }
    };
    const standalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as NavigatorWithStandalone).standalone === true;

    let installed = standalone();
    let hideTimer: number | undefined;
    const showTimer = window.setTimeout(() => {
      if (installed || standalone() || wasShown()) return;
      notifiedUsers.add(userId);
      try {
        window.localStorage.setItem(storageKey, "shown");
      } catch {
        // The in-memory marker still prevents repeats during navigation.
      }
      const agent = navigator.userAgent.toLowerCase();
      setPlatform({
        isIos: /iphone|ipad|ipod/.test(agent),
        isMobile: /android|iphone|ipad|ipod|mobile/.test(agent),
      });
      setIsOpen(true);
      hideTimer = window.setTimeout(() => {
        if (!installingRef.current) setIsOpen(false);
      }, 12_000);
    }, 900);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      // Update the action without reopening a dismissed or expired notice.
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      installed = true;
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      setInstallPrompt(null);
      setIsOpen(false);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [userId]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !installingRef.current) setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  async function install() {
    if (!installPrompt) {
      setIsOpen(false);
      return;
    }
    installingRef.current = true;
    setIsInstalling(true);
    setInstallError(false);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setIsOpen(false);
    } catch {
      setInstallError(true);
      // Show browser-menu instructions if the native prompt fails.
      window.setTimeout(() => setIsOpen(false), 12_000);
    } finally {
      setInstallPrompt(null);
      installingRef.current = false;
      setIsInstalling(false);
    }
  }

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Install application notification"
      className="fixed top-[calc(1rem+env(safe-area-inset-top))] right-4 z-[100] w-[calc(100%_-_2rem)] max-w-sm rounded-2xl border border-card-border bg-card-surface-area p-5 text-text-primary shadow-xl"
    >
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        disabled={isInstalling}
        aria-label="Dismiss install notification"
        className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-gray-secondary focus-visible:outline-2 focus-visible:outline-primary-500 disabled:opacity-50"
      >
        <FiX className="size-4" aria-hidden="true" />
      </button>
      <div role="status" aria-live="polite" aria-atomic="true">
        <div className="flex items-center gap-3 pr-6">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-xl">
            <Image src="/icon.png" alt="" fill sizes="44px" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-tertiary">Install application</p>
            <h2 className="text-base font-semibold">AcutePOS</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-text-tertiary">
          Install the reporting dashboard for quick access from your home screen.
        </p>
        {!installPrompt && (
          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-text-tertiary">
            {platform.isIos ? (
              <FiShare2 className="mt-1 size-4 shrink-0 text-primary-500" aria-hidden="true" />
            ) : (
              <FiMoreVertical className="mt-1 size-4 shrink-0 text-primary-500" aria-hidden="true" />
            )}
            <span>
              {platform.isIos
                ? "Tap Share, then Add to Home Screen."
                : `Open the browser menu and choose ${platform.isMobile ? "Add to Home screen" : "Install AcutePOS"}, if available.`}
            </span>
          </p>
        )}
        {installError && <p className="mt-2 text-sm text-text-tertiary">Use the browser menu to install the app.</p>}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          disabled={isInstalling}
          className="rounded-lg px-3 py-2 text-sm font-medium text-text-tertiary hover:bg-background-gray-secondary focus-visible:outline-2 focus-visible:outline-primary-500 disabled:opacity-50"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={install}
          disabled={isInstalling}
          className="flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-primary-text transition hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-wait disabled:opacity-70"
        >
          <FiDownload className="size-4" aria-hidden="true" />
          {installPrompt ? (isInstalling ? "Opening install..." : "Install app") : "Got it"}
        </button>
      </div>
    </aside>
  );
}
