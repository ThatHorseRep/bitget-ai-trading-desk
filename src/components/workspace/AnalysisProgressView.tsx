"use client";

import React from "react";
import type { AnalysisStage } from "./types";

interface AnalysisProgressViewProps {
  stages: AnalysisStage[];
  activeStageIndex: number;
}

export function AnalysisProgressView({
  stages,
  activeStageIndex
}: AnalysisProgressViewProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
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

        {/* Stepped Progress */}
        <div className="space-y-4">
          {stages.map((stage, idx) => {
            const isDone = idx < activeStageIndex;
            const isCurrent = idx === activeStageIndex;

            return (
              <div
                key={stage.id}
                className={`flex items-start gap-3.5 p-3 rounded-xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isCurrent
                    ? "bg-indigo-50 border border-indigo-200"
                    : isDone
                    ? "bg-zinc-50 border border-zinc-200"
                    : "opacity-40"
                }`}
              >
                <div className="mt-0.5">
                  {isDone ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : isCurrent ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs font-semibold text-zinc-400">
                      {stage.id}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-semibold [text-wrap:balance] ${
                      isCurrent ? "text-indigo-950" : isDone ? "text-zinc-800" : "text-zinc-400"
                    }`}>
                      {stage.label}
                    </h4>
                    {isDone && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Complete
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md animate-pulse">
                        Processing
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 [text-wrap:pretty]">
                    {stage.description}
                  </p>
                  {isDone && stage.detail && (
                    <p className="text-xs font-mono text-zinc-700 bg-white p-2.5 rounded-lg border border-zinc-200 mt-2">
                      {stage.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
