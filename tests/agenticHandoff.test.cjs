const { test } = require("node:test");
const assert = require("node:assert/strict");

process.env.TEST_MODE = "mock_llm";

const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");
const { ResearchProviderRegistry } = require("../dist-core/src/adapters/research/registry.js");
const {
  AGENTIC_TRANSITIONS,
  AGENTIC_STATE_NOTES,
  createAgenticConnectionStateMachine,
  validateAgenticHandoff,
} = require("../dist-core/src/adapters/agentic/handoff.js");

const emptyRegistry = () => new ResearchProviderRegistry([]);

// Mirrors the proven PRE24-06 hermetic pattern: a fixed market-state fixture
// (no live data dependency) and a prompt the parser accepts without
// clarification.
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

async function runWorkflow() {
  const svc = new DecisionDeskService(
    new MockMarketStateService(),
    undefined,
    emptyRegistry(),
  );
  const run = await svc.runWorkflow(
    "LONG rNVDA for 2000 dollars, exit before Monday. AI demand thesis, stress-test it.",
  );
  assert.equal(
    run.step,
    "DECISION_READY",
    `expected DECISION_READY, got ${run.step}: ${JSON.stringify(run).slice(0, 400)}`,
  );
  return run;
}

test("state machine: full official path walks legally to READY_FOR_EXTERNAL_EXECUTION", () => {
  const sm = createAgenticConnectionStateMachine("UNAVAILABLE");
  const path = [
    "AUTH_REQUIRED",
    "AUTHORIZING",
    "AUTHORIZED",
    "HUMAN_CONFIRMATION_REQUIRED",
    "READY_FOR_EXTERNAL_EXECUTION",
  ];
  for (const next of path) {
    sm.setState(next);
    assert.equal(sm.getState(), next);
    assert.equal(typeof sm.getNote(), "string");
    assert.ok(sm.getNote().length > 20, "every state carries a meaningful note");
  }
  assert.equal(sm.getState(), "READY_FOR_EXTERNAL_EXECUTION");
  assert.ok(
    /nothing has been executed/i.test(AGENTIC_STATE_NOTES.READY_FOR_EXTERNAL_EXECUTION),
    "the READY state's note states nothing has been executed",
  );
});

test("state machine: AUTHORIZED never reaches execution without human confirmation", () => {
  assert.equal(
    AGENTIC_TRANSITIONS.AUTHORIZED.includes("READY_FOR_EXTERNAL_EXECUTION"),
    false,
    "AUTHORIZED must NOT reach READY_FOR_EXTERNAL_EXECUTION directly",
  );
  assert.ok(
    AGENTIC_TRANSITIONS.AUTHORIZED.includes("HUMAN_CONFIRMATION_REQUIRED"),
    "AUTHORIZED must go through explicit human confirmation",
  );
});

test("state machine: all transition targets are real states and none represents an executed order", () => {
  for (const [from, targets] of Object.entries(AGENTIC_TRANSITIONS)) {
    assert.ok(targets.length > 0, `${from} has legal transitions`);
    for (const t of targets) {
      assert.ok(t in AGENTIC_TRANSITIONS, `target ${t} must be a real state`);
      assert.ok(
        !/EXECUTED|FILLED|ORDER_PLACED/i.test(t),
        `no state may represent an executed order: ${t}`,
      );
    }
  }
  // Exactly the seven official states exist and nothing else:
  assert.deepEqual(
    Object.keys(AGENTIC_TRANSITIONS).sort((a, b) => a.localeCompare(b)),
    [
      "AUTH_REQUIRED",
      "AUTHORIZED",
      "AUTHORIZING",
      "ERROR",
      "HUMAN_CONFIRMATION_REQUIRED",
      "READY_FOR_EXTERNAL_EXECUTION",
      "UNAVAILABLE",
    ].sort((a, b) => a.localeCompare(b)),
  );
});

test("state machine: illegal transitions are refused and leave state unchanged", () => {
  const sm = createAgenticConnectionStateMachine("UNAVAILABLE");
  assert.throws(
    () => sm.setState("READY_FOR_EXTERNAL_EXECUTION"),
    /Illegal Agentic connection transition/,
  );
  // Skipping human confirmation is refused:
  sm.setState("AUTH_REQUIRED");
  sm.setState("AUTHORIZING");
  sm.setState("AUTHORIZED");
  assert.throws(
    () => sm.setState("READY_FOR_EXTERNAL_EXECUTION"),
    /Illegal Agentic connection transition AUTHORIZED -> READY_FOR_EXTERNAL_EXECUTION/,
  );
  assert.equal(sm.getState(), "AUTHORIZED", "failed transition leaves state unchanged");
});

test("state machine: failure and recovery paths exist from every state", () => {
  for (const [from, targets] of Object.entries(AGENTIC_TRANSITIONS)) {
    if (from !== "ERROR") {
      assert.ok(targets.includes("ERROR"), `${from} must reach ERROR`);
    }
  }
  // States without a direct UNAVAILABLE edge have an explicit recovery path:
  assert.ok(
    AGENTIC_TRANSITIONS.AUTHORIZING.includes("AUTH_REQUIRED"),
    "AUTHORIZING recovers via a fresh OAuth attempt (AUTH_REQUIRED)",
  );
  assert.ok(
    AGENTIC_TRANSITIONS.HUMAN_CONFIRMATION_REQUIRED.includes("AUTH_REQUIRED"),
    "HUMAN_CONFIRMATION_REQUIRED recovers via re-authorization (AUTH_REQUIRED)",
  );
});

test("handoff document: complete through the real workflow (UNAVAILABLE by default)", async () => {
  const run = await runWorkflow();
  const doc = run.agenticHandoff;
  assert.ok(doc, "DECISION_READY carries an agenticHandoff");
  assert.equal(doc.handoffKind, "bitget-agentic-handoff");
  assert.equal(doc.contractVersion, "1");
  assert.equal(doc.executionAllowed, false);
  assert.equal(doc.orderPlaced, false);
  assert.equal(doc.currentState, "UNAVAILABLE", "app never claims a connection it did not observe");
  // research handoff embedded:
  assert.equal(doc.researchHandoff.executionAllowed, false);
  assert.equal(doc.researchHandoff.intendedHostTool, "@bitget-ai/bitget-agent-mcp --read-only");
  // required decision elements:
  assert.equal(doc.proposedAction.asset, "rNVDA");
  assert.equal(doc.proposedAction.decisionArtifactId, run.artifact.artifactId);
  assert.equal(doc.proposedAction.finalVerdict, run.artifact.decision.verdict);
  assert.ok(Array.isArray(doc.proposedAction.verdictReasons));
  assert.ok(
    Array.isArray(doc.proposedAction.stressResults) && doc.proposedAction.stressResults.length > 0,
  );
  assert.ok(Array.isArray(doc.proposedAction.limitations));
  assert.ok(doc.researchHandoff.thesis, "thesis present");
  assert.ok(doc.researchHandoff.challenge, "challenge present");
  assert.equal(typeof doc.handoffReason, "string");
  assert.ok(doc.handoffReason.length > 40, "the payload explains why the action is handed off");
  // authorization contract — the official OAuth rules:
  assert.equal(doc.authorizationContract.oauthTriggerTool, "authorize_start");
  assert.equal(doc.authorizationContract.statusConfirmationTool, "get_auth_status");
  assert.equal(doc.authorizationContract.productStoresCredentials, false);
  assert.equal(doc.authorizationContract.productAsksUserForApiKey, false);
  assert.equal(doc.authorizationContract.productBuildsOAuthUrl, false);
  assert.equal(doc.authorizationContract.sessionRestartRequiredBeforeAuthorizeStart, true);
  // anti-deception:
  assert.equal(doc.humanConfirmation.required, true);
  assert.ok(
    doc.humanConfirmation.whatAuthorizationDoesNotMean.some((s) => /order was placed/i.test(s)),
    "the payload itself must state authorization does NOT mean an order was placed",
  );
  // official flow steps reference the official mechanics:
  assert.ok(doc.officialFlowSteps.some((s) => s.includes("authorize_start")));
  assert.ok(doc.officialFlowSteps.some((s) => s.includes("get_auth_status")));
  assert.ok(doc.officialFlowSteps.some((s) => s.includes("never build or modify the OAuth URL")));
});

test("handoff document: JSON round-trip survives and still validates (SSE-safe)", async () => {
  const run = await runWorkflow();
  const doc = run.agenticHandoff;
  const roundTrip = JSON.parse(JSON.stringify(doc));
  assert.deepEqual(roundTrip, doc);
  assert.ok(validateAgenticHandoff(roundTrip), "round-tripped document validates");
});

test("validator: forgeries rejected", async () => {
  const doc = (await runWorkflow()).agenticHandoff;
  assert.equal(
    validateAgenticHandoff({ ...doc, executionAllowed: true }),
    null,
    "executionAllowed=true is not this contract",
  );
  assert.equal(validateAgenticHandoff({ ...doc, orderPlaced: true }), null);
  assert.equal(validateAgenticHandoff({ ...doc, currentState: "NOT_A_STATE" }), null);
  assert.equal(validateAgenticHandoff({ ...doc, handoffKind: "other" }), null);
  assert.equal(validateAgenticHandoff(null), null);
  assert.equal(validateAgenticHandoff(42), null);
  assert.equal(validateAgenticHandoff({}), null);
  assert.equal(
    validateAgenticHandoff({ ...doc, proposedAction: { asset: "x" } }),
    null,
    "proposedAction without stress results is not this contract",
  );
});

test("handoff contains no secrets and no credential-like fields (real workflow payload)", async () => {
  const doc = (await runWorkflow()).agenticHandoff;
  const json = JSON.stringify(doc);
  const patterns = [
    /sk-[A-Za-z0-9]{8,}/,
    /ghp_[A-Za-z0-9]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN (RSA |EC )?PRIVATE KEY/,
    /"apiKey"\s*:/i,
    /"secretKey"\s*:/i,
    /"passphrase"\s*:/i,
    /"api_key"\s*:/i,
    /"access_token"\s*:/i,
    /"bearer"\s*:/i,
  ];
  for (const p of patterns) {
    assert.ok(!p.test(json), `payload must not contain credential-like pattern ${p}`);
  }
  // The contract-level statements are the ONLY credential mentions:
  assert.ok(
    json.includes("productStoresCredentials"),
    "the contract explicitly states the product stores no credentials",
  );
});

test("workflow unchanged: agenticHandoff is additive-only with verbatim artifact fidelity", async () => {
  // Repeat runs identical without the handoff fields AND without run-identity
  // fields (artifactId/generatedAt embed timestamps, legitimately per-run):
  const strip = (r) => {
    const { agentHubHandoff, agenticHandoff, ...rest } = r;
    if (rest.artifact) {
      rest.artifact = { ...rest.artifact, artifactId: "<id>", generatedAt: "<ts>" };
    }
    return rest;
  };
  assert.deepEqual(
    strip(await runWorkflow()),
    strip(await runWorkflow()),
    "repeat runs without the handoffs are byte-identical",
  );
  // Handoff carries the artifact's exact values:
  const run = await runWorkflow();
  assert.deepEqual(run.agenticHandoff.proposedAction.trade, run.artifact.trade, "trade verbatim");
  assert.deepEqual(
    run.agenticHandoff.proposedAction.marketState,
    run.artifact.marketState,
    "market state verbatim",
  );
  assert.deepEqual(
    run.agenticHandoff.proposedAction.stressResults,
    run.artifact.scenarios,
    "stress results verbatim",
  );
  assert.deepEqual(
    run.agenticHandoff.researchHandoff.stressResults,
    run.artifact.scenarios,
    "research handoff stress results verbatim",
  );
  assert.deepEqual(
    run.agenticHandoff.proposedAction.verdictReasons,
    run.artifact.decision.reasons,
    "verdict reasons verbatim",
  );
  assert.equal(run.agenticHandoff.proposedAction.finalVerdict, run.artifact.decision.verdict);
});

test("no runtime dependencies: module is pure — no fetch/child_process/env access", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const raw = fs.readFileSync(
    path.join(__dirname, "..", "src", "adapters", "agentic", "handoff.ts"),
    "utf8",
  );
  // Strip comments first so the scan sees code, not documentation:
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  assert.ok(!/\bfetch\s*\(/.test(code), "no fetch");
  assert.ok(!/child_process/.test(code), "no child_process");
  assert.ok(!/process\.env/.test(code), "no process.env");
  assert.ok(!/\bspawn\s*\(|\bexec\s*\(|\bexecSync\s*\(/.test(code), "no process launching");
  assert.ok(!/require\s*\(|\bimport\s*[\s\S]{0,40}(http|net|fs|cp)\b/.test(code), "no runtime imports beyond types");
});
