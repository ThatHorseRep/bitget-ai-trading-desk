"use client";

import React from "react";
import { usePwa } from "../pwa/PwaManager";

interface MobileBottomNavProps {
  useFixture: boolean;
  onToggleFixture: (value: boolean) => void;
  onNewTrade: () => void;
  canReset: boolean;
  onViewOverview?: () => void;
  onOpenProvenance?: () => void;
  hasArtifact?: boolean;
}

export function MobileBottomNav({
  useFixture,
  onToggleFixture,
  onNewTrade,
  canReset,
  onViewOverview,
  onOpenProvenance,
  hasArtifact = false
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
          <svg className="w-5 h-5 text-[var(--rtd-ink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-[10px] font-bold tracking-tight">Risk Desk</span>
        </button>

        {/* Destination 2: System Overview */}
        <button
          type="button"
          onClick={onViewOverview}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-[var(--rtd-steel)] font-mono hover:bg-[var(--rtd-paper-subtle)] hover:text-[var(--rtd-ink)] active:scale-[0.98] transition-colors focus-visible:outline-hidden cursor-pointer"
          aria-label="System Overview"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-medium tracking-tight">Overview</span>
        </button>

        {/* Destination 3: Data Mode (Live / Fixture Toggle) */}
        <button
          type="button"
          onClick={() => onToggleFixture(!useFixture)}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 font-mono hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-colors focus-visible:outline-hidden cursor-pointer ${
            useFixture ? "text-[var(--rtd-reduce)] font-bold" : "text-[var(--rtd-ink)]"
          }`}
          aria-label={`Switch data mode (currently ${useFixture ? "Fixture" : "Live"})`}
        >
          <div className="relative">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6" />
            </svg>
            <span
              className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${
                useFixture ? "bg-[var(--rtd-reduce)]" : "bg-[var(--rtd-proceed)] animate-pulse"
              }`}
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
            <svg className="w-5 h-5 text-[var(--rtd-ink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px] font-bold tracking-tight">+ New Trade</span>
          </button>
        ) : hasArtifact && onOpenProvenance ? (
          <button
            type="button"
            onClick={onOpenProvenance}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-[var(--rtd-proceed)] font-mono hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-colors focus-visible:outline-hidden cursor-pointer"
            aria-label="Open Audit Provenance"
          >
            <svg className="w-5 h-5 text-[var(--rtd-proceed)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] font-bold tracking-tight">Provenance</span>
          </button>
        ) : canInstall ? (
          <button
            type="button"
            onClick={installApp}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-[var(--rtd-proceed)] font-mono hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-colors focus-visible:outline-hidden cursor-pointer"
            aria-label="Install PWA Application"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="text-[10px] font-medium tracking-tight">Top</span>
          </button>
        )}
      </div>
    </nav>
  );
}
