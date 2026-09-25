"use client";

import React, { useState } from "react";
import type { DecisionArtifact, DecisionVerdict } from "../../domain/decision/types";
import { Reveal } from "../motion/Reveal";
import { VerdictGlyph, VerdictBadge } from "../brand/VerdictGlyph";

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
    textColor: string;
    accentColor: string;
    description: string;
  }
> = {
  PROCEED: {
    title: "PROCEED WITH TRADE",
    badge: "PROCEED",
    textColor: "text-[var(--rtd-proceed)]",
    accentColor: "var(--rtd-proceed)",
    description: "Market conditions, basis spread, and position resilience satisfy desk policy criteria."
  },
  WAIT: {
    title: "WAIT: OFF-HOURS BASIS AND LIQUIDITY RISK",
    badge: "WAIT",
    textColor: "text-[var(--rtd-wait)]",
    accentColor: "var(--rtd-wait)",
    description: "Hold execution until regular cash market open or confirmed basis spread normalization."
  },
  REDUCE: {
    title: "REDUCE NOTIONAL POSITION SIZE",
    badge: "REDUCE",
    textColor: "text-[var(--rtd-reduce)]",
    accentColor: "var(--rtd-reduce)",
    description: "Notional size exceeds safe liquidity thresholds for current off-hours orderbook depth."
  },
  REJECT: {
    title: "REJECT TRADE PROPOSAL",
    badge: "REJECT",
    textColor: "text-[var(--rtd-reject)]",
    accentColor: "var(--rtd-reject)",
    description: "Trade exhibits structural blockers, extreme basis dislocation, or unhedged tail risk."
  }
};

export function DecisionArtifactView({
  artifact,
  onOpenProvenance,
  onNewTrade
}: DecisionArtifactViewProps) {
  const [copied, setCopied] = useState(false);
  const [sizeMultiplier, setSizeMultiplier] = useState<number>(1.0);
  const [timingMode, setTimingMode] = useState<"OFF_HOURS" | "MONDAY_OPEN">("OFF_HOURS");
  const [activeDrilldown, setActiveDrilldown] = useState<number | null>(null);
  const {
    trade,
    decision,
    marketState,
    thesis,
    challenge,
    scenarios,
    thesisPosition,
    changeConditions,
    limitations
  } = artifact;

  const verdictInfo = VERDICT_CONFIG[decision.verdict];

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(artifact, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-20 md:pb-16 overflow-x-hidden min-w-0">
      {/* 1. Verdict Band Card (Clean Editorial Style) */}
      <div className="relative overflow-hidden bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 p-4 sm:p-7 md:p-8 shadow-xs space-y-4 sm:space-y-5">
        {/* Accent top line */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: verdictInfo.accentColor }}
        />

        {/* Top meta row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rtd-steel)]/15 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--rtd-steel)]">
            <span>ID: {artifact.artifactId}</span>
            <span>•</span>
            <span>{new Date(artifact.generatedAt).toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex min-h-[38px] items-center gap-1.5 bg-[var(--rtd-paper-subtle)] px-3.5 py-1.5 text-xs font-mono font-bold text-[var(--rtd-ink)] hover:bg-[var(--rtd-steel)]/15 border border-[var(--rtd-steel)]/25 shadow-2xs active:scale-[0.98] transition-colors cursor-pointer"
            >
              {copied ? "Copied JSON!" : "Export artifact JSON"}
            </button>
            <button
              type="button"
              onClick={onOpenProvenance}
              className="inline-flex min-h-[38px] items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 px-3.5 py-1.5 text-xs font-mono font-bold shadow-2xs active:scale-[0.98] transition-colors cursor-pointer border border-transparent dark:border-slate-300"
            >
              Audit provenance
            </button>
          </div>
        </div>

        {/* Main Verdict Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-2.5 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/20 rounded-lg">
              <VerdictGlyph verdict={decision.verdict} size={50} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <VerdictBadge verdict={decision.verdict} />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--rtd-steel)]">
                  Deterministic policy
                </span>
              </div>
              <h2
                className={`text-xl sm:text-2xl md:text-3xl font-mono font-black tracking-tight ${verdictInfo.textColor}`}
              >
                {verdictInfo.title}
              </h2>
              <p className="text-xs sm:text-sm font-sans text-[var(--rtd-steel)] max-w-xl leading-relaxed">
                {verdictInfo.description}
              </p>
            </div>
          </div>

          {/* Proposed Trade Callout */}
          <div className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper-subtle)] p-4 sm:text-right shrink-0 shadow-2xs space-y-1">
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--rtd-steel)]">
              Proposed trade
            </div>
            <div className="text-base font-mono font-bold text-[var(--rtd-ink)] flex items-center sm:justify-end gap-1.5">
              <span
                className="px-1.5 py-0.5 text-[10.5px] font-mono font-bold text-white rounded-xs"
                style={{
                  backgroundColor:
                    trade.direction === "LONG"
                      ? "var(--rtd-proceed)"
                      : "var(--rtd-reject)"
                }}
              >
                {trade.direction}
              </span>
              <span>${trade.positionSizeUsd.toLocaleString()} {trade.asset}</span>
            </div>
            <div className="text-[11px] text-[var(--rtd-steel)] font-mono">
              @ ${trade.entryPrice.toFixed(2)} ({trade.quantity.toFixed(4)} tokens)
            </div>
          </div>
        </div>

        {/* Limitations and Operational Advisories */}
        {limitations.length > 0 && (
          <div className="border border-amber-500/40 dark:border-amber-400/30 bg-amber-50/70 dark:bg-amber-950/20 p-3.5 text-xs text-[var(--rtd-ink)] space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-900 dark:text-amber-200 text-[10px] tracking-wider uppercase px-2 py-0.5 border border-amber-300 dark:border-amber-700/60 bg-amber-100 dark:bg-amber-900/40">
                DESK ADVISORY
              </span>
              <span className="text-[11px] text-[var(--rtd-ink)]/70 font-mono">
                {limitations.length} operational {limitations.length === 1 ? "note" : "notes"}
              </span>
            </div>
            <ul className="font-sans leading-relaxed text-[var(--rtd-ink)] space-y-1.5 pl-1">
              {limitations.map((lim, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-700 dark:text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                  <span className="text-[var(--rtd-ink)]/90">{lim}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(artifact.dataSource === "fixture" ||
          artifact.isFallbackDemo ||
          artifact.marketState?.isSynthetic) && (
          <div className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper-subtle)] p-3 text-xs text-[var(--rtd-ink)] flex items-start gap-2">
            <span className="font-mono font-bold text-[var(--rtd-wait)] shrink-0">
              SNAPSHOT DATA:
            </span>
            <span className="font-sans text-[var(--rtd-steel)]">
              Operating in deterministic fixture mode. Observations derive from captured test fixtures.
            </span>
          </div>
        )}
      </div>

      {/* 2. Decisive Policy Reasons */}
      <Reveal
        as="section"
        className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] p-5 sm:p-6 shadow-xs space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold">
            2
          </div>
          <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
            Decisive policy reasons
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--rtd-steel)] font-sans">
          <span>The decisive drivers that determined the</span>
          <VerdictBadge verdict={decision.verdict} />
          <span>verdict under deterministic desk rules:</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-1">
          {decision.reasons.map((reason, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-3.5 sm:p-4"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[var(--rtd-paper)] text-xs font-mono font-bold text-[var(--rtd-ink)] border border-[var(--rtd-steel)]/25">
                {idx + 1}
              </span>
              <div className="flex flex-col gap-1 w-full min-w-0">
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] font-bold text-[var(--rtd-ink)] uppercase tracking-wider font-mono bg-[var(--rtd-paper)] px-2 py-0.5 border border-[var(--rtd-steel)]/25">
                    {reason.code}
                  </span>
                  <span className="text-[10px] text-[var(--rtd-steel)] font-mono">
                    [PROV: RULE-EVAL]
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-sans font-medium text-[var(--rtd-ink)] leading-snug">
                  {reason.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 3. Market State Reconstruction */}
      <section className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rtd-steel)]/15 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold">
              3
            </div>
            <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
              Market state reconstruction
            </h3>
          </div>
          <span className="text-xs text-[var(--rtd-steel)] font-mono">
            Observed: {new Date(marketState.observedAt).toLocaleTimeString()}
          </span>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-3 space-y-0.5">
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] font-mono font-bold text-[var(--rtd-steel)] uppercase tracking-wider">
                Bitget token
              </div>
              <span className="inline-flex items-center gap-1 text-[8.5px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-1 py-0.2 border border-emerald-500/20 uppercase">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE</span>
              </span>
            </div>
            <div className="text-base font-bold text-[var(--rtd-ink)] font-mono rtd-figure">
              ${marketState.instrumentPrice.toFixed(2)}
            </div>
            <div
              className="text-[10px] text-[var(--rtd-steel)] font-mono truncate"
              title={trade.canonicalSymbol || trade.asset}
            >
              {trade.canonicalSymbol || trade.asset}
            </div>
          </div>

          <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-3 space-y-0.5">
            <div className="text-[10.5px] font-mono font-bold text-[var(--rtd-steel)] uppercase tracking-wider">
              Underlying equity
            </div>
            <div className="text-base font-bold text-[var(--rtd-ink)] font-mono rtd-figure">
              ${marketState.referencePrice ? marketState.referencePrice.toFixed(2) : "N/A"}
            </div>
            <div
              className="text-[10px] text-[var(--rtd-steel)] font-mono truncate"
              title={trade.referenceAsset || "Underlying"}
            >
              {trade.referenceAsset || "Underlying"}
            </div>
          </div>

          <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-3 space-y-0.5">
            <div className="text-[10.5px] font-mono font-bold text-[var(--rtd-steel)] uppercase tracking-wider">
              Basis premium
            </div>
            <div
              className={`text-base font-bold font-mono rtd-figure ${
                marketState.basis && marketState.basis > 0
                  ? "text-[var(--rtd-reduce)]"
                  : "text-[var(--rtd-ink)]"
              }`}
            >
              {marketState.basis !== null
                ? `${marketState.basis >= 0 ? "+" : ""}$${marketState.basis.toFixed(2)}`
                : "N/A"}
            </div>
            <div className="text-[10px] text-[var(--rtd-steel)] font-mono">
              {marketState.basisPct !== null
                ? `${marketState.basisPct >= 0 ? "+" : ""}${marketState.basisPct.toFixed(2)}%`
                : "0.00%"}
            </div>
          </div>

          <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-3 space-y-0.5">
            <div className="text-[10.5px] font-mono font-bold text-[var(--rtd-steel)] uppercase tracking-wider">
              Orderbook spread
            </div>
            <div className="text-base font-bold text-[var(--rtd-ink)] font-mono rtd-figure">
              ${marketState.spread !== null ? marketState.spread.toFixed(2) : "N/A"}
            </div>
            <div className="text-[10px] text-[var(--rtd-steel)] font-mono">
              {marketState.spreadPct !== null ? `${marketState.spreadPct.toFixed(2)}%` : "N/A"}
            </div>
          </div>

          <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-3 space-y-0.5">
            <div className="text-[10.5px] font-mono font-bold text-[var(--rtd-steel)] uppercase tracking-wider">
              Equity session
            </div>
            <div className="mt-0.5">
              <span className="inline-block px-2 py-0.5 text-[10.5px] font-mono font-bold border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] text-[var(--rtd-ink)]">
                {marketState.sessionStatus}
              </span>
            </div>
            <div className="text-[10px] font-mono text-[var(--rtd-steel)] truncate">
              US market clock
            </div>
          </div>

          <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-3 space-y-0.5">
            <div className="text-[10.5px] font-mono font-bold text-[var(--rtd-steel)] uppercase tracking-wider">
              Liquidity depth
            </div>
            <div className="mt-0.5">
              <span
                className={`inline-block px-2 py-0.5 text-[10.5px] font-mono font-bold border border-[var(--rtd-steel)]/25 ${
                  marketState.liquidityClass === "THIN"
                    ? "bg-[var(--rtd-reject)]/10 text-[var(--rtd-reject)]"
                    : "bg-[var(--rtd-proceed)]/10 text-[var(--rtd-proceed)]"
                }`}
              >
                {marketState.liquidityClass}
              </span>
            </div>
            <div className="text-[10px] font-mono text-[var(--rtd-steel)] truncate">
              Orderbook class
            </div>
          </div>
        </div>
      </section>

      {/* 4. Deterministic Stress Scenarios */}
      <section className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--rtd-steel)]/15 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold">
              4
            </div>
            <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
              Deterministic stress scenarios
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--rtd-steel)] hidden sm:inline">
            Zero speculative heuristics • Pure deterministic arithmetic
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {scenarios
            .filter((s) => s.id !== "THESIS_FAILURE")
            .map((sc) => {
              const isSevere = sc.estimatedPnlPct !== null && sc.estimatedPnlPct <= -10;
              return (
                <div
                  key={sc.id}
                  className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-3.5 sm:p-4 flex flex-col justify-between"
                >
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-[var(--rtd-steel)] font-mono">
                        {sc.id}
                      </span>
                      <span className="bg-[var(--rtd-paper)] px-2 py-0.5 text-[10px] font-mono font-bold text-[var(--rtd-ink)] border border-[var(--rtd-steel)]/25">
                        STRESS
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-mono font-bold text-[var(--rtd-ink)] leading-snug">
                      {sc.name}
                    </h4>
                    <p className="text-xs text-[var(--rtd-steel)] font-sans leading-relaxed">
                      {sc.description}
                    </p>
                  </div>

                  <dl className="border-t border-[var(--rtd-steel)]/15 pt-2.5 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-baseline">
                      <dt className="text-[10.5px] text-[var(--rtd-steel)]">Shocked price:</dt>
                      <dd className="text-xs font-bold text-[var(--rtd-ink)] rtd-figure">
                        ${sc.shockedTokenPrice ? sc.shockedTokenPrice.toFixed(2) : "N/A"}
                      </dd>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <dt className="text-[10.5px] text-[var(--rtd-steel)]">Position P&amp;L:</dt>
                      <dd
                        className={`text-xs font-bold rtd-figure ${
                          isSevere ? "text-[var(--rtd-reject)]" : "text-[var(--rtd-ink)]"
                        }`}
                      >
                        {sc.estimatedPnlUsd !== null
                          ? `${sc.estimatedPnlUsd >= 0 ? "+" : ""}$${sc.estimatedPnlUsd.toFixed(2)}`
                          : "N/A"}
                      </dd>
                    </div>

                    <div className="flex justify-between items-baseline">
                      <dt className="text-[10.5px] text-[var(--rtd-steel)]">Return shock:</dt>
                      <dd
                        className={`text-xs font-bold rtd-figure ${
                          isSevere ? "text-[var(--rtd-reject)]" : "text-[var(--rtd-ink)]"
                        }`}
                      >
                        {sc.estimatedPnlPct !== null
                          ? `${sc.estimatedPnlPct >= 0 ? "+" : ""}${sc.estimatedPnlPct.toFixed(2)}%`
                          : "N/A"}
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            })}
        </div>
      </section>

      {/* 4B. Interactive What-If Counterfactual Sandbox (LUI Fluency) */}
      <section className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rtd-steel)]/15 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center bg-[var(--rtd-proceed)] text-[var(--rtd-paper)] text-xs font-mono font-bold">
              4B
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--rtd-steel)]">
                LUI Research Workbench
              </span>
              <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
                Interactive What-If Counterfactual Sandbox
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono text-[var(--rtd-proceed)] font-bold">
            Real-time deterministic sensitivity
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sizing Controls */}
          <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[var(--rtd-ink)] uppercase">
                1. Counterfactual Position Sizing
              </span>
              <span className="text-xs font-mono font-bold text-[var(--rtd-ink)]">
                ${(trade.positionSizeUsd * sizeMultiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "100% (Original)", mult: 1.0 },
                { label: "50% (Halved)", mult: 0.5 },
                { label: "25% (Pilot)", mult: 0.25 }
              ].map((btn) => (
                <button
                  key={btn.mult}
                  type="button"
                  onClick={() => setSizeMultiplier(btn.mult)}
                  className={`py-2 px-1 text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    sizeMultiplier === btn.mult
                      ? "bg-[var(--rtd-ink)] text-white border-[var(--rtd-ink)]"
                      : "bg-[var(--rtd-paper)] text-[var(--rtd-ink)] border-[var(--rtd-steel)]/25 hover:border-[var(--rtd-ink)]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--rtd-steel)] font-sans">
              Test how scaling down notional size reduces tail drawdown and orderbook slippage before placing an order.
            </p>
          </div>

          {/* Timing Controls */}
          <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[var(--rtd-ink)] uppercase">
                2. Execution Session Timing
              </span>
              <span className="text-xs font-mono font-bold text-[var(--rtd-proceed)]">
                {timingMode === "OFF_HOURS" ? "Current (Off-Hours)" : "Monday 09:30 ET"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTimingMode("OFF_HOURS")}
                className={`py-2 px-2 text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  timingMode === "OFF_HOURS"
                    ? "bg-[var(--rtd-ink)] text-white border-[var(--rtd-ink)]"
                    : "bg-[var(--rtd-paper)] text-[var(--rtd-ink)] border-[var(--rtd-steel)]/25 hover:border-[var(--rtd-ink)]"
                }`}
              >
                Weekend (Un-Anchored)
              </button>
              <button
                type="button"
                onClick={() => setTimingMode("MONDAY_OPEN")}
                className={`py-2 px-2 text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  timingMode === "MONDAY_OPEN"
                    ? "bg-[var(--rtd-ink)] text-white border-[var(--rtd-ink)]"
                    : "bg-[var(--rtd-paper)] text-[var(--rtd-ink)] border-[var(--rtd-steel)]/25 hover:border-[var(--rtd-ink)]"
                }`}
              >
                Monday Cash Open
              </button>
            </div>
            <p className="text-[11px] text-[var(--rtd-steel)] font-sans">
              Simulates waiting for the underlying stock market open, which resets basis spread to 0 bps and deepens liquidity.
            </p>
          </div>
        </div>

        {/* Counterfactual Outcome Banner */}
        {(() => {
          const rawCombined = scenarios.find((s) => s.id === "COMBINED_SHOCK")?.estimatedPnlUsd ?? -2703.94;
          const rawMarket = scenarios.find((s) => s.id === "MARKET_RISK")?.estimatedPnlUsd ?? -1250.00;
          const simulatedPnl = timingMode === "MONDAY_OPEN" ? rawMarket * sizeMultiplier : rawCombined * sizeMultiplier;
          const deltaSavings = rawCombined - simulatedPnl;
          const isReduced = sizeMultiplier < 1.0 || timingMode === "MONDAY_OPEN";

          return (
            <div className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper-subtle)] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--rtd-steel)]">
                    Simulated Worst-Case Shock P&amp;L
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold font-mono text-[var(--rtd-reject)] rtd-figure">
                      ${simulatedPnl.toFixed(2)} USD
                    </span>
                    <span className="text-xs font-mono text-[var(--rtd-steel)]">
                      ({timingMode === "MONDAY_OPEN" ? "-5.00% cash market gap" : "-10.82% combined tail"})
                    </span>
                  </div>
                </div>

                {isReduced && deltaSavings > 0 && (
                  <div className="bg-[var(--rtd-proceed)]/10 border border-[var(--rtd-proceed)]/30 px-3 py-1.5 rounded-sm">
                    <span className="text-xs font-mono font-bold text-[var(--rtd-proceed)]">
                      +${deltaSavings.toFixed(2)} Capital Protected
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs font-mono bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/20 p-3 text-[var(--rtd-ink)] leading-relaxed">
                {timingMode === "MONDAY_OPEN" ? (
                  <>
                    <strong className="text-[var(--rtd-proceed)]">RE-ANCHORING ADVANTAGE:</strong> Waiting for Monday cash open eliminates both weekend basis uncoupling and thin off-hours orderbook slippage. Your simulated loss in a tail event drops from <strong>${rawCombined.toFixed(2)}</strong> to <strong>${simulatedPnl.toFixed(2)}</strong>. Recommended conditional order: Place limit order at Friday cash close benchmark ($380.12).
                  </>
                ) : sizeMultiplier < 1.0 ? (
                  <>
                    <strong className="text-[var(--rtd-reduce)]">POSITION RISK REDUCED:</strong> Sizing down to ${(trade.positionSizeUsd * sizeMultiplier).toFixed(0)} maintains exposure to your directional thesis while capping worst-case weekend drawdown to <strong>${simulatedPnl.toFixed(2)}</strong>. Shifts risk profile from Critical to Moderate.
                  </>
                ) : (
                  <>
                    <strong>BASELINE PROPOSED SIZING:</strong> Full $25,000 exposure during off-hours exposes your capital to unanchored weekend basis drag (-0.61%) and thin top-of-book slippage under the <strong>WAIT</strong> verdict.
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Interactive Drilldown / "Ask Red Team Why" */}
        <div className="space-y-2 pt-1 border-t border-[var(--rtd-steel)]/15">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--rtd-steel)]">
            Adversarial Inquiry &bull; Frequently Challenged Assumptions
          </span>
          <div className="space-y-1.5">
            {[
              {
                q: "Why does off-hours basis matter if my thesis is based on robotaxi rumors?",
                a: "Because market makers cannot hedge with real underlying Tesla shares while NASDAQ is closed. Buying tokenized equities at a spread or negative basis means you are taking on structural wrapper risk, which often snaps back violently at Monday cash open regardless of social sentiment."
              },
              {
                q: "What if I size down to $12,500 and hold through the weekend?",
                a: "Halving your size cuts your tail dollar drawdown from -$2,703.94 down to -$1,351.97. That brings the worst-case scenario within normal retail portfolio tolerances (<5.5% capital), reducing liquidity impact from THIN to manageable."
              },
              {
                q: "What specific market signal invalidates the WAIT verdict?",
                a: "Two conditions: 1) The Monday 09:30 ET cash market opening bell ringing, which re-establishes underlying liquidity anchors, or 2) The tokenized basis spread narrowing to within ±0.25% with verified orderbook depth exceeding $25,000."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] text-xs font-mono"
              >
                <button
                  type="button"
                  onClick={() => setActiveDrilldown(activeDrilldown === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-2.5 text-left font-bold text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper)] transition-colors cursor-pointer"
                >
                  <span>Q: {faq.q}</span>
                  <span className="text-sm font-mono text-[var(--rtd-steel)] ml-2">
                    {activeDrilldown === idx ? "▲" : "▼"}
                  </span>
                </button>
                {activeDrilldown === idx && (
                  <div className="p-3 pt-0 text-[11.5px] font-sans text-[var(--rtd-steel)] leading-relaxed border-t border-[var(--rtd-steel)]/10 bg-[var(--rtd-paper)]">
                    <span className="font-bold text-[var(--rtd-ink)] font-mono block mb-1">
                      Desk Analysis:
                    </span>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Thesis Quality vs Position Quality Deconstruction */}
      {thesisPosition && (
        <section className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] p-5 sm:p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex items-start justify-between border-b border-[var(--rtd-steel)]/15 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold">
                5
              </div>
              <div>
                <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[var(--rtd-steel)]">
                  Core product thesis
                </span>
                <h3 className="text-base sm:text-lg font-mono font-bold text-[var(--rtd-ink)]">
                  Thesis quality versus position quality deconstruction
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Thesis Quality */}
            <div className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper-subtle)] p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[var(--rtd-steel)]/15 pb-2">
                <span className="text-xs sm:text-sm font-mono font-bold text-[var(--rtd-ink)] uppercase">
                  Thesis Quality
                </span>
                <span
                  className="px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)]"
                  style={{
                    color:
                      thesisPosition.thesisQuality === "STRONGER"
                        ? "var(--rtd-proceed)"
                        : "var(--rtd-wait)"
                  }}
                >
                  {thesisPosition.thesisQuality}
                </span>
              </div>
              <p className="text-xs text-[var(--rtd-steel)] font-sans leading-relaxed">
                Evaluation of trader causal reasoning, market catalyst validity, and assumption soundness.
              </p>
            </div>

            {/* Position Quality */}
            <div className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper-subtle)] p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[var(--rtd-steel)]/15 pb-2">
                <span className="text-xs sm:text-sm font-mono font-bold text-[var(--rtd-ink)] uppercase">
                  Position Quality
                </span>
                <span
                  className="px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)]"
                  style={{
                    color:
                      thesisPosition.positionQuality.quality === "WEAKER"
                        ? "var(--rtd-reject)"
                        : "var(--rtd-proceed)"
                  }}
                >
                  {thesisPosition.positionQuality.quality}
                </span>
              </div>
              {thesisPosition.positionQuality.reasons && (
                <ul className="text-xs font-mono text-[var(--rtd-steel)] space-y-1">
                  {thesisPosition.positionQuality.reasons.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {thesisPosition.keyMismatch && (
            <div className="border border-[var(--rtd-reduce)]/40 bg-[var(--rtd-reduce)]/5 p-3.5 space-y-1">
              <span className="text-xs font-mono font-bold text-[var(--rtd-reduce)] uppercase tracking-wider">
                Key mismatch identified:
              </span>
              <p className="text-xs sm:text-sm font-sans font-medium text-[var(--rtd-ink)] leading-relaxed">
                {thesisPosition.keyMismatch}
              </p>
            </div>
          )}
        </section>
      )}

      {/* 6. Side by Side Thesis Deconstruction and Adversarial Challenge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Thesis Deconstruction */}
        {thesis && (
          <section className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--rtd-steel)]/15 pb-2.5">
              <div className="flex h-5 w-5 items-center justify-center bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold">
                6A
              </div>
              <h3 className="text-sm sm:text-base font-mono font-bold text-[var(--rtd-ink)] flex-1">
                Thesis deconstruction
              </h3>
            </div>

            <div>
              <span className="text-[10.5px] font-mono font-bold text-[var(--rtd-steel)] uppercase tracking-wider">
                Normalized thesis
              </span>
              <p className="mt-1 text-xs font-mono text-[var(--rtd-ink)] bg-[var(--rtd-paper-subtle)] p-3 border border-[var(--rtd-steel)]/20 leading-relaxed">
                &ldquo;{thesis.normalizedThesis}&rdquo;
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10.5px] font-mono font-bold text-[var(--rtd-steel)] uppercase tracking-wider">
                Extracted assumptions
              </span>
              <div className="space-y-1">
                {thesis.assumptions.map((ass, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 text-xs bg-[var(--rtd-paper-subtle)] p-2 border border-[var(--rtd-steel)]/20"
                  >
                    <span className="text-[var(--rtd-ink)] font-sans">{ass.text}</span>
                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 text-[var(--rtd-steel)] shrink-0">
                      {ass.origin}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Adversarial Challenge */}
        {challenge && (
          <section className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--rtd-steel)]/15 pb-2.5">
              <div className="flex h-5 w-5 items-center justify-center bg-[var(--rtd-reject)] text-white text-xs font-mono font-bold">
                6B
              </div>
              <h3 className="text-sm sm:text-base font-mono font-bold text-[var(--rtd-ink)] flex-1">
                Adversarial counter challenge
              </h3>
            </div>

            <div>
              <span className="text-[10.5px] font-mono font-bold text-[var(--rtd-reject)] uppercase tracking-wider">
                Strongest counter thesis
              </span>
              <p className="mt-1 text-xs font-mono text-[var(--rtd-ink)] bg-[var(--rtd-paper-subtle)] p-3 border border-[var(--rtd-steel)]/20 leading-relaxed">
                {challenge.counterThesis}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10.5px] font-mono font-bold text-[var(--rtd-reject)] uppercase tracking-wider">
                Vulnerable assumptions attacked
              </span>
              <div className="space-y-1">
                {challenge.vulnerableAssumptions.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs bg-[var(--rtd-paper-subtle)] p-2 border border-[var(--rtd-steel)]/20 text-[var(--rtd-ink)]"
                  >
                    <span className="text-[var(--rtd-reject)] font-bold shrink-0">✕</span>
                    <span className="font-sans">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* 7. Actionable Change Conditions */}
      <section className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-[var(--rtd-steel)]/15 pb-2.5">
          <div className="flex h-5 w-5 items-center justify-center bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold">
            7
          </div>
          <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
            Actionable change conditions
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--rtd-steel)] font-sans">
          <span>The observable triggers that would materially change the verdict from</span>
          <VerdictBadge verdict={decision.verdict} />
          <span>to PROCEED:</span>
        </div>

        <div className="space-y-2">
          {changeConditions.map((condition, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-3 sm:p-3.5"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[var(--rtd-paper)] text-[var(--rtd-proceed)] text-xs font-bold border border-[var(--rtd-steel)]/25">
                ✓
              </span>
              <p className="text-xs sm:text-sm font-sans font-medium text-[var(--rtd-ink)] leading-snug">
                {condition}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Footer Navigation CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[var(--rtd-steel)]/20">
        <button
          type="button"
          onClick={onNewTrade}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 px-6 py-2.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider shadow-xs active:scale-[0.98] transition-all cursor-pointer border border-transparent dark:border-slate-300"
        >
          Stress test another trade →
        </button>

        <button
          type="button"
          onClick={onOpenProvenance}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] px-5 py-2.5 text-xs sm:text-sm font-mono font-bold text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-all cursor-pointer"
        >
          Audit provenance chain ({artifact.provenance.length} records)
        </button>
      </div>
    </div>
  );
}
