const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  EvidenceArbitrator,
} = require("../dist-core/src/adapters/evidence/arbitrator.js");

// ---------------------------------------------------------------------------
// Helpers — build NormalizedResearchObservation objects concisely
// ---------------------------------------------------------------------------

let idCounter = 0;
function makeObs(overrides) {
  idCounter += 1;
  return {
    id: `obs-${idCounter}`,
    providerId: "bitget-us-equity-mcp",
    source: `bitget-mcp-server/tool-${idCounter}`,
    title: "Quote: NVDA",
    summary: "Price 500.00",
    observedTimestamp: new Date("2026-01-01T00:00:00Z").toISOString(),
    providerStatus: "AVAILABLE",
    ...overrides,
  };
}

/** Two observations from different providers reporting the SAME value. */
function sameValuePair() {
  const now = new Date("2026-01-01T00:00:00Z");
  return [
    makeObs({
      providerId: "bitget-us-equity-mcp",
      source: "bitget-mcp-server/quote",
      value: 500,
      unit: "USD",
      observedTimestamp: now.toISOString(),
    }),
    makeObs({
      providerId: "bitget-signal-agent",
      source: "bitget-signal/price",
      value: 500,
      unit: "USD",
      observedTimestamp: now.toISOString(),
    }),
  ];
}

/** Two observations from different providers reporting DIFFERENT values. */
function differentValuePair() {
  const now = new Date("2026-01-01T00:00:00Z");
  return [
    makeObs({
      providerId: "bitget-us-equity-mcp",
      source: "bitget-mcp-server/quote",
      value: 500,
      unit: "USD",
      observedTimestamp: now.toISOString(),
    }),
    makeObs({
      providerId: "bitget-signal-agent",
      source: "bitget-signal/price",
      value: 550,
      unit: "USD",
      observedTimestamp: now.toISOString(),
    }),
  ];
}

// ---------------------------------------------------------------------------
// 1. Same value from multiple sources → all OK
// ---------------------------------------------------------------------------

test("arbitrator: same value from multiple sources → all OK, no limitations", () => {
  const arb = new EvidenceArbitrator();
  const obs = sameValuePair();
  const { evidence, limitations } = arb.arbitrate(obs, {
    now: new Date("2026-01-01T00:05:00Z"),
  });

  assert.equal(evidence.length, 2);
  assert.equal(limitations.length, 0);
  for (const item of evidence) {
    assert.equal(item.conflictState, "OK");
    assert.equal(item.provenanceType, "OBSERVED_FACT");
    assert.equal(item.observedValue, 500);
    assert.equal(item.observedUnit, "USD");
  }
});

// ---------------------------------------------------------------------------
// 2. Different values from multiple sources → UNRESOLVED_CONFLICT + limitation
// ---------------------------------------------------------------------------

test("arbitrator: different values → UNRESOLVED_CONFLICT for all, limitation attached", () => {
  const arb = new EvidenceArbitrator();
  const obs = differentValuePair();
  const { evidence, limitations } = arb.arbitrate(obs, {
    now: new Date("2026-01-01T00:05:00Z"),
  });

  assert.equal(evidence.length, 2);
  for (const item of evidence) {
    assert.equal(item.conflictState, "UNRESOLVED_CONFLICT");
  }

  // Both source identities must be preserved
  const sources = evidence.map((e) => e.source).sort();
  assert.deepEqual(sources, ["bitget-mcp-server/quote", "bitget-signal/price"].sort());

  // conflictingSources must list ALL sources that contributed
  for (const item of evidence) {
    assert.ok(item.conflictingSources);
    assert.ok(item.conflictingSources.length >= 2);
  }

  // A limitation must be attached
  assert.ok(limitations.length >= 1);
  assert.ok(
    limitations.some((l) => l.includes("conflict")),
    `expected a conflict limitation, got: ${limitations.join(" | ")}`
  );

  // The limitation must NOT silently pick a winner — it should mention both values
  const conflictLimit = limitations.find((l) => l.includes("conflict"));
  assert.ok(conflictLimit.includes("500"));
  assert.ok(conflictLimit.includes("550"));
});

// ---------------------------------------------------------------------------
// 3. Stale source → STALE state + limitation
// ---------------------------------------------------------------------------

test("arbitrator: stale source → STALE state and limitation", () => {
  const arb = new EvidenceArbitrator({ staleThresholdMs: 60 * 1000 }); // 1 minute
  const obs = [
    makeObs({
      providerId: "bitget-us-equity-mcp",
      source: "bitget-mcp-server/quote",
      value: 500,
      unit: "USD",
      observedTimestamp: new Date("2025-12-01T00:00:00Z").toISOString(), // very old
    }),
  ];

  const { evidence, limitations } = arb.arbitrate(obs, {
    now: new Date("2026-01-01T00:00:00Z"),
  });

  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].conflictState, "STALE");

  // Timestamp must be preserved
  assert.equal(evidence[0].retrievedAt, obs[0].observedTimestamp);

  // Limitation must mention staleness
  assert.ok(limitations.length >= 1);
  assert.ok(
    limitations.some((l) => l.toLowerCase().includes("stale")),
    `expected a stale limitation, got: ${limitations.join(" | ")}`
  );
});

// ---------------------------------------------------------------------------
// 4. Unavailable source → UNAVAILABLE state + limitation
// ---------------------------------------------------------------------------

test("arbitrator: unavailable source → UNAVAILABLE state and limitation", () => {
  const arb = new EvidenceArbitrator();
  const obs = [
    makeObs({
      providerId: "bitget-us-equity-mcp",
      source: "bitget-mcp-server/quote",
      providerStatus: "UNAVAILABLE",
      value: 500,
      unit: "USD",
    }),
  ];

  const { evidence, limitations } = arb.arbitrate(obs, {
    now: new Date("2026-01-01T00:00:00Z"),
  });

  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].conflictState, "UNAVAILABLE");

  // Source identity must be preserved even when unavailable
  assert.equal(evidence[0].source, "bitget-mcp-server/quote");
  assert.equal(evidence[0].providerId, "bitget-us-equity-mcp");

  // Limitation must mention unavailable
  assert.ok(limitations.length >= 1);
  assert.ok(
    limitations.some((l) => l.toLowerCase().includes("unavailable")),
    `expected an unavailable limitation, got: ${limitations.join(" | ")}`
  );
});

// ---------------------------------------------------------------------------
// 5. Duplicate source → DUPLICATE state
// ---------------------------------------------------------------------------

test("arbitrator: duplicate source (same provider+id) → DUPLICATE state", () => {
  const arb = new EvidenceArbitrator();
  const base = makeObs({
    providerId: "bitget-us-equity-mcp",
    source: "bitget-mcp-server/quote",
    value: 500,
    unit: "USD",
  });
  // Exact duplicate — same id and providerId
  const dup = { ...base };

  const { evidence } = arb.arbitrate([base, dup], {
    now: new Date("2026-01-01T00:05:00Z"),
  });

  // Both items are retained, but the duplicate is flagged
  assert.equal(evidence.length, 2);
  const states = evidence.map((e) => e.conflictState);
  assert.ok(states.includes("DUPLICATE"), `expected a DUPLICATE state, got: ${states.join(", ")}`);

  // The original (non-duplicate) should not be DUPLICATE
  const nonDup = evidence.find((e) => e.conflictState !== "DUPLICATE");
  assert.ok(nonDup, "expected at least one non-duplicate item");
});

// ---------------------------------------------------------------------------
// 6. Malformed external observation → UNAVAILABLE, source identity preserved
// ---------------------------------------------------------------------------

test("arbitrator: malformed external observation → UNAVAILABLE, source preserved", () => {
  const arb = new EvidenceArbitrator();
  const obs = [
    makeObs({
      providerId: "bitget-us-equity-mcp",
      source: "bitget-mcp-server/quote",
      value: NaN, // malformed numeric value
      unit: "USD",
    }),
  ];

  const { evidence, limitations } = arb.arbitrate(obs, {
    now: new Date("2026-01-01T00:00:00Z"),
  });

  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].conflictState, "UNAVAILABLE");

  // Source identity must be preserved
  assert.equal(evidence[0].source, "bitget-mcp-server/quote");
  assert.equal(evidence[0].providerId, "bitget-us-equity-mcp");

  // The malformed value must not leak into observedValue
  assert.equal(evidence[0].observedValue, undefined);

  // A limitation should be attached (unavailable)
  assert.ok(limitations.length >= 1);
  assert.ok(
    limitations.some((l) => l.toLowerCase().includes("unavailable")),
    `expected an unavailable limitation, got: ${limitations.join(" | ")}`
  );
});

// ---------------------------------------------------------------------------
// Extra (PRE24-04): AI interpretations never enter numeric conflict detection
// ---------------------------------------------------------------------------

test("arbitrator: AI interpretation with a value never conflicts with an observed fact", () => {
  const arb = new EvidenceArbitrator();
  const now = new Date("2026-01-01T00:05:00Z");
  const obs = [
    makeObs({
      providerId: "bitget-us-equity-mcp",
      source: "bitget-mcp-server/quote",
      title: "Quote: NVDA",
      value: 500,
      unit: "USD",
    }),
    makeObs({
      providerId: "bitget-signal-agent",
      source: "skill/technical-analysis",
      title: "Quote: NVDA",
      // Same metric key, wildly different value — but it is an AI
      // interpretation, so it must NOT create a conflict with the fact.
      value: 320,
      unit: "USD",
      provenanceType: "AI_INTERPRETATION",
    }),
  ];

  const { evidence, limitations } = arb.arbitrate(obs, { now });
  const fact = evidence.find((e) => e.provenanceType === "OBSERVED_FACT");
  const interp = evidence.find((e) => e.provenanceType === "AI_INTERPRETATION");

  assert.ok(fact, "observed fact must be present");
  assert.ok(interp, "AI interpretation must be present");
  assert.equal(fact.conflictState, "OK", "fact must not be dragged into a conflict by an AI reading");
  assert.equal(interp.conflictState, "OK", "AI interpretation passes through without conflict detection");
  assert.ok(!limitations.some((l) => l.toLowerCase().includes("conflict")), "no conflict limitation may be manufactured from an AI interpretation");
});

// ---------------------------------------------------------------------------
// Extra: no LLM reconciliation — the arbitrator must be deterministic
// ---------------------------------------------------------------------------

test("arbitrator: produces identical output for identical input (determinism)", () => {
  const arb = new EvidenceArbitrator();
  const obs = differentValuePair();
  const now = new Date("2026-01-01T00:05:00Z");

  const a = arb.arbitrate(obs, { now });
  const b = arb.arbitrate(obs, { now });

  assert.deepEqual(a.limitations, b.limitations);
  assert.deepEqual(
    a.evidence.map((e) => e.conflictState),
    b.evidence.map((e) => e.conflictState)
  );
});

// ---------------------------------------------------------------------------
// Extra (PRE24-04): the deterministic calculation layer must consume ONLY
// the normalized market state approved by the MarketStateService — never
// evidence values, however many sources or conflicts exist.
// ---------------------------------------------------------------------------

test("arbitrator: conflicting evidence values never leak into scenario math", async () => {
  process.env.TEST_MODE = "mock_llm";
  const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");
  const { ResearchProviderRegistry } = require("../dist-core/src/adapters/research/registry.js");

  // Poisoned market state: a distinctive price the scenario math WILL use.
  // If any evidence value leaked into calculations, outputs would diverge.
  const now = new Date("2026-01-01T00:05:00Z");
  const poisonedMarketState = {
    observedAt: now.toISOString(),
    instrumentPrice: 777.25,
    bid: 776.5,
    ask: 778.0,
    bidSize: 10,
    askSize: 12,
    spread: 1.5,
    spreadPct: 0.19,
    referenceSymbol: "NVDA",
    referencePrice: 770,
    referencePreviousClose: 765,
    referenceObservedAt: now.toISOString(),
    referenceSourceName: "Test Reference Source",
    basis: 7.25,
    basisPct: 0.941,
    btcPrice: 85000,
    btcObservedAt: now.toISOString(),
    sessionStatus: "WEEKEND",
    tokenMarketStatus: "ACTIVE",
    liquidityClass: "NORMAL",
    dataQuality: "COMPLETE",
    sources: [{ id: "test-bitget", name: "Test Bitget Source", observedAt: now.toISOString() }],
  };
  const mockMarket = { async getMarketState() { return { ...poisonedMarketState }; } };

  const TRADE = "LONG rNVDA at 200 for 2000 dollars, exit before Monday";

  async function runWithObservations(observations) {
    const registry = new ResearchProviderRegistry();
    registry.register({
      providerId: "stub-evil",
      getStatus: async () => "AVAILABLE",
      getObservations: async () => observations,
    });
    const desk = new DecisionDeskService(mockMarket, undefined, registry);
    const result = await desk.runWorkflow(TRADE, { useFixture: false });
    assert.equal(result.step, "DECISION_READY", `workflow must stay ready, got ${result.step}`);
    return result;
  }

  // Baseline: no external evidence at all.
  const baseline = await runWithObservations([]);

  // Attacked: providers reporting wildly conflicting prices for the same
  // metric — precisely what the arbitrator flags as UNRESOLVED_CONFLICT.
  const attacked = await runWithObservations([
    makeObs({ providerId: "p1", source: "p1/quote", title: "Quote: NVDA", value: 500, unit: "USD", observedTimestamp: now.toISOString() }),
    makeObs({ providerId: "p2", source: "p2/quote", title: "Quote: NVDA", value: 12345.67, unit: "USD", observedTimestamp: now.toISOString() }),
    makeObs({ providerId: "p3", source: "p3/quote", title: "Quote: NVDA", value: 0.01, unit: "USD", observedTimestamp: now.toISOString() }),
  ]);

  // 1. The arbitrator did its job: the conflict is surfaced, not hidden.
  const conflicted = attacked.artifact.evidence.filter((e) => e.conflictState === "UNRESOLVED_CONFLICT");
  assert.ok(conflicted.length >= 2, "conflicting sources must be flagged");
  assert.ok(
    attacked.limitations.some((l) => l.toLowerCase().includes("conflict")),
    "a conflict limitation must be attached"
  );

  // 2. Yet the deterministic scenario math is BYTE-IDENTICAL to baseline:
  // evidence values never entered the calculation layer.
  assert.deepEqual(
    baseline.artifact.scenarios,
    attacked.artifact.scenarios,
    "scenario math must be identical despite conflicting evidence"
  );
});
