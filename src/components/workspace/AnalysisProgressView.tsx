"use client";

import React from "react";
import type { AnalysisStage } from "./types";
import { VerdictScaleLoader } from "../feedback/VerdictScaleLoader";

interface AnalysisProgressViewProps {
  stages?: AnalysisStage[];
  activeStageIndex?: number;
}

export function AnalysisProgressView({
  stages,
  activeStageIndex = 0
}: AnalysisProgressViewProps) {
  // Elapsed time on the CONFIRMED active stage. Stages advance only when the
  // engine's own SSE progress frame says so (the old 2.8s cadence ticker that
  // auto-advanced unconfirmed labels was removed) — this counter reports the
  // wait honestly instead of implying work the pipeline has not reached.
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const [trackedStage, setTrackedStage] = React.useState(activeStageIndex);

  // Reset the counter when the confirmed stage changes. Render-phase
  // adjustment (React's documented "adjust state when a prop changes"
  // pattern) keeps the count honest without setState-in-effect.
  if (trackedStage !== activeStageIndex) {
    setTrackedStage(activeStageIndex);
    setElapsedSec(0);
  }

  React.useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeStageIndex]);

  const activeLabel = stages?.[activeStageIndex]?.label ?? "Evaluation";

  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-live="polite" aria-busy="true">
      <VerdictScaleLoader
        stages={stages}
        activeStageIndex={activeStageIndex}
        message="Evaluating market state, thesis vulnerability, basis spread, and deterministic stress scenarios."
      />
      <div
        role="status"
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] px-3 py-2 text-[11px] font-mono text-[var(--rtd-steel)]"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--rtd-ink)] animate-pulse" aria-hidden="true" />
        <span className="font-bold uppercase tracking-wider text-[var(--rtd-ink)]">Still working</span>
        <span>
          — {activeLabel} running for{" "}
          <span className="rtd-figure font-bold text-[var(--rtd-ink)]">{elapsedSec}s</span>
          {" "}(stage advances only on engine-confirmed progress)
        </span>
      </div>
    </div>
  );
}
