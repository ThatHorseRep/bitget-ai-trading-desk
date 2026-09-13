const assert = require("node:assert/strict");
const { test } = require("node:test");
const { CompositeEvidenceProvider, CURATED_NVDA_EVIDENCE } = require("../dist-core/src/adapters/evidence/provider.js");

test("CompositeEvidenceProvider retrieves evidence with valid fields and provenanceType", async () => {
  const provider = new CompositeEvidenceProvider();
  const items = await provider.retrieveEvidence({ asset: "rNVDA", maxRecords: 3 });

  assert.ok(items.length > 0);
  for (const item of items) {
    assert.ok(item.id);
    assert.ok(item.title);
    assert.ok(item.source);
    assert.equal(item.provenanceType, "OBSERVED_FACT");
    assert.ok(item.retrievedAt);
  }
});

test("CompositeEvidenceProvider falls back gracefully on network error", async () => {
  const provider = new CompositeEvidenceProvider("https://invalid-non-existent-domain-12345.org");
  const items = await provider.retrieveEvidence({ asset: "rNVDA", maxRecords: 2 });

  assert.equal(items.length, 2);
  assert.equal(items[0].id, CURATED_NVDA_EVIDENCE[0].id);
  assert.equal(items[0].provenanceType, "OBSERVED_FACT");
});
