"use client";

import React, { useState } from "react";

interface TradeInputSurfaceProps {
  initialPrompt?: string;
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  {
    label: "Reference scenario with BTC exposure",
    badge: "Official scenario",
    // Kept verbatim-identical to the embedded fixture statement
    // (src/fixtures/rnvda-demo.ts rnvdaTradeIdea.thesis) so the canonical
    // demo input and the fixture artifact always tell the same story.
    text: "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it."
  },
  {
    label: "Clarification test with missing size",
    badge: "Clarification",
    text: "I want to go long rNVDA before market open because enterprise GPU cluster orders are accelerating."
  },
  {
    label: "Contagion isolation test",
    badge: "Contagion test",
    text: "Buying $5,000 of rNVDA tokenized equity expecting strong compute demand regardless of BTC weekend drift."
  }
];

export function TradeInputSurface({
  initialPrompt = "",
  onSubmit,
  isLoading
}: TradeInputSurfaceProps) {
  const [prompt, setPrompt] = useState(
    initialPrompt || EXAMPLE_PROMPTS[0].text
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt.trim());
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Hero Section */}
      <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="inline-flex items-center gap-2 border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] px-3 py-1 text-xs font-semibold text-[var(--rt-text-primary)]">
          <span className="h-2 w-2 rounded-full bg-[var(--rt-verdict-clear)]" />
          Desk thesis: separate thesis quality from position quality
        </div>

        <div className="max-w-[680px]">
          <h2 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight [text-wrap:balance] text-[var(--rt-text-primary)]">
            Stress test your trade
            <br />
            before entering the market.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--rt-text-muted)] leading-relaxed [text-wrap:pretty]">
            Tokenized equity markets trade around the clock on Bitget, while underlying United States equities trade only during regular exchange hours. Enter your proposed trade to evaluate basis decoupling, off hours liquidity, crypto contagion, and thesis fragility.
          </p>
        </div>
      </div>

      {/* Primary Input Form */}
      <form onSubmit={handleSubmit} className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="trade-input" className="block text-sm font-semibold text-[var(--rt-text-primary)] font-mono">
            Proposed trade and rationale
          </label>
          <span className="text-xs text-[var(--rt-text-muted)] font-mono">Natural language parsed deterministically</span>
        </div>

        <div>
          <textarea
            id="trade-input"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you plan to buy or sell and why..."
            className="w-full border border-[var(--rt-border-subtle)] bg-white p-4 text-base text-[var(--rt-text-primary)] placeholder:text-[var(--rt-text-muted)] focus-visible:border-[var(--rt-text-primary)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:ring-offset-2 motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] resize-y [text-wrap:pretty]"
            disabled={isLoading}
          />
        </div>

        {/* Quick select prompt chips */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-mono font-medium text-[var(--rt-text-muted)]">Quick start scenarios:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(ex.text)}
                className="inline-flex min-h-[44px] items-center gap-1.5 border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] px-3 py-2 text-xs text-[var(--rt-text-primary)] hover:bg-[var(--rt-surface-raised)] hover:text-[var(--rt-text-primary)] active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] text-left focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden"
              >
                <span className="font-mono font-semibold text-[var(--rt-text-primary)]">{ex.badge}:</span>
                <span className="truncate max-w-[200px] sm:max-w-xs">{ex.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 bg-[var(--rt-surface-void)] px-6 py-2.5 text-sm font-mono font-semibold text-white shadow-xs hover:bg-[var(--rt-text-primary)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden"
          >
            {isLoading ? (
              <>
                <span className="h-2 w-2 rounded-full bg-[var(--rt-verdict-clear)] motion-safe:animate-pulse motion-reduce:animate-none" />
                <span>Analyzing trade...</span>
              </>
            ) : (
              <>
                <span>Stress test trade</span>
                <svg className="w-4 h-4 text-[var(--rt-surface-raised)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tagline Reveal Section */}
      <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-6 sm:p-8 shadow-xs">
        <div className="max-w-[680px] space-y-2">
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--rt-text-muted)]">
            Core thesis
          </p>
          <p className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-[var(--rt-text-primary)] [text-wrap:balance]">
            A trader can have a reasonable thesis
            <br />
            and still hold a vulnerable position.
          </p>
          <p className="text-sm text-[var(--rt-text-muted)] [text-wrap:pretty] pt-1 leading-relaxed">
            We isolate fundamental market rationale from off hours execution risk, illiquidity, and basis shocks so you know whether to proceed or wait for regular market hours.
          </p>
        </div>
      </div>
    </div>
  );
}


