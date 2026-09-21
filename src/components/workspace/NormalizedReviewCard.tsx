"use client";

import React from "react";
import type { NormalizedTrade } from "../../domain/trade/types";
import type { ParsedTradeResult } from "../../core/trade/parser";

interface NormalizedReviewCardProps {
  normalizedTrade: NormalizedTrade;
  parsedResult: ParsedTradeResult;
  onConfirm: () => void;
  onEdit: () => void;
  isAnalyzing?: boolean;
}

export function NormalizedReviewCard({
  normalizedTrade,
  parsedResult,
  onConfirm,
  onEdit,
  isAnalyzing = false
}: NormalizedReviewCardProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-raised)] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--rt-border-subtle)] pb-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--rt-verdict-clear)]">
              Checkpoint S04
            </span>
            <h2 className="text-xl font-mono font-bold text-[var(--rt-text-primary)] [text-wrap:balance]">
              Normalized trade review
            </h2>
            <p className="text-xs text-[var(--rt-text-muted)] mt-0.5 [text-wrap:pretty]">
              Confirm how the desk understood your trade before running stress scenarios.
            </p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            disabled={isAnalyzing}
            className="min-h-[44px] text-xs font-mono font-semibold text-[var(--rt-text-muted)] hover:text-[var(--rt-text-primary)] border border-[var(--rt-border-subtle)] px-3 py-1.5 hover:bg-[var(--rt-surface-base)] active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit trade
          </button>
        </div>

        {/* Two Column Grid: You told us vs System derived */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: You told us this */}
          <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--rt-text-primary)] uppercase tracking-wider">
              <svg className="w-4 h-4 text-[var(--rt-verdict-clear)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              You told us this (user intent)
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-[var(--rt-border-subtle)]">
                <span className="text-xs text-[var(--rt-text-muted)]">Asset and direction:</span>
                <span className="font-semibold text-[var(--rt-text-primary)]">
                  <span className={`mr-1 px-1.5 py-0.5 text-xs font-bold font-mono ${
                    normalizedTrade.direction === "LONG" ? "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-clear)] border border-[var(--rt-border-subtle)]" : "bg-[var(--rt-surface-raised)] text-[var(--rt-verdict-critical)] border border-[var(--rt-border-subtle)]"
                  }`}>
                    {normalizedTrade.direction}
                  </span>
                  {normalizedTrade.asset}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--rt-border-subtle)]">
                <span className="text-xs text-[var(--rt-text-muted)]">Position size:</span>
                <span className="font-mono font-semibold text-[var(--rt-text-primary)]">
                  ${normalizedTrade.positionSizeUsd.toLocaleString()} USD
                </span>
              </div>

              {normalizedTrade.timeHorizon && (
                <div className="flex justify-between items-center py-1 border-b border-[var(--rt-border-subtle)]">
                  <span className="text-xs text-[var(--rt-text-muted)]">Time horizon:</span>
                  <span className="font-medium text-[var(--rt-text-primary)]">{normalizedTrade.timeHorizon}</span>
                </div>
              )}

              {normalizedTrade.relevantExposure.length > 0 && (
                <div className="py-1 border-b border-[var(--rt-border-subtle)]">
                  <span className="text-xs text-[var(--rt-text-muted)] block mb-1">Existing exposure:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {normalizedTrade.relevantExposure.map((exp, idx) => (
                      <span key={idx} className="bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] px-2 py-0.5 text-xs font-mono font-medium text-[var(--rt-text-primary)]">
                        {exp.direction} ${exp.valueUsd.toLocaleString()} of {exp.asset}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-1">
                <span className="text-xs text-[var(--rt-text-muted)] block mb-1">Thesis:</span>
                <p className="text-xs font-medium text-[var(--rt-text-primary)] bg-[var(--rt-surface-raised)] p-3 border border-[var(--rt-border-subtle)] [text-wrap:pretty]">
                  &ldquo;{normalizedTrade.thesis}&rdquo;
                </p>
              </div>

              {normalizedTrade.entryPriceSource === "USER_PROVIDED" && (
                <div className="flex justify-between items-center py-1 border-b border-[var(--rt-border-subtle)]">
                  <span className="text-xs text-[var(--rt-text-muted)]">Specified entry price:</span>
                  <span className="font-mono text-xs font-semibold text-[var(--rt-text-primary)]">${normalizedTrade.entryPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: System Derived / Observed */}
          <div className="border border-[var(--rt-border-subtle)] bg-[var(--rt-surface-base)] p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--rt-text-primary)] uppercase tracking-wider">
              <svg className="w-4 h-4 text-[var(--rt-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              System derived and observed
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-[var(--rt-border-subtle)]">
                <span className="text-xs text-[var(--rt-text-muted)]">Bitget spot pair:</span>
                <span className="font-mono text-xs font-semibold text-[var(--rt-text-primary)]">{normalizedTrade.canonicalSymbol}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--rt-border-subtle)]">
                <span className="text-xs text-[var(--rt-text-muted)]">Instrument classification:</span>
                <span className="bg-[var(--rt-surface-raised)] border border-[var(--rt-border-subtle)] px-2 py-0.5 text-xs font-mono font-semibold text-[var(--rt-text-primary)]">
                  {normalizedTrade.instrumentType}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--rt-border-subtle)]">
                <span className="text-xs text-[var(--rt-text-muted)]">Reference underlying:</span>
                <span className="font-semibold text-[var(--rt-text-primary)]">{normalizedTrade.referenceAsset || "N/A"}</span>
              </div>

              {normalizedTrade.entryPriceSource === "SYSTEM_DERIVED" && (
                <div className="flex justify-between items-center py-1 border-b border-[var(--rt-border-subtle)]">
                  <div className="flex flex-col">
                    <span className="text-xs text-[var(--rt-text-muted)]">Working entry price:</span>
                    {normalizedTrade.entryBasisTimestamp && normalizedTrade.entryPrice > 0 && (
                      <span className="text-[10px] text-[var(--rt-text-muted)]">
                        Observed: {new Date(normalizedTrade.entryBasisTimestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {normalizedTrade.entryPrice > 0 ? (
                    <span className="font-mono text-xs font-semibold text-[var(--rt-text-primary)]">${normalizedTrade.entryPrice.toFixed(2)}</span>
                  ) : (
                    <span className="text-xs font-medium italic text-[var(--rt-text-muted)]">Pending live fetch...</span>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-[var(--rt-border-subtle)]">
                <span className="text-xs text-[var(--rt-text-muted)]">Implied token quantity:</span>
                {normalizedTrade.quantity > 0 ? (
                  <span className="font-mono text-xs font-semibold text-[var(--rt-text-primary)]">{normalizedTrade.quantity.toFixed(4)} {normalizedTrade.asset}</span>
                ) : (
                  <span className="text-xs font-medium italic text-[var(--rt-text-muted)]">Calculated at execution</span>
                )}
              </div>

              {parsedResult.inferredFields.length > 0 && (
                <div className="pt-1">
                  <span className="text-xs text-[var(--rt-text-muted)] block mb-1">Inferred mappings:</span>
                  <ul className="list-disc list-inside text-xs text-[var(--rt-text-muted)] space-y-0.5 font-mono">
                    {parsedResult.inferredFields.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={isAnalyzing}
            className="min-h-[44px] border border-[var(--rt-border-subtle)] px-4 py-2 text-sm font-mono font-semibold text-[var(--rt-text-primary)] bg-[var(--rt-surface-raised)] hover:bg-[var(--rt-surface-base)] active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel or edit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isAnalyzing}
            className="inline-flex min-h-[44px] items-center gap-2 bg-[var(--rt-surface-void)] px-6 py-2.5 text-sm font-mono font-semibold text-white shadow-xs hover:bg-[var(--rt-text-primary)] active:scale-[0.98] motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <span className="h-2 w-2 rounded-full bg-[var(--rt-verdict-clear)] motion-safe:animate-pulse motion-reduce:animate-none" />
                <span>Starting analysis...</span>
              </>
            ) : (
              <>
                <span>Confirm and run stress test</span>
                <svg className="w-4 h-4 text-[var(--rt-surface-raised)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


