const assert = require("node:assert/strict");
const { test } = require("node:test");
const { runStressScenarios } = require("../dist-core/src/core/scenarios/engine.js");
const { SCENARIO_CONFIG } = require("../dist-core/src/core/scenarios/config.js");
const { buildRnvdaDemoTrade, rnvdaDemoMarketState } = require("../dist-core/src/fixtures/rnvda-demo.js");

const trade = buildRnvdaDemoTrade();

test("all four MVP scenarios are produced", () => {
  const results = runStressScenarios(trade, rnvdaDemoMarketState, SCENARIO_CONFIG);
  assert.deepEqual(results.map((s) => s.id), ["MARKET_RISK", "CRYPTO_CONTAGION", "TOKEN_MICROSTRUCTURE", "COMBINED_SHOCK"]);
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

test("microstructure widening uses reference price and explicit basis assumption", () => {
  const [, , micro] = runStressScenarios(trade, rnvdaDemoMarketState, SCENARIO_CONFIG);
  assert.equal(micro.shockedTokenPrice, 123.51);
  assert.equal(micro.basisImpact, 3);
  assert.equal(micro.liquidityImpact, -50);
});

test("combined scenario composes explicit shocks", () => {
  const results = runStressScenarios(trade, rnvdaDemoMarketState, SCENARIO_CONFIG);
  const combined = results[3];
  assert.ok(combined.shockedTokenPrice !== null);
  assert.equal(combined.basisImpact, 3);
  assert.equal(combined.liquidityImpact, -50);
});
