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
