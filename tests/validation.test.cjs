const assert = require("node:assert/strict");
const { test } = require("node:test");
const { validateMarketState, validateTradeIdea } = require("../dist-core/src/core/validation/runtime.js");
const { assessMarketDataQuality } = require("../dist-core/src/core/validation/dataQuality.js");
const { rnvdaDemoMarketState, rnvdaTradeIdea } = require("../dist-core/src/fixtures/rnvda-demo.js");

test("trade validation rejects invalid size and empty thesis", () => {
  const result = validateTradeIdea({ ...rnvdaTradeIdea, positionSizeUsd: 0, thesis: "" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("positionSizeUsd must be greater than zero"));
  assert.ok(result.errors.includes("thesis is required"));
});

test("market validation rejects invalid price relationships", () => {
  const result = validateMarketState({ ...rnvdaDemoMarketState, bid: 121, ask: 120 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("bid cannot exceed ask"));
  assert.equal(validateMarketState({ ...rnvdaDemoMarketState, bid: null }).valid, true);
  assert.equal(validateMarketState({ ...rnvdaDemoMarketState, ask: null }).valid, true);
});

test("data quality detects stale observations as degraded", () => {
  const result = assessMarketDataQuality(rnvdaDemoMarketState, new Date("2026-01-01T19:00:00.000Z"));
  assert.equal(result.status, "DEGRADED");
  assert.ok(result.issues.includes("instrument observation is stale"));
});

test("data quality treats missing optional context as degraded, not invalid", () => {
  const state = { ...rnvdaDemoMarketState, referencePrice: null, btcPrice: null };
  const result = assessMarketDataQuality(state, new Date("2026-01-01T18:00:30.000Z"));
  assert.equal(result.status, "DEGRADED");
  assert.ok(result.issues.includes("reference price unavailable"));
  assert.ok(result.issues.includes("BTC price unavailable"));
});

test("data quality rejects missing instrument price", () => {
  const result = assessMarketDataQuality({ ...rnvdaDemoMarketState, instrumentPrice: 0 }, new Date("2026-01-01T18:00:30.000Z"));
  assert.equal(result.status, "INVALID");
});
