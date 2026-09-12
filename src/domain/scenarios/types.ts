export type StressScenarioId = "MARKET_RISK" | "CRYPTO_CONTAGION" | "TOKEN_MICROSTRUCTURE" | "COMBINED_SHOCK" | "THESIS_FAILURE";

export interface StressScenario {
  id: StressScenarioId;
  name: string;
  description: string;
  assumptions: string[];
  shockedReferencePrice: number | null;
  shockedTokenPrice: number | null;
  estimatedPnlUsd: number | null;
  estimatedPnlPct: number | null;
  basisImpact: number | null;
  liquidityImpact: number | null;
  applicable: boolean;
  limitations: string[];
}

export interface ScenarioConfig {
  marketShockPct: number;
  btcShockPct: number;
  cryptoContagionTokenShockPct: number;
  basisWideningPctPoints: number;
  liquidityReductionPct: number;
  liquiditySpreadWarnPercent: number;
  minVisibleBidSize: number;
  minVisibleAskSize: number;
}
