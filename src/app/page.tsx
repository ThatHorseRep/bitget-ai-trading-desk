"use client";

import React, { useState, useRef, useEffect } from "react";
import { WorkspaceHeader } from "../components/workspace/WorkspaceHeader";
import { MobileBottomNav } from "../components/workspace/MobileBottomNav";
import { TradeInputSurface } from "../components/workspace/TradeInputSurface";
import { ClarificationModal } from "../components/workspace/ClarificationModal";
import { NormalizedReviewCard } from "../components/workspace/NormalizedReviewCard";
import { AnalysisProgressView } from "../components/workspace/AnalysisProgressView";
import { DecisionArtifactView } from "../components/workspace/DecisionArtifactView";
import { ProvenanceDrawer } from "../components/workspace/ProvenanceDrawer";
import { AuditHistoryModal } from "../components/workspace/AuditHistoryModal";
import { LandingSurface } from "../components/landing/LandingSurface";
import type { AnalysisStage, WorkspaceStep } from "../components/workspace/types";
import type { DecisionWorkflowResult } from "../services/decisionDeskService";
import type { DecisionArtifact, ProvenanceRecord } from "../domain/decision/types";
import type { ParsedTradeResult } from "../core/trade/parser";
import { parseNaturalLanguageTrade } from "../core/trade/parser";
import {
  loadPersistedWorkspaceState,
  savePersistedWorkspaceState,
  clearPersistedWorkspaceState,
  loadAuditHistory,
  recordAuditHistory,
  clearAuditHistory,
  type AuditHistoryEntry
} from "../lib/deskStorage";

export default function WorkspacePage() {
  const [persistedInitial] = useState(() => loadPersistedWorkspaceState());

  const [viewMode, setViewMode] = useState<"landing" | "desk">(() => persistedInitial?.viewMode ?? "landing");
  const [step, setStep] = useState<WorkspaceStep>(() => {
    if (persistedInitial?.step === "ANALYZING") {
      return persistedInitial.artifact ? "DECISION_READY" : "REVIEW";
    }
    return persistedInitial?.step ?? "ENTRY";
  });
  const [prompt, setPrompt] = useState(() => persistedInitial?.prompt ?? "");
  const [useFixture, setUseFixture] = useState(() => Boolean(persistedInitial?.useFixture));
  const [parsedResult, setParsedResult] = useState<ParsedTradeResult | null>(() => persistedInitial?.parsedResult ?? null);
  const [artifact, setArtifact] = useState<DecisionArtifact | null>(() => persistedInitial?.artifact ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryEntry[]>(() => loadAuditHistory());
  const [selectedProvenance, setSelectedProvenance] = useState<ProvenanceRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-persist active state changes so page refresh never loses context
  useEffect(() => {
    savePersistedWorkspaceState({
      viewMode,
      step,
      prompt,
      useFixture,
      parsedResult,
      artifact,
      timestamp: Date.now()
    });
  }, [viewMode, step, prompt, useFixture, parsedResult, artifact]);

  const handleLaunchFromLanding = (initialPrompt?: string) => {
    setViewMode("desk");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    if (initialPrompt && initialPrompt.trim()) {
      setPrompt(initialPrompt);
      handleInitialSubmit(initialPrompt);
    } else {
      setPrompt("");
      setStep("ENTRY");
      setArtifact(null);
      setParsedResult(null);
      setErrorMessage(null);
      setSelectedProvenance(null);
    }
  };

  // Step S02 -> S03 or S04
  const handleInitialSubmit = async (rawInput: string) => {
    setPrompt(rawInput);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const parsed = parseNaturalLanguageTrade(rawInput);
      
      if (parsed.normalizedTrade && parsed.normalizedTrade.entryPriceSource === "SYSTEM_DERIVED" && parsed.normalizedTrade.entryPrice === 0) {
         try {
            const res = await fetch(`/api/market-price?asset=${parsed.normalizedTrade.asset}`);
            if (res.ok) {
               const data = await res.json();
               if (data.price > 0) {
                  parsed.normalizedTrade.entryPrice = data.price;
                  parsed.normalizedTrade.entryBasisTimestamp = data.timestamp;
                  parsed.normalizedTrade.quantity = parseFloat((parsed.normalizedTrade.positionSizeUsd / data.price).toFixed(8));
               }
            }
         } catch (e) {
            console.error("Failed to pre-fetch live price", e);
         }
      }

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

  const PIPELINE_STAGES: AnalysisStage[] = [
    { id: "MARKET_STATE", label: "Reconstructing Market State", description: "Querying token orderbook, reference quotes, basis spread, and trading session." },
    { id: "EVIDENCE", label: "Retrieving External Evidence", description: "Gathering corporate news, macro catalysts, and institutional evidence." },
    { id: "SCENARIOS", label: "Running Deterministic Stress Scenarios", description: "Computing exact scenario shocks: Market Risk (-5%), Crypto Contagion (-8%), and Illiquidity." },
    { id: "THESIS_EXTRACTION", label: "Extracting and Decomposing Thesis", description: "Deconstructing core assumptions, causal dependencies, and invalidation thresholds." },
    { id: "CHALLENGE", label: "Generating Adversarial Counter-Thesis", description: "Challenging vulnerable assumptions against off-hours structural risks." },
    { id: "ASSESSMENT", label: "Evaluating Thesis vs. Position", description: "Synthesizing position quality and executing deterministic policy rules." },
  ];

  const [stages, setStages] = useState<AnalysisStage[]>(PIPELINE_STAGES);
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  // Step S04 Confirmed -> Run S05 Analysis and Fetch Artifact
  const handleConfirmRunStressTest = async () => {
    if (!prompt || isAnalyzing) return;

    setStep("ANALYZING");
    setIsAnalyzing(true);
    setErrorMessage(null);
    setStages(PIPELINE_STAGES);
    setActiveStageIndex(0);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: prompt, useFixture }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok && !response.body) {
        if (response.status === 429) {
          throw new Error("Rate limit reached: the desk accepts up to 10 stress tests per minute. Please wait about a minute and try again.");
        }
        if (response.status === 413) {
          throw new Error("The trade statement is too large to analyze. Please shorten it and try again.");
        }
        throw new Error(`Analysis request rejected (HTTP ${response.status}).`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to start response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let finalData: DecisionWorkflowResult | null = null;
      let finalStatus = 200;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "progress") {
              const matchedIdx = PIPELINE_STAGES.findIndex(s => s.id === parsed.stageId);
              if (matchedIdx >= 0) {
                setActiveStageIndex(matchedIdx);
              }
            } else if (parsed.type === "result" || parsed.type === "error") {
              finalData = parsed.data;
              finalStatus = parsed.status || 200;
            }
          } catch (e) {
             console.error("Failed to parse stream line:", line);
          }
        }
      }

      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          if (parsed.type === "result" || parsed.type === "error") {
            finalData = parsed.data;
            finalStatus = parsed.status || 200;
          }
        } catch (e) {
          console.error("Failed to parse remaining stream buffer:", buffer);
        }
      }

      if (!finalData || finalData.step === "ERROR" || !finalData.artifact) {
        setErrorMessage(
          finalData?.limitations?.[0] ??
          (finalStatus === 200
            ? "The analysis ran out of its execution time budget before a decision could be returned. Try the Deterministic fixture mode, or narrow the trade question."
            : `HTTP ${finalStatus}: Analysis failed.`)
        );
        setStep("ERROR");
        setIsAnalyzing(false);
        return;
      }

      setArtifact(finalData.artifact);
      setStep("DECISION_READY");
      // Record into audit log history
      recordAuditHistory(finalData.artifact);
      setAuditHistory(loadAuditHistory());
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
    setPrompt("");
    setArtifact(null);
    setParsedResult(null);
    setErrorMessage(null);
    setSelectedProvenance(null);
    clearPersistedWorkspaceState();
  };

  const handleSelectAuditFromHistory = (entry: AuditHistoryEntry) => {
    setArtifact(entry.artifact);
    setPrompt(entry.artifact.trade.thesis || `${entry.artifact.trade.direction} $${entry.artifact.trade.positionSizeUsd} ${entry.artifact.trade.asset}`);
    setStep("DECISION_READY");
    setViewMode("desk");
    setIsHistoryOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  const handleClearHistory = () => {
    clearAuditHistory();
    setAuditHistory([]);
  };

  return (
    <div className="min-h-screen bg-[var(--rtd-proof)] text-[var(--rtd-ink)] font-sans selection:bg-[var(--rtd-ink)] selection:text-[var(--rtd-paper)]">
      {viewMode === "landing" ? (
        <LandingSurface onLaunchDesk={handleLaunchFromLanding} />
      ) : (
        <>
          {/* Persistent Navigation / Desk Header */}
          <WorkspaceHeader
            useFixture={useFixture}
            onToggleFixture={setUseFixture}
            onNewTrade={handleReset}
            canReset={step !== "ENTRY"}
            onViewOverview={() => setViewMode("landing")}
            onOpenHistory={() => setIsHistoryOpen(true)}
            historyCount={auditHistory.length}
          />

          <main
            className={`px-4 sm:px-6 lg:px-8 ${
              step === "ENTRY"
                ? "py-3 sm:py-4 lg:h-[calc(100dvh-4.25rem)] lg:overflow-hidden flex flex-col justify-center"
                : "py-6 sm:py-8 pb-24 md:pb-12"
            }`}
          >
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
                isSubmitting={isSubmitting}
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
              <AnalysisProgressView stages={stages} activeStageIndex={activeStageIndex} />
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
              <div className="mx-auto max-w-xl border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-6 sm:p-8 shadow-xs space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[var(--rt-verdict-critical)] bg-[var(--rt-surface-base)] text-[var(--rt-verdict-critical)] font-mono font-bold text-lg">
                  !
                </div>
                <h3 className="text-lg font-mono font-bold text-[var(--rt-text-primary)] [text-wrap:balance]">
                  Analysis Could Not Proceed
                </h3>
                <p className="text-sm font-mono text-[var(--rt-text-muted)] [text-wrap:pretty]">
                  {errorMessage || "An unexpected error occurred while stress testing your proposed trade."}
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("ENTRY")}
                    className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] px-4 py-2 text-xs font-mono font-semibold text-[var(--rt-text-primary)] hover:bg-[var(--rt-surface-raised)] active:scale-[0.98] transition-colors"
                  >
                    Back to edit
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="border border-[var(--rt-surface-void)] bg-[var(--rt-surface-void)] px-4 py-2 text-xs font-mono font-semibold text-[var(--rt-surface-raised)] hover:opacity-90 active:scale-[0.98] transition-opacity"
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

          {/* S10: Institutional Audit History Modal */}
          <AuditHistoryModal
            isOpen={isHistoryOpen}
            history={auditHistory}
            onSelectAudit={handleSelectAuditFromHistory}
            onClearHistory={handleClearHistory}
            onClose={() => setIsHistoryOpen(false)}
          />

          {/* Mobile Persistent Bottom Navigation */}
          <MobileBottomNav
            useFixture={useFixture}
            onToggleFixture={setUseFixture}
            onNewTrade={handleReset}
            canReset={step !== "ENTRY"}
            onViewOverview={() => setViewMode("landing")}
            onOpenProvenance={() => setIsDrawerOpen(true)}
            hasArtifact={Boolean(artifact)}
          />
        </>
      )}
    </div>
  );
}


