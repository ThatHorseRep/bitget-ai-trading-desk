/**
 * Yahoo Finance Live Integration Test
 *
 * Hits the live Yahoo Finance public API endpoint and verifies response shape.
 *
 * To run this test:
 *   RUN_LIVE_TESTS=1 npx ts-node --transpile-only tests/yahoo.live.test.ts
 *
 * Excluded from the default test suite unless RUN_LIVE_TESTS=1 is provided.
 */

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { YahooReferenceProvider } = require("../dist-core/src/adapters/reference/yahoo.js");

const isLiveEnabled = process.env.RUN_LIVE_TESTS === "1" || process.env.RUN_LIVE_TESTS === "true";

test("Yahoo Finance Live API Provider - Shape Validation", { skip: !isLiveEnabled }, async (t) => {
  const provider = new YahooReferenceProvider();

  await t.test("getReferencePrice returns valid quote shape for NVDA", async () => {
    const quote = await provider.getReferencePrice("NVDA");

    assert.ok(quote, "Quote response should exist");
    assert.equal(quote.symbol, "NVDA", "Symbol must match requested symbol");
    assert.equal(typeof quote.price, "number", "price must be a number");
    assert.ok(Number.isFinite(quote.price) && quote.price > 0, "price must be positive finite");

    if (quote.previousClose !== undefined) {
      assert.equal(typeof quote.previousClose, "number", "previousClose must be a number if present");
      assert.ok(Number.isFinite(quote.previousClose) && quote.previousClose > 0, "previousClose must be positive finite");
    }

    assert.equal(typeof quote.observedAt, "string", "observedAt must be an ISO string");
    const observedTimestamp = Date.parse(quote.observedAt);
    assert.ok(!Number.isNaN(observedTimestamp), "observedAt must be a valid timestamp");
    assert.ok(observedTimestamp > Date.parse("2024-01-01"), "observedAt timestamp must be plausible");

    assert.equal(typeof quote.source, "string", "source must be a string");
    assert.ok(quote.source.length > 0, "source must not be empty");
  });
});
