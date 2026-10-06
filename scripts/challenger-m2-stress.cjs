/**
 * Challenger M2 Empirical Stress Test Harness
 * 
 * Tests asset matching resilience, fallback behavior, exception safety,
 * and edge-case handling against retrieveHistoricalScenarios.
 */
const assert = require("node:assert/strict");
const {
  retrieveHistoricalScenarios,
  getSessionRiskMultiplier,
  HISTORICAL_GAP_DATABASE,
  getAllHistoricalPrecedents,
  getHistoricalPrecedentById
} = require("../dist-core/src/core/scenarios/retrieval.js");

console.log("===============================================================");
console.log("  CHALLENGER M2: HISTORICAL SCENARIO RETRIEVAL STRESS HARNESS  ");
console.log("===============================================================\n");

const summary = {
  passed: 0,
  bugsFound: 0,
  details: []
};

function testAssert(desc, fn) {
  try {
    fn();
    summary.passed++;
    console.log(`[PASS] ${desc}`);
  } catch (err) {
    summary.bugsFound++;
    console.log(`[BUG CONFIRMED] ${desc}`);
    console.log(`       Error: ${err.message}`);
    summary.details.push({ desc, error: err.message });
  }
}

// -------------------------------------------------------------
// 1. BASELINE ROBUSTNESS (Passed Features)
// -------------------------------------------------------------
console.log("--- 1. Baseline Edge Cases (Whitespace, Casing, Concatenated USDT) ---");

testAssert("Empty string asset returns FALLBACK with DEFAULT asset", () => {
  const res = retrieveHistoricalScenarios({ asset: "", entryPrice: 100, size: 1000 });
  assert.equal(res.matchConfidence, "FALLBACK");
  assert.equal(res.matchedAsset, "DEFAULT");
});

testAssert("Whitespace-only asset returns FALLBACK with DEFAULT asset", () => {
  const res = retrieveHistoricalScenarios({ asset: "   \t\n  ", entryPrice: 100, size: 1000 });
  assert.equal(res.matchConfidence, "FALLBACK");
  assert.equal(res.matchedAsset, "DEFAULT");
});

testAssert("Padded ticker '  rMSTR  ' trims and matches EXACT rMSTR", () => {
  const res = retrieveHistoricalScenarios({ asset: "  rMSTR  ", entryPrice: 350, size: 1000 });
  assert.equal(res.matchConfidence, "EXACT");
  assert.equal(res.matchedAsset, "rMSTR");
});

testAssert("Lowercase ticker 'rnvda' matches EXACT rNVDA", () => {
  const res = retrieveHistoricalScenarios({ asset: "rnvda", entryPrice: 120, size: 1000 });
  assert.equal(res.matchConfidence, "EXACT");
  assert.equal(res.matchedAsset, "rNVDA");
});

testAssert("Uppercase ticker 'RNVDA' matches EXACT rNVDA", () => {
  const res = retrieveHistoricalScenarios({ asset: "RNVDA", entryPrice: 120, size: 1000 });
  assert.equal(res.matchConfidence, "EXACT");
  assert.equal(res.matchedAsset, "rNVDA");
});

testAssert("Bare ticker 'TSLA' matches EXACT rTSLA", () => {
  const res = retrieveHistoricalScenarios({ asset: "TSLA", entryPrice: 200, size: 1000 });
  assert.equal(res.matchConfidence, "EXACT");
  assert.equal(res.matchedAsset, "rTSLA");
});

testAssert("Bare lowercase ticker 'tsla' matches EXACT rTSLA", () => {
  const res = retrieveHistoricalScenarios({ asset: "tsla", entryPrice: 200, size: 1000 });
  assert.equal(res.matchConfidence, "EXACT");
  assert.equal(res.matchedAsset, "rTSLA");
});

testAssert("Concatenated pair 'rTSLAUSDT' matches EXACT rTSLA", () => {
  const res = retrieveHistoricalScenarios({ asset: "rTSLAUSDT", entryPrice: 200, size: 1000 });
  assert.equal(res.matchConfidence, "EXACT");
  assert.equal(res.matchedAsset, "rTSLA");
});

testAssert("Concatenated bare pair 'TSLAUSDT' matches EXACT rTSLA", () => {
  const res = retrieveHistoricalScenarios({ asset: "TSLAUSDT", entryPrice: 200, size: 1000 });
  assert.equal(res.matchConfidence, "EXACT");
  assert.equal(res.matchedAsset, "rTSLA");
});

// -------------------------------------------------------------
// 2. FALLBACK GUARANTEES FOR UNKNOWN TOKENS
// -------------------------------------------------------------
console.log("\n--- 2. Fallback Guarantees for Unknown Tokens ---");

const unknownTokens = [
  "rUNKNOWN_TOKEN_XYZ",
  "RANDOM_COIN_123",
  "XYZ_NONEXISTENT",
  "FOOBAR_TOKEN",
  "___???___"
];

for (const token of unknownTokens) {
  testAssert(`Unknown token '${token}' fallback guarantees`, () => {
    const res = retrieveHistoricalScenarios({ asset: token, entryPrice: 50, size: 2500, isWeekend: true });
    assert.equal(res.matchConfidence, "FALLBACK");
    assert.equal(res.matchedAsset, "DEFAULT");
    assert.ok(res.precedents.length >= 2);
    assert.ok(res.precedents.some((p) => p.id === "PREC-DEFAULT-WEEKEND-GAP"));
    assert.ok(res.precedents.some((p) => p.id === "PREC-DEFAULT-HOLIDAY-GAP"));

    const m = res.empiricalMetrics;
    assert.ok(Number.isFinite(m.averageBasisShiftBps) && m.averageBasisShiftBps > 0);
    assert.ok(Number.isFinite(m.maxHistoricalDrawdownPct) && m.maxHistoricalDrawdownPct < 0);
    assert.ok(["UP", "DOWN", "NEUTRAL"].includes(m.expectedGapDirection));
    assert.ok(Number.isFinite(m.projectedPnlPct));
    assert.ok(Number.isFinite(m.projectedPnlUsd));
    assert.ok(Number.isFinite(m.estimatedReAnchorHours) && m.estimatedReAnchorHours > 0);
  });
}

// -------------------------------------------------------------
// 3. EMPIRICALLY REPRODUCED DEFECTS / EDGE-CASE FAILURES
// -------------------------------------------------------------
console.log("\n--- 3. Stress-Testing Edge Cases & Defect Reproduction ---");

testAssert("Pair format with slash 'rNVDA/USDT' must match EXACT rNVDA (BUG: drops to FALLBACK)", () => {
  const res = retrieveHistoricalScenarios({ asset: "rNVDA/USDT", entryPrice: 120, size: 1000 });
  assert.equal(
    res.matchConfidence,
    "EXACT",
    `Expected EXACT match for 'rNVDA/USDT', but got ${res.matchConfidence} with matchedAsset=${res.matchedAsset}`
  );
  assert.equal(res.matchedAsset, "rNVDA");
});

testAssert("Bare pair format with slash 'NVDA/USDT' must match EXACT rNVDA (BUG: drops to FALLBACK)", () => {
  const res = retrieveHistoricalScenarios({ asset: "NVDA/USDT", entryPrice: 120, size: 1000 });
  assert.equal(
    res.matchConfidence,
    "EXACT",
    `Expected EXACT match for 'NVDA/USDT', but got ${res.matchConfidence} with matchedAsset=${res.matchedAsset}`
  );
  assert.equal(res.matchedAsset, "rNVDA");
});

testAssert("Direction casing: lowercase 'short' must calculate SHORT position PnL (BUG: evaluates as LONG)", () => {
  const longRes = retrieveHistoricalScenarios({ asset: "rNVDA", entryPrice: 100, size: 1000, direction: "LONG" });
  const shortUpper = retrieveHistoricalScenarios({ asset: "rNVDA", entryPrice: 100, size: 1000, direction: "SHORT" });
  const shortLower = retrieveHistoricalScenarios({ asset: "rNVDA", entryPrice: 100, size: 1000, direction: "short" });

  assert.equal(
    shortLower.empiricalMetrics.projectedPnlUsd,
    shortUpper.empiricalMetrics.projectedPnlUsd,
    `direction 'short' yielded PnL ${shortLower.empiricalMetrics.projectedPnlUsd} (same as LONG ${longRes.empiricalMetrics.projectedPnlUsd}) instead of SHORT ${shortUpper.empiricalMetrics.projectedPnlUsd}`
  );
});

testAssert("Exception safety: entryPrice = Infinity must not crash (BUG: unhandled exception in assertPositive)", () => {
  const res = retrieveHistoricalScenarios({ asset: "rNVDA", entryPrice: Infinity, size: 1000 });
  assert.ok(Number.isFinite(res.empiricalMetrics.averageBasisShiftBps));
});

testAssert("Exception safety: size = Infinity must not crash (BUG: unhandled exception in assertPositive)", () => {
  const res = retrieveHistoricalScenarios({ asset: "rNVDA", entryPrice: 100, size: Infinity });
  assert.ok(Number.isFinite(res.empiricalMetrics.averageBasisShiftBps));
});

testAssert("Exception safety: null input must not crash with TypeError (BUG: unhandled TypeError)", () => {
  const res = retrieveHistoricalScenarios(null);
  assert.equal(res.matchConfidence, "FALLBACK");
});

console.log("\n===============================================================");
console.log(`TOTAL CHECKS: ${summary.passed + summary.bugsFound}`);
console.log(`PASSED:       ${summary.passed}`);
console.log(`BUGS FOUND:   ${summary.bugsFound}`);
console.log("===============================================================\n");
