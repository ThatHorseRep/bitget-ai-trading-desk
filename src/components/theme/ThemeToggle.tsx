"use client";

import React, { useEffect, useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

export type ThemeMode = "light" | "dark";

function applyThemeToDocument(targetTheme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (targetTheme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
}

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("rtd-theme-change", callback);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("rtd-theme-change", callback);
    mediaQuery.removeEventListener("change", callback);
  };
}

function getThemeSnapshot(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("rtd_theme") as ThemeMode | null;
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getThemeServerSnapshot(): ThemeMode {
  return "light";
}

const emptySubscribe = () => () => {};

export function useTheme() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  useEffect(() => {
    applyThemeToDocument(getThemeSnapshot());
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    localStorage.setItem("rtd_theme", nextTheme);
    applyThemeToDocument(nextTheme);
    window.dispatchEvent(new Event("rtd-theme-change"));
  }, []);

  const toggleTheme = useCallback(() => {
    const current = getThemeSnapshot();
    const nextTheme: ThemeMode = current === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [setTheme]);

  return { theme, setTheme, toggleTheme, mounted };
}

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

let themeShiftTimer: ReturnType<typeof setTimeout> | null = null;

function triggerThemeShift() {
  if (typeof document === "undefined") return;
  if (themeShiftTimer) {
    clearTimeout(themeShiftTimer);
  }
  document.documentElement.classList.add("rtd-theme-shifting");
  themeShiftTimer = setTimeout(() => {
    document.documentElement.classList.remove("rtd-theme-shifting");
    themeShiftTimer = null;
  }, 250);
}

/**
 * Editorial dual-surface Theme Toggle:
 * Switches between "PROOF SHEET" (Light Ground) and "DARK ROOM" (Nocturnal Console).
 * Built with zero generic pills, precision mono typography, and tactile status indicators.
 */
export function ThemeToggle({ className = "", compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme, mounted } = useTheme();

  const handleToggleTheme = () => {
    triggerThemeShift();
    toggleTheme();
  };

  const handleSetTheme = (target: ThemeMode) => {
    triggerThemeShift();
    setTheme(target);
  };

  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center gap-1 border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] px-2 py-1 text-xs font-mono text-[var(--rtd-steel)] opacity-60 ${className}`}
        aria-hidden="true"
      >
        <span className="w-2 h-2 rounded-full bg-[var(--rtd-steel)]/40" />
        <span className="text-[10px] tracking-wider uppercase">{compact ? "THM" : "THEME"}</span>
      </div>
    );
  }

  const isDark = theme === "dark";

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggleTheme}
        className={`w-[44px] h-[44px] min-w-[44px] min-h-[44px] p-0 shrink-0 border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-colors text-xs font-mono flex items-center justify-center cursor-pointer shadow-2xs ${className}`}
        aria-label={`Current: ${isDark ? "Dark Room" : "Proof Sheet"}. Click to switch theme.`}
        title={`Switch to ${isDark ? "Proof Sheet (Light)" : "Dark Room (Dark)"}`}
      >
        {isDark ? (
          <span className="flex items-center justify-center text-[var(--rtd-ink)]">
            <Moon className="w-3.5 h-3.5 text-sky-400" />
          </span>
        ) : (
          <span className="flex items-center justify-center text-[var(--rtd-ink)]">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme mode selector"
      className={`inline-flex items-center border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] p-0.5 shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => handleSetTheme("light")}
        aria-pressed={!isDark}
        className={`min-h-[34px] px-2.5 py-1 text-[10.5px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
          !isDark
            ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] shadow-xs"
            : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)]"
        }`}
        title="Proof Sheet — Light high-contrast report ground"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            !isDark ? "bg-[var(--rtd-proceed)]" : "bg-transparent border border-[var(--rtd-steel)]/50"
          }`}
        />
        <Sun className="w-3 h-3 shrink-0" />
        <span>DAY</span>
      </button>

      <button
        type="button"
        onClick={() => handleSetTheme("dark")}
        aria-pressed={isDark}
        className={`min-h-[34px] px-2.5 py-1 text-[10.5px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
          isDark
            ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] shadow-xs"
            : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)]"
        }`}
        title="Dark Room — Nocturnal desk console ground"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isDark ? "bg-[var(--rtd-proceed)]" : "bg-transparent border border-[var(--rtd-steel)]/50"
          }`}
        />
        <Moon className="w-3 h-3 shrink-0" />
        <span>NIGHT</span>
      </button>
    </div>
  );
}
