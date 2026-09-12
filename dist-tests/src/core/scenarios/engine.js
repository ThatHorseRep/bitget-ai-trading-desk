"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStressScenarios = runStressScenarios;
const financial_1 = require("../calculations/financial");
const market_1 = require("../calculations/market");
const percentMultiplier = (pct) => 1 + pct / 100;
function baseScenario(id, name, description, assumptions, limitations = []) {
    return {
        id,
        name,
        description,
        assumptions,
        shockedReferencePrice: null,
        shockedTokenPrice: null,
        estimatedPnlUsd: null,
        estimatedPnlPct: null,
        basisImpact: null,
        liquidityImpact: null,
        applicable: true,
        limitations
    };
}
function runStressScenarios(trade, state, config) {
    const market = baseScenario("MARKET_RISK", "Market risk", "Direct adverse movement in the relevant reference/token exposure.", [`Assume the relevant market moves ${config.marketShockPct}% against the position.`]);
    if (state.instrumentPrice <= 0)
        market.applicable = false;
    const marketToken = (0, financial_1.roundFinancial)(state.instrumentPrice * percentMultiplier(config.marketShockPct));
    market.shockedTokenPrice = marketToken;
    market.shockedReferencePrice = state.referencePrice === null ? null : (0, financial_1.roundFinancial)(state.referencePrice * percentMultiplier(config.marketShockPct));
    market.estimatedPnlUsd = (0, financial_1.calculateScenarioPnl)(trade.direction, trade.quantity, trade.entryPrice, marketToken);
    market.estimatedPnlPct = (0, financial_1.calculatePnlPct)(market.estimatedPnlUsd, trade.positionSizeUsd);
    const contagion = baseScenario("CRYPTO_CONTAGION", "Crypto contagion", "BTC falls sharply while the token remains tradable.", [
        `Assume BTC falls ${config.btcShockPct}%.`,
        `Assume the token experiences a direct ${config.cryptoContagionTokenShockPct}% adverse shock.`,
        "No beta is inferred."
    ]);
    if (state.btcPrice === null) {
        contagion.applicable = false;
        contagion.limitations.push("BTC price is unavailable.");
    }
    else {
        contagion.shockedTokenPrice = (0, financial_1.roundFinancial)(state.instrumentPrice * percentMultiplier(config.cryptoContagionTokenShockPct));
        contagion.estimatedPnlUsd = (0, financial_1.calculateScenarioPnl)(trade.direction, trade.quantity, trade.entryPrice, contagion.shockedTokenPrice);
        contagion.estimatedPnlPct = (0, financial_1.calculatePnlPct)(contagion.estimatedPnlUsd, trade.positionSizeUsd);
    }
    const micro = baseScenario("TOKEN_MICROSTRUCTURE", "Token microstructure", "Basis widens while visible top-of-book liquidity deteriorates.", [
        `Widen basis by ${config.basisWideningPctPoints} percentage points.`,
        `Reduce visible bid/ask size by ${config.liquidityReductionPct}%.`
    ]);
    if (state.referencePrice === null) {
        micro.applicable = false;
        micro.limitations.push("Reference price is unavailable, so basis stress cannot be calculated.");
    }
    else {
        const currentBasisPct = state.basisPct ?? ((state.instrumentPrice / state.referencePrice) - 1) * 100;
        const stressedBasisPct = currentBasisPct + config.basisWideningPctPoints;
        micro.basisImpact = (0, financial_1.roundFinancial)(stressedBasisPct - currentBasisPct);
        micro.shockedReferencePrice = state.referencePrice;
        micro.shockedTokenPrice = (0, financial_1.roundFinancial)(state.referencePrice * percentMultiplier(stressedBasisPct));
        micro.estimatedPnlUsd = (0, financial_1.calculateScenarioPnl)(trade.direction, trade.quantity, trade.entryPrice, micro.shockedTokenPrice);
        micro.estimatedPnlPct = (0, financial_1.calculatePnlPct)(micro.estimatedPnlUsd, trade.positionSizeUsd);
        micro.liquidityImpact = -config.liquidityReductionPct;
        if (state.bidSize !== null && state.askSize !== null) {
            const stressedLiquidity = (0, market_1.classifyLiquidity)(state.spreadPct, state.bidSize * percentMultiplier(-config.liquidityReductionPct), state.askSize * percentMultiplier(-config.liquidityReductionPct), {
                spreadWarnPercent: config.liquiditySpreadWarnPercent,
                minVisibleBidSize: config.minVisibleBidSize,
                minVisibleAskSize: config.minVisibleAskSize
            });
            micro.limitations.push(`Stressed top-of-book liquidity class: ${stressedLiquidity}.`);
        }
        else {
            micro.limitations.push("Top-of-book sizes are unavailable; stressed liquidity class cannot be determined.");
        }
    }
    const combined = baseScenario("COMBINED_SHOCK", "Combined shock", "Market risk, crypto contagion, and token microstructure deterioration occur together.", [
        `Reference market shock: ${config.marketShockPct}%.`,
        `BTC shock: ${config.btcShockPct}%.`,
        `Direct token contagion shock: ${config.cryptoContagionTokenShockPct}%.`,
        `Basis widening: +${config.basisWideningPctPoints} percentage points.`,
        `Visible liquidity reduction: ${config.liquidityReductionPct}%.`
    ]);
    if (state.referencePrice === null || state.btcPrice === null) {
        combined.applicable = false;
        if (state.referencePrice === null)
            combined.limitations.push("Reference price is unavailable.");
        if (state.btcPrice === null)
            combined.limitations.push("BTC price is unavailable.");
    }
    else {
        const stressedReference = (0, financial_1.roundFinancial)(state.referencePrice * percentMultiplier(config.marketShockPct));
        const currentBasisPct = state.basisPct ?? ((state.instrumentPrice / state.referencePrice) - 1) * 100;
        const stressedBasisPct = currentBasisPct + config.basisWideningPctPoints;
        const stressedToken = (0, financial_1.roundFinancial)(stressedReference * percentMultiplier(stressedBasisPct) * percentMultiplier(config.cryptoContagionTokenShockPct));
        combined.shockedReferencePrice = stressedReference;
        combined.shockedTokenPrice = stressedToken;
        combined.basisImpact = (0, financial_1.roundFinancial)(config.basisWideningPctPoints);
        combined.liquidityImpact = -config.liquidityReductionPct;
        combined.estimatedPnlUsd = (0, financial_1.calculateScenarioPnl)(trade.direction, trade.quantity, trade.entryPrice, stressedToken);
        combined.estimatedPnlPct = (0, financial_1.calculatePnlPct)(combined.estimatedPnlUsd, trade.positionSizeUsd);
    }
    return [market, contagion, micro, combined];
}
