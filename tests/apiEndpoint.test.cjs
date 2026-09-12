const assert = require("node:assert/strict");
const { test } = require("node:test");
const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");

test("DecisionDeskService workflow returns DECISION_READY for complete reference prompt", async () => {
  const service = new DecisionDeskService();
  const input = "I am thinking about buying $2,000 of rNVDA before Monday because AI infrastructure demand still looks strong. I already have $10,000 of BTC exposure. Stress test this trade.";

  const result = await service.runWorkflow(input, { useFixture: true });

  assert.equal(result.step, "DECISION_READY");
  assert.ok(result.artifact);
  assert.equal(result.artifact.trade.asset, "rNVDA");
  assert.equal(result.artifact.trade.direction, "LONG");
  assert.equal(result.artifact.trade.positionSizeUsd, 2000);
  assert.equal(result.artifact.scenarios.length, 4);
  assert.ok(["PROCEED", "WAIT", "REDUCE", "REJECT"].includes(result.artifact.decision.verdict));
  assert.ok(result.artifact.provenance.length >= 8);
});

test("DecisionDeskService workflow requests clarification when size is omitted", async () => {
  const service = new DecisionDeskService();
  const input = "Thinking of going long rNVDA on AI infrastructure demand.";

  const result = await service.runWorkflow(input, { useFixture: true });

  assert.equal(result.step, "CLARIFICATION");
  assert.equal(result.artifact, null);
  assert.equal(result.parsedResult.requiresClarification, true);
  assert.equal(result.parsedResult.clarificationField, "positionSizeUsd");
  assert.ok(result.parsedResult.clarificationQuestion.includes("position size"));
});

test("DecisionDeskService workflow handles structured TradeIdea input", async () => {
  const service = new DecisionDeskService();
  const tradeIdea = {
    asset: "rNVDA",
    direction: "LONG",
    positionSizeUsd: 3500,
    thesis: "Accelerating enterprise datacenter demand for H100 and Blackwell architectures",
    timeHorizon: "2 weeks"
  };

  const result = await service.runWorkflow(tradeIdea, { useFixture: true });

  assert.equal(result.step, "DECISION_READY");
  assert.ok(result.artifact);
  assert.equal(result.artifact.trade.positionSizeUsd, 3500);
  assert.equal(result.artifact.trade.asset, "rNVDA");
});
