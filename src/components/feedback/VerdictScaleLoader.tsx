"use client";

import React from "react";
import type { AnalysisStage } from "../workspace/types";

interface VerdictScaleLoaderProps {
  stages?: AnalysisStage[];
  activeStageIndex?: number;
  message?: string;
}

export function VerdictScaleLoader({
  stages,
  activeStageIndex = 0,
  message = "Evaluating market state, basis risk, and position resilience"
}: VerdictScaleLoaderProps) {
  const totalStages = stages?.length || 8;
  const progressPct = Math.min(
    100,
    Math.round((Math.max(0, activeStageIndex) / Math.max(1, totalStages)) * 100)
  );

  return (
    <div
      className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-6 sm:p-8 shadow-xs space-y-6"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Stress test analysis in progress"
    >
      {/* Header */}
      <div className="border-b border-[var(--rt-border-subtle)] pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--rt-text-muted)]">
            Stress Test Engine S05
          </span>
          <h2 className="text-xl font-mono font-bold text-[var(--rt-text-primary)] mt-0.5 [text-wrap:balance]">
            Deterministic Risk Evaluation
          </h2>
          <p className="text-xs font-mono text-[var(--rt-text-muted)] mt-1 [text-wrap:pretty]">
            {message}
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] px-3 py-1.5 font-mono text-xs font-semibold text-[var(--rt-text-primary)]">
          <span className="h-2 w-2 rounded-full bg-[var(--rt-verdict-clear)] motion-safe:animate-pulse motion-reduce:animate-none" />
          <span>Processing {progressPct}%</span>
        </div>
      </div>

      {/* Verdict Scale Indicator Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--rt-text-muted)]">
          <span className="text-[var(--rt-verdict-clear)]">Clear</span>
          <span className="text-[var(--rt-verdict-moderate)]">Moderate</span>
          <span className="text-[var(--rt-verdict-elevated)]">High Risk</span>
          <span className="text-[var(--rt-verdict-critical)]">Critical</span>
        </div>
        <div className="h-2 w-full border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-0.5">
          <div
            className="h-full bg-[var(--rt-surface-void)] transition-all motion-reduce:transition-none duration-500 ease-out"
            style={{ width: `${Math.max(5, progressPct)}%` }}
          />
        </div>
      </div>

      {/* Active Stage Detail */}
      {stages && stages.length > 0 && stages[activeStageIndex] && (
        <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--rt-text-primary)]">
              Current Stage: {stages[activeStageIndex].label}
            </span>
            <span className="text-[10px] font-mono text-[var(--rt-text-muted)]">
              Step {activeStageIndex + 1} of {stages.length}
            </span>
          </div>
          <p className="text-xs font-mono text-[var(--rt-text-muted)] [text-wrap:pretty]">
            {stages[activeStageIndex].description}
          </p>
        </div>
      )}

      {/* Stages List */}
      {stages && stages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
          {stages.map((stg, idx) => {
            const isCompleted = idx < activeStageIndex;
            const isCurrent = idx === activeStageIndex;

            return (
              <div
                key={stg.id}
                className={`border p-3 font-mono text-xs transition-colors ${
                  isCurrent
                    ? "border-[var(--rt-text-primary)] bg-[var(--rt-surface-base)] text-[var(--rt-text-primary)]"
                    : isCompleted
                    ? "border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-clear)]"
                    : "border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] text-[var(--rt-text-muted)] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[10px] tracking-wider">0{idx + 1}</span>
                  {isCompleted ? (
                    <span className="text-[10px] font-bold">✓ DONE</span>
                  ) : isCurrent ? (
                    <span className="text-[10px] font-bold motion-safe:animate-pulse motion-reduce:animate-none">RUNNING</span>
                  ) : (
                    <span className="text-[10px]">QUEUED</span>
                  )}
                </div>
                <div className="font-semibold truncate">{stg.label}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
