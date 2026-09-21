import React from "react";
import Image from "next/image";
import { BRANDING } from "@/config/branding";
import { Reveal } from "@/components/motion/Reveal";

interface LandingSurfaceProps {
  onLaunchDesk: (initialPrompt?: string) => void;
}

const GOLDEN_PATH_PROMPT =
  "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it.";

export function LandingSurface({ onLaunchDesk }: LandingSurfaceProps) {
  return (
    <div className="w-full bg-[var(--rt-surface-base)] text-[var(--rt-text-primary)] font-sans selection:bg-[var(--rt-surface-void)] selection:text-[var(--rt-surface-raised)]">
      {/* Top Header Navigation matching 05-website.svg */}
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

          {/* Navigation Links matching 05-website.svg */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-semibold text-[var(--rt-text-muted)] uppercase tracking-wider">
            <a href="#how-it-works" className="hover:text-[var(--rt-text-primary)] transition-colors">HOW IT WORKS</a>
            <a href="#verdict-system" className="hover:text-[var(--rt-text-primary)] transition-colors">VERDICTS</a>
            <a href="#architecture" className="hover:text-[var(--rt-text-primary)] transition-colors">ARCHITECTURE</a>
            <a href="#target-user" className="hover:text-[var(--rt-text-primary)] transition-colors">SPECIFICATION</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onLaunchDesk(GOLDEN_PATH_PROMPT)}
              className="px-5 py-2.5 bg-[var(--rt-surface-void)] text-[var(--rt-surface-raised)] text-xs font-mono font-bold tracking-wider uppercase hover:opacity-90 active:scale-95 transition-all border border-[var(--rt-surface-void)] shadow-xs"
            >
              RUN DESK →
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1: Dark Full-Bleed Hero matching 05-website.svg */}
      <section className="relative overflow-hidden bg-[#0E2436] text-[#EDEFEC] py-20 px-6 border-b border-[#2A3B49]">
        {/* Background Watermark matching 05-website.svg */}
        <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
          <Image
            src={BRANDING.LOGOS.MARK}
            alt="Watermark"
            width={480}
            height={480}
            className="w-[480px] h-[480px] object-contain"
          />
        </div>

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A3043] border border-[#2B4459] text-[11px] font-mono text-[#9DB0BF] uppercase tracking-wider">
            <span className="font-bold text-[#EDEFEC]">ADVERSARIAL RISK FIREWALL</span>
            <span>•</span>
            <span>TOKENIZED EQUITIES PRE-TRADE</span>
          </div>

          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#EDEFEC] leading-[1.08] uppercase">
              THIS IS NOT A COPILOT.<br />
              <span className="text-[#C8102E]">THIS IS AN ADVERSARY.</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#9DB0BF] leading-relaxed max-w-3xl">
              An adversarial pre-trade risk workbench for tokenized equities. It stress-tests basis decoupling, liquidity cliffs, and thesis invalidation before you commit capital.
            </p>
          </div>

          {/* Action CTA Row matching 05-website.svg */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onLaunchDesk(GOLDEN_PATH_PROMPT)}
              className="px-8 py-4 bg-[#C8102E] text-white text-sm font-mono font-bold tracking-wider uppercase hover:bg-[#b00e28] active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-xs"
            >
              <span>RUN GOLDEN PATH DESK</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchDesk()}
              className="px-8 py-4 bg-transparent text-[#EDEFEC] text-sm font-mono font-medium tracking-wider uppercase border border-[#3A5266] hover:bg-[#1A3043] transition-colors text-center"
            >
              OPEN BLANK WORKBENCH
            </button>
          </div>

          {/* Pre-loaded Golden Path Prompt Banner */}
          <div className="p-4 bg-[#142A3C] border border-[#2B4459] font-mono text-xs text-[#9DB0BF] leading-relaxed max-w-3xl flex items-start gap-3">
            <span className="px-2 py-0.5 bg-[#C8102E] text-white text-[10px] font-bold shrink-0 uppercase">GOLDEN PATH</span>
            <span>&ldquo;{GOLDEN_PATH_PROMPT}&rdquo;</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: 4 Verdict Bands System Row matching 05-website.svg */}
      <section id="verdict-system" className="border-b border-[var(--rt-border-subtle)] py-16 px-6 bg-[var(--rt-surface-base)]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-[0.2em] text-[var(--rt-text-muted)] uppercase font-semibold">
              DETERMINISTIC VERDICT BANDS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--rt-text-primary)]">
              Automated policy gates evaluated on every trade.
            </h2>
          </div>

          {/* 4 Cards Row matching 05-website.svg with top 3px colored indicator bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* PROCEED Card */}
            <div className="bg-white border border-[var(--rt-border-subtle)] overflow-hidden shadow-xs relative flex flex-col justify-between p-5 space-y-4">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0E9F8B]" />
              <div className="space-y-2 pt-1">
                <div className="text-xs font-mono font-bold text-[#0E9F8B] uppercase tracking-wider flex items-center justify-between">
                  <span>STATE 4</span>
                  <span>SCORE ≥ 0.80</span>
                </div>
                <h3 className="text-xl font-mono font-black text-[var(--rt-text-primary)]">PROCEED</h3>
                <p className="text-xs text-[var(--rt-text-muted)] leading-relaxed">
                  Clear execution runway. Basis within parameters, thesis fully falsifiable, risk within account limit.
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--rt-border-subtle)] text-[10px] font-mono text-[var(--rt-text-muted)] uppercase">
                Gated Policy: Green
              </div>
            </div>

            {/* REDUCE Card */}
            <div className="bg-white border border-[var(--rt-border-subtle)] overflow-hidden shadow-xs relative flex flex-col justify-between p-5 space-y-4">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#C98A14]" />
              <div className="space-y-2 pt-1">
                <div className="text-xs font-mono font-bold text-[#C98A14] uppercase tracking-wider flex items-center justify-between">
                  <span>STATE 3</span>
                  <span>SCORE ≥ 0.60</span>
                </div>
                <h3 className="text-xl font-mono font-black text-[var(--rt-text-primary)]">REDUCE</h3>
                <p className="text-xs text-[var(--rt-text-muted)] leading-relaxed">
                  Basis risk elevated. Trim notional position size by 40% or hedge crypto contagion drag.
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--rt-border-subtle)] text-[10px] font-mono text-[var(--rt-text-muted)] uppercase">
                Gated Policy: Warning
              </div>
            </div>

            {/* WAIT Card */}
            <div className="bg-white border border-[var(--rt-border-subtle)] overflow-hidden shadow-xs relative flex flex-col justify-between p-5 space-y-4">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#54697E]" />
              <div className="space-y-2 pt-1">
                <div className="text-xs font-mono font-bold text-[#54697E] uppercase tracking-wider flex items-center justify-between">
                  <span>STATE 2</span>
                  <span>SCORE ≥ 0.35</span>
                </div>
                <h3 className="text-xl font-mono font-black text-[var(--rt-text-primary)]">WAIT</h3>
                <p className="text-xs text-[var(--rt-text-muted)] leading-relaxed">
                  Off-hours market close or un-anchored basis drift. Defer execution until cash open at 09:30 ET.
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--rt-border-subtle)] text-[10px] font-mono text-[var(--rt-text-muted)] uppercase">
                Gated Policy: Deferral
              </div>
            </div>

            {/* REJECT Card */}
            <div className="bg-white border border-[var(--rt-border-subtle)] overflow-hidden shadow-xs relative flex flex-col justify-between p-5 space-y-4">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#C8102E]" />
              <div className="space-y-2 pt-1">
                <div className="text-xs font-mono font-bold text-[#C8102E] uppercase tracking-wider flex items-center justify-between">
                  <span>STATE 1</span>
                  <span>SCORE &lt; 0.35</span>
                </div>
                <h3 className="text-xl font-mono font-black text-[var(--rt-text-primary)]">REJECT</h3>
                <p className="text-xs text-[var(--rt-text-muted)] leading-relaxed">
                  Critical tail risk or unfalsifiable thesis. Position blocked from trade execution.
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--rt-border-subtle)] text-[10px] font-mono text-[var(--rt-text-muted)] uppercase">
                Gated Policy: Blocked
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Structural Vulnerability */}
      <Reveal as="section" id="how-it-works" className="border-b border-[var(--rt-border-subtle)] py-20 px-6 bg-[var(--rt-surface-raised)]">
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
      </Reveal>

      {/* SECTION 4: Architecture & Seven Verifiable Pipeline Stages */}
      <Reveal as="section" id="architecture" className="border-b border-[var(--rt-border-subtle)] py-20 px-6">
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
      </Reveal>

      {/* SECTION 5: Target User Specification */}
      <Reveal as="section" id="target-user" className="border-b border-[var(--rt-border-subtle)] py-20 px-6 bg-[var(--rt-surface-raised)]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-[0.2em] text-[var(--rt-text-muted)] uppercase font-semibold">
              03 • TARGET USER SPECIFICATION
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--rt-text-primary)]">
              Engineered for 24/7 tokenized equity traders.
            </h2>
          </div>

          <div className="p-8 bg-[var(--rt-surface-base)] border border-[var(--rt-border-subtle)] max-w-4xl space-y-6">
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
      </Reveal>

      {/* SECTION 6: Secondary CTA */}
      <Reveal as="section" className="py-24 px-6 bg-[var(--rt-surface-raised)]">
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
              className="w-full sm:w-auto px-8 py-4 bg-[#C8102E] text-white text-sm font-mono font-bold tracking-wider uppercase hover:bg-[#b00e28] active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-xs"
            >
              <span>RUN GOLDEN PATH DESK</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchDesk()}
              className="w-full sm:w-auto px-8 py-4 bg-[var(--rt-surface-base)] text-[var(--rt-text-primary)] text-sm font-mono font-medium tracking-wider uppercase border border-[var(--rt-border-subtle)] hover:bg-[var(--rt-surface-raised)] transition-colors text-center"
            >
              ENTER CUSTOM THESIS
            </button>
          </div>

          <div className="pt-8 text-xs font-mono text-[var(--rt-text-muted)]">
            BITGET AI REDTEAM DESK • ADVERSARIAL PRE-TRADE FIREWALL
          </div>
        </div>
      </Reveal>
    </div>
  );
}
