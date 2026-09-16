const assert = require("node:assert/strict");
const { test } = require("node:test");
const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");

// This test suite runs against live APIs.
// Skip if not explicitly requested or if credentials are not present.
test("Live Integration Test", { skip: process.env.RUN_LIVE_TESTS !== "true" }, async (t) => {
  await t.test("Full vertical slice with real API calls", async () => {
    const service = new DecisionDeskService();
    // Assuming API keys are loaded via .env.local
    const input = "I'm thinking about buying $1,000 of rNVDA before Monday because AI server demand looks very strong. I have no other exposure.";
    
    // NOT using fixture here
    const result = await service.runWorkflow(input, { useFixture: false });
    
    assert.equal(result.step, "DECISION_READY");
    assert.ok(result.artifact);
    
    const art = result.artifact;
    assert.equal(art.trade.asset, "rNVDA");
    assert.ok(art.marketState.instrumentPrice > 0);
    assert.ok(art.evidence.length > 0);
    assert.ok(art.provenance.length > 0);
  });
});
