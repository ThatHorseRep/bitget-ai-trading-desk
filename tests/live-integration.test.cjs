const assert = require("node:assert/strict");
const { test } = require("node:test");
const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");

// End-to-end integration test running through the full live service pipeline
test("Live Integration Test", async (t) => {
  await t.test("Full vertical slice with real service pipeline", async () => {
    const service = new DecisionDeskService();
    const input = "I'm thinking about buying $1,000 of rNVDA before Monday because AI server demand looks very strong. I have no other exposure.";
    
    // Run live workflow without hardcoded fixtures
    const result = await service.runWorkflow(input, { useFixture: false });
    
    assert.equal(result.step, "DECISION_READY");
    assert.ok(result.artifact);
    
    const art = result.artifact;
    assert.equal(art.trade.asset, "rNVDA");
    assert.ok(art.marketState.instrumentPrice > 0);
    assert.ok(Array.isArray(art.evidence));
    assert.ok(art.provenance.length > 0);
  });
});
