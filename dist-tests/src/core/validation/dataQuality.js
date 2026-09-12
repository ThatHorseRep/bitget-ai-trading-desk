"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessMarketDataQuality = assessMarketDataQuality;
const DEFAULT_STALE_AFTER_MS = 5 * 60 * 1000;
function assessMarketDataQuality(state, now = new Date(), staleAfterMs = DEFAULT_STALE_AFTER_MS) {
    const issues = [];
    const observedMs = Date.parse(state.observedAt);
    if (!Number.isFinite(observedMs))
        issues.push("invalid observedAt timestamp");
    else if (now.getTime() - observedMs > staleAfterMs)
        issues.push("instrument observation is stale");
    if (!Number.isFinite(state.instrumentPrice) || state.instrumentPrice <= 0)
        issues.push("missing or invalid instrument price");
    if (state.bid === null || state.ask === null)
        issues.push("bid/ask unavailable");
    if (state.referencePrice === null)
        issues.push("reference price unavailable");
    if (state.btcPrice === null)
        issues.push("BTC price unavailable");
    if (issues.some((issue) => issue.includes("missing") || issue.includes("invalid")))
        return { status: "INVALID", issues };
    if (issues.length > 0)
        return { status: "DEGRADED", issues };
    return { status: "COMPLETE", issues: [] };
}
