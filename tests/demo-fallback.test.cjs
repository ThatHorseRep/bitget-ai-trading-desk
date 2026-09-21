/**
 * Demo Safety Net Fallback Unit Tests
 *
 * Verifies that when Bitget API calls fail (network error, rate limiting, 400s),
 * the system:
 * 1. Falls back to the curated fixtures already in the repo
 * 2. Visibly flags the state as demo/fallback (isFallbackDemo = true)
 * 3. Explains why ("Bitget API unavailable - showing curated rNVDA weekend basis demo")
 * 4. Does not fake success (dataQuality is DEGRADED, limitations explicit)
 */

const assert = require("node:assert/strict");
const test = require("node:test");

const { MarketStateService } = require("../dist-core/src/services/marketStateService.js");
const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");
const { ResearchProviderRegistry } = require("../dist-core/src/adapters/research/registry.js");
const { rnvdaDemoMarketState } = require("../dist-core/src/fixtures/rnvda-demo.js");

// Mock BitgetClient that simulates failure (e.g. network blip or rate limit)
class FailingBitgetClient {
  async getSpotTicker() {
    throw new Error("429 Too Many Requests: Bitget public rate limit exceeded");
  }

  async getSpotInstrument() {
    throw new Error("503 Service Unavailable: Bitget API gateway timeout");
  }

  async getOrderbook() {
    throw new Error("Connection reset by peer");
  }
}

test("Demo Safety Net - MarketStateService Fallback on Bitget Failure", async (t) => {
  await t.test("falls back gracefully when Bitget API fails", async () => {
    const failingClient = new FailingBitgetClient();
    const service = new MarketStateService(failingClient);

    const marketState = await service.getMarketState("rNVDA");

    assert.ok(marketState, "Market state must be returned");
    assert.equal(marketState.isFallbackDemo, true, "Must flag isFallbackDemo = true");
    assert.equal(
      marketState.fallbackReason,
      "Bitget API unavailable - showing curated rNVDA weekend basis demo",
      "Must explicitly state fallback reason"
    );
    assert.equal(marketState.dataQuality, "DEGRADED", "Must report DEGRADED data quality, never fake success");
    assert.equal(marketState.instrumentPrice, rnvdaDemoMarketState.instrumentPrice, "Must return curated fixture price");
    assert.equal(marketState.referenceSymbol, "NVDA", "Must preserve reference symbol mapping");
  });
});

test("Demo Safety Net - DecisionDeskService Fallback Integration", async (t) => {
  await t.test("produces artifact with explicit demo fallback explanation", async () => {
    process.env.TEST_MODE = "mock_llm";
    const failingClient = new FailingBitgetClient();
    const marketStateService = new MarketStateService(failingClient);
    const deskService = new DecisionDeskService(marketStateService);

    const result = await deskService.runWorkflow(
      {
        direction: "LONG",
        asset: "rNVDA",
        positionSizeUsd: 50000,
        thesis: "Holding through the weekend before GTC keynote event with expected chip announcements."
      },
      {
        useFixture: false, // user requests live, but Bitget fails
        researchRegistry: new ResearchProviderRegistry()
      }
    );

    assert.equal(result.step, "DECISION_READY", "Workflow should complete to DECISION_READY");
    assert.ok(result.artifact, "Artifact must be produced");
    assert.equal(result.artifact.isFallbackDemo, true, "Artifact must be marked isFallbackDemo = true");
    assert.equal(
      result.artifact.fallbackReason,
      "Bitget API unavailable - showing curated rNVDA weekend basis demo",
      "Artifact must explain the fallback reason"
    );
    assert.ok(
      result.artifact.limitations.some((l) => l.includes("Bitget API unavailable - showing curated rNVDA weekend basis demo")),
      "Limitations must prominently explain the Bitget API unavailability"
    );
  });
});
