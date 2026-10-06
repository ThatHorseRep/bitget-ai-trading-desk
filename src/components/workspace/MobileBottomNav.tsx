"use client";

import React from "react";
import { usePwa } from "../pwa/PwaManager";
import { LayoutDashboard, Activity, Database, CirclePlus, FileArchive, Download, ArrowUp } from "lucide-react";

interface MobileBottomNavProps {
  useFixture: boolean;
  onToggleFixture: (value: boolean) => void;
  onNewTrade: () => void;
  canReset: boolean;
  onViewOverview?: () => void;
  onOpenProvenance?: () => void;
  hasArtifact?: boolean;
}

/** Mobile persistent bottom navigation.
 *
 * S10 fix: the 4-column grid is pinned to 44px min touch targets, and the
 * bottom nav is fixed with `inset-x-0` so it never leaves the viewport on
 * S10 ~360-390px widths. The mobile header's horizontal scroll row is a
 * single contiguous `w-max` flex row so every segment (Fixture toggle,
 * risk lever, compact theme, history badge) stays inside the viewport
 * with no horizontal scrollbar or clipping on small screens.
 */
export function MobileBottomNav({
  useFixture,
  onToggleFixture,
  onNewTrade,
  canReset,
  onViewOverview,
  onOpenProvenance,
  hasArtifact = false,
}: MobileBottomNavProps) {
  const { canInstall, installApp } = usePwa();

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile workspace navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)]/95 backdrop-blur-md pb-safe shadow-lg"
    >
      <div className="grid grid-cols-4 h-14 items-stretch px-1 text-[var(--rtd-ink)]">
        {/* Destination 1: Desk (Always First) */}
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-[var(--rtd-ink)] font-mono hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-colors focus-visible:outline-hidden cursor-pointer"
          aria-label="Risk Desk View"
        >
          <LayoutDashboard className="w-5 h-5 text-[var(--rtd-ink)]" />
          <span className="text-[10px] font-bold tracking-tight">Risk Desk</span>
        </button>

        {/* Destination 2: System Overview */}
        <button
          type="button"
          onClick={onViewOverview}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-[var(--rtd-steel)] font-mono hover:bg-[var(--rtd-paper-subtle)] hover:text-[var(--rtd-ink)] active:scale-[0.98] transition-colors focus-visible:outline-hidden cursor-pointer"
          aria-label="System Overview"
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">Overview</span>
        </button>

        {/* Destination 3: Data Mode (Live / Fixture Toggle) */}
        <button
          type="button"
          onClick={() => onToggleFixture(!useFixture)}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 font-mono hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-colors focus-visible:outline-hidden cursor-pointer ${useFixture ? "text-[var(--rtd-reduce)] font-bold" : "text-[var(--rtd-ink)]"}`}
          aria-label={`Switch data mode (currently ${useFixture ? "Fixture" : "Live"})`}
        >
          <div className="relative">
            <Database className="w-5 h-5" />
            <span
              className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${useFixture ? "bg-[var(--rtd-reduce)]" : "bg-[var(--rtd-proceed)] animate-pulse"}`}
            />
          </div>
          <span className="text-[10px] tracking-tight">{useFixture ? "Fixture" : "Live data"}</span>
        </button>

        {/* Destination 4: Contextual Action (New Trade / Provenance / Install) */}
        {canReset ? (
          <button
            type="button"
            onClick={onNewTrade}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-[var(--rtd-ink)] font-mono hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-colors focus-visible:outline-hidden cursor-pointer"
            aria-label="Start new trade stress test"
          >
            <CirclePlus className="w-5 h-5 text-[var(--rtd-ink)]" />
            <span className="text-[10px] font-bold tracking-tight">+ New Trade</span>
          </button>
        ) : hasArtifact && onOpenProvenance ? (
          <button
            type="button"
            onClick={onOpenProvenance}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-[var(--rtd-proceed)] font-mono hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-colors focus-visible:outline-hidden cursor-pointer"
            aria-label="Open Audit Provenance"
          >
            <FileArchive className="w-5 h-5 text-[var(--rtd-proceed)]" />
            <span className="text-[10px] font-bold tracking-tight">Provenance</span>
          </button>
        ) : canInstall ? (
          <button
            type="button"
            onClick={installApp}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-[var(--rtd-proceed)] font-mono hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-colors focus-visible:outline-hidden cursor-pointer"
            aria-label="Install PWA Application"
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">Install</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-[var(--rtd-steel)] font-mono hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-colors focus-visible:outline-hidden cursor-pointer"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Top</span>
          </button>
        )}
      </div>
    </nav>
  );
}
