const assert = require("node:assert/strict");
const { test } = require("node:test");
const http = require("node:http");
const { YahooReferenceProvider } = require("../dist-core/src/adapters/reference/yahoo.js");

test("YahooReferenceProvider integration tests", async (t) => {
  let currentHandler = (req, res) => {
    res.writeHead(404);
    res.end();
  };

  const server = http.createServer((req, res) => currentHandler(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  
  // We can bypass constructor checks by doing this, but YahooReferenceProvider 
  // validates baseUrl against a trusted list and falls back if not.
  // We might need to override the baseUrl after instantiation if it reverted.
  const provider = new YahooReferenceProvider(baseUrl);
  provider.baseUrl = baseUrl; // Force it for testing

  t.after(() => server.close());

  await t.test("valid quote", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        chart: {
          result: [{
            meta: {
              symbol: "NVDA",
              regularMarketPrice: 150.5,
              chartPreviousClose: 145.0,
              regularMarketTime: 1789249263
            }
          }]
        }
      }));
    };
    const quote = await provider.getReferencePrice("NVDA");
    assert.equal(quote.symbol, "NVDA");
    assert.equal(quote.price, 150.5);
    assert.equal(quote.previousClose, 145.0);
    assert.equal(quote.observedAt, new Date(1789249263 * 1000).toISOString());
  });

  await t.test("missing regularMarketPrice but valid previousClose", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        chart: {
          result: [{
            meta: {
              symbol: "NVDA",
              previousClose: 140.0,
              regularMarketTime: 1789249263
            }
          }]
        }
      }));
    };
    const quote = await provider.getReferencePrice("NVDA");
    assert.equal(quote.price, 140.0);
    assert.equal(quote.previousClose, 140.0);
  });

  await t.test("stale quote / missing regularMarketTime throws error", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        chart: {
          result: [{
            meta: {
              symbol: "NVDA",
              regularMarketPrice: 150.5
            }
          }]
        }
      }));
    };
    await assert.rejects(() => provider.getReferencePrice("NVDA"), /Missing regularMarketTime/);
  });

  await t.test("malformed response", async () => {
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("NOT JSON");
    };
    await assert.rejects(() => provider.getReferencePrice("NVDA"), /Failed to parse JSON/);
    
    currentHandler = (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ chart: {} }));
    };
    await assert.rejects(() => provider.getReferencePrice("NVDA"), /invalid chart payload/);
  });

  await t.test("network timeout", async () => {
    // We will simulate a timeout by letting the server drop the connection.
    currentHandler = (req, res) => {
      req.socket.destroy();
    };
    await assert.rejects(() => provider.getReferencePrice("NVDA"), /socket hang up|network error/);
  });
});
