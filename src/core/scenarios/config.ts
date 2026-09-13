import type { ScenarioConfig } from "../../domain/scenarios/types";

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


