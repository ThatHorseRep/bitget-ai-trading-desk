const assert = require("node:assert/strict");
const { test } = require("node:test");
const { runStressScenarios } = require("../dist-core/src/core/scenarios/engine.js");
const { SCENARIO_CONFIG } = require("../dist-core/src/core/scenarios/config.js");
const { buildRnvdaDemoTrade, rnvdaDemoMarketState } = require("../dist-core/src/fixtures/rnvda-demo.js");

const trade = buildRnvdaDemoTrade();

test("all MVP scenarios are produced including thesis failure", () => {
  const results = runStressScenarios(trade, rnvdaDemoMarketState, SCENARIO_CONFIG);
  assert.deepEqual(results.map((s) => s.id), ["MARKET_RISK", "CRYPTO_CONTAGION", "TOKEN_MICROSTRUCTURE", "COMBINED_SHOCK", "THESIS_FAILURE"]);
  assert.ok(results.every((s) => s.applicable));
});

test("market shock is deterministic", () => {
  const [market] = runStressScenarios(trade, rnvdaDemoMarketState, SCENARIO_CONFIG);
  assert.equal(market.shockedTokenPrice, 114);
  assert.equal(market.estimatedPnlPct, -5);
});

test("crypto contagion never invents beta", () => {
  const [, crypto] = runStressScenarios(trade, rnvdaDemoMarketState, SCENARIO_CONFIG);
  assert.equal(crypto.shockedTokenPrice, 115.2);
  assert.ok(crypto.assumptions.some((a) => a.includes("No beta is inferred")));
});

test("microstructure widening uses reference price and explicit basis assumption with adverse directional shift", () => {
  const [, , micro] = runStressScenarios(trade, rnvdaDemoMarketState, SCENARIO_CONFIG);
  assert.equal(micro.shockedTokenPrice, 116.49);
  assert.equal(micro.basisImpact, -3);
  assert.equal(micro.liquidityImpact, -50);
  assert.ok(micro.estimatedPnlUsd < 0, "Microstructure stress must be adverse (negative PnL) for a long position");
});

test("combined scenario composes explicit shocks and is adverse", () => {
  const results = runStressScenarios(trade, rnvdaDemoMarketState, SCENARIO_CONFIG);
  const combined = results[3];
  assert.ok(combined.shockedTokenPrice !== null);
  assert.equal(combined.basisImpact, -3);
  assert.equal(combined.liquidityImpact, -50);
  assert.ok(combined.estimatedPnlUsd < 0, "Combined stress must produce an adverse loss");
});

test("invariant: adverse long shock cannot improve long P&L", () => {
  const longTrade = { ...trade, direction: "LONG" };
  const results = runStressScenarios(longTrade, rnvdaDemoMarketState, SCENARIO_CONFIG);
  
  results.forEach(scenario => {
    if (scenario.applicable && scenario.estimatedPnlUsd !== null) {
      assert.ok(scenario.estimatedPnlUsd < 0, `${scenario.id} should not improve long P&L`);
    }
  });
});

test("invariant: adverse short shock cannot improve short P&L", () => {
  const shortTrade = { ...trade, direction: "SHORT" };
  const results = runStressScenarios(shortTrade, rnvdaDemoMarketState, SCENARIO_CONFIG);
  
  results.forEach(scenario => {
    if (scenario.applicable && scenario.estimatedPnlUsd !== null) {
      assert.ok(scenario.estimatedPnlUsd < 0, `${scenario.id} should not improve short P&L`);
    }
  });
});

test("invariant: scenario price must remain positive", () => {
  // Use a config that would result in a negative price
  const extremeConfig = {
    ...SCENARIO_CONFIG,
    marketShockPct: -150, // 150% drop
    cryptoContagionTokenShockPct: -120, // 120% drop
    basisWideningPctPoints: -150
  };
  const results = runStressScenarios(trade, rnvdaDemoMarketState, extremeConfig);
  
  results.forEach(scenario => {
    if (scenario.applicable) {
      if (scenario.shockedTokenPrice !== null) {
        assert.ok(scenario.shockedTokenPrice > 0, `${scenario.id} token price must be positive`);
      }
      if (scenario.shockedReferencePrice !== null) {
        assert.ok(scenario.shockedReferencePrice > 0, `${scenario.id} reference price must be positive`);
      }
    }
  });
});

test("invariant: zero/missing required inputs cannot produce a plausible-looking result", () => {
  const zeroState = { ...rnvdaDemoMarketState, instrumentPrice: 0, referencePrice: null, btcPrice: null };
  const results = runStressScenarios(trade, zeroState, SCENARIO_CONFIG);
  
  results.forEach(scenario => {
    if (scenario.id !== "THESIS_FAILURE") {
      assert.equal(scenario.applicable, false, `${scenario.id} should not be applicable with missing inputs`);
      assert.equal(scenario.estimatedPnlUsd, null, `${scenario.id} should not compute PnL`);
      assert.equal(scenario.shockedTokenPrice, null, `${scenario.id} should not compute token price`);
    }
  });
});
