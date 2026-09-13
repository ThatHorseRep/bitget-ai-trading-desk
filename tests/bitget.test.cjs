const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseBitgetTicker } = require("../dist-core/src/adapters/bitget/client.js");

test("parseBitgetTicker parses valid ticker payload correctly", () => {
  const raw = {
    category: "SPOT",
    symbol: "RNVDAUSDT",
    ts: "1789249263111",
    lastPrice: "219.22",
    openPrice24h: "218.3697",
    highPrice24h: "219.28",
    lowPrice24h: "218.24",
    ask1Price: "219.25",
    bid1Price: "219.22",
    bid1Size: "0.4761",
    ask1Size: "0.8831",
    price24hPcnt: "0.00389",
    volume24h: "530.2389"
  };

  const parsed = parseBitgetTicker(raw);
  assert.equal(parsed.symbol, "RNVDAUSDT");
  assert.equal(parsed.lastPrice, 219.22);
  assert.equal(parsed.bid, 219.22);
  assert.equal(parsed.ask, 219.25);
  assert.equal(parsed.bidSize, 0.4761);
  assert.equal(parsed.askSize, 0.8831);
  assert.equal(parsed.price24hPcnt, 0.00389);
  assert.equal(parsed.volume24h, 530.2389);
  assert.equal(parsed.observedAt, new Date(1789249263111).toISOString());
});

test("parseBitgetTicker throws on missing or zero lastPrice", () => {
  assert.throws(() => parseBitgetTicker({ category: "SPOT", symbol: "RNVDAUSDT", ts: "1789249263111", lastPrice: "0" }));
  assert.throws(() => parseBitgetTicker({ category: "SPOT", symbol: "RNVDAUSDT", ts: "1789249263111", lastPrice: "" }));
});

test("parseBitgetTicker handles empty optional fields gracefully", () => {
  const raw = {
    category: "SPOT",
    symbol: "RNVDAUSDT",
    ts: "1789249263111",
    lastPrice: "219.22",
    ask1Price: "",
    bid1Price: "",
    bid1Size: "",
    ask1Size: ""
  };

  const parsed = parseBitgetTicker(raw);
  assert.equal(parsed.bid, null);
  assert.equal(parsed.ask, null);
  assert.equal(parsed.bidSize, null);
  assert.equal(parsed.askSize, null);
});
