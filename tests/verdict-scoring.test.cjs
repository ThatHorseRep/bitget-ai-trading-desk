const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  scoreThesis,
  scorePosition,
  gateVerdict,
} = require("../dist-core/src/lib/verdict/scoring.js");

test("Verdict Scoring (CJS) - scoreThesis band tests with hand-computed expectations", async (t) => {
  await t.test("returns 'clear' band for comprehensive thesis (score = 1.00)", () => {
    const signals = {
      hasInvalidationLevel: true, // +0.30
      hasStatedHorizon: true,     // +0.20
      hasNamedCatalyst: true,     // +0.20
      hasDirectionalClaim: true,  // +0.15
      precedentCount: 5,          // +0.15
    };
    const result = scoreThesis(signals);
    assert.equal(result.score, 1.00);
    assert.equal(result.band, "clear");
    assert.ok(result.reasons.length > 0);
  });

  await t.test("returns 'moderate' band for solid thesis missing catalyst and precedents (score = 0.65)", () => {
    const signals = {
      hasInvalidationLevel: true, // +0.30
      hasStatedHorizon: true,     // +0.20
      hasNamedCatalyst: false,    // 0.00
      hasDirectionalClaim: true,  // +0.15
      precedentCount: 0,          // 0.00
    };
    const result = scoreThesis(signals);
    assert.equal(result.score, 0.65);
    assert.equal(result.band, "moderate");
  });

  await t.test("returns 'elevated' band for basic directional thesis (score = 0.45)", () => {
    const signals = {
      hasInvalidationLevel: true, // +0.30
      hasStatedHorizon: false,    // 0.00
      hasNamedCatalyst: false,    // 0.00
      hasDirectionalClaim: true,  // +0.15
      precedentCount: 0,          // 0.00
    };
    const result = scoreThesis(signals);
    assert.equal(result.score, 0.45);
    assert.equal(result.band, "elevated");
  });

  await t.test("returns 'critical' band for vague unanchored thesis (score = 0.20)", () => {
    const signals = {
      hasInvalidationLevel: false, // 0.00
      hasStatedHorizon: true,      // +0.20
      hasNamedCatalyst: false,     // 0.00
      hasDirectionalClaim: false,  // 0.00
      precedentCount: 0,           // 0.00
    };
    const result = scoreThesis(signals);
    assert.equal(result.score, 0.20);
    assert.equal(result.band, "critical");
  });
});

test("Verdict Scoring (CJS) - scorePosition band tests with hand-computed expectations", async (t) => {
  await t.test("returns 'clear' band for low-risk well-hedged position (score = 0.85)", () => {
    const signals = {
      expectedShortfall: 0.05,     // -0.10
      valueAtRisk: 0.03,
      positionFraction: 0.05,      // -0.05
      gapExposureFraction: 0.0,    // -0.00
      hedgeCoverageFraction: 0.0,  // +0.00
    };
    const result = scorePosition(signals);
    assert.equal(result.score, 0.85);
    assert.equal(result.band, "clear");
  });

  await t.test("returns 'moderate' band for moderate risk position (score = 0.70)", () => {
    const signals = {
      expectedShortfall: 0.10,     // -0.20
      valueAtRisk: 0.06,
      positionFraction: 0.10,      // -0.10
      gapExposureFraction: 0.0,    // -0.00
      hedgeCoverageFraction: 0.0,  // +0.00
    };
    const result = scorePosition(signals);
    assert.equal(result.score, 0.70);
    assert.equal(result.band, "moderate");
  });

  await t.test("returns 'elevated' band for higher risk position (score = 0.45)", () => {
    const signals = {
      expectedShortfall: 0.15,     // -0.30
      valueAtRisk: 0.10,
      positionFraction: 0.20,      // -0.20
      gapExposureFraction: 0.25,   // -0.05
      hedgeCoverageFraction: 0.0,  // +0.00
    };
    const result = scorePosition(signals);
    assert.equal(result.score, 0.45);
    assert.equal(result.band, "elevated");
  });

  await t.test("returns 'critical' band for oversized unhedged gap-exposed position (score = 0.25)", () => {
    const signals = {
      expectedShortfall: 0.20,     // -0.40
      valueAtRisk: 0.15,
      positionFraction: 0.25,      // -0.25
      gapExposureFraction: 0.50,   // -0.10
      hedgeCoverageFraction: 0.0,  // +0.00
    };
    const result = scorePosition(signals);
    assert.equal(result.score, 0.25);
    assert.equal(result.band, "critical");
  });
});

test("Verdict Scoring (CJS) - gateVerdict returns the worse band for all 16 combinations", () => {
  const bands = ["critical", "elevated", "moderate", "clear"];
  const rank = {
    critical: 0,
    elevated: 1,
    moderate: 2,
    clear: 3,
  };

  for (const b1 of bands) {
    for (const b2 of bands) {
      const expectedWorse = rank[b1] <= rank[b2] ? b1 : b2;
      const res = gateVerdict(
        { score: 0.5, band: b1, reasons: [`thesis-${b1}`] },
        { score: 0.5, band: b2, reasons: [`position-${b2}`] }
      );
      assert.equal(
        res.band,
        expectedWorse,
        `Pair (${b1}, ${b2}) must return ${expectedWorse}, got ${res.band}`
      );
      assert.deepEqual(res.reasons, [`thesis-${b1}`, `position-${b2}`]);
    }
  }
});

test("Verdict Scoring (CJS) - Determinism test (100 iterations with identical input)", () => {
  const thesisSignals = {
    hasInvalidationLevel: true,
    hasStatedHorizon: true,
    hasNamedCatalyst: false,
    hasDirectionalClaim: true,
    precedentCount: 3,
  };

  const positionSignals = {
    expectedShortfall: 0.12,
    valueAtRisk: 0.08,
    positionFraction: 0.15,
    gapExposureFraction: 0.3,
    hedgeCoverageFraction: 0.2,
  };

  const baselineThesis = scoreThesis(thesisSignals);
  const baselinePosition = scorePosition(positionSignals);
  const baselineGated = gateVerdict(thesisSignals, positionSignals);

  for (let i = 0; i < 100; i++) {
    const tRes = scoreThesis(thesisSignals);
    const pRes = scorePosition(positionSignals);
    const gRes = gateVerdict(thesisSignals, positionSignals);

    assert.deepEqual(tRes, baselineThesis, `Thesis score diverged on run ${i}`);
    assert.deepEqual(pRes, baselinePosition, `Position score diverged on run ${i}`);
    assert.deepEqual(gRes, baselineGated, `Gated verdict diverged on run ${i}`);
  }
});

test("Verdict Scoring (CJS) - Clamping test for extreme values", () => {
  const extremeSignals = {
    expectedShortfall: 10.0,
    valueAtRisk: 10.0,
    positionFraction: 10.0,
    gapExposureFraction: 5.0,
    hedgeCoverageFraction: 5.0,
  };

  const result = scorePosition(extremeSignals);
  assert.ok(result.score >= 0, `Score ${result.score} must be >= 0`);
  assert.ok(result.score <= 1, `Score ${result.score} must be <= 1`);
  assert.equal(result.band, "critical");

  const fullHedgeSignals = {
    expectedShortfall: 0.0,
    valueAtRisk: 0.0,
    positionFraction: 0.0,
    gapExposureFraction: 0.0,
    hedgeCoverageFraction: 10.0,
  };

  const fullResult = scorePosition(fullHedgeSignals);
  assert.ok(fullResult.score >= 0, `Score ${fullResult.score} must be >= 0`);
  assert.ok(fullResult.score <= 1, `Score ${fullResult.score} must be <= 1`);
  assert.equal(fullResult.score, 1.0);
  assert.equal(fullResult.band, "clear");
});
