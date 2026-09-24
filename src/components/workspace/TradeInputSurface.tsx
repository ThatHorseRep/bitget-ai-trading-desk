"use client";

import React, { useState, useMemo } from "react";
import type { Verdict } from "@/config/branding";
import { VerdictGlyph } from "@/components/brand/VerdictGlyph";
import { parseNaturalLanguageTrade } from "@/core/trade/parser";

interface TradeInputSurfaceProps {
  initialPrompt?: string;
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

interface ScenarioPreset {
  id: string;
  label: string;
  badge: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  size: string;
  verdict: Verdict;
  summary: string;
  expectedShortfall: string;
  basisGap: string;
  depthVsSession: string;
  cryptoBeta: string;
  actionText: string;
  promptText: string;
}

// Exactly 4 calibrated canonical scenarios matching the 4 desk verdicts (Symmetrical 2x2 grid)
const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    id: "proceed",
    label: "Cash Hours Confirmed Arbitrage",
    badge: "Execution Runway",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$10,000",
    verdict: "PROCEED",
    summary: "US cash market open. Tight 0.02% spread with confirmed arbitrage depth.",
    expectedShortfall: "-2.1%",
    basisGap: "+0.02%",
    depthVsSession: "0.12x",
    cryptoBeta: "0.15",
    actionText: "Execute Trade Runway",
    promptText:
      "I plan to buy $10,000 rNVDA token during US cash market hours at 10:15 AM ET with 0.02% basis spread. Data center revenue beat + low crypto correlation."
  },
  {
    id: "reduce",
    label: "High Leverage Extended Hours",
    badge: "Leverage Bound",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$50,000",
    verdict: "REDUCE",
    summary: "Notional size overwhelms thin off-hours orderbook depth. Resize required.",
    expectedShortfall: "-15.2%",
    basisGap: "+0.45%",
    depthVsSession: "1.85x",
    cryptoBeta: "0.45",
    actionText: "Resize to Recommended Limit",
    promptText:
      "I plan to buy $50,000 rNVDA token with 5x leverage during extended hours. Basis spread elevated at 0.45%."
  },
  {
    id: "wait",
    label: "Weekend 65.5h Liquidity Void",
    badge: "Off-Hours Drift",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$2,000",
    verdict: "WAIT",
    summary: "65.5h off-hours basis drift (+2.56%) exceeds cash volatility buffer.",
    expectedShortfall: "-8.4%",
    basisGap: "+2.56%",
    depthVsSession: "0.35x",
    cryptoBeta: "0.20",
    actionText: "Defer to Monday Open",
    promptText:
      "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it."
  },
  {
    id: "reject",
    label: "Unhedged Weekend Cascade",
    badge: "Tail Risk",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$100,000",
    verdict: "REJECT",
    summary: "Dislocation exceeds threshold. Structural failure before Monday open.",
    expectedShortfall: "-42.5%",
    basisGap: "+5.80%",
    depthVsSession: "4.50x",
    cryptoBeta: "0.85",
    actionText: "Reject Capital Allocation",
    promptText:
      "Ape $100,000 with max leverage into tokenized equity with no thesis, no stop loss, and liquidation cascade risk."
  }
];

const VERDICT_THEME_COLOR: Record<Verdict, string> = {
  PROCEED: "var(--rtd-proceed)",
  REDUCE: "var(--rtd-reduce)",
  WAIT: "var(--rtd-wait)",
  REJECT: "var(--rtd-reject)",
};

export function TradeInputSurface({
  initialPrompt = "",
  onSubmit,
  isLoading
}: TradeInputSurfaceProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [activeTab, setActiveTab] = useState<"results" | "input">(
    initialPrompt ? "results" : "input"
  );

  // Derive active preset if exact match
  const matchedPreset = useMemo(() => {
    if (!prompt.trim()) return undefined;
    return PRESET_SCENARIOS.find((p) => p.promptText.trim() === prompt.trim());
  }, [prompt]);

  // Real-time grammar extraction using core deterministic trade parser
  const parsedRealtime = useMemo(() => {
    if (!prompt.trim()) return null;
    return parseNaturalLanguageTrade(prompt);
  }, [prompt]);

  // Dynamic parse from prompt text (NO fake hardcoded defaults)
  const positionInfo = useMemo(() => {
    if (!prompt.trim()) {
      return {
        isPreset: false,
        symbol: "—",
        direction: "—",
        size: "—",
        verdict: null as Verdict | null,
        verdictTitle: "AWAITING THESIS",
        summary: "Enter your trade thesis (ticker, direction, size, rationale) or select a preset to evaluate risk runway.",
        expectedShortfall: "—",
        basisGap: "—",
        depthVsSession: "—",
        cryptoBeta: "—",
        actionText: "Enter Trade Thesis to Evaluate"
      };
    }

    if (matchedPreset) {
      return {
        isPreset: true,
        symbol: matchedPreset.symbol,
        direction: matchedPreset.direction.toLowerCase(),
        size: matchedPreset.size,
        verdict: matchedPreset.verdict,
        verdictTitle: matchedPreset.verdict,
        summary: matchedPreset.summary,
        expectedShortfall: matchedPreset.expectedShortfall,
        basisGap: matchedPreset.basisGap,
        depthVsSession: matchedPreset.depthVsSession,
        cryptoBeta: matchedPreset.cryptoBeta,
        actionText: matchedPreset.actionText
      };
    }

    // Real-time extracted fields from actual user input
    const idea = parsedRealtime?.tradeIdea;
    const hasAsset = Boolean(parsedRealtime?.userProvidedFields?.includes("asset"));
    const hasDirection = Boolean(parsedRealtime?.userProvidedFields?.includes("direction"));
    const hasSize = Boolean(parsedRealtime?.userProvidedFields?.includes("positionSizeUsd"));

    const symbol = hasAsset && idea?.asset ? idea.asset : "—";
    const direction = hasDirection && idea?.direction ? idea.direction.toLowerCase() : "—";
    const size = hasSize && typeof idea?.positionSizeUsd === "number" && idea.positionSizeUsd > 0
      ? `$${idea.positionSizeUsd.toLocaleString()}`
      : "—";

    const isComplete = hasAsset && hasDirection && hasSize;

    return {
      isPreset: false,
      symbol,
      direction,
      size,
      verdict: null as Verdict | null,
      verdictTitle: isComplete ? "READY TO EVALUATE" : "PARSING THESIS",
      summary: isComplete
        ? "Thesis parameters detected. Click 'Run Adversarial Desk' to execute live orderbook, basis spread, and stress testing."
        : "Specify asset (e.g. rNVDA), direction (buy/sell), size ($USD), and reasoning to evaluate.",
      expectedShortfall: isComplete ? "Computed on run" : "—",
      basisGap: isComplete ? "Live feed on run" : "—",
      depthVsSession: isComplete ? "Orderbook on run" : "—",
      cryptoBeta: isComplete ? "Computed on run" : "—",
      actionText: isComplete ? "Run Adversarial Desk" : "Complete Thesis Parameters"
    };
  }, [prompt, matchedPreset, parsedRealtime]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt.trim());
  };

  const isReject = positionInfo.verdict === "REJECT";

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col justify-between min-h-full h-auto lg:h-full space-y-3 lg:space-y-4">
      {/* Sleek, Compact Workbench Header Strip (Zero scroll overflow) */}
      <div className="bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 px-4 py-2.5 sm:px-5 sm:py-3 shadow-2xs flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--rtd-ink)] shrink-0">
            01 / RISK WORKBENCH
          </span>
          <span className="hidden sm:inline text-[var(--rtd-steel)] text-xs">•</span>
          <span className="text-[11px] sm:text-xs text-[var(--rtd-steel)] font-sans truncate">
            Stress-test tokenized equity trades across the 65.5h off-hours session.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--rtd-proceed)] animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--rtd-steel)]">
            ENGINE ONLINE
          </span>
        </div>
      </div>

      {/* Mobile view tab switcher (< md) */}
      <div className="flex md:hidden items-center justify-between border-b border-[var(--rtd-steel)]/25 pb-2 shrink-0">
        <div className="flex items-center gap-1 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("input")}
            className={`min-h-[36px] px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all flex items-center justify-center cursor-pointer ${
              activeTab === "input"
                ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] shadow-xs"
                : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)]"
            }`}
          >
            Thesis Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("results")}
            className={`min-h-[36px] px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all flex items-center justify-center cursor-pointer ${
              activeTab === "results"
                ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] shadow-xs"
                : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)]"
            }`}
          >
            Cockpit Preview
          </button>
        </div>

        <span className="text-[10.5px] font-mono font-bold text-[var(--rtd-steel)] uppercase">
          {positionInfo.symbol} · {positionInfo.direction}
        </span>
      </div>

      {/* Single-Screen Grid Layout: Left Cockpit + Right Control Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 flex-1 min-h-0 items-stretch">
        {/* ==================================================================
            LEFT COLUMN: THE COCKPIT TERMINAL DECK (40% width on desktop)
            Nocturnal high-contrast console matching 06-mobile-app.png
           ================================================================== */}
        <div
          className={`lg:col-span-5 flex flex-col h-full ${
            activeTab === "results" ? "block" : "hidden md:flex"
          }`}
        >
          <div className="w-full h-full bg-[var(--rtd-void)] text-white border border-white/20 shadow-xl rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
            {/* Dynamic Verdict Indicator Bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1 transition-colors duration-300"
              style={{
                backgroundColor: positionInfo.verdict
                  ? VERDICT_THEME_COLOR[positionInfo.verdict]
                  : "rgba(255,255,255,0.2)"
              }}
            />

            {/* 1. Header: Current Position (symbol · direction · size) */}
            <div className="border-b border-white/15 pb-2.5 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[9.5px] font-mono tracking-[0.2em] text-slate-400 uppercase block">
                  CURRENT POSITION
                </span>
                <div className="text-sm sm:text-base font-mono font-bold tracking-wider text-white">
                  {positionInfo.symbol} · {positionInfo.direction} ·{" "}
                  <span className="rtd-figure">{positionInfo.size}</span>
                </div>
              </div>

              <div className="px-2 py-0.5 bg-white/10 border border-white/20 text-[9.5px] font-mono tracking-widest uppercase text-slate-300">
                65.5H COCKPIT
              </div>
            </div>

            {/* 2. Center Verdict Display */}
            <div className="py-1 flex flex-col items-center text-center space-y-2.5 my-auto">
              <div className="p-2.5 bg-white/5 border border-white/15 rounded-xl shadow-inner">
                <VerdictGlyph
                  verdict={positionInfo.verdict ?? "WAIT"}
                  size={58}
                  reversed
                />
              </div>

              <div className="space-y-1">
                <div
                  className="text-2xl sm:text-3xl font-mono font-black tracking-widest uppercase transition-colors"
                  style={{
                    color: positionInfo.verdict
                      ? VERDICT_THEME_COLOR[positionInfo.verdict]
                      : "#ffffff"
                  }}
                >
                  {positionInfo.verdictTitle}
                </div>
                <p className="text-[11.5px] sm:text-xs font-sans text-slate-300 max-w-[280px] mx-auto leading-snug">
                  {positionInfo.summary}
                </p>
              </div>
            </div>

            {/* 3. Real-Time Risk Statistics Table */}
            <div className="border-t border-white/15 divide-y divide-white/10 text-[11px] sm:text-xs font-mono shrink-0">
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-400 uppercase tracking-wider">
                  Expected shortfall
                </span>
                <span className="rtd-figure font-bold text-white">
                  {positionInfo.expectedShortfall}
                </span>
              </div>

              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-400 uppercase tracking-wider">
                  Basis gap
                </span>
                <span className="rtd-figure font-bold text-white">
                  {positionInfo.basisGap}
                </span>
              </div>

              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-400 uppercase tracking-wider">
                  Depth vs. session
                </span>
                <span className="rtd-figure font-bold text-white">
                  {positionInfo.depthVsSession}
                </span>
              </div>

              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-400 uppercase tracking-wider">
                  Crypto beta
                </span>
                <span className="rtd-figure font-bold text-white">
                  {positionInfo.cryptoBeta}
                </span>
              </div>
            </div>

            {/* 4. Action Trigger Button */}
            <div className="pt-1 shrink-0">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!prompt.trim() || isLoading}
                className={`w-full py-3 text-xs sm:text-sm font-mono font-bold tracking-wider uppercase active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  !prompt.trim()
                    ? "bg-white/10 text-slate-400 border border-white/15 opacity-60 cursor-not-allowed"
                    : isReject
                    ? "bg-[var(--rtd-stamp)] text-white hover:brightness-110 shadow-lg"
                    : "bg-white/15 text-white border border-white/30 hover:bg-white/25 shadow-md"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <span>Evaluating Risk Pipeline...</span>
                ) : !prompt.trim() ? (
                  <span>Enter Thesis to Run Stress Test →</span>
                ) : (
                  <>
                    <span>{positionInfo.actionText}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================
            RIGHT COLUMN: THESIS CONTROLS & PRESET SCENARIOS (60% width)
           ================================================================== */}
        <div
          className={`lg:col-span-7 flex flex-col justify-between gap-3 sm:gap-4 h-full ${
            activeTab === "input" ? "block" : "hidden md:flex"
          }`}
        >
          {/* Symmetrical 2x2 Preset Policy Grid */}
          <div className="bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 p-3.5 sm:p-4 shadow-2xs space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[var(--rtd-ink)]">
                Calibrated Policy Scenarios:
              </span>
              <span className="text-[9.5px] font-mono text-[var(--rtd-steel)] uppercase">
                4 PRESETS (1-CLICK LOAD)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {PRESET_SCENARIOS.map((preset) => {
                const isSelected = prompt.trim() === preset.promptText.trim();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setPrompt(preset.promptText);
                    }}
                    className={`p-2.5 sm:p-3 text-left border transition-all flex flex-col justify-between space-y-1.5 group cursor-pointer ${
                      isSelected
                        ? "bg-[var(--rtd-paper-subtle)] border-[var(--rtd-ink)] ring-1 ring-[var(--rtd-ink)] shadow-2xs"
                        : "bg-[var(--rtd-paper)] border-[var(--rtd-steel)]/25 hover:border-[var(--rtd-steel)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-mono font-bold tracking-wider uppercase"
                        style={{ color: VERDICT_THEME_COLOR[preset.verdict] }}
                      >
                        {preset.verdict}
                      </span>
                      <span className="text-[9px] font-mono text-[var(--rtd-steel)] uppercase">
                        {preset.badge}
                      </span>
                    </div>

                    <div>
                      <div className="text-[11.5px] sm:text-xs font-mono font-bold text-[var(--rtd-ink)] group-hover:text-[var(--rtd-void)] leading-snug line-clamp-2 min-h-[2rem] flex items-center">
                        {preset.label}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--rtd-steel)] rtd-figure mt-0.5">
                        {preset.symbol} · {preset.size}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Natural Language Input Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 p-3.5 sm:p-4 shadow-2xs flex-1 flex flex-col justify-between space-y-2.5 min-h-[160px]"
          >
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between shrink-0">
                <label
                  htmlFor="trade-thesis-input"
                  className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[var(--rtd-ink)]"
                >
                  Trade Thesis &amp; Rationale Statement
                </label>
                <div className="flex items-center gap-2">
                  {prompt.trim() && (
                    <button
                      type="button"
                      onClick={() => setPrompt("")}
                      className="text-[10px] font-mono text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <span className="text-[10px] font-mono text-[var(--rtd-steel)]">
                    Grammar Extraction
                  </span>
                </div>
              </div>

              <textarea
                id="trade-thesis-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I plan to buy $2,000 of rNVDA token during weekend off-hours because AI infrastructure demand still looks strong..."
                disabled={isLoading}
                className="w-full flex-1 min-h-[75px] max-h-[140px] border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper-subtle)] p-3 text-xs sm:text-sm font-mono text-[var(--rtd-ink)] placeholder:text-[var(--rtd-steel)]/60 focus:bg-[var(--rtd-paper)] focus:border-[var(--rtd-ink)] focus:outline-hidden transition-all resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-[var(--rtd-steel)]/15 shrink-0">
              <div className="text-[10.5px] font-mono text-[var(--rtd-steel)]">
                Detected:{" "}
                <span className="font-bold text-[var(--rtd-ink)]">
                  {positionInfo.symbol !== "—" || positionInfo.direction !== "—" || positionInfo.size !== "—"
                    ? `${positionInfo.symbol} · ${positionInfo.direction} · ${positionInfo.size}`
                    : "None yet (enter symbol, direction & size)"}
                </span>
              </div>

              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="min-h-[40px] px-5 py-2 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold tracking-wider uppercase hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span>Stress-testing...</span>
                ) : (
                  <>
                    <span>Run Adversarial Desk</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
