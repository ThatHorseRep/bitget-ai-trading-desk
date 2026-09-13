const assert = require("node:assert/strict");
const { test } = require("node:test");
const { evaluateDecision } = require("../dist-core/src/core/decision/policy.js");
const { rnvdaDemoMarketState } = require("../dist-core/src/fixtures/rnvda-demo.js");

const assessment = {
  thesisQuality: "STRONGER",
  positionQuality: "STRONGER",
  keyMismatch: null,
  explanation: "Fixture assessment."
};

const base = {
  marketState: rnvdaDemoMarketState,
  thesisQuality: assessment.thesisQuality,
  positionAssessment: assessment,
  scenarios: [],
  dataQuality: "COMPLETE"
};

test("decision rejects hard unsupported/invalid blockers", () => {
  const result = evaluateDecision({ ...base, criticalBlockers: ["unsupported asset"] });
  assert.equal(result.verdict, "REJECT");
});

test("decision waits on invalid or degraded data", () => {
  assert.equal(evaluateDecision({ ...base, dataQuality: "INVALID" }).verdict, "WAIT");
  assert.equal(evaluateDecision({ ...base, dataQuality: "DEGRADED" }).verdict, "WAIT");
});

test("decision waits on material uncertainty", () => {
  assert.equal(evaluateDecision({ ...base, materialUncertainty: true }).verdict, "WAIT");
});

test("decision can proceed when no hard blocker is present", () => {
  assert.equal(evaluateDecision(base).verdict, "PROCEED");
});
