"use client";

import React from "react";
import type { AnalysisStage } from "./types";

interface AnalysisProgressViewProps {
  stages?: AnalysisStage[];
  activeStageIndex?: number;
}

export function AnalysisProgressView({
  stages,
  activeStageIndex
}: AnalysisProgressViewProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-live="polite" aria-busy="true">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-zinc-100 pb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Analysis S05
          </span>
          <h2 className="text-xl font-bold text-zinc-900 [text-wrap:balance]">
            Running stress test engine
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5 [text-wrap:pretty]">
            Evaluating market state, thesis vulnerability, basis spread, and deterministic stress scenarios.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3.5 p-3 rounded-xl bg-indigo-50 border border-indigo-200 motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
            <div className="mt-0.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                <svg className="motion-safe:animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold [text-wrap:balance] text-indigo-950">
                  Analyzing Trade
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-1.5 bg-indigo-200/50 rounded-full overflow-hidden hidden sm:block">
                    <div 
                       className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                       style={{ width: `${Math.min(100, Math.round((Math.max(0, activeStageIndex ?? 0) / 8) * 100))}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md motion-safe:animate-pulse">
                    Processing {Math.min(100, Math.round((Math.max(0, activeStageIndex ?? 0) / 8) * 100))}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 [text-wrap:pretty]">
                The desk is currently reconstructing market state, finding relevant contradictions, stress-testing the position, and synthesizing the decision.
              </p>
              
              {stages && stages.length > 0 && activeStageIndex !== undefined && stages[activeStageIndex] && (
                <p className="text-xs font-medium text-indigo-700 mt-2.5 bg-indigo-100/50 inline-block px-2 py-1 rounded-md">
                  Current Action: {stages[activeStageIndex].label}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



