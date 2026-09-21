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

  const question = parsedResult.clarificationQuestion || "Please provide the missing trade detail to continue:";
  const fieldName = parsedResult.clarificationField || "missing parameter";

  return (
    <div className="mx-auto max-w-xl">
      <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-start gap-3">
          <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-2 text-[var(--rt-verdict-moderate)] shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--rt-verdict-moderate)]">
              Clarification needed
            </span>
            <h2 className="text-lg font-mono font-bold text-[var(--rt-text-primary)] mt-0.5 [text-wrap:balance]">
              {question}
            </h2>
            <p className="text-xs text-[var(--rt-text-muted)] mt-1 [text-wrap:pretty]">
              Field required for deterministic calculations: <span className="font-semibold text-[var(--rt-text-primary)] font-mono">{fieldName}</span>
            </p>
          </div>
        </div>

        {/* Previous understood context */}
        <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-4 text-xs text-[var(--rt-text-muted)] space-y-1">
          <p className="font-mono font-medium text-[var(--rt-text-primary)]">What we extracted so far:</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {parsedResult.tradeIdea.asset && (
              <span className="bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] px-2.5 py-1 font-mono font-medium text-[var(--rt-text-primary)]">
                Asset: {parsedResult.tradeIdea.asset}
              </span>
            )}
            {parsedResult.tradeIdea.direction && (
              <span className="bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] px-2.5 py-1 font-mono font-medium text-[var(--rt-text-primary)]">
                Direction: {parsedResult.tradeIdea.direction}
              </span>
            )}
            {parsedResult.tradeIdea.positionSizeUsd > 0 && (
              <span className="bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] px-2.5 py-1 font-mono font-medium text-[var(--rt-text-primary)]">
                Size: ${parsedResult.tradeIdea.positionSizeUsd.toLocaleString()}
              </span>
            )}
            {parsedResult.tradeIdea.thesis && (
              <span className="bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] px-2.5 py-1 font-medium text-[var(--rt-text-primary)] truncate max-w-xs">
                Thesis: {parsedResult.tradeIdea.thesis}
              </span>
            )}
          </div>
        </div>

        {/* Response Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clarification-input" className="block text-xs font-mono font-semibold text-[var(--rt-text-primary)] mb-1">
              Your answer
            </label>
            <input
              id="clarification-input"
              type="text"
              autoFocus
              disabled={isSubmitting}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={fieldName.toLowerCase().includes("size") ? "For example, $2,000" : "For example, long"}
              className="w-full border border-[var(--rt-border-subtle)] bg-white px-4 py-2.5 text-base text-[var(--rt-text-primary)] placeholder:text-[var(--rt-text-muted)] focus-visible:border-[var(--rt-text-primary)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onEditOriginal}
              disabled={isSubmitting}
              className="min-h-[44px] text-xs font-mono font-medium text-[var(--rt-text-muted)] hover:text-[var(--rt-text-primary)] underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              Back to edit full trade
            </button>
            <button
              type="submit"
              disabled={!answer.trim() || isSubmitting}
              className="relative min-h-[44px] bg-[var(--rt-surface-void)] px-6 py-2.5 text-sm font-mono font-semibold text-white hover:bg-[var(--rt-text-primary)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--rt-verdict-clear)] motion-safe:animate-pulse motion-reduce:animate-none" />
                  Processing...
                </span>
              ) : (
                "Continue stress test"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


