export {
  HISTORICAL_GAP_DATABASE,
  getAllHistoricalPrecedents,
  getHistoricalPrecedentById,
  type HistoricalGapPrecedent,
  type AssetClass,
  type SessionType
} from "./historicalDatabase";

import {
  HISTORICAL_GAP_DATABASE,
  type HistoricalGapPrecedent
} from "./historicalDatabase";
import { calculateScenarioPnl, calculatePnlPct, roundFinancial } from "../calculations/financial";

export type MatchConfidence = "EXACT" | "SECTOR" | "FALLBACK";

export interface HistoricalRetrievalInput {
  asset: string;
  entryPrice: number;
  size: number;
  isOffHours?: boolean;
  isWeekend?: boolean;
  direction?: "LONG" | "SHORT";
}

export interface HistoricalEmpiricalMetrics {
  averageBasisShiftBps: number;
  maxHistoricalDrawdownPct: number;
  expectedGapDirection: "UP" | "DOWN" | "NEUTRAL";
  projectedPnlPct: number;
  projectedPnlUsd: number;
  estimatedReAnchorHours: number;
}

export interface HistoricalRetrievalResult {
  matchedAsset: string;
  matchConfidence: MatchConfidence;
  precedents: HistoricalGapPrecedent[];
  empiricalMetrics: HistoricalEmpiricalMetrics;
}

const SUPPORTED_EXACT_ASSETS = ["rNVDA", "rTSLA", "rMSTR", "rCOIN", "rAAPL", "rAMZN"] as const;

/**
 * Normalizes input asset ticker to canonical rToken representation if recognized.
 */
function normalizeAssetTicker(rawAsset: string): string {
  const cleaned = rawAsset.trim();
  const upper = cleaned.toUpperCase();

  for (const known of SUPPORTED_EXACT_ASSETS) {
    if (upper === known.toUpperCase()) return known;
    const baseTicker = known.slice(1); // e.g. "NVDA"
    if (upper === baseTicker || upper === `${baseTicker}USDT` || upper === `${known.toUpperCase()}USDT`) {
      return known;
    }
  }

  if (cleaned.startsWith("r") && cleaned.length > 1) {
    return cleaned;
  }
  return cleaned;
}

/**
 * Determines session risk weighting multiplier:
 * - Weekend (65.5h - 89.5h void): amplified gap & dislocation risk (1.20x)
 * - Off-hours overnight void: standard unhedged gap risk (1.00x)
 * - Regular market hours: active cash equity arbitrage dampens basis dislocation (0.60x)
 */
export function getSessionRiskMultiplier(isWeekend?: boolean, isOffHours?: boolean): number {
  if (isWeekend) return 1.20;
  if (isOffHours) return 1.00;
  return 0.60;
}

/**
 * Retrieves historical gap precedents and computes empirical stress metrics
 * for 24/7 tokenized equities and crypto assets.
 */
export function retrieveHistoricalScenarios(input: HistoricalRetrievalInput): HistoricalRetrievalResult {
  const rawAsset = input.asset || "DEFAULT";
  const normalizedAsset = normalizeAssetTicker(rawAsset);
  const direction: "LONG" | "SHORT" = input.direction === "SHORT" ? "SHORT" : "LONG";
  const entryPrice = input.entryPrice > 0 ? input.entryPrice : 100;
  const size = input.size > 0 ? input.size : 1000;
  const quantity = size / entryPrice;
  const isWeekend = Boolean(input.isWeekend);
  const isOffHours = Boolean(input.isOffHours);
  const sessionMultiplier = getSessionRiskMultiplier(isWeekend, isOffHours);

  let matchConfidence: MatchConfidence;
  let matchedAsset: string;
  let precedents: HistoricalGapPrecedent[];

  const isExactSupported = SUPPORTED_EXACT_ASSETS.includes(normalizedAsset as any);

  if (isExactSupported) {
    matchConfidence = "EXACT";
    matchedAsset = normalizedAsset;
    precedents = HISTORICAL_GAP_DATABASE.filter(
      (p) => p.primaryAsset === normalizedAsset || (p.applicableAssets && p.applicableAssets.includes(normalizedAsset))
    );
    // Sort so primary asset precedent comes first
    precedents.sort((a, b) => {
      if (a.primaryAsset === normalizedAsset && b.primaryAsset !== normalizedAsset) return -1;
      if (b.primaryAsset === normalizedAsset && a.primaryAsset !== normalizedAsset) return 1;
      return 0;
    });
  } else {
    // Check for Sector match (Crypto or Tokenized Equity sector)
    const upper = normalizedAsset.toUpperCase();
    const isCryptoSector = upper.includes("BTC") || upper.includes("ETH") || upper.includes("SOL") || upper.includes("CRYPTO");
    const isTechSector = upper.includes("MSFT") || upper.includes("GOOG") || upper.includes("META") || upper.includes("TECH");

    if (isCryptoSector) {
      matchConfidence = "SECTOR";
      matchedAsset = "CRYPTO";
      precedents = HISTORICAL_GAP_DATABASE.filter((p) => p.assetClass === "CRYPTO" || p.assetClass === "MACRO");
    } else if (isTechSector) {
      matchConfidence = "SECTOR";
      matchedAsset = "TOKENIZED_EQUITY";
      precedents = HISTORICAL_GAP_DATABASE.filter((p) => p.assetClass === "TOKENIZED_EQUITY" || p.assetClass === "MACRO");
    } else {
      matchConfidence = "FALLBACK";
      matchedAsset = "DEFAULT";
      precedents = HISTORICAL_GAP_DATABASE.filter((p) => p.primaryAsset === "DEFAULT");
    }
  }

  // Ensure at least fallback precedents if list is somehow empty
  if (precedents.length === 0) {
    matchConfidence = "FALLBACK";
    matchedAsset = "DEFAULT";
    precedents = HISTORICAL_GAP_DATABASE.filter((p) => p.primaryAsset === "DEFAULT");
  }

  // Calculate empirical metrics across matched precedents with session weighting
  let totalWeight = 0;
  let weightedBasisShiftSum = 0;
  let weightedRefGapSum = 0;
  let weightedReAnchorSum = 0;
  let weightedPnlUsdSum = 0;
  let maxDrawdownMag = 0;

  for (const precedent of precedents) {
    // Session relevance weight
    let weight = 1.0;
    if (isWeekend && (precedent.sessionType === "WEEKEND" || precedent.sessionType === "HOLIDAY")) {
      weight = 1.5;
    } else if (isOffHours && precedent.sessionType === "OFF_HOURS") {
      weight = 1.5;
    } else if (!isWeekend && !isOffHours && (precedent.sessionType === "WEEKEND" || precedent.sessionType === "HOLIDAY")) {
      weight = 0.75;
    }

    totalWeight += weight;
    weightedBasisShiftSum += weight * precedent.basisShiftBps;
    weightedRefGapSum += weight * precedent.referenceGapPct;
    weightedReAnchorSum += weight * precedent.reAnchorHours;

    const absDrawdown = Math.abs(precedent.peakDrawdownPct);
    if (absDrawdown > maxDrawdownMag) {
      maxDrawdownMag = absDrawdown;
    }

    // Directional P&L calculation for this precedent
    // Stressed token price reflects underlying reference drop and basis dislocation widening
    // calculateScenarioPnl handles direction: LONG loses, SHORT gains from price drop
    const tokenPriceDeltaPct = (precedent.referenceGapPct * sessionMultiplier) - ((precedent.basisShiftBps * sessionMultiplier) / 100);

    const stressedPrice = Math.max(0.00000001, entryPrice * (1 + (tokenPriceDeltaPct / 100)));
    const pnlUsd = calculateScenarioPnl(direction, quantity, entryPrice, stressedPrice);
    weightedPnlUsdSum += weight * pnlUsd;
  }

  const rawAvgBasisShift = totalWeight > 0 ? (weightedBasisShiftSum / totalWeight) : 300;
  const averageBasisShiftBps = roundFinancial(rawAvgBasisShift * sessionMultiplier);

  const avgRefGap = totalWeight > 0 ? (weightedRefGapSum / totalWeight) : -5.0;
  const expectedGapDirection: "UP" | "DOWN" | "NEUTRAL" =
    avgRefGap < -0.5 ? "DOWN" : avgRefGap > 0.5 ? "UP" : "NEUTRAL";

  const rawAvgReAnchor = totalWeight > 0 ? (weightedReAnchorSum / totalWeight) : 4.0;
  const estimatedReAnchorHours = roundFinancial(rawAvgReAnchor);

  // Peak drawdown is negative in percent
  const maxHistoricalDrawdownPct = roundFinancial(-maxDrawdownMag);

  const projectedPnlUsd = roundFinancial(totalWeight > 0 ? (weightedPnlUsdSum / totalWeight) : 0);
  const projectedPnlPct = calculatePnlPct(projectedPnlUsd, size);

  return {
    matchedAsset,
    matchConfidence,
    precedents,
    empiricalMetrics: {
      averageBasisShiftBps,
      maxHistoricalDrawdownPct,
      expectedGapDirection,
      projectedPnlPct,
      projectedPnlUsd,
      estimatedReAnchorHours
    }
  };
}
