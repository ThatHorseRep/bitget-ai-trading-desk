const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  parseBitgetTicker,
  parseBitgetInstrument,
  parseBitgetOrderbook,
  parseBitgetCandles,
  BitgetClient
} = require("../dist-core/src/adapters/bitget/client.js");

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

test("parseBitgetOrderbook parses valid orderbook payload correctly", () => {
  const raw = {
    asks: [
      ["219.50", "1.25"],
      ["219.75", "0.80"]
    ],
    bids: [
      ["219.20", "2.10"],
      ["219.00", "5.00"]
    ],
    ts: "1789249263000"
  };

  const parsed = parseBitgetOrderbook("rNVDAUSDT", raw);
  assert.equal(parsed.symbol, "rNVDAUSDT");
  assert.equal(parsed.timestamp, 1789249263000);
  assert.equal(parsed.bids.length, 2);
  assert.deepEqual(parsed.bids[0], { price: 219.20, size: 2.10 });
  assert.deepEqual(parsed.bids[1], { price: 219.00, size: 5.00 });
  assert.equal(parsed.asks.length, 2);
  assert.deepEqual(parsed.asks[0], { price: 219.50, size: 1.25 });
  assert.deepEqual(parsed.asks[1], { price: 219.75, size: 0.80 });
});

test("parseBitgetOrderbook handles empty levels and fallback timestamp", () => {
  const raw = {
    asks: [],
    bids: []
  };

  const parsed = parseBitgetOrderbook("rNVDAUSDT", raw, 1789249999000);
  assert.equal(parsed.symbol, "rNVDAUSDT");
  assert.deepEqual(parsed.bids, []);
  assert.deepEqual(parsed.asks, []);
  assert.equal(parsed.timestamp, 1789249999000);
});

test("parseBitgetCandles parses candlestick tuples correctly", () => {
  const rawTuples = [
    ["1789574400000", "75790.01", "77161.00", "75060.94", "76784.99", "3759.51", "286639078.95"],
    ["1789660800000", "76784.99", "79200.00", "76500.00", "78950.50", "4120.11", "321450190.10"]
  ];

  const parsed = parseBitgetCandles(rawTuples);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], {
    timestamp: 1789574400000,
    open: 75790.01,
    high: 77161.00,
    low: 75060.94,
    close: 76784.99,
    volume: 3759.51,
    quoteVolume: 286639078.95
  });
  assert.equal(parsed[1].timestamp, 1789660800000);
  assert.equal(parsed[1].close, 78950.50);
});

test("parseBitgetCandles handles empty or malformed list gracefully", () => {
  assert.deepEqual(parseBitgetCandles([]), []);
  assert.deepEqual(parseBitgetCandles([["invalid"]]), []);
});

const http = require("node:http");

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

  await t.test("getSpotOrderbook success returns normalized orderbook", async () => {
    let capturedUrl = "";
    currentHandler = (req, res) => {
      capturedUrl = req.url;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        code: "00000",
        msg: "success",
        requestTime: 1789249265000,
        data: {
          asks: [["219.50", "1.5"]],
          bids: [["219.20", "2.0"]],
          ts: "1789249265000"
        }
      }));
    };
    const orderbook = await client.getSpotOrderbook("rNVDAUSDT", 15);
    assert.equal(capturedUrl, "/api/v2/spot/market/orderbook?symbol=rNVDAUSDT&limit=15");
    assert.equal(orderbook.symbol, "rNVDAUSDT");
    assert.equal(orderbook.timestamp, 1789249265000);
    assert.deepEqual(orderbook.bids, [{ price: 219.20, size: 2.0 }]);
    assert.deepEqual(orderbook.asks, [{ price: 219.50, size: 1.5 }]);
  });

  await t.test("getSpotOrderbook non-zero code throws", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "40001", msg: "Invalid parameters" }));
    };
    await assert.rejects(() => client.getSpotOrderbook("rNVDAUSDT"), /Bitget orderbook request for rNVDAUSDT failed: \[40001\]/);
  });

  await t.test("getSpotCandles success returns normalized candles", async () => {
    let capturedUrl = "";
    currentHandler = (req, res) => {
      capturedUrl = req.url;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        code: "00000",
        msg: "success",
        requestTime: 1789249266000,
        data: [
          ["1789574400000", "218.00", "220.50", "217.50", "219.22", "530.24", "116238.50"]
        ]
      }));
    };
    const candles = await client.getSpotCandles("rNVDAUSDT", "1day", 5);
    assert.equal(capturedUrl, "/api/v2/spot/market/candles?symbol=rNVDAUSDT&granularity=1day&limit=5");
    assert.equal(candles.length, 1);
    assert.deepEqual(candles[0], {
      timestamp: 1789574400000,
      open: 218.00,
      high: 220.50,
      low: 217.50,
      close: 219.22,
      volume: 530.24,
      quoteVolume: 116238.50
    });
  });

  await t.test("getSpotCandles non-zero code throws", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "40002", msg: "Symbol not found" }));
    };
    await assert.rejects(() => client.getSpotCandles("rNVDAUSDT"), /Bitget candles request for rNVDAUSDT failed: \[40002\]/);
  });
});
