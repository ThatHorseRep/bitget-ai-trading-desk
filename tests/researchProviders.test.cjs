const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DecisionDeskService } = require('../dist-core/src/services/decisionDeskService.js');
const { ResearchProviderRegistry } = require('../dist-core/src/adapters/research/registry.js');
const { createDefaultResearchRegistry } = require('../dist-core/src/adapters/research/defaultRegistry.js');
const { execSync } = require('node:child_process');
const path = require('node:path');

// Hermetic LLM: the llmClient/extractor/challenger short-circuit to canned
// JSON when TEST_MODE=mock_llm — no network, deterministic thesis layer.
process.env.TEST_MODE = 'mock_llm';

const FIXTURE_INPUT = {
  asset: "rNVDA",
  direction: "LONG",
  positionSizeUsd: 2000,
  thesis: "AI infrastructure demand still looks strong. Stress-test it."
};

// Deterministic market state (same shape the production service returns) so
// these tests exercise the provider/evidence path, not the network.
const MOCK_MARKET_STATE = {
  observedAt: "2026-01-01T18:00:00.000Z",
  instrumentPrice: 120,
  bid: 119.4,
  ask: 120.6,
  bidSize: 30,
  askSize: 28,
  spread: 1.2,
  spreadPct: 1.0,
  referenceSymbol: "NVDA",
  referencePrice: 117,
  referencePreviousClose: 116.5,
  referenceObservedAt: "2026-01-01T18:00:00.000Z",
  referenceSourceName: "Test Reference Source",
  basis: 3,
  basisPct: 2.56410256,
  btcPrice: 85000,
  btcObservedAt: "2026-01-01T18:00:00.000Z",
  sessionStatus: "WEEKEND",
  tokenMarketStatus: "ACTIVE",
  liquidityClass: "NORMAL",
  dataQuality: "COMPLETE",
  sources: [
    { id: "test-bitget", name: "Test Bitget Source", observedAt: "2026-01-01T18:00:00.000Z" }
  ]
};

class MockMarketStateService {
  async getMarketState() { return { ...MOCK_MARKET_STATE }; }
}

function makeProvider(id, { status = "AVAILABLE", observations = [], throws = false, returns } = {}) {
  return {
    get providerId() { return id; },
    async getStatus() {
      if (throws) throw new Error(`${id} status exploded`);
      return status;
    },
    async getObservations() {
      if (throws) throw new Error(`${id} observations exploded`);
      return returns !== undefined ? returns : observations;
    }
  };
}

function observation(overrides = {}) {
  return {
    id: `obs-${Math.random().toString(36).slice(2, 8)}`,
    providerId: "stub",
    source: "Stub Source",
    title: "Stub observation",
    summary: "Stub summary for PRE24-01 tests",
    observedTimestamp: new Date().toISOString(),
    providerStatus: "AVAILABLE",
    ...overrides
  };
}

// Prove the core domain never imports from the adapter layer (PRE24-01
// boundary: no raw MCP responses — or any adapter type — inside the domain).
test('PRE24-01: domain layer does not import adapters', () => {
  const out = execSync(
    `grep -rn "adapters/" ${JSON.stringify(path.join(__dirname, '..', 'src', 'domain'))} || true`,
    { encoding: 'utf8' }
  );
  assert.equal(out.trim(), '', 'domain must not import from adapters');
});

test('PRE24-01: composition root registers the four provider slots', () => {
  const registry = createDefaultResearchRegistry();
  const ids = registry.getRegisteredProviders();
  // PRE24-03: slot 3 defaults to the documented live Signal MCP provider;
  // the AI-host file bridge remains available via signalBridgePath.
  assert.deepEqual(ids, [
    'legacy-evidence-provider',
    'bitget-us-equity-mcp',
    'bitget-signal',
  ]);
  // Chainbase AgentKey slot is reserved but optional — when a provider is
  // supplied for it, it is appended without any core change.
  const withChainbase = createDefaultResearchRegistry({
    providers: [makeProvider('chainbase-agentkey')]
  });
  assert.deepEqual(withChainbase.getRegisteredProviders(), ['chainbase-agentkey']);
});

test('PRE24-01: provider registry semantics', async (t) => {
  await t.test('providers can be absent (empty registry, full workflow still completes)', async () => {
    const emptyRegistry = new ResearchProviderRegistry();
    const desk = new DecisionDeskService(new MockMarketStateService(), undefined, emptyRegistry);

    const result = await desk.runWorkflow(FIXTURE_INPUT, { useFixture: false });

    assert.strictEqual(result.step, "DECISION_READY");
    assert.ok(result.artifact);
    // External evidence absent — artifact still produced.
    assert.ok(Array.isArray(result.artifact.evidence));
    assert.strictEqual(result.artifact.evidence.length, 0);
  });

  await t.test('provider failure does not crash the core (throwing provider isolated)', async () => {
    const registry = new ResearchProviderRegistry();
    registry.register(makeProvider('failing-provider', { throws: true }));
    registry.register(makeProvider('empty-provider'));

    // Direct registry contract: gather survives a throwing provider.
    const observations = await registry.gatherObservations("rNVDA", "thesis");
    assert.ok(Array.isArray(observations));
    assert.strictEqual(observations.length, 0);

    // Through the full workflow: still completes with zero evidence.
    const desk = new DecisionDeskService(new MockMarketStateService(), undefined, registry);
    const result = await desk.runWorkflow(FIXTURE_INPUT, { useFixture: false });
    assert.strictEqual(result.step, "DECISION_READY");
    assert.ok(result.artifact);
    assert.strictEqual(result.artifact.evidence.length, 0);
  });

  await t.test('misbehaving provider returning non-array does not crash the core', async () => {
    const registry = new ResearchProviderRegistry();
    registry.register(makeProvider('broken-shape-provider', { returns: null }));

    const observations = await registry.gatherObservations("rNVDA", "thesis");
    assert.ok(Array.isArray(observations));
    assert.strictEqual(observations.length, 0);

    const desk = new DecisionDeskService(new MockMarketStateService(), undefined, registry);
    const result = await desk.runWorkflow(FIXTURE_INPUT, { useFixture: false });
    assert.strictEqual(result.step, "DECISION_READY");
  });

  await t.test('existing workflow behaves exactly as before when optional providers are disabled', async () => {
    // Golden path: fixture mode bypasses providers entirely (pre-PRE24-01 behavior).
    const fixtureDesk = new DecisionDeskService();
    const fixtureResult = await fixtureDesk.runWorkflow(FIXTURE_INPUT, { useFixture: true });
    assert.strictEqual(fixtureResult.step, "DECISION_READY");
    assert.ok(fixtureResult.artifact.evidence.length > 0);
    assert.ok(["PROCEED", "WAIT", "REDUCE", "REJECT"].includes(fixtureResult.artifact.decision.verdict));

    // Disabled providers (UNAVAILABLE are skipped) + deterministic market path:
    // workflow completes identically, just without external evidence.
    const disabledRegistry = new ResearchProviderRegistry();
    disabledRegistry.register(makeProvider('disabled-provider', { status: "UNAVAILABLE" }));
    const disabledDesk = new DecisionDeskService(new MockMarketStateService(), undefined, disabledRegistry);
    const disabledResult = await disabledDesk.runWorkflow(FIXTURE_INPUT, { useFixture: false });

    assert.strictEqual(disabledResult.step, "DECISION_READY");
    assert.ok(disabledResult.artifact);
    assert.strictEqual(disabledResult.artifact.evidence.length, 0);
    // Same decision-policy surface as before PRE24-01.
    assert.ok(["PROCEED", "WAIT", "REDUCE", "REJECT"].includes(disabledResult.artifact.decision.verdict));
    // B02 contract: 4 core scenarios, plus the optional thesis-failure scenario
    // when the thesis exposes a concrete dependency (engine may append it).
    assert.ok(disabledResult.artifact.scenarios.length >= 4);
    assert.ok(disabledResult.artifact.marketState.instrumentPrice > 0);
  });

  await t.test('observations normalize into evidence with full provenance fields', async () => {
    const registry = new ResearchProviderRegistry();
    registry.register(makeProvider('stub-provider', {
      observations: [observation({
        id: 'prov-1',
        providerId: 'stub-provider',
        url: 'https://example.com/stub',
        value: 123.45,
        unit: 'USD'
      })]
    }));
    const desk = new DecisionDeskService(new MockMarketStateService(), undefined, registry);
    const result = await desk.runWorkflow(FIXTURE_INPUT, { useFixture: false });

    assert.strictEqual(result.step, "DECISION_READY");
    const ev = result.artifact.evidence.find(e => e.id === 'prov-1');
    assert.ok(ev, 'stub observation must flow through to evidence');
    assert.equal(ev.providerId, 'stub-provider');
    assert.equal(ev.source, 'Stub Source');
    assert.equal(ev.url, 'https://example.com/stub');
    assert.ok(ev.retrievedAt, 'observed/retrieved timestamp preserved');
    // Research-provider observations are labeled RESEARCH_PROVIDER —
    // distinct from the legacy provider's LIVE_RETRIEVED classification.
    assert.equal(ev.state, 'RESEARCH_PROVIDER');
    assert.equal(ev.provenanceType, 'OBSERVED_FACT');
    assert.equal(ev.observedValue, 123.45);
    assert.equal(ev.observedUnit, 'USD');
  });
});
