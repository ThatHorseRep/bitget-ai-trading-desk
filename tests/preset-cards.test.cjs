const assert = require("node:assert/strict");
const { test } = require("node:test");
const { PRESET_SCENARIOS } = require("../dist-core/src/lib/presetScenarios.js");
const { DecisionDeskService } = require("../dist-core/src/services/decisionDeskService.js");

/**
 * Drift pin for the launcher preset cards.
 *
 * The cards advertise a result and a worst-case drawdown. Those labels were
 * once decorative (the engine never returned them). This test replays every
 * preset prompt through the deterministic fixture workflow and fails if the
 * card text and the engine disagree, so a policy change can never silently
 * ship a card that lies about what the desk returns.
 */
test("launcher preset cards match recorded fixture-mode engine output", async (t) => {
  const service = new DecisionDeskService();

  for (const preset of PRESET_SCENARIOS) {
    await t.test(`${preset.id} (${preset.label})`, async () => {
      const result = await service.runWorkflow(preset.promptText, { useFixture: true });

      if (preset.result.kind === "clarification") {
        assert.equal(
          result.step,
          "CLARIFICATION",
          `${preset.id}: card claims clarification, engine must stop there`
        );
        assert.equal(result.artifact, null, `${preset.id}: no artifact on clarification`);
        return;
      }

      assert.equal(result.step, "DECISION_READY", `${preset.id}: engine must reach a decision`);
      assert.ok(result.artifact, `${preset.id}: artifact expected`);
      assert.equal(
        result.artifact.decision.verdict,
        preset.result.verdict,
        `${preset.id}: card verdict must equal engine verdict`
      );

      const percentages = result.artifact.scenarios
        .filter((s) => typeof s.estimatedPnlPct === "number")
        .map((s) => s.estimatedPnlPct);
      assert.ok(percentages.length > 0, `${preset.id}: scenario counts expected`);
      const worst = Math.min(...percentages);
      assert.equal(
        preset.expectedShortfall,
        `${worst.toFixed(2)}%`,
        `${preset.id}: card expected shortfall must equal the worst scenario`
      );
    });
  }
});
