"use client";

import React from "react";
import { Lockup } from "@/components/brand/Logo";
import { ThemeToggle } from "../theme/ThemeToggle";

interface WorkspaceHeaderProps {
  useFixture: boolean;
  onToggleFixture: (value: boolean) => void;
  onNewTrade: () => void;
  canReset: boolean;
  onViewOverview?: () => void;
  onOpenHistory?: () => void;
  historyCount?: number;
  isFallback?: boolean;
  riskTolerance?: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
  onToggleRiskTolerance?: (value: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE") => void;
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
  onViewOverview,
  onOpenHistory,
  historyCount = 0,
  isFallback = false,
  riskTolerance = "MODERATE",
  onToggleRiskTolerance
}: WorkspaceHeaderProps) {
  const [isOnline, setIsOnline] = React.useState(() => {
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const getLiveStatusInfo = () => {
    if (!isOnline) {
      return {
        dotClass: "bg-[var(--rtd-reduce)] animate-pulse",
        text: "Bitget [OFFLINE]",
        title: "Browser is offline. Live market queries will use cached demo backups.",
        isCleanLive: false
      };
    }
    if (isFallback) {
      return {
        dotClass: "bg-[var(--rtd-reduce)] animate-pulse",
        text: "Bitget [FALLBACK]",
        title: "The Bitget API was unreachable in the last run. Showing cached weekend demo data.",
        isCleanLive: false
      };
    }
    return {
      dotClass: "bg-[var(--rtd-proceed)] animate-pulse",
      text: "Live Bitget",
      title: "Query live orderbook and real-time prices from Bitget",
      isCleanLive: true
    };
  };

  const statusInfo = getLiveStatusInfo();
  return (
    <div className="sticky top-0 z-40 flex flex-col pt-safe bg-[var(--rtd-proof)]">
      {/* Off-hours simulation banner if Fixture mode is active */}
      {useFixture && (
        <div className="bg-[var(--rtd-wait)] px-4 py-1 text-center text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--rtd-paper)] border-b border-[var(--rtd-steel)]/20 shadow-2xs flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--rtd-paper)] animate-ping" />
          <span>FIXTURE MODE ACTIVE • SIMULATING 65.5H OFF-HOURS WEEKEND SESSION</span>
        </div>
      )}

      <header className="h-16 border-b border-[var(--rtd-steel)]/25 bg-[var(--rtd-proof)] w-full overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3 w-full">
          {/* Official Brand Lockup + Context Badge (Mobile & Desktop) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
            {onViewOverview ? (
              <button
                type="button"
                onClick={onViewOverview}
                className="inline-flex items-center text-left hover:opacity-85 transition-opacity cursor-pointer focus:outline-hidden shrink min-w-0"
                title="Return to System Overview"
              >
                <Lockup height={26} />
              </button>
            ) : (
              <div className="inline-flex items-center shrink min-w-0">
                <Lockup height={26} />
              </div>
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

            {/* Audit History Log Button */}
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="h-[36px] px-3 border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)] hover:border-[var(--rtd-steel)] active:scale-[0.98] transition-all text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="View persisted audit decisions log"
              >
                <span className="text-[11px]">📋</span>
                <span>History</span>
                {historyCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-[10px] font-bold">
                    {historyCount}
                  </span>
                )}
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
                title={statusInfo.title}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${!useFixture ? statusInfo.dotClass : "bg-[var(--rtd-steel)]/40"}`} />
                <span>{statusInfo.text}</span>
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

            {/* Risk Tolerance Selector (persona lever: shifts WAIT/REDUCE/PROCEED thresholds) */}
            {onToggleRiskTolerance && (
              <div
                role="group"
                aria-label="Risk Tolerance Selector"
                className="inline-flex items-center border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] p-0.5 shadow-2xs"
              >
                {(["CONSERVATIVE", "MODERATE", "AGGRESSIVE"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onToggleRiskTolerance(level)}
                    aria-pressed={riskTolerance === level}
                    className={`h-[34px] px-2.5 text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      riskTolerance === level
                        ? level === "CONSERVATIVE"
                          ? "bg-[var(--rtd-wait)] text-[var(--rtd-paper)] shadow-xs"
                          : level === "AGGRESSIVE"
                            ? "bg-[var(--rtd-reduce)] text-[var(--rtd-paper)] shadow-xs"
                            : "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] shadow-xs"
                        : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)]"
                    }`}
                    title={
                      level === "CONSERVATIVE"
                        ? "Shift risk bands one step stricter (smaller WAIT/REDUCE/PROCEED allowances)"
                        : level === "AGGRESSIVE"
                          ? "Shift risk bands one step looser (larger WAIT/REDUCE/PROCEED allowances)"
                          : "Default desk persona: crypto-native retail, moderate risk"
                    }
                  >
                    {level === "CONSERVATIVE" ? "LOW" : level === "AGGRESSIVE" ? "HIGH" : "MED"}
                  </button>
                ))}
              </div>
            )}

            {/* Theme Toggle (Day / Night) */}
            <ThemeToggle />

            {/* Action / Reset Button */}
            {canReset && (
              <button
                type="button"
                onClick={onNewTrade}
                className="h-[36px] px-4 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 active:scale-[0.98] transition-all text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-xs cursor-pointer border border-transparent dark:border-slate-300"
              >
                <span>+</span>
                <span>New Trade</span>
              </button>
            )}
          </div>

          {/* Mobile Controls (< md) */}
          <div className="flex md:hidden items-center gap-1 shrink-0">
            {/* Compact Mode Toggle */}
            <button
              type="button"
              onClick={() => onToggleFixture(!useFixture)}
              className="h-[32px] px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] text-[var(--rtd-ink)] active:scale-[0.98] flex items-center gap-1 cursor-pointer shadow-2xs"
              aria-label={`Toggle data mode (currently ${useFixture ? "Fixture" : "Live"})`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${useFixture ? "bg-[var(--rtd-reduce)]" : statusInfo.dotClass}`} />
              <span>{useFixture ? "FIXTURE" : statusInfo.isCleanLive ? "LIVE" : isOnline ? "FALLBACK" : "OFFLINE"}</span>
            </button>

            {/* Mobile Risk Tolerance Selector (LOW / MED / HIGH) */}
            {onToggleRiskTolerance && (
              <div
                role="group"
                aria-label="Risk Tolerance Selector"
                className="inline-flex items-center border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] p-0.5 shadow-2xs"
              >
                {(["CONSERVATIVE", "MODERATE", "AGGRESSIVE"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onToggleRiskTolerance(level)}
                    aria-pressed={riskTolerance === level}
                    className={`h-[28px] px-1.5 text-[9.5px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      riskTolerance === level
                        ? level === "CONSERVATIVE"
                          ? "bg-[var(--rtd-wait)] text-[var(--rtd-paper)] shadow-xs"
                          : level === "AGGRESSIVE"
                            ? "bg-[var(--rtd-reduce)] text-[var(--rtd-paper)] shadow-xs"
                            : "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] shadow-xs"
                        : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)]"
                    }`}
                    title={
                      level === "CONSERVATIVE"
                        ? "Shift risk bands one step stricter (smaller allowances)"
                        : level === "AGGRESSIVE"
                          ? "Shift risk bands one step looser (larger allowances)"
                          : "Default desk persona: moderate risk"
                    }
                  >
                    {level === "CONSERVATIVE" ? "LOW" : level === "AGGRESSIVE" ? "HIGH" : "MED"}
                  </button>
                ))}
              </div>
            )}

            {/* Compact Theme Toggle */}
            <ThemeToggle compact className="h-[32px] min-h-[32px] px-2 py-0" />

            {/* Persisted Audit History Badge Button on Mobile */}
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="h-[32px] px-2 text-[10px] font-mono font-bold uppercase tracking-wider border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] text-[var(--rtd-ink)] active:scale-[0.98] flex items-center gap-1 cursor-pointer shadow-2xs"
                title="View persisted audit decisions log"
                aria-label={`Open audit history (${historyCount} saved)`}
              >
                <span className="text-[11px]">📋</span>
                {historyCount > 0 && (
                  <span className="px-1 py-0.2 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-[9px] font-bold">
                    {historyCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
