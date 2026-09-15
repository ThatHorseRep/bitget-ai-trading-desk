const assert = require("node:assert/strict");
const { test } = require("node:test");
const { runStressScenarios } = require("../dist-core/src/core/scenarios/engine.js");
const { SCENARIO_CONFIG } = require("../dist-core/src/core/scenarios/config.js");
const { buildRnvdaDemoTrade, rnvdaDemoMarketState } = require("../dist-core/src/fixtures/rnvda-demo.js");
const fs = require("fs");

const roundFinancial = (value) => Math.round((value + Number.EPSILON) * 1e8) / 1e8;
const percentMultiplier = (pct) => 1 + pct / 100;
const boundedPrice = (price) => Math.max(0.00000001, price);
const calculateScenarioPnl = (direction, quantity, entryPrice, scenarioPrice) => {
  const pnl = direction === "LONG"
    ? quantity * (scenarioPrice - entryPrice)
    : quantity * (entryPrice - scenarioPrice);
  return roundFinancial(pnl);
};
const calculatePnlPct = (pnlUsd, positionSizeUsd) => roundFinancial((pnlUsd / positionSizeUsd) * 100);

const longTrade = buildRnvdaDemoTrade();
const shortTrade = { ...longTrade, direction: "SHORT" };

const longResults = runStressScenarios(longTrade, rnvdaDemoMarketState, SCENARIO_CONFIG);
const shortResults = runStressScenarios(shortTrade, rnvdaDemoMarketState, SCENARIO_CONFIG);

test("Truth Table Verification", () => {
  let md = "# Scenario Truth Table\n\n";
  
  md += "## Inputs\n";
  md += `- **Instrument Price:** ${rnvdaDemoMarketState.instrumentPrice}\n`;
  md += `- **Reference Price:** ${rnvdaDemoMarketState.referencePrice}\n`;
  md += `- **Basis Pct:** ${rnvdaDemoMarketState.basisPct}%\n`;
  md += `- **Quantity:** ${longTrade.quantity}\n`;
  md += `- **Position Size:** $${longTrade.positionSizeUsd}\n`;
  md += `- **Config Market Shock:** ${SCENARIO_CONFIG.marketShockPct}%\n`;
  md += `- **Config Contagion Shock:** ${SCENARIO_CONFIG.cryptoContagionTokenShockPct}%\n`;
  md += `- **Config Basis Widening:** ${SCENARIO_CONFIG.basisWideningPctPoints} points\n`;
  md += `- **Config Liquidity Reduction:** ${SCENARIO_CONFIG.liquidityReductionPct}%\n\n`;

  const headers = "| Direction | Scenario | Stressed Price | P&L USD | P&L % | Basis Shift | Liquidity Impact |\n|---|---|---|---|---|---|---|\n";
  md += headers;

  const verifyAndAppend = (direction, trade, results) => {
    for (const result of results) {
      // Independent Recomputation
      let expectedTokenPrice = null;
      let expectedBasisShift = null;
      let expectedLiquidityImpact = null;

      const adverseMarketPct = direction === "LONG" ? -Math.abs(SCENARIO_CONFIG.marketShockPct) : Math.abs(SCENARIO_CONFIG.marketShockPct);
      const adverseContagionPct = direction === "LONG" ? -Math.abs(SCENARIO_CONFIG.cryptoContagionTokenShockPct) : Math.abs(SCENARIO_CONFIG.cryptoContagionTokenShockPct);
      const basisShift = direction === "LONG" ? -Math.abs(SCENARIO_CONFIG.basisWideningPctPoints) : Math.abs(SCENARIO_CONFIG.basisWideningPctPoints);

      if (result.id === "MARKET_RISK") {
        expectedTokenPrice = roundFinancial(boundedPrice(rnvdaDemoMarketState.instrumentPrice * percentMultiplier(adverseMarketPct)));
      } else if (result.id === "CRYPTO_CONTAGION") {
        expectedTokenPrice = roundFinancial(boundedPrice(rnvdaDemoMarketState.instrumentPrice * percentMultiplier(adverseContagionPct)));
      } else if (result.id === "TOKEN_MICROSTRUCTURE") {
        expectedBasisShift = basisShift;
        const currentBasisPct = rnvdaDemoMarketState.basisPct ?? ((rnvdaDemoMarketState.instrumentPrice / rnvdaDemoMarketState.referencePrice) - 1) * 100;
        const stressedBasisPct = currentBasisPct + basisShift;
        expectedTokenPrice = roundFinancial(boundedPrice(rnvdaDemoMarketState.referencePrice * percentMultiplier(stressedBasisPct)));
        expectedLiquidityImpact = -Math.abs(SCENARIO_CONFIG.liquidityReductionPct);
      } else if (result.id === "COMBINED_SHOCK") {
        expectedBasisShift = basisShift;
        const currentBasisPct = rnvdaDemoMarketState.basisPct ?? ((rnvdaDemoMarketState.instrumentPrice / rnvdaDemoMarketState.referencePrice) - 1) * 100;
        const stressedBasisPct = currentBasisPct + basisShift;
        
        const stressedRef = roundFinancial(boundedPrice(rnvdaDemoMarketState.referencePrice * percentMultiplier(adverseMarketPct)));
        const baseToken = boundedPrice(stressedRef * percentMultiplier(stressedBasisPct));
        expectedTokenPrice = roundFinancial(boundedPrice(baseToken * percentMultiplier(adverseContagionPct)));
        expectedLiquidityImpact = -Math.abs(SCENARIO_CONFIG.liquidityReductionPct);
      }

      if (result.applicable && result.id !== "THESIS_FAILURE") {
        const expectedPnlUsd = calculateScenarioPnl(direction, trade.quantity, trade.entryPrice, expectedTokenPrice);
        const expectedPnlPct = calculatePnlPct(expectedPnlUsd, trade.positionSizeUsd);

        assert.equal(result.shockedTokenPrice, expectedTokenPrice, `Failed token price for ${direction} ${result.id}`);
        assert.equal(result.estimatedPnlUsd, expectedPnlUsd, `Failed PnL USD for ${direction} ${result.id}`);
        assert.equal(result.estimatedPnlPct, expectedPnlPct, `Failed PnL % for ${direction} ${result.id}`);
        if (expectedBasisShift !== null) assert.equal(result.basisImpact, expectedBasisShift, `Failed basis impact for ${direction} ${result.id}`);
        if (expectedLiquidityImpact !== null) assert.equal(result.liquidityImpact, expectedLiquidityImpact, `Failed liquidity impact for ${direction} ${result.id}`);

        md += `| ${direction} | ${result.id} | ${result.shockedTokenPrice} | ${result.estimatedPnlUsd} | ${result.estimatedPnlPct}% | ${result.basisImpact ?? 'N/A'} | ${result.liquidityImpact ?? 'N/A'}% |\n`;
      }
    }
  };

  verifyAndAppend("LONG", longTrade, longResults);
  verifyAndAppend("SHORT", shortTrade, shortResults);

  fs.writeFileSync("C:/Users/HP/.gemini/antigravity/brain/4fb5fedb-26ce-4b81-a54b-9f66988d31da/scenario_truth_table.md", md);
});
