const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseNaturalLanguageTrade } = require("../dist-core/src/core/trade/parser.js");

test("parses full reference prompt correctly without clarification", () => {
  const input = "I'm thinking about buying $2,000 of rNVDA before Monday because AI infrastructure demand still looks strong. I already have $10,000 of BTC exposure. Stress-test this trade.";
  const result = parseNaturalLanguageTrade(input, 219.22);

  assert.equal(result.requiresClarification, false);
  assert.ok(result.normalizedTrade);

  const t = result.normalizedTrade;
  assert.equal(t.asset, "rNVDA");
  assert.equal(t.canonicalSymbol, "rNVDAUSDT");
  assert.equal(t.referenceAsset, "NVDA");
  assert.equal(t.direction, "LONG");
  assert.equal(t.positionSizeUsd, 2000);
  assert.equal(t.entryPrice, 219.22);
  assert.ok(t.quantity > 0);
  assert.equal(t.relevantExposure.length, 1);
  assert.equal(t.relevantExposure[0].asset, "BTC");
  assert.equal(t.relevantExposure[0].valueUsd, 10000);

  assert.ok(result.userProvidedFields.includes("direction"));
  assert.ok(result.userProvidedFields.includes("positionSizeUsd"));
  assert.ok(result.userProvidedFields.includes("thesis"));
  assert.ok(result.derivedFields.includes("canonicalSymbol"));
  assert.ok(result.derivedFields.includes("quantity (calculated from position size and entry price)"));
});

test("asks clarification when position size is missing", () => {
  const input = "I want to buy rNVDA because AI demand is strong.";
  const result = parseNaturalLanguageTrade(input);

  assert.equal(result.requiresClarification, true);
  assert.equal(result.clarificationField, "positionSizeUsd");
  assert.ok(result.clarificationQuestion.includes("position size"));
  assert.equal(result.normalizedTrade, null);
});

test("asks clarification when direction is missing", () => {
  const input = "Considering $5,000 in rNVDA due to high AI chip volume.";
  const result = parseNaturalLanguageTrade(input);

  assert.equal(result.requiresClarification, true);
  assert.equal(result.clarificationField, "direction");
  assert.ok(result.clarificationQuestion.includes("LONG") || result.clarificationQuestion.includes("SHORT"));
});

test("asks clarification when thesis is missing", () => {
  const input = "Buy $1,000 rNVDA.";
  const result = parseNaturalLanguageTrade(input);

  assert.equal(result.requiresClarification, true);
  assert.equal(result.clarificationField, "thesis");
  assert.ok(result.clarificationQuestion.includes("thesis"));
});
