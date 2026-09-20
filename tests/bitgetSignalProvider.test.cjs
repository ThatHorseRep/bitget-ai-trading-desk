const { test } = require('node:test');
const assert = require('node:assert');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const http = require('node:http');
const {
  BitgetSignalProvider,
  capabilitiesForTopic,
  classifySignalTool,
  toUsdtSymbol,
  toCoinId,
  normalizeSignalResult,
  SIGNAL_CAPABILITIES,
} = require('../dist-core/src/adapters/research/bitgetSignalProvider.js');

// =========================================================================
// Fixture: an in-process MCP server speaking the DOCUMENTED transport
// (Streamable HTTP, stateless mode) exposing a subset of the official
// bitget-signal tool inventory. Fully hermetic: 127.0.0.1:<ephemeral>.
// =========================================================================

// Tool implementations mirror the documented arg shapes from SKILL.md and
// record every invocation so tests can assert exact requests.
const FIXTURE_HANDLERS = {
  rates_yields: {
    description: 'Interest rates and yield curve data',
    handler: (args, state) => {
      state.calls.push({ tool: 'rates_yields', args });
      if (args.action === 'rates_snapshot') {
        return { federal_funds_rate: 4.25, ten_year: 4.1, two_year: 3.9, spread_10y2y: 0.2, as_of: '2026-09-19' };
      }
      return {};
    },
  },
  macro_indicators: {
    description: 'US macro economic indicators (CPI, PCE, NFP)',
    handler: (args, state) => {
      state.calls.push({ tool: 'macro_indicators', args });
      if (args.action === 'multi_indicator') {
        return { indicators: { cpi: 2.9, core_pce: 2.7, nonfarm_payrolls: 180000, gdp_growth: 2.1, unemployment: 4.2 }, as_of: '2026-09-19' };
      }
      return {};
    },
  },
  global_assets: {
    description: 'Global macro asset prices (DXY, VIX, gold)',
    handler: (args, state) => {
      state.calls.push({ tool: 'global_assets', args });
      if (args.action === 'price' && args.symbol === 'DX-Y.NYB') {
        return { symbol: 'DX-Y.NYB', name: 'US Dollar Index', price: 101.2 };
      }
      return {};
    },
  },
  crypto_market: {
    description: 'Crypto global market data, trending, OHLCV',
    handler: (args, state) => {
      state.calls.push({ tool: 'crypto_market', args });
      if (args.action === 'global') {
        return { total_market_cap_usd: 2.35e12, market_cap_change_24h: -1.4, btc_dominance: 57.3, eth_dominance: 12.1, total_volume_usd: 9.2e10 };
      }
      if (args.action === 'trending') {
        return { coins: [{ id: 'bitcoin', name: 'Bitcoin' }, { id: 'ethereum', name: 'Ethereum' }] };
      }
      if (args.action === 'ohlcv') {
        return {
          coin_id: args.coin_id,
          ohlcv: Array.from({ length: 30 }, (_, i) => ({
            timestamp: 1700000000 + i * 86400,
            open: 60000 + i, high: 61000 + i, low: 59000 + i, close: 60500 + i, volume: 1000 + i,
          })),
        };
      }
      return {};
    },
  },
  sentiment_index: {
    description: 'Market fear and greed style index',
    handler: (args, state) => {
      state.calls.push({ tool: 'sentiment_index', args });
      if (args.action === 'current') {
        return { value: 71, classification: 'Greed', timestamp: '2026-09-19T00:00:00Z' };
      }
      return {};
    },
  },
  derivatives_sentiment: {
    description: 'Long/short ratio, taker ratio, OI, top positioning',
    handler: (args, state) => {
      state.calls.push({ tool: 'derivatives_sentiment', args });
      if (args.action === 'long_short') {
        return { symbol: args.symbol, period: args.period, long_short_ratio: 1.82 };
      }
      if (args.action === 'taker_ratio') {
        return { symbol: args.symbol, period: args.period, taker_ratio: 0.96 };
      }
      return {};
    },
  },
  news_feed: {
    description: 'Aggregated crypto news feed',
    handler: (args, state) => {
      state.calls.push({ tool: 'news_feed', args });
      if (args.action === 'latest') {
        return [
          { title: 'ETF inflows hit weekly record', summary: 'Spot ETFs absorbed supply.', published_at: '2026-09-19T08:00:00Z', url: 'https://example.com/etf-flow', source: 'CoinDesk' },
          { title: 'Fed speakers signal patience', summary: 'Rates path unchanged.', published_at: '2026-09-18T15:00:00Z', url: 'https://example.com/fed-patience', source: 'CoinTelegraph' },
        ];
      }
      return [];
    },
  },
};

async function startFixtureServer({ tools = Object.keys(FIXTURE_HANDLERS) } = {}) {
  const state = { calls: [] };
  // Shared input shape covering every documented argument name. Without
  // this, the SDK strips unknown args and handlers never see `action`.
  const FIXTURE_ARG_SHAPE = {
    action: z.string().optional(),
    symbol: z.string().optional(),
    period: z.string().optional(),
    feeds: z.string().optional(),
    keyword: z.string().optional(),
    limit: z.number().optional(),
    coin_id: z.string().optional(),
    days: z.number().optional(),
    indicators: z.string().optional(),
  };
  const httpServer = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;

    const server = new McpServer({ name: 'fixture-bitget-signal', version: '1.0.0' });
    for (const name of tools) {
      const def = FIXTURE_HANDLERS[name];
      if (!def) continue;
      server.registerTool(name, { description: def.description, inputSchema: FIXTURE_ARG_SHAPE }, async (args) => {
        const payload = def.handler(args ?? {}, state);
        return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
      });
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

async function getUnreachableEndpoint() {
  const srv = http.createServer(() => {});
  await new Promise((resolve) => srv.listen(0, '127.0.0.1', resolve));
  const { port } = srv.address();
  await new Promise((resolve) => srv.close(resolve));
  return `http://127.0.0.1:${port}/mcp`;
}

// =========================================================================
// 1. Relevance routing — all five capabilities supported, none spammed
// =========================================================================

test('capabilitiesForTopic routes topics to the documented capabilities', () => {
  assert.deepStrictEqual(capabilitiesForTopic('Fed rate impact on BTC'), ['macro-analyst']);
  assert.deepStrictEqual(capabilitiesForTopic('are whales buying? ETF flows'), ['market-intel']);
  assert.deepStrictEqual(capabilitiesForTopic('any news on the catalyst?'), ['news-briefing']);
  assert.deepStrictEqual(capabilitiesForTopic('are longs crowded? funding rate'), ['sentiment-analyst']);
  assert.deepStrictEqual(capabilitiesForTopic('is BTC overbought? RSI, support'), ['technical-analysis']);
});

test('capabilitiesForTopic supports mixed topics and falls back to a market pulse', () => {
  const mixed = capabilitiesForTopic('macro backdrop, sentiment, technicals and the latest news');
  assert.ok(mixed.includes('macro-analyst'));
  assert.ok(mixed.includes('sentiment-analyst'));
  assert.ok(mixed.includes('technical-analysis'));
  assert.ok(mixed.includes('news-briefing'));
  // Unknown topics never call every skill — only the default pulse.
  assert.deepStrictEqual(capabilitiesForTopic('something entirely unrelated'), ['news-briefing', 'market-intel']);
  assert.deepStrictEqual(capabilitiesForTopic(undefined), ['news-briefing', 'market-intel']);
});

test('all five capabilities are declared', () => {
  assert.deepStrictEqual(
    [...SIGNAL_CAPABILITIES].sort(),
    ['macro-analyst', 'market-intel', 'news-briefing', 'sentiment-analyst', 'technical-analysis'].sort(),
  );
});

// =========================================================================
// 2. Documented tool mapping — no guessed names
// =========================================================================

test('classifySignalTool maps only documented tool names to capabilities', () => {
  assert.strictEqual(classifySignalTool('rates_yields'), 'macro-analyst');
  assert.strictEqual(classifySignalTool('macro_indicators'), 'macro-analyst');
  assert.strictEqual(classifySignalTool('global_assets'), 'macro-analyst');
  assert.strictEqual(classifySignalTool('crypto_market'), 'market-intel');
  assert.strictEqual(classifySignalTool('defi_analytics'), 'market-intel');
  assert.strictEqual(classifySignalTool('sentiment_index'), 'sentiment-analyst');
  assert.strictEqual(classifySignalTool('derivatives_sentiment'), 'sentiment-analyst');
  assert.strictEqual(classifySignalTool('news_feed'), 'news-briefing');
  assert.strictEqual(classifySignalTool('tradfi_news'), 'news-briefing');
  assert.strictEqual(classifySignalTool('social_trending'), 'news-briefing');
  // Undocumented or unknown tools are never called.
  assert.strictEqual(classifySignalTool('definitely_not_a_tool'), null);
});

// =========================================================================
// 3. Asset mapping helpers
// =========================================================================

test('toUsdtSymbol maps desk assets to the derivatives pairs', () => {
  assert.strictEqual(toUsdtSymbol('BTC'), 'BTCUSDT');
  assert.strictEqual(toUsdtSymbol('BTCUSDT'), 'BTCUSDT');
  assert.strictEqual(toUsdtSymbol('rBTC'), 'BTCUSDT');
  assert.strictEqual(toUsdtSymbol('ETH'), 'ETHUSDT');
});

test('toCoinId maps desk assets to CoinGecko ids for OHLCV', () => {
  assert.strictEqual(toCoinId('BTC'), 'bitcoin');
  assert.strictEqual(toCoinId('rETH'), 'ethereum');
  assert.strictEqual(toCoinId('ETHUSDT'), 'ethereum');
  assert.strictEqual(toCoinId('SOL'), 'solana');
});

// =========================================================================
// 4. Live-path behavior against the fixture (discovery + routing + calls)
// =========================================================================

test('provider routes a macro topic to macro tools only, with capability-tagged provenance', async () => {
  const fx = await startFixtureServer();
  try {
    const provider = new BitgetSignalProvider(fx.endpoint);
    provider.resetToolCache();
    const obs = await provider.getObservations('BTC', 'Fed rate impact and yield curve');

    assert.ok(obs.length > 0, 'macro topic should produce observations');
    for (const o of obs) {
      assert.strictEqual(o.providerId, 'bitget-signal');
      assert.ok(o.source.startsWith('bitget-signal/macro-analyst/'), `unexpected source ${o.source}`);
      assert.strictEqual(o.providerStatus, 'AVAILABLE');
      assert.ok(o.observedTimestamp);
      assert.ok(o.summary.length <= 300, 'summary must be bounded');
    }
    // Only macro tools were invoked for a macro-only topic.
    const calledTools = new Set(fx.state.calls.map((c) => c.tool));
    assert.ok(calledTools.has('rates_yields'), 'rates_yields should be called');
    assert.ok(!calledTools.has('derivatives_sentiment'), 'sentiment tools must not be called for a macro topic');
    assert.ok(!calledTools.has('news_feed'), 'news tools must not be called for a macro topic');

    // Documented arg shapes on the wire.
    const rates = fx.state.calls.find((c) => c.tool === 'rates_yields');
    assert.ok(rates, 'rates_yields call expected');
    assert.strictEqual(rates.args.action, 'rates_snapshot');
  } finally {
    await fx.close();
  }
});

test('provider sentiment routing carries numeric value + unit and exact documented args', async () => {
  const fx = await startFixtureServer();
  try {
    const provider = new BitgetSignalProvider(fx.endpoint);
    provider.resetToolCache();
    const obs = await provider.getObservations('ETH', 'are longs crowded? funding rate check');

    const sentiment = obs.filter((o) => o.source.startsWith('bitget-signal/sentiment-analyst/'));
    assert.ok(sentiment.length >= 2, 'index + derivatives observations expected');
    const withValue = sentiment.filter((o) => typeof o.value === 'number');
    assert.ok(withValue.length >= 2, 'sentiment observations must carry comparable values');
    assert.ok(withValue.every((o) => typeof o.unit === 'string'));

    const longShort = fx.state.calls.find((c) => c.tool === 'derivatives_sentiment' && c.args.action === 'long_short');
    assert.strictEqual(longShort.args.symbol, 'ETHUSDT');
    assert.strictEqual(longShort.args.period, '4h');
  } finally {
    await fx.close();
  }
});

test('provider news routing returns normalized news items with URLs and timestamps', async () => {
  const fx = await startFixtureServer();
  try {
    const provider = new BitgetSignalProvider(fx.endpoint);
    provider.resetToolCache();
    const obs = await provider.getObservations('BTC', 'any news on the catalyst?');

    const news = obs.filter((o) => o.source.startsWith('bitget-signal/news-briefing/'));
    assert.ok(news.length === 2);
    assert.ok(news.every((o) => o.title.length > 0));
    assert.ok(news.some((o) => o.url === 'https://example.com/etf-flow'));

    const feed = fx.state.calls.find((c) => c.tool === 'news_feed');
    assert.strictEqual(feed.args.action, 'latest');
    assert.strictEqual(feed.args.feeds, 'cointelegraph,coindesk,decrypt,blockworks');
    assert.ok(feed.args.limit <= 5, 'news result size must be bounded');
  } finally {
    await fx.close();
  }
});

test('technical-analysis surfaces raw bounded OHLCV context without indicator math', async () => {
  const fx = await startFixtureServer();
  try {
    const provider = new BitgetSignalProvider(fx.endpoint);
    provider.resetToolCache();
    const obs = await provider.getObservations('BTC', 'is BTC overbought? technical setup');

    const tech = obs.filter((o) => o.source.startsWith('bitget-signal/technical-analysis/'));
    assert.ok(tech.length === 1);
    assert.ok(tech[0].title.includes('OHLCV'), 'must be labelled raw OHLCV context');
    assert.ok(tech[0].summary.length <= 300);

    const ohlcvCall = fx.state.calls.find((c) => c.tool === 'crypto_market' && c.args.action === 'ohlcv');
    assert.ok(ohlcvCall, 'ohlcv call expected');
    assert.strictEqual(ohlcvCall.args.coin_id, 'bitcoin');
  } finally {
    await fx.close();
  }
});

test('live upstream failure shapes are skipped, never normalized into observations', () => {
  // All shapes live-verified against datahub.noxiaohao.com/mcp (2026-09-20).
  const failureShapes = [
    { error: '' },
    { alt_me_error: '' },
    { fed_funds_target_upper: { error: '' }, t10y: { error: '' }, sofr: { error: '' } },
    "Error executing tool crypto_market: ConnectTimeout('')",
    [{ feed: 'cointelegraph', error: '', items: [] }, { feed: 'coindesk', error: '', items: [] }],
    { platform: 'github', provider: 'all_failed', items: [] },
    { url: 'https://mempool.space/api/v1/fees/recommended', error: '' },
  ];
  for (const shape of failureShapes) {
    const result = normalizeSignalResult(
      { content: [{ type: 'text', text: JSON.stringify(shape) }] },
      'macro-analyst',
      'rates_yields',
    );
    assert.deepStrictEqual(result, [], `failure shape must be skipped: ${JSON.stringify(shape)}`);
  }
  // Real data is NOT skipped.
  const data = normalizeSignalResult(
    { content: [{ type: 'text', text: JSON.stringify({ value: 71, classification: 'Greed' }) }] },
    'sentiment-analyst',
    'sentiment_index',
  );
  assert.strictEqual(data.length, 1);
});

test('discovery gate: documented tools absent from the live list are never called', async () => {
  // Fixture exposes ONLY the macro tools.
  const fx = await startFixtureServer({ tools: ['rates_yields', 'macro_indicators'] });
  try {
    const provider = new BitgetSignalProvider(fx.endpoint);
    provider.resetToolCache();
    // Topic routes to macro + sentiment; sentiment tools are not listed.
    const obs = await provider.getObservations('BTC', 'macro backdrop and funding sentiment');

    assert.ok(obs.length > 0);
    assert.ok(obs.every((o) => o.source.startsWith('bitget-signal/macro-analyst/')));
    // No call crashed: every observation is healthy despite the absent tools.
    assert.ok(obs.every((o) => o.providerStatus === 'AVAILABLE'));
  } finally {
    await fx.close();
  }
});

// =========================================================================
// 5. Status, degradation, failure isolation
// =========================================================================

test('getStatus reports AVAILABLE with a healthy fixture and UNAVAILABLE when unreachable', async () => {
  const fx = await startFixtureServer();
  try {
    const provider = new BitgetSignalProvider(fx.endpoint);
    provider.resetToolCache();
    assert.strictEqual(await provider.getStatus(), 'AVAILABLE');
  } finally {
    await fx.close();
  }

  const dead = new BitgetSignalProvider(await getUnreachableEndpoint());
  dead.resetToolCache();
  assert.strictEqual(await dead.getStatus(), 'UNAVAILABLE');
});

test('unreachable endpoint degrades to zero observations without throwing', async () => {
  const dead = new BitgetSignalProvider(await getUnreachableEndpoint());
  dead.resetToolCache();
  const obs = await dead.getObservations('BTC', 'macro news sentiment');
  assert.deepStrictEqual(obs, []);
});

test('empty tool catalog degrades cleanly (DEGRADED status, no observations)', async () => {
  const fx = await startFixtureServer({ tools: [] });
  try {
    const provider = new BitgetSignalProvider(fx.endpoint);
    provider.resetToolCache();
    assert.strictEqual(await provider.getStatus(), 'DEGRADED');
    assert.deepStrictEqual(await provider.getObservations('BTC', 'macro'), []);
  } finally {
    await fx.close();
  }
});

test('a failing tool call is isolated and does not break the remaining calls', async () => {
  const fx = await startFixtureServer({ tools: ['sentiment_index', 'derivatives_sentiment'] });
  // Replace the index handler with a throwing one.
  FIXTURE_HANDLERS.sentiment_index.handler = () => {
    throw new Error('boom');
  };
  try {
    const provider = new BitgetSignalProvider(fx.endpoint);
    provider.resetToolCache();
    const obs = await provider.getObservations('BTC', 'crowded positioning and funding');
    // derivatives_sentiment still produced observations despite the failure.
    assert.ok(obs.some((o) => o.source.includes('derivatives_sentiment')));
  } finally {
    // Restore for any subsequent test run ordering.
    FIXTURE_HANDLERS.sentiment_index.handler = (args, state) => {
      state.calls.push({ tool: 'sentiment_index', args });
      return args.action === 'current' ? { value: 71, classification: 'Greed' } : {};
    };
    await fx.close();
  }
});

test('malformed payloads degrade to bounded generic observations, not crashes', async () => {
  // A completely alien payload (bare string) fails every schema and must
  // fall through to the generic normalizer without throwing.
  const result = normalizeSignalResult(
    { content: [{ type: 'text', text: JSON.stringify('not json at all <html>') }] },
    'market-intel',
    'crypto_market',
  );
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].providerId, 'bitget-signal');
  assert.strictEqual(result[0].source, 'bitget-signal/market-intel/crypto_market');
  assert.strictEqual(result[0].title, 'crypto_market: market-intel');
  assert.ok(result[0].summary.length <= 300);
  assert.ok(result[0].summary.includes('not json'));

  // An unknown-key object still normalizes through the lenient envelope
  // (all fields optional) without crashing — capability-tagged, bounded.
  const lenient = normalizeSignalResult(
    { content: [{ type: 'text', text: JSON.stringify({ weird: 'not json at all <html>' }) }] },
    'market-intel',
    'crypto_market',
  );
  assert.strictEqual(lenient.length, 1);
  assert.ok(lenient[0].summary.length <= 300);
});

// =========================================================================
// 6. Bounded size
// =========================================================================

test('observation volume is bounded across a multi-capability topic', async () => {
  const fx = await startFixtureServer();
  try {
    const provider = new BitgetSignalProvider(fx.endpoint);
    provider.resetToolCache();
    const obs = await provider.getObservations('BTC', 'macro sentiment technicals news and intel');
    assert.ok(obs.length <= 24, `expected <= 24 observations, got ${obs.length}`);
  } finally {
    await fx.close();
  }
});
