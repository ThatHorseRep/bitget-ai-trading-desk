"use client";

import React, { useState, useMemo } from "react";
import { VERDICT_COLOR, type Verdict } from "@/config/branding";
import { VerdictGlyph } from "@/components/brand/VerdictGlyph";

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

const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    id: "canonical",
    label: "Reference rNVDA Thesis",
    badge: "Official fixture",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$2,000",
    verdict: "WAIT",
    summary: "65.5h off-hours basis drift (+2.56%) exceeds cash volatility buffer.",
    expectedShortfall: "-8.4%",
    basisGap: "+2.56%",
    depthVsSession: "0.35x",
    cryptoBeta: "0.20",
    actionText: "Stress test trade",
    promptText:
      "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it."
  },
  {
    id: "reduce",
    label: "High Leverage Extended Hours",
    badge: "Leverage test",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$50,000",
    verdict: "REDUCE",
    summary: "Notional size overwhelms thin off-hours orderbook depth.",
    expectedShortfall: "-15.2%",
    basisGap: "+0.45%",
    depthVsSession: "1.85x",
    cryptoBeta: "0.45",
    actionText: "Resize to $15,000",
    promptText:
      "I plan to buy $50,000 rNVDA token with 5x leverage during extended hours. Basis spread elevated at 0.45%."
  },
  {
    id: "wait",
    label: "Sunday Night Liquidity Void",
    badge: "Weekend closure",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$25,000",
    verdict: "WAIT",
    summary: "Cash market closed. 65.5h un-anchored drift until Monday 09:30 ET.",
    expectedShortfall: "-6.8%",
    basisGap: "+3.10%",
    depthVsSession: "0.18x",
    cryptoBeta: "0.30",
    actionText: "Defer to Monday Open",
    promptText:
      "I want to buy $25,000 rNVDA token on Sunday at 02:00 AM ET during 65.5-hour weekend market closure."
  },
  {
    id: "reject",
    label: "Unhedged Weekend Cascade",
    badge: "Tail risk",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$100,000",
    verdict: "REJECT",
    summary: "Dislocation exceeds threshold. Structural failure before Monday open.",
    expectedShortfall: "-42.5%",
    basisGap: "+5.80%",
    depthVsSession: "4.50x",
    cryptoBeta: "0.85",
    actionText: "Reject capital allocation",
    promptText:
      "Ape $100,000 with max leverage into tokenized equity with no thesis, no stop loss, and liquidation cascade risk."
  },
  {
    id: "proceed",
    label: "Cash Hours Confirmed Arbitrage",
    badge: "Execution runway",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$10,000",
    verdict: "PROCEED",
    summary: "Cash market open. Tight 0.02% spread with confirmed arbitrage depth.",
    expectedShortfall: "-2.1%",
    basisGap: "+0.02%",
    depthVsSession: "0.12x",
    cryptoBeta: "0.15",
    actionText: "Execute trade runway",
    promptText:
      "I plan to buy $10,000 rNVDA token during US cash market hours at 10:15 AM ET with 0.02% basis spread. Data center revenue beat + low crypto correlation."
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

  // Derive active preset or parse inputs from prompt
  const matchedPreset = useMemo(() => {
    if (!prompt.trim()) return undefined;
    return PRESET_SCENARIOS.find((p) => p.promptText.trim() === prompt.trim());
  }, [prompt]);

  // Dynamic parse from prompt text
  const positionInfo = useMemo(() => {
    if (!prompt.trim()) {
      return {
        symbol: "—",
        direction: "—",
        size: "—",
        verdict: "WAIT" as Verdict,
        summary: "Enter your trade thesis or choose a preset scenario below to stress-test your trade.",
        expectedShortfall: "—",
        basisGap: "—",
        depthVsSession: "—",
        cryptoBeta: "—",
        actionText: "Enter trade thesis to evaluate"
      };
    }

    if (matchedPreset) {
      return {
        symbol: matchedPreset.symbol,
        direction: matchedPreset.direction.toLowerCase(),
        size: matchedPreset.size,
        verdict: matchedPreset.verdict,
        summary: matchedPreset.summary,
        expectedShortfall: matchedPreset.expectedShortfall,
        basisGap: matchedPreset.basisGap,
        depthVsSession: matchedPreset.depthVsSession,
        cryptoBeta: matchedPreset.cryptoBeta,
        actionText: matchedPreset.actionText
      };
    }

    // Heuristic inference for custom prompt
    const lower = prompt.toLowerCase();
    const symbolMatch = prompt.match(/\b(rNVDA|rTSLA|rAAPL|rMSFT|rAMZN|NVDA|TSLA)\b/i);
    const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : "rNVDA";
    const direction = lower.includes("short") || lower.includes("sell") ? "short" : "long";
    const sizeMatch = prompt.match(/\$([0-9,]+)/);
    const size = sizeMatch ? `$${sizeMatch[1]}` : "$2,000";

    let verdict: Verdict = "WAIT";
    let summary = "Off-hours basis drift under review. Awaiting deterministic engine.";
    let expectedShortfall = "-7.2%";
    let basisGap = "+2.40%";
    let depthVsSession = "0.28x";
    let cryptoBeta = "0.35";
    let actionText = "Stress test trade";

    if (lower.includes("ape") || lower.includes("cascade") || lower.includes("no thesis") || lower.includes("liquidation")) {
      verdict = "REJECT";
      summary = "Dislocation exceeds threshold. Structural failure before Monday open.";
      expectedShortfall = "-38.0%";
      basisGap = "+5.40%";
      depthVsSession = "3.80x";
      cryptoBeta = "0.85";
      actionText = "Reject capital allocation";
    } else if (lower.includes("50,000") || lower.includes("leverage") || lower.includes("elevated")) {
      verdict = "REDUCE";
      summary = "Notional size overwhelms thin off-hours orderbook depth.";
      expectedShortfall = "-14.5%";
      basisGap = "+0.45%";
      depthVsSession = "1.60x";
      cryptoBeta = "0.45";
      actionText = "Resize to recommended limit";
    } else if (lower.includes("cash market") || lower.includes("0.02%") || lower.includes("low crypto")) {
      verdict = "PROCEED";
      summary = "Cash market open. Tight spread with confirmed arbitrage depth.";
      expectedShortfall = "-2.1%";
      basisGap = "+0.02%";
      depthVsSession = "0.12x";
      cryptoBeta = "0.15";
      actionText = "Execute trade runway";
    }

    return {
      symbol,
      direction,
      size,
      verdict,
      summary,
      expectedShortfall,
      basisGap,
      depthVsSession,
      cryptoBeta,
      actionText
    };
  }, [prompt, matchedPreset]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt.trim());
  };

  const isReject = positionInfo.verdict === "REJECT";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Mobile view switcher for small screens (< 768px) */}
      <div className="flex md:hidden items-center justify-between border-b border-[var(--rtd-steel)]/25 pb-3">
        <div className="flex items-center gap-1 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 p-1 rounded-xs">
          <button
            type="button"
            onClick={() => setActiveTab("results")}
            className={`min-h-[44px] px-3.5 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center justify-center cursor-pointer ${
              activeTab === "results"
                ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] shadow-xs"
                : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)]"
            }`}
          >
            06 / Results View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("input")}
            className={`min-h-[44px] px-3.5 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center justify-center cursor-pointer ${
              activeTab === "input"
                ? "bg-[var(--rtd-ink)] text-[var(--rtd-paper)] shadow-xs"
                : "text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)]"
            }`}
          >
            Edit Trade Thesis
          </button>
        </div>

        <span className="text-[11px] font-mono font-bold text-[var(--rtd-steel)] uppercase">
          {positionInfo.symbol} · {positionInfo.direction}
        </span>
      </div>

      {/* Main Grid: On desktop (>= 1024px) side-by-side. On tablet/mobile stacked or tabbed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================================================================
            LEFT COLUMN: THE RESULTS VIEW (Matches 06-mobile-app.png)
            On mobile (< 768px), rendered when activeTab === "results".
            On desktop, styled as the mobile app surface / cockpit.
           ================================================================== */}
        <div
          className={`lg:col-span-6 xl:col-span-5 flex justify-center ${
            activeTab === "results" ? "block" : "hidden md:block"
          }`}
        >
          {/* Mobile phone card frame matching 06-mobile-app.png */}
          <div className="w-full max-w-[420px] bg-[var(--rtd-void)] text-[var(--rtd-paper)] border border-[var(--rtd-steel)]/30 shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative overflow-hidden">
            {/* Subtle top indicator bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: VERDICT_THEME_COLOR[positionInfo.verdict] }}
            />

            {/* 1. HEADER: Current Position (symbol · direction · size) */}
            <div className="border-b border-[var(--rtd-steel)]/25 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-[var(--rtd-steel)] uppercase block mb-1">
                  CURRENT POSITION
                </span>
                <div className="text-base sm:text-lg font-mono font-bold tracking-wider text-[var(--rtd-paper)]">
                  {positionInfo.symbol} · {positionInfo.direction} ·{" "}
                  <span className="rtd-figure">{positionInfo.size}</span>
                </div>
              </div>

              <div className="px-2.5 py-1 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/30 text-[10px] font-mono tracking-widest uppercase text-[var(--rtd-steel)]">
                65.5H DESK
              </div>
            </div>

            {/* 2. RESULTS VIEW: Large centered glyph, verdict name, one-line summary */}
            <div className="py-4 flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/30 rounded-xl shadow-inner">
                <VerdictGlyph verdict={positionInfo.verdict} size={76} reversed />
              </div>

              <div className="space-y-1.5">
                <div
                  className="text-3xl sm:text-4xl font-mono font-black tracking-widest uppercase"
                  style={{ color: VERDICT_THEME_COLOR[positionInfo.verdict] }}
                >
                  {positionInfo.verdict}
                </div>
                <p className="text-xs sm:text-sm font-sans text-[var(--rtd-steel)] max-w-[280px] sm:max-w-xs mx-auto leading-relaxed">
                  {positionInfo.summary}
                </p>
              </div>
            </div>

            {/* 3. STAT LIST: Expected shortfall, Basis gap, Depth vs. session, Crypto beta
                Every numeric value has .rtd-figure applied for mono tabular figures. */}
            <div className="border-t border-[var(--rtd-steel)]/25 divide-y divide-[var(--rtd-steel)]/20 text-xs font-mono">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[var(--rtd-steel)] uppercase tracking-wider">
                  Expected shortfall
                </span>
                <span className="rtd-figure font-bold text-[var(--rtd-paper)]">
                  {positionInfo.expectedShortfall}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[var(--rtd-steel)] uppercase tracking-wider">
                  Basis gap
                </span>
                <span className="rtd-figure font-bold text-[var(--rtd-paper)]">
                  {positionInfo.basisGap}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[var(--rtd-steel)] uppercase tracking-wider">
                  Depth vs. session
                </span>
                <span className="rtd-figure font-bold text-[var(--rtd-paper)]">
                  {positionInfo.depthVsSession}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[var(--rtd-steel)] uppercase tracking-wider">
                  Crypto beta
                </span>
                <span className="rtd-figure font-bold text-[var(--rtd-paper)]">
                  {positionInfo.cryptoBeta}
                </span>
              </div>
            </div>

            {/* 4. FULL-WIDTH ACTION BUTTON AT BOTTOM
                Only red if the verdict is REJECT; otherwise use appropriate non-stamp color. */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!prompt.trim() || isLoading}
                className={`w-full py-4 text-xs sm:text-sm font-mono font-bold tracking-wider uppercase active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  !prompt.trim()
                    ? "bg-[var(--rtd-paper-subtle)] text-[var(--rtd-steel)] border border-[var(--rtd-steel)]/30 opacity-60 cursor-not-allowed"
                    : isReject
                    ? "bg-[var(--rtd-stamp)] text-white hover:brightness-110"
                    : "bg-[var(--rtd-paper-subtle)] text-[var(--rtd-paper)] border border-[var(--rtd-steel)]/40 hover:bg-[var(--rtd-proof)]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <span>Evaluating Risk Pipeline...</span>
                ) : !prompt.trim() ? (
                  <span>Enter trade thesis to evaluate →</span>
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
            RIGHT COLUMN: THESIS CONTROLS & PRESETS
            Gives room to breathe on desktop (768px, 1280px).
            Contains preset triggers, custom textarea, and test harness.
           ================================================================== */}
        <div
          className={`lg:col-span-6 xl:col-span-7 space-y-6 ${
            activeTab === "input" ? "block" : "hidden md:block"
          }`}
        >
          {/* Editorial Banner */}
          <div className="bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 p-6 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--rtd-steel)]">
                06 / TRADE ADVERSARY INPUT
              </span>
              <span className="text-[11px] font-mono text-[var(--rtd-proceed)] font-bold">
                POLICY RUNWAY ACTIVE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-[var(--rtd-ink)] tracking-tight">
              Pre-trade stress test workbench.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--rtd-steel)] font-sans leading-relaxed">
              Tokenized equities trade 24/7 on Bitget, while underlying NYSE/Nasdaq equities trade only during cash sessions. Select a canonical test scenario or specify your custom trade thesis.
            </p>
          </div>

          {/* Quick Verdict Policy Selectors */}
          <div className="bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--rtd-ink)]">
                Test Verdict Policy Scenarios:
              </span>
              <span className="text-[10px] font-mono text-[var(--rtd-steel)] uppercase">
                5 PRESETS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_SCENARIOS.map((preset) => {
                const isSelected = prompt.trim() === preset.promptText.trim();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setPrompt(preset.promptText);
                      setActiveTab("results");
                    }}
                    className={`p-3 text-left border transition-all flex flex-col justify-between space-y-2 group cursor-pointer ${
                      isSelected
                        ? "bg-[var(--rtd-paper-subtle)] border-[var(--rtd-ink)] shadow-xs"
                        : "bg-[var(--rtd-paper)] border-[var(--rtd-steel)]/25 hover:border-[var(--rtd-steel)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] font-mono font-bold tracking-wider uppercase"
                        style={{ color: VERDICT_THEME_COLOR[preset.verdict] }}
                      >
                        {preset.verdict}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--rtd-steel)] uppercase">
                        {preset.badge}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-mono font-bold text-[var(--rtd-ink)] group-hover:text-[var(--rtd-void)]">
                        {preset.label}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--rtd-steel)] rtd-figure">
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
            className="bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="trade-thesis-input"
                className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--rtd-ink)]"
              >
                Trade Thesis &amp; Rationale
              </label>
              <span className="text-[11px] font-mono text-[var(--rtd-steel)]">
                Deterministic Grammar Extraction
              </span>
            </div>

            <textarea
              id="trade-thesis-input"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. I plan to buy $2,400 of rNVDA token during weekend hours..."
              disabled={isLoading}
              className="w-full border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper)] p-3.5 text-xs sm:text-sm font-mono text-[var(--rtd-ink)] placeholder:text-[var(--rtd-steel)]/60 focus:bg-[var(--rtd-paper-subtle)] focus:border-[var(--rtd-ink)] focus:outline-hidden transition-all resize-y"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[var(--rtd-steel)]/15">
              <div className="text-[11px] font-mono text-[var(--rtd-steel)]">
                Detected:{" "}
                <span className="font-bold text-[var(--rtd-ink)]">
                  {positionInfo.symbol} · {positionInfo.direction} · {positionInfo.size}
                </span>
              </div>

              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="min-h-[44px] px-6 py-2.5 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold tracking-wider uppercase hover:bg-[var(--rtd-void)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center gap-2 cursor-pointer"
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
