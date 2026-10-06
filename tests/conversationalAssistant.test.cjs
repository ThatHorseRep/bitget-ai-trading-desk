const assert = require("node:assert/strict");
const { test } = require("node:test");
const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");
const {
  processConversationalQuery,
  getSuggestedPrompts
} = require("../dist-core/src/core/assistant/conversationalFollowup.js");

test("Conversational Desk Assistant - Suggested Prompts Tailoring", async () => {
  const service = new DecisionDeskService();
  const input = "I plan to buy $2,000 of rNVDA before Monday because AI infrastructure demand is solid.";
  const result = await service.runWorkflow(input, { useFixture: true });
  assert.ok(result.artifact);

  const prompts = getSuggestedPrompts(result.artifact);
  assert.equal(prompts.length, 4, "Should suggest exactly 4 tailored prompts");

  const promptIds = prompts.map((p) => p.id);
  assert.ok(promptIds.includes("btc-tail-drop"));
  assert.ok(promptIds.includes("basis-risk-detail"));
  assert.ok(promptIds.includes("resize-guidance"));
  assert.ok(promptIds.includes("asset-compare"));

  const comparePrompt = prompts.find((p) => p.id === "asset-compare");
  assert.ok(comparePrompt.prompt.includes("rTSLA"), "For rNVDA trade, should suggest comparing with rTSLA");
});

test("Conversational Desk Assistant - Deterministic BTC Tail Shock (15% drop)", async () => {
  const service = new DecisionDeskService();
  const input = "I plan to buy $2,000 of rNVDA before Monday because AI infrastructure demand is solid.";
  const result = await service.runWorkflow(input, { useFixture: true });
  const artifact = result.artifact;

  const reply = await processConversationalQuery(artifact, "What if BTC drops 15%?");

  assert.equal(reply.replyType, "deterministic_math");
  assert.ok(reply.content.includes("-15% BTC"));
  assert.ok(reply.content.includes("0.20"), "Should cite rNVDA empirical beta of 0.20");
  assert.ok(reply.referencedProvenanceIds.includes("SCENARIO_CRYPTO_CONTAGION"));
  assert.ok(reply.calculatedMetric);
  assert.equal(reply.calculatedMetric.label, "BTC -15% Shock Loss");
  // 15% * 0.20 = 3% implied drop. $2000 * 3% = $60
  assert.ok(reply.calculatedMetric.projectedValue.includes("60"));
});

test("Conversational Desk Assistant - Deterministic BTC Tail Shock (25% drop)", async () => {
  const service = new DecisionDeskService();
  const input = "I plan to buy $2,000 of rNVDA before Monday because AI infrastructure demand is solid.";
  const result = await service.runWorkflow(input, { useFixture: true });
  const artifact = result.artifact;

  const reply = await processConversationalQuery(artifact, "What happens if BTC crashes 25% over the weekend?");

  assert.equal(reply.replyType, "deterministic_math");
  assert.ok(reply.content.includes("-25% BTC"));
  assert.ok(reply.calculatedMetric);
  // 25% * 0.20 = 5% implied drop. $2000 * 5% = $100
  assert.ok(reply.calculatedMetric.projectedValue.includes("100"));
});

test("Conversational Desk Assistant - Basis Risk and Session Explanation", async () => {
  const service = new DecisionDeskService();
  const input = "I plan to buy $2,000 of rNVDA before Monday because AI infrastructure demand is solid.";
  const result = await service.runWorkflow(input, { useFixture: true });
  const artifact = result.artifact;

  const reply = await processConversationalQuery(artifact, "Why is basis risk elevated?");

  assert.equal(reply.replyType, "explanation");
  assert.ok(reply.content.includes("Basis Spread Risk Breakdown"));
  assert.ok(reply.content.includes("Off-hours synthetic pricing") || reply.content.includes("WEEKEND"));
  assert.ok(reply.referencedProvenanceIds.includes("CALC_OFF_HOURS_BASIS_SPREAD"));
  assert.ok(reply.referencedProvenanceIds.includes("SCENARIO_BASIS_WIDENING"));
});

test("Conversational Desk Assistant - Resizing & Actionable Conditions Guidance", async () => {
  const service = new DecisionDeskService();
  const input = "I plan to buy $2,000 of rNVDA before Monday because AI infrastructure demand is solid.";
  const result = await service.runWorkflow(input, { useFixture: true });
  const artifact = result.artifact;

  const reply = await processConversationalQuery(artifact, "How can I resize or get a PROCEED verdict?");

  assert.equal(reply.replyType, "explanation");
  assert.ok(reply.content.includes("Downsize Notional Exposure") || reply.content.includes("PROCEED"));
  assert.ok(reply.referencedProvenanceIds.includes("DECISION_VERDICT"));
});

test("Conversational Desk Assistant - Multi-Asset Risk Comparison (rNVDA vs rTSLA)", async () => {
  const service = new DecisionDeskService();
  const input = "I plan to buy $2,000 of rNVDA before Monday because AI infrastructure demand is solid.";
  const result = await service.runWorkflow(input, { useFixture: true });
  const artifact = result.artifact;

  const reply = await processConversationalQuery(artifact, "Compare with rTSLA");

  assert.equal(reply.replyType, "comparison");
  assert.ok(reply.content.includes("rNVDA"));
  assert.ok(reply.content.includes("rTSLA"));
  assert.ok(reply.content.includes("Beta to BTC"));
  assert.ok(reply.content.includes("Vol Scalar"));
});

test("Conversational Desk Assistant - Grounded Open-Ended Synthesis", async () => {
  const service = new DecisionDeskService();
  const input = "I plan to buy $2,000 of rNVDA before Monday because AI infrastructure demand is solid.";
  const result = await service.runWorkflow(input, { useFixture: true });
  const artifact = result.artifact;

  const reply = await processConversationalQuery(artifact, "What other factors are important?");

  assert.equal(reply.replyType, "grounded_synthesis");
  assert.ok(reply.content.includes("RedTeam Desk Research Synthesis"));
  assert.ok(reply.content.includes(artifact.decision.verdict));
  assert.ok(reply.content.includes("rNVDA"));
});
