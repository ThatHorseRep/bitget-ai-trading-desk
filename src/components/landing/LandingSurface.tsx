import React from "react";
import Image from "next/image";
import { BRANDING } from "@/config/branding";

interface LandingSurfaceProps {
  onLaunchDesk: (initialPrompt?: string) => void;
}

const GOLDEN_PATH_PROMPT =
  "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it.";

export function LandingSurface({ onLaunchDesk }: LandingSurfaceProps) {
  return (
    <div className="w-full bg-[var(--rt-surface-base)] text-[var(--rt-text-primary)] font-sans selection:bg-[var(--rt-surface-void)] selection:text-[var(--rt-surface-raised)]">
      {/* Top Brand Header */}
      <header className="border-b border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0 bg-[var(--rt-surface-void)] flex items-center justify-center">
              <Image
                src={BRANDING.LOGOS.MARK}
                alt="Bitget AI RedTeam Desk Mark"
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-[0.2em] text-[var(--rt-text-muted)] uppercase font-semibold">
                {BRANDING.ENDORSER}
              </span>
              <span className="text-sm font-black tracking-tight text-[var(--rt-text-primary)]">
                {BRANDING.WORDMARK}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs font-mono text-[var(--rt-text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--rt-verdict-clear)]" />
              SYSTEM READY • S05 GATED
            </span>
            <button
              type="button"
              onClick={() => onLaunchDesk(GOLDEN_PATH_PROMPT)}
              className="px-4 py-2 bg-[var(--rt-surface-void)] text-[var(--rt-surface-raised)] text-xs font-mono font-bold tracking-wider uppercase hover:opacity-90 active:scale-95 transition-all border border-[var(--rt-surface-void)]"
            >
              Launch Desk →
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1: Above the Fold (Hero) */}
      <section className="border-b border-[var(--rt-border-subtle)] py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] text-[11px] font-mono text-[var(--rt-text-muted)] uppercase tracking-wider">
            <span className="font-bold text-[var(--rt-text-primary)]">DESK SPECIFICATION</span>
            <span>•</span>
            <span>TOKENIZED EQUITIES PRE-TRADE FIREWALL</span>
          </div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--rt-text-primary)] leading-[1.08]">
              Adversarial pre-trade risk workbench for tokenized equities.
            </h1>
            <p className="text-lg sm:text-xl text-[var(--rt-text-muted)] leading-relaxed max-w-3xl">
              An adversarial pre-trade risk workbench, not a predictive trading bot. It stress-tests basis decoupling, liquidity cliffs, and thesis invalidation before you commit capital.
            </p>
          </div>

          {/* Primary CTA Block with Golden Path Preview */}
          <div className="p-6 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] space-y-4 max-w-3xl">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--rt-text-muted)]">
              <span className="font-bold text-[var(--rt-text-primary)]">PRE-LOADED GOLDEN PATH SCENARIO</span>
              <span>24/7 WEEKEND BASIS TEST</span>
            </div>

            <div className="p-4 bg-[var(--rt-surface-base)] border border-[var(--rt-border-subtle)] font-mono text-xs sm:text-sm text-[var(--rt-text-primary)] leading-relaxed">
              &ldquo;{GOLDEN_PATH_PROMPT}&rdquo;
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onLaunchDesk(GOLDEN_PATH_PROMPT)}
                className="px-6 py-3.5 bg-[var(--rt-surface-void)] text-[var(--rt-surface-raised)] text-sm font-mono font-bold tracking-wider uppercase hover:opacity-90 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
              >
                <span>Run Golden Path Stress Test</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => onLaunchDesk()}
                className="px-6 py-3.5 bg-[var(--rt-surface-raised)] text-[var(--rt-text-primary)] text-sm font-mono font-medium tracking-wider uppercase border border-[var(--rt-border-subtle)] hover:bg-[var(--rt-surface-base)] transition-colors text-center"
              >
                Open Blank Workbench
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: The Problem */}
      <section className="border-b border-[var(--rt-border-subtle)] py-20 px-6 bg-[var(--rt-surface-raised)]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-[0.2em] text-[var(--rt-text-muted)] uppercase font-semibold">
              01 • STRUCTURAL VULNERABILITY
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--rt-text-primary)]">
              Off-hours dislocation on tokenized equities.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[var(--rt-surface-base)] border border-[var(--rt-border-subtle)] space-y-3">
              <div className="text-xs font-mono font-bold text-[var(--rt-verdict-critical)] uppercase">
                65.5-Hour Liquidity Void
              </div>
              <h3 className="text-base font-bold text-[var(--rt-text-primary)]">
                Un-Anchored Basis Drift
              </h3>
              <p className="text-sm text-[var(--rt-text-muted)] leading-relaxed">
                When US cash equity markets close from Friday 16:00 ET to Monday 09:30 ET, tokenized equities trade 24/7 on isolated crypto orderbooks without primary market maker arbitrage.
              </p>
            </div>

            <div className="p-6 bg-[var(--rt-surface-base)] border border-[var(--rt-border-subtle)] space-y-3">
              <div className="text-xs font-mono font-bold text-[var(--rt-verdict-moderate)] uppercase">
                Contagion Spillover
              </div>
              <h3 className="text-base font-bold text-[var(--rt-text-primary)]">
                Crypto Correlation Drag
              </h3>
              <p className="text-sm text-[var(--rt-text-muted)] leading-relaxed">
                Off-hours equity tokens inherit weekend crypto volatility. A Saturday BTC liquidation cascade drags tokenized tech equities downward regardless of underlying corporate health.
              </p>
            </div>

            <div className="p-6 bg-[var(--rt-surface-base)] border border-[var(--rt-border-subtle)] space-y-3">
              <div className="text-xs font-mono font-bold text-[var(--rt-text-primary)] uppercase">
                Monday Open Snap
              </div>
              <h3 className="text-base font-bold text-[var(--rt-text-primary)]">
                Basis Premium Collapse
              </h3>
              <p className="text-sm text-[var(--rt-text-muted)] leading-relaxed">
                Traders buying tokens at a +2.5% weekend premium face immediate structural loss when the token realigns violently to the cash equity open price at 09:30 ET.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: How It Works (The Real Pipeline Stages from docs/GOLDEN_PATH.md) */}
      <section className="border-b border-[var(--rt-border-subtle)] py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-[0.2em] text-[var(--rt-text-muted)] uppercase font-semibold">
              02 • EXECUTION PIPELINE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--rt-text-primary)]">
              Seven verifiable pipeline stages.
            </h2>
            <p className="text-sm text-[var(--rt-text-muted)] max-w-2xl">
              Each trade idea passes sequentially through deterministic parsers, empirical price feeds, scenario shock engines, and gated decision policies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rt-text-muted)]">
                <span className="font-bold text-[var(--rt-text-primary)]">STAGE 1</span>
                <span>S01 / S02</span>
              </div>
              <h3 className="text-base font-bold text-[var(--rt-text-primary)]">
                Trade Input &amp; Natural Language Parsing
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rt-text-muted)] leading-relaxed">
                Normalizes free-text trade ideas into structured asset, direction, notional size, and thesis claims via deterministic grammar extractors.
              </p>
            </div>

            <div className="p-5 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rt-text-muted)]">
                <span className="font-bold text-[var(--rt-text-primary)]">STAGE 2</span>
                <span>S04 STREAM</span>
              </div>
              <h3 className="text-base font-bold text-[var(--rt-text-primary)]">
                Live Price &amp; Market State Reconstruction
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rt-text-muted)] leading-relaxed">
                Queries token orderbook depth, NASDAQ cash reference pricing, basis spread deviation, and active trading session classification.
              </p>
            </div>

            <div className="p-5 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rt-text-muted)]">
                <span className="font-bold text-[var(--rt-text-primary)]">STAGE 3</span>
                <span>ARBITRATION</span>
              </div>
              <h3 className="text-base font-bold text-[var(--rt-text-primary)]">
                Evidence Gathering &amp; Arbitration
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rt-text-muted)] leading-relaxed">
                Retrieves empirical market observations, corporate fundamentals, and macro indicators, arbitrating conflicts into verifiable fact nodes.
              </p>
            </div>

            <div className="p-5 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rt-text-muted)]">
                <span className="font-bold text-[var(--rt-text-primary)]">STAGE 4</span>
                <span>ADVERSARIAL CORE</span>
              </div>
              <h3 className="text-base font-bold text-[var(--rt-text-primary)]">
                Thesis Deconstruction &amp; Adversarial Challenge
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rt-text-muted)] leading-relaxed">
                Attacks vulnerable assumptions, checks invalidation criteria, examines semiconductor macro supply chains, and synthesizes counter-theses.
              </p>
            </div>

            <div className="p-5 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rt-text-muted)]">
                <span className="font-bold text-[var(--rt-text-primary)]">STAGE 5</span>
                <span>MATHEMATICAL SHOCK</span>
              </div>
              <h3 className="text-base font-bold text-[var(--rt-text-primary)]">
                Deterministic Quantitative Stress Testing
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rt-text-muted)] leading-relaxed">
                Calculates exact dollar P&amp;L impact across 4 stress scenarios: Market Gap (-5%), Crypto Contagion (-8%), Token Illiquidity (+3% spread), and Combined Shock (-12%).
              </p>
            </div>

            <div className="p-5 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rt-text-muted)]">
                <span className="font-bold text-[var(--rt-text-primary)]">STAGE 6</span>
                <span>POLICY GATING</span>
              </div>
              <h3 className="text-base font-bold text-[var(--rt-text-primary)]">
                Policy Verdict &amp; Thesis vs. Position Deconstruction
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rt-text-muted)] leading-relaxed">
                Applies deterministic decision policy rules, mathematically separating thesis validity from execution timing and structural fragility.
              </p>
            </div>

            <div className="p-5 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] space-y-2 md:col-span-2">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rt-text-muted)]">
                <span className="font-bold text-[var(--rt-text-primary)]">STAGE 7</span>
                <span>S06 DECISION READY / S09 AUDIT</span>
              </div>
              <h3 className="text-base font-bold text-[var(--rt-text-primary)]">
                Provenance Graph Assembly
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rt-text-muted)] leading-relaxed">
                Compiles the complete Decision Artifact with interactive audit trails linking claims to observed prices, mathematical formulas, and scenario parameters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Deterministic-Gating Differentiator */}
      <section className="border-b border-[var(--rt-border-subtle)] py-20 px-6 bg-[var(--rt-surface-raised)]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-[0.2em] text-[var(--rt-text-muted)] uppercase font-semibold">
              03 • ARCHITECTURAL INTEGRITY
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--rt-text-primary)]">
              Verdict bands are computed, not generated.
            </h2>
            <p className="text-sm text-[var(--rt-text-muted)] max-w-3xl">
              Trading decisions cannot rely on generative model hallucinations. The LLM extracts structured signals; pure, deterministic TypeScript functions compute the scores and enforce policy gates.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Thesis Scoring Matrix */}
            <div className="p-6 bg-[var(--rt-surface-base)] border border-[var(--rt-border-subtle)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--rt-border-subtle)] pb-3">
                <h3 className="text-sm font-mono font-bold text-[var(--rt-text-primary)] uppercase">
                  Thesis Quality Weights (`scoreThesis`)
                </h3>
                <span className="text-xs font-mono text-[var(--rt-text-muted)]">Base = 0.00</span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between p-2 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)]">
                  <span>Explicit Invalidation Level</span>
                  <span className="font-bold text-[var(--rt-verdict-clear)]">+0.30</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)]">
                  <span>Stated Time Horizon</span>
                  <span className="font-bold text-[var(--rt-verdict-clear)]">+0.20</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)]">
                  <span>Specific Named Catalyst</span>
                  <span className="font-bold text-[var(--rt-verdict-clear)]">+0.20</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)]">
                  <span>Falsifiable Directional Claim</span>
                  <span className="font-bold text-[var(--rt-verdict-clear)]">+0.15</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)]">
                  <span>Historical Precedent Analogues</span>
                  <span className="font-bold text-[var(--rt-verdict-clear)]">+0.15</span>
                </div>
              </div>
            </div>

            {/* Position Scoring Matrix */}
            <div className="p-6 bg-[var(--rt-surface-base)] border border-[var(--rt-border-subtle)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--rt-border-subtle)] pb-3">
                <h3 className="text-sm font-mono font-bold text-[var(--rt-text-primary)] uppercase">
                  Position Risk Penalties (`scorePosition`)
                </h3>
                <span className="text-xs font-mono text-[var(--rt-text-muted)]">Base = 1.00</span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between p-2 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)]">
                  <span>Expected Shortfall (Tail Loss &gt; 20%)</span>
                  <span className="font-bold text-[var(--rt-verdict-critical)]">-0.40</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)]">
                  <span>Position Sizing (&gt; 25% Account Equity)</span>
                  <span className="font-bold text-[var(--rt-verdict-critical)]">-0.25</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)]">
                  <span>Off-Hours Gap Exposure Fraction</span>
                  <span className="font-bold text-[var(--rt-verdict-critical)]">-0.20</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)]">
                  <span>Hedge Offset Coverage</span>
                  <span className="font-bold text-[var(--rt-verdict-clear)]">+0.15</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gate Rule Banner */}
          <div className="p-6 bg-[var(--rt-surface-void)] text-[var(--rt-surface-raised)] border border-[var(--rt-surface-void)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--rt-text-muted)]/30 pb-3">
              <span className="text-xs font-mono text-[var(--rt-text-muted)] uppercase tracking-wider font-semibold">
                DETERMINISTIC GATE LAW
              </span>
              <span className="text-xs font-mono text-[var(--rt-verdict-clear)]">
                gateVerdict = min(thesisBand, positionBand)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3 bg-[var(--rt-surface-void)] border border-[var(--rt-verdict-critical)] space-y-1">
                <div className="text-[10px] font-mono text-[var(--rt-verdict-critical)] font-bold">STATE 1 • SCORE &lt; 0.35</div>
                <div className="text-sm font-mono font-bold text-[var(--rt-surface-raised)]">REJECT</div>
              </div>
              <div className="p-3 bg-[var(--rt-surface-void)] border border-[var(--rt-text-muted)] space-y-1">
                <div className="text-[10px] font-mono text-[var(--rt-text-muted)] font-bold">STATE 2 • SCORE ≥ 0.35</div>
                <div className="text-sm font-mono font-bold text-[var(--rt-surface-raised)]">WAIT</div>
              </div>
              <div className="p-3 bg-[var(--rt-surface-void)] border border-[var(--rt-verdict-moderate)] space-y-1">
                <div className="text-[10px] font-mono text-[var(--rt-verdict-moderate)] font-bold">STATE 3 • SCORE ≥ 0.60</div>
                <div className="text-sm font-mono font-bold text-[var(--rt-surface-raised)]">REDUCE</div>
              </div>
              <div className="p-3 bg-[var(--rt-surface-void)] border border-[var(--rt-verdict-clear)] space-y-1">
                <div className="text-[10px] font-mono text-[var(--rt-verdict-clear)] font-bold">STATE 4 • SCORE ≥ 0.80</div>
                <div className="text-sm font-mono font-bold text-[var(--rt-surface-raised)]">PROCEED</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Who It Is For */}
      <section className="border-b border-[var(--rt-border-subtle)] py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-[0.2em] text-[var(--rt-text-muted)] uppercase font-semibold">
              04 • TARGET USER
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--rt-text-primary)]">
              Engineered for 24/7 tokenized equity traders.
            </h2>
          </div>

          <div className="p-8 bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] max-w-4xl space-y-6">
            <p className="text-base sm:text-lg text-[var(--rt-text-primary)] leading-relaxed">
              The primary user is a crypto-native retail trader active on Bitget who is beginning to trade tokenized U.S. equities (such as rNVDA) alongside existing crypto exposure in a 24/7 market.
            </p>
            <p className="text-sm sm:text-base text-[var(--rt-text-muted)] leading-relaxed">
              This trader understands basic position sizing and direction, but lacks a disciplined, unified pre-trade system to stress-test basis risk, off-hours liquidity un-anchoring, and thesis invalidation before committing capital.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--rt-border-subtle)]">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-[var(--rt-text-primary)] uppercase">Trading Focus</span>
                <p className="text-xs text-[var(--rt-text-muted)]">Tokenized equities (`rNVDA`, `rTSLA`, `rAAPL`), crypto cross-hedges, and off-hours execution.</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-[var(--rt-text-primary)] uppercase">Decision Protection</span>
                <p className="text-xs text-[var(--rt-text-muted)]">Pre-trade adversarial interrogation, deterministic basis checks, and explicit invalidation thresholds.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Secondary CTA */}
      <section className="py-24 px-6 bg-[var(--rt-surface-raised)]">
        <div className="max-w-6xl mx-auto space-y-8 text-center flex flex-col items-center">
          <div className="relative w-12 h-12 bg-[var(--rt-surface-void)] flex items-center justify-center">
            <Image
              src={BRANDING.LOGOS.MARK}
              alt="Bitget AI RedTeam Desk Mark"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
          </div>

          <div className="space-y-3 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--rt-text-primary)]">
              Stress-test your trade before committing capital.
            </h2>
            <p className="text-sm sm:text-base text-[var(--rt-text-muted)]">
              Enter the RedTeam Desk with the canonical golden-path scenario or input your own tokenized equity trade thesis.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => onLaunchDesk(GOLDEN_PATH_PROMPT)}
              className="w-full sm:w-auto px-8 py-4 bg-[var(--rt-surface-void)] text-[var(--rt-surface-raised)] text-sm font-mono font-bold tracking-wider uppercase hover:opacity-90 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
            >
              <span>Launch Desk with Golden Path</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchDesk()}
              className="w-full sm:w-auto px-8 py-4 bg-[var(--rt-surface-base)] text-[var(--rt-text-primary)] text-sm font-mono font-medium tracking-wider uppercase border border-[var(--rt-border-subtle)] hover:bg-[var(--rt-surface-raised)] transition-colors text-center"
            >
              Enter Custom Thesis
            </button>
          </div>

          <div className="pt-8 text-xs font-mono text-[var(--rt-text-muted)]">
            BITGET AI REDTEAM DESK • ADVERSARIAL PRE-TRADE FIREWALL
          </div>
        </div>
      </section>
    </div>
  );
}
