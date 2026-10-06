const assert = require("node:assert/strict");
const http = require("node:http");
const {
  parseBitgetOrderbook,
  parseBitgetCandles,
  BitgetClient
} = require("../dist-core/src/adapters/bitget/client.js");

console.log("=== EMPIRICAL CHALLENGER STRESS HARNESS: BITGET MARKET CLIENT ===");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    console.error(err.stack);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    console.error(err.stack);
    failed++;
  }
}

// -------------------------------------------------------------
// SECTION 1: Boundary & Malformed Data for parseBitgetOrderbook
// -------------------------------------------------------------
console.log("\n--- SECTION 1: parseBitgetOrderbook Boundary & Malformed Inputs ---");

runTest("parseBitgetOrderbook: Empty bids and asks arrays", () => {
  const result = parseBitgetOrderbook("rNVDAUSDT", { bids: [], asks: [] }, 1000);
  assert.equal(result.symbol, "rNVDAUSDT");
  assert.deepEqual(result.bids, []);
  assert.deepEqual(result.asks, []);
  assert.equal(result.timestamp, 1000);
});

runTest("parseBitgetOrderbook: undefined / null bids and asks", () => {
  const result1 = parseBitgetOrderbook("rNVDAUSDT", { bids: undefined, asks: undefined });
  assert.deepEqual(result1.bids, []);
  assert.deepEqual(result1.asks, []);
  assert.ok(result1.timestamp > 0);

  const result2 = parseBitgetOrderbook("rNVDAUSDT", { bids: null, asks: null });
  assert.deepEqual(result2.bids, []);
  assert.deepEqual(result2.asks, []);
  assert.ok(result2.timestamp > 0);

  const result3 = parseBitgetOrderbook("rNVDAUSDT", {});
  assert.deepEqual(result3.bids, []);
  assert.deepEqual(result3.asks, []);
  assert.ok(result3.timestamp > 0);
});

runTest("parseBitgetOrderbook: malformed level tuples (nulls, empty arrays, missing size)", () => {
  const raw = {
    bids: [
      null,
      undefined,
      [],
      ["100.5"], // length < 2
      ["", ""],
      ["foo", "bar"],
      ["NaN", "10"],
      ["100", "NaN"],
      ["Infinity", "5"],
      ["-Infinity", "5"],
      ["50", "Infinity"],
      ["-10", "5"], // negative price
      ["10", "-5"], // negative size
      ["200.5", "10.2"], // valid
      [" 150.25 ", " 20.5 "] // whitespace padded valid floats
    ],
    asks: [
      ["abc", "xyz"],
      [null, null],
      ["0", "0"], // zero price and size
      ["201.0", "5.5"], // valid
      ["1e-2", "1e3"] // scientific notation
    ]
  };

  const result = parseBitgetOrderbook("rNVDAUSDT", raw, 12345);
  assert.equal(result.bids.length, 2);
  assert.deepEqual(result.bids[0], { price: 200.5, size: 10.2 });
  assert.deepEqual(result.bids[1], { price: 150.25, size: 20.5 });

  assert.equal(result.asks.length, 3);
  assert.deepEqual(result.asks[0], { price: 0, size: 0 });
  assert.deepEqual(result.asks[1], { price: 201.0, size: 5.5 });
  assert.deepEqual(result.asks[2], { price: 0.01, size: 1000 });
});

runTest("parseBitgetOrderbook: timestamp parsing & fallback hierarchy", () => {
  // Case A: valid string ts
  const r1 = parseBitgetOrderbook("rNVDAUSDT", { bids: [], asks: [], ts: "1789249263000" }, 999);
  assert.equal(r1.timestamp, 1789249263000);

  // Case B: valid number ts
  const r2 = parseBitgetOrderbook("rNVDAUSDT", { bids: [], asks: [], ts: 1789249263000 }, 999);
  assert.equal(r2.timestamp, 1789249263000);

  // Case C: invalid string ts falls back to requestTime
  const r3 = parseBitgetOrderbook("rNVDAUSDT", { bids: [], asks: [], ts: "invalid" }, 1789249265000);
  assert.equal(r3.timestamp, 1789249265000);

  // Case D: negative ts falls back to requestTime
  const r4 = parseBitgetOrderbook("rNVDAUSDT", { bids: [], asks: [], ts: -500 }, 1789249265000);
  assert.equal(r4.timestamp, 1789249265000);

  // Case E: zero ts falls back to requestTime
  const r5 = parseBitgetOrderbook("rNVDAUSDT", { bids: [], asks: [], ts: 0 }, 1789249265000);
  assert.equal(r5.timestamp, 1789249265000);

  // Case F: empty string ts falls back to requestTime
  const r6 = parseBitgetOrderbook("rNVDAUSDT", { bids: [], asks: [], ts: "" }, 1789249265000);
  assert.equal(r6.timestamp, 1789249265000);

  // Case G: missing ts and missing requestTime falls back to Date.now()
  const before = Date.now();
  const r7 = parseBitgetOrderbook("rNVDAUSDT", { bids: [], asks: [] });
  const after = Date.now();
  assert.ok(r7.timestamp >= before && r7.timestamp <= after);

  // Case H: invalid requestTime (negative/zero/NaN) falls back to Date.now()
  const r8 = parseBitgetOrderbook("rNVDAUSDT", { bids: [], asks: [], ts: "" }, -1);
  assert.ok(r8.timestamp >= before && r8.timestamp <= Date.now() + 10);
});

// -------------------------------------------------------------
// SECTION 2: Boundary & Malformed Data for parseBitgetCandles
// -------------------------------------------------------------
console.log("\n--- SECTION 2: parseBitgetCandles Boundary & Malformed Inputs ---");

runTest("parseBitgetCandles: non-array and empty array inputs", () => {
  assert.deepEqual(parseBitgetCandles([]), []);
  assert.deepEqual(parseBitgetCandles(null), []);
  assert.deepEqual(parseBitgetCandles(undefined), []);
  assert.deepEqual(parseBitgetCandles("not an array"), []);
  assert.deepEqual(parseBitgetCandles(12345), []);
  assert.deepEqual(parseBitgetCandles({}), []);
});

runTest("parseBitgetCandles: short tuples (< 6 elements)", () => {
  const inputs = [
    [],
    ["1789574400000"],
    ["1789574400000", "100"],
    ["1789574400000", "100", "105"],
    ["1789574400000", "100", "105", "95"],
    ["1789574400000", "100", "105", "95", "102"] // length 5
  ];
  assert.deepEqual(parseBitgetCandles(inputs), []);
});

runTest("parseBitgetCandles: exactly 6 elements (missing quoteVolume defaults to 0)", () => {
  const inputs = [
    ["1789574400000", "100.5", "105.0", "95.2", "102.3", "500.1"]
  ];
  const parsed = parseBitgetCandles(inputs);
  assert.equal(parsed.length, 1);
  assert.deepEqual(parsed[0], {
    timestamp: 1789574400000,
    open: 100.5,
    high: 105.0,
    low: 95.2,
    close: 102.3,
    volume: 500.1,
    quoteVolume: 0
  });
});

runTest("parseBitgetCandles: invalid numeric strings in various positions", () => {
  const invalidCases = [
    ["abc", "100", "105", "95", "102", "50", "5000"], // invalid ts
    ["1789574400000", "abc", "105", "95", "102", "50", "5000"], // invalid open
    ["1789574400000", "100", "NaN", "95", "102", "50", "5000"], // invalid high
    ["1789574400000", "100", "105", "Infinity", "102", "50", "5000"], // invalid low
    ["1789574400000", "100", "105", "95", "null", "50", "5000"], // invalid close
    ["1789574400000", "100", "105", "95", "102", "undefined", "5000"], // invalid volume
    null,
    undefined,
    123
  ];

  const parsed = parseBitgetCandles(invalidCases);
  assert.equal(parsed.length, 0);
});

runTest("parseBitgetCandles: quoteVolume fallback when malformed or empty", () => {
  const inputs = [
    ["1789574400000", "100", "105", "95", "102", "50", ""],
    ["1789574400001", "100", "105", "95", "102", "50", "invalid"],
    ["1789574400002", "100", "105", "95", "102", "50", "NaN"],
    ["1789574400003", "100", "105", "95", "102", "50", "12345.67"]
  ];
  const parsed = parseBitgetCandles(inputs);
  assert.equal(parsed.length, 4);
  assert.equal(parsed[0].quoteVolume, 0);
  assert.equal(parsed[1].quoteVolume, 0);
  assert.equal(parsed[2].quoteVolume, 0);
  assert.equal(parsed[3].quoteVolume, 12345.67);
});

runTest("parseBitgetCandles: scientific notation and whitespace formatting", () => {
  const inputs = [
    ["1789574400000", " 1e-4 ", " 2e-4 ", " 5e-5 ", " 1.5e-4 ", " 1000 ", " 0.15 "]
  ];
  const parsed = parseBitgetCandles(inputs);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].open, 0.0001);
  assert.equal(parsed[0].high, 0.0002);
  assert.equal(parsed[0].low, 0.00005);
  assert.equal(parsed[0].close, 0.00015);
  assert.equal(parsed[0].volume, 1000);
  assert.equal(parsed[0].quoteVolume, 0.15);
});

// -------------------------------------------------------------
// SECTION 3: Fuzz Testing with Random & Hostile Inputs
// -------------------------------------------------------------
console.log("\n--- SECTION 3: Fuzz Testing (10,000 Hostile Random Inputs) ---");

runTest("Fuzzing parseBitgetOrderbook across 10,000 hostile variations", () => {
  const hostileValues = [
    "", "0", "-1", "NaN", "Infinity", "-Infinity", "null", "undefined",
    "1e10", "1e-5", "123.456", "   ", "\t\n", "foo", "true", "false",
    0, 1, -1, NaN, Infinity, -Infinity, null, undefined, {}, []
  ];

  for (let i = 0; i < 5000; i++) {
    const rawBids = [];
    const bidCount = Math.floor(Math.random() * 5);
    for (let b = 0; b < bidCount; b++) {
      const p = hostileValues[Math.floor(Math.random() * hostileValues.length)];
      const s = hostileValues[Math.floor(Math.random() * hostileValues.length)];
      rawBids.push([p, s]);
    }
    const rawAsks = [];
    const askCount = Math.floor(Math.random() * 5);
    for (let a = 0; a < askCount; a++) {
      const p = hostileValues[Math.floor(Math.random() * hostileValues.length)];
      const s = hostileValues[Math.floor(Math.random() * hostileValues.length)];
      rawAsks.push([p, s]);
    }
    const ts = hostileValues[Math.floor(Math.random() * hostileValues.length)];
    const reqTime = hostileValues[Math.floor(Math.random() * hostileValues.length)];

    const res = parseBitgetOrderbook("FUZZ_TEST", { bids: rawBids, asks: rawAsks, ts }, reqTime);
    assert.equal(res.symbol, "FUZZ_TEST");
    assert.ok(Array.isArray(res.bids));
    assert.ok(Array.isArray(res.asks));
    assert.ok(typeof res.timestamp === "number" && Number.isFinite(res.timestamp) && res.timestamp > 0);

    for (const lvl of [...res.bids, ...res.asks]) {
      assert.ok(typeof lvl.price === "number" && Number.isFinite(lvl.price) && lvl.price >= 0);
      assert.ok(typeof lvl.size === "number" && Number.isFinite(lvl.size) && lvl.size >= 0);
    }
  }
});

runTest("Fuzzing parseBitgetCandles across 10,000 hostile variations", () => {
  const hostileValues = [
    "", "0", "-1", "NaN", "Infinity", "-Infinity", "null", "undefined",
    "1789574400000", "123.456", "   ", "foo", 0, 100, -100, NaN, Infinity, null, undefined, {}, []
  ];

  for (let i = 0; i < 5000; i++) {
    const tupleLen = Math.floor(Math.random() * 9);
    const tuple = [];
    for (let j = 0; j < tupleLen; j++) {
      tuple.push(hostileValues[Math.floor(Math.random() * hostileValues.length)]);
    }

    const res = parseBitgetCandles([tuple]);
    assert.ok(Array.isArray(res));
    for (const c of res) {
      assert.ok(typeof c.timestamp === "number" && Number.isFinite(c.timestamp));
      assert.ok(typeof c.open === "number" && Number.isFinite(c.open));
      assert.ok(typeof c.high === "number" && Number.isFinite(c.high));
      assert.ok(typeof c.low === "number" && Number.isFinite(c.low));
      assert.ok(typeof c.close === "number" && Number.isFinite(c.close));
      assert.ok(typeof c.volume === "number" && Number.isFinite(c.volume));
      assert.ok(typeof c.quoteVolume === "number" && Number.isFinite(c.quoteVolume));
    }
  }
});

// -------------------------------------------------------------
// SECTION 4: BitgetClient Integration & HTTP Error Rejection
// -------------------------------------------------------------
console.log("\n--- SECTION 4: BitgetClient Network & HTTP Error Rejection ---");

async function runClientTests() {
  process.env.NODE_ENV = "test";

  let handler = (req, res) => {
    res.writeHead(404);
    res.end();
  };

  const server = http.createServer((req, res) => handler(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const client = new BitgetClient(baseUrl);

  try {
    // Test 4.1: getSpotOrderbook non-zero code error messages
    const errorCodes = [
      { code: "40001", msg: "Invalid parameters" },
      { code: "40014", msg: "Symbol not found" },
      { code: "40015", msg: "Limit out of range" },
      { code: "42901", msg: "Too many requests" },
      { code: "50000", msg: "Internal system error" }
    ];

    for (const ec of errorCodes) {
      await runAsyncTest(`getSpotOrderbook cleanly rejects code ${ec.code} (${ec.msg})`, async () => {
        handler = (req, res) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ code: ec.code, msg: ec.msg }));
        };
        await assert.rejects(
          () => client.getSpotOrderbook("rNVDAUSDT"),
          new RegExp(`\\[${ec.code}\\] ${ec.msg}`)
        );
      });
    }

    // Test 4.2: getSpotCandles non-zero code error messages
    for (const ec of errorCodes) {
      await runAsyncTest(`getSpotCandles cleanly rejects code ${ec.code} (${ec.msg})`, async () => {
        handler = (req, res) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ code: ec.code, msg: ec.msg }));
        };
        await assert.rejects(
          () => client.getSpotCandles("rNVDAUSDT", "1day"),
          new RegExp(`\\[${ec.code}\\] ${ec.msg}`)
        );
      });
    }

    // Test 4.3: getSpotOrderbook rejects when data is null or empty
    await runAsyncTest("getSpotOrderbook rejects code 00000 with null data", async () => {
      handler = (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: "00000", msg: "success", data: null }));
      };
      await assert.rejects(
        () => client.getSpotOrderbook("rNVDAUSDT"),
        /Bitget orderbook request for rNVDAUSDT failed: \[00000\] success/
      );
    });

    // Test 4.4: getSpotCandles rejects when data is null or not array
    await runAsyncTest("getSpotCandles rejects code 00000 with non-array data", async () => {
      handler = (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: "00000", msg: "success", data: "not-an-array" }));
      };
      await assert.rejects(
        () => client.getSpotCandles("rNVDAUSDT"),
        /Bitget candles request for rNVDAUSDT failed: \[00000\] success/
      );
    });

    // Test 4.5: URL encoding of symbols with special characters
    await runAsyncTest("getSpotOrderbook encodes special characters in symbol", async () => {
      let requestedUrl = "";
      handler = (req, res) => {
        requestedUrl = req.url;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          code: "00000",
          msg: "success",
          data: { bids: [], asks: [], ts: "1789249263000" }
        }));
      };
      await client.getSpotOrderbook("rNVDA/USDT:PERP", 20);
      assert.ok(requestedUrl.includes("symbol=rNVDA%2FUSDT%3APERP"));
      assert.ok(requestedUrl.includes("limit=20"));
    });

    // Test 4.6: getSpotCandles default granularity handling
    await runAsyncTest("getSpotCandles defaults empty granularity to 1day", async () => {
      let requestedUrl = "";
      handler = (req, res) => {
        requestedUrl = req.url;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          code: "00000",
          msg: "success",
          data: []
        }));
      };
      await client.getSpotCandles("rNVDAUSDT", "   ", 100);
      assert.ok(requestedUrl.includes("granularity=1day"));
      assert.ok(requestedUrl.includes("limit=100"));
    });

    // Test 4.7: HTTP 500 server error rejection
    await runAsyncTest("getSpotOrderbook and getSpotCandles reject on HTTP 500 server error", async () => {
      handler = (req, res) => {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      };
      await assert.rejects(() => client.getSpotOrderbook("rNVDAUSDT"));
      await assert.rejects(() => client.getSpotCandles("rNVDAUSDT"));
    });

    // Test 4.8: Untrusted base URL fallback security check
    runTest("BitgetClient falls back to https://api.bitget.com for untrusted base URL", () => {
      const origEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "production";
        const untrustedClient = new BitgetClient("http://evil-attacker.org");
        assert.equal(untrustedClient.baseUrl, "https://api.bitget.com");
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });

    // Test 4.9: Normalizers called via client with completely empty/garbage orderbook data under code 00000
    await runAsyncTest("getSpotOrderbook survives garbage data payload under code 00000", async () => {
      handler = (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          code: "00000",
          msg: "success",
          requestTime: 1789249265000,
          data: {
            bids: [["invalid", "NaN"], ["-5", "10"], ["10", "-2"]],
            asks: [[null, undefined], ["abc", "def"]],
            ts: "corrupt"
          }
        }));
      };
      const ob = await client.getSpotOrderbook("rNVDAUSDT");
      assert.equal(ob.symbol, "rNVDAUSDT");
      assert.deepEqual(ob.bids, []);
      assert.deepEqual(ob.asks, []);
      assert.equal(ob.timestamp, 1789249265000);
    });

    // Test 4.10: Normalizers called via client with completely garbage candlestick data under code 00000
    await runAsyncTest("getSpotCandles survives garbage candle payload under code 00000", async () => {
      handler = (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          code: "00000",
          msg: "success",
          requestTime: 1789249265000,
          data: [
            ["corrupt", "data", "tuple"],
            ["1789574400000", "bad", "bad", "bad", "bad", "bad"],
            [null, null]
          ]
        }));
      };
      const candles = await client.getSpotCandles("rNVDAUSDT");
      assert.deepEqual(candles, []);
    });

  } finally {
    server.close();
  }
}

runClientTests().then(() => {
  console.log(`\n======================================================`);
  console.log(`TOTAL PASS: ${passed} | TOTAL FAIL: ${failed}`);
  console.log(`======================================================`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
