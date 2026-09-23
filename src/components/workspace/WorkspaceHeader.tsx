"use client";

import React from "react";
import { BRANDING } from "@/config/branding";
import { Lockup, Mark } from "@/components/brand/Logo";
import { ThemeToggle } from "../theme/ThemeToggle";

interface WorkspaceHeaderProps {
  useFixture: boolean;
  onToggleFixture: (value: boolean) => void;
  onNewTrade: () => void;
  canReset: boolean;
  onViewOverview?: () => void;
}

/**
 * RedTeam Desk Workspace Header
 * Aligned with the Brand & Editorial Design Constitution:
 * - Proof Sheet / Dark Room theme parity
 * - High-contrast tactile segmented controls
 * - Strict typographic hierarchy and mono tabular aesthetics
 */
export function WorkspaceHeader({
  useFixture,
  onToggleFixture,
  onNewTrade,
  canReset,
  onViewOverview
}: WorkspaceHeaderProps) {
  return (
    <div className="sticky top-0 z-40 flex flex-col pt-safe bg-[var(--rtd-proof)]">
      {/* Off-hours simulation banner if Fixture mode is active */}
      {useFixture && (
        <div className="bg-[var(--rtd-wait)] px-4 py-1 text-center text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--rtd-paper)] border-b border-[var(--rtd-steel)]/20 shadow-2xs flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--rtd-paper)] animate-ping" />
          <span>FIXTURE MODE ACTIVE • SIMULATING 65.5H OFF-HOURS WEEKEND SESSION</span>
        </div>
      )}

      <header className="h-16 border-b border-[var(--rtd-steel)]/25 bg-[var(--rtd-proof)] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Lockup + Context Badge */}
          <div className="flex items-center gap-3">
            {onViewOverview ? (
              <button
                type="button"
                onClick={onViewOverview}
                className="flex items-center text-left hover:opacity-85 transition-opacity cursor-pointer focus:outline-hidden"
                title="Return to System Overview"
              >
                <Lockup height={28} />
              </button>
            ) : (
              <Lockup height={28} />
            )}

            <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--rtd-steel)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--rtd-proceed)]" />
              <span>RISK CONSOLE</span>
            </div>
          </div>

          {/* Desktop Controls (>= md) */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Back to System Overview */}
            {onViewOverview && (
              <button
                type="button"
                onClick={onViewOverview}
                className="h-[36px] px-3.5 border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)] hover:border-[var(--rtd-steel)] active:scale-[0.98] transition-all text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>←</span>
                <span>Overview</span>
              </button>
            )}

            {/* Data Mode Switcher (Live vs Fixture) */}
            <div
              role="group"
              aria-label="Market Data Mode Selector"
              className="inline-flex items-center border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] p-0.5 shadow-2xs"
            >
              <button
                type="button"
                onClick={() => onToggleFixture(false)}
                aria-pressed={!useFixture}
                className={`h-[34px] px-3 text-[10.5px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  !useFixture
                    ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] shadow-xs"
                    : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)]"
                }`}
                title="Query live orderbook and real-time prices from Bitget"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${!useFixture ? "bg-[var(--rtd-proceed)] animate-pulse" : "bg-[var(--rtd-steel)]/40"}`} />
                <span>Live Bitget</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleFixture(true)}
                aria-pressed={useFixture}
                className={`h-[34px] px-3 text-[10.5px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  useFixture
                    ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] shadow-xs"
                    : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)]"
                }`}
                title="Run deterministic calibrated fixture scenario"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${useFixture ? "bg-[var(--rtd-proceed)]" : "bg-[var(--rtd-steel)]/40"}`} />
                <span>Fixture</span>
              </button>
            </div>

            {/* Theme Toggle (Day / Night) */}
            <ThemeToggle />

            {/* Action / Reset Button */}
            {canReset && (
              <button
                type="button"
                onClick={onNewTrade}
                className="h-[36px] px-4 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] hover:opacity-90 active:scale-95 transition-all text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>+</span>
                <span>New Trade</span>
              </button>
            )}
          </div>

          {/* Mobile Header (< md) */}
          <div className="flex md:hidden items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {onViewOverview ? (
                <button
                  type="button"
                  onClick={onViewOverview}
                  className="flex items-center gap-1.5 text-left focus:outline-hidden"
                >
                  <Mark size={24} />
                  <span className="font-mono font-bold text-xs tracking-tight text-[var(--rtd-ink)] truncate">
                    {BRANDING.SHORT_NAME}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Mark size={24} />
                  <span className="font-mono font-bold text-xs tracking-tight text-[var(--rtd-ink)] truncate">
                    {BRANDING.SHORT_NAME}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Compact Mode Toggle */}
              <button
                type="button"
                onClick={() => onToggleFixture(!useFixture)}
                className="min-h-[40px] px-2.5 text-[10px] font-mono font-bold uppercase tracking-wider border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] text-[var(--rtd-ink)] active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs"
                aria-label={`Toggle data mode (currently ${useFixture ? "Fixture" : "Live"})`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${useFixture ? "bg-[var(--rtd-wait)]" : "bg-[var(--rtd-proceed)] animate-pulse"}`} />
                <span>{useFixture ? "FIXTURE" : "LIVE"}</span>
              </button>

              {/* Compact Theme Toggle */}
              <ThemeToggle compact />

              {/* Back to Overview or Reset on Mobile */}
              {onViewOverview && (
                <button
                  type="button"
                  onClick={onViewOverview}
                  className="min-h-[40px] px-2.5 text-[10px] font-mono font-bold uppercase tracking-wider border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] text-[var(--rtd-ink)] active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Return to System Overview"
                >
                  ← DESK
                </button>
              )}

              {canReset && (
                <button
                  type="button"
                  onClick={onNewTrade}
                  className="min-h-[40px] px-3 text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--rtd-ink)] text-[var(--rtd-paper)] active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
                  title="Start New Trade Evaluation"
                >
                  + NEW
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
