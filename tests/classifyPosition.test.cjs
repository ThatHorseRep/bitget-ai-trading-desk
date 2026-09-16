const assert = require('node:assert/strict');
const { test } = require('node:test');
const { classifyPositionQuality } = require('../dist-core/src/core/decision/classifyPosition.js');

// Helper to create a simple scenario
function makeScenario(id, lossPct, applicable = true, basisImpact = 0) {
  return {
    id,
    name: `Scenario ${id}`,
    assumptions: [],
    shockedReferencePrice: null,
    shockedTokenPrice: null,
    estimatedPnlUsd: null,
    estimatedPnlPct: lossPct,
    basisImpact,
    applicable,
    limitations: []
  };
}

// Mock market state objects
const marketNormal = {
  liquidityClass: 'NORMAL'
};
const marketThin = {
  liquidityClass: 'THIN'
};

const tradeMock = { direction: "LONG", positionSizeUsd: 10000 };

test('classifyPositionQuality STRONGER when loss small and normal liquidity', () => {
  const scenarios = [makeScenario('s1', -3)];
  const result = classifyPositionQuality(scenarios, marketNormal, tradeMock);
  assert.equal(result.quality, 'STRONGER');
});

test('classifyPositionQuality WEAKER when loss moderate but thin liquidity downgrades', () => {
  const scenarios = [makeScenario('s2', -10)]; // would be MIXED without downgrade
  const result = classifyPositionQuality(scenarios, marketThin, tradeMock);
  // MIXED downgraded by thin liquidity => WEAKER
  assert.equal(result.quality, 'WEAKER');
});

test('classifyPositionQuality WEAKER when high basis impact forces downgrade', () => {
  const scenarios = [makeScenario('s3', -8, true, 2.0)]; // loss would be STRONGER, but basis impact >=1 forces WEAKER
  const result = classifyPositionQuality(scenarios, marketNormal, tradeMock);
  assert.equal(result.quality, 'WEAKER');
});
