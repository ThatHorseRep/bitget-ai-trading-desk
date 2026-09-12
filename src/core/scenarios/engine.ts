import type { MarketState } from "../../domain/market/types";
import type { NormalizedTrade } from "../../domain/trade/types";
import type { StressScenario, ScenarioConfig } from "../../domain/scenarios/types";
import { calculatePnlPct, calculateScenarioPnl, roundFinancial } from "../calculations/financial";
import { classifyLiquidity } from "../calculations/market";

const percentMultiplier = (pct: number) => 1 + pct / 100;

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
  const market = baseScenario(
    "MARKET_RISK",
    "Market risk",
    "Direct adverse movement in the relevant reference/token exposure.",
    [`Assume the relevant market moves ${config.marketShockPct}% against the position.`]
  );
  if (state.instrumentPrice <= 0) market.applicable = false;
  const marketToken = roundFinancial(state.instrumentPrice * percentMultiplier(config.marketShockPct));
  market.shockedTokenPrice = marketToken;
  market.shockedReferencePrice = state.referencePrice === null ? null : roundFinancial(state.referencePrice * percentMultiplier(config.marketShockPct));
  market.estimatedPnlUsd = calculateScenarioPnl(trade.direction, trade.quantity, trade.entryPrice, marketToken);
  market.estimatedPnlPct = calculatePnlPct(market.estimatedPnlUsd, trade.positionSizeUsd);

  const isTokenizedEquity = trade.instrumentType === "TOKENIZED_EQUITY";

  const contagion = baseScenario(
    "CRYPTO_CONTAGION",
    "Crypto contagion",
    "BTC falls sharply while the token remains tradable.",
    [
      `Assume BTC falls ${config.btcShockPct}%.`,
      `Assume the token experiences a direct ${config.cryptoContagionTokenShockPct}% adverse shock.`,
      "No beta is inferred."
    ]
  );
  contagion.applicable = isTokenizedEquity;
  if (!isTokenizedEquity) {
    contagion.limitations.push("Crypto-contagion scenario is only defined for tokenized-equity trades in the MVP.");
  } else if (state.btcPrice === null) {
    contagion.applicable = false;
    contagion.limitations.push("BTC price is unavailable.");
  } else {
    contagion.shockedTokenPrice = roundFinancial(state.instrumentPrice * percentMultiplier(config.cryptoContagionTokenShockPct));
    contagion.estimatedPnlUsd = calculateScenarioPnl(trade.direction, trade.quantity, trade.entryPrice, contagion.shockedTokenPrice);
    contagion.estimatedPnlPct = calculatePnlPct(contagion.estimatedPnlUsd, trade.positionSizeUsd);
  }

  const micro = baseScenario(
    "TOKEN_MICROSTRUCTURE",
    "Token microstructure",
    "Basis widens while visible top-of-book liquidity deteriorates.",
    [
      `Widen basis by ${config.basisWideningPctPoints} percentage points.`,
      `Reduce visible bid/ask size by ${config.liquidityReductionPct}%.`
    ]
  );
  micro.applicable = isTokenizedEquity;
  if (!isTokenizedEquity) {
    micro.limitations.push("Token-microstructure scenario is only defined for tokenized-equity trades in the MVP.");
  } else if (state.referencePrice === null) {
    micro.applicable = false;
    micro.limitations.push("Reference price is unavailable, so basis stress cannot be calculated.");
  } else {
    const currentBasisPct = state.basisPct ?? ((state.instrumentPrice / state.referencePrice) - 1) * 100;
    const stressedBasisPct = currentBasisPct + config.basisWideningPctPoints;
    micro.basisImpact = roundFinancial(stressedBasisPct - currentBasisPct);
    micro.shockedReferencePrice = state.referencePrice;
    micro.shockedTokenPrice = roundFinancial(state.referencePrice * percentMultiplier(stressedBasisPct));
    micro.estimatedPnlUsd = calculateScenarioPnl(trade.direction, trade.quantity, trade.entryPrice, micro.shockedTokenPrice);
    micro.estimatedPnlPct = calculatePnlPct(micro.estimatedPnlUsd, trade.positionSizeUsd);
    micro.liquidityImpact = -config.liquidityReductionPct;
    if (state.bidSize !== null && state.askSize !== null) {
      const stressedLiquidity = classifyLiquidity(
        state.spreadPct,
        state.bidSize * percentMultiplier(-config.liquidityReductionPct),
        state.askSize * percentMultiplier(-config.liquidityReductionPct),
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

  const combined = baseScenario(
    "COMBINED_SHOCK",
    "Combined shock",
    "Market risk, crypto contagion, and token microstructure deterioration occur together.",
    [
      `Reference market shock: ${config.marketShockPct}%.`,
      `BTC shock: ${config.btcShockPct}%.`,
      `Direct token contagion shock: ${config.cryptoContagionTokenShockPct}%.`,
      `Basis widening: +${config.basisWideningPctPoints} percentage points.`,
      `Visible liquidity reduction: ${config.liquidityReductionPct}%.`
    ]
  );
  combined.applicable = isTokenizedEquity;
  if (!isTokenizedEquity) {
    combined.limitations.push("Combined tokenized-equity stress is only defined for tokenized-equity trades in the MVP.");
  } else if (state.referencePrice === null || state.btcPrice === null) {
    combined.applicable = false;
    if (state.referencePrice === null) combined.limitations.push("Reference price is unavailable.");
    if (state.btcPrice === null) combined.limitations.push("BTC price is unavailable.");
  } else {
    const stressedReference = roundFinancial(state.referencePrice * percentMultiplier(config.marketShockPct));
    const currentBasisPct = state.basisPct ?? ((state.instrumentPrice / state.referencePrice) - 1) * 100;
    const stressedBasisPct = currentBasisPct + config.basisWideningPctPoints;
    const stressedToken = roundFinancial(
      stressedReference * percentMultiplier(stressedBasisPct) * percentMultiplier(config.cryptoContagionTokenShockPct)
    );
    combined.shockedReferencePrice = stressedReference;
    combined.shockedTokenPrice = stressedToken;
    combined.basisImpact = roundFinancial(config.basisWideningPctPoints);
    combined.liquidityImpact = -config.liquidityReductionPct;
    combined.estimatedPnlUsd = calculateScenarioPnl(trade.direction, trade.quantity, trade.entryPrice, stressedToken);
    combined.estimatedPnlPct = calculatePnlPct(combined.estimatedPnlUsd, trade.positionSizeUsd);
  }

  return [market, contagion, micro, combined];
}
