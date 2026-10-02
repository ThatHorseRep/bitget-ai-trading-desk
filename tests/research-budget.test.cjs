const assert = require("node:assert/strict");
const { test } = require("node:test");
const { resolveProviderBudgetMs, DEFAULT_PROVIDER_BUDGET_MS } = require("../dist-core/src/adapters/research/registry.js");

test("research provider budget resolves from env with safe clamping", async (t) => {
  await t.test("default when unset, garbage, or non-positive", () => {
    assert.equal(resolveProviderBudgetMs({}), DEFAULT_PROVIDER_BUDGET_MS);
    assert.equal(resolveProviderBudgetMs({ RESEARCH_PROVIDER_BUDGET_MS: "banana" }), DEFAULT_PROVIDER_BUDGET_MS);
    assert.equal(resolveProviderBudgetMs({ RESEARCH_PROVIDER_BUDGET_MS: "0" }), DEFAULT_PROVIDER_BUDGET_MS);
    assert.equal(resolveProviderBudgetMs({ RESEARCH_PROVIDER_BUDGET_MS: "-5" }), DEFAULT_PROVIDER_BUDGET_MS);
  });

  await t.test("valid values pass through (rounded)", () => {
    assert.equal(resolveProviderBudgetMs({ RESEARCH_PROVIDER_BUDGET_MS: "12000" }), 12000);
    assert.equal(resolveProviderBudgetMs({ RESEARCH_PROVIDER_BUDGET_MS: "4000.6" }), 4001);
  });

  await t.test("clamped into [3000, 30000]", () => {
    assert.equal(resolveProviderBudgetMs({ RESEARCH_PROVIDER_BUDGET_MS: "500" }), 3000);
    assert.equal(resolveProviderBudgetMs({ RESEARCH_PROVIDER_BUDGET_MS: "120000" }), 30000);
  });

  await t.test("no-arg call reads process.env and lands inside the clamp", () => {
    const v = resolveProviderBudgetMs();
    assert.ok(Number.isFinite(v) && v >= 3000 && v <= 30000, "budget " + v + " out of clamp");
  });
});
