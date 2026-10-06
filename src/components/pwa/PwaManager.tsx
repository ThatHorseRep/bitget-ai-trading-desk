"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaContextType {
  canInstall: boolean;
  isInstalled: boolean;
  installApp: () => Promise<void>;
  dismissPrompt: () => void;
}

const PwaContext = createContext<PwaContextType>({
  canInstall: false,
  isInstalled: false,
  installApp: async () => {},
  dismissPrompt: () => {}
});

export function usePwa() {
  return useContext(PwaContext);
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(display-mode: standalone)").matches;
    }
    return false;
  });

  useEffect(() => {
    // 1. Register Service Worker after load — production only.
    //    v2 of the SW is stale-while-revalidate for static assets and
    //    network-first for navigation, so it can no longer serve stale
    //    HTML or chunks (see public/sw.js header + PROBLEMS_AND_SOLUTIONS).
    if (process.env.NODE_ENV === "production" && typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // If a new SW is waiting, activate it right away; combined with
            // the SW's skipWaiting() this guarantees the next reload runs
            // the freshly deployed asset set.
            registration.addEventListener("updatefound", () => {
              const installing = registration.installing;
              if (!installing) return;
              installing.addEventListener("statechange", () => {
                if (installing.state === "installed" && navigator.serviceWorker.controller) {
                  installing.postMessage({ type: "SKIP_WAITING" });
                }
              });
            });
          })
          .catch((error) => {
            console.warn("[PWA] Service Worker registration failed:", error);
          });

        // When a new SW takes control after an update, reload once so the
        // document hydrates against the fresh chunk set (only reload on
        // the first takeover to avoid loops).
        let refreshedByTakeover = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshedByTakeover) return;
          refreshedByTakeover = true;
          window.location.reload();
        });
      });
    }

    // 2. Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const dismissPrompt = () => {
    setIsDismissed(true);
  };

  const canInstall = Boolean(deferredPrompt && !isDismissed && !isInstalled);

  return (
    <PwaContext.Provider value={{ canInstall, isInstalled, installApp, dismissPrompt }}>
      {children}
    </PwaContext.Provider>
  );
}

export function PwaInstallButton({ className = "" }: { className?: string }) {
  const { canInstall, installApp } = usePwa();

  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={installApp}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center gap-2 border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] px-3 py-1.5 text-xs font-mono font-semibold text-[var(--rt-text-primary)] hover:bg-[var(--rt-surface-base)] active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xs ${className}`}
      aria-label="Install Bitget AI RedTeam Desk PWA"
    >
      <svg className="w-3.5 h-3.5 text-[var(--rt-verdict-clear)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span>Install PWA app</span>
    </button>
  );
}
