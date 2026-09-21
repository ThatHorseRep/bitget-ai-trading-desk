"use client";

import React, { useState, useEffect } from "react";
import type { DecisionArtifact, ProvenanceRecord, ProvenanceType } from "../../domain/decision/types";

interface ProvenanceDrawerProps {
  artifact: DecisionArtifact;
  isOpen: boolean;
  onClose: () => void;
  selectedRecord: ProvenanceRecord | null;
}

const CATEGORY_CONFIG: Record<
  ProvenanceType,
  { label: string; bg: string; text: string; border: string }
> = {
  OBSERVED_FACT: {
    label: "Observed fact",
    bg: "bg-[var(--rt-surface-raised)]",
    text: "text-[var(--rt-verdict-clear)]",
    border: "border-[var(--rt-verdict-clear)]"
  },
  CALCULATED_METRIC: {
    label: "Calculated metric",
    bg: "bg-[var(--rt-surface-raised)]",
    text: "text-[var(--rt-text-primary)]",
    border: "border-[var(--rt-border-subtle)]"
  },
  SCENARIO_ASSUMPTION: {
    label: "Scenario assumption",
    bg: "bg-[var(--rt-surface-raised)]",
    text: "text-[var(--rt-verdict-moderate)]",
    border: "border-[var(--rt-verdict-moderate)]"
  },
  AI_INTERPRETATION: {
    label: "AI interpretation",
    bg: "bg-[var(--rt-surface-raised)]",
    text: "text-[var(--rt-text-muted)]",
    border: "border-[var(--rt-border-subtle)]"
  }
};

export function ProvenanceDrawer({
  artifact,
  isOpen,
  onClose,
  selectedRecord
}: ProvenanceDrawerProps) {
  const [activeTab, setActiveTab] = useState<ProvenanceType | "ALL">("ALL");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const records = artifact.provenance.filter(
    (rec) => activeTab === "ALL" || rec.type === activeTab
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 flex justify-end" role="dialog" aria-modal="true" aria-label="Provenance details">
      <div className="w-full md:max-w-xl bg-[var(--rt-surface-raised)] shadow-2xl h-full flex flex-col border-l border-[var(--rt-border-subtle)] pt-safe pb-safe">
        {/* Header */}
        <div className="border-b border-[var(--rt-border-subtle)] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between bg-[var(--rt-surface-base)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[var(--rt-text-muted)]">
                Data provenance and audit S09
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-mono font-bold text-[var(--rt-text-primary)] mt-0.5 [text-wrap:balance]">
              Evidence and verification chain
            </h3>
            <p className="text-[11px] sm:text-xs text-[var(--rt-text-muted)] [text-wrap:pretty]">
              Deterministic separation of facts, formulas, and hypotheses
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close provenance drawer"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 text-[var(--rt-text-muted)] hover:text-[var(--rt-text-primary)] hover:bg-[var(--rt-surface-raised)] active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-[var(--rt-border-subtle)] px-4 sm:px-6 gap-2 bg-[var(--rt-surface-raised)] overflow-x-auto py-2 text-xs">
          {(["ALL", "OBSERVED_FACT", "CALCULATED_METRIC", "SCENARIO_ASSUMPTION", "AI_INTERPRETATION"] as const).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`min-h-[44px] px-3 py-1.5 font-mono font-medium whitespace-nowrap active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden ${
                  activeTab === tab
                    ? "bg-[var(--rt-surface-void)] text-white font-semibold"
                    : "text-[var(--rt-text-muted)] hover:bg-[var(--rt-surface-base)] hover:text-[var(--rt-text-primary)]"
                }`}
              >
                {tab === "ALL" ? "All records" : CATEGORY_CONFIG[tab].label}
              </button>
            )
          )}
        </div>

        {/* Record List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {records.map((rec) => {
            const config = CATEGORY_CONFIG[rec.type];
            const isHighlight = selectedRecord && selectedRecord.id === rec.id;

            return (
              <div
                key={rec.id}
                className={`border p-4 motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isHighlight
                    ? "ring-2 ring-[var(--rt-text-muted)] border-[var(--rt-text-primary)] bg-[var(--rt-surface-base)]"
                    : "border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] hover:border-[var(--rt-text-muted)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-mono font-semibold border ${config.bg} ${config.text} ${config.border}`}
                    >
                      {config.label}
                    </span>
                    {rec.evidenceState && (
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase border ${
                        rec.evidenceState === "LIVE_RETRIEVED"
                          ? "bg-[var(--rt-surface-base)] text-[var(--rt-verdict-clear)] border-[var(--rt-border-subtle)]"
                          : rec.evidenceState === "UNAVAILABLE"
                          ? "bg-[var(--rt-surface-base)] text-[var(--rt-verdict-critical)] border-[var(--rt-border-subtle)]"
                          : "bg-[var(--rt-surface-base)] text-[var(--rt-text-muted)] border-[var(--rt-border-subtle)]"
                      }`}>
                        {rec.evidenceState.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-[var(--rt-text-muted)]">
                    {rec.id}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-[var(--rt-text-primary)] [text-wrap:balance] break-words">
                  {rec.source || rec.generatedBy || "System observation"}
                </h4>

                {rec.sourceRef && (
                  <a
                    href={rec.sourceRef}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--rt-text-primary)] hover:underline font-mono font-medium break-all focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden"
                  >
                    <span>{rec.sourceRef}</span>
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}

                {rec.inputs && rec.inputs.length > 0 && (
                  <div className="mt-2 text-xs">
                    <span className="font-mono font-semibold text-[var(--rt-text-muted)]">Inputs and parameters:</span>
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-[var(--rt-text-primary)] font-mono text-xs bg-[var(--rt-surface-base)] p-2.5 border border-[var(--rt-border-subtle)]">
                      {rec.inputs.map((inp, idx) => (
                        <li key={idx} className="[text-wrap:pretty]">{inp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[var(--rt-text-muted)] border-t border-[var(--rt-border-subtle)] pt-2">
                  {rec.observedAt && (
                    <span>Observed: {new Date(rec.observedAt).toLocaleTimeString()}</span>
                  )}
                  {rec.publishedAt && (
                    <span>Published: {new Date(rec.publishedAt).toLocaleDateString()}</span>
                  )}
                  {rec.generatedBy && (
                    <span>Engine: {rec.generatedBy}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--rt-border-subtle)] p-4 bg-[var(--rt-surface-base)] text-xs font-mono text-[var(--rt-text-muted)] flex justify-between items-center">
          <span>{records.length} records verified</span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] px-4 py-2 font-mono font-medium text-[var(--rt-text-primary)] hover:bg-[var(--rt-surface-base)] active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden"
          >
            Close drawer
          </button>
        </div>
      </div>
    </div>
  );
}


