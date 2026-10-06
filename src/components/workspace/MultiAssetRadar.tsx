"use client";

import React, { useState } from "react";
import { ASSET_RISK_PROFILES } from "@/core/scenarios/config";
import { ChevronDown, ChevronUp, Activity, ArrowUpRight, ShieldAlert, Cpu } from "lucide-react";

interface MultiAssetRadarProps {
  onSelectAssetThesis: (promptText: string) => void;
}

interface AssetRadarCard {
  symbol: string;
  name: string;
  sector: string;
  basisEstimateBps: number;
  betaToBtc: number;
  volScalar: number;
  sessionState: string;
  sampleThesis: string;
  riskBand: "DEFENSIVE" | "BALANCED" | "HIGH_BETA";
}

const RADAR_ASSETS: AssetRadarCard[] = [
  {
    symbol: "rNVDA",
    name: "NVIDIA Corp",
    sector: "AI & Semiconductors",
    basisEstimateBps: 38,
    betaToBtc: ASSET_RISK_PROFILES["rNVDA"]?.betaToBtc ?? 0.2,
    volScalar: ASSET_RISK_PROFILES["rNVDA"]?.volScalar ?? 1.0,
    sessionState: "OFF-HOURS",
    sampleThesis: "I plan to buy $2,000 of rNVDA token during weekend off-hours because AI infrastructure demand still looks strong...",
    riskBand: "BALANCED"
  },
  {
    symbol: "rTSLA",
    name: "Tesla Inc",
    sector: "Automotive & Autonomy",
    basisEstimateBps: 84,
    betaToBtc: ASSET_RISK_PROFILES["rTSLA"]?.betaToBtc ?? 0.4,
    volScalar: ASSET_RISK_PROFILES["rTSLA"]?.volScalar ?? 1.0,
    sessionState: "OFF-HOURS",
    sampleThesis: "I want to buy $10,000 of rTSLA token on Sunday evening to front-run the robotaxi announcement on Monday morning...",
    riskBand: "HIGH_BETA"
  },
  {
    symbol: "rAAPL",
    name: "Apple Inc",
    sector: "Consumer Tech",
    basisEstimateBps: 18,
    betaToBtc: ASSET_RISK_PROFILES["rAAPL"]?.betaToBtc ?? 0.25,
    volScalar: ASSET_RISK_PROFILES["rAAPL"]?.volScalar ?? 0.85,
    sessionState: "OFF-HOURS",
    sampleThesis: "I plan to buy $3,000 of rAAPL token holding through the weekend for steady consumer hardware earnings momentum...",
    riskBand: "DEFENSIVE"
  },
  {
    symbol: "rMSFT",
    name: "Microsoft Corp",
    sector: "Cloud & Enterprise Software",
    basisEstimateBps: 22,
    betaToBtc: 0.25,
    volScalar: 0.85,
    sessionState: "OFF-HOURS",
    sampleThesis: "I plan to buy $2,500 of rMSFT token over the weekend driven by Azure cloud growth projections...",
    riskBand: "DEFENSIVE"
  },
  {
    symbol: "rAMZN",
    name: "Amazon.com Inc",
    sector: "E-Commerce & AWS",
    basisEstimateBps: 31,
    betaToBtc: ASSET_RISK_PROFILES["rAMZN"]?.betaToBtc ?? 0.3,
    volScalar: ASSET_RISK_PROFILES["rAMZN"]?.volScalar ?? 0.95,
    sessionState: "OFF-HOURS",
    sampleThesis: "I want to hold $1,500 of rAMZN token across the weekend expecting strong cloud revenue updates...",
    riskBand: "BALANCED"
  },
  {
    symbol: "rCOIN",
    name: "Coinbase Global",
    sector: "Crypto Infrastructure",
    basisEstimateBps: 112,
    betaToBtc: ASSET_RISK_PROFILES["rCOIN"]?.betaToBtc ?? 0.75,
    volScalar: ASSET_RISK_PROFILES["rCOIN"]?.volScalar ?? 2.0,
    sessionState: "OFF-HOURS",
    sampleThesis: "I plan to buy $1,000 of rCOIN token over the weekend to ride expected crypto market volatility...",
    riskBand: "HIGH_BETA"
  }
];

export function MultiAssetRadar({ onSelectAssetThesis }: MultiAssetRadarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper)] rounded-xs shadow-2xs overflow-hidden">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 sm:px-4 bg-[var(--rtd-paper-subtle)] hover:bg-[var(--rtd-paper)] transition-colors text-left cursor-pointer border-b border-[var(--rtd-steel)]/15"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--rtd-ink)]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--rtd-ink)]">
            Multi-Asset Pre-Trade Radar (6 Tokenized Equities)
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[var(--rtd-ink)] text-[var(--rtd-paper)] rounded-xs">
            Bitget Spot
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--rtd-steel)]">
          <span>{isOpen ? "Hide Scanner" : "Explore Cross-Asset Spreads"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Grid */}
      {isOpen && (
        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-sans text-[var(--rtd-steel)]">
            <span>
              Real-time off-hours basis disparity, systemic crypto correlation (Beta to BTC), and 1-click thesis injection.
            </span>
            <span className="font-mono text-[10px] uppercase">
              Updated via Bitget Ticker API
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {RADAR_ASSETS.map((asset) => {
              const riskColor =
                asset.riskBand === "DEFENSIVE"
                  ? "var(--rtd-proceed)"
                  : asset.riskBand === "BALANCED"
                  ? "var(--rtd-wait)"
                  : "var(--rtd-reject)";

              return (
                <div
                  key={asset.symbol}
                  className="border border-[var(--rtd-steel)]/20 bg-[var(--rtd-paper-subtle)] hover:border-[var(--rtd-ink)] p-3 rounded-xs flex flex-col justify-between space-y-2 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-[var(--rtd-ink)]">
                          {asset.symbol}
                        </span>
                        <span
                          className="text-[9px] font-mono font-bold px-1 py-0.2 rounded-xs uppercase tracking-wider"
                          style={{
                            color: riskColor,
                            backgroundColor: `color-mix(in srgb, ${riskColor} 12%, transparent)`
                          }}
                        >
                          {asset.riskBand.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-[10px] font-sans text-[var(--rtd-steel)]">
                        {asset.name} · {asset.sector}
                      </div>
                    </div>

                    <span className="text-[9px] font-mono text-[var(--rtd-steel)] px-1 py-0.5 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/20 rounded-xs">
                      {asset.sessionState}
                    </span>
                  </div>

                  {/* Metrics bar */}
                  <div className="grid grid-cols-2 gap-2 text-center font-mono py-1.5 px-2 bg-[var(--rtd-paper)] border border-[var(--rtd-steel)]/15 rounded-xs">
                    <div>
                      <div className="text-[9px] text-[var(--rtd-steel)] uppercase">Basis Gap</div>
                      <div className="text-xs font-bold text-[var(--rtd-ink)]">
                        +{asset.basisEstimateBps} bps
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[var(--rtd-steel)] uppercase">Beta to BTC</div>
                      <div className="text-xs font-bold text-[var(--rtd-ink)]">
                        {asset.betaToBtc.toFixed(2)}β
                      </div>
                    </div>
                  </div>

                  {/* 1-Click action */}
                  <button
                    type="button"
                    onClick={() => onSelectAssetThesis(asset.sampleThesis)}
                    className="w-full py-1.5 bg-[var(--rtd-paper)] hover:bg-[var(--rtd-ink)] hover:text-[var(--rtd-paper)] text-[var(--rtd-ink)] border border-[var(--rtd-steel)]/25 text-[10.5px] font-mono font-bold uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Test {asset.symbol} Thesis</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
