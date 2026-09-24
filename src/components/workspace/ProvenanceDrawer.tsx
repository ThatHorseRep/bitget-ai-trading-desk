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

  if (!isOpen) return null;

  const records = artifact.provenance.filter(
    (rec) => activeTab === "ALL" || rec.type === activeTab
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-[var(--rtd-paper)] text-[var(--rtd-ink)] border-l border-[var(--rtd-steel)]/25 shadow-2xl flex flex-col justify-between animate-drawer-slide-in">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[var(--rtd-steel)]/15 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--rtd-proceed)]">
                Audit Trail
              </span>
              <h2 className="text-lg font-mono font-bold text-[var(--rtd-ink)]">
                Provenance &amp; Data Lineage
              </h2>
              <p className="text-xs text-[var(--rtd-steel)] mt-0.5">
                Full deterministic traceability for artifact {artifact.artifactId}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] border border-[var(--rtd-steel)]/25 hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Filter tabs */}
          <div className="px-5 py-2.5 bg-[var(--rtd-paper-subtle)] border-b border-[var(--rtd-steel)]/15 flex flex-wrap gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase border transition-all cursor-pointer ${
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
                className={`px-2.5 py-1 text-[11px] font-bold uppercase border transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] border-[var(--rtd-ink)]"
                    : "bg-[var(--rtd-paper)] text-[var(--rtd-steel)] border-[var(--rtd-steel)]/25 hover:text-[var(--rtd-ink)]"
                }`}
              >
                {CATEGORY_CONFIG[tab].label}
              </button>
            ))}
          </div>

          {/* Records List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
            {records.map((rec) => {
              const conf = CATEGORY_CONFIG[rec.type];
              const isHighlighted = selectedRecord?.id === rec.id;
              const timestamp = rec.observedAt || rec.retrievedAt || rec.publishedAt;
              return (
                <div
                  key={rec.id}
                  id={`prov-${rec.id}`}
                  className={`p-4 border transition-all ${
                    isHighlighted
                      ? "border-[var(--rtd-ink)] bg-[var(--rtd-paper-subtle)] ring-1 ring-[var(--rtd-ink)]"
                      : "border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper)] hover:border-[var(--rtd-steel)]/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-[var(--rtd-steel)]/15">
                    <span className={`font-bold uppercase tracking-wider ${conf.text}`}>
                      {conf.label}
                    </span>
                    {timestamp && (
                      <span className="text-[10px] text-[var(--rtd-steel)]">
                        {new Date(timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 space-y-1">
                    <div className="text-xs font-mono font-bold text-[var(--rtd-ink)]">
                      {rec.source || rec.generatedBy || "SYSTEM"}:{" "}
                      <span className="font-normal text-[var(--rtd-steel)]">{rec.sourceRef || rec.id}</span>
                    </div>
                    {rec.evidenceState && (
                      <div className="text-xs font-mono text-[var(--rtd-steel)]">
                        State: <span className="font-bold text-[var(--rtd-ink)]">{rec.evidenceState}</span>
                      </div>
                    )}
                    {rec.inputs && rec.inputs.length > 0 && (
                      <div className="text-[11px] font-mono text-[var(--rtd-steel)]">
                        Inputs: {rec.inputs.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--rtd-steel)]/15 bg-[var(--rtd-paper-subtle)] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
