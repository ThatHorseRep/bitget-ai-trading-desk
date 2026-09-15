"use client";

import React, { useState } from "react";
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
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200"
  },
  CALCULATED_METRIC: {
    label: "Calculated metric",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200"
  },
  SCENARIO_ASSUMPTION: {
    label: "Scenario assumption",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200"
  },
  AI_INTERPRETATION: {
    label: "AI interpretation",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200"
  }
};

export function ProvenanceDrawer({
  artifact,
  isOpen,
  onClose,
  selectedRecord
}: ProvenanceDrawerProps) {
  const [activeTab, setActiveTab] = useState<ProvenanceType | "ALL">("ALL");

  if (!isOpen) return null;

  const records = artifact.provenance.filter(
    (rec) => activeTab === "ALL" || rec.type === activeTab
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end">
      <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col border-l border-zinc-200">
        {/* Header */}
        <div className="border-b border-zinc-200 px-6 py-4 flex items-center justify-between bg-zinc-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Data provenance and audit S09
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-900 mt-0.5 [text-wrap:balance]">
              Evidence and verification chain
            </h3>
            <p className="text-xs text-zinc-500 [text-wrap:pretty]">
              Deterministic separation of facts, formulas, and hypotheses
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-zinc-200 px-6 gap-2 bg-white overflow-x-auto py-2 text-xs">
          {(["ALL", "OBSERVED_FACT", "CALCULATED_METRIC", "SCENARIO_ASSUMPTION", "AI_INTERPRETATION"] as const).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden ${
                  activeTab === tab
                    ? "bg-zinc-900 text-white font-semibold"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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
                className={`rounded-xl border p-4 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isHighlight
                    ? "ring-2 ring-zinc-900 border-zinc-900 bg-zinc-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
                    >
                      {config.label}
                    </span>
                    {rec.evidenceState && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                        rec.evidenceState === "LIVE_RETRIEVED"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : rec.evidenceState === "UNAVAILABLE"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : "bg-purple-100 text-purple-800 border-purple-200"
                      }`}>
                        {rec.evidenceState.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-zinc-400">
                    {rec.id}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-zinc-900 [text-wrap:balance]">
                  {rec.source || rec.generatedBy || "System observation"}
                </h4>

                {rec.sourceRef && (
                  <a
                    href={rec.sourceRef}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium break-all focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
                  >
                    <span>{rec.sourceRef}</span>
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}

                {rec.inputs && rec.inputs.length > 0 && (
                  <div className="mt-2 text-xs">
                    <span className="font-semibold text-zinc-500">Inputs and parameters:</span>
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-zinc-700 font-mono text-xs bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                      {rec.inputs.map((inp, idx) => (
                        <li key={idx} className="[text-wrap:pretty]">{inp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 border-t border-zinc-100 pt-2">
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
        <div className="border-t border-zinc-200 p-4 bg-zinc-50 text-xs text-zinc-500 flex justify-between items-center">
          <span>{records.length} records verified</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
          >
            Close drawer
          </button>
        </div>
      </div>
    </div>
  );
}


