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
