import type { MarketState } from "../../domain/market/types";

export interface DataQualityReport {
  status: "COMPLETE" | "DEGRADED" | "INVALID";
  issues: string[];
}

const DEFAULT_STALE_AFTER_MS = 5 * 60 * 1000;

export function assessMarketDataQuality(state: MarketState, now = new Date(), staleAfterMs = DEFAULT_STALE_AFTER_MS): DataQualityReport {
  const issues: string[] = [];
  const observedMs = Date.parse(state.observedAt);
  if (!Number.isFinite(observedMs)) issues.push("invalid observedAt timestamp");
  else if (now.getTime() - observedMs > staleAfterMs) issues.push("instrument observation is stale");

  if (!Number.isFinite(state.instrumentPrice) || state.instrumentPrice <= 0) issues.push("missing or invalid instrument price");
  if (state.bid === null || state.ask === null) issues.push("bid/ask unavailable");
  if (state.referencePrice === null) issues.push("reference price unavailable");
  if (state.btcPrice === null) issues.push("BTC price unavailable");

  if (issues.some((issue) => issue === "missing or invalid instrument price" || issue === "invalid observedAt timestamp")) return { status: "INVALID", issues };
  if (issues.length > 0) return { status: "DEGRADED", issues };
  return { status: "COMPLETE", issues: [] };
}
