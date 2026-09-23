"use client";

import React, { useState } from "react";
import Link from "next/link";
import { VerdictScaleLoader } from "@/components/feedback/VerdictScaleLoader";
import type { AnalysisStage } from "@/components/workspace/types";

const DEMO_STAGES: AnalysisStage[] = [
  {
    id: "parse",
    label: "Parse Intent",
    description: "Extracting asset symbol, direction, notional size, and underlying thesis.",
    status: "completed"
  },
  {
    id: "market",
    label: "Orderbook Reconstruct",
    description: "Reconstructing 65.5h off-hours orderbook depth and cash market reference marks.",
    status: "active"
  },
  {
    id: "evidence",
    label: "Arbitration Feed",
    description: "Cross-referencing corporate news, supply chain disclosures, and SEC filings.",
    status: "pending"
  },
  {
    id: "adversary",
    label: "Thesis Attack",
    description: "Adversarial deconstruction of core assumptions and crypto drag vulnerability.",
    status: "pending"
  },
  {
    id: "stress",
    label: "Scenario Shock",
    description: "Calculating deterministic portfolio P&L under -5% gap, -8% contagion, +3% basis shock.",
    status: "pending"
  },
  {
    id: "policy",
    label: "Policy Gating",
    description: "Evaluating deterministic firewall rules against position vulnerability score.",
    status: "pending"
  },
  {
    id: "artifact",
    label: "Provenance Graph",
    description: "Assembling verifiable cryptographic audit trail and decision artifact.",
    status: "pending"
  }
];

export default function LoaderPreviewPage() {
  const [activeStage, setActiveStage] = useState(1);

  return (
    <div className="min-h-screen bg-[var(--rtd-proof)] text-[var(--rtd-ink)] p-6 sm:p-12 selection:bg-[var(--rtd-ink)] selection:text-[var(--rtd-paper)]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--rtd-steel)]/25 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--rtd-steel)]">
              COMPONENT PREVIEW
            </span>
            <h1 className="text-xl font-mono font-bold text-[var(--rtd-ink)]">
              VerdictScaleLoader Visual Test
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveStage((prev) => (prev + 1) % DEMO_STAGES.length)}
              className="px-3 py-1.5 bg-white border border-[var(--rtd-steel)]/30 text-xs font-mono font-bold uppercase hover:bg-[var(--rtd-paper)] transition-all cursor-pointer"
            >
              Advance Stage (0{activeStage + 1}) →
            </button>
            <Link
              href="/"
              className="px-3 py-1.5 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold uppercase hover:bg-[var(--rtd-void)] transition-all"
            >
              Back to Desk
            </Link>
          </div>
        </div>

        {/* The component live */}
        <VerdictScaleLoader
          stages={DEMO_STAGES}
          activeStageIndex={activeStage}
          message="Evaluating market state, thesis vulnerability, basis spread, and deterministic stress scenarios."
        />

        <div className="text-xs font-mono text-[var(--rtd-steel)] text-center">
          DISPLACEMENT ENGINE: OSCILLATING 0.0u (PROCEED) ↔ 9.0u (REF_OFFSET / WAIT)
        </div>
      </div>
    </div>
  );
}
