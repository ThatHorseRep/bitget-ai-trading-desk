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
  onConfirm,
  onEdit,
  isAnalyzing = false
}: NormalizedReviewCardProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <div className="border border-[var(--rtd-steel)]/25 bg-[var(--rtd-paper)] p-4 sm:p-7 md:p-8 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--rtd-steel)]/15 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--rtd-proceed)]">
              Checkpoint S04
            </span>
            <h2 className="text-xl font-mono font-bold text-[var(--rtd-ink)] [text-wrap:balance]">
              Normalized trade review
            </h2>
            <p className="text-xs text-[var(--rtd-steel)] mt-0.5">
              Confirm how the desk understood your trade before running stress scenarios.
            </p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            disabled={isAnalyzing}
            className="min-h-[40px] text-xs font-mono font-bold text-[var(--rtd-steel)] hover:text-[var(--rtd-ink)] border border-[var(--rtd-steel)]/25 px-3.5 py-1.5 hover:bg-[var(--rtd-paper-subtle)] active:scale-[0.98] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer self-start sm:self-auto"
          >
            Edit trade
          </button>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: User Intent */}
          <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-4 space-y-3">
            <div className="text-xs font-mono font-bold text-[var(--rtd-ink)] uppercase tracking-wider">
              You told us this (user intent)
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-[var(--rtd-steel)]/15">
                <span className="text-xs text-[var(--rtd-steel)] font-mono">Asset &amp; direction:</span>
                <span className="font-bold text-[var(--rtd-ink)] font-mono">
                  <span
                    className="mr-1.5 px-1.5 py-0.5 text-xs font-bold text-white"
                    style={{
                      backgroundColor:
                        normalizedTrade.direction === "LONG"
                          ? "var(--rtd-proceed)"
                          : "var(--rtd-reject)"
                    }}
                  >
                    {normalizedTrade.direction}
                  </span>
                  {normalizedTrade.asset}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--rtd-steel)]/15">
                <span className="text-xs text-[var(--rtd-steel)] font-mono">Position size:</span>
                <span className="font-mono font-bold text-[var(--rtd-ink)] rtd-figure">
                  ${normalizedTrade.positionSizeUsd.toLocaleString()} USD
                </span>
              </div>

              {normalizedTrade.timeHorizon && (
                <div className="flex justify-between items-center py-1 border-b border-[var(--rtd-steel)]/15">
                  <span className="text-xs text-[var(--rtd-steel)] font-mono">Time horizon:</span>
                  <span className="font-mono text-xs text-[var(--rtd-ink)]">
                    {normalizedTrade.timeHorizon}
                  </span>
                </div>
              )}

              <div className="pt-1">
                <span className="text-xs text-[var(--rtd-steel)] font-mono block mb-1">Thesis:</span>
                <p className="text-xs font-sans text-[var(--rtd-ink)] bg-[var(--rtd-paper)] p-3 border border-[var(--rtd-steel)]/20 leading-relaxed">
                  &ldquo;{normalizedTrade.thesis}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: System Derived */}
          <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] p-4 space-y-3">
            <div className="text-xs font-mono font-bold text-[var(--rtd-ink)] uppercase tracking-wider">
              System derived (market context)
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-[var(--rtd-steel)]/15">
                <span className="text-xs text-[var(--rtd-steel)] font-mono">Canonical Symbol:</span>
                <span className="font-mono font-bold text-[var(--rtd-ink)]">
                  {normalizedTrade.canonicalSymbol}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--rtd-steel)]/15">
                <span className="text-xs text-[var(--rtd-steel)] font-mono">Instrument:</span>
                <span className="font-mono text-xs font-bold text-[var(--rtd-ink)]">
                  {normalizedTrade.instrumentType}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--rtd-steel)]/15">
                <span className="text-xs text-[var(--rtd-steel)] font-mono">Working Entry:</span>
                <span className="font-mono font-bold text-[var(--rtd-ink)] rtd-figure flex items-center gap-1.5">
                  <span>${normalizedTrade.entryPrice.toFixed(2)}</span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-1 py-0.2 border border-emerald-500/20 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[var(--rtd-steel)]/15">
                <span className="text-xs text-[var(--rtd-steel)] font-mono">Quantity:</span>
                <span className="font-mono font-bold text-[var(--rtd-ink)] rtd-figure">
                  {normalizedTrade.quantity.toFixed(4)} tokens
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-stretch sm:justify-end">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isAnalyzing}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            {isAnalyzing ? "Executing Risk Pipeline..." : "Execute Stress Test →"}
          </button>
        </div>
      </div>
    </div>
  );
}
