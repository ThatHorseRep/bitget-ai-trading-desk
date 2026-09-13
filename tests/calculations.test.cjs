const assert = require("node:assert/strict");
const { test } = require("node:test");
const f = require("../dist-core/src/core/calculations/financial.js");

const expectThrows = (fn) => assert.throws(fn);

test("position quantity calculation", () => {
  assert.equal(f.calculatePositionQuantity(2000, 120), 16.66666667);
  assert.ok(f.calculatePositionQuantity(0.01, 120) > 0);
  assert.ok(f.calculatePositionQuantity(1_000_000, 120) > 0);
  expectThrows(() => f.calculatePositionQuantity(0, 120));
  expectThrows(() => f.calculatePositionQuantity(2000, 0));
  expectThrows(() => f.calculatePositionQuantity(-1, 120));
});

test("spread and spread percentage", () => {
  assert.equal(f.calculateSpread(120.6, 119.4), 1.2);
  assert.equal(f.calculateSpreadPct(120.6, 119.4), 1);
  expectThrows(() => f.calculateSpread(119, 120));
  expectThrows(() => f.calculateSpreadPct(119, 120));
});

test("basis", () => {
  const result = f.calculateBasis(120, 117);
  assert.equal(result.basis, 3);
  assert.equal(result.basisPct, 2.56410256);
  expectThrows(() => f.calculateBasis(120, 0));
  expectThrows(() => f.calculateBasis(-1, 117));
});

test("scenario P&L for long and short", () => {
  assert.equal(f.calculateScenarioPnl("LONG", 10, 100, 90), -100);
  assert.equal(f.calculateScenarioPnl("SHORT", 10, 100, 90), 100);
  assert.equal(f.calculatePnlPct(-100, 1000), -10);
});
