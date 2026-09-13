const assert = require("node:assert/strict");
const { test } = require("node:test");
const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");

test("full vertical slice executes end-to-end with fixture data", async () => {
  const service = new DecisionDeskService();
  const input = "I'm thinking about buying $2,000 of rNVDA before Monday because AI infrastructure demand still looks strong. I already have $10,000 of BTC exposure. Stress-test this trade.";

  const result = await service.runWorkflow(input, { useFixture: true });

  assert.equal(result.step, "DECISION_READY");
  assert.ok(result.artifact);

  const art = result.artifact;

  // 1. Trade
  assert.equal(art.trade.asset, "rNVDA");
  assert.equal(art.trade.direction, "LONG");
  assert.equal(art.trade.positionSizeUsd, 2000);
  assert.ok(art.trade.quantity > 0);

  // 2. Decision Verdict
  assert.ok(["PROCEED", "WAIT", "REDUCE", "REJECT"].includes(art.decision.verdict));
  assert.ok(art.decision.reasons.length > 0);

  // 3. Market State
  assert.ok(art.marketState.instrumentPrice > 0);
  assert.ok(art.marketState.spread !== null);
  assert.ok(art.marketState.sessionStatus);
  assert.ok(art.marketState.liquidityClass);

  // 4. Thesis
  assert.ok(art.thesis.traderStatement);
  assert.ok(art.thesis.assumptions.length > 0);
  assert.ok(art.thesis.dependencies.length > 0);
  assert.ok(art.thesis.invalidationConditions.length > 0);

  // 5. Challenge
  assert.ok(art.challenge.counterThesis);
  assert.ok(art.challenge.vulnerableAssumptions.length > 0);

  // 6. Stress Scenarios (all 4 MVP scenarios)
  assert.equal(art.scenarios.length, 4);
  const scenarioIds = art.scenarios.map((s) => s.id);
  assert.deepEqual(scenarioIds, ["MARKET_RISK", "CRYPTO_CONTAGION", "TOKEN_MICROSTRUCTURE", "COMBINED_SHOCK"]);
  for (const s of art.scenarios) {
    assert.ok(s.applicable);
    assert.ok(s.estimatedPnlUsd !== null);
    assert.ok(s.estimatedPnlPct !== null);
  }

  // 7. Thesis vs Position
  assert.ok(["STRONGER", "MIXED", "WEAKER"].includes(art.thesisPosition.thesisQuality));
  assert.ok(["STRONGER", "MIXED", "WEAKER"].includes(art.thesisPosition.positionQuality));
  assert.ok(art.thesisPosition.explanation);

  // 8. Change Conditions
  assert.ok(art.changeConditions.length > 0);

  // 9. Evidence & Provenance
  assert.ok(art.evidence.length > 0);
  for (const ev of art.evidence) {
    assert.equal(ev.provenanceType, "OBSERVED_FACT");
  }

  assert.ok(art.provenance.length > 0);
  const provTypes = new Set(art.provenance.map((p) => p.type));
  assert.ok(provTypes.has("OBSERVED_FACT"));
  assert.ok(provTypes.has("CALCULATED_METRIC"));
  assert.ok(provTypes.has("SCENARIO_ASSUMPTION"));
  assert.ok(provTypes.has("AI_INTERPRETATION"));
});

test("vertical slice pauses for clarification on underspecified trade input", async () => {
  const service = new DecisionDeskService();
  const input = "Thinking about buying rNVDA because AI demand is strong.";

  const result = await service.runWorkflow(input, { useFixture: true });

  assert.equal(result.step, "CLARIFICATION");
  assert.equal(result.artifact, null);
  assert.equal(result.parsedResult.clarificationField, "positionSizeUsd");
  assert.ok(result.parsedResult.clarificationQuestion.includes("position size"));
});
