const assert = require("node:assert/strict");
const { test } = require("node:test");
const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");
const {
  exportDecisionArtifactAsMarkdown,
  exportDecisionArtifactAsJson
} = require("../dist-core/src/lib/exportDossier.js");

test("Dossier Export - Markdown Compliance Memo Serialization", async () => {
  const service = new DecisionDeskService();
  const input = "I plan to buy $2,000 of rNVDA before Monday because AI infrastructure demand is solid.";
  const result = await service.runWorkflow(input, { useFixture: true });
  const artifact = result.artifact;
  assert.ok(artifact);

  const markdown = exportDecisionArtifactAsMarkdown(artifact);

  assert.ok(markdown.includes("# Bitget AI RedTeam Desk — Pre-Trade Decision Dossier"));
  assert.ok(markdown.includes(artifact.artifactId));
  assert.ok(markdown.includes("## 1. Executive Verdict"));
  assert.ok(markdown.includes(artifact.decision.verdict));
  assert.ok(markdown.includes("## 2. Quantitative Tail Stress Tests"));
  assert.ok(markdown.includes("CRYPTO_CONTAGION"));
  assert.ok(markdown.includes("## 3. Empirical Historical Precedent Match"));
  assert.ok(markdown.includes("## 4. Actionable Change Conditions"));
  assert.ok(markdown.includes("## 5. Provenance & Audit Trail"));
  assert.ok(markdown.includes("CALCULATED_METRIC") || markdown.includes("OBSERVED_FACT"));
  assert.ok(markdown.includes("Track 3: AI Trading Desk — Decision Stress Testing"));
});

test("Dossier Export - Structured JSON Serialization", async () => {
  const service = new DecisionDeskService();
  const input = "I plan to buy $2,000 of rNVDA before Monday because AI infrastructure demand is solid.";
  const result = await service.runWorkflow(input, { useFixture: true });
  const artifact = result.artifact;
  assert.ok(artifact);

  const jsonString = exportDecisionArtifactAsJson(artifact);
  assert.ok(jsonString.length > 500);

  const parsed = JSON.parse(jsonString);
  assert.equal(parsed.artifactId, artifact.artifactId);
  assert.equal(parsed.trade.asset, artifact.trade.asset);
  assert.equal(parsed.decision.verdict, artifact.decision.verdict);
  assert.equal(parsed.scenarios.length, artifact.scenarios.length);
  assert.equal(parsed.provenance.length, artifact.provenance.length);
});
