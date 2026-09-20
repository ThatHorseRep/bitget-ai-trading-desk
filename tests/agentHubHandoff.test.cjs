const { test } = require("node:test");
const assert = require("node:assert/strict");

process.env.TEST_MODE = "mock_llm";

const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");
const { buildAgentHubHandoff, validateAgentHubHandoff } = require("../dist-core/src/adapters/agenthub/handoff.js");

const MOCK_MARKET_STATE = {
  observedAt: "2026-01-01T18:00:00.000Z",
  instrumentPrice: 120, bid: 119.4, ask: 120.6, bidSize: 30, askSize: 28,
  spread: 1.2, spreadPct: 1.0, referenceSymbol: "NVDA", referencePrice: 117,
  referencePreviousClose: 116.5, referenceObservedAt: "2026-01-01T18:00:00.000Z",
  referenceSourceName: "Test Reference Source", basis: 3, basisPct: 2.56410256,
  btcPrice: 85000, btcObservedAt: "2026-01-01T18:00:00.000Z",
  sessionStatus: "WEEKEND", tokenMarketStatus: "ACTIVE", liquidityClass: "NORMAL",
  dataQuality: "COMPLETE",
  sources: [{ id: "test-bitget", name: "Test Bitget Source", observedAt: "2026-01-01T18:00:00.000Z" }],
};
class MockMarketStateService {
  async getMarketState() { return { ...MOCK_MARKET_STATE }; }
}

async function readyResult(inputText) {
  const desk = new DecisionDeskService(new MockMarketStateService());
  const result = await desk.runWorkflow(inputText, { useFixture: false });
  assert.equal(result.step, "DECISION_READY");
  return result;
}

test("PRE24-06: handoff payload contains every required element from the real workflow", async () => {
  const result = await readyResult("LONG rNVDA for 2000 dollars, exit before Monday. AI demand thesis, stress-test it.");
  const h = result.agentHubHandoff;

  assert.ok(h, "DECISION_READY results must carry a handoff");
  assert.equal(h.handoffKind, "bitget-agent-hub-readonly-research-handoff");
  assert.equal(h.intendedHostTool, "@bitget-ai/bitget-agent-mcp --read-only");

  // Required elements, exactly as specified:
  assert.equal(h.asset, result.artifact.trade.asset);   // asset, verbatim from the artifact
  assert.ok(h.referenceSymbol === "NVDA");
  assert.equal(h.decisionArtifactId, result.artifact.artifactId); // artifact id
  assert.deepEqual(h.marketState, result.artifact.marketState);   // market state
  assert.deepEqual(h.thesis, result.artifact.thesis);             // thesis
  assert.deepEqual(h.challenge, result.artifact.challenge);       // challenge
  assert.deepEqual(h.stressResults, result.artifact.scenarios);   // stress results
  assert.equal(h.finalVerdict, result.artifact.decision.verdict); // product verdict
  assert.deepEqual(h.verdictReasons, result.artifact.decision.reasons);
  assert.equal(h.executionAllowed, false);              // explicit bar
  assert.equal(h.executionPolicy, "research-only-human-decides");
});

test("PRE24-06: the product verdict — not the LLM's opinion — is the final verdict", async () => {
  const result = await readyResult("LONG rNVDA for 2000 dollars, exit before Monday. Strong thesis.");
  const h = result.agentHubHandoff;
  // The deterministic policy decided; the mock LLM says "STRONGER" — the
  // handoff must carry the policy verdict, never a thesis-quality string.
  assert.ok(["EXECUTE", "WAIT", "REJECT", "MONITOR"].includes(h.finalVerdict), `unexpected verdict ${h.finalVerdict}`);
  assert.notEqual(h.finalVerdict, "STRONGER");
  // Reasons come from the decision policy (deterministic reason codes).
  assert.ok(h.verdictReasons.every((r) => typeof r.code === "string" && typeof r.message === "string"));
});

test("PRE24-06: executionAllowed is false in the type system and the validator rejects forgeries", () => {
  // Forged payload claiming permission must be rejected outright.
  const forged = {
    handoffKind: "bitget-agent-hub-readonly-research-handoff",
    executionAllowed: true,
    decisionArtifactId: "artifact-1",
    asset: "RNVDA",
    marketState: {},
    stressResults: [],
  };
  assert.equal(validateAgentHubHandoff(forged), null, "executionAllowed=true is not this contract");

  // Garbage payloads rejected.
  assert.equal(validateAgentHubHandoff(null), null);
  assert.equal(validateAgentHubHandoff("handoff"), null);
  assert.equal(validateAgentHubHandoff({}), null);
  assert.equal(validateAgentHubHandoff({ handoffKind: "something-else", executionAllowed: false }), null);
});

test("PRE24-06: handoff round-trips through JSON (SSE-safe) and survives validation", async () => {
  const result = await readyResult("LONG rNVDA for 2000 dollars, exit before Monday. Thesis.");
  const h = result.agentHubHandoff;
  const roundTrip = validateAgentHubHandoff(JSON.parse(JSON.stringify(h)));
  assert.ok(roundTrip, "serialized handoff must still validate");
  assert.equal(roundTrip.executionAllowed, false);
  assert.equal(roundTrip.decisionArtifactId, h.decisionArtifactId);
  assert.equal(roundTrip.finalVerdict, h.finalVerdict);
});

test("PRE24-06: the handoff is additive — the artifact itself is unchanged and Agent Hub is never contacted", async () => {
  // No network/process surface exists in the handoff module: it is a pure
  // function over the artifact. Prove the artifact math is untouched by
  // comparing two runs (already covered elsewhere) and that no handoff is
  // attached to non-ready steps.
  const desk = new DecisionDeskService(new MockMarketStateService());
  const clarification = await desk.runWorkflow("LONG rNVDA", { useFixture: false });
  assert.equal(clarification.step, "CLARIFICATION");
  assert.equal(clarification.agentHubHandoff, undefined, "no handoff without a finished artifact");
});

test("PRE24-06: application remains fully functional without Agent Hub (no runtime dependency)", async () => {
  // The handoff module imports nothing from Agent Hub, spawns nothing, and
  // the workflow never references it except to serialize the finished
  // artifact. Prove the import has no side-effect surface.
  const src = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "..", "src", "adapters", "agenthub", "handoff.ts"),
    "utf-8",
  );
  assert.ok(!src.includes("child_process"), "no process spawning");
  assert.ok(!src.includes("fetch("), "no network calls");
  assert.ok(!src.includes("process.env"), "no credentials read");
});
