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
      <div className="rounded-2xl border border-amber-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-2 text-amber-700 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Clarification needed
            </span>
            <h2 className="text-lg font-bold text-zinc-900 mt-0.5 [text-wrap:balance]">
              {question}
            </h2>
            <p className="text-xs text-zinc-600 mt-1 [text-wrap:pretty]">
              Field required for deterministic calculations: <span className="font-semibold text-zinc-800">{fieldName}</span>
            </p>
          </div>
        </div>

        {/* Previous understood context */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600 space-y-1">
          <p className="font-medium text-zinc-700">What we extracted so far:</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {parsedResult.tradeIdea.asset && (
              <span className="rounded-lg bg-white border border-zinc-200 px-2.5 py-1 font-medium text-zinc-800">
                Asset: {parsedResult.tradeIdea.asset}
              </span>
            )}
            {parsedResult.tradeIdea.direction && (
              <span className="rounded-lg bg-white border border-zinc-200 px-2.5 py-1 font-medium text-zinc-800">
                Direction: {parsedResult.tradeIdea.direction}
              </span>
            )}
            {parsedResult.tradeIdea.positionSizeUsd > 0 && (
              <span className="rounded-lg bg-white border border-zinc-200 px-2.5 py-1 font-medium text-zinc-800">
                Size: ${parsedResult.tradeIdea.positionSizeUsd.toLocaleString()}
              </span>
            )}
            {parsedResult.tradeIdea.thesis && (
              <span className="rounded-lg bg-white border border-zinc-200 px-2.5 py-1 font-medium text-zinc-800 truncate max-w-xs">
                Thesis: {parsedResult.tradeIdea.thesis}
              </span>
            )}
          </div>
        </div>

        {/* Response Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clarification-input" className="block text-xs font-semibold text-zinc-700 mb-1">
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
              className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onEditOriginal}
              disabled={isSubmitting}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back to edit full trade
            </button>
            <button
              type="submit"
              disabled={!answer.trim() || isSubmitting}
              className="relative rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
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


