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
  assert.equal(result.tradeIdea.asset, "rNVDAUSDT");
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

test("matrix 13: causal clause wins over earlier soft intent marker (canonical demo statement)", () => {
  const result = parseNaturalLanguageTrade(
    "I'm thinking about buying $2,000 of rNVDA before Monday because AI infrastructure demand still looks strong. I already have $10,000 of BTC exposure. Stress-test this trade."
  );
  assert.equal(result.tradeIdea.direction, "LONG");
  assert.equal(result.tradeIdea.positionSizeUsd, 2000);
  // The thesis must be the causal clause, not the intent fragment.
  assert.equal(result.tradeIdea.thesis, "AI infrastructure demand still looks strong");
});

test("matrix 14: 'since' clause captured as thesis", () => {
  const result = parseNaturalLanguageTrade("buy $1,000 of rNVDA since NVDA keeps beating earnings expectations.");
  assert.equal(result.tradeIdea.thesis, "NVDA keeps beating earnings expectations");
  assert.ok(result.userProvidedFields.includes("thesis"));
});

test("matrix 15: soft intent marker used only when no causal clause exists", () => {
  const result = parseNaturalLanguageTrade("I'm expecting NVDA to rally on AI capex. buy $2,000 of rNVDA.");
  assert.ok(result.tradeIdea.thesis.length > 0, "fallback thesis should not be empty");
  assert.ok(!result.tradeIdea.thesis.includes("buying"), "intent fragment must not masquerade as thesis when causal clause exists elsewhere");
});

test("matrix 16: 'my thesis is' explicit phrasing captured", () => {
  const result = parseNaturalLanguageTrade("buy $2,000 rNVDA. My thesis is AI demand keeps compounding into next year.");
  assert.equal(result.tradeIdea.thesis, "AI demand keeps compounding into next year");
});
