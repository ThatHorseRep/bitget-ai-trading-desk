"use client";

import React from "react";

interface WorkspaceHeaderProps {
  useFixture: boolean;
  onToggleFixture: (value: boolean) => void;
  onNewTrade: () => void;
  canReset: boolean;
}

export function WorkspaceHeader({
  useFixture,
  onToggleFixture,
  onNewTrade,
  canReset
}: WorkspaceHeaderProps) {
  return (
    <div className="sticky top-0 z-30 flex flex-col">
      {/* DEMO MODE BANNER for off-hours simulation */}
      {useFixture && (
        <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-bold uppercase tracking-wider text-amber-950 shadow-xs">
          DEMO MODE: Off-hours Simulation Active. Synthetic basis and liquidity risks applied.
        </div>
      )}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white font-bold text-sm tracking-wider shadow-xs">
              BG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-zinc-900 [text-wrap:balance]">
                  Bitget AI trading desk
                </h1>
                <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 border border-zinc-200">
                  Risk workbench
                </span>
              </div>
              <p className="text-xs text-zinc-500 [text-wrap:pretty]">
                Deterministic stress testing and position deconstruction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Data Mode Switch */}
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onToggleFixture(false)}
                className={`rounded-md px-3 py-1.5 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden ${
                  !useFixture
                    ? "bg-white text-zinc-900 shadow-xs font-semibold"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 align-middle animate-pulse" />
                Live Bitget and reference
              </button>
              <button
                type="button"
                onClick={() => onToggleFixture(true)}
                className={`rounded-md px-3 py-1.5 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden ${
                  useFixture
                    ? "bg-white text-zinc-900 shadow-xs font-semibold"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Deterministic fixture
              </button>
            </div>

            {canReset && (
              <button
                type="button"
                onClick={onNewTrade}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xs focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
              >
                <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New stress test
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
