import type { LiquidityClass } from "../../domain/market/types";
import { calculateSpread, calculateSpreadPct, roundFinancial } from "./financial";

export function deriveSpreadAndBasis(
  tokenPrice: number,
  bid: number | null,
  ask: number | null,
  referencePrice: number | null
): Pick<{
  spread: number | null;
  spreadPct: number | null;
  basis: number | null;
  basisPct: number | null;
}, "spread" | "spreadPct" | "basis" | "basisPct"> {
  let spread: number | null = null;
  let spreadPct: number | null = null;
  if (bid !== null && ask !== null && Number.isFinite(bid) && Number.isFinite(ask) && ask >= bid && (ask + bid) > 0) {
    try {
      spread = calculateSpread(ask, bid);
      spreadPct = calculateSpreadPct(ask, bid);
    } catch {
      spread = null;
      spreadPct = null;
    }
  }

  const basis = referencePrice !== null && Number.isFinite(referencePrice) && referencePrice > 0 && Number.isFinite(tokenPrice) && tokenPrice > 0
    ? roundFinancial(tokenPrice - referencePrice)
    : null;
  const basisPct = referencePrice !== null && Number.isFinite(referencePrice) && referencePrice > 0 && Number.isFinite(tokenPrice) && tokenPrice > 0
    ? roundFinancial((tokenPrice / referencePrice - 1) * 100)
    : null;

  return { spread, spreadPct, basis, basisPct };
}

export function classifyLiquidity(
  spreadPct: number | null,
  bidSize: number | null,
  askSize: number | null,
  config: { spreadWarnPercent: number; minVisibleBidSize: number; minVisibleAskSize: number }
): LiquidityClass {
  if (spreadPct === null || bidSize === null || askSize === null) return "UNKNOWN";
  if (spreadPct > config.spreadWarnPercent || bidSize < config.minVisibleBidSize || askSize < config.minVisibleAskSize) return "THIN";
  return "NORMAL";
}


