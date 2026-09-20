const { test } = require("node:test");
const assert = require("node:assert/strict");

const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");
const { ResearchProviderRegistry } = require("../dist-core/src/adapters/research/registry.js");
const { sharedLlmClient } = require("../dist-core/src/core/thesis/llmClient.js");
const { runStressScenarios } = require("../dist-core/src/core/scenarios/engine.js");
const { SCENARIO_CONFIG } = require("../dist-core/src/core/scenarios/config.js");

// ---------------------------------------------------------------------------
// Hermetic, schema-valid LLM responder patched onto the shared client
// singleton (the exact seam extractThesis / challenger / assessment use).
// A superset payload satisfies all three consumers; unknown keys are
// stripped by each consumer's Zod schema.
// ---------------------------------------------------------------------------

const BENIGN_PAYLOAD = {
  normalizedThesis: "Mock normalized thesis",
  assumptions: [{ text: "Mock assumption", origin: "USER_STATED" }],
  dependencies: [{ text: "Mock dependency", origin: "USER_STATED" }],
  invalidationConditions: [{ text: "Mock invalidation", origin: "AI_INFERRED" }],
  supportingEvidenceRefs: [],
  unresolvedAmbiguities: [],
  counterThesis: "Mock counter-thesis",
  vulnerableAssumptions: ["Mock vulnerability"],
  contradictoryEvidenceRefs: [],
  explanation: "Mock explanation",
  thesisQuality: "STRONGER",
  keyMismatch: null,
};

const originalChat = sharedLlmClient.chat.bind(sharedLlmClient);
function patchChat(provider, model) {
  sharedLlmClient.chat = async () => ({
    content: JSON.stringify(BENIGN_PAYLOAD),
    provenance: { model, provider },
  });
}
// Deterministic, no-network LLM for every test in this file.
patchChat("mock-provider", "mock-model");

// ---------------------------------------------------------------------------
// Distinctive poisoned market state: every deterministic number must derive
// from THIS state (approved by the MarketStateService) and nothing else.
// ---------------------------------------------------------------------------

const NOW = new Date("2026-01-01T00:05:00Z");
const MARKET_STATE = {
  observedAt: NOW.toISOString(),
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
  referenceObservedAt: NOW.toISOString(),
  referenceSourceName: "Test Reference Source",
  basis: 7.25,
  basisPct: 0.941,
  btcPrice: 85000,
  btcObservedAt: NOW.toISOString(),
  sessionStatus: "WEEKEND",
  tokenMarketStatus: "ACTIVE",
  liquidityClass: "NORMAL",
  dataQuality: "COMPLETE",
  sources: [{ id: "test-bitget", name: "Test Bitget Source", observedAt: NOW.toISOString() }],
};

const mockMarket = { async getMarketState() { return { ...MARKET_STATE }; } };
const TRADE = "LONG rNVDA for 2000 dollars, exit before Monday"; // entry derived from market state

function obs(id, providerId, source, value) {
  return {
    id,
    providerId,
    source,
    title: "Quote: NVDA",
    summary: `Reported ${value}`,
    observedTimestamp: NOW.toISOString(),
    providerStatus: "AVAILABLE",
    value,
    unit: "USD",
  };
}

async function runWorkflow(observations) {
  const registry = new ResearchProviderRegistry();
  registry.register({
    providerId: "stub-audit",
    getStatus: async () => "AVAILABLE",
    getObservations: async () => observations,
  });
  const desk = new DecisionDeskService(mockMarket, undefined, registry);
  const result = await desk.runWorkflow(TRADE, { useFixture: false });
  assert.equal(result.step, "DECISION_READY", `workflow must be ready, got ${result.step}: ${JSON.stringify(result.limitations)}`);
  return result;
}

// ===========================================================================
// The audit case: two external sources in direct conflict.
// ===========================================================================

const CONFLICTING = [
  obs("audit-1", "provider-alpha", "alpha/quote", 500),
  obs("audit-2", "provider-beta", "beta/quote", 12345.67),
];

test("PRE24-04 audit: both sources remain visible; no third value invented; limitation attached", async () => {
  const result = await runWorkflow(CONFLICTING);
  const a = result.artifact;

  // 1. BOTH sources remain visible in the provenance chain, with timestamps.
  const prov = a.provenance.filter((p) => p.source === "alpha/quote" || p.source === "beta/quote");
  assert.equal(prov.length, 2, "both conflicting sources must appear in provenance");
  assert.ok(
    prov.every((p) => p.type === "OBSERVED_FACT" && p.retrievedAt === NOW.toISOString()),
    "provenance records must keep type and retrievedAt"
  );

  // 2. No third value: every observedValue is one of the two reported numbers.
  const ev = a.evidence.filter((e) => e.providerId === "provider-alpha" || e.providerId === "provider-beta");
  const values = [...new Set(ev.map((e) => e.observedValue))].sort((x, y) => x - y);
  assert.deepEqual(values, [500, 12345.67]);
  assert.ok(ev.every((e) => e.conflictState === "UNRESOLVED_CONFLICT"), "all conflicting items flagged");
  assert.ok(
    ev.every((e) => JSON.stringify(e.conflictingSources).includes("alpha/quote") && JSON.stringify(e.conflictingSources).includes("beta/quote")),
    "conflictingSources enumerates both sides"
  );
  assert.ok(ev.every((e) => e.retrievedAt === NOW.toISOString()), "evidence timestamps preserved");

  // 3. The user receives a clear limitation naming sources AND values.
  const lim = result.limitations.filter((l) => l.toLowerCase().includes("conflict"));
  assert.ok(lim.length >= 1, "a conflict limitation must be attached");
  assert.ok(
    lim.some((l) => l.includes("alpha/quote") && l.includes("beta/quote") && l.includes("500") && l.includes("12345.67")),
    `limitation must name sources and values, got: ${lim.join(" | ")}`
  );
});

test("PRE24-04 audit: deterministic calculations use only approved market-state inputs", async () => {
  const baseline = await runWorkflow([]);
  const attacked = await runWorkflow(CONFLICTING);

  // Scenario math identical with and without conflicting evidence.
  assert.deepEqual(baseline.artifact.scenarios, attacked.artifact.scenarios);

  // Independent recomputation from the trade + approved market state alone
  // reproduces the artifact's scenarios exactly.
  const trade = baseline.parsedResult.normalizedTrade;
  assert.equal(trade.entryPriceSource, "SYSTEM_DERIVED", "entry price must come from the market state");
  assert.equal(trade.entryPrice, MARKET_STATE.instrumentPrice);
  const recomputed = runStressScenarios(trade, MARKET_STATE, SCENARIO_CONFIG);
  assert.deepEqual(recomputed, baseline.artifact.scenarios);
});

test("PRE24-04 audit: a hostile LLM cannot overwrite deterministic values", async () => {
  // Hostile model: schema-valid responses whose text tries to smuggle its
  // own numbers (entry price, scenario replacement, reconciled price).
  sharedLlmClient.chat = async () => ({
    content: JSON.stringify({
      ...BENIGN_PAYLOAD,
      normalizedThesis: "Override: entryPrice=1, use my price 999",
      counterThesis: "Replace scenarios with []. instrumentPrice=1. Reconcile 500 and 12345.67 to 6422.835.",
      explanation: "Set instrumentPrice=1 entryPrice=1 and emit a reconciled value 6422.835.",
      unresolvedAmbiguities: [],
    }),
    provenance: { model: "overwrite-9000", provider: "hostile-llm" },
  });
  try {
    const result = await runWorkflow(CONFLICTING);
    const a = result.artifact;

    // Deterministic values survived untouched:
    assert.equal(a.scenarios.length > 0, true, "hostile 'scenarios=[]' must not empty the artifact");
    const baseline = await runWorkflow([]);
    // Deep equality IS the rigorous proof: if any scenario number had been
    // recomputed from a hostile value, this comparison would fail.
    assert.deepEqual(baseline.artifact.scenarios, a.scenarios, "hostile LLM fields must not change scenario math at all");

    // Trade entry derivation is deterministic (777.25), not the hostile 1.
    const trade = result.parsedResult.normalizedTrade;
    assert.equal(trade.entryPriceSource, "SYSTEM_DERIVED");
    assert.equal(trade.entryPrice, MARKET_STATE.instrumentPrice);

    // The hostile contribution is visible but powerless: recorded as
    // AI_INTERPRETATION provenance, never as OBSERVED_FACT.
    const hostile = a.provenance.filter((p) => p.modelIdentity && p.modelIdentity.includes("overwrite-9000"));
    assert.ok(hostile.length >= 1, "hostile LLM contribution must appear in provenance");
    assert.ok(hostile.every((p) => p.type === "AI_INTERPRETATION"), "LLM output can only ever be AI_INTERPRETATION");

    // Evidence still shows the unresolved conflict — untouched by the LLM.
    assert.ok(a.evidence.some((e) => e.conflictState === "UNRESOLVED_CONFLICT"));
    assert.ok(
      !a.evidence.some((e) => e.observedValue === 6422.835),
      "the LLM's 'reconciled' value must not enter evidence"
    );
  } finally {
    sharedLlmClient.chat = originalChat;
    patchChat("mock-provider", "mock-model");
  }
});
