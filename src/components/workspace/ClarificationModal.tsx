"use client";

import React, { useState } from "react";
import type { ParsedTradeResult } from "../../core/trade/parser";

interface ClarificationModalProps {
  parsedResult: ParsedTradeResult;
  originalPrompt: string;
  isSubmitting?: boolean;
  onResolve: (supplementalText: string) => void;
  onEditOriginal: () => void;
}

export function ClarificationModal({
  parsedResult,
  originalPrompt,
  isSubmitting = false,
  onResolve,
  onEditOriginal
}: ClarificationModalProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;

    const combined = `${originalPrompt}. ${answer.trim()}`;
    onResolve(combined);
  };

  const question =
    parsedResult.clarificationQuestion ||
    "Please provide the missing trade detail to continue:";
  const fieldName = parsedResult.clarificationField || "missing parameter";

  return (
    <div className="mx-auto max-w-xl">
      <div className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper-subtle)] p-2.5 text-[var(--rtd-wait)] shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--rtd-wait)]">
              Clarification needed
            </span>
            <h2 className="text-lg font-mono font-bold text-[var(--rtd-ink)] mt-0.5 [text-wrap:balance]">
              {question}
            </h2>
            <p className="text-xs text-[var(--rtd-steel)] mt-1 font-sans">
              Required field:{" "}
              <span className="font-bold text-[var(--rtd-ink)] font-mono">{fieldName}</span>
            </p>
          </div>
        </div>

        {/* Previous understood context */}
        <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-4 text-xs text-[var(--rtd-steel)] space-y-1">
          <p className="font-mono font-bold text-[var(--rtd-ink)]">What we extracted so far:</p>
          <div className="flex flex-wrap gap-2 pt-1 font-mono">
            {parsedResult.tradeIdea.asset && (
              <span className="bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 px-2 py-0.5 text-[var(--rtd-ink)]">
                Asset: {parsedResult.tradeIdea.asset}
              </span>
            )}
            {parsedResult.tradeIdea.direction && (
              <span className="bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 px-2 py-0.5 text-[var(--rtd-ink)]">
                Direction: {parsedResult.tradeIdea.direction}
              </span>
            )}
            {parsedResult.tradeIdea.positionSizeUsd > 0 && (
              <span className="bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/25 px-2 py-0.5 text-[var(--rtd-ink)]">
                Size: ${parsedResult.tradeIdea.positionSizeUsd.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* User response form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="clarification-input"
              className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--rtd-ink)] mb-1.5"
            >
              Your answer:
            </label>
            <input
              id="clarification-input"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. $5,000 USD or rNVDA or LONG"
              disabled={isSubmitting}
              autoFocus
              className="w-full border border-[var(--rtd-steel)]/30 bg-[var(--rtd-paper-subtle)] px-3 py-2 text-sm font-mono text-[var(--rtd-ink)] focus:bg-[var(--rtd-paper)] focus:border-[var(--rtd-ink)] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onEditOriginal}
              disabled={isSubmitting}
              className="min-h-[40px] px-4 py-2 text-xs font-mono font-bold text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] border border-[var(--rtd-steel)]/25 hover:bg-[var(--rtd-paper-subtle)] active:scale-95 transition-all cursor-pointer"
            >
              ← Edit full prompt
            </button>

            <button
              type="submit"
              disabled={!answer.trim() || isSubmitting}
              className="min-h-[40px] px-5 py-2 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              {isSubmitting ? "Processing..." : "Continue →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
