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
  { label: string; text: string; border: string }
> = {
  OBSERVED_FACT: {
    label: "Observed fact",
    text: "text-[var(--rtd-proceed)]",
    border: "border-[var(--rtd-proceed)]"
  },
  CALCULATED_METRIC: {
    label: "Calculated metric",
    text: "text-[var(--rtd-ink)]",
    border: "border-[var(--rtd-steel)]/40"
  },
  SCENARIO_ASSUMPTION: {
    label: "Scenario assumption",
    text: "text-[var(--rtd-wait)]",
    border: "border-[var(--rtd-wait)]"
  },
  AI_INTERPRETATION: {
    label: "AI interpretation",
    text: "text-[var(--rtd-steel)]",
    border: "border-[var(--rtd-steel)]/40"
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

  // Scroll to selected record when opened with one
  useEffect(() => {
    if (selectedRecord && isOpen) {
      const el = document.getElementById(`prov-${selectedRecord.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedRecord, isOpen]);

  if (!isOpen) return null;

  const records = artifact.provenance.filter(
    (rec) => activeTab === "ALL" || rec.type === activeTab
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Positioning Container (Zero horizontal overflow on mobile) */}
      <div className="fixed inset-y-0 right-0 w-full max-w-full sm:max-w-xl flex sm:pl-10 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-full sm:max-w-xl bg-[var(--rtd-paper)] text-[var(--rtd-ink)] border-l border-[var(--rtd-steel)]/25 shadow-2xl flex flex-col justify-between animate-drawer-slide-in overflow-hidden h-full">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[var(--rtd-steel)]/15 flex items-start sm:items-center justify-between gap-3 bg-[var(--rtd-paper)] shrink-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[var(--rtd-proceed)]">
                  Audit Trail
                </span>
                <span className="text-[10px] font-mono text-[var(--rtd-steel)] px-1.5 py-0.2 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/20">
                  Deterministic
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-mono font-bold text-[var(--rtd-ink)] truncate sm:whitespace-normal">
                Provenance &amp; Data Lineage
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--rtd-steel)] mt-0.5 break-all">
                Full deterministic traceability for artifact{" "}
                <span className="font-mono text-[var(--rtd-ink)]">{artifact.artifactId}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] border border-[var(--rtd-steel)]/25 hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-all cursor-pointer shrink-0 font-mono font-bold"
              aria-label="Close provenance drawer"
            >
              ✕
            </button>
          </div>

          {/* Filter tabs (Compact and clean wrapping on all viewports) */}
          <div className="px-3.5 sm:px-6 py-2.5 bg-[var(--rtd-paper-subtle)] border-b border-[var(--rtd-steel)]/15 flex flex-wrap gap-1 sm:gap-1.5 text-xs font-mono max-w-full shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase border transition-all cursor-pointer shrink-0 ${
                activeTab === "ALL"
                  ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] border-[var(--rtd-ink)]"
                  : "bg-[var(--rtd-paper)] text-[var(--rtd-steel)] border-[var(--rtd-steel)]/25 hover:text-[var(--rtd-ink)]"
              }`}
            >
              All ({artifact.provenance.length})
            </button>
            {(["OBSERVED_FACT", "CALCULATED_METRIC", "SCENARIO_ASSUMPTION", "AI_INTERPRETATION"] as ProvenanceType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase border transition-all cursor-pointer shrink-0 ${
                  activeTab === tab
                    ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] border-[var(--rtd-ink)]"
                    : "bg-[var(--rtd-paper)] text-[var(--rtd-steel)] border-[var(--rtd-steel)]/25 hover:text-[var(--rtd-ink)]"
                }`}
              >
                {CATEGORY_CONFIG[tab].label}
              </button>
            ))}
          </div>

          {/* Records List (Strict overflow-x containment with word breaking) */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 space-y-3 min-w-0 max-w-full">
            {records.map((rec) => {
              const conf = CATEGORY_CONFIG[rec.type];
              const isHighlighted = selectedRecord?.id === rec.id;
              const timestamp = rec.observedAt || rec.retrievedAt || rec.publishedAt;
              return (
                <div
                  key={rec.id}
                  id={`prov-${rec.id}`}
                  className={`p-3.5 sm:p-4 border transition-all min-w-0 max-w-full overflow-hidden ${
                    isHighlighted
                      ? "border-[var(--rtd-ink)] bg-[var(--rtd-paper-subtle)] ring-1 ring-[var(--rtd-ink)] shadow-xs"
                      : "border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper)] hover:border-[var(--rtd-steel)]/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-[var(--rtd-steel)]/15 gap-2">
                    <span className={`font-bold uppercase tracking-wider text-[10.5px] sm:text-xs truncate ${conf.text}`}>
                      {conf.label}
                    </span>
                    {timestamp && (
                      <span className="text-[10px] text-[var(--rtd-steel)] shrink-0 font-mono">
                        {new Date(timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 space-y-1.5 min-w-0">
                    <div className="text-xs font-mono font-bold text-[var(--rtd-ink)] break-words">
                      <span>{rec.source || rec.generatedBy || "SYSTEM"}: </span>
                      <span className="font-normal text-[var(--rtd-steel)] break-all">
                        {rec.sourceRef || rec.id}
                      </span>
                    </div>
                    {rec.evidenceState && (
                      <div className="text-xs font-mono text-[var(--rtd-steel)]">
                        State: <span className="font-bold text-[var(--rtd-ink)]">{rec.evidenceState}</span>
                      </div>
                    )}
                    {rec.inputs && rec.inputs.length > 0 && (
                      <div className="text-[11px] font-mono text-[var(--rtd-steel)] break-words">
                        <span className="font-bold text-[var(--rtd-ink)]">Inputs:</span>{" "}
                        <span className="break-all">{rec.inputs.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {records.length === 0 && (
              <div className="py-12 text-center border border-dashed border-[var(--rtd-steel)]/30 p-6 bg-[var(--rtd-paper-subtle)]">
                <p className="text-xs font-mono text-[var(--rtd-steel)]">
                  No provenance records found for this category.
                </p>
              </div>
            )}
          </div>

          {/* Footer (Safe area padded) */}
          <div className="p-3.5 sm:p-4 border-t border-[var(--rtd-steel)]/15 bg-[var(--rtd-paper-subtle)] flex items-center justify-between gap-3 shrink-0 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))]">
            <span className="text-[10.5px] font-mono text-[var(--rtd-steel)] truncate">
              Showing {records.length} of {artifact.provenance.length} records
            </span>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-5 py-2 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
