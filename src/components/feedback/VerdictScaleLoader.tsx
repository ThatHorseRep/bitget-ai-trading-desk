"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { Mark } from "@/components/brand/Logo";
import { BRANDING, COLOR, REF_OFFSET } from "@/config/branding";
import type { AnalysisStage } from "../workspace/types";

interface VerdictScaleLoaderProps {
  stages?: AnalysisStage[];
  activeStageIndex?: number;
  message?: string;
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Animated Mark component that smoothly cycles offset between 0 and REF_OFFSET (9).
 * Respects `prefers-reduced-motion` by remaining static at REF_OFFSET.
 */
function AnimatedDisplacementMark() {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );

  const [offset, setOffset] = useState<number>(REF_OFFSET);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    let frameId: number;
    const startTime = performance.now();
    const cycleMs = 2400; // 2.4s ping-pong cycle

    const loop = (now: number) => {
      const elapsed = now - startTime;
      // Cosine ping-pong oscillation: 0 -> REF_OFFSET -> 0
      const t = 0.5 - 0.5 * Math.cos((elapsed / cycleMs) * 2 * Math.PI);
      setOffset(t * REF_OFFSET);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [reducedMotion]);

  const displayOffset = reducedMotion ? REF_OFFSET : offset;

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="p-3 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 shadow-xs">
        <Mark
          size={56}
          body={COLOR.ink}
          fault={COLOR.stamp}
          offset={displayOffset}
          title="Stress test displacement in progress"
        />
      </div>
      <div className="text-[10px] font-mono tracking-wider uppercase text-[var(--rtd-steel)]">
        DISPLACEMENT:{" "}
        <span className="rtd-figure font-bold text-[var(--rtd-ink)]">
          {displayOffset.toFixed(1)}u
        </span>{" "}
        /{" "}
        <span className="rtd-figure">
          {REF_OFFSET.toFixed(1)}u
        </span>
      </div>
    </div>
  );
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
      className="border border-[var(--rtd-steel)]/25 bg-white p-4 sm:p-8 space-y-6"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Stress test analysis in progress"
    >
      {/* Header and Loader Section */}
      <div className="border-b border-[var(--rtd-steel)]/20 pb-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--rtd-steel)]">
            {BRANDING.SHORT_NAME} • EVALUATION ENGINE
          </span>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-[var(--rtd-ink)] tracking-tight">
            Deterministic Risk Pipeline
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[var(--rtd-steel)] max-w-lg leading-relaxed">
            {message}
          </p>
        </div>

        {/* The Mark is the loader itself */}
        <AnimatedDisplacementMark />
      </div>

      {/* Lab Metric Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--rtd-steel)]">
          <span>PROGRESS</span>
          <span>
            <span className="rtd-figure font-bold text-[var(--rtd-ink)]">{progressPct}%</span>
            {" • "}
            STAGE{" "}
            <span className="rtd-figure font-bold text-[var(--rtd-ink)]">
              {activeStageIndex + 1}
            </span>{" "}
            OF{" "}
            <span className="rtd-figure font-bold text-[var(--rtd-ink)]">
              {totalStages}
            </span>
          </span>
        </div>
        <div className="h-1.5 w-full bg-[var(--rtd-proof)] border border-[var(--rtd-steel)]/20">
          <div
            className="h-full bg-[var(--rtd-ink)] transition-all motion-reduce:transition-none duration-300"
            style={{ width: `${Math.max(4, progressPct)}%` }}
          />
        </div>
      </div>

      {/* Active Stage Report */}
      {stages && stages.length > 0 && stages[activeStageIndex] && (
        <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper)] p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--rtd-ink)]">
              CURRENT STEP: {stages[activeStageIndex].label}
            </span>
            <span className="text-[10px] font-mono text-[var(--rtd-steel)]">
              <span className="rtd-figure">0{activeStageIndex + 1}</span> /{" "}
              <span className="rtd-figure">0{stages.length}</span>
            </span>
          </div>
          <p className="text-xs font-sans text-[var(--rtd-steel)] leading-relaxed">
            {stages[activeStageIndex].description}
          </p>
        </div>
      )}

      {/* Stages Grid */}
      {stages && stages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {stages.map((stg, idx) => {
            const isCompleted = idx < activeStageIndex;
            const isCurrent = idx === activeStageIndex;

            return (
              <div
                key={stg.id}
                className={`p-3 border text-xs font-mono transition-colors ${
                  isCurrent
                    ? "border-[var(--rtd-ink)] bg-white text-[var(--rtd-ink)] shadow-xs"
                    : isCompleted
                    ? "border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] text-[var(--rtd-steel)]"
                    : "border-[var(--rtd-steel)]/15 bg-[var(--rtd-paper)] text-[var(--rtd-steel)]/60 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[10px] tracking-wider rtd-figure">
                    0{idx + 1}
                  </span>
                  {isCompleted ? (
                    <span className="text-[10px] font-bold text-[var(--rtd-steel)]">DONE</span>
                  ) : isCurrent ? (
                    <span className="text-[10px] font-bold text-[var(--rtd-ink)]">ACTIVE</span>
                  ) : (
                    <span className="text-[10px] text-[var(--rtd-steel)]/50">QUEUED</span>
                  )}
                </div>
                <div className="font-bold truncate text-[11px]">{stg.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Closing fault rule below the text block */}
      <div className="pt-2">
        <div className="rtd-fault" aria-hidden="true" />
      </div>
    </div>
  );
}
