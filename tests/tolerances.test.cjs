const assert = require("node:assert/strict");
const { test } = require("node:test");
const { evaluateDecision } = require("../dist-core/src/core/decision/policy.js");
const { rnvdaDemoMarketState } = require("../dist-core/src/fixtures/rnvda-demo.js");

// Regression lock for the risk-tolerance lever (policy.ts).
//
// Contract being pinned (matches documented tolerance policy matrix):
//  - The trader's tolerance shifts the gated risk band one step
//    (CONSERVATIVE stricter / AGGRESSIVE looser) wherever the gated band
//    governs — including under material uncertainty.
//  - MODERATE is the default and preserves the historical verdict exactly.
//  - Hard blockers (invalid trade, insufficient thesis, critical data) are
//    never relaxed by any tolerance.
//  - Liquidity floor: a WEAKER-graded position may be downgraded further but
//    never upgraded past REDUCE/WAIT, whatever the gated score says.

const offHours = { ...rnvdaDemoMarketState, sessionStatus: "OFF_HOURS" };
const regular = { ...rnvdaDemoMarketState, sessionStatus: "REGULAR" };

// Shape used by decision.test.cjs; gatedVerdictResult is what the service
// attaches when deterministic scoring ran (see decisionDeskService).
function makeAssessment(band) {
  return {
    thesisQuality: "WEAKER",
    positionQuality: { quality: "WEAKER", reasons: ["off-hours gap"], keyDrivers: [] },
    keyMismatch: null,
    gatedVerdictResult: {
      band,
      reasons: ["gated scoring ran (band: " + band + ")"]
    }
  };
}

function makeInputs(overrides = {}) {
  return {
    marketState: offHours,
    thesisQuality: "WEAKER",
    positionQuality: { quality: "WEAKER", reasons: [], executionRisk: { ratio: 0.1, explanation: "" } },
    positionAssessment: makeAssessment("elevated"),
    scenarios: [],
    dataQuality: "COMPLETE",
    materialUncertainty: true,
    ...overrides
  };
}

test("tolerance under material uncertainty: MODERATE (and default) keep the historical WAIT", () => {
  for (const riskTolerance of [undefined, "MODERATE"]) {
    const r = evaluateDecision(makeInputs({ riskTolerance }));
    assert.equal(r.verdict, "WAIT", "tolerance=" + riskTolerance);
    assert.equal(r.reasons[0].code, "CRITICAL_DATA_BLOCKER");
  }
});

test("tolerance under material uncertainty: CONSERVATIVE shifts elevated→critical → REJECT", () => {
  const r = evaluateDecision(makeInputs({ riskTolerance: "CONSERVATIVE" }));
  assert.equal(r.verdict, "REJECT");
  assert.ok(r.blockers.some(b => b.includes("CONSERVATIVE raised the gated risk band to critical")));
  // uncertainty reasons are retained, not swallowed
  assert.ok(r.reasons.some(x => x.message.includes("Material uncertainty remains")));
});

test("tolerance under material uncertainty: AGGRESSIVE shifts elevated→moderate → PROCEED", () => {
  const r = evaluateDecision(makeInputs({ riskTolerance: "AGGRESSIVE" }));
  assert.equal(r.verdict, "PROCEED");
  assert.ok(r.reasons.some(x => x.code === "PROCEED_OK"));
  // uncertainty is disclosed on the artifact, never hidden
  assert.ok(r.reasons.some(x => x.message.includes("Material uncertainty remains")));
});

test("gated path without uncertainty: the three tolerances give REJECT / WAIT / PROCEED off-hours", () => {
  const base = { materialUncertainty: false };
  assert.equal(evaluateDecision(makeInputs({ ...base, riskTolerance: "CONSERVATIVE" })).verdict, "REJECT");
  assert.equal(evaluateDecision(makeInputs({ ...base, riskTolerance: "MODERATE" })).verdict, "WAIT");
  assert.equal(evaluateDecision(makeInputs({ ...base, riskTolerance: "AGGRESSIVE" })).verdict, "PROCEED");
});

test("gated critical band: AGGRESSIVE loosens exactly one step to REDUCE, never to PROCEED", () => {
  const r = evaluateDecision(makeInputs({
    materialUncertainty: false,
    marketState: regular,
    positionAssessment: makeAssessment("critical"),
    riskTolerance: "AGGRESSIVE"
  }));
  assert.equal(r.verdict, "REDUCE");
});

test("liquidity floor: WEAKER position + clear gated band + AGGRESSIVE is capped at REDUCE, not PROCEED", () => {
  const r = evaluateDecision(makeInputs({
    materialUncertainty: false,
    marketState: regular,
    positionAssessment: makeAssessment("clear"),
    riskTolerance: "AGGRESSIVE"
  }));
  assert.equal(r.verdict, "REDUCE");
  assert.ok(r.reasons.some(x => x.message.includes("Liquidity floor")));
});

test("liquidity floor holds at MODERATE too: clear band + WEAKER position → REDUCE, not PROCEED", () => {
  const r = evaluateDecision(makeInputs({
    materialUncertainty: false,
    marketState: regular,
    positionAssessment: makeAssessment("clear")
  }));
  assert.equal(r.verdict, "REDUCE");
});

test("hard blockers are never relaxed by any tolerance", () => {
  for (const riskTolerance of ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]) {
    const r = evaluateDecision(makeInputs({ criticalBlockers: ["unsupported asset"], riskTolerance }));
    assert.equal(r.verdict, "REJECT", "tolerance=" + riskTolerance);
    assert.equal(r.reasons[0].code, "FATAL_INVALID_TRADE");
  }
});

test("insufficient thesis is never relaxed by AGGRESSIVE", () => {
  const r = evaluateDecision(makeInputs({
    thesisQuality: "INSUFFICIENT",
    materialUncertainty: false,
    riskTolerance: "AGGRESSIVE"
  }));
  assert.equal(r.verdict, "REJECT");
  assert.equal(r.reasons[0].code, "INSUFFICIENT_THESIS");
});

test("CONSERVATIVE on an already-critical gated band stays REJECT (terminal band, no crash)", () => {
  const r = evaluateDecision(makeInputs({
    materialUncertainty: false,
    positionAssessment: makeAssessment("critical"),
    riskTolerance: "CONSERVATIVE"
  }));
  assert.equal(r.verdict, "REJECT");
});

// ---------------------------------------------------------------------------
// Probed live on 2026-10-01 through the real UI (9-cell trust-gate matrix,
// scratch/signoff/tolerance-matrix.md). These lock the exact shapes the live
// runs exercised: band-shift note disclosure, hard-blocker invariance under
// every tolerance, the ungated off-hours branch's honest lever inertness, and
// asset-agnostic behavior on a second live token (rTSLA).
// ---------------------------------------------------------------------------

test("probed live (A@LOW): CONSERVATIVE band-shift note is disclosed verbatim on the artifact reasons", () => {
  const r = evaluateDecision(makeInputs({ riskTolerance: "CONSERVATIVE" }));
  assert.equal(r.verdict, "REJECT");
  assert.ok(r.reasons.some(x => x.message.includes("risk band adjusted one step worse (elevated → critical)")),
    "band-shift note must appear in reasons");
  assert.ok(r.blockers.some(b => b.includes("CONSERVATIVE raised the gated risk band to critical")));
  assert.ok(r.reasons.some(x => x.message.includes("Material uncertainty remains")));
});

test("probed live (A@HIGH): AGGRESSIVE band-shift note is disclosed verbatim on the artifact reasons", () => {
  const r = evaluateDecision(makeInputs({ riskTolerance: "AGGRESSIVE" }));
  assert.equal(r.verdict, "PROCEED");
  assert.ok(r.reasons.some(x => x.message.includes("risk band adjusted one step better (elevated → moderate)")),
    "band-shift note must appear in reasons");
  assert.ok(r.reasons.some(x => x.message.includes("Material uncertainty remains")),
    "uncertainty is disclosed, never hidden");
});

test("probed live (B row): INSUFFICIENT thesis is never relaxed by ANY tolerance", () => {
  for (const riskTolerance of ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]) {
    const r = evaluateDecision(makeInputs({
      thesisQuality: "INSUFFICIENT",
      materialUncertainty: false,
      riskTolerance
    }));
    assert.equal(r.verdict, "REJECT", "tolerance=" + riskTolerance);
    assert.equal(r.reasons[0].code, "INSUFFICIENT_THESIS");
  }
});

test("probed live (C row, fixture WEEKEND shape): ungated off-hours branch keeps the lever honestly inert", () => {
  // No gatedVerdictResult — the legacy off-hours branch governs (session-blocking),
  // so the tolerance must not change the verdict for any level.
  for (const riskTolerance of ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]) {
    const r = evaluateDecision({
      marketState: { ...rnvdaDemoMarketState, sessionStatus: "WEEKEND" },
      thesisQuality: "STRONGER",
      positionQuality: {
        quality: "WEAKER",
        reasons: ["Trading rNVDA on weekend has high basis risk (+2.56%)"],
        executionRisk: { ratio: 0.1, explanation: "" }
      },
      positionAssessment: {
        thesisQuality: "STRONGER",
        positionQuality: { quality: "WEAKER", reasons: [], keyDrivers: [] },
        keyMismatch: "Weekend basis risk offsets fundamental NVDA thesis."
      },
      scenarios: [],
      dataQuality: "COMPLETE",
      materialUncertainty: false,
      riskTolerance
    });
    assert.equal(r.verdict, "WAIT", "tolerance=" + riskTolerance);
    assert.ok(r.reasons.every(x => x.code === "OFF_HOURS_WAIT"), "tolerance=" + riskTolerance);
  }
});

test("probed live (A row on rTSLA): the lever behaves identically on a second live asset", () => {
  const tslaState = { ...rnvdaDemoMarketState, sessionStatus: "OFF_HOURS", tokenSymbol: "rTSLAUSDT" };
  assert.equal(evaluateDecision(makeInputs({ marketState: tslaState, riskTolerance: "CONSERVATIVE" })).verdict, "REJECT");
  assert.equal(evaluateDecision(makeInputs({ marketState: tslaState, riskTolerance: "MODERATE" })).verdict, "WAIT");
  assert.equal(evaluateDecision(makeInputs({ marketState: tslaState, riskTolerance: "AGGRESSIVE" })).verdict, "PROCEED");
});
