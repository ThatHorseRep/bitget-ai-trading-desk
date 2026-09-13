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
    text: "I am thinking about buying $2,000 of rNVDA before Monday because AI infrastructure demand still looks strong. I already have $10,000 of BTC exposure. Stress test this trade."
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
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Desk thesis: separate thesis quality from position quality
        </div>

        <div className="max-w-[680px]">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight [text-wrap:balance] bg-clip-text text-transparent bg-gradient-to-r from-black to-zinc-600">
            Stress test your trade
            <br />
            before entering the market.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed [text-wrap:pretty]">
            Tokenized equity markets trade around the clock on Bitget, while underlying United States equities trade only during regular exchange hours. Enter your proposed trade to evaluate basis decoupling, off hours liquidity, crypto contagion, and thesis fragility.
          </p>
        </div>
      </div>

      {/* Primary Input Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="trade-input" className="block text-sm font-semibold text-zinc-900">
            Proposed trade and rationale
          </label>
          <span className="text-xs text-zinc-400">Natural language parsed deterministically</span>
        </div>

        <div>
          <textarea
            id="trade-input"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you plan to buy or sell and why..."
            className="w-full rounded-xl border border-zinc-300 p-4 text-sm sm:text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-900 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] resize-y [text-wrap:pretty]"
            disabled={isLoading}
          />
        </div>

        {/* Quick select prompt chips */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-medium text-zinc-500">Quick start scenarios:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(ex.text)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] text-left focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
              >
                <span className="font-semibold text-zinc-900">{ex.badge}:</span>
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-base font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing trade...</span>
              </>
            ) : (
              <>
                <span>Stress test trade</span>
                <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tagline Reveal Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="max-w-[680px] space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Core thesis
          </p>
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 [text-wrap:balance]">
            A trader can have a reasonable thesis
            <br />
            and still hold a vulnerable position.
          </p>
          <p className="text-sm text-zinc-600 [text-wrap:pretty] pt-1">
            We isolate fundamental market rationale from off hours execution risk, illiquidity, and basis shocks so you know whether to proceed or wait for regular market hours.
          </p>
        </div>
      </div>
    </div>
  );
}


