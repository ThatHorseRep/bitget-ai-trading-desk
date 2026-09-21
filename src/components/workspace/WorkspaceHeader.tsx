"use client";

import React from "react";
import { BRANDING } from "@/config/branding";
import { PwaInstallButton } from "../pwa/PwaManager";

interface WorkspaceHeaderProps {
  useFixture: boolean;
  onToggleFixture: (value: boolean) => void;
  onNewTrade: () => void;
  canReset: boolean;
  onViewOverview?: () => void;
}

export function WorkspaceHeader({
  useFixture,
  onToggleFixture,
  onNewTrade,
  canReset,
  onViewOverview
}: WorkspaceHeaderProps) {
  return (
    <div className="sticky top-0 z-30 flex flex-col pt-safe">
      {/* DEMO MODE BANNER for off-hours simulation */}
      {useFixture && (
        <div className="bg-[var(--rt-verdict-moderate)] px-4 py-1 text-center text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-white shadow-xs">
          DEMO MODE: Simulating Weekend Off-Hours Session
        </div>
      )}
      <header className="border-b border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)]">
        {/* Desktop & Tablet Layout (>= md) */}
        <div className="hidden md:flex mx-auto max-w-6xl px-4 py-3 sm:px-6 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="Bitget AI RedTeam Desk Mark"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-mono font-bold text-[var(--rt-text-primary)] [text-wrap:balance]">
                  {BRANDING.PRODUCT_NAME}
                </h1>
                <span className="inline-flex items-center bg-[var(--rt-surface-base)] px-2 py-0.5 text-xs font-mono font-semibold text-[var(--rt-text-primary)] border border-[var(--rt-border-subtle)]">
                  Risk workbench
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--rt-text-muted)] [text-wrap:pretty]">
                Deterministic stress testing and position deconstruction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <PwaInstallButton />

            {onViewOverview && (
              <button
                type="button"
                onClick={onViewOverview}
                className="min-h-[44px] px-3 py-1.5 border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] text-xs font-mono font-semibold text-[var(--rt-text-muted)] hover:text-[var(--rt-text-primary)] hover:bg-[var(--rt-surface-raised)] active:scale-[0.98] transition-all"
              >
                ← System overview
              </button>
            )}

            {/* Data Mode Switch */}
            <div className="flex items-center border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-1 text-xs font-mono font-semibold">
              <button
                type="button"
                onClick={() => onToggleFixture(false)}
                className={`min-h-[44px] px-3 py-1.5 active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden ${
                  !useFixture
                    ? "bg-[var(--rt-surface-raised)] text-[var(--rt-text-primary)] shadow-xs font-semibold"
                    : "text-[var(--rt-text-muted)] hover:text-[var(--rt-text-primary)]"
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--rt-verdict-clear)] mr-1.5 align-middle motion-safe:animate-pulse" />
                Live Bitget
              </button>
              <button
                type="button"
                onClick={() => onToggleFixture(true)}
                className={`min-h-[44px] px-3 py-1.5 active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden ${
                  useFixture
                    ? "bg-[var(--rt-surface-raised)] text-[var(--rt-text-primary)] shadow-xs font-semibold"
                    : "text-[var(--rt-text-muted)] hover:text-[var(--rt-text-primary)]"
                }`}
              >
                Deterministic fixture
              </button>
            </div>

            {canReset && (
              <button
                type="button"
                onClick={onNewTrade}
                className="inline-flex min-h-[44px] items-center gap-1.5 border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] px-4 py-2 text-sm font-mono font-semibold text-[var(--rt-text-primary)] hover:bg-[var(--rt-surface-base)] hover:text-[var(--rt-text-primary)] active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xs focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden"
              >
                <svg className="w-3.5 h-3.5 text-[var(--rt-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New stress test
              </button>
            )}
          </div>
        </div>

        {/* Mobile Header (< md: 48px compact bar) */}
        <div className="flex md:hidden h-12 px-3 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="Bitget AI RedTeam Desk Mark"
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
            />
            <span className="font-mono font-bold text-sm tracking-tight text-[var(--rt-text-primary)] truncate max-w-[170px]">
              {BRANDING.PRODUCT_NAME}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFixture(!useFixture)}
              className={`inline-flex items-center px-2 py-1 text-[10px] font-mono font-bold border min-h-[44px] ${
                useFixture
                  ? "bg-[var(--rt-surface-base)] text-[var(--rt-verdict-moderate)] border-[var(--rt-verdict-moderate)]"
                  : "bg-[var(--rt-surface-base)] text-[var(--rt-verdict-clear)] border-[var(--rt-border-subtle)]"
              }`}
              aria-label={`Toggle data mode (currently ${useFixture ? "Fixture" : "Live"})`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${useFixture ? "bg-[var(--rt-verdict-moderate)]" : "bg-[var(--rt-verdict-clear)] animate-pulse"}`} />
              {useFixture ? "Fixture" : "Live"}
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}


