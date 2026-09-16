const assert = require("node:assert/strict");
const { test } = require("node:test");
const { evaluateDecision } = require("../dist-core/src/core/decision/policy.js");
const { rnvdaDemoMarketState } = require("../dist-core/src/fixtures/rnvda-demo.js");

const assessment = {
  thesisQuality: "STRONGER",
  positionQuality: {
    quality: "STRONGER",
    reasons: [],
    keyDrivers: []
  },
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
  assert.equal(result.reasons[0].code, "FATAL_INVALID_TRADE");
});

test("decision waits on invalid data", () => {
  const result = evaluateDecision({ ...base, dataQuality: "INVALID" });
  assert.equal(result.verdict, "WAIT");
  assert.equal(result.reasons[0].code, "CRITICAL_DATA_BLOCKER");
});

test("decision proceeds on degraded data but adds reason", () => {
  const result = evaluateDecision({ ...base, dataQuality: "DEGRADED" });
  assert.equal(result.verdict, "PROCEED");
  assert.equal(result.reasons.some(r => r.message.includes("degraded")), true);
});

test("decision waits on material uncertainty", () => {
  const result = evaluateDecision({ ...base, materialUncertainty: true });
  assert.equal(result.verdict, "WAIT");
  assert.equal(result.reasons[0].code, "CRITICAL_DATA_BLOCKER");
});

test("decision can proceed when no hard blocker is present", () => {
  const result = evaluateDecision(base);
  assert.equal(result.verdict, "PROCEED");
  assert.equal(result.reasons[0].code, "PROCEED_OK");
});

test("decision reduce on severe position risk", () => {
  const result = evaluateDecision({
    ...base,
    marketState: { ...base.marketState, sessionStatus: "REGULAR" },
    positionAssessment: { ...assessment, positionQuality: { quality: "WEAKER", reasons: ["Too big for liquidity"], keyDrivers: [] } }
  });
  assert.equal(result.verdict, "REDUCE");
  assert.equal(result.reasons[0].code, "REDUCE_POSITION_SIZE");
  assert.equal(result.reasons[0].message, "Too big for liquidity");
});

test("decision rejects on insufficient thesis", () => {
  const result = evaluateDecision({
    ...base,
    thesisQuality: "INSUFFICIENT"
  });
  assert.equal(result.verdict, "REJECT");
  assert.equal(result.reasons[0].code, "INSUFFICIENT_THESIS");
});

test("decision rejects on contradicted thesis and weak position", () => {
  const result = evaluateDecision({
    ...base,
    thesisQuality: "WEAKER",
    positionAssessment: { ...assessment, positionQuality: { ...assessment.positionQuality, quality: "WEAKER" } }
  });
  assert.equal(result.verdict, "REJECT");
  assert.equal(result.reasons[0].code, "THESIS_CONTRADICTED");
});

test("decision waits on off-hours market with weak position", () => {
  const result = evaluateDecision({
    ...base,
    marketState: { ...base.marketState, sessionStatus: "WEEKEND" },
    positionAssessment: { ...assessment, positionQuality: { ...assessment.positionQuality, quality: "WEAKER" } }
  });
  assert.equal(result.verdict, "WAIT");
  assert.equal(result.reasons[0].code, "OFF_HOURS_WAIT");
});

test("precedence: fatal invalid trade overrides critical data blocker", () => {
  const result = evaluateDecision({
    ...base,
    criticalBlockers: ["unsupported asset"],
    dataQuality: "INVALID"
  });
  assert.equal(result.verdict, "REJECT");
  assert.equal(result.reasons[0].code, "FATAL_INVALID_TRADE");
});

test("precedence: critical data blocker overrides insufficient thesis", () => {
  const result = evaluateDecision({
    ...base,
    dataQuality: "INVALID",
    thesisQuality: "INSUFFICIENT"
  });
  assert.equal(result.verdict, "WAIT");
  assert.equal(result.reasons[0].code, "CRITICAL_DATA_BLOCKER");
});

test("precedence: insufficient thesis overrides contradicted thesis", () => {
  const result = evaluateDecision({
    ...base,
    thesisQuality: "INSUFFICIENT",
    positionAssessment: { ...assessment, positionQuality: { ...assessment.positionQuality, quality: "WEAKER" } }
  });
  assert.equal(result.verdict, "REJECT");
  assert.equal(result.reasons[0].code, "INSUFFICIENT_THESIS");
});

test("precedence: contradicted thesis overrides material uncertainty", () => {
  const result = evaluateDecision({
    ...base,
    thesisQuality: "WEAKER",
    positionAssessment: { ...assessment, positionQuality: { ...assessment.positionQuality, quality: "WEAKER" } },
    materialUncertainty: true
  });
  assert.equal(result.verdict, "REJECT");
  assert.equal(result.reasons[0].code, "THESIS_CONTRADICTED");
});
