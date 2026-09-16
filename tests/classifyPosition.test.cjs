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

test('Execution Risk: tiny position vs large visible liquidity', () => {
  const scenarios = [makeScenario('s', -3)];
  const market = { ...marketNormal, instrumentPrice: 10, askSize: 10000 };
  const trade = { direction: "LONG", positionSizeUsd: 1000 };
  const result = classifyPositionQuality(scenarios, market, trade);
  
  assert.equal(result.quality, 'STRONGER');
  assert.equal(result.executionRisk.ratio, 0.01);
  assert.ok(!result.reasons.some(r => r.includes('Position size exceeds')));
});

test('Execution Risk: moderate position vs visible liquidity', () => {
  const scenarios = [makeScenario('s', -3)];
  const market = { ...marketNormal, instrumentPrice: 10, askSize: 10000 };
  const trade = { direction: "LONG", positionSizeUsd: 40000 };
  const result = classifyPositionQuality(scenarios, market, trade);
  
  assert.equal(result.quality, 'STRONGER');
  assert.equal(result.executionRisk.ratio, 0.4);
  assert.ok(!result.reasons.some(r => r.includes('Position size exceeds')));
});

test('Execution Risk: position larger than visible liquidity threshold', () => {
  const scenarios = [makeScenario('s', -3)];
  const market = { ...marketNormal, instrumentPrice: 10, askSize: 10000 }; // 100k visible
  const trade = { direction: "LONG", positionSizeUsd: 60000 }; // 60k is 60% > 50% threshold
  const result = classifyPositionQuality(scenarios, market, trade);
  
  assert.equal(result.quality, 'WEAKER');
  assert.equal(result.executionRisk.ratio, 0.6);
  assert.ok(result.reasons.some(r => r.includes('Position size exceeds 50%')));
});

test('Execution Risk: missing ask size for LONG does not downgrade size', () => {
  const scenarios = [makeScenario('s', -3)];
  const market = { ...marketNormal, instrumentPrice: 10, askSize: null };
  const trade = { direction: "LONG", positionSizeUsd: 10000 };
  const result = classifyPositionQuality(scenarios, market, trade);
  
  assert.equal(result.quality, 'STRONGER');
  assert.equal(result.executionRisk.ratio, 'UNKNOWN');
  assert.ok(result.executionRisk.explanation.includes('missing'));
});

test('Execution Risk: missing bid size for SHORT does not downgrade size', () => {
  const scenarios = [makeScenario('s', -3)];
  const market = { ...marketNormal, instrumentPrice: 10, bidSize: null, askSize: 10000 };
  const trade = { direction: "SHORT", positionSizeUsd: 10000 };
  const result = classifyPositionQuality(scenarios, market, trade);
  
  assert.equal(result.quality, 'STRONGER');
  assert.equal(result.executionRisk.ratio, 'UNKNOWN');
  assert.ok(result.executionRisk.explanation.includes('missing'));
});

test('Execution Risk: wide spread (THIN) with ok size downgrades but ratio is fine', () => {
  const scenarios = [makeScenario('s', -3)]; // -3 = STRONGER
  const market = { ...marketThin, instrumentPrice: 10, askSize: 10000 }; // THIN = 1 downgrade -> MIXED
  const trade = { direction: "LONG", positionSizeUsd: 1000 }; // ratio 0.01 = ok
  const result = classifyPositionQuality(scenarios, market, trade);
  
  assert.equal(result.quality, 'MIXED');
  assert.equal(result.executionRisk.ratio, 0.01);
  assert.ok(!result.reasons.some(r => r.includes('Position size exceeds')));
  assert.ok(result.reasons.some(r => r.includes('THIN liquidity conditions')));
});

test('Execution Risk: narrow spread (NORMAL) with ok size stays STRONGER', () => {
  const scenarios = [makeScenario('s', -3)];
  const market = { ...marketNormal, instrumentPrice: 10, askSize: 10000 };
  const trade = { direction: "LONG", positionSizeUsd: 1000 };
  const result = classifyPositionQuality(scenarios, market, trade);
  
  assert.equal(result.quality, 'STRONGER');
  assert.equal(result.executionRisk.ratio, 0.01);
});
