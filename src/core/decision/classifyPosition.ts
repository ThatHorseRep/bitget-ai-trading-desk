import type { StressScenario } from "../../domain/scenarios/types";
import type { MarketState, LiquidityClass } from "../../domain/market/types";

export const POSITION_QUALITY_CONFIG = {
  // Loss thresholds expressed as negative percentages (worst‑case loss)
  lossThresholds: {
    stronger: -5, // loss less severe than -5% => STRONGER
    mixed: -15   // loss between -5% and -15% => MIXED, beyond => WEAKER
  },
  liquidityDowngrade: {
    THIN: 1,   // downgrade one level for thin liquidity
    NORMAL: 0,
    UNKNOWN: 0
  },
  // Absolute basis impact (percentage points) that forces WEAKER classification
  basisImpactThreshold: 1.0
} as const;

/**
 * Classify the deterministic quality of a position based on worst‑case scenario loss,
 * market liquidity, and basis impact.
 * Returns the classification and a list of key drivers that influenced the decision.
 */
export function classifyPositionQuality(
  scenarios: StressScenario[],
  marketState: MarketState
): { positionQuality: "STRONGER" | "MIXED" | "WEAKER" | "INSUFFICIENT"; keyDrivers: string[] } {
  // Helper to downgrade quality by one step
  const downgrade = (quality: string): string => {
    if (quality === "STRONGER") return "MIXED";
    if (quality === "MIXED") return "WEAKER";
    return quality; // WEAKER or INSUFFICIENT stay the same
  };

  // Filter applicable scenarios with a numeric PnL percent
  const applicable = scenarios.filter((s) => s.applicable && s.estimatedPnlPct !== null);
  if (applicable.length === 0) {
    return { positionQuality: "INSUFFICIENT", keyDrivers: ["No applicable scenarios"] };
  }

  // Find the worst (most negative) loss
  const worstScenario = applicable.reduce((worst, cur) =>
    (cur.estimatedPnlPct! < worst.estimatedPnlPct! ? cur : worst)
  );
  const worstLossPct = worstScenario.estimatedPnlPct!; // negative number expected

  let quality: "STRONGER" | "MIXED" | "WEAKER" | "INSUFFICIENT";
  if (worstLossPct >= POSITION_QUALITY_CONFIG.lossThresholds.stronger) {
    quality = "STRONGER";
  } else if (worstLossPct >= POSITION_QUALITY_CONFIG.lossThresholds.mixed) {
    quality = "MIXED";
  } else {
    quality = "WEAKER";
  }

  // Apply liquidity downgrade
  const liquidityClass = marketState.liquidityClass as LiquidityClass;
  if (liquidityClass === "THIN") {
    quality = downgrade(quality) as typeof quality;
  }

  // Basis impact downgrade if any scenario exceeds threshold
  const maxBasisImpact = Math.max(...scenarios.map((s) => s.basisImpact ?? 0));
  if (Math.abs(maxBasisImpact) >= POSITION_QUALITY_CONFIG.basisImpactThreshold) {
    quality = "WEAKER";
  }

  const keyDrivers: string[] = [];
  keyDrivers.push(`worstScenario=${worstScenario.id}`);
  keyDrivers.push(`worstLossPct=${worstLossPct.toFixed(2)}`);
  keyDrivers.push(`liquidityClass=${liquidityClass}`);
  if (maxBasisImpact !== 0) {
    keyDrivers.push(`basisImpact=${maxBasisImpact}`);
  }

  return { positionQuality: quality, keyDrivers };
}


