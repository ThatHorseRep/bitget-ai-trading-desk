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
  // The USDT-suffixed spelling normalizes to the token symbol; the pair
  // symbol lives on canonicalSymbol (never "rNVDAUSDTUSDT").
  assert.equal(result.tradeIdea.asset, "rNVDA");
  assert.equal(result.normalizedTrade.canonicalSymbol, "rNVDAUSDT");
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

test("matrix 17: share quantity parsing -> derives position size from working price", () => {
  const result = parseNaturalLanguageTrade("buy 50 shares of rNVDA because AI demand is strong.", 140);
  assert.equal(result.requiresClarification, false);
  assert.equal(result.tradeIdea.direction, "LONG");
  assert.equal(result.tradeIdea.positionSizeUsd, 7000);
  assert.equal(result.tradeIdea.asset, "rNVDA");
});

test("matrix 18: token quantity phrasing with units", () => {
  const result = parseNaturalLanguageTrade("long 10 tokens of rNVDA at $150 because datacenter revenues are accelerating.");
  assert.equal(result.requiresClarification, false);
  assert.equal(result.tradeIdea.direction, "LONG");
  assert.equal(result.tradeIdea.positionSizeUsd, 1500);
  assert.equal(result.tradeIdea.asset, "rNVDA");
});

test("matrix 19: clock time after 'at' is not an entry price", () => {
  // Regression: greedy [\d,]+ under a trailing-only guard backtracked
  // to "1" out of "10:15", so the time became a $1 entry price and quantity 10,000.
  const result = parseNaturalLanguageTrade(
    "I plan to buy $10,000 rNVDA token during US cash market hours at 10:15 AM ET with 0.02% basis spread.",
    219.22
  );
  assert.ok(!result.userProvidedFields.includes("entryPrice"), "a clock time must not be captured as a price");
  assert.equal(result.normalizedTrade.entryPriceSource, "SYSTEM_DERIVED");
  assert.equal(result.normalizedTrade.entryPrice, 219.22);
});

test("matrix 20: percentage after 'at' is not an entry price", () => {
  // Regression: "elevated at 0.45%" backtracked to "0.4" and produced a $0.40 entry
  // price, which inflated quantity to 125,000 on a $50,000 position.
  const result = parseNaturalLanguageTrade(
    "I plan to buy $50,000 rNVDA token with 5x leverage during extended hours. Basis spread elevated at 0.45%.",
    219.22
  );
  assert.ok(!result.userProvidedFields.includes("entryPrice"), "a basis percentage must not be captured as a price");
  assert.equal(result.normalizedTrade.entryPrice, 219.22);
});

test("matrix 21: 12-hour clock times and bps are not entry prices", () => {
  for (const text of [
    "buy $2,000 rNVDA at 12:00 pm because AI demand is strong.",
    "buy $2,000 rNVDA at 100 bps because AI demand is strong.",
    "buy $2,000 rNVDA at 130.5% because AI demand is strong."
  ]) {
    const result = parseNaturalLanguageTrade(text, 219.22);
    assert.ok(
      !result.userProvidedFields.includes("entryPrice"),
      "time/percent/bps must not be captured as a price: " + text
    );
    assert.equal(result.normalizedTrade.entryPrice, 219.22);
  }
});

test("matrix 22: legitimate price forms survive the tightened matcher", () => {
  const cases = [
    ["buy $2,000 rNVDA at 130.50 because AI demand is strong.", 130.50],
    ["buy $2,000 rNVDA at 1,250 because AI demand is strong.", 1250],
    ["buy $2,000 rNVDA at 9.35 usd because AI demand is strong.", 9.35],
    ["buy $2,000 rNVDA at 2,500.50 because AI demand is strong.", 2500.50],
    ["buy $2,000 rNVDA at 120. because AI demand is strong.", 120],
    ["long 10 tokens of rNVDA at price of 44 because datacenter revenues are accelerating.", 44]
  ];
  for (const [text, expected] of cases) {
    const result = parseNaturalLanguageTrade(text, 219.22);
    assert.ok(result.userProvidedFields.includes("entryPrice"), "explicit price must be preserved: " + text);
    assert.equal(result.normalizedTrade.entryPrice, expected);
    assert.equal(result.normalizedTrade.entryPriceSource, "USER_PROVIDED");
  }
});

test("matrix 23: negative explicit price still requests entryPrice clarification", () => {
  const result = parseNaturalLanguageTrade("buy $2,000 rNVDA at -50 because AI demand is strong.");
  assert.equal(result.requiresClarification, true);
  assert.equal(result.clarificationField, "entryPrice");
});
