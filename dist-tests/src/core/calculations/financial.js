"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundFinancial = roundFinancial;
exports.assertPositive = assertPositive;
exports.calculatePositionQuantity = calculatePositionQuantity;
exports.calculateSpread = calculateSpread;
exports.calculateSpreadPct = calculateSpreadPct;
exports.calculateBasis = calculateBasis;
exports.calculateScenarioPnl = calculateScenarioPnl;
exports.calculatePnlPct = calculatePnlPct;
const FINANCIAL_SCALE = 1e8;
function roundFinancial(value) {
    if (!Number.isFinite(value))
        throw new Error("Financial value must be finite");
    return Math.round((value + Number.EPSILON) * FINANCIAL_SCALE) / FINANCIAL_SCALE;
}
function assertPositive(value, field) {
    if (!Number.isFinite(value) || value <= 0)
        throw new Error(`${field} must be greater than zero`);
}
function calculatePositionQuantity(positionSizeUsd, entryPrice) {
    assertPositive(positionSizeUsd, "positionSizeUsd");
    assertPositive(entryPrice, "entryPrice");
    return roundFinancial(positionSizeUsd / entryPrice);
}
function calculateSpread(ask, bid) {
    if (!Number.isFinite(ask) || !Number.isFinite(bid))
        throw new Error("Bid and ask must be finite");
    if (ask < bid)
        throw new Error("Ask cannot be below bid");
    return roundFinancial(ask - bid);
}
function calculateSpreadPct(ask, bid) {
    if (ask < bid)
        throw new Error("Ask cannot be below bid");
    const midpoint = (ask + bid) / 2;
    assertPositive(midpoint, "midpoint");
    return roundFinancial((ask - bid) / midpoint * 100);
}
function calculateBasis(tokenPrice, referencePrice) {
    assertPositive(tokenPrice, "tokenPrice");
    assertPositive(referencePrice, "referencePrice");
    return {
        basis: roundFinancial(tokenPrice - referencePrice),
        basisPct: roundFinancial((tokenPrice / referencePrice - 1) * 100)
    };
}
function calculateScenarioPnl(direction, quantity, entryPrice, scenarioPrice) {
    assertPositive(quantity, "quantity");
    assertPositive(entryPrice, "entryPrice");
    assertPositive(scenarioPrice, "scenarioPrice");
    const pnl = direction === "LONG"
        ? quantity * (scenarioPrice - entryPrice)
        : quantity * (entryPrice - scenarioPrice);
    return roundFinancial(pnl);
}
function calculatePnlPct(pnlUsd, positionSizeUsd) {
    assertPositive(positionSizeUsd, "positionSizeUsd");
    return roundFinancial((pnlUsd / positionSizeUsd) * 100);
}
