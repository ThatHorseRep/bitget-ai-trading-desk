import type { StressScenario } from "../../domain/scenarios/types";
import type { MarketState, LiquidityClass, SessionStatus } from "../../domain/market/types";
import type { NormalizedTrade } from "../../domain/trade/types";
import type { PositionQualityAssessment, ExecutionRiskMetric } from "../../domain/thesis/types";
import { ASSET_RISK_PROFILES } from "../scenarios/config";

export const MVP_POLICY_ASSUMPTIONS = {
  // Loss thresholds expressed as negative percentages (worst-case loss)
  lossThresholds: {
    stronger: -5, // loss less severe than -5% => STRONGER
    mixed: -15   // loss between -5% and -15% => MIXED, beyond => WEAKER
  },
  liquidityDowngrade: {
    THIN: 1,   // downgrade one level for thin liquidity
    NORMAL: 0,
    UNKNOWN: 1 // treat missing liquidity data as THIN to prevent bypassing risk bounds
  },
  // Absolute basis impact (percentage points) that forces WEAKER classification
  basisDislocationThreshold: 1.0,
  // If position size exceeds this percentage of visible top-of-book size, downgrade to WEAKER
  positionToVisibleLiquidityRatioThreshold: 0.5,
  // Multiplier to estimate deep book liquidity from top-of-book
  estimatedDepthMultiplier: 10,
  // Off-hours / weekend force downgrade steps
  offHoursDowngradeSteps: 1
} as const;

/**
 * Classify the deterministic quality of a position based on worst‑case scenario loss,
 * market liquidity, position size relative to visible liquidity, basis dislocation, and off-hours state.
 * Returns the classification and a list of deterministic reason codes.
 */
export function classifyPositionQuality(
  scenarios: StressScenario[],
  marketState: MarketState,
  trade: NormalizedTrade
): PositionQualityAssessment {
  const reasons: string[] = [];
  const keyDrivers: string[] = [];

  // Helper to downgrade quality
  const downgrade = (quality: string, steps: number = 1): string => {
    let q = quality;
    for (let i = 0; i < steps; i++) {
      if (q === "STRONGER") q = "MIXED";
      else if (q === "MIXED") q = "WEAKER";
    }
    return q;
  };

  // Filter applicable scenarios with a numeric PnL percent
  const applicable = scenarios.filter((s) => s.applicable && s.estimatedPnlPct !== null);
  if (applicable.length === 0) {
    return { 
      quality: "INSUFFICIENT", 
      reasons: ["No applicable stress scenarios could be evaluated for this position."],
      keyDrivers: ["No applicable scenarios"] 
    };
  }

  // Find the worst (most negative) loss
  const worstScenario = applicable.reduce((worst, cur) =>
    (cur.estimatedPnlPct! < worst.estimatedPnlPct! ? cur : worst)
  );
  const worstLossPct = worstScenario.estimatedPnlPct!;

  const profile = ASSET_RISK_PROFILES[trade.asset] || ASSET_RISK_PROFILES["DEFAULT"];
  const strongerThreshold = MVP_POLICY_ASSUMPTIONS.lossThresholds.stronger * profile.volScalar;
  const mixedThreshold = MVP_POLICY_ASSUMPTIONS.lossThresholds.mixed * profile.volScalar;

  let quality: "STRONGER" | "MIXED" | "WEAKER" | "INSUFFICIENT";
  if (worstLossPct >= strongerThreshold) {
    quality = "STRONGER";
    reasons.push(`Worst-case scenario loss (${worstLossPct.toFixed(2)}%) is within the STRONGER threshold (>= ${strongerThreshold.toFixed(2)}%).`);
  } else if (worstLossPct >= mixedThreshold) {
    quality = "MIXED";
    reasons.push(`Worst-case scenario loss (${worstLossPct.toFixed(2)}%) falls into the MIXED threshold (between ${strongerThreshold.toFixed(2)}% and ${mixedThreshold.toFixed(2)}%).`);
  } else {
    quality = "WEAKER";
    reasons.push(`Worst-case scenario loss (${worstLossPct.toFixed(2)}%) exceeds the WEAKER threshold (< ${mixedThreshold.toFixed(2)}%).`);
  }
  keyDrivers.push(`worstScenario=${worstScenario.id}`);
  keyDrivers.push(`worstLossPct=${worstLossPct.toFixed(2)}`);

  // Apply liquidity downgrade
  const liquidityClass = marketState.liquidityClass as LiquidityClass;
  const downgradeSteps = MVP_POLICY_ASSUMPTIONS.liquidityDowngrade[liquidityClass] || 0;
  if (downgradeSteps > 0) {
    quality = downgrade(quality, downgradeSteps) as typeof quality;
    reasons.push(`Position downgraded due to ${liquidityClass} liquidity conditions.`);
  }
  keyDrivers.push(`liquidityClass=${liquidityClass}`);

  // Off-hours / weekend downgrade
  const isWeekendOrOffHours = marketState.sessionStatus === "WEEKEND" || marketState.sessionStatus === "OFF_HOURS";
  if (isWeekendOrOffHours) {
    quality = downgrade(quality, MVP_POLICY_ASSUMPTIONS.offHoursDowngradeSteps) as typeof quality;
    reasons.push(`Position downgraded due to off-hours/weekend trading session status (${marketState.sessionStatus}).`);
  }

  // Position size relative to visible liquidity (Execution Risk Metric)
  const relevantSizeTokens = trade.direction === "LONG" ? marketState.askSize : marketState.bidSize;
  const sideLabel = trade.direction === "LONG" ? "ask-side" : "bid-side";
  
  let executionRisk: ExecutionRiskMetric | undefined;

  if (relevantSizeTokens == null || marketState.instrumentPrice == null || marketState.instrumentPrice <= 0) {
    executionRisk = {
      metricName: "notional / visibleNotional",
      positionNotionalUsd: trade.positionSizeUsd,
      visibleNotionalUsd: "UNKNOWN",
      ratio: "UNKNOWN",
      explanation: `Top-of-book ${sideLabel} sizes are missing. Cannot compute total market liquidity from top-of-book alone. Note: Reality deep order-book access may require whitelist access per Bitget's current documentation.`
    };
    quality = "WEAKER";
    reasons.push(`Position downgraded to WEAKER because visible top-of-book liquidity is unknown, preventing position size validation.`);
    keyDrivers.push(`liquidityRatio=UNKNOWN`);
  } else {
    const visibleNotionalUsd = relevantSizeTokens * MVP_POLICY_ASSUMPTIONS.estimatedDepthMultiplier * marketState.instrumentPrice;
    const ratio = visibleNotionalUsd > 0 ? trade.positionSizeUsd / visibleNotionalUsd : Infinity;
    
    executionRisk = {
      metricName: "notional / visibleNotional",
      positionNotionalUsd: trade.positionSizeUsd,
      visibleNotionalUsd,
      ratio,
      explanation: `Calculated using ${sideLabel} top-of-book visible liquidity scaled by an estimated depth multiplier of ${MVP_POLICY_ASSUMPTIONS.estimatedDepthMultiplier}x for an immediate ${trade.direction === "LONG" ? "buy" : "sell"} approximation. This does not represent full order-book depth. Note: Reality deep order-book access may require whitelist access per Bitget's current documentation.`
    };

    if (ratio > MVP_POLICY_ASSUMPTIONS.positionToVisibleLiquidityRatioThreshold) {
      quality = "WEAKER";
      reasons.push(`Position size exceeds ${MVP_POLICY_ASSUMPTIONS.positionToVisibleLiquidityRatioThreshold * 100}% of visible top-of-book liquidity (Ratio: ${ratio.toFixed(2)}).`);
      keyDrivers.push(`liquidityRatio=${ratio.toFixed(2)}`);
    } else if (ratio === Infinity) {
      quality = "WEAKER";
      reasons.push(`Position downgraded to WEAKER because there is ZERO visible top-of-book liquidity.`);
      keyDrivers.push(`liquidityRatio=Infinity`);
    }
  }

  // Basis dislocation downgrade if any scenario exceeds threshold
  const maxBasisImpact = Math.max(...scenarios.map((s) => Math.abs(s.basisImpact ?? 0)));
  if (maxBasisImpact >= MVP_POLICY_ASSUMPTIONS.basisDislocationThreshold) {
    quality = "WEAKER";
    reasons.push(`Position downgraded to WEAKER due to high scenario basis dislocation impact (${maxBasisImpact.toFixed(2)} >= ${MVP_POLICY_ASSUMPTIONS.basisDislocationThreshold}).`);
  }
  if (maxBasisImpact !== 0) {
    keyDrivers.push(`basisImpact=${maxBasisImpact}`);
  }

  return { quality: quality as any, reasons, keyDrivers, executionRisk };
}
