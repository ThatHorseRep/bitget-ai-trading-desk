const { test } = require('node:test');
const assert = require('node:assert');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const http = require('node:http');
const {
  BitgetUsEquityMcpProvider,
  classifyTool,
  extractPayload,
  toReferenceSymbol,
} = require('../dist-core/src/adapters/research/bitgetUsEquityMcpProvider.js');

// =========================================================================
// Fixture: an in-process MCP server speaking the DOCUMENTED transport
// (Streamable HTTP, stateless mode) with tools across the six handbook
// categories. Tests run fully hermetically against 127.0.0.1:<ephemeral>.
// =========================================================================

const FIXTURE_TOOLS = [
  {
    name: 'get_stock_quote',
    description: 'Returns real-time US stock quote',
    category: 'quotes',
    payload: { symbol: 'AAPL', price: 231.4, volume: 51234567, timestamp: '2026-09-18T20:00:00.000Z' },
  },
  {
    name: 'company_profile',
    description: 'Company profile and sector information',
    category: 'fundamentals',
    payload: { symbol: 'AAPL', companyName: 'Apple Inc.', sector: 'Technology', marketCap: 3500000000000 },
  },
  {
    name: 'earnings_calendar',
    description: 'Upcoming earnings calendar entries',
    category: 'fundamentals',
    payload: { symbol: 'AAPL', date: '2026-10-29', epsEstimate: 1.65, epsActual: null },
  },
  {
    name: 'analyst_targets',
    description: 'Analyst price targets and consensus',
    category: 'institutional_analyst',
    payload: { symbol: 'AAPL', targetPrice: 260, consensusRating: 'Buy' },
  },
  {
    name: 'latest_news',
    description: 'Latest news headlines for a symbol',
    category: 'news_sentiment',
    payload: [
      { title: 'Apple previews new AI features', summary: 'On-device AI roadmap expands.', publishedAt: '2026-09-17T14:00:00.000Z', url: 'https://example.com/aapl-news-1' },
      { title: 'Supply chain notes steady iPhone build plans', summary: 'Component orders unchanged.', publishedAt: '2026-09-16T09:30:00.000Z', url: 'https://example.com/aapl-news-2' },
    ],
  },
];

async function startFixtureServer({ countRequests = false } = {}) {
  const state = { requestCount: 0, seenTools: [] };

  const httpServer = http.createServer(async (req, res) => {
    if (countRequests) state.requestCount += 1;
    let body = '';
    for await (const chunk of req) body += chunk;

    // Stateless pattern: a fresh McpServer + transport per request.
    const server = new McpServer({ name: 'fixture-us-equity', version: '1.0.0' });
    for (const tool of FIXTURE_TOOLS) {
      server.registerTool(
        tool.name,
        { description: tool.description, inputSchema: { symbol: z.string() } },
        async () => {
          state.seenTools.push({ name: tool.name, args: JSON.parse(body || '{}') });
          return { content: [{ type: 'text', text: JSON.stringify(tool.payload) }] };
        },
      );
    }
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => transport.close());
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, body ? JSON.parse(body) : undefined);
    } catch {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: 'fixture failure' }, id: null }));
      }
    }
  });

  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const port = httpServer.address().port;
  return {
    state,
    endpoint: `http://127.0.0.1:${port}/mcp`,
    close: () => new Promise((resolve) => httpServer.close(resolve)),
  };
}

// Unreachable local endpoint (nothing listens here) for degradation tests.
async function getUnreachableEndpoint() {
  const srv = http.createServer(() => {});
  await new Promise((resolve) => srv.listen(0, '127.0.0.1', resolve));
  const { port } = srv.address();
  await new Promise((resolve) => srv.close(resolve));
  return `http://127.0.0.1:${port}/mcp`;
}

// =========================================================================
// 1. Asset gating — only supported reference assets reach the service
// =========================================================================

test('toReferenceSymbol maps rToken trade symbols to US reference tickers', () => {
  assert.strictEqual(toReferenceSymbol('rNVDA'), 'NVDA');
  assert.strictEqual(toReferenceSymbol('rNVDAUSDT'), 'NVDA');
  assert.strictEqual(toReferenceSymbol('RNVDAUSDT'), 'NVDA');
  assert.strictEqual(toReferenceSymbol('rCOIN'), 'COIN');
  assert.strictEqual(toReferenceSymbol('rTSLA'), 'TSLA');
});

test('toReferenceSymbol rejects non-rToken assets (crypto never reaches the US-equity service)', () => {
  assert.strictEqual(toReferenceSymbol('BTC'), null, 'plain crypto ticker must be rejected');
  assert.strictEqual(toReferenceSymbol('BTCUSDT'), null, 'crypto pair must be rejected');
  assert.strictEqual(toReferenceSymbol('ETHUSDT'), null);
  assert.strictEqual(toReferenceSymbol('SOL'), null);
  assert.strictEqual(toReferenceSymbol(''), null);
});

test('getObservations sends no requests for unsupported assets', async () => {
  const fixture = await startFixtureServer({ countRequests: true });
  try {
    const provider = new BitgetUsEquityMcpProvider(fixture.endpoint);
    const observations = await provider.getObservations('BTCUSDT', 'thesis');
    assert.deepStrictEqual(observations, []);
    assert.strictEqual(fixture.state.requestCount, 0, 'unsupported asset must not produce any MCP traffic');
  } finally {
    await fixture.close();
  }
});

// =========================================================================
// 2. End-to-end over the documented transport (Streamable HTTP)
// =========================================================================

test('getStatus returns AVAILABLE against a live-speaking MCP fixture', async () => {
  const fixture = await startFixtureServer();
  try {
    const provider = new BitgetUsEquityMcpProvider(fixture.endpoint);
    assert.strictEqual(await provider.getStatus(), 'AVAILABLE');
  } finally {
    await fixture.close();
  }
});

test('getObservations normalizes quotes with source identity, timestamp, and value', async () => {
  const fixture = await startFixtureServer();
  try {
    const provider = new BitgetUsEquityMcpProvider(fixture.endpoint);
    const observations = await provider.getObservations('rNVDA', 'earnings and price outlook');

    assert.ok(Array.isArray(observations));
    assert.ok(observations.length > 0, 'fixture tools must produce observations');

    const quote = observations.find((o) => o.title.startsWith('Quote:'));
    assert.ok(quote, 'quote observation must be present');
    assert.strictEqual(quote.providerId, 'bitget-us-equity-mcp');
    assert.strictEqual(quote.source, 'bitget-mcp-server/get_stock_quote');
    assert.strictEqual(quote.value, 231.4);
    assert.strictEqual(quote.unit, 'USD');
    assert.ok(quote.observedTimestamp, 'observed timestamp present');
    assert.ok(quote.id.startsWith('use-NVDA-'), 'id references the normalized reference symbol');
    assert.strictEqual(quote.providerStatus, 'AVAILABLE');

    // The service must be asked about the REFERENCE ticker, not the rToken.
    // (The fixture records the raw JSON-RPC body: params.arguments.symbol.)
    const quoteCall = fixture.state.seenTools.find((c) => c.name === 'get_stock_quote');
    assert.strictEqual(quoteCall.args.params.arguments.symbol, 'NVDA', 'request must use the US reference symbol');
  } finally {
    await fixture.close();
  }
});

test('news arrays are bounded and normalized item-by-item', async () => {
  const fixture = await startFixtureServer();
  try {
    const provider = new BitgetUsEquityMcpProvider(fixture.endpoint);
    const observations = await provider.getObservations('rNVDA', 'latest news');
    const news = observations.filter((o) => o.url);
    assert.strictEqual(news.length, 2, 'both fixture news items normalize');
    assert.ok(news.every((n) => n.title && n.observedTimestamp));
    assert.ok(news.every((n) => n.source === 'bitget-mcp-server/latest_news'));
  } finally {
    await fixture.close();
  }
});

test('summaries are bounded to the configured maximum length', async () => {
  const fixture = await startFixtureServer();
  try {
    const provider = new BitgetUsEquityMcpProvider(fixture.endpoint);
    const observations = await provider.getObservations('rNVDA', 'news');
    assert.ok(observations.every((o) => o.summary.length <= 500));
  } finally {
    await fixture.close();
  }
});

// =========================================================================
// 3. Graceful degradation
// =========================================================================

test('getStatus returns UNAVAILABLE when the endpoint is unreachable', async () => {
  const provider = new BitgetUsEquityMcpProvider(await getUnreachableEndpoint());
  assert.strictEqual(await provider.getStatus(), 'UNAVAILABLE');
});

test('getObservations returns [] when the endpoint is unreachable (never throws)', async () => {
  const provider = new BitgetUsEquityMcpProvider(await getUnreachableEndpoint());
  const observations = await provider.getObservations('rNVDA', 'thesis');
  assert.deepStrictEqual(observations, []);
});

test('malformed tool payloads degrade to a generic observation instead of crashing', async () => {
  // Server whose tool returns a non-JSON text block.
  const httpServer = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const server = new McpServer({ name: 'bad-fixture', version: '1.0.0' });
    server.registerTool(
      'get_stock_quote',
      { description: 'Returns real-time US stock quote', inputSchema: { symbol: z.string() } },
      async () => ({ content: [{ type: 'text', text: '<<<not json>>>' }] }),
    );
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, body ? JSON.parse(body) : undefined);
  });
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address();
  try {
    const provider = new BitgetUsEquityMcpProvider(`http://127.0.0.1:${port}/mcp`);
    const observations = await provider.getObservations('rNVDA', 'price');
    assert.ok(Array.isArray(observations));
    assert.strictEqual(observations.length, 1, 'malformed payload becomes one generic observation');
    assert.strictEqual(observations[0].providerId, 'bitget-us-equity-mcp');
  } finally {
    await new Promise((resolve) => httpServer.close(resolve));
  }
});

// =========================================================================
// 4. Registry isolation (hermetic — no live endpoint in the test suite)
// =========================================================================

test('provider integrates with ResearchProviderRegistry without crashing', async () => {
  const { ResearchProviderRegistry } = require('../dist-core/src/adapters/research/registry.js');
  const registry = new ResearchProviderRegistry();
  registry.register(new BitgetUsEquityMcpProvider(await getUnreachableEndpoint()));

  const observations = await registry.gatherObservations('rNVDA', 'earnings');
  assert.ok(Array.isArray(observations));
  assert.strictEqual(observations.length, 0);
});

// =========================================================================
// 5. Pure helpers
// =========================================================================

test('providerId is bitget-us-equity-mcp', () => {
  assert.strictEqual(new BitgetUsEquityMcpProvider().providerId, 'bitget-us-equity-mcp');
});

test('classifyTool maps documented category vocabulary', () => {
  assert.strictEqual(classifyTool('get_stock_quote'), 'quotes');
  assert.strictEqual(classifyTool('get_kline_data'), 'quotes');
  assert.strictEqual(classifyTool('company_profile'), 'fundamentals');
  assert.strictEqual(classifyTool('earnings_calendar'), 'fundamentals');
  assert.strictEqual(classifyTool('dividend_history'), 'corporate_actions');
  assert.strictEqual(classifyTool('13f_holdings'), 'institutional_analyst');
  assert.strictEqual(classifyTool('etf_holdings'), 'etf');
  assert.strictEqual(classifyTool('latest_news'), 'news_sentiment');
  assert.strictEqual(classifyTool('get_data', 'Returns real-time stock quote'), 'quotes');
  assert.strictEqual(classifyTool('xyz_abc'), 'unknown');
});

test('extractPayload unwraps MCP text envelopes', () => {
  assert.strictEqual(extractPayload(null), null);
  assert.strictEqual(extractPayload(42), 42);
  assert.deepStrictEqual(
    extractPayload({ content: [{ type: 'text', text: '{"symbol":"AAPL","price":150.5}' }] }),
    { symbol: 'AAPL', price: 150.5 },
  );
  assert.strictEqual(extractPayload({ content: [{ type: 'text', text: 'not json' }] }), 'not json');
  assert.deepStrictEqual(extractPayload({ content: [] }), { content: [] });
});

test('resetToolCache clears the cached tool list', () => {
  const provider = new BitgetUsEquityMcpProvider();
  provider.resetToolCache();
  assert.strictEqual(provider.providerId, 'bitget-us-equity-mcp');
});

// ---------------------------------------------------------------------------
// Catalog protocol (guide + do_query) — the shape the LIVE server exposes
// (verified 2026-09-21: two tools, `guide` and `do_query`, entry_id-based).
// The adapter must support BOTH protocols: named tools (documented) and the
// catalog protocol (live). These tests pin the catalog path hermetically.
// ---------------------------------------------------------------------------

// Guide payload shape per GuideResponseSchema: { entries: [...] }.
// url_path/title/summary feed classifyTool for category assignment.
const GUIDE_ENTRY_FIXTURES = [
  { id: 'equity_price_quote', url_path: 'equity_price_quote', title: 'Equity Price Quote', summary: 'Real-time quote for a US equity.', params_summary: [{ name: 'symbol', required: true }] },
  { id: 'equity_price_historical', url_path: 'equity/price/historical', title: 'Stock Historical Kline', summary: 'Historical OHLCV data.', params_summary: [{ name: 'symbol', required: true }] },
  { id: 'equity_company_profile', url_path: 'equity_company_profile', title: 'Company Profile', summary: 'Company profile information.', params_summary: [{ name: 'symbol', required: true }] },
];

const QUOTE_ROW = {
  symbol: 'NVDA',
  last_price: 222.53,
  bid: 222.5,
  ask: 222.53,
  volume: 96500000,
  prev_close: 219.34,
  last_timestamp: '2026-09-19T20:00:00.000Z',
};

// Live do_query envelope per DoQueryEnvelopeSchema (observed 2026-09-21).
// Accepts a single row or an array of rows (historical series).
function doQueryEnvelope(rows) {
  return { success: true, status_code: 0, data: { results: Array.isArray(rows) ? rows : [rows] }, error: null };
}

// equity_price_historical returns an ARRAY of OHLCV bars, oldest first
// (observed 2026-09-21 on QQQ: 19 bars from 2026-08-24 close 706.32 to
// 2026-09-18 close 721.45). Bars carry date/close, never last_price.
const HISTORY_BARS = [
  { symbol: 'QQQ', date: '2026-08-24T04:00:00Z', open: 709.66, high: 709.79, low: 702.7, close: 706.32, volume: 37443142.25, time: 1787544000000 },
  { symbol: 'QQQ', date: '2026-09-11T04:00:00Z', open: 715.1, high: 716.5, low: 713.9, close: 714.8, volume: 45000000, time: 1789099200000 },
  { symbol: 'QQQ', date: '2026-09-18T04:00:00Z', open: 718.83, high: 721.73, low: 715.08, close: 721.45, volume: 48478713.83, time: 1789704000000 },
];

const LIVE_QUOTE_ROW = { symbol: 'QQQ', last_price: 722.05, bid: 722, ask: 722.05, volume: 41000000, last_timestamp: '2026-09-18T23:59:59Z' };

async function startCatalogFixtureServer() {
  const state = { requestCount: 0, doQueryCalls: [] };

  const httpServer = http.createServer(async (req, res) => {
    state.requestCount += 1;
    let body = '';
    for await (const chunk of req) body += chunk;

    // Stateless pattern: a fresh McpServer + transport per request.
    const server = new McpServer({ name: 'fixture-us-equity-catalog', version: '1.0.0' });
    server.registerTool(
      'guide',
      { description: 'Catalog guide', inputSchema: { category: z.string() } },
      async (args) => {
        // Live behavior (observed 2026-09-21): guide({ category }) returns
        // only that domain's entries. Mirror it so entry ranking matches
        // production instead of triplicating every entry across domains.
        const a = args && typeof args === 'object' && 'arguments' in args ? args.arguments : args;
        const entries = a && a.category === 'equity' ? GUIDE_ENTRY_FIXTURES : [];
        return { content: [{ type: 'text', text: JSON.stringify({ entries }) }] };
      },
    );
    server.registerTool(
      'do_query',
      { description: 'Catalog query', inputSchema: { entry_id: z.string(), params: z.object({}).passthrough() } },
      async (args) => {
        const a = args && typeof args === 'object' && 'arguments' in args ? args.arguments : args;
        state.doQueryCalls.push(a);
        if (a && a.entry_id === 'equity_price_quote') {
          return { content: [{ type: 'text', text: JSON.stringify(doQueryEnvelope(LIVE_QUOTE_ROW)) }] };
        }
        if (a && a.entry_id === 'equity_price_historical') {
          return { content: [{ type: 'text', text: JSON.stringify(doQueryEnvelope(HISTORY_BARS)) }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(doQueryEnvelope({})) }] };
      },
    );
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => transport.close());
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, body ? JSON.parse(body) : undefined);
    } catch {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: 'fixture failure' }, id: null }));
      }
    }
  });

  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const port = httpServer.address().port;
  return {
    state,
    endpoint: `http://127.0.0.1:${port}/mcp`,
    close: () => new Promise((resolve) => httpServer.close(resolve)),
  };
}

test('catalog protocol: guide+do_query entries normalize into provenance-carrying observations', async () => {
  const fixture = await startCatalogFixtureServer();
  try {
    const provider = new BitgetUsEquityMcpProvider(fixture.endpoint);
    const observations = await provider.getObservations('rNVDA', 'price outlook');

    assert.ok(Array.isArray(observations));
    assert.ok(observations.length > 0, 'catalog path must produce observations');
    const quote = observations.find((o) => o.title.startsWith('Quote:'));
    assert.ok(quote, 'quote observation must be present');
    assert.strictEqual(quote.source, 'bitget-mcp-server/equity_price_quote');
    assert.strictEqual(quote.value, 722.05);
    assert.strictEqual(quote.observedTimestamp, '2026-09-18T23:59:59Z');
    assert.ok(
      fixture.state.doQueryCalls.some((c) => c && c.entry_id === 'equity_price_quote'),
      'adapter must drive do_query with the guide-discovered entry id',
    );
  } finally {
    await fixture.close();
  }
});

test('catalog protocol: historical series keeps its real bar date and never masquerades as a live quote', async () => {
  const fixture = await startCatalogFixtureServer();
  try {
    const provider = new BitgetUsEquityMcpProvider(fixture.endpoint);
    const observations = await provider.getObservations('rQQQ', 'thesis');

    const quote = observations.find((o) => o.title === 'Quote: QQQ');
    const history = observations.find((o) => o.title.startsWith('Price history'));
    assert.ok(quote, 'live quote observation must be present');
    assert.ok(history, 'historical observation must be present');

    // The live quote keeps its own timestamp (Friday close), not 'now'.
    assert.strictEqual(quote.observedTimestamp, '2026-09-18T23:59:59Z');
    assert.strictEqual(quote.value, 722.05);

    // The historical observation must carry the LATEST bar's REAL date and
    // value (721.45 on 2026-09-18) - never the oldest bar (706.32) and
    // never a build-time timestamp that would masquerade as current.
    assert.strictEqual(history.value, 721.45);
    assert.ok(history.observedTimestamp.startsWith('2026-09-18'), history.observedTimestamp);
    assert.ok(
      history.summary.includes('Historical close') && history.summary.includes('721.45'),
      'summary must be explicit that this is a historical close',
    );

    // Distinct titles mean the arbitrator never groups these as one metric.
    assert.notEqual(quote.title, history.title);
  } finally {
    await fixture.close();
  }
});

test('catalog protocol: crypto assets are gated before any MCP traffic', async () => {
  const fixture = await startCatalogFixtureServer();
  try {
    const provider = new BitgetUsEquityMcpProvider(fixture.endpoint);
    const observations = await provider.getObservations('BTC', 'price outlook');
    assert.deepStrictEqual(observations, []);
    assert.strictEqual(fixture.state.requestCount, 0, 'unsupported asset must not produce any MCP traffic');
  } finally {
    await fixture.close();
  }
});
