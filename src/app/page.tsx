"use client";

import React, { useState } from "react";
import { WorkspaceHeader } from "../components/workspace/WorkspaceHeader";
import { TradeInputSurface } from "../components/workspace/TradeInputSurface";
import { ClarificationModal } from "../components/workspace/ClarificationModal";
import { NormalizedReviewCard } from "../components/workspace/NormalizedReviewCard";
import { AnalysisProgressView } from "../components/workspace/AnalysisProgressView";
import { DecisionArtifactView } from "../components/workspace/DecisionArtifactView";
import { ProvenanceDrawer } from "../components/workspace/ProvenanceDrawer";
import type { AnalysisStage, WorkspaceStep } from "../components/workspace/types";
import type { DecisionWorkflowResult } from "../services/decisionDeskService";
import type { DecisionArtifact, ProvenanceRecord } from "../domain/decision/types";
import type { ParsedTradeResult } from "../core/trade/parser";
import { parseNaturalLanguageTrade } from "../core/trade/parser";

const DEFAULT_STAGES: AnalysisStage[] = [
  {
    id: 1,
    label: "Reconstructing market state",
    description: "Querying Bitget orderbook ticker, Yahoo reference equity price, and session status."
  },
  {
    id: 2,
    label: "Understanding the thesis",
    description: "Decomposing natural language rationale into explicit assumptions and dependencies."
  },
  {
    id: 3,
    label: "Testing the thesis",
    description: "Searching financial evidence feeds and generating adversarial counter theses."
  },
  {
    id: 4,
    label: "Stress testing the position",
    description: "Computing deterministic P and L under market shock, crypto contagion, and microstructure widening."
  },
  {
    id: 5,
    label: "Checking relevant exposure",
    description: "Assessing correlations with BTC holdings and portfolio drag."
  },
  {
    id: 6,
    label: "Building decision policy",
    description: "Applying strict deterministic policy gates to formulate final verdict and change conditions."
  }
];

export default function WorkspacePage() {
  const [step, setStep] = useState<WorkspaceStep>("ENTRY");
  const [prompt, setPrompt] = useState("");
  const [useFixture, setUseFixture] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedTradeResult | null>(null);
  const [artifact, setArtifact] = useState<DecisionArtifact | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stages, setStages] = useState<AnalysisStage[]>(DEFAULT_STAGES);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProvenance, setSelectedProvenance] = useState<ProvenanceRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step S02 -> S03 or S04
  const handleInitialSubmit = (rawInput: string) => {
    setPrompt(rawInput);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const parsed = parseNaturalLanguageTrade(rawInput);
      setParsedResult(parsed);

      if (parsed.requiresClarification || !parsed.normalizedTrade) {
        setStep("CLARIFICATION");
      } else {
        setStep("REVIEW");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to interpret trade statement.");
      setStep("ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step S03 Clarification answered
  const handleClarificationResolved = (supplementalText: string) => {
    setPrompt(supplementalText);
    handleInitialSubmit(supplementalText);
  };

  // Step S04 Confirmed -> Run S05 Analysis and Fetch Artifact
  const handleConfirmRunStressTest = async () => {
    if (!prompt) return;

    setStep("ANALYZING");
    setActiveStageIndex(0);
    setErrorMessage(null);

    // Progressive stage feedback simulation while calling the backend API
    const progressTimer = setInterval(() => {
      setActiveStageIndex((prev) => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      const response = await fetch("/api/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: prompt, useFixture })
      });

      const data: DecisionWorkflowResult = await response.json();

      clearInterval(progressTimer);
      setActiveStageIndex(5);

      if (data.step === "ERROR" || !data.artifact) {
        setErrorMessage(data.limitations[0] || "Stress test analysis failed.");
        setStep("ERROR");
        return;
      }

      // Update stage details with real observations from artifact
      const updatedStages = [...DEFAULT_STAGES];
      updatedStages[0].detail = `Bitget rNVDA: $${data.artifact.marketState.instrumentPrice.toFixed(2)} | Ref: $${data.artifact.marketState.referencePrice ? data.artifact.marketState.referencePrice.toFixed(2) : "N/A"} | Session: ${data.artifact.marketState.sessionStatus}`;
      updatedStages[1].detail = `${data.artifact.thesis.assumptions.length} assumptions isolated, ${data.artifact.thesis.dependencies.length} dependencies`;
      updatedStages[2].detail = `Counter thesis generated: "${data.artifact.challenge.counterThesis.slice(0, 60)}..."`;
      updatedStages[3].detail = `Scenarios computed: 4 deterministic shocks evaluated`;
      updatedStages[4].detail = `Existing exposure: ${data.artifact.trade.relevantExposure.length > 0 ? `${data.artifact.trade.relevantExposure[0].asset} evaluated` : "None declared"}`;
      updatedStages[5].detail = `Final Verdict: ${data.artifact.decision.verdict} with ${data.artifact.decision.reasons.length} policy reasons`;
      setStages(updatedStages);

      // Brief transition delay so the user sees all stages light up
      setTimeout(() => {
        setArtifact(data.artifact);
        setStep("DECISION_READY");
      }, 500);
    } catch (err) {
      clearInterval(progressTimer);
      setErrorMessage(err instanceof Error ? err.message : "Network error during stress test.");
      setStep("ERROR");
    }
  };

  const handleReset = () => {
    setStep("ENTRY");
    setArtifact(null);
    setParsedResult(null);
    setErrorMessage(null);
    setActiveStageIndex(0);
    setStages(DEFAULT_STAGES);
    setSelectedProvenance(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Persistent Navigation / Desk Header */}
      <WorkspaceHeader
        useFixture={useFixture}
        onToggleFixture={setUseFixture}
        onNewTrade={handleReset}
        canReset={step !== "ENTRY"}
      />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        {/* S01 / S02: Input State */}
        {step === "ENTRY" && (
          <TradeInputSurface
            initialPrompt={prompt}
            onSubmit={handleInitialSubmit}
            isLoading={isSubmitting}
          />
        )}

        {/* S03: Clarification State */}
        {step === "CLARIFICATION" && parsedResult && (
          <ClarificationModal
            parsedResult={parsedResult}
            originalPrompt={prompt}
            onResolve={handleClarificationResolved}
            onEditOriginal={() => setStep("ENTRY")}
          />
        )}

        {/* S04: Normalized Trade Review */}
        {step === "REVIEW" && parsedResult && parsedResult.normalizedTrade && (
          <NormalizedReviewCard
            normalizedTrade={parsedResult.normalizedTrade}
            parsedResult={parsedResult}
            onConfirm={handleConfirmRunStressTest}
            onEdit={() => setStep("ENTRY")}
          />
        )}

        {/* S05: Analysis Progress State */}
        {step === "ANALYZING" && (
          <AnalysisProgressView
            stages={stages}
            activeStageIndex={activeStageIndex}
          />
        )}

        {/* S06: Decision Artifact Ready State */}
        {step === "DECISION_READY" && artifact && (
          <DecisionArtifactView
            artifact={artifact}
            onOpenProvenance={() => setIsDrawerOpen(true)}
            onNewTrade={handleReset}
          />
        )}

        {/* S08: Error / Blocked State */}
        {step === "ERROR" && (
          <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-6 sm:p-8 shadow-xs space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 [text-wrap:balance]">
              Analysis could not proceed
            </h3>
            <p className="text-sm text-zinc-600 [text-wrap:pretty]">
              {errorMessage || "An unexpected error occurred while stress testing your proposed trade."}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setStep("ENTRY")}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
              >
                Back to edit
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
              >
                Restart workspace
              </button>
            </div>
          </div>
        )}
      </main>

      {/* S09: Provenance Drawer */}
      {artifact && (
        <ProvenanceDrawer
          artifact={artifact}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          selectedRecord={selectedProvenance}
        />
      )}
    </div>
  );
}


