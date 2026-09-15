const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseNaturalLanguageTrade } = require("../dist-core/src/core/trade/parser.js");

test("matrix 1: buy $2,000 of rNVDA because...", () => {
  const result = parseNaturalLanguageTrade("buy $2,000 of rNVDA because AI demand is strong.");
  assert.equal(result.requiresClarification, false);
  assert.equal(result.tradeIdea.direction, "LONG");
  assert.equal(result.tradeIdea.positionSizeUsd, 2000);
  assert.equal(result.tradeIdea.asset, "rNVDA");
});

test("matrix 2: I'm long rNVDA for about two grand because...", () => {
  const result = parseNaturalLanguageTrade("I'm long rNVDA for about two grand because AI demand is strong.");
  assert.equal(result.requiresClarification, false);
  assert.equal(result.tradeIdea.direction, "LONG");
  assert.equal(result.tradeIdea.positionSizeUsd, 2000);
  assert.equal(result.tradeIdea.asset, "rNVDA");
});

test("matrix 3: go long rNVDAUSDT with 2000 USDT because...", () => {
  const result = parseNaturalLanguageTrade("go long rNVDAUSDT with 2000 USDT because AI demand is strong.");
  assert.equal(result.requiresClarification, false);
  assert.equal(result.tradeIdea.direction, "LONG");
  assert.equal(result.tradeIdea.positionSizeUsd, 2000);
  assert.equal(result.tradeIdea.asset, "rNVDA");
});

test("matrix 4: thinking about buying NVDA -> clarification on asset", () => {
  const result = parseNaturalLanguageTrade("thinking about buying $2,000 of NVDA because AI demand is strong.");
  assert.equal(result.requiresClarification, true);
  assert.equal(result.clarificationField, "asset");
});

test("matrix 5: missing size -> clarification", () => {
  const result = parseNaturalLanguageTrade("buy rNVDA because AI demand is strong.");
  assert.equal(result.requiresClarification, true);
  assert.equal(result.clarificationField, "positionSizeUsd");
});

test("matrix 6: missing direction -> clarification", () => {
  const result = parseNaturalLanguageTrade("$2,000 rNVDA because AI demand is strong.");
  assert.equal(result.requiresClarification, true);
  assert.equal(result.clarificationField, "direction");
});

test("matrix 7: missing asset -> clarification", () => {
  const result = parseNaturalLanguageTrade("buy $2,000 because AI demand is strong.");
  assert.equal(result.requiresClarification, true);
  assert.equal(result.clarificationField, "asset");
});

test("matrix 8: zero size -> reject/clarify", () => {
  const result = parseNaturalLanguageTrade("buy $0 rNVDA because AI demand is strong.");
  assert.equal(result.requiresClarification, true);
  assert.equal(result.clarificationField, "positionSizeUsd");
});

test("matrix 9: negative size -> reject/clarify", () => {
  const result = parseNaturalLanguageTrade("buy -$100 rNVDA because AI demand is strong.");
  assert.equal(result.requiresClarification, true);
  assert.equal(result.clarificationField, "positionSizeUsd");
});

test("matrix 10: invalid price -> reject safely", () => {
  const result = parseNaturalLanguageTrade("buy $2,000 rNVDA at -50 because AI demand is strong.");
  assert.equal(result.requiresClarification, true);
  assert.equal(result.clarificationField, "entryPrice");
});

test("matrix 11: explicit entry price -> preserve it exactly", () => {
  const result = parseNaturalLanguageTrade("buy $2,000 rNVDA at 130.50 because AI demand is strong.");
  assert.equal(result.requiresClarification, false);
  assert.equal(result.normalizedTrade.entryPrice, 130.50);
  assert.ok(result.userProvidedFields.includes("entryPrice"));
  assert.ok(!result.derivedFields.some(f => f.includes("entryPrice")));
});

test("matrix 12: no entry price -> derive from timestamped observation", () => {
  const result = parseNaturalLanguageTrade("buy $2,000 rNVDA because AI demand is strong.", 125);
  assert.equal(result.requiresClarification, false);
  assert.equal(result.normalizedTrade.entryPrice, 125);
  assert.ok(!result.userProvidedFields.includes("entryPrice"));
  assert.ok(result.derivedFields.some(f => f.includes("entryPrice") && f.includes("system-derived")));
});
