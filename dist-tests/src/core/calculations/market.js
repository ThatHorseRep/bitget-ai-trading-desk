"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveSpreadAndBasis = deriveSpreadAndBasis;
exports.classifyLiquidity = classifyLiquidity;
const financial_1 = require("./financial");
function deriveSpreadAndBasis(tokenPrice, bid, ask, referencePrice) {
    const spread = bid !== null && ask !== null ? (0, financial_1.calculateSpread)(ask, bid) : null;
    const spreadPct = bid !== null && ask !== null ? (0, financial_1.calculateSpreadPct)(ask, bid) : null;
    const basis = referencePrice !== null ? (0, financial_1.roundFinancial)(tokenPrice - referencePrice) : null;
    const basisPct = referencePrice !== null ? (0, financial_1.roundFinancial)((tokenPrice / referencePrice - 1) * 100) : null;
    return { spread, spreadPct, basis, basisPct };
}
function classifyLiquidity(spreadPct, bidSize, askSize, config) {
    if (spreadPct === null || bidSize === null || askSize === null)
        return "UNKNOWN";
    if (spreadPct > config.spreadWarnPercent || bidSize < config.minVisibleBidSize || askSize < config.minVisibleAskSize)
        return "THIN";
    return "NORMAL";
}
