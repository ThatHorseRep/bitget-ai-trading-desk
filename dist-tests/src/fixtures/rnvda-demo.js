"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rnvdaDemoMarketState = exports.rnvdaTradeIdea = exports.RNVDA_DEMO_FIXTURE_LABEL = void 0;
exports.buildRnvdaDemoTrade = buildRnvdaDemoTrade;
const financial_1 = require("../core/calculations/financial");
exports.RNVDA_DEMO_FIXTURE_LABEL = "DEMO FIXTURE — NOT LIVE DATA";
exports.rnvdaTradeIdea = {
    asset: "rNVDA",
    direction: "LONG",
    positionSizeUsd: 2000,
    thesis: "A current NVIDIA/AI-demand thesis supports upside in the underlying."
};
function buildRnvdaDemoTrade() {
    const entryPrice = 120;
    return {
        asset: "rNVDA",
        canonicalSymbol: "rNVDAUSDT",
        instrumentType: "TOKENIZED_EQUITY",
        direction: "LONG",
        positionSizeUsd: 2000,
        entryPrice,
        quantity: (0, financial_1.calculatePositionQuantity)(2000, entryPrice),
        referenceAsset: "NVDA",
        thesis: exports.rnvdaTradeIdea.thesis,
        userAssumptions: [],
        relevantExposure: []
    };
}
exports.rnvdaDemoMarketState = {
    observedAt: "2026-01-01T18:00:00.000Z",
    instrumentPrice: 120,
    bid: 119.4,
    ask: 120.6,
    bidSize: 30,
    askSize: 28,
    spread: 1.2,
    spreadPct: 1.0,
    referencePrice: 117,
    referenceObservedAt: "2026-01-01T18:00:00.000Z",
    basis: 3,
    basisPct: 2.56410256,
    btcPrice: 85000,
    btcObservedAt: "2026-01-01T18:00:00.000Z",
    sessionStatus: "WEEKEND",
    tokenMarketStatus: "ACTIVE",
    liquidityClass: "NORMAL",
    dataQuality: "COMPLETE",
    sources: [
        { id: "fixture-bitget", name: "DEMO FIXTURE — NOT LIVE DATA", observedAt: "2026-01-01T18:00:00.000Z" }
    ]
};
