const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  retrieveHistoricalScenarios,
  getSessionRiskMultiplier,
  HISTORICAL_GAP_DATABASE,
  getAllHistoricalPrecedents,
  getHistoricalPrecedentById
} = require("../dist-core/src/core/scenarios/retrieval.js");
const { runStressScenarios } = require("../dist-core/src/core/scenarios/engine.js");
const { SCENARIO_CONFIG } = require("../dist-core/src/core/scenarios/config.js");
const { buildRnvdaDemoTrade, rnvdaDemoMarketState } = require("../dist-core/src/fixtures/rnvda-demo.js");
const { assessThesisVsPosition } = require("../dist-core/src/core/thesis/assessment.js");

test("Historical Database Catalog Integrity - contains 9 verified gap and dislocation events", () => {
  const database = getAllHistoricalPrecedents();
  assert.equal(database.length, 9, "Catalog must contain exactly 9 verified historical gap events");

  const requiredIds = [
    "PREC-YEN-CARRY-2024",
    "PREC-CRYPTO-DELEVERAGE-2021",
    "PREC-LABOR-DAY-2024",
    "PREC-TSLA-ROBOTAXI-2024",
    "PREC-SVB-BANKRUN-2023",
    "PREC-AMZN-OFFHOURS-2024",
    "PREC-AAPL-CROWDSTRIKE-2024",
    "PREC-DEFAULT-WEEKEND-GAP",
    "PREC-DEFAULT-HOLIDAY-GAP"
  ];

  for (const id of requiredIds) {
    const prec = getHistoricalPrecedentById(id);
    assert.ok(prec, `Precedent ${id} must exist in catalog`);
    assert.ok(prec.eventName.length > 5, `${id} must have a descriptive eventName`);
    assert.ok(prec.durationHours > 0, `${id} durationHours must be > 0`);
    assert.ok(prec.basisShiftBps > 0, `${id} basisShiftBps must be > 0`);
    assert.ok(prec.peakDrawdownPct < 0, `${id} peakDrawdownPct must be negative`);
    assert.ok(prec.referenceGapPct < 0, `${id} referenceGapPct must be negative`);
    assert.ok(prec.reAnchorHours > 0, `${id} reAnchorHours must be > 0`);
    assert.ok(prec.description.length > 10, `${id} must have detailed description`);
    assert.ok(["TOKENIZED_EQUITY", "CRYPTO", "SYNTHETIC", "MACRO"].includes(prec.assetClass));
  }
});

test("Scenario Retrieval - Exact asset matching across all 6 supported rTokens", () => {
  const testAssets = [
    { ticker: "rNVDA", expectedPrecedent: "August 2024 Yen-Carry Unwind" },
    { ticker: "rTSLA", expectedPrecedent: "October 2024 Robotaxi Weekend Premium Crush" },
    { ticker: "rMSTR", expectedPrecedent: "May 2021 Crypto Deleveraging Crash" },
    { ticker: "rCOIN", expectedPrecedent: "March 2023 SVB Run Weekend Depeg" },
    { ticker: "rAAPL", expectedPrecedent: "July 2024 Global IT Outage Tech Sector Dislocation" },
    { ticker: "rAMZN", expectedPrecedent: "Christmas/New Year 2024 Off-Hours Low Liquidity Squeeze" }
  ];

  for (const { ticker, expectedPrecedent } of testAssets) {
    const result = retrieveHistoricalScenarios({
      asset: ticker,
      entryPrice: 120,
      size: 10000,
      isWeekend: true
    });

    assert.equal(result.matchConfidence, "EXACT", `${ticker} must match with EXACT confidence`);
    assert.equal(result.matchedAsset, ticker, `matchedAsset must equal ${ticker}`);
    assert.ok(result.precedents.length >= 1, `${ticker} must return at least 1 matched precedent`);
    assert.ok(
      result.precedents.some((p) => p.eventName.includes(expectedPrecedent)),
      `${ticker} must contain expected precedent: ${expectedPrecedent}`
    );
  }
});

test("Scenario Retrieval - Ticker case tolerance and bare ticker resolution", () => {
  const lowerResult = retrieveHistoricalScenarios({
    asset: "rnvda",
    entryPrice: 120,
    size: 5000
  });
  assert.equal(lowerResult.matchConfidence, "EXACT");
  assert.equal(lowerResult.matchedAsset, "rNVDA");

  const bareResult = retrieveHistoricalScenarios({
    asset: "TSLA",
    entryPrice: 200,
    size: 5000
  });
  assert.equal(bareResult.matchConfidence, "EXACT");
  assert.equal(bareResult.matchedAsset, "rTSLA");

  const usdtResult = retrieveHistoricalScenarios({
    asset: "rMSTRUSDT",
    entryPrice: 350,
    size: 5000
  });
  assert.equal(usdtResult.matchConfidence, "EXACT");
  assert.equal(usdtResult.matchedAsset, "rMSTR");
});

test("Scenario Retrieval - Sector matching for unlisted crypto and tech tokens", () => {
  const cryptoResult = retrieveHistoricalScenarios({
    asset: "rBTC",
    entryPrice: 65000,
    size: 15000,
    isWeekend: true
  });
  assert.equal(cryptoResult.matchConfidence, "SECTOR");
  assert.equal(cryptoResult.matchedAsset, "CRYPTO");
  assert.ok(cryptoResult.precedents.some((p) => p.assetClass === "CRYPTO"));

  const techResult = retrieveHistoricalScenarios({
    asset: "rMSFT",
    entryPrice: 420,
    size: 10000
  });
  assert.equal(techResult.matchConfidence, "SECTOR");
  assert.equal(techResult.matchedAsset, "TOKENIZED_EQUITY");
  assert.ok(techResult.precedents.some((p) => p.assetClass === "TOKENIZED_EQUITY"));
});

test("Scenario Retrieval - Default fallback for unknown or unindexed assets", () => {
  const fallbackResult = retrieveHistoricalScenarios({
    asset: "rUNKNOWN_TOKEN_XYZ",
    entryPrice: 50,
    size: 2500,
    isWeekend: true
  });

  assert.equal(fallbackResult.matchConfidence, "FALLBACK");
  assert.equal(fallbackResult.matchedAsset, "DEFAULT");
  assert.ok(fallbackResult.precedents.length >= 2, "Fallback must return both weekend and holiday benchmark precedents");
  assert.ok(fallbackResult.precedents.some((p) => p.id === "PREC-DEFAULT-WEEKEND-GAP"));
  assert.ok(fallbackResult.precedents.some((p) => p.id === "PREC-DEFAULT-HOLIDAY-GAP"));
});

test("Empirical Metrics Calculation - Basis shifts, drawdowns, PnL, and re-anchor hours", () => {
  const result = retrieveHistoricalScenarios({
    asset: "rNVDA",
    entryPrice: 120,
    size: 10000,
    direction: "LONG",
    isWeekend: true
  });

  const m = result.empiricalMetrics;
  assert.ok(m.averageBasisShiftBps > 0, "averageBasisShiftBps must be positive");
  assert.ok(m.maxHistoricalDrawdownPct < 0, "maxHistoricalDrawdownPct must be negative");
  assert.equal(m.expectedGapDirection, "DOWN", "historical dislocation gaps must be directionally DOWN");
  assert.ok(m.projectedPnlPct < 0, "LONG trade under adverse gap down must have negative projected PnL %");
  assert.ok(m.projectedPnlUsd < 0, "LONG trade under adverse gap down must have negative projected PnL USD");
  assert.ok(m.estimatedReAnchorHours > 0, "estimatedReAnchorHours must be > 0");

  // Verify mathematical relationship: projectedPnlUsd = size * (projectedPnlPct / 100) within rounding
  const expectedPnlUsd = 10000 * (m.projectedPnlPct / 100);
  assert.ok(
    Math.abs(m.projectedPnlUsd - expectedPnlUsd) < 0.05,
    `projectedPnlUsd (${m.projectedPnlUsd}) should align with size * projectedPnlPct (${expectedPnlUsd})`
  );
});

test("Empirical Metrics - Directional short trade gains from underlying drop, offset by basis widening", () => {
  const longResult = retrieveHistoricalScenarios({
    asset: "rTSLA",
    entryPrice: 200,
    size: 10000,
    direction: "LONG",
    isWeekend: true
  });

  const shortResult = retrieveHistoricalScenarios({
    asset: "rTSLA",
    entryPrice: 200,
    size: 10000,
    direction: "SHORT",
    isWeekend: true
  });

  // Long experiences double adverse drag (underlying drop + basis widening)
  assert.ok(longResult.empiricalMetrics.projectedPnlPct < 0);

  // Short position should have significantly better PnL than long because underlying price drops
  assert.ok(
    shortResult.empiricalMetrics.projectedPnlPct > longResult.empiricalMetrics.projectedPnlPct,
    "Short position should perform better than long position under a gap-down dislocation"
  );
  assert.ok(
    shortResult.empiricalMetrics.projectedPnlPct > 0,
    "Short position should have positive projected PnL % when underlying price drops"
  );
  assert.ok(
    shortResult.empiricalMetrics.projectedPnlUsd > 0,
    "Short position should have positive projected PnL USD when underlying price drops"
  );
  assert.equal(
    shortResult.empiricalMetrics.projectedPnlUsd,
    -longResult.empiricalMetrics.projectedPnlUsd,
    "Short and long projected PnL must be symmetrical for same asset dislocation"
  );
});

test("Session Risk Weighting - Weekend and off-hours risk exceeds regular hours", () => {
  const regularResult = retrieveHistoricalScenarios({
    asset: "rNVDA",
    entryPrice: 120,
    size: 10000,
    isWeekend: false,
    isOffHours: false
  });

  const offHoursResult = retrieveHistoricalScenarios({
    asset: "rNVDA",
    entryPrice: 120,
    size: 10000,
    isWeekend: false,
    isOffHours: true
  });

  const weekendResult = retrieveHistoricalScenarios({
    asset: "rNVDA",
    entryPrice: 120,
    size: 10000,
    isWeekend: true,
    isOffHours: false
  });

  // Verify basis shift multiplier progression
  assert.ok(
    weekendResult.empiricalMetrics.averageBasisShiftBps > offHoursResult.empiricalMetrics.averageBasisShiftBps,
    "Weekend basis shift must exceed off-hours basis shift due to extended closure void"
  );
  assert.ok(
    offHoursResult.empiricalMetrics.averageBasisShiftBps > regularResult.empiricalMetrics.averageBasisShiftBps,
    "Off-hours basis shift must exceed regular hours basis shift due to cash market closure"
  );

  // Verify projected adverse P&L progression (more severe loss over weekend)
  assert.ok(
    weekendResult.empiricalMetrics.projectedPnlPct < regularResult.empiricalMetrics.projectedPnlPct,
    "Weekend holding must produce more severe projected drawdowns than regular hours"
  );
});

test("CRITICAL INVARIANT: runStressScenarios continues to return exactly 5 scenarios", () => {
  const trade = buildRnvdaDemoTrade();
  const scenarios = runStressScenarios(trade, rnvdaDemoMarketState, SCENARIO_CONFIG);

  assert.equal(scenarios.length, 5, "Stress scenarios array MUST strictly have exactly 5 elements");
  assert.deepEqual(
    scenarios.map((s) => s.id),
    ["MARKET_RISK", "CRYPTO_CONTAGION", "TOKEN_MICROSTRUCTURE", "COMBINED_SHOCK", "THESIS_FAILURE"],
    "Scenario IDs must strictly match the 5 canonical MVP scenario IDs"
  );
  assert.ok(scenarios.every((s) => s.applicable));
});

test("Additive Integration - assessThesisVsPosition attaches historicalScenarios", async () => {
  const trade = buildRnvdaDemoTrade();
  const scenarios = runStressScenarios(trade, rnvdaDemoMarketState, SCENARIO_CONFIG);
  const thesis = {
    traderStatement: trade.thesis,
    normalizedThesis: trade.thesis,
    assumptions: [{ text: "Strong AI demand", origin: "USER_STATED" }],
    dependencies: [{ text: "NVDA datacenter revenue", origin: "USER_STATED" }],
    supportingEvidenceRefs: [],
    invalidationConditions: [{ text: "NVDA falls below $100", origin: "AI_INFERRED" }],
    unresolvedAmbiguities: []
  };
  const challenge = {
    counterThesis: "Weekend gap down risk on macro headwinds",
    vulnerableAssumptions: ["Strong AI demand"],
    contradictoryEvidenceRefs: [],
    noMeaningfulCounterThesis: false,
    explanation: "Weekend basis risk is elevated"
  };

  process.env.TEST_MODE = "mock_llm";
  const assessment = await assessThesisVsPosition(
    thesis,
    trade,
    rnvdaDemoMarketState,
    scenarios,
    challenge,
    []
  );

  assert.ok(assessment.historicalScenarios, "Assessment result must additively attach historicalScenarios");
  assert.equal(assessment.historicalScenarios.matchedAsset, "rNVDA");
  assert.equal(assessment.historicalScenarios.matchConfidence, "EXACT");
  assert.ok(assessment.historicalScenarios.precedents.length > 0);
  assert.ok(assessment.historicalScenarios.empiricalMetrics.averageBasisShiftBps > 0);
  assert.ok(assessment.historicalScenarios.empiricalMetrics.maxHistoricalDrawdownPct < 0);
});
