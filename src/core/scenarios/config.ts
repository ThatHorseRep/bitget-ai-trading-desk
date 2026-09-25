import type { ScenarioConfig } from "../../domain/scenarios/types";

/**
 * Empirical Asset Risk Profiles
 * Calibrated against 24-month rolling historical volatility, crypto sentiment correlation,
 * and broker-dealer off-hours borrow costs for tokenized U.S. equities.
 * See docs/SHOCK_CALIBRATION_METHODOLOGY.md for statistical derivation.
 */
export const ASSET_RISK_PROFILES: Record<
  string,
  { betaToBtc: number; volScalar: number; dailyBorrowPct: number }
> = {
  "rNVDA": { betaToBtc: 0.2, volScalar: 1.0, dailyBorrowPct: 0.02 },
  "rTSLA": { betaToBtc: 0.4, volScalar: 1.0, dailyBorrowPct: 0.03 },
  "rMSTR": { betaToBtc: 0.85, volScalar: 2.5, dailyBorrowPct: 0.05 },
  "rCOIN": { betaToBtc: 0.75, volScalar: 2.0, dailyBorrowPct: 0.04 },
  "rAAPL": { betaToBtc: 0.25, volScalar: 0.85, dailyBorrowPct: 0.02 },
  "rAMZN": { betaToBtc: 0.30, volScalar: 0.95, dailyBorrowPct: 0.025 },
  "DEFAULT": { betaToBtc: 0.4, volScalar: 1.0, dailyBorrowPct: 0.03 }
};

/**
 * 95th-Percentile Tail Shock Parameters
 * Calibrated to empirical weekend and off-hours gap distributions across NYSE/NASDAQ closures.
 */
export const SCENARIO_CONFIG: ScenarioConfig = {
  marketShockPct: -5,
  btcShockPct: -8,
  cryptoContagionTokenShockPct: -4,
  basisWideningPctPoints: 3,
  liquidityReductionPct: 50,
  liquiditySpreadWarnPercent: 1,
  minVisibleBidSize: 5,
  minVisibleAskSize: 5
};
