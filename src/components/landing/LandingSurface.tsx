"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import { BRANDING, type Verdict } from "@/config/branding";
import { Reveal } from "@/components/motion/Reveal";
import { Lockup } from "@/components/brand/Logo";
import { VerdictGlyph } from "@/components/brand/VerdictGlyph";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  getCalibratedBatch,
  getEpochRemainingSeconds,
  getEpochBatchIndex,
  CYCLE_SECONDS
} from "@/lib/calibratedPrompts";

interface LandingSurfaceProps {
  onLaunchDesk: (initialPrompt?: string) => void;
}

const GOLDEN_PATH_PROMPT =
  "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it.";

const emptySubscribe = () => () => {};

const VERDICT_THEME_COLOR: Record<Verdict, string> = {
  PROCEED: "var(--rtd-proceed)",
  REDUCE: "var(--rtd-reduce)",
  WAIT: "var(--rtd-wait)",
  REJECT: "var(--rtd-reject)",
};

export function LandingSurface({ onLaunchDesk }: LandingSurfaceProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [ttlSeconds, setTtlSeconds] = useState(CYCLE_SECONDS);
  const [batchIndex, setBatchIndex] = useState(0);
  const [isRecalibrating, setIsRecalibrating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getEpochRemainingSeconds();
      setTtlSeconds(remaining);

      // Trigger automatic prompt rotation on 15-minute epoch cycle boundary
      if (remaining === CYCLE_SECONDS) {
        setIsRecalibrating(true);
        setBatchIndex(getEpochBatchIndex());
        setTimeout(() => setIsRecalibrating(false), 1200);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleManualCycle = () => {
    setIsRecalibrating(true);
    setBatchIndex((prev) => (prev + 1) % 3);
    setTimeout(() => setIsRecalibrating(false), 600);
  };

  const formatTtl = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeBatch = getCalibratedBatch(batchIndex);
  const calibratedPrompts = activeBatch.prompts;

  return (
    <div className="w-full bg-[var(--rtd-proof)] text-[var(--rtd-ink)] font-sans selection:bg-[var(--rtd-ink)] selection:text-[var(--rtd-paper)] min-h-screen">
      {/* ----------------------------------------------------------------------
          1. TOP NAVIGATION BAR (matching 05-website.png)
          Height explicitly set to 4rem (h-16) to ensure viewport math is exact.
         ---------------------------------------------------------------------- */}
      <header className="h-16 border-b border-[var(--rtd-steel)]/25 bg-[var(--rtd-proof)] sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand lockup left */}
          <div className="flex items-center gap-3">
            <Lockup height={28} />
          </div>

          {/* Desktop Nav Links center-right */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold text-[var(--rtd-steel)] uppercase tracking-wider">
            <a
              href="#how-it-works"
              className="hover:text-[var(--rtd-ink)] transition-colors py-2"
            >
              How it works
            </a>
            <a
              href="#the-65-5h-window"
              className="hover:text-[var(--rtd-ink)] transition-colors py-2"
            >
              The 65.5h window
            </a>
            <a
              href="#method"
              className="hover:text-[var(--rtd-ink)] transition-colors py-2"
            >
              Method
            </a>
          </nav>

          {/* Desktop Run a test button and Theme Toggle far right */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => onLaunchDesk()}
              className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-mono font-bold tracking-wider uppercase active:scale-95 transition-all shadow-xs cursor-pointer border border-transparent dark:border-slate-300"
            >
              Run a test
            </button>
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => onLaunchDesk()}
              className="min-h-[44px] px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-mono font-bold tracking-wider uppercase active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-transparent dark:border-slate-300"
            >
              Run test
            </button>
            <button
              type="button"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-[var(--rtd-steel)]/30 text-[var(--rtd-ink)] hover:bg-[var(--rtd-paper)] transition-colors font-mono text-base cursor-pointer"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--rtd-steel)]/25 bg-[var(--rtd-proof)] px-4 sm:px-6 py-4 space-y-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--rtd-steel)] shadow-lg">
            <div>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center py-2 hover:text-[var(--rtd-ink)] active:bg-[var(--rtd-steel)]/10 px-2"
              >
                How it works
              </a>
            </div>
            <div>
              <a
                href="#the-65-5h-window"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center py-2 hover:text-[var(--rtd-ink)] active:bg-[var(--rtd-steel)]/10 px-2"
              >
                The 65.5h window
              </a>
            </div>
            <div>
              <a
                href="#method"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center py-2 hover:text-[var(--rtd-ink)] active:bg-[var(--rtd-steel)]/10 px-2"
              >
                Method
              </a>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchDesk();
                }}
                className="min-h-[44px] w-full py-3 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-mono font-bold tracking-wider uppercase active:scale-95 transition-all text-center flex items-center justify-center cursor-pointer shadow-xs border border-transparent dark:border-slate-300"
              >
                Run a test →
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ----------------------------------------------------------------------
          2. HERO SECTION (matching 05-website.png)
         ---------------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-[var(--rtd-void)] text-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 border-b border-[var(--rtd-steel)]/30">
        {/* Subtle Watermark Mark from 05-website.png */}
        <div className="absolute right-[-60px] top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none hidden lg:block select-none">
          <Image
            src={BRANDING.LOGOS.MARK}
            alt="RedTeam Mark Watermark"
            width={580}
            height={580}
            className="w-[580px] h-[580px] object-contain"
            priority
          />
        </div>

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 text-[11px] font-mono text-slate-300 uppercase tracking-[0.16em]">
            <span className="font-bold text-white">PRE-TRADE ADVERSARIAL FIREWALL</span>
            <span>•</span>
            <span>TOKENIZED EQUITIES RISK ENGINE</span>
          </div>

          {/* Headline "Thesis ≠ Position." matching 05-website.png */}
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-4xl sm:6xl md:text-7xl font-mono font-black tracking-tight text-white leading-[1.05] uppercase">
              Thesis{" "}
              {/* The fault-cut Not-Equal glyph (two white horizontal bars with red diagonal shear) */}
              <span className="inline-flex items-center justify-center align-middle mx-1 sm:mx-2 h-[0.75em] w-[0.75em] relative select-none">
                <span className="absolute top-[26%] left-0 right-0 h-[12%] bg-white" />
                <span className="absolute bottom-[26%] left-0 right-0 h-[12%] bg-white" />
                <span className="absolute inset-y-0 w-[14%] bg-[var(--rtd-stamp)] transform -rotate-[22deg] left-[43%]" />
              </span>{" "}
              Position.
            </h1>

            <p className="text-base sm:text-xl text-slate-300 leading-relaxed max-w-2xl font-sans">
              Tokenized US equities trade 65.5 hours after NYSE closes. Over that window, the token un-anchors from the asset. The RedTeam Desk stresses your trade before the market does.
            </p>
          </div>

          {/* Two CTA Buttons:
              1. Primary: "Stress a trade" (clean slate input)
              2. Secondary: "See a sample run" (loads golden path sample) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => onLaunchDesk()}
              className="px-8 py-4 bg-[var(--rtd-stamp)] text-white text-sm font-mono font-bold tracking-wider uppercase hover:brightness-110 active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Stress a trade</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchDesk(GOLDEN_PATH_PROMPT)}
              className="px-8 py-4 bg-transparent text-white text-sm font-mono font-medium tracking-wider uppercase border border-white/30 hover:bg-white/10 hover:border-white/60 transition-all text-center cursor-pointer"
            >
              See a sample run
            </button>
          </div>

          {/* Fault-line device under CTA buttons (using the .rtd-fault CSS class) */}
          <div className="pt-4 pb-2">
            <div className="rtd-fault" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          3. FOUR OUTCOMES LIGHT SECTION (matching 05-website.png)
          "Four outcomes. The mark moves with the risk."
          4 cards, one per verdict (PROCEED / REDUCE / WAIT / REJECT)
          Stack to 1 column on mobile, 2 columns on tablet, 4 columns on desktop.
         ---------------------------------------------------------------------- */}
      <section id="verdict-scale" className="scroll-mt-24 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-[var(--rtd-proof)] border-b border-[var(--rtd-steel)]/25">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Section Header with Live Calibrated Status */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs tracking-[0.2em] text-[var(--rtd-steel)] uppercase font-semibold">
                  DETERMINISTIC VERDICT SCALE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] uppercase font-bold flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--rtd-proceed)] animate-pulse" />
                  LIVE CALIBRATED PROMPTS
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-[var(--rtd-ink)]">
                Four outcomes. The mark moves with the risk.
              </h2>
              <p className="text-sm sm:text-base text-[var(--rtd-steel)] font-sans leading-relaxed">
                Displacement is a parameter, not a drawing. Each outcome is pre-flight calibrated with a usable prompt tested against deterministic gating thresholds.
              </p>
            </div>

            <div className="text-left md:text-right shrink-0 font-mono text-xs text-[var(--rtd-steel)] space-y-1.5 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 px-4 py-2.5 shadow-xs">
              <div className="flex items-center justify-between md:justify-end gap-3">
                <span className="text-[10px] uppercase tracking-wider text-[var(--rtd-steel)]">CALIBRATION TTL</span>
                <button
                  type="button"
                  onClick={handleManualCycle}
                  title="Force re-calibration to next asset batch"
                  className="text-[10px] font-mono font-bold text-[var(--rtd-ink)] hover:text-[var(--rtd-proceed)] underline uppercase cursor-pointer"
                >
                  CYCLE ↻
                </button>
              </div>
              <div
                className="text-base font-bold text-[var(--rtd-ink)] rtd-figure flex items-center md:justify-end gap-1.5"
                suppressHydrationWarning
              >
                <span className={`w-2 h-2 rounded-full ${isRecalibrating ? "bg-[var(--rtd-reduce)] animate-ping" : "bg-[var(--rtd-proceed)]"}`} />
                <span suppressHydrationWarning>{formatTtl(ttlSeconds)}</span>
                <span className="text-[11px] font-normal text-[var(--rtd-steel)]">REMAINING</span>
              </div>
              <div className="text-[10px] text-[var(--rtd-steel)]" suppressHydrationWarning>
                ACTIVE: <span className="font-bold text-[var(--rtd-ink)]">{mounted ? activeBatch.assetSymbol : "rNVDA"}</span> • {mounted ? activeBatch.theme : "AI Semiconductor & Cloud Capex"}
              </div>
            </div>
          </div>

          {/* 4 Outcome Cards Grid: 1 col on mobile (<640px), 2 cols on tablet (>=640px), 4 cols on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {calibratedPrompts.map((item) => (
              <div
                key={item.id}
                className="bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 p-5 space-y-5 flex flex-col justify-between hover:border-[var(--rtd-ink)]/50 transition-colors relative overflow-hidden group h-full shadow-xs"
              >
                {/* Top colored indicator bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: VERDICT_THEME_COLOR[item.verdict] }}
                />

                <div className="space-y-4 pt-1">
                  {/* Card Header matching 05-website.png / image.png: State + Score + Glyph */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 font-mono">
                      <div
                        className="text-xs font-black tracking-wider uppercase"
                        style={{ color: VERDICT_THEME_COLOR[item.verdict] }}
                      >
                        {item.stateLabel}
                      </div>
                      <div className="text-[11px] text-[var(--rtd-steel)] font-semibold">
                        {item.scoreLabel}
                      </div>
                    </div>

                    <div className="p-1.5 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/20 shrink-0">
                      <VerdictGlyph verdict={item.verdict} size={36} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-2xl font-mono font-black tracking-tight"
                        style={{ color: VERDICT_THEME_COLOR[item.verdict] }}
                      >
                        {item.verdict}
                      </h3>
                      <span
                        className="font-mono text-lg font-bold"
                        style={{ color: VERDICT_THEME_COLOR[item.verdict] }}
                      >
                        →
                      </span>
                    </div>
                    <p className="text-xs font-sans text-[var(--rtd-steel)] mt-1.5 leading-relaxed min-h-[3.6rem] line-clamp-3">
                      {item.summary}
                    </p>
                  </div>

                  {/* Usable Calibrated Prompt Box - Fixed uniform height across all 4 cards */}
                  <div className="bg-[var(--rtd-proof)] border border-[var(--rtd-steel)]/20 p-3 space-y-2 text-left h-[7.5rem] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--rtd-steel)] uppercase font-semibold">
                      <span className="tracking-wide">USEABLE PROMPT</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(item.id, item.prompt, e)}
                        className="px-2 py-0.5 border border-[var(--rtd-steel)]/30 hover:bg-[var(--rtd-paper)] text-[var(--rtd-ink)] font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
                      >
                        {copiedId === item.id ? "COPIED ✓" : "COPY"}
                      </button>
                    </div>

                    <p className="text-[11px] font-mono text-[var(--rtd-ink)] leading-relaxed select-all line-clamp-3">
                      &ldquo;{item.prompt}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Gated Policy on left, Test action button on right - strictly non-wrapping */}
                <div className="pt-3 border-t border-[var(--rtd-steel)]/15 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: VERDICT_THEME_COLOR[item.verdict] }}
                    />
                    <span className="text-[10px] font-mono uppercase font-bold text-[var(--rtd-steel)] tracking-wider whitespace-nowrap">
                      {item.policyGate}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onLaunchDesk(item.prompt)}
                    className="min-h-[36px] px-2 py-1 flex items-center gap-1 text-xs font-mono uppercase font-bold tracking-wider hover:brightness-125 transition-all cursor-pointer whitespace-nowrap shrink-0 group-hover:translate-x-0.5"
                    style={{ color: VERDICT_THEME_COLOR[item.verdict] }}
                  >
                    <span>TEST {item.verdict} →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          4. HOW IT WORKS / STRUCTURAL VULNERABILITY (Section #how-it-works)
         ---------------------------------------------------------------------- */}
      <Reveal as="section" id="how-it-works" className="scroll-mt-24 border-b border-[var(--rtd-steel)]/25 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-[var(--rtd-paper)]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-[0.2em] text-[var(--rtd-steel)] uppercase font-semibold">
              01 • STRUCTURAL VULNERABILITY
            </span>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--rtd-ink)]">
              Off-hours dislocation on tokenized equities.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 space-y-3 shadow-xs">
              <div className="text-xs font-mono font-bold text-[var(--rtd-reject)] uppercase">
                65.5-Hour Liquidity Void
              </div>
              <h3 className="text-base font-bold text-[var(--rtd-ink)]">
                Un-Anchored Basis Drift
              </h3>
              <p className="text-sm text-[var(--rtd-steel)] leading-relaxed font-sans">
                When US cash equity markets close from Friday 16:00 ET to Monday 09:30 ET, tokenized equities trade 24/7 on isolated crypto orderbooks without primary market maker arbitrage.
              </p>
            </div>

            <div className="p-6 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 space-y-3 shadow-xs">
              <div className="text-xs font-mono font-bold text-[var(--rtd-reduce)] uppercase">
                Contagion Spillover
              </div>
              <h3 className="text-base font-bold text-[var(--rtd-ink)]">
                Crypto Correlation Drag
              </h3>
              <p className="text-sm text-[var(--rtd-steel)] leading-relaxed font-sans">
                Off-hours equity tokens inherit weekend crypto volatility. A Saturday BTC liquidation cascade drags tokenized tech equities downward regardless of underlying corporate health.
              </p>
            </div>

            <div className="p-6 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 space-y-3 shadow-xs">
              <div className="text-xs font-mono font-bold text-[var(--rtd-wait)] uppercase">
                Monday Open Snap
              </div>
              <h3 className="text-base font-bold text-[var(--rtd-ink)]">
                Basis Premium Collapse
              </h3>
              <p className="text-sm text-[var(--rtd-steel)] leading-relaxed font-sans">
                Traders buying tokens at a +2.5% weekend premium face immediate structural loss when the token realigns violently to the cash equity open price at 09:30 ET.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------------
          5. THE 65.5H WINDOW (Section #the-65-5h-window)
         ---------------------------------------------------------------------- */}
      <Reveal as="section" id="the-65-5h-window" className="scroll-mt-24 border-b border-[var(--rtd-steel)]/25 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-[var(--rtd-proof)]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-[0.2em] text-[var(--rtd-steel)] uppercase font-semibold">
              02 • THE 65.5-HOUR WINDOW
            </span>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--rtd-ink)]">
              Why the basis decoupling happens.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Card: Core Metrics & Explanation */}
            <div className="p-8 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 space-y-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 pb-6 border-b border-[var(--rtd-steel)]/20 font-mono text-center">
                  <div className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-bold text-[var(--rtd-ink)] rtd-figure">65.5h</span>
                    <p className="text-[10px] sm:text-[11px] text-[var(--rtd-steel)] uppercase tracking-wider">Weekly Cash Closure</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-bold text-[var(--rtd-reduce)] rtd-figure">±3.8%</span>
                    <p className="text-[10px] sm:text-[11px] text-[var(--rtd-steel)] uppercase tracking-wider">Basis Drift Range</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-bold text-[var(--rtd-proceed)] rtd-figure">0.00s</span>
                    <p className="text-[10px] sm:text-[11px] text-[var(--rtd-steel)] uppercase tracking-wider">Gate Speed</p>
                  </div>
                </div>

                <div className="space-y-3 font-sans">
                  <h3 className="text-base font-bold text-[var(--rtd-ink)] font-mono uppercase tracking-wide">
                    Institutional Liquidity Halt
                  </h3>
                  <p className="text-sm sm:text-base text-[var(--rtd-ink)] leading-relaxed">
                    Traditional US equities pause on Friday at 16:00 ET. On Bitget and decentralized venues, tokenized wrappers continue trading 24/7 without primary market maker arbitrage.
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--rtd-steel)] leading-relaxed">
                    Retail order flow drives unhedged premiums during the weekend. When cash markets reopen Monday at 09:30 ET, tokens violently snap back to true NAV, triggering abrupt liquidation cascades for off-hours buyers.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--rtd-steel)]/15 font-mono text-xs text-[var(--rtd-steel)] flex items-center justify-between">
                <span>REFERENCE ARBITRAGE</span>
                <span className="font-bold text-[var(--rtd-ink)]">NYSE • NASDAQ • BITGET</span>
              </div>
            </div>

            {/* Right Card: Chronological Decoupling Timeline */}
            <div className="p-8 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 space-y-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--rtd-steel)]/20">
                  <span className="text-xs font-mono font-bold tracking-wider text-[var(--rtd-ink)] uppercase">
                    Off-Hours Decoupling Mechanics
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--rtd-proof)] text-[var(--rtd-ink)] uppercase font-semibold">
                    STRUCTURAL RISK
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex gap-4">
                    <div className="font-mono text-xs font-bold text-[var(--rtd-steel)] shrink-0 w-24">
                      FRI 16:00 ET
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-bold text-[var(--rtd-ink)]">Cash Market Bell</div>
                      <p className="text-xs text-[var(--rtd-steel)]">
                        Primary exchanges halt trading. Institutional designated market makers withdraw quoting algorithms.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="font-mono text-xs font-bold text-[var(--rtd-reduce)] shrink-0 w-24">
                      SAT • SUN
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-bold text-[var(--rtd-reduce)]">65.5h Liquidity Void</div>
                      <p className="text-xs text-[var(--rtd-steel)]">
                        Wrappers trade on isolated books. Token inherits crypto beta drag and un-anchored speculative drift.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="font-mono text-xs font-bold text-[var(--rtd-reject)] shrink-0 w-24">
                      MON 09:30 ET
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-bold text-[var(--rtd-reject)]">Cash Open Snap</div>
                      <p className="text-xs text-[var(--rtd-steel)]">
                        Token re-pegs violently to underlying equity cash open price, eliminating off-hours basis spreads.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--rtd-steel)]/15">
                <div className="p-3 bg-[var(--rtd-proof)] border border-[var(--rtd-steel)]/20 flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[var(--rtd-ink)]">REDTEAM DESK DEFENSE:</span>
                  <span className="font-bold text-[var(--rtd-proceed)]">AUTOMATIC SIZE THROTTLING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------------
          6. METHOD & PIPELINE (Section #method)
         ---------------------------------------------------------------------- */}
      <Reveal as="section" id="method" className="scroll-mt-24 border-b border-[var(--rtd-steel)]/25 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-[var(--rtd-paper)]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-[0.2em] text-[var(--rtd-steel)] uppercase font-semibold">
              03 • EXECUTION METHOD
            </span>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--rtd-ink)]">
              Seven verifiable pipeline stages.
            </h2>
            <p className="text-sm text-[var(--rtd-steel)] max-w-2xl font-sans">
              Each trade idea passes sequentially through deterministic parsers, empirical price feeds, scenario shock engines, and gated decision policies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rtd-steel)]">
                <span className="font-bold text-[var(--rtd-ink)]">STAGE 1</span>
                <span>S01 / S02</span>
              </div>
              <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
                Trade Input &amp; Natural Language Parsing
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rtd-steel)] leading-relaxed font-sans">
                Normalizes free-text trade ideas into structured asset, direction, notional size, and thesis claims via deterministic grammar extractors.
              </p>
            </div>

            <div className="p-5 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rtd-steel)]">
                <span className="font-bold text-[var(--rtd-ink)]">STAGE 2</span>
                <span>S04 STREAM</span>
              </div>
              <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
                Live Price &amp; Market State Reconstruction
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rtd-steel)] leading-relaxed font-sans">
                Queries token orderbook depth, NASDAQ cash reference pricing, basis spread deviation, and active trading session classification.
              </p>
            </div>

            <div className="p-5 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rtd-steel)]">
                <span className="font-bold text-[var(--rtd-ink)]">STAGE 3</span>
                <span>ARBITRATION</span>
              </div>
              <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
                Evidence Gathering &amp; Arbitration
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rtd-steel)] leading-relaxed font-sans">
                Retrieves empirical market observations, corporate fundamentals, and macro indicators, arbitrating conflicts into verifiable fact nodes.
              </p>
            </div>

            <div className="p-5 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rtd-steel)]">
                <span className="font-bold text-[var(--rtd-ink)]">STAGE 4</span>
                <span>ADVERSARIAL CORE</span>
              </div>
              <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
                Thesis Deconstruction &amp; Adversarial Challenge
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rtd-steel)] leading-relaxed font-sans">
                Attacks vulnerable assumptions, checks invalidation criteria, examines semiconductor supply chains, and synthesizes counter-theses.
              </p>
            </div>

            <div className="p-5 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rtd-steel)]">
                <span className="font-bold text-[var(--rtd-ink)]">STAGE 5</span>
                <span>MATHEMATICAL SHOCK</span>
              </div>
              <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
                Deterministic Quantitative Stress Testing
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rtd-steel)] leading-relaxed font-sans">
                Calculates exact dollar P&amp;L impact across 4 stress scenarios: Market Gap (-5%), Crypto Contagion (-8%), Token Illiquidity (+3%), and Combined Shock (-12%).
              </p>
            </div>

            <div className="p-5 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rtd-steel)]">
                <span className="font-bold text-[var(--rtd-ink)]">STAGE 6</span>
                <span>POLICY GATING</span>
              </div>
              <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
                Policy Verdict &amp; Thesis vs. Position Deconstruction
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rtd-steel)] leading-relaxed font-sans">
                Applies deterministic decision policy rules, mathematically separating thesis validity from execution timing and structural fragility.
              </p>
            </div>

            <div className="p-5 bg-[var(--rtd-paper-subtle)] border border-[var(--rtd-steel)]/25 space-y-2 shadow-xs md:col-span-2">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--rtd-steel)]">
                <span className="font-bold text-[var(--rtd-ink)]">STAGE 7</span>
                <span>DECISION READY &amp; AUDIT</span>
              </div>
              <h3 className="text-base font-mono font-bold text-[var(--rtd-ink)]">
                Provenance Graph Assembly
              </h3>
              <p className="text-xs sm:text-sm text-[var(--rtd-steel)] leading-relaxed font-sans">
                Compiles the complete Decision Artifact with interactive audit trails linking claims to observed prices, mathematical formulas, and scenario parameters.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ----------------------------------------------------------------------
          7. BOTTOM SECONDARY CTA (matching 05-website.png)
         ---------------------------------------------------------------------- */}
      <Reveal as="section" className="py-20 sm:py-24 px-4 sm:px-6 bg-[var(--rtd-proof)]">
        <div className="max-w-6xl mx-auto space-y-8 text-center flex flex-col items-center">
          <div className="p-3 bg-[var(--rtd-void)] border border-[var(--rtd-steel)]/30 shadow-xs">
            <Lockup height={32} reversed />
          </div>

          <div className="space-y-3 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-[var(--rtd-ink)]">
              Stress-test your trade before committing capital.
            </h2>
            <p className="text-sm sm:text-base text-[var(--rtd-steel)] font-sans">
              Enter the RedTeam Desk with the canonical golden-path scenario or input your own tokenized equity trade thesis.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => onLaunchDesk(GOLDEN_PATH_PROMPT)}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-sm font-mono font-bold tracking-wider uppercase active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-xs cursor-pointer border border-transparent dark:border-slate-300"
            >
              <span>RUN GOLDEN PATH DESK</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchDesk()}
              className="w-full sm:w-auto px-8 py-4 bg-[var(--rtd-paper)] text-[var(--rtd-ink)] text-sm font-mono font-medium tracking-wider uppercase border border-[var(--rtd-steel)]/30 hover:bg-[var(--rtd-paper-subtle)] transition-colors text-center cursor-pointer"
            >
              ENTER CUSTOM THESIS
            </button>
          </div>

          <div className="pt-8 text-xs font-mono text-[var(--rtd-steel)] uppercase tracking-wider">
            BITGET AI REDTEAM DESK • ADVERSARIAL PRE-TRADE FIREWALL
          </div>
        </div>
      </Reveal>
    </div>
  );
}
