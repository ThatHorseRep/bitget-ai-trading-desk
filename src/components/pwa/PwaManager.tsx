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
    // 1. Register Service Worker after load
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("[PWA] Service Worker registration failed:", error);
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
