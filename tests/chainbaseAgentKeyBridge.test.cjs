const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Hermetic LLM: thesis/challenger short-circuit — no network.
process.env.TEST_MODE = "mock_llm";

const {
  ChainbaseAgentKeyBridge,
  validateImportedObservation,
  validateImportedObservations,
  capabilitiesForResearchTopic,
  toTokenizedStockReference,
  AGENTKEY_CAPABILITIES,
} = require("../dist-core/src/adapters/research/chainbaseAgentKeyBridge.js");
const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");
const { ResearchProviderRegistry } = require("../dist-core/src/adapters/research/registry.js");
const { createDefaultResearchRegistry } = require("../dist-core/src/adapters/research/defaultRegistry.js");

// Deterministic market state (same shape the production service returns).
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

// =========================================================================
// Unit: use-case gating — only tokenized-stock research is in scope
// =========================================================================

test("AgentKey: asset gate maps rTokens and rejects plain crypto", () => {
  assert.strictEqual(toTokenizedStockReference("rNVDA"), "NVDA");
  assert.strictEqual(toTokenizedStockReference("rNVDAUSDT"), "NVDA");
  assert.strictEqual(toTokenizedStockReference("rTSLA"), "TSLA");
  assert.strictEqual(toTokenizedStockReference("BTC"), null);
  assert.strictEqual(toTokenizedStockReference("BTCUSDT"), null);
  assert.strictEqual(toTokenizedStockReference("SOL"), null);
  assert.strictEqual(toTokenizedStockReference(""), null);
});

test("AgentKey: capability routing covers the five official data families", () => {
  assert.deepStrictEqual(
    [...AGENTKEY_CAPABILITIES].sort(),
    ["company", "market", "news", "on-chain", "social"].sort(),
  );
  assert.deepStrictEqual(capabilitiesForResearchTopic("on-chain whale flows and wallet activity"), ["on-chain"]);
  assert.deepStrictEqual(capabilitiesForResearchTopic("latest news and the upcoming catalyst"), ["news"]);
  assert.deepStrictEqual(capabilitiesForResearchTopic("social sentiment and community mentions"), ["social"]);
  assert.deepStrictEqual(capabilitiesForResearchTopic("company fundamentals and revenue"), ["company"]);
  assert.deepStrictEqual(capabilitiesForResearchTopic("current price and market trend"), ["market"]);
  // Unknown topics default to the multi-signal core, not every capability.
  assert.deepStrictEqual(capabilitiesForResearchTopic(undefined), ["market", "news", "on-chain"]);
  assert.deepStrictEqual(capabilitiesForResearchTopic("something unrelated entirely"), ["market", "news", "on-chain"]);
});

// =========================================================================
// Unit: import validation — untrustworthy entries are skipped individually
// =========================================================================

function validEntry(overrides = {}) {
  return {
    id: "imp-1",
    title: "NVDA price check",
    summary: "Reference price 117.20 USD from aggregated market data.",
    observedTimestamp: "2026-01-01T17:55:00.000Z",
    capability: "market",
    source: "aggregated-market-feed",
    providerStatus: "AVAILABLE",
    provenanceType: "OBSERVED_FACT",
    value: 117.2,
    url: "https://example.com/nvda",
    ...overrides,
  };
}

test("AgentKey: valid structured observations import with exact attribution", () => {
  const obs = validateImportedObservation(validEntry());
  assert.ok(obs);
  assert.strictEqual(obs.providerId, "chainbase-agentkey");
  assert.strictEqual(obs.source, "chainbase-agentkey/market/aggregated-market-feed");
  assert.strictEqual(obs.providerStatus, "AVAILABLE");
  assert.strictEqual(obs.provenanceType, "OBSERVED_FACT");
  assert.strictEqual(obs.value, 117.2);
  assert.strictEqual(obs.observedTimestamp, "2026-01-01T17:55:00.000Z");
  assert.strictEqual(obs.url, "https://example.com/nvda");
});

test("AgentKey: a mislabeled entry is re-attributed to Chainbase, never trusted", () => {
  // An AI host (or an attacker of the bridge file) claims the observation
  // came from an official Bitget source. The validator must override the
  // claim with the bridge's own provider identity.
  const obs = validateImportedObservation(validEntry({ providerId: "bitget-official-mcp" }));
  assert.ok(obs);
  assert.strictEqual(obs.providerId, "chainbase-agentkey");
  assert.strictEqual(obs.source.startsWith("chainbase-agentkey/"), true);
});

test("AgentKey: invalid import entries are rejected (never normalized into junk)", () => {
  assert.strictEqual(validateImportedObservation(validEntry({ id: "" })), null);
  assert.strictEqual(validateImportedObservation(validEntry({ title: "" })), null);
  assert.strictEqual(validateImportedObservation(validEntry({ summary: "" })), null);
  assert.strictEqual(validateImportedObservation(validEntry({ observedTimestamp: "not-a-date" })), null);
  assert.strictEqual(validateImportedObservation(validEntry({ capability: "crypto-prices" })), null, "undocumented capability rejected");
  assert.strictEqual(validateImportedObservation(validEntry({ capability: 42 })), null);
  assert.strictEqual(validateImportedObservation(null), null);
  assert.strictEqual(validateImportedObservation("string"), null);
  assert.strictEqual(validateImportedObservation(validEntry({ value: "117.2" })).value, undefined, "non-numeric value dropped");
  // Unknown provenanceType falls back to OBSERVED_FACT, never crashes.
  assert.strictEqual(validateImportedObservation(validEntry({ provenanceType: "FACT" })).provenanceType, "OBSERVED_FACT");
  // AI_INTERPRETATION is preserved honestly.
  assert.strictEqual(validateImportedObservation(validEntry({ provenanceType: "AI_INTERPRETATION" })).provenanceType, "AI_INTERPRETATION");
  // Unknown providerStatus falls back to AVAILABLE.
  assert.strictEqual(validateImportedObservation(validEntry({ providerStatus: "SURE" })).providerStatus, "AVAILABLE");
});

test("AgentKey: batch import is bounded and skips bad entries", () => {
  const entries = [
    validEntry({ id: "a" }),
    validEntry({ id: "b", capability: "on-chain", source: "whale-flow-feed", title: "Whale netflow", summary: "Net inflow positive." }),
    { garbage: true },
    validEntry({ id: "c", capability: "news", source: "news-aggregator", title: "Headline", summary: "Something happened.", url: undefined }),
  ];
  const out = validateImportedObservations(entries);
  assert.strictEqual(out.length, 3);
  assert.ok(out.every((o) => o.providerId === "chainbase-agentkey"));
  assert.ok(out.some((o) => o.source === "chainbase-agentkey/on-chain/whale-flow-feed"));

  assert.deepStrictEqual(validateImportedObservations(null), []);
  assert.deepStrictEqual(validateImportedObservations({ not: "an array" }), []);
});

// =========================================================================
// The RedTeam use case: multi-signal research around a tokenized stock
// =========================================================================

const BRIDGE_NAME = `pre2405-test-${Date.now()}-output.json`;
const OUTPUT_PATH = path.join(os.tmpdir(), BRIDGE_NAME);
const INPUT_PATH = path.join(os.tmpdir(), BRIDGE_NAME.replace("-output.json", "-input.json"));

const TOPIC = "Multi-signal research: NVDA price trend, on-chain whale flows and the latest news";

async function runWorkflow() {
  const bridge = new ChainbaseAgentKeyBridge(BRIDGE_NAME);
  const registry = new ResearchProviderRegistry();
  registry.register(bridge);
  const desk = new DecisionDeskService(new MockMarketStateService(), undefined, registry);
  return desk.runWorkflow(
    "LONG rNVDA for 2000 dollars, exit before Monday. Multi-signal research: NVDA price trend, on-chain whale flows and the latest news.",
    { useFixture: false },
  );
}

test("AgentKey: run 1 — workflow writes a documented handoff request for the AI host", async () => {
  const result = await runWorkflow();
  assert.strictEqual(result.step, "DECISION_READY");

  const request = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));
  assert.strictEqual(request.integration, "agentkey-via-ai-host");
  assert.strictEqual(request.providerIdentity, "chainbase-agentkey-external-partner-not-bitget");
  assert.strictEqual(request.useCase, "tokenized-stock-multi-signal-research");
  assert.strictEqual(request.asset, "RNVDA");
  assert.strictEqual(request.referenceSymbol, "NVDA");
  assert.ok(request.requestedCapabilities.includes("market"));
  assert.ok(request.requestedCapabilities.includes("on-chain"));
  assert.ok(request.requestedCapabilities.includes("news"));
  assert.ok(!request.requestedCapabilities.includes("social"), "topic-gated: social not requested");
  assert.ok(!request.requestedCapabilities.includes("company"), "topic-gated: company not requested");
});

test("AgentKey: run 2 — validated host output reaches the artifact with Chainbase attribution", async () => {
  // The AI host (Claude Code etc.) with AgentKey installed retrieves the
  // data and writes structured observations back through the bridge file.
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify([
    validEntry({ id: "host-mkt-1", capability: "market", source: "aggregated-market-feed", title: "NVDA reference price", value: 117.2 }),
    validEntry({ id: "host-chain-1", capability: "on-chain", source: "whale-flow-feed", title: "NVDA-related whale netflow", summary: "Net inflow positive over 24h.", value: 1240000 }),
    validEntry({ id: "host-news-1", capability: "news", source: "news-aggregator", title: "NVDA headline", summary: "Analyst raises price target.", url: "https://example.com/nvda-news" }),
    { this: "entry is malformed and must be skipped" },
  ]));

  const result = await runWorkflow();
  const a = result.artifact;
  const chainbase = a.evidence.filter((e) => e.providerId === "chainbase-agentkey");

  assert.strictEqual(chainbase.length, 3, "exactly the three valid observations imported");
  assert.ok(chainbase.every((e) => e.source.startsWith("chainbase-agentkey/")), "every item attributes Chainbase AgentKey");
  assert.ok(chainbase.some((e) => e.source === "chainbase-agentkey/market/aggregated-market-feed"));
  assert.ok(chainbase.some((e) => e.source === "chainbase-agentkey/on-chain/whale-flow-feed"));
  assert.ok(chainbase.some((e) => e.source === "chainbase-agentkey/news/news-aggregator"));
  // Evidence state is the honest research-provider state.
  assert.ok(chainbase.every((e) => e.state === "RESEARCH_PROVIDER"));

  // Provenance chain carries the imported sources with timestamps.
  const prov = a.provenance.filter((p) => typeof p.source === "string" && p.source.startsWith("chainbase-agentkey/"));
  assert.strictEqual(prov.length, 3, "imported sources appear in provenance");
  assert.ok(prov.every((p) => p.type === "OBSERVED_FACT" && typeof p.retrievedAt === "string"));
});

test("AgentKey: run 3 — bridge file is consumed once (no stale research reuse)", async () => {
  assert.strictEqual(fs.existsSync(OUTPUT_PATH), false, "output consumed by the previous run");
  const result = await runWorkflow();
  const chainbase = result.artifact.evidence.filter((e) => e.providerId === "chainbase-agentkey");
  assert.strictEqual(chainbase.length, 0, "stale observations must never masquerade as fresh research");
});

test("AgentKey: non-tokenized assets never trigger the handoff", async () => {
  // Clear files left by earlier runs so the assertion below is meaningful.
  fs.rmSync(INPUT_PATH, { force: true });
  fs.rmSync(OUTPUT_PATH, { force: true });
  const bridge = new (require("../dist-core/src/adapters/research/chainbaseAgentKeyBridge.js").ChainbaseAgentKeyBridge)(BRIDGE_NAME);
  // BTC is not a tokenized stock — the bridge must not even write a request.
  const obs = await bridge.getObservations("BTC", "price, whale flows, news");
  assert.deepStrictEqual(obs, []);
  assert.strictEqual(fs.existsSync(INPUT_PATH), false, "no request file written for out-of-scope assets");
});

// Cleanup of the request file written by these tests.
test("AgentKey: cleanup", () => {
  fs.rmSync(INPUT_PATH, { force: true });
  fs.rmSync(OUTPUT_PATH, { force: true });
  assert.ok(true);
});
