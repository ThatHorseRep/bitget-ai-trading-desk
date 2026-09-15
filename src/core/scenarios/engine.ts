import type { MarketState } from "../../domain/market/types";
import type { NormalizedTrade } from "../../domain/trade/types";
import type { StressScenario, ScenarioConfig } from "../../domain/scenarios/types";
import { calculatePnlPct, calculateScenarioPnl, roundFinancial } from "../calculations/financial";
import { classifyLiquidity } from "../calculations/market";

const percentMultiplier = (pct: number) => 1 + pct / 100;
const boundedPrice = (price: number) => Math.max(0.00000001, price);

function baseScenario(
  id: StressScenario["id"],
  name: string,
  description: string,
  assumptions: string[],
  limitations: string[] = []
): StressScenario {
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

export function runStressScenarios(trade: NormalizedTrade, state: MarketState, config: ScenarioConfig): StressScenario[] {
  const hasValidTradePosition = trade.quantity > 0 && trade.entryPrice > 0 && trade.positionSizeUsd > 0;
  
  // 1. MARKET_RISK
  const adverseMarketShockPct = trade.direction === "LONG" ? -Math.abs(config.marketShockPct) : Math.abs(config.marketShockPct);
  const market = baseScenario(
    "MARKET_RISK",
    "Market risk",
    "Direct adverse movement in the relevant reference/token exposure.",
    [`Assume the relevant market moves ${Math.abs(config.marketShockPct)}% against the position (applied as ${adverseMarketShockPct}%).`]
  );
  
  if (!state.instrumentPrice || state.instrumentPrice <= 0) {
    market.applicable = false;
    market.limitations.push("Instrument price is unavailable or invalid.");
  } else if (!hasValidTradePosition) {
    market.applicable = false;
    market.limitations.push("Trade position size, quantity, or entry price is invalid.");
  } else {
    market.shockedTokenPrice = roundFinancial(boundedPrice(state.instrumentPrice * percentMultiplier(adverseMarketShockPct)));
    market.shockedReferencePrice = state.referencePrice === null ? null : roundFinancial(boundedPrice(state.referencePrice * percentMultiplier(adverseMarketShockPct)));
    market.estimatedPnlUsd = calculateScenarioPnl(trade.direction, trade.quantity, trade.entryPrice, market.shockedTokenPrice);
    market.estimatedPnlPct = calculatePnlPct(market.estimatedPnlUsd, trade.positionSizeUsd);
  }

  const isTokenizedEquity = trade.instrumentType === "TOKENIZED_EQUITY";

  // 2. CRYPTO_CONTAGION
  const adverseContagionShockPct = trade.direction === "LONG" ? -Math.abs(config.cryptoContagionTokenShockPct) : Math.abs(config.cryptoContagionTokenShockPct);
  const contagion = baseScenario(
    "CRYPTO_CONTAGION",
    "Crypto contagion",
    "BTC falls sharply while the token remains tradable.",
    [
      `Assume BTC falls ${config.btcShockPct}%.`,
      `Assume the token experiences a direct ${Math.abs(config.cryptoContagionTokenShockPct)}% adverse shock (applied as ${adverseContagionShockPct}%).`,
      "No beta is inferred."
    ]
  );
  if (trade.instrumentType === "UNSUPPORTED") {
    contagion.applicable = false;
    contagion.limitations.push("Crypto-contagion scenario is only defined for supported crypto or tokenized-equity trades.");
  } else if (state.btcPrice === null || state.btcPrice <= 0) {
    contagion.applicable = false;
    contagion.limitations.push("BTC price is unavailable or invalid.");
  } else if (!state.instrumentPrice || state.instrumentPrice <= 0) {
    contagion.applicable = false;
    contagion.limitations.push("Instrument price is unavailable or invalid.");
  } else if (!hasValidTradePosition) {
    contagion.applicable = false;
    contagion.limitations.push("Trade position size, quantity, or entry price is invalid.");
  } else {
    contagion.shockedTokenPrice = roundFinancial(boundedPrice(state.instrumentPrice * percentMultiplier(adverseContagionShockPct)));
    contagion.estimatedPnlUsd = calculateScenarioPnl(trade.direction, trade.quantity, trade.entryPrice, contagion.shockedTokenPrice);
    contagion.estimatedPnlPct = calculatePnlPct(contagion.estimatedPnlUsd, trade.positionSizeUsd);
  }

  // 3. TOKEN_MICROSTRUCTURE
  const basisShift = trade.direction === "LONG" ? -Math.abs(config.basisWideningPctPoints) : Math.abs(config.basisWideningPctPoints);
  const micro = baseScenario(
    "TOKEN_MICROSTRUCTURE",
    "Token microstructure",
    "Basis widens while visible top-of-book liquidity deteriorates.",
    [
      `Widen basis by ${Math.abs(config.basisWideningPctPoints)} percentage points adversely (applied as ${basisShift}).`,
      `Reduce visible bid/ask size by ${config.liquidityReductionPct}%.`
    ]
  );
  if (!isTokenizedEquity) {
    micro.applicable = false;
    micro.limitations.push("Token-microstructure scenario is only defined for tokenized-equity trades in the MVP.");
  } else if (state.referencePrice === null || state.referencePrice <= 0) {
    micro.applicable = false;
    micro.limitations.push("Reference price is unavailable or invalid, so basis stress cannot be calculated.");
  } else if (!state.instrumentPrice || state.instrumentPrice <= 0) {
    micro.applicable = false;
    micro.limitations.push("Instrument price is unavailable or invalid.");
  } else if (!hasValidTradePosition) {
    micro.applicable = false;
    micro.limitations.push("Trade position size, quantity, or entry price is invalid.");
  } else {
    const currentBasisPct = state.basisPct ?? ((state.instrumentPrice / state.referencePrice) - 1) * 100;
    const stressedBasisPct = currentBasisPct + basisShift;
    micro.basisImpact = roundFinancial(basisShift);
    micro.shockedReferencePrice = state.referencePrice;
    micro.shockedTokenPrice = roundFinancial(boundedPrice(state.referencePrice * percentMultiplier(stressedBasisPct)));
    micro.estimatedPnlUsd = calculateScenarioPnl(trade.direction, trade.quantity, trade.entryPrice, micro.shockedTokenPrice);
    micro.estimatedPnlPct = calculatePnlPct(micro.estimatedPnlUsd, trade.positionSizeUsd);
    micro.liquidityImpact = -Math.abs(config.liquidityReductionPct);
    
    if (state.bidSize !== null && state.askSize !== null && state.bidSize >= 0 && state.askSize >= 0) {
      const stressedLiquidity = classifyLiquidity(
        state.spreadPct,
        state.bidSize * percentMultiplier(micro.liquidityImpact),
        state.askSize * percentMultiplier(micro.liquidityImpact),
        {
          spreadWarnPercent: config.liquiditySpreadWarnPercent,
          minVisibleBidSize: config.minVisibleBidSize,
          minVisibleAskSize: config.minVisibleAskSize
        }
      );
      micro.limitations.push(`Stressed top-of-book liquidity class: ${stressedLiquidity}.`);
    } else {
      micro.limitations.push("Top-of-book sizes are unavailable; stressed liquidity class cannot be determined.");
    }
  }

  // 4. COMBINED_SHOCK
  const combined = baseScenario(
    "COMBINED_SHOCK",
    "Combined shock",
    "Market risk, crypto contagion, and token microstructure deterioration occur together.",
    [
      `Reference market shock: applied as ${adverseMarketShockPct}%.`,
      `BTC shock: ${config.btcShockPct}%.`,
      `Direct token contagion shock: applied as ${adverseContagionShockPct}%.`,
      `Basis widening: ${basisShift > 0 ? "+" : ""}${basisShift} percentage points (adverse directional shift).`,
      `Visible liquidity reduction: ${Math.abs(config.liquidityReductionPct)}%.`
    ]
  );
  if (!isTokenizedEquity) {
    combined.applicable = false;
    combined.limitations.push("Combined tokenized-equity stress is only defined for tokenized-equity trades in the MVP.");
  } else if (state.referencePrice === null || state.referencePrice <= 0) {
    combined.applicable = false;
    combined.limitations.push("Reference price is unavailable or invalid.");
  } else if (state.btcPrice === null || state.btcPrice <= 0) {
    combined.applicable = false;
    combined.limitations.push("BTC price is unavailable or invalid.");
  } else if (!state.instrumentPrice || state.instrumentPrice <= 0) {
    combined.applicable = false;
    combined.limitations.push("Instrument price is unavailable or invalid.");
  } else if (!hasValidTradePosition) {
    combined.applicable = false;
    combined.limitations.push("Trade position size, quantity, or entry price is invalid.");
  } else {
    const currentBasisPct = state.basisPct ?? ((state.instrumentPrice / state.referencePrice) - 1) * 100;
    const stressedBasisPct = currentBasisPct + basisShift;
    
    // Combine shocks: 
    // 1. Reference market shock applies to the reference price.
    // 2. Apply basis shift from the stressed reference to get base token price.
    // 3. Apply token-specific contagion shock on top of it.
    const stressedReference = roundFinancial(boundedPrice(state.referencePrice * percentMultiplier(adverseMarketShockPct)));
    const baseTokenPrice = boundedPrice(stressedReference * percentMultiplier(stressedBasisPct));
    const stressedToken = roundFinancial(boundedPrice(baseTokenPrice * percentMultiplier(adverseContagionShockPct)));
    
    combined.shockedReferencePrice = stressedReference;
    combined.shockedTokenPrice = stressedToken;
    combined.basisImpact = roundFinancial(basisShift);
    combined.liquidityImpact = -Math.abs(config.liquidityReductionPct);
    
    if (state.bidSize !== null && state.askSize !== null && state.bidSize >= 0 && state.askSize >= 0) {
      const stressedLiquidity = classifyLiquidity(
        state.spreadPct,
        state.bidSize * percentMultiplier(combined.liquidityImpact),
        state.askSize * percentMultiplier(combined.liquidityImpact),
        {
          spreadWarnPercent: config.liquiditySpreadWarnPercent,
          minVisibleBidSize: config.minVisibleBidSize,
          minVisibleAskSize: config.minVisibleAskSize
        }
      );
      combined.limitations.push(`Stressed top-of-book liquidity class: ${stressedLiquidity}.`);
    } else {
      combined.limitations.push("Top-of-book sizes are unavailable; stressed liquidity class cannot be determined.");
    }

    combined.estimatedPnlUsd = calculateScenarioPnl(trade.direction, trade.quantity, trade.entryPrice, stressedToken);
    combined.estimatedPnlPct = calculatePnlPct(combined.estimatedPnlUsd, trade.positionSizeUsd);
  }

  // 5. THESIS_FAILURE
  const thesisFailure = baseScenario(
    "THESIS_FAILURE",
    "Thesis failure",
    "The user's key catalyst or critical thesis dependency fails.",
    ["Qualitative evaluation required based on specific thesis dependencies."]
  );
  if (!hasValidTradePosition) {
    thesisFailure.applicable = false;
    thesisFailure.limitations.push("Trade position size, quantity, or entry price is invalid.");
  } else {
    thesisFailure.limitations.push("Quantitative impact cannot be calculated without mapping the failure to a specific price shock.");
  }

  return [market, contagion, micro, combined, thesisFailure];
}


