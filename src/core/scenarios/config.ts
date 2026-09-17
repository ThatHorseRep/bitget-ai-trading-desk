import type { ScenarioConfig } from "../../domain/scenarios/types";

export const ASSET_RISK_PROFILES: Record<string, { betaToBtc: number; volScalar: number; dailyBorrowPct: number }> = {
  "rNVDA": { betaToBtc: 0.2, volScalar: 1.0, dailyBorrowPct: 0.02 },
  "rMSTR": { betaToBtc: 0.85, volScalar: 2.5, dailyBorrowPct: 0.05 },
  "rCOIN": { betaToBtc: 0.75, volScalar: 2.0, dailyBorrowPct: 0.04 },
  "DEFAULT": { betaToBtc: 0.4, volScalar: 1.0, dailyBorrowPct: 0.03 }
};
export const SCENARIO_CONFIG: ScenarioConfig = {
  marketShockPct: -5,
  btcShockPct: -8,
  cryptoContagionTokenShockPct: -4,
  basisWideningPctPoints: 3,
  liquidityReductionPct: 50,
  // Initial demo configuration. These are not empirical thresholds.
  liquiditySpreadWarnPercent: 1,
  minVisibleBidSize: 5,
  minVisibleAskSize: 5
};


