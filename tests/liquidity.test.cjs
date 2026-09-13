const assert = require("node:assert/strict");
const { test } = require("node:test");
const { classifyLiquidity } = require("../dist-core/src/core/calculations/market.js");

test("liquidity classification", () => {
  const config = { spreadWarnPercent: 1, minVisibleBidSize: 5, minVisibleAskSize: 5 };
  assert.equal(classifyLiquidity(0.5, 10, 10, config), "NORMAL");
  assert.equal(classifyLiquidity(1.5, 10, 10, config), "THIN");
  assert.equal(classifyLiquidity(0.5, 2, 10, config), "THIN");
  assert.equal(classifyLiquidity(null, 10, 10, config), "UNKNOWN");
  assert.equal(classifyLiquidity(0.5, null, 10, config), "UNKNOWN");
  assert.equal(classifyLiquidity(0.5, 10, null, config), "UNKNOWN");
});
