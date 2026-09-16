"use client";

import React, { useState } from "react";
import type { DecisionArtifact, DecisionVerdict } from "../../domain/decision/types";

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
    bg: "bg-emerald-50",
    text: "text-emerald-950",
    border: "border-emerald-300",
    iconBg: "bg-emerald-600",
    description: "Market conditions, basis spread, and position resilience satisfy desk criteria."
  },
  WAIT: {
    title: "WAIT: OFF HOURS BASIS AND LIQUIDITY RISK",
    badge: "WAIT",
    bg: "bg-amber-50",
    text: "text-amber-950",
    border: "border-amber-300",
    iconBg: "bg-amber-500",
    description: "Hold off on execution until regular cash market open or basis normalization."
  },
  REDUCE: {
    title: "REDUCE NOTIONAL SIZE",
    badge: "REDUCE",
    bg: "bg-orange-50",
    text: "text-orange-950",
    border: "border-orange-300",
    iconBg: "bg-orange-500",
    description: "Notional size exceeds safe liquidity thresholds for current orderbook depth."
  },
  REJECT: {
    title: "REJECT TRADE PROPOSAL",
    badge: "REJECT",
    bg: "bg-rose-50",
    text: "text-rose-950",
    border: "border-rose-300",
    iconBg: "bg-rose-600",
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
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* 1. Trade and Verdict Banner */}
      <div className={`rounded-2xl border ${verdictInfo.border} ${verdictInfo.bg} p-6 sm:p-8 shadow-xs space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
            <span className="font-mono text-zinc-500">ID: {artifact.artifactId}</span>
            <span>•</span>
            <span>{new Date(artifact.generatedAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 border border-zinc-200 shadow-xs active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
            >
              {copied ? "Copied JSON!" : "Export artifact JSON"}
            </button>
            <button
              type="button"
              onClick={onOpenProvenance}
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 shadow-xs active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
            >
              Audit provenance
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold tracking-wider text-white ${verdictInfo.iconBg}`}>
                {verdictInfo.badge}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Deterministic policy
              </span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-2 [text-wrap:balance] ${verdictInfo.text}`}>
              {verdictInfo.title}
            </h2>
            <p className="text-sm font-medium text-zinc-700 mt-1 [text-wrap:pretty]">
              {verdictInfo.description}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:text-right shrink-0 shadow-xs">
            <div className="text-xs text-zinc-500">Proposed trade</div>
            <div className="text-base font-bold text-zinc-900 mt-0.5">
              <span className={`mr-1 px-1.5 py-0.5 rounded-md text-xs font-bold ${
                trade.direction === "LONG" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {trade.direction}
              </span>
              ${trade.positionSizeUsd.toLocaleString()} {trade.asset}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5 font-mono">
              @ ${trade.entryPrice.toFixed(2)} ({trade.quantity.toFixed(4)} tokens)
            </div>
          </div>
        </div>

        {limitations.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-white p-3.5 text-xs text-amber-900 flex items-start gap-2 [text-wrap:pretty]">
            <span className="font-bold shrink-0">LIMITATION:</span>
            <span>{limitations.join("; ")}</span>
          </div>
        )}

        {artifact.evidence.some(e => e.state === "UNAVAILABLE" || e.state === "CURATED_DEMO_FIXTURE") && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 flex items-start gap-2 [text-wrap:pretty]">
            <span className="font-bold shrink-0 text-rose-700">WARNING:</span>
            <span>Live evidence is UNAVAILABLE. Operating on explicitly labeled CURATED DEMO FIXTURE data.</span>
          </div>
        )}
      </div>

      {/* 2. Decisive Reasons */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
            2
          </div>
          <h3 className="text-base font-bold text-zinc-900 [text-wrap:balance]">
            Decisive policy reasons
          </h3>
        </div>
        <p className="text-xs text-zinc-500 [text-wrap:pretty]">
          The decisive drivers that determined the {decision.verdict} verdict under deterministic desk rules:
        </p>
        <div className="grid grid-cols-1 gap-2.5 pt-1">
          {decision.reasons.map((reason, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-200 text-xs font-bold text-zinc-800">
                {idx + 1}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono bg-zinc-200/50 px-1.5 py-0.5 rounded w-fit">
                  {reason.code}
                </span>
                <p className="text-xs sm:text-sm font-medium text-zinc-800 leading-snug [text-wrap:pretty]">
                  {reason.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Market State Card */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
              3
            </div>
            <h3 className="text-base font-bold text-zinc-900 [text-wrap:balance]">
              Market state reconstruction
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            Observed: {new Date(marketState.observedAt).toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Instrument Price */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bitget token</div>
            <div className="text-base font-bold text-zinc-900 font-mono mt-0.5">
              ${marketState.instrumentPrice.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-400 font-mono">rNVDA/USDT</div>
          </div>

          {/* Reference Price */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Underlying equity</div>
            <div className="text-base font-bold text-zinc-900 font-mono mt-0.5">
              ${marketState.referencePrice ? marketState.referencePrice.toFixed(2) : "N/A"}
            </div>
            <div className="text-xs text-zinc-400 font-mono">NVDA (Nasdaq)</div>
          </div>

          {/* Basis */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Basis premium</div>
            <div className={`text-base font-bold font-mono mt-0.5 ${
              marketState.basis && marketState.basis > 0 ? "text-amber-700" : "text-zinc-900"
            }`}>
              {marketState.basis !== null ? `${marketState.basis >= 0 ? "+" : ""}$${marketState.basis.toFixed(2)}` : "N/A"}
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              {marketState.basisPct !== null ? `${marketState.basisPct >= 0 ? "+" : ""}${marketState.basisPct.toFixed(2)}%` : "0.00%"}
            </div>
          </div>

          {/* Spread */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Orderbook spread</div>
            <div className="text-base font-bold text-zinc-900 font-mono mt-0.5">
              ${marketState.spread !== null ? marketState.spread.toFixed(2) : "N/A"}
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              {marketState.spreadPct !== null ? `${marketState.spreadPct.toFixed(2)}%` : "N/A"}
            </div>
          </div>

          {/* Session Status */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Equity session</div>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                marketState.sessionStatus === "WEEKEND"
                  ? "bg-purple-100 text-purple-900 border border-purple-200"
                  : marketState.sessionStatus === "OFF_HOURS"
                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-200"
              }`}>
                {marketState.sessionStatus}
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">United States market clock</div>
          </div>

          {/* Liquidity Class */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Liquidity depth</div>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                marketState.liquidityClass === "THIN"
                  ? "bg-rose-100 text-rose-900 border border-rose-200"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-200"
              }`}>
                {marketState.liquidityClass}
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Orderbook class</div>
          </div>
        </div>
      </section>

      {/* 4 and 5: Side by Side Thesis Deconstruction and Adversarial Challenge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4. Thesis Deconstruction */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
              4
            </div>
            <h3 className="text-base font-bold text-zinc-900 [text-wrap:balance]">
              Thesis deconstruction
            </h3>
          </div>

          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Normalized thesis</span>
            <p className="mt-1 text-xs sm:text-sm font-medium text-zinc-900 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 [text-wrap:pretty]">
              &ldquo;{thesis.normalizedThesis}&rdquo;
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Extracted assumptions</span>
            <div className="space-y-2">
              {thesis.assumptions.map((ass, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-xs bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                  <span className="text-zinc-800 font-medium [text-wrap:pretty]">{ass.text}</span>
                  <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-md ${
                    ass.origin === "USER_STATED" ? "bg-zinc-200 text-zinc-800" : "bg-purple-100 text-purple-800"
                  }`}>
                    {ass.origin}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Key dependencies</span>
            <ul className="list-disc list-inside text-xs text-zinc-700 space-y-1">
              {thesis.dependencies.map((dep, i) => (
                <li key={i} className="[text-wrap:pretty]">{dep.text}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Adversarial Challenge */}
        <section className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-700 text-white text-xs font-bold">
              5
            </div>
            <h3 className="text-base font-bold text-rose-950 [text-wrap:balance]">
              Adversarial counter challenge
            </h3>
          </div>

          <div>
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Strongest counter thesis</span>
            <p className="mt-1 text-xs sm:text-sm font-medium text-rose-950 bg-rose-50 p-3.5 rounded-xl border border-rose-200 [text-wrap:pretty]">
              {challenge.counterThesis}
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Vulnerable assumptions attacked</span>
            <div className="space-y-2">
              {challenge.vulnerableAssumptions.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs bg-rose-50/60 p-3 rounded-lg border border-rose-200 text-rose-900 font-medium">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span className="[text-wrap:pretty]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-rose-900 pt-1 leading-relaxed [text-wrap:pretty]">
            {challenge.explanation}
          </p>
        </section>
      </div>

      {/* 6. Stress Scenarios */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
              6
            </div>
            <h3 className="text-base font-bold text-zinc-900 [text-wrap:balance]">
              Four deterministic stress scenarios
            </h3>
          </div>
          <span className="text-xs text-zinc-500">Zero speculative heuristics • Pure deterministic arithmetic</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenarios.map((sc) => {
            const isSevere = sc.estimatedPnlPct !== null && sc.estimatedPnlPct <= -10;
            return (
              <div
                key={sc.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 font-mono">
                      {sc.id}
                    </span>
                    <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-bold text-zinc-700">
                      STRESS
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 mt-1 [text-wrap:balance]">
                    {sc.name}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 [text-wrap:pretty]">
                    {sc.description}
                  </p>
                </div>

                <div className="border-t border-zinc-200 pt-3 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-zinc-500">Shocked token:</span>
                    <span className="font-mono text-xs font-bold text-zinc-800">
                      ${sc.shockedTokenPrice ? sc.shockedTokenPrice.toFixed(2) : "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-zinc-500">Position P and L:</span>
                    <span className={`font-mono text-sm font-bold ${
                      isSevere ? "text-rose-600" : "text-zinc-900"
                    }`}>
                      {sc.estimatedPnlUsd !== null
                        ? `${sc.estimatedPnlUsd >= 0 ? "+" : ""}$${sc.estimatedPnlUsd.toFixed(2)}`
                        : "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-zinc-500">Return shock:</span>
                    <span className={`font-mono text-xs font-bold ${
                      isSevere ? "text-rose-600" : "text-zinc-800"
                    }`}>
                      {sc.estimatedPnlPct !== null
                        ? `${sc.estimatedPnlPct >= 0 ? "+" : ""}${sc.estimatedPnlPct.toFixed(2)}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-600 font-mono [text-wrap:pretty]">
                  {sc.assumptions[0]}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Thesis vs Position Split Card (THE CORE PRODUCT THESIS!) */}
      <section className="rounded-2xl border border-indigo-300 bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-700 text-white text-xs font-bold">
            7
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Core product thesis
            </span>
            <h3 className="text-lg font-bold text-zinc-900 [text-wrap:balance]">
              Thesis quality versus position quality deconstruction
            </h3>
          </div>
        </div>

        {/* Dual Qualitative Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
          {/* Subtle connecting line in the middle for desktop */}
          <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-px bg-indigo-100 -translate-x-1/2" />

          {/* Thesis Quality Panel */}
          <div className={`rounded-xl border-2 p-5 space-y-3 shadow-xs relative bg-white ${
            thesisPosition.thesisQuality === "STRONGER"
              ? "border-emerald-200"
              : "border-amber-200"
          }`}>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-zinc-800 uppercase tracking-wider">
                  Thesis Quality
                </span>
              </div>
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                thesisPosition.thesisQuality === "STRONGER"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {thesisPosition.thesisQuality}
              </span>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed font-medium [text-wrap:pretty]">
              Fundamental enterprise demand rationale has empirical tailwinds, corroborated by news and earnings filings.
            </p>
          </div>

          {/* Position Quality Panel */}
          <div className={`rounded-xl border-2 p-5 space-y-3 shadow-xs relative bg-white ${
            thesisPosition.positionQuality.quality === "WEAKER"
              ? "border-rose-200"
              : "border-emerald-200"
          }`}>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-zinc-800 uppercase tracking-wider">
                  Position Quality
                </span>
              </div>
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                thesisPosition.positionQuality.quality === "WEAKER"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}>
                {thesisPosition.positionQuality.quality}
              </span>
            </div>
            {thesisPosition.positionQuality.reasons && thesisPosition.positionQuality.reasons.length > 0 && (
              <div className="mt-2 text-xs text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-200">
                <div className="font-semibold text-zinc-800 mb-1 uppercase tracking-wide">Deterministic Drivers</div>
                <ul className="list-disc pl-4 space-y-1">
                  {thesisPosition.positionQuality.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-zinc-700 leading-relaxed font-medium [text-wrap:pretty]">
              Execution vehicle, timing, and microstructure are compromised due to weekend illiquidity and off hours gap vulnerability.
            </p>
          </div>
        </div>

        {/* Prominent Key Mismatch Banner */}
        {thesisPosition.keyMismatch && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
              <svg className="w-4 h-4 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Key mismatch identified
            </div>
            <p className="text-xs sm:text-sm font-semibold text-indigo-950 leading-relaxed [text-wrap:pretty]">
              {thesisPosition.keyMismatch}
            </p>
          </div>
        )}

        <p className="text-xs text-zinc-600 leading-relaxed [text-wrap:pretty]">
          {thesisPosition.explanation}
        </p>
      </section>

      {/* 8. Change Conditions */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
            8
          </div>
          <h3 className="text-base font-bold text-zinc-900 [text-wrap:balance]">
            Actionable change conditions
          </h3>
        </div>
        <p className="text-xs text-zinc-500 [text-wrap:pretty]">
          The observable triggers that would materially change the verdict from {decision.verdict} to PROCEED:
        </p>
        <div className="space-y-2">
          {changeConditions.map((condition, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                ✓
              </span>
              <p className="text-xs sm:text-sm font-medium text-zinc-800 leading-snug [text-wrap:pretty]">
                {condition}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Navigation CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200">
        <button
          type="button"
          onClick={onNewTrade}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Stress test another trade
        </button>

        <button
          type="button"
          onClick={onOpenProvenance}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
        >
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View full provenance chain ({artifact.provenance.length} records)
        </button>
      </div>
    </div>
  );
}


