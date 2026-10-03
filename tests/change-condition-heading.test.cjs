const assert = require("node:assert/strict");
const { test } = require("node:test");
const { evaluateDecision } = require("../dist-core/src/core/decision/policy.js");
const {
  SECTION_SEVEN_LEAD,
  namedTargetVerdict,
  sectionSevenHeading
} = require("../dist-core/src/lib/verdict/changeConditionHeading.js");
const { rnvdaDemoMarketState } = require("../dist-core/src/fixtures/rnvda-demo.js");

// Section 7 of the decision artifact used to hardcode a `to PROCEED` target next
// to the live verdict badge, so a PROCEED artifact rendered "change the verdict
// from PROCEED to PROCEED" and every other artifact asserted a target the policy
// never computes. These tests drive the REAL policy engine and assert the REAL
// header that gets composed, rather than grepping the source.

const LEAD = "The observable triggers that would materially change the verdict from";

/** Inputs that clear every hard gate, so the engine reaches its PROCEED tail. */
const passingInputs = {
  marketState: rnvdaDemoMarketState,
  thesis: null,
  thesisQuality: "STRONGER",
  positionQuality: {
    quality: "STRONGER",
    reasons: [],
    executionRisk: { ratio: 0.01, explanation: "" }
  },
  positionAssessment: null,
  scenarios: [],
  dataQuality: "COMPLETE"
};

const withThesis = (invalidationConditions) => ({
  ...passingInputs,
  thesis: {
    traderStatement: "Long the tokenized equity into Monday's open.",
    normalizedThesis: "Underlying demand holds and the weekend basis converges at the cash open.",
    assumptions: [],
    dependencies: [],
    supportingEvidenceRefs: [],
    invalidationConditions: invalidationConditions.map((text) => ({
      text,
      origin: "USER_STATED"
    })),
    unresolvedAmbiguities: [],
    modelInfo: { model: "TEST", provider: "TEST" }
  }
});

/**
 * Mirrors the component's section 7 JSX children: the lead span, the
 * current-verdict badge, an optional "to" + target badge, then the colon span.
 * Returns the rendered children and the plain-text header.
 */
function renderSectionSeven(verdict, changeConditions) {
  const heading = sectionSevenHeading(verdict, changeConditions);
  const parts = [heading.lead, verdict];
  if (heading.targetVerdict) parts.push("to", heading.targetVerdict);
  parts.push(":");
  return { heading, parts };
}

test("section 7 header never renders a PROCEED-to-PROCEED transition", async (t) => {
  await t.test("a real PROCEED artifact states the verdict once, with no target", () => {
    const decision = evaluateDecision(passingInputs);
    assert.equal(decision.verdict, "PROCEED");
    assert.deepEqual(decision.changeConditions, [
      "Monitor underlying assumptions for structural invalidation."
    ]);

    const { heading, parts } = renderSectionSeven(decision.verdict, decision.changeConditions);
    assert.deepEqual(parts, [LEAD, "PROCEED", ":"]);
    assert.equal(heading.text, `${LEAD} PROCEED:`);
    assert.equal(heading.targetVerdict, null);
    assert.equal(heading.text.includes("PROCEED to PROCEED"), false);
    assert.equal(parts.join(" ").split("PROCEED").length - 1, 1);
    assert.equal(namedTargetVerdict(decision.verdict, decision.changeConditions), null);
  });

  await t.test("a real WAIT artifact states WAIT once, with no target", () => {
    const decision = evaluateDecision({ ...passingInputs, materialUncertainty: true });
    assert.equal(decision.verdict, "WAIT");

    const { heading, parts } = renderSectionSeven(decision.verdict, decision.changeConditions);
    assert.deepEqual(parts, [LEAD, "WAIT", ":"]);
    assert.equal(heading.text, `${LEAD} WAIT:`);
    assert.equal(heading.text.includes("WAIT to WAIT"), false);
    assert.equal(parts.join(" ").split("WAIT").length - 1, 1);
  });

  await t.test("a real REJECT artifact states REJECT once, with no target", () => {
    const decision = evaluateDecision({ ...passingInputs, criticalBlockers: ["unsupported asset"] });
    assert.equal(decision.verdict, "REJECT");

    const { heading, parts } = renderSectionSeven(decision.verdict, decision.changeConditions);
    assert.deepEqual(parts, [LEAD, "REJECT", ":"]);
    assert.equal(heading.text, `${LEAD} REJECT:`);
    assert.equal(heading.text.includes("REJECT to REJECT"), false);
    assert.equal(parts.join(" ").split("REJECT").length - 1, 1);
  });
await t.test("a real REDUCE artifact states REDUCE once, with no target", () => {
    // A weaker position in a REGULAR session reaches the policy's REDUCE branch;
    // off-hours state would short-circuit to WAIT first.
    const decision = evaluateDecision({
      ...passingInputs,
      marketState: { ...rnvdaDemoMarketState, sessionStatus: "REGULAR" },
      positionQuality: {
        quality: "WEAKER",
        reasons: ["thin book"],
        executionRisk: { ratio: 0.4, explanation: "" }
      }
    });
    assert.equal(decision.verdict, "REDUCE");

    const { heading, parts } = renderSectionSeven(decision.verdict, decision.changeConditions);
    assert.deepEqual(parts, [LEAD, "REDUCE", ":"]);
    assert.equal(heading.text, `${LEAD} REDUCE:`);
    assert.equal(heading.text.includes("REDUCE to REDUCE"), false);
    assert.equal(parts.join(" ").split("REDUCE").length - 1, 1);
  });
});

test("section 7 header drops the transition unless the conditions name a target", async (t) => {
  await t.test("prose verbs are not mistaken for a named verdict", () => {
    // The engine's own conditions use lowercase verbs; these must not be read
    // as the WAIT / REDUCE verdicts.
    const waitVerbs = ["Wait for market open to resolve elevated risk."];
    assert.equal(namedTargetVerdict("REJECT", waitVerbs), null);
    assert.deepEqual(renderSectionSeven("REJECT", waitVerbs).parts, [LEAD, "REJECT", ":"]);

    const reduceVerbs = ["Reduce position size to lower risk band."];
    assert.equal(namedTargetVerdict("WAIT", reduceVerbs), null);
    assert.deepEqual(renderSectionSeven("WAIT", reduceVerbs).parts, [LEAD, "WAIT", ":"]);
  });

  await t.test("a condition naming a different verdict renders the transition", () => {
    const conditions = ["Basis widening past 2% flips this to REDUCE."];
    assert.equal(namedTargetVerdict("REJECT", conditions), "REDUCE");
    const { heading, parts } = renderSectionSeven("REJECT", conditions);
    assert.deepEqual(parts, [LEAD, "REJECT", "to", "REDUCE", ":"]);
    assert.equal(heading.text, `${LEAD} REJECT to REDUCE:`);
  });

  await t.test("a condition naming the current verdict is not a transition", () => {
    const conditions = ["Structure holds; the desk would already be at PROCEED."];
    assert.equal(namedTargetVerdict("PROCEED", conditions), null);
    assert.deepEqual(renderSectionSeven("PROCEED", conditions).parts, [LEAD, "PROCEED", ":"]);
  });

  await t.test("ambiguous multi-target conditions render no transition", () => {
    const conditions = ["A tight basis would move this to PROCEED, a wide one to REJECT."];
    assert.equal(namedTargetVerdict("WAIT", conditions), null);
    assert.deepEqual(renderSectionSeven("WAIT", conditions).parts, [LEAD, "WAIT", ":"]);
  });

  await t.test("the transition survives the real engine via thesis invalidation conditions", () => {
    // The only path the policy has for a condition that names a verdict is a
    // thesis invalidation condition, which flows into changeConditions.
    const decision = evaluateDecision(
      withThesis(["Basis widening past 2% flips this to REDUCE."])
    );
    assert.equal(decision.verdict, "PROCEED");
    assert.ok(decision.changeConditions.includes("Basis widening past 2% flips this to REDUCE."));

    const { heading, parts } = renderSectionSeven(decision.verdict, decision.changeConditions);
    assert.deepEqual(parts, [LEAD, "PROCEED", "to", "REDUCE", ":"]);
    assert.equal(heading.text, `${LEAD} PROCEED to REDUCE:`);
  });
});

test("section 7 header helper is total over every verdict", async (t) => {
  for (const verdict of ["PROCEED", "WAIT", "REDUCE", "REJECT"]) {
    await t.test(`${verdict} renders a single named verdict with no hardcoded target`, () => {
      const heading = sectionSevenHeading(verdict, []);
      assert.equal(heading.lead, SECTION_SEVEN_LEAD);
      assert.equal(heading.targetVerdict, null);
      assert.equal(heading.text, `${LEAD} ${verdict}:`);
      assert.equal(heading.text.split(verdict).length - 1, 1);
      assert.equal(heading.text.includes("to "), false);
    });
  }
});
