/**
 * Bitget Live Integration Test
 *
 * Hits the live Bitget public market API endpoints and verifies response shape.
 *
 * To run this test:
 *   RUN_LIVE_TESTS=1 npx ts-node --transpile-only tests/bitget.live.test.ts
 *
 * Excluded from the default test suite by default unless RUN_LIVE_TESTS=1 is provided.
 */

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { BitgetClient } = require("../dist-core/src/adapters/bitget/client.js");

const isLiveEnabled = process.env.RUN_LIVE_TESTS === "1" || process.env.RUN_LIVE_TESTS === "true";

test("Bitget Live API Provider - Shape Validation", { skip: !isLiveEnabled }, async (t) => {
  const client = new BitgetClient();

  await t.test("getSpotTicker returns valid ticker shape", async () => {
    const ticker = await client.getSpotTicker("BTCUSDT");

    assert.ok(ticker, "Ticker response should exist");
    assert.equal(ticker.symbol, "BTCUSDT", "Symbol should match requested symbol");
    assert.equal(typeof ticker.lastPrice, "number", "lastPrice must be a number");
    assert.ok(Number.isFinite(ticker.lastPrice) && ticker.lastPrice > 0, "lastPrice must be positive finite");

    assert.equal(typeof ticker.observedAt, "string", "observedAt must be an ISO string");
    const observedTimestamp = Date.parse(ticker.observedAt);
    assert.ok(!Number.isNaN(observedTimestamp), "observedAt must be a valid timestamp");
    assert.ok(observedTimestamp > Date.parse("2024-01-01"), "observedAt timestamp must be plausible");

    assert.equal(typeof ticker.source, "string", "source must be a string");
    assert.ok(ticker.source.length > 0, "source must not be empty");

    if (ticker.bid !== null) {
      assert.equal(typeof ticker.bid, "number", "bid must be a number if present");
      assert.ok(ticker.bid > 0, "bid must be positive");
    }
    if (ticker.ask !== null) {
      assert.equal(typeof ticker.ask, "number", "ask must be a number if present");
      assert.ok(ticker.ask > 0, "ask must be positive");
    }
    if (ticker.volume24h !== null) {
      assert.equal(typeof ticker.volume24h, "number", "volume24h must be a number if present");
    }
  });

  await t.test("getSpotInstrument returns valid instrument metadata shape", async () => {
    const instrument = await client.getSpotInstrument("BTCUSDT");

    assert.ok(instrument, "Instrument response should exist");
    assert.equal(instrument.symbol, "BTCUSDT", "Symbol should match requested instrument");
    assert.equal(typeof instrument.category, "string", "category must be a string");
    assert.equal(typeof instrument.baseCoin, "string", "baseCoin must be a string");
    assert.equal(typeof instrument.quoteCoin, "string", "quoteCoin must be a string");
    assert.equal(typeof instrument.isRwa, "boolean", "isRwa must be a boolean");
    assert.equal(typeof instrument.isReality, "boolean", "isReality must be a boolean");
    assert.equal(typeof instrument.isActive, "boolean", "isActive must be a boolean");
  });

  await t.test("getRealityCalendar returns calendar or null with valid shape", async () => {
    const calendar = await client.getRealityCalendar();

    if (calendar !== null) {
      assert.equal(typeof calendar, "object", "calendar must be an object if present");
      if (calendar.timeZone) {
        assert.equal(typeof calendar.timeZone, "string", "timeZone must be a string");
      }
      if (calendar.specificConfig) {
        assert.ok(Array.isArray(calendar.specificConfig), "specificConfig must be an array");
      }
    }
  });
});
