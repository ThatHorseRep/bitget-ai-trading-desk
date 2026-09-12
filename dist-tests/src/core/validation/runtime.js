"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTradeIdea = validateTradeIdea;
exports.validateNormalizedTrade = validateNormalizedTrade;
exports.validateMarketState = validateMarketState;
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
function validateTradeIdea(input) {
    const errors = [];
    if (!input.asset.trim())
        errors.push("asset is required");
    if (input.direction !== "LONG" && input.direction !== "SHORT")
        errors.push("direction is invalid");
    if (!isFiniteNumber(input.positionSizeUsd) || input.positionSizeUsd <= 0)
        errors.push("positionSizeUsd must be greater than zero");
    if (!input.thesis.trim())
        errors.push("thesis is required");
    if (input.entryPrice !== undefined && (!isFiniteNumber(input.entryPrice) || input.entryPrice <= 0))
        errors.push("entryPrice must be greater than zero when provided");
    return { valid: errors.length === 0, errors };
}
function validateNormalizedTrade(input) {
    const base = validateTradeIdea(input);
    const errors = [...base.errors];
    if (!input.canonicalSymbol.trim())
        errors.push("canonicalSymbol is required");
    if (!Number.isFinite(input.entryPrice) || input.entryPrice <= 0)
        errors.push("normalized entryPrice must be greater than zero");
    if (!Number.isFinite(input.quantity) || input.quantity <= 0)
        errors.push("quantity must be greater than zero");
    return { valid: errors.length === 0, errors };
}
function validateMarketState(state) {
    const errors = [];
    if (!isFiniteNumber(state.instrumentPrice) || state.instrumentPrice <= 0)
        errors.push("instrumentPrice must be greater than zero");
    if (!Number.isFinite(Date.parse(state.observedAt)))
        errors.push("observedAt is invalid");
    if (state.bid !== null && state.bid <= 0)
        errors.push("bid must be positive when provided");
    if (state.ask !== null && state.ask <= 0)
        errors.push("ask must be positive when provided");
    if (state.bid !== null && state.ask !== null && state.bid > state.ask)
        errors.push("bid cannot exceed ask");
    if (state.referencePrice !== null && state.referencePrice <= 0)
        errors.push("referencePrice must be positive when provided");
    if (state.btcPrice !== null && state.btcPrice <= 0)
        errors.push("btcPrice must be positive when provided");
    return { valid: errors.length === 0, errors };
}
