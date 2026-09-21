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
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-live="polite" aria-busy="true">
      <VerdictScaleLoader
        stages={stages}
        activeStageIndex={activeStageIndex}
        message="Evaluating market state, thesis vulnerability, basis spread, and deterministic stress scenarios."
      />
    </div>
  );
}




