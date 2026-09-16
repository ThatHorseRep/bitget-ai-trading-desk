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
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Checkpoint S04
            </span>
            <h2 className="text-xl font-bold text-zinc-900 [text-wrap:balance]">
              Normalized trade review
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 [text-wrap:pretty]">
              Confirm how the desk understood your trade before running stress scenarios.
            </p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            disabled={isAnalyzing}
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-50 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit trade
          </button>
        </div>

        {/* Two Column Grid: You told us vs System derived */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: You told us this */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 uppercase tracking-wider">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              You told us this (user intent)
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                <span className="text-xs text-zinc-500">Asset and direction:</span>
                <span className="font-semibold text-zinc-900">
                  <span className={`mr-1 px-1.5 py-0.5 rounded-md text-xs font-bold ${
                    normalizedTrade.direction === "LONG" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {normalizedTrade.direction}
                  </span>
                  {normalizedTrade.asset}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                <span className="text-xs text-zinc-500">Position size:</span>
                <span className="font-semibold text-zinc-900">
                  ${normalizedTrade.positionSizeUsd.toLocaleString()} USD
                </span>
              </div>

              {normalizedTrade.timeHorizon && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                  <span className="text-xs text-zinc-500">Time horizon:</span>
                  <span className="font-medium text-zinc-800">{normalizedTrade.timeHorizon}</span>
                </div>
              )}

              {normalizedTrade.relevantExposure.length > 0 && (
                <div className="py-1 border-b border-zinc-200">
                  <span className="text-xs text-zinc-500 block mb-1">Existing exposure:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {normalizedTrade.relevantExposure.map((exp, idx) => (
                      <span key={idx} className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-800">
                        {exp.direction} ${exp.valueUsd.toLocaleString()} of {exp.asset}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-1">
                <span className="text-xs text-zinc-500 block mb-1">Thesis:</span>
                <p className="text-xs font-medium text-zinc-800 bg-white p-3 rounded-lg border border-zinc-200 [text-wrap:pretty]">
                  &ldquo;{normalizedTrade.thesis}&rdquo;
                </p>
              </div>

              {normalizedTrade.entryPriceSource === "USER_PROVIDED" && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                  <span className="text-xs text-zinc-500">Specified entry price:</span>
                  <span className="font-mono text-xs font-semibold text-zinc-900">${normalizedTrade.entryPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: System Derived / Observed */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 uppercase tracking-wider">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              System derived and observed
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                <span className="text-xs text-zinc-500">Bitget spot pair:</span>
                <span className="font-mono text-xs font-semibold text-zinc-800">{normalizedTrade.canonicalSymbol}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                <span className="text-xs text-zinc-500">Instrument classification:</span>
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {normalizedTrade.instrumentType}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                <span className="text-xs text-zinc-500">Reference underlying:</span>
                <span className="font-semibold text-zinc-800">{normalizedTrade.referenceAsset || "N/A"}</span>
              </div>

              {normalizedTrade.entryPriceSource === "SYSTEM_DERIVED" && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500">Working entry price:</span>
                    {normalizedTrade.entryBasisTimestamp && (
                      <span className="text-[10px] text-zinc-400">
                        Observed: {new Date(normalizedTrade.entryBasisTimestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-semibold text-zinc-800">${normalizedTrade.entryPrice.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                <span className="text-xs text-zinc-500">Implied token quantity:</span>
                <span className="font-mono text-xs font-semibold text-zinc-800">{normalizedTrade.quantity.toFixed(4)} {normalizedTrade.asset}</span>
              </div>

              {parsedResult.inferredFields.length > 0 && (
                <div className="pt-1">
                  <span className="text-xs text-zinc-500 block mb-1">Inferred mappings:</span>
                  <ul className="list-disc list-inside text-xs text-zinc-600 space-y-0.5">
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
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel or edit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-[0.98] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Starting analysis...</span>
              </>
            ) : (
              <>
                <span>Confirm and run stress test</span>
                <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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


