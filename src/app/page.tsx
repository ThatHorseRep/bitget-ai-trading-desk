"use client";

import React, { useState, useRef } from "react";
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



export default function WorkspacePage() {
  const [step, setStep] = useState<WorkspaceStep>("ENTRY");
  const [prompt, setPrompt] = useState("");
  const [useFixture, setUseFixture] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedTradeResult | null>(null);
  const [artifact, setArtifact] = useState<DecisionArtifact | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProvenance, setSelectedProvenance] = useState<ProvenanceRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

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
    if (!prompt || isAnalyzing) return;

    setStep("ANALYZING");
    setIsAnalyzing(true);
    setErrorMessage(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: prompt, useFixture }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Analysis failed.`);
      }

      const data: DecisionWorkflowResult = await response.json();

      if (data.step === "ERROR" || !data.artifact) {
        setErrorMessage(data.limitations?.[0] || "Stress test analysis failed.");
        setStep("ERROR");
        setIsAnalyzing(false);
        return;
      }

      setArtifact(data.artifact);
      setStep("DECISION_READY");
    } catch (err: any) {
      if (err.name === "AbortError") {
        return;
      }
      setErrorMessage(err instanceof Error ? err.message : "Network error during stress test.");

      setStep("ERROR");
    } finally {
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStep("ENTRY");
    setArtifact(null);
    setParsedResult(null);
    setErrorMessage(null);
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
            isAnalyzing={isAnalyzing}
          />
        )}

        {/* S05: Analysis Progress State */}
        {step === "ANALYZING" && (
          <AnalysisProgressView />
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


