const { test } = require('node:test');
const assert = require('node:assert');
const { BitgetUsEquityMcpProvider, classifyTool, extractPayload } = require('../dist-core/src/adapters/research/bitgetUsEquityMcpProvider.js');

// =========================================================================
// 1. Graceful degradation — unreachable endpoint
// =========================================================================

test('getStatus returns UNAVAILABLE when endpoint is unreachable', async () => {
  const provider = new BitgetUsEquityMcpProvider();
  const status = await provider.getStatus();
  assert.strictEqual(status, 'UNAVAILABLE');
});

test('getObservations returns [] when endpoint is unreachable', async () => {
  const provider = new BitgetUsEquityMcpProvider();
  const observations = await provider.getObservations('AAPL');
  assert.deepStrictEqual(observations, []);
});

test('providerId is bitget-us-equity-mcp', () => {
  const provider = new BitgetUsEquityMcpProvider();
  assert.strictEqual(provider.providerId, 'bitget-us-equity-mcp');
});

test('custom endpoint is accepted via constructor', () => {
  const provider = new BitgetUsEquityMcpProvider('https://custom.endpoint/mcp');
  // Provider should still fail gracefully (DNS won't resolve)
  assert.strictEqual(provider.providerId, 'bitget-us-equity-mcp');
});

// =========================================================================
// 2. classifyTool — keyword-based tool categorisation
// =========================================================================

test('classifyTool: quote-related names -> quotes', () => {
  assert.strictEqual(classifyTool('get_stock_quote'), 'quotes');
  assert.strictEqual(classifyTool('realtime_price'), 'quotes');
  assert.strictEqual(classifyTool('get_kline_data'), 'quotes');
  assert.strictEqual(classifyTool('historical_candle'), 'quotes');
  assert.strictEqual(classifyTool('ohlc_bars'), 'quotes');
  assert.strictEqual(classifyTool('get_ticker'), 'quotes');
});

test('classifyTool: fundamentals-related names -> fundamentals', () => {
  assert.strictEqual(classifyTool('company_profile'), 'fundamentals');
  assert.strictEqual(classifyTool('get_financial_statements'), 'fundamentals');
  assert.strictEqual(classifyTool('balance_sheet'), 'fundamentals');
  assert.strictEqual(classifyTool('income_statement'), 'fundamentals');
  assert.strictEqual(classifyTool('cash_flow'), 'fundamentals');
  assert.strictEqual(classifyTool('valuation_ratios'), 'fundamentals');
  assert.strictEqual(classifyTool('earnings_calendar'), 'fundamentals');
});

test('classifyTool: corporate action names -> corporate_actions', () => {
  assert.strictEqual(classifyTool('dividend_history'), 'corporate_actions');
  assert.strictEqual(classifyTool('insider_trades'), 'corporate_actions');
  assert.strictEqual(classifyTool('major_shareholders'), 'corporate_actions');
});

test('classifyTool: institutional/analyst names -> institutional_analyst', () => {
  assert.strictEqual(classifyTool('13f_holdings'), 'institutional_analyst');
  assert.strictEqual(classifyTool('analyst_targets'), 'institutional_analyst');
  assert.strictEqual(classifyTool('consensus_estimate'), 'institutional_analyst');
  assert.strictEqual(classifyTool('forward_pe'), 'institutional_analyst');
});

test('classifyTool: etf names -> etf', () => {
  assert.strictEqual(classifyTool('etf_holdings'), 'etf');
  assert.strictEqual(classifyTool('get_etf_data'), 'etf');
});

test('classifyTool: news/sentiment names -> news_sentiment', () => {
  assert.strictEqual(classifyTool('latest_news'), 'news_sentiment');
  assert.strictEqual(classifyTool('market_sentiment'), 'news_sentiment');
  assert.strictEqual(classifyTool('headline_feed'), 'news_sentiment');
});

test('classifyTool: description fallback when name is generic', () => {
  assert.strictEqual(classifyTool('get_data', 'Returns real-time stock quote'), 'quotes');
  assert.strictEqual(classifyTool('fetch_info', 'Company profile and sector'), 'fundamentals');
});

test('classifyTool: unknown when no keywords match', () => {
  assert.strictEqual(classifyTool('some_random_tool'), 'unknown');
  assert.strictEqual(classifyTool('xyz_abc'), 'unknown');
});

// =========================================================================
// 3. extractPayload — MCP envelope unwrapping
// =========================================================================

test('extractPayload: returns null for null/undefined', () => {
  assert.strictEqual(extractPayload(null), null);
  assert.strictEqual(extractPayload(undefined), null);
});

test('extractPayload: returns primitives as-is', () => {
  assert.strictEqual(extractPayload(42), 42);
  assert.strictEqual(extractPayload('hello'), 'hello');
});

test('extractPayload: unwraps MCP SDK text content envelope', () => {
  const envelope = {
    content: [
      { type: 'text', text: '{"symbol":"AAPL","price":150.5}' }
    ]
  };
  const result = extractPayload(envelope);
  assert.deepStrictEqual(result, { symbol: 'AAPL', price: 150.5 });
});

test('extractPayload: returns raw text when JSON parse fails', () => {
  const envelope = {
    content: [
      { type: 'text', text: 'not valid json' }
    ]
  };
  assert.strictEqual(extractPayload(envelope), 'not valid json');
});

test('extractPayload: returns object as-is when no content array', () => {
  const plain = { symbol: 'TSLA', price: 200 };
  assert.deepStrictEqual(extractPayload(plain), plain);
});

test('extractPayload: skips non-text content blocks', () => {
  const envelope = {
    content: [
      { type: 'image', data: 'abc' },
      { type: 'text', text: '{"symbol":"GOOG"}' }
    ]
  };
  assert.deepStrictEqual(extractPayload(envelope), { symbol: 'GOOG' });
});

test('extractPayload: empty content array falls through to object', () => {
  const envelope = { content: [] };
  assert.deepStrictEqual(extractPayload(envelope), { content: [] });
});

// =========================================================================
// 4. Integration-level: registry isolation
// =========================================================================

test('provider integrates with ResearchProviderRegistry without crashing', async () => {
  const { ResearchProviderRegistry } = require('../dist-core/src/adapters/research/registry.js');
  const registry = new ResearchProviderRegistry();
  const provider = new BitgetUsEquityMcpProvider();
  registry.register(provider);

  // Should gracefully return [] since endpoint is unreachable
  const observations = await registry.gatherObservations('AAPL', 'earnings');
  assert.ok(Array.isArray(observations));
  assert.strictEqual(observations.length, 0);
});

test('resetToolCache clears cached tools', () => {
  const provider = new BitgetUsEquityMcpProvider();
  // Should not throw
  provider.resetToolCache();
  assert.strictEqual(provider.providerId, 'bitget-us-equity-mcp');
});
