"use client";

import React, { useState } from "react";
import type { DecisionArtifact, DecisionVerdict } from "../../domain/decision/types";
import { Reveal } from "../motion/Reveal";

interface DecisionArtifactViewProps {
  artifact: DecisionArtifact;
  onOpenProvenance: () => void;
  onNewTrade: () => void;
}

const VERDICT_CONFIG: Record<
  DecisionVerdict,
  {
    title: string;
    badge: string;
    bg: string;
    text: string;
    border: string;
    iconBg: string;
    description: string;
  }
> = {
  PROCEED: {
    title: "PROCEED WITH TRADE",
    badge: "PROCEED",
    bg: "bg-[var(--rt-surface-raised)]",
    text: "text-[var(--rt-verdict-clear)]",
    border: "border-[var(--rt-verdict-clear)]",
    iconBg: "bg-[var(--rt-verdict-clear)]",
    description: "Market conditions, basis spread, and position resilience satisfy desk criteria."
  },
  WAIT: {
    title: "WAIT: OFF HOURS BASIS AND LIQUIDITY RISK",
    badge: "WAIT",
    bg: "bg-[var(--rt-surface-raised)]",
    text: "text-[var(--rt-verdict-moderate)]",
    border: "border-[var(--rt-verdict-moderate)]",
    iconBg: "bg-[var(--rt-verdict-moderate)]",
    description: "Hold off on execution until regular cash market open or basis normalization."
  },
  REDUCE: {
    title: "REDUCE NOTIONAL SIZE",
    badge: "REDUCE",
    bg: "bg-[var(--rt-surface-raised)]",
    text: "text-[var(--rt-verdict-high)]",
    border: "border-[var(--rt-verdict-high)]",
    iconBg: "bg-[var(--rt-verdict-high)]",
    description: "Notional size exceeds safe liquidity thresholds for current orderbook depth."
  },
  REJECT: {
    title: "REJECT TRADE PROPOSAL",
    badge: "REJECT",
    bg: "bg-[var(--rt-surface-raised)]",
    text: "text-[var(--rt-verdict-critical)]",
    border: "border-[var(--rt-verdict-critical)]",
    iconBg: "bg-[var(--rt-verdict-critical)]",
    description: "Trade exhibits fatal structural blockers, invalid parameters, or extreme fragility."
  }
};

export function DecisionArtifactView({
  artifact,
  onOpenProvenance,
  onNewTrade
}: DecisionArtifactViewProps) {
  const [copied, setCopied] = useState(false);
  const { trade, decision, marketState, thesis, challenge, scenarios, thesisPosition, changeConditions, limitations } = artifact;
  const verdictInfo = VERDICT_CONFIG[decision.verdict];

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(artifact, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 md:pb-16 pl-safe pr-safe">
      {/* 1. Verdict Band First (Sticky / Prominent at top) */}
      <div className={`border ${verdictInfo.border} ${verdictInfo.bg} p-4 sm:p-6 md:p-8 shadow-xs space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rt-border-subtle)] pb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[var(--rt-text-muted)]">
            <span className="font-mono text-[var(--rt-text-muted)]">ID: {artifact.artifactId}</span>
            <span>•</span>
            <span>{new Date(artifact.generatedAt).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1 bg-[var(--rt-surface-raised)] px-3 sm:px-4 py-2 text-xs font-mono font-semibold text-[var(--rt-text-primary)] hover:bg-[var(--rt-surface-base)] border border-[var(--rt-border-subtle)] shadow-xs active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden"
            >
              {copied ? "Copied JSON!" : "Export artifact JSON"}
            </button>
            <button
              type="button"
              onClick={onOpenProvenance}
              className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1 bg-[var(--rt-surface-void)] px-3 sm:px-4 py-2 text-xs font-mono font-semibold text-white hover:bg-[var(--rt-text-primary)] shadow-xs active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden"
            >
              Audit provenance
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-mono font-bold tracking-wider text-white ${verdictInfo.iconBg}`}>
                {verdictInfo.badge}
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--rt-text-muted)]">
                Deterministic policy
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-mono font-bold tracking-tight mt-1.5 [text-wrap:balance] ${verdictInfo.text}`}>
              {verdictInfo.title}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[var(--rt-text-primary)] mt-1 [text-wrap:pretty]">
              {verdictInfo.description}
            </p>
          </div>

          <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-3 sm:p-4 sm:text-right shrink-0 shadow-xs">
            <div className="text-[11px] font-mono text-[var(--rt-text-muted)]">Proposed trade</div>
            <div className="text-sm sm:text-base font-mono font-bold text-[var(--rt-text-primary)] mt-0.5">
              <span className={`mr-1 px-1.5 py-0.5 text-[11px] font-mono font-bold ${
                trade.direction === "LONG" ? "bg-[var(--rt-verdict-clear)] text-white" : "bg-[var(--rt-verdict-critical)] text-white"
              }`}>
                {trade.direction}
              </span>
              ${trade.positionSizeUsd.toLocaleString()} {trade.asset}
            </div>
            <div className="text-[11px] text-[var(--rt-text-muted)] mt-0.5 font-mono">
              @ ${trade.entryPrice.toFixed(2)} ({trade.quantity.toFixed(4)} tokens)
            </div>
          </div>
        </div>

        {limitations.length > 0 && (
          <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-3 text-xs text-[var(--rt-text-primary)] flex items-start gap-2 [text-wrap:pretty]">
            <span className="font-mono font-bold text-[var(--rt-verdict-moderate)] shrink-0">LIMITATION:</span>
            <span>{limitations.join("; ")}</span>
          </div>
        )}

        {(artifact.dataSource === 'fixture' || artifact.isFallbackDemo || artifact.marketState?.isSynthetic) && (
          <div id="snapshot-data-fixture-banner" className="border border-[var(--rt-verdict-moderate)] bg-[var(--rt-surface-base)] p-3 text-xs text-[var(--rt-text-primary)] flex items-start gap-2 [text-wrap:pretty]">
            <span className="font-mono font-bold shrink-0 text-[var(--rt-verdict-moderate)]">SNAPSHOT DATA:</span>
            <span>Operating in deterministic fixture mode. The displayed market observations and baseline scenario derive from captured test snapshot fixtures.</span>
          </div>
        )}

        {artifact.evidence.some(e => e.state === "UNAVAILABLE" || e.state === "CURATED_DEMO_FIXTURE") && (
          <div className="border border-[var(--rt-verdict-critical)] bg-[var(--rt-surface-base)] p-3 text-xs text-[var(--rt-text-primary)] flex items-start gap-2 [text-wrap:pretty]">
            <span className="font-mono font-bold shrink-0 text-[var(--rt-verdict-critical)]">WARNING:</span>
            <span>Live evidence is UNAVAILABLE. Operating on explicitly labeled CURATED DEMO FIXTURE data.</span>
          </div>
        )}

        {(artifact.isFallbackDemo || artifact.marketState?.isFallbackDemo || limitations.some(l => l.includes("Bitget API unavailable"))) && (
          <div id="demo-fallback-alert" className="border border-[var(--rt-verdict-moderate)] bg-[var(--rt-surface-base)] p-3 text-xs text-[var(--rt-text-primary)] flex items-start gap-2 [text-wrap:pretty]">
            <span className="font-mono font-bold shrink-0 text-[var(--rt-verdict-moderate)]">DEMO SAFETY NET:</span>
            <span>{artifact.fallbackReason || artifact.marketState?.fallbackReason || "Bitget API unavailable - showing curated rNVDA weekend basis demo"}</span>
          </div>
        )}
      </div>

      {/* 2. Decisive Reasons List Second */}
      <Reveal as="section" className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center bg-[var(--rt-surface-void)] text-white text-xs font-mono font-bold">
            2
          </div>
          <h3 className="text-base font-mono font-bold text-[var(--rt-text-primary)] [text-wrap:balance]">
            Decisive policy reasons
          </h3>
        </div>
        <p className="text-xs text-[var(--rt-text-muted)] [text-wrap:pretty]">
          The decisive drivers that determined the {decision.verdict} verdict under deterministic desk rules:
        </p>
        <div className="grid grid-cols-1 gap-2 pt-1">
          {decision.reasons.map((reason, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-3 sm:p-4"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[var(--rt-surface-raised)] text-xs font-mono font-bold text-[var(--rt-text-primary)] border border-[var(--rt-border-subtle)]">
                {idx + 1}
              </span>
              <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] font-bold text-[var(--rt-text-muted)] uppercase tracking-wider font-mono bg-[var(--rt-surface-raised)] px-1.5 py-0.5 border border-[var(--rt-border-subtle)] w-fit">
                    {reason.code}
                  </span>
                  <span className="text-[10px] text-[var(--rt-text-muted)] font-mono" title="Trace to deterministic policy / qualitative logic">
                    [PROV: RULE-EVAL]
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-[var(--rt-text-primary)] leading-snug [text-wrap:pretty]">
                  {reason.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 3. The Numbers: Market State Reconstruction (Definition List on Mobile) */}
      <section className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rt-border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center bg-[var(--rt-surface-void)] text-white text-xs font-mono font-bold">
              3
            </div>
            <h3 className="text-base font-mono font-bold text-[var(--rt-text-primary)] [text-wrap:balance]">
              Market state reconstruction
            </h3>
          </div>
          <span className="text-xs text-[var(--rt-text-muted)] font-mono">
            Observed: {new Date(marketState.observedAt).toLocaleTimeString()}
          </span>
        </div>

        {/* Mobile Definition List (< md) */}
        <dl className="md:hidden divide-y divide-[var(--rt-border-subtle)] border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] text-xs">
          <div className="flex items-center justify-between p-3">
            <dt className="font-mono text-[var(--rt-text-muted)] uppercase tracking-wider text-[11px]">Bitget token ({trade.canonicalSymbol || trade.asset})</dt>
            <dd className="font-mono font-bold text-[var(--rt-text-primary)] text-sm">${marketState.instrumentPrice.toFixed(2)}</dd>
          </div>
          <div className="flex items-center justify-between p-3">
            <dt className="font-mono text-[var(--rt-text-muted)] uppercase tracking-wider text-[11px]">Underlying equity ({trade.referenceAsset || "Underlying"})</dt>
            <dd className="font-mono font-bold text-[var(--rt-text-primary)] text-sm">
              ${marketState.referencePrice ? marketState.referencePrice.toFixed(2) : "N/A"}
            </dd>
          </div>
          <div className="flex items-center justify-between p-3">
            <dt className="font-mono text-[var(--rt-text-muted)] uppercase tracking-wider text-[11px]">Basis premium</dt>
            <dd className={`font-mono font-bold text-sm ${marketState.basis && marketState.basis > 0 ? "text-[var(--rt-verdict-moderate)]" : "text-[var(--rt-text-primary)]"}`}>
              {marketState.basis !== null ? `${marketState.basis >= 0 ? "+" : ""}$${marketState.basis.toFixed(2)} (${marketState.basisPct !== null ? `${marketState.basisPct >= 0 ? "+" : ""}${marketState.basisPct.toFixed(2)}%` : "0.00%"})` : "N/A"}
            </dd>
          </div>
          <div className="flex items-center justify-between p-3">
            <dt className="font-mono text-[var(--rt-text-muted)] uppercase tracking-wider text-[11px]">Orderbook spread</dt>
            <dd className="font-mono font-bold text-[var(--rt-text-primary)] text-sm">
              ${marketState.spread !== null ? marketState.spread.toFixed(2) : "N/A"} {marketState.spreadPct !== null ? `(${marketState.spreadPct.toFixed(2)}%)` : ""}
            </dd>
          </div>
          <div className="flex items-center justify-between p-3">
            <dt className="font-mono text-[var(--rt-text-muted)] uppercase tracking-wider text-[11px]">Equity session</dt>
            <dd className="font-mono font-bold text-xs">
              <span className={`px-2 py-0.5 border border-[var(--rt-border-subtle)] ${
                marketState.sessionStatus === "WEEKEND"
                  ? "bg-[var(--rt-surface-raised)] text-[var(--rt-text-primary)]"
                  : marketState.sessionStatus === "OFF_HOURS"
                  ? "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-moderate)]"
                  : "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-clear)]"
              }`}>
                {marketState.sessionStatus}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between p-3">
            <dt className="font-mono text-[var(--rt-text-muted)] uppercase tracking-wider text-[11px]">Liquidity depth</dt>
            <dd className="font-mono font-bold text-xs">
              <span className={`px-2 py-0.5 border border-[var(--rt-border-subtle)] ${
                marketState.liquidityClass === "THIN"
                  ? "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-critical)]"
                  : "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-clear)]"
              }`}>
                {marketState.liquidityClass}
              </span>
            </dd>
          </div>
        </dl>

        {/* Desktop Grid (>= md) */}
        <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Instrument Price */}
          <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-3">
            <div className="text-xs font-mono font-semibold text-[var(--rt-text-muted)] uppercase tracking-wider">Bitget token</div>
            <div className="text-base font-bold text-[var(--rt-text-primary)] font-mono mt-0.5">
              ${marketState.instrumentPrice.toFixed(2)}
            </div>
            <div className="text-xs text-[var(--rt-text-muted)] font-mono">{trade.canonicalSymbol || trade.asset}</div>
          </div>

          {/* Reference Price */}
          <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-3">
            <div className="text-xs font-mono font-semibold text-[var(--rt-text-muted)] uppercase tracking-wider">Underlying equity</div>
            <div className="text-base font-bold text-[var(--rt-text-primary)] font-mono mt-0.5">
              ${marketState.referencePrice ? marketState.referencePrice.toFixed(2) : "N/A"}
            </div>
            <div className="text-xs text-[var(--rt-text-muted)] font-mono">{trade.referenceAsset || "Underlying"}</div>
          </div>

          {/* Basis */}
          <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-3">
            <div className="text-xs font-mono font-semibold text-[var(--rt-text-muted)] uppercase tracking-wider">Basis premium</div>
            <div className={`text-base font-bold font-mono mt-0.5 ${
              marketState.basis && marketState.basis > 0 ? "text-[var(--rt-verdict-moderate)]" : "text-[var(--rt-text-primary)]"
            }`}>
              {marketState.basis !== null ? `${marketState.basis >= 0 ? "+" : ""}$${marketState.basis.toFixed(2)}` : "N/A"}
            </div>
            <div className="text-xs text-[var(--rt-text-muted)] font-mono">
              {marketState.basisPct !== null ? `${marketState.basisPct >= 0 ? "+" : ""}${marketState.basisPct.toFixed(2)}%` : "0.00%"}
            </div>
          </div>

          {/* Spread */}
          <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-3">
            <div className="text-xs font-mono font-semibold text-[var(--rt-text-muted)] uppercase tracking-wider">Orderbook spread</div>
            <div className="text-base font-bold text-[var(--rt-text-primary)] font-mono mt-0.5">
              ${marketState.spread !== null ? marketState.spread.toFixed(2) : "N/A"}
            </div>
            <div className="text-xs text-[var(--rt-text-muted)] font-mono">
              {marketState.spreadPct !== null ? `${marketState.spreadPct.toFixed(2)}%` : "N/A"}
            </div>
          </div>

          {/* Session Status */}
          <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-3">
            <div className="text-xs font-mono font-semibold text-[var(--rt-text-muted)] uppercase tracking-wider">Equity session</div>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 text-xs font-mono font-bold border border-[var(--rt-border-subtle)] ${
                marketState.sessionStatus === "WEEKEND"
                  ? "bg-[var(--rt-surface-raised)] text-[var(--rt-text-primary)]"
                  : marketState.sessionStatus === "OFF_HOURS"
                  ? "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-moderate)]"
                  : "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-clear)]"
              }`}>
                {marketState.sessionStatus}
              </span>
            </div>
            <div className="text-xs font-mono text-[var(--rt-text-muted)] mt-0.5">United States market clock</div>
          </div>

          {/* Liquidity Class */}
          <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-3">
            <div className="text-xs font-mono font-semibold text-[var(--rt-text-muted)] uppercase tracking-wider">Liquidity depth</div>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 text-xs font-mono font-bold border border-[var(--rt-border-subtle)] ${
                marketState.liquidityClass === "THIN"
                  ? "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-critical)]"
                  : "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-clear)]"
              }`}>
                {marketState.liquidityClass}
              </span>
            </div>
            <div className="text-xs font-mono text-[var(--rt-text-muted)] mt-0.5">Orderbook class</div>
          </div>
        </div>
      </section>

      {/* 4. The Numbers: Deterministic Stress Scenarios (Definition Lists on Mobile & Desktop) */}
      <section className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--rt-border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center bg-[var(--rt-surface-void)] text-white text-xs font-mono font-bold">
              4
            </div>
            <h3 className="text-base font-mono font-bold text-[var(--rt-text-primary)] [text-wrap:balance]">
              Deterministic stress scenarios
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--rt-text-muted)] hidden sm:inline">Zero speculative heuristics • Pure deterministic arithmetic</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {scenarios.filter(s => s.id !== "THESIS_FAILURE").map((sc) => {
            const isSevere = sc.estimatedPnlPct !== null && sc.estimatedPnlPct <= -10;
            return (
              <div
                key={sc.id}
                className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-3.5 sm:p-4 flex flex-col h-full"
              >
                <div className="flex-1 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--rt-text-muted)] font-mono">
                      {sc.id}
                    </span>
                    <span className="bg-[var(--rt-surface-raised)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--rt-text-primary)] border border-[var(--rt-border-subtle)]">
                      STRESS
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[var(--rt-text-primary)] mt-1.5 [text-wrap:balance]">
                    {sc.name}
                  </h4>
                  <p className="text-xs text-[var(--rt-text-muted)] mt-1 [text-wrap:pretty]">
                    {sc.description}
                  </p>
                </div>

                <dl className="border-t border-[var(--rt-border-subtle)] pt-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between items-baseline">
                    <dt className="font-mono text-[var(--rt-text-muted)] text-[11px]">Shocked token:</dt>
                    <dd className="font-mono text-xs font-bold text-[var(--rt-text-primary)]">
                      ${sc.shockedTokenPrice ? sc.shockedTokenPrice.toFixed(2) : "N/A"}
                    </dd>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <dt className="font-mono text-[var(--rt-text-muted)] text-[11px]">Position P and L:</dt>
                    <dd className={`font-mono text-xs sm:text-sm font-bold ${
                      isSevere ? "text-[var(--rt-verdict-critical)]" : "text-[var(--rt-text-primary)]"
                    }`}>
                      {sc.estimatedPnlUsd !== null
                        ? `${sc.estimatedPnlUsd >= 0 ? "+" : ""}$${sc.estimatedPnlUsd.toFixed(2)}`
                        : "N/A"}
                    </dd>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <dt className="font-mono text-[var(--rt-text-muted)] text-[11px]">Return shock:</dt>
                    <dd className={`font-mono text-xs font-bold ${
                      isSevere ? "text-[var(--rt-verdict-critical)]" : "text-[var(--rt-text-primary)]"
                    }`}>
                      {sc.estimatedPnlPct !== null
                        ? `${sc.estimatedPnlPct >= 0 ? "+" : ""}${sc.estimatedPnlPct.toFixed(2)}%`
                        : "N/A"}
                    </dd>
                  </div>
                </dl>

                {sc.assumptions && sc.assumptions.length > 0 && (
                  <div className="mt-3 bg-[var(--rt-surface-raised)] p-2 border border-[var(--rt-border-subtle)] text-[11px] text-[var(--rt-text-muted)] font-mono [text-wrap:pretty] space-y-0.5">
                    <div className="text-[10px] font-bold text-[var(--rt-text-muted)] uppercase tracking-wider">Assumptions:</div>
                    {sc.assumptions.map((a, i) => (
                      <div key={i}>- {a}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Precedents: Thesis vs Position Split Card (THE CORE PRODUCT THESIS!) */}
      {thesisPosition ? (
        <section className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-4 sm:p-6 md:p-8 shadow-xs space-y-4 sm:space-y-5 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-5 sm:h-6 w-5 sm:w-6 items-center justify-center bg-[var(--rt-surface-void)] text-white text-xs font-mono font-bold">
                5
              </div>
              <div>
                <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[var(--rt-text-muted)]">
                  Core product thesis
                </span>
                <h3 className="text-base sm:text-lg font-mono font-bold text-[var(--rt-text-primary)] [text-wrap:balance]">
                  Thesis quality versus position quality deconstruction
                </h3>
              </div>
            </div>
            {thesisPosition.modelInfo && (
              <span className="text-[10px] font-mono text-[var(--rt-text-muted)] bg-[var(--rt-surface-base)] px-2 py-0.5 border border-[var(--rt-border-subtle)] hidden sm:inline" title="AI Model Identity">
                {thesisPosition.modelInfo.provider}/{thesisPosition.modelInfo.model}
              </span>
            )}
          </div>

          {/* Dual Qualitative Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative">
            {/* Thesis Quality Panel */}
            <div className={`border p-4 sm:p-5 space-y-3 shadow-xs relative bg-[var(--rt-surface-base)] ${
              thesisPosition.thesisQuality === "STRONGER"
                ? "border-[var(--rt-verdict-clear)]"
                : "border-[var(--rt-verdict-moderate)]"
            }`}>
              <div className="flex items-center justify-between border-b border-[var(--rt-border-subtle)] pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[var(--rt-surface-raised)] text-[var(--rt-text-primary)] border border-[var(--rt-border-subtle)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-bold text-[var(--rt-text-primary)] uppercase tracking-wider">
                    Thesis Quality
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider border border-[var(--rt-border-subtle)] ${
                  thesisPosition.thesisQuality === "STRONGER"
                    ? "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-clear)]"
                    : "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-moderate)]"
                }`}>
                  {thesisPosition.thesisQuality}
                </span>
              </div>
            </div>

            {/* Position Quality Panel */}
            <div className={`border p-4 sm:p-5 space-y-3 shadow-xs relative bg-[var(--rt-surface-base)] ${
              thesisPosition.positionQuality.quality === "WEAKER"
                ? "border-[var(--rt-verdict-critical)]"
                : "border-[var(--rt-verdict-clear)]"
            }`}>
              <div className="flex items-center justify-between border-b border-[var(--rt-border-subtle)] pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[var(--rt-surface-raised)] text-[var(--rt-text-primary)] border border-[var(--rt-border-subtle)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-bold text-[var(--rt-text-primary)] uppercase tracking-wider">
                    Position Quality
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider border border-[var(--rt-border-subtle)] ${
                  thesisPosition.positionQuality.quality === "WEAKER"
                    ? "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-critical)]"
                    : "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-clear)]"
                }`}>
                  {thesisPosition.positionQuality.quality}
                </span>
              </div>
              {thesisPosition.positionQuality.reasons && thesisPosition.positionQuality.reasons.length > 0 && (
                <div className="mt-2 text-xs font-mono text-[var(--rt-text-muted)] bg-[var(--rt-surface-raised)] p-2 border border-[var(--rt-border-subtle)]">
                  <div className="font-semibold text-[var(--rt-text-primary)] mb-1 uppercase tracking-wide text-[11px]">Deterministic Drivers</div>
                  <ul className="list-disc pl-4 space-y-1">
                    {thesisPosition.positionQuality.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Prominent Key Mismatch Banner */}
          {thesisPosition.keyMismatch && (
            <div className="border border-[var(--rt-verdict-moderate)] bg-[var(--rt-surface-base)] p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--rt-verdict-moderate)] uppercase tracking-wider">
                <svg className="w-4 h-4 text-[var(--rt-verdict-moderate)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Key mismatch identified
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[var(--rt-text-primary)] leading-relaxed [text-wrap:pretty]">
                {thesisPosition.keyMismatch}
              </p>
            </div>
          )}

          <p className="text-xs text-[var(--rt-text-muted)] leading-relaxed [text-wrap:pretty]">
            {thesisPosition.explanation}
          </p>
        </section>
      ) : (
        <section className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-4 sm:p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-xs font-mono font-bold text-[var(--rt-text-muted)] uppercase tracking-wider">Qualitative Synthesis</span>
          <span className="text-xs sm:text-sm font-medium text-[var(--rt-text-muted)]">Unavailable due to system degradation. Proceeding on deterministic bounds only.</span>
        </section>
      )}

      {/* 6. Precedents: Side by Side Thesis Deconstruction and Adversarial Challenge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Thesis Deconstruction */}
        {thesis ? (
          <section className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4 relative">
            <div className="flex items-center gap-2 border-b border-[var(--rt-border-subtle)] pb-2.5">
              <div className="flex h-5 w-5 items-center justify-center bg-[var(--rt-surface-void)] text-white text-xs font-mono font-bold">
                6A
              </div>
              <h3 className="text-sm sm:text-base font-mono font-bold text-[var(--rt-text-primary)] [text-wrap:balance] flex-1">
                Thesis deconstruction
              </h3>
              {thesis.modelInfo && (
                <span className="text-[10px] font-mono text-[var(--rt-text-muted)] bg-[var(--rt-surface-base)] px-1.5 py-0.5 border border-[var(--rt-border-subtle)]" title="AI Model Identity">
                  {thesis.modelInfo.provider}/{thesis.modelInfo.model}
                </span>
              )}
            </div>

            <div>
              <span className="text-[11px] font-mono font-semibold text-[var(--rt-text-muted)] uppercase tracking-wider">Normalized thesis</span>
              <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--rt-text-primary)] bg-[var(--rt-surface-base)] p-3 border border-[var(--rt-border-subtle)] [text-wrap:pretty] break-words">
                &ldquo;{thesis.normalizedThesis}&rdquo;
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-semibold text-[var(--rt-text-muted)] uppercase tracking-wider">Extracted assumptions</span>
              <div className="space-y-1.5">
                {thesis.assumptions.map((ass, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-xs bg-[var(--rt-surface-base)] p-2.5 border border-[var(--rt-border-subtle)]">
                    <span className="text-[var(--rt-text-primary)] font-medium [text-wrap:pretty]">{ass.text}</span>
                    <span className={`shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 border border-[var(--rt-border-subtle)] ${
                      ass.origin === "USER_STATED" ? "bg-[var(--rt-surface-raised)] text-[var(--rt-text-primary)]" : "bg-[var(--rt-surface-raised)] text-[var(--rt-text-muted)]"
                    }`}>
                      {ass.origin}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {thesis.supportingEvidenceRefs.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-mono font-semibold text-[var(--rt-text-muted)] uppercase tracking-wider">Provenance links</span>
                <div className="flex flex-wrap gap-1.5">
                  {thesis.supportingEvidenceRefs.map(ref => (
                    <button
                      key={ref}
                      type="button"
                      onClick={onOpenProvenance}
                      className="min-h-[44px] inline-flex items-center text-[10px] font-mono text-[var(--rt-verdict-clear)] bg-[var(--rt-surface-base)] border border-[var(--rt-border-subtle)] px-2 py-1 hover:bg-[var(--rt-surface-raised)] active:scale-95"
                    >
                      [PROV: {ref}]
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-mono font-semibold text-[var(--rt-text-muted)] uppercase tracking-wider">Key dependencies</span>
              <ul className="list-disc list-inside text-xs text-[var(--rt-text-primary)] space-y-0.5">
                {thesis.dependencies.map((dep, i) => (
                  <li key={i} className="[text-wrap:pretty]">{dep.text}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : (
          <section className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-4 sm:p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-xs font-mono font-bold text-[var(--rt-text-muted)] uppercase tracking-wider">Thesis Deconstruction</span>
            <span className="text-xs font-medium text-[var(--rt-text-muted)]">Unavailable due to system degradation.</span>
          </section>
        )}

        {/* Adversarial Challenge */}
        {challenge ? (
          <section className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4 relative">
            <div className="flex items-center gap-2 border-b border-[var(--rt-border-subtle)] pb-2.5">
              <div className="flex h-5 w-5 items-center justify-center bg-[var(--rt-verdict-critical)] text-white text-xs font-mono font-bold">
                6B
              </div>
              <h3 className="text-sm sm:text-base font-mono font-bold text-[var(--rt-text-primary)] [text-wrap:balance] flex-1">
                Adversarial counter challenge
              </h3>
              {challenge.modelInfo && (
                <span className="text-[10px] font-mono text-[var(--rt-text-muted)] bg-[var(--rt-surface-base)] px-1.5 py-0.5 border border-[var(--rt-border-subtle)]" title="AI Model Identity">
                  {challenge.modelInfo.provider}/{challenge.modelInfo.model}
                </span>
              )}
            </div>

            <div>
              <span className="text-[11px] font-mono font-semibold text-[var(--rt-verdict-critical)] uppercase tracking-wider">Strongest counter thesis</span>
              <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--rt-text-primary)] bg-[var(--rt-surface-base)] p-3 border border-[var(--rt-border-subtle)] [text-wrap:pretty] break-words">
                {challenge.counterThesis}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-semibold text-[var(--rt-verdict-critical)] uppercase tracking-wider">Vulnerable assumptions attacked</span>
              <div className="space-y-1.5">
                {challenge.vulnerableAssumptions.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs bg-[var(--rt-surface-base)] p-2.5 border border-[var(--rt-border-subtle)] text-[var(--rt-text-primary)] font-medium">
                    <span className="text-[var(--rt-verdict-critical)] font-bold shrink-0">✕</span>
                    <span className="[text-wrap:pretty]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {challenge.contradictoryEvidenceRefs.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-mono font-semibold text-[var(--rt-verdict-critical)] uppercase tracking-wider">Contradictory evidence refs</span>
                <div className="flex flex-wrap gap-1.5">
                  {challenge.contradictoryEvidenceRefs.map(ref => (
                    <button
                      key={ref}
                      type="button"
                      onClick={onOpenProvenance}
                      className="min-h-[44px] inline-flex items-center text-[10px] font-mono text-[var(--rt-verdict-critical)] bg-[var(--rt-surface-base)] border border-[var(--rt-border-subtle)] px-2 py-1 hover:bg-[var(--rt-surface-raised)] active:scale-95"
                    >
                      [PROV: {ref}]
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-[var(--rt-text-muted)] pt-1 leading-relaxed [text-wrap:pretty]">
              {challenge.explanation}
            </p>
          </section>
        ) : (
          <section className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-4 sm:p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-xs font-mono font-bold text-[var(--rt-text-muted)] uppercase tracking-wider">Adversarial Challenge</span>
            <span className="text-xs font-medium text-[var(--rt-text-muted)]">Unavailable due to system degradation.</span>
          </section>
        )}
      </div>

      {/* 7. Actionable Change Conditions */}
      <section className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--rt-border-subtle)] pb-2.5">
          <div className="flex h-5 w-5 items-center justify-center bg-[var(--rt-surface-void)] text-white text-xs font-mono font-bold">
            7
          </div>
          <h3 className="text-base font-mono font-bold text-[var(--rt-text-primary)] [text-wrap:balance]">
            Actionable change conditions
          </h3>
        </div>
        <p className="text-xs text-[var(--rt-text-muted)] [text-wrap:pretty]">
          The observable triggers that would materially change the verdict from {decision.verdict} to PROCEED:
        </p>
        <div className="space-y-2">
          {changeConditions.map((condition, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-3 sm:p-3.5"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-clear)] text-xs font-bold border border-[var(--rt-border-subtle)]">
                ✓
              </span>
              <p className="text-xs sm:text-sm font-medium text-[var(--rt-text-primary)] leading-snug [text-wrap:pretty]">
                {condition}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Footer Navigation CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--rt-border-subtle)]">
        <button
          type="button"
          onClick={onNewTrade}
          className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 bg-[var(--rt-surface-void)] px-5 sm:px-6 py-2.5 text-sm font-mono font-semibold text-white shadow-xs hover:bg-[var(--rt-text-primary)] active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Stress test another trade
        </button>

        <button
          type="button"
          onClick={onOpenProvenance}
          className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] px-5 sm:px-6 py-2.5 text-sm font-mono font-semibold text-[var(--rt-text-primary)] hover:bg-[var(--rt-surface-base)] active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden"
        >
          <svg className="w-4 h-4 text-[var(--rt-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Audit provenance chain ({artifact.provenance.length} records)
        </button>
      </div>
    </div>
  );
}
