const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseBitgetTicker, parseBitgetInstrument } = require("../dist-core/src/adapters/bitget/client.js");

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

test("parseBitgetInstrument correctly identifies Reality tokens", () => {
  const raw = {
    symbol: "rNVDAUSDT",
    category: "SPOT",
    baseCoin: "rNVDA",
    quoteCoin: "USDT",
    isReality: "yes",
    isRwa: "no",
    status: "online"
  };
  const parsed = parseBitgetInstrument(raw);
  assert.equal(parsed.isReality, true);
  assert.equal(parsed.isActive, true);
});

const http = require("node:http");
const { BitgetClient } = require("../dist-core/src/adapters/bitget/client.js");

test("BitgetClient integration tests", async (t) => {
  process.env.NODE_ENV = "test";
  
  let currentHandler = (req, res) => {
    res.writeHead(404);
    res.end();
  };

  const server = http.createServer((req, res) => currentHandler(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const client = new BitgetClient(baseUrl);

  t.after(() => server.close());

  await t.test("success returns ticker", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        code: "00000",
        msg: "success",
        requestTime: 1234567890,
        data: [{
          symbol: "RNVDAUSDT",
          lastPrice: "219.22",
          ts: "1789249263111",
          bid1Price: "219.00",
          ask1Price: "219.50",
          bid1Size: "100",
          ask1Size: "100"
        }]
      }));
    };
    const ticker = await client.getSpotTicker("RNVDAUSDT");
    assert.equal(ticker.symbol, "RNVDAUSDT");
    assert.equal(ticker.lastPrice, 219.22);
    assert.equal(ticker.requestTime, 1234567890);
  });

  await t.test("non-zero Bitget code throws", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "40001", msg: "Invalid parameters" }));
    };
    await assert.rejects(() => client.getSpotTicker("RNVDAUSDT"), /\[40001\]/);
  });

  await t.test("empty data array throws", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "00000", msg: "success", data: [] }));
    };
    await assert.rejects(() => client.getSpotTicker("RNVDAUSDT"), /Bitget ticker request for RNVDAUSDT failed/);
  });

  await t.test("malformed numeric fields throw", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        code: "00000",
        msg: "success",
        data: [{ symbol: "RNVDAUSDT", lastPrice: "abc", ts: "1789249263111" }]
      }));
    };
    await assert.rejects(() => client.getSpotTicker("RNVDAUSDT"), /Invalid lastPrice from Bitget/);
  });

  await t.test("stale timestamp or missing timestamp throws", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        code: "00000",
        msg: "success",
        data: [{ symbol: "RNVDAUSDT", lastPrice: "219.22", ts: "" }]
      }));
    };
    await assert.rejects(() => client.getSpotTicker("RNVDAUSDT"), /Invalid or missing observation timestamp/);
  });

  await t.test("instrument inactive status", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        code: "00000",
        msg: "success",
        data: [{
          symbol: "RNVDAUSDT",
          category: "SPOT",
          isReality: "yes",
          status: "offline"
        }]
      }));
    };
    const instrument = await client.getSpotInstrument("RNVDAUSDT");
    assert.equal(instrument.isActive, false);
  });

  await t.test("instrument is not reality", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        code: "00000",
        msg: "success",
        data: [{
          symbol: "RNVDAUSDT",
          category: "SPOT",
          isReality: "no",
          status: "online"
        }]
      }));
    };
    const instrument = await client.getSpotInstrument("RNVDAUSDT");
    assert.equal(instrument.isReality, false);
  });
});
