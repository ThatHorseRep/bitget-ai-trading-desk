import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";
import type {
  NormalizedResearchObservation,
  ResearchProvider,
  ResearchProviderStatus,
} from "./types.js";

// ===========================================================================
// PRE24-03 — Bitget Signal provider
//
// Official documentation trail (no guessed names or shapes):
//   * @bitget-ai/bitget-signal@1.2.0 README: the package bundles five
//     markdown Skills (the AI-host prompt layer) plus a registration of
//     Bitget's PUBLIC market-data MCP server over HTTP transport.
//     "the skills are the prompt, the MCP server is the tools".
//   * scripts/install.js in the same package: MCP_NAME = "bitget-signal",
//     MCP_URL  = "https://datahub.noxiaohao.com/mcp", transport http,
//     no credentials required.
//   * skills/*/SKILL.md: the exact tool names and argument shapes below
//     (rates_yields, macro_indicators, global_assets, cross_asset,
//     crypto_market, defi_analytics, sentiment_index,
//     derivatives_sentiment, news_feed, tradfi_news, social_trending).
//
// Consequently the DESK consumes the documented programmatic path (the
// public MCP) for observations, while the five Skills remain the AI-host
// layer (see bitgetSignalAgentBridge.ts for that contract). The provider
// only issues read-only research calls, discovers the live tool list at
// runtime, and skips any documented tool the server does not actually
// expose. The technical-analysis Skill computes indicators host-side in
// Python; this provider deliberately does NOT reimplement that math — it
// surfaces bounded raw OHLCV context and labels it as such.
// ===========================================================================

// ---------------------------------------------------------------------------
// Capabilities (exactly the five supported Skills)
// ---------------------------------------------------------------------------

export const SIGNAL_CAPABILITIES = [
  "macro-analyst",
  "market-intel",
  "news-briefing",
  "sentiment-analyst",
  "technical-analysis",
] as const;

export type SignalCapability = (typeof SIGNAL_CAPABILITIES)[number];

// ---------------------------------------------------------------------------
// Bounded latency / size
//
// Live-verified (2026-09-20): the public server answers listTools() fast,
// but individual tool calls aggregate several upstream APIs and can take
// 15-30s when those upstreams are slow. The Desk bounds each call at 8s by
// default (ops-tunable via BITGET_SIGNAL_TOOL_TIMEOUT_MS) and issues the
// routed calls in PARALLEL, so a slow server degrades to fewer observations
// instead of stalling the workflow.
// ---------------------------------------------------------------------------

const DEFAULT_CONNECT_TIMEOUT_MS = 2_500;
const DEFAULT_TOOL_CALL_TIMEOUT_MS = 3_000;
const MAX_SUMMARY_LENGTH = 300;
const MAX_ITEMS_PER_CALL = 5;
const MAX_TOTAL_OBSERVATIONS = 24;

// ---------------------------------------------------------------------------
// Zod schemas — lenient envelopes (fields optional, unknown keys preserved)
// so a live payload drift degrades to the generic normalizer instead of
// crashing. Shapes mirror the documented tool actions.
// ---------------------------------------------------------------------------

const RatesSnapshotSchema = z
  .object({
    federal_funds_rate: z.number().optional(),
    fed_funds: z.number().optional(),
    ten_year: z.number().optional(),
    two_year: z.number().optional(),
    spread_10y2y: z.number().optional(),
    as_of: z.string().optional(),
  })
  .passthrough();

const MacroIndicatorsSchema = z
  .object({
    indicators: z.record(z.string(), z.unknown()).optional(),
    cpi: z.unknown().optional(),
    as_of: z.string().optional(),
  })
  .passthrough();

const GlobalAssetPriceSchema = z
  .object({
    symbol: z.string().optional(),
    price: z.number().optional(),
    name: z.string().optional(),
    timestamp: z.string().optional(),
  })
  .passthrough();

const CryptoGlobalSchema = z
  .object({
    total_market_cap_usd: z.number().optional(),
    market_cap_change_24h: z.number().optional(),
    btc_dominance: z.number().optional(),
    eth_dominance: z.number().optional(),
    total_volume_usd: z.number().optional(),
  })
  .passthrough();

const SentimentIndexSchema = z
  .object({
    value: z.number().optional(),
    classification: z.string().optional(),
    label: z.string().optional(),
    timestamp: z.string().optional(),
  })
  .passthrough();

const DerivativesSentimentSchema = z
  .object({
    symbol: z.string().optional(),
    period: z.string().optional(),
    long_short_ratio: z.number().optional(),
    longShortRatio: z.number().optional(),
    taker_ratio: z.number().optional(),
    open_interest: z.number().optional(),
    value: z.number().optional(),
  })
  .passthrough();

const NewsItemSchema = z
  .object({
    title: z.string(),
    summary: z.string().optional(),
    url: z.string().optional(),
    source: z.string().optional(),
    published_at: z.string().optional(),
    publishedAt: z.string().optional(),
    date: z.string().optional(),
  })
  .passthrough();

const OhlcvSchema = z
  .object({
    coin_id: z.string().optional(),
    ohlcv: z
      .array(
        z.object({
          timestamp: z.union([z.string(), z.number()]).optional(),
          open: z.number().optional(),
          high: z.number().optional(),
          low: z.number().optional(),
          close: z.number().optional(),
          volume: z.number().optional(),
        }),
      )
      .optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Relevance routing — triggers taken verbatim from the official SKILL.md
// frontmatter descriptions, condensed to keyword stems. Supports all five
// capabilities, but a trade only pulls the ones its topic asks for.
// ---------------------------------------------------------------------------

const CAPABILITY_KEYWORDS: Record<SignalCapability, RegExp> = {
  "macro-analyst":
    /macro|fed\b|fomc|rate cut|rate hike|interest rate|cpi|pce|inflation|yield curve|recession|gdp|dxy|dollar|risk-on|risk-off|jobs|payroll|unemployment/,
  "market-intel":
    /whale|etf flow|etf|flow|cycle|accumulation|on-chain|onchain|defi|tvl|institutional|stablecoin|tvb|dominance/,
  "news-briefing":
    /news|catalyst|happening|briefing|headlines?|event|morning|announcement/,
  "sentiment-analyst":
    /sentiment|greed|fearful|fear|funding|long\/short|long short|positioning|crowded|squeeze|open interest|\boi\b|taker|social|reddit|bullish crowd|bearish crowd/,
  "technical-analysis":
    /overbought|oversold|rsi|support|resistance|technical|trend|setup|chart|candle|bollinger|macd|moving average|4h|daily/,
};

/**
 * Route a research topic to the Signal capabilities that matter for it.
 * Unknown/empty topics fall back to the market pulse (news + intel) rather
 * than every capability — the Desk must not call every skill on every trade.
 */
export function capabilitiesForTopic(topic?: string): SignalCapability[] {
  if (!topic) return ["news-briefing", "market-intel"];
  const t = topic.toLowerCase();
  const matched: SignalCapability[] = [];
  for (const capability of SIGNAL_CAPABILITIES) {
    if (CAPABILITY_KEYWORDS[capability].test(t)) matched.push(capability);
  }
  return matched.length > 0 ? matched : ["news-briefing", "market-intel"];
}

/**
 * Map a discovered tool name to the capability whose documented workflow
 * uses it. Only documented names are recognized; anything else returns
 * null and is never called.
 */
export function classifySignalTool(name: string): SignalCapability | null {
  switch (name) {
    case "rates_yields":
    case "macro_indicators":
    case "global_assets":
    case "cross_asset":
    case "cn_market":
    case "global_data":
      return "macro-analyst";
    case "crypto_market":
    case "defi_analytics":
    case "network_status":
      return "market-intel";
    case "sentiment_index":
    case "derivatives_sentiment":
      return "sentiment-analyst";
    case "news_feed":
    case "tradfi_news":
    case "social_trending":
      return "news-briefing";
    default:
      // technical-analysis rides on crypto_market (OHLCV); full indicator
      // computation stays in the AI-host Skill (Python, pandas/numpy).
      return null;
  }
}

// ---------------------------------------------------------------------------
// Documented call plans per capability. Args are the exact shapes from
// skills/*/SKILL.md; a spec is skipped when the server's discovered tool
// list does not contain its tool name.
// ---------------------------------------------------------------------------

interface CallContext {
  /** e.g. BTCUSDT for derivatives tools. */
  usdtSymbol: string;
  /** CoinGecko coin id for crypto_market OHLCV (documented requirement). */
  coinId: string;
  /** Free-text topic keyword for news_feed. */
  topic?: string;
}

interface ToolCallSpec {
  tool: string;
  capability: SignalCapability;
  args: (ctx: CallContext) => Record<string, unknown>;
}

const NEWS_FEEDS = "cointelegraph,coindesk,decrypt,blockworks";

const CAPABILITY_CALLS: Record<SignalCapability, ToolCallSpec[]> = {
  "macro-analyst": [
    {
      tool: "rates_yields",
      capability: "macro-analyst",
      args: () => ({ action: "rates_snapshot" }),
    },
    {
      tool: "macro_indicators",
      capability: "macro-analyst",
      args: () => ({
        action: "multi_indicator",
        indicators: "cpi,core_pce,nonfarm_payrolls,gdp_growth,unemployment",
      }),
    },
    {
      tool: "global_assets",
      capability: "macro-analyst",
      args: () => ({ action: "price", symbol: "DX-Y.NYB" }),
    },
  ],
  "market-intel": [
    {
      tool: "crypto_market",
      capability: "market-intel",
      args: () => ({ action: "global" }),
    },
    {
      tool: "crypto_market",
      capability: "market-intel",
      args: () => ({ action: "trending" }),
    },
  ],
  "sentiment-analyst": [
    {
      tool: "sentiment_index",
      capability: "sentiment-analyst",
      args: () => ({ action: "current" }),
    },
    {
      tool: "derivatives_sentiment",
      capability: "sentiment-analyst",
      args: (ctx) => ({ action: "long_short", symbol: ctx.usdtSymbol, period: "4h" }),
    },
    {
      tool: "derivatives_sentiment",
      capability: "sentiment-analyst",
      args: (ctx) => ({ action: "taker_ratio", symbol: ctx.usdtSymbol, period: "4h" }),
    },
  ],
  "technical-analysis": [
    {
      tool: "crypto_market",
      capability: "technical-analysis",
      args: (ctx) => ({ action: "ohlcv", coin_id: ctx.coinId, days: 30 }),
    },
  ],
  "news-briefing": [
    {
      tool: "news_feed",
      capability: "news-briefing",
      args: (ctx) => ({
        action: "latest",
        feeds: NEWS_FEEDS,
        ...(ctx.topic ? { keyword: ctx.topic } : {}),
        limit: MAX_ITEMS_PER_CALL,
      }),
    },
  ],
};

// ---------------------------------------------------------------------------
// Discovered-tool cache entry
// ---------------------------------------------------------------------------

interface DiscoveredTool {
  name: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class BitgetSignalProvider implements ResearchProvider {
  readonly providerId = "bitget-signal";

  private endpoint: string;
  private connectTimeoutMs: number;
  private toolCallTimeoutMs: number;
  private discoveredTools: DiscoveredTool[] | null = null;

  constructor(endpoint?: string) {
    // Official registration target from @bitget-ai/bitget-signal install.js.
    this.endpoint =
      endpoint ??
      process.env.BITGET_SIGNAL_MCP_ENDPOINT ??
      "https://datahub.noxiaohao.com/mcp";
    const parsedConnect = Number(process.env.BITGET_SIGNAL_CONNECT_TIMEOUT_MS);
    this.connectTimeoutMs =
      Number.isFinite(parsedConnect) && parsedConnect > 0
        ? parsedConnect
        : DEFAULT_CONNECT_TIMEOUT_MS;
    const parsedTimeout = Number(process.env.BITGET_SIGNAL_TOOL_TIMEOUT_MS);
    this.toolCallTimeoutMs =
      Number.isFinite(parsedTimeout) && parsedTimeout > 0
        ? parsedTimeout
        : DEFAULT_TOOL_CALL_TIMEOUT_MS;
  }

  async getStatus(): Promise<ResearchProviderStatus> {
    const { client, transport } = await this.connect();
    if (!client) return "UNAVAILABLE";
    try {
      const tools = await this.discoverTools(client);
      return tools.length > 0 ? "AVAILABLE" : "DEGRADED";
    } catch {
      return "DEGRADED";
    } finally {
      await this.safeClose(client, transport);
    }
  }

  async getObservations(
    asset: string,
    topic?: string,
  ): Promise<NormalizedResearchObservation[]> {
    const capabilities = capabilitiesForTopic(topic);

    const { client, transport } = await this.connect();
    if (!client) return [];

    try {
      const discovered = await this.discoverTools(client);
      if (discovered.length === 0) return [];
      const available = new Set(discovered.map((t) => t.name));

      const ctx: CallContext = {
        usdtSymbol: toUsdtSymbol(asset),
        coinId: toCoinId(asset),
        topic: topic?.trim() || undefined,
      };

      // Resolve the routed capability calls against the discovered list.
      const specs: ToolCallSpec[] = [];
      for (const capability of capabilities) {
        for (const spec of CAPABILITY_CALLS[capability]) {
          // Discovery gate: only call tools the live server actually lists.
          if (!available.has(spec.tool)) continue;
          specs.push(spec);
        }
      }

      // Parallel dispatch: calls are independent, so a slow tool must not
      // serialize the rest. Each call is individually bounded.
      const settled = await Promise.allSettled(
        specs.map((spec) => this.callToolSafe(client, spec, ctx)),
      );

      const results: NormalizedResearchObservation[] = [];
      for (const outcome of settled) {
        if (outcome.status === "fulfilled") {
          results.push(...outcome.value);
        }
        // Rejections are impossible (callToolSafe never throws) but a
        // rejected outcome is simply skipped — degradation by design.
      }

      return results.slice(0, MAX_TOTAL_OBSERVATIONS);
    } catch (err) {
      console.warn(`[${this.providerId}] getObservations error:`, err);
      return [];
    } finally {
      await this.safeClose(client, transport);
    }
  }

  /** Resets the cached tool list so the next call re-discovers tools. */
  resetToolCache(): void {
    this.discoveredTools = null;
  }

  // -----------------------------------------------------------------------
  // Connection / discovery / invocation
  // -----------------------------------------------------------------------

  private async connect(): Promise<{
    client: Client | null;
    transport: StreamableHTTPClientTransport | null;
  }> {
    let transport: StreamableHTTPClientTransport | null = null;
    let client: Client | null = null;
    try {
      // Documented transport: HTTP (Streamable HTTP), no credentials.
      transport = new StreamableHTTPClientTransport(new URL(this.endpoint));
      client = new Client(
        { name: "bitget-signal-client", version: "1.0.0" },
        { capabilities: {} },
      );
      await Promise.race([
        client.connect(transport),
        rejectAfter(this.connectTimeoutMs, "Connection timeout"),
      ]);
      return { client, transport };
    } catch (err) {
      console.warn(`[${this.providerId}] connect failed:`, err);
      await this.safeClose(client, transport);
      return { client: null, transport: null };
    }
  }

  private async discoverTools(client: Client): Promise<DiscoveredTool[]> {
    if (this.discoveredTools) return this.discoveredTools;

    const result = await Promise.race([
      client.listTools(),
      rejectAfter(this.toolCallTimeoutMs, "listTools timeout"),
    ]);

    const rawTools: Array<{ name: string; description?: string }> =
      (result as { tools?: Array<{ name: string; description?: string }> })
        .tools ?? [];

    this.discoveredTools = rawTools
      .filter((t) => typeof t.name === "string" && t.name.length > 0)
      .map((t) => ({ name: t.name, description: t.description }));

    return this.discoveredTools;
  }

  private async callToolSafe(
    client: Client,
    spec: ToolCallSpec,
    ctx: CallContext,
  ): Promise<NormalizedResearchObservation[]> {
    try {
      const raw = await Promise.race([
        client.callTool({ name: spec.tool, arguments: spec.args(ctx) }),
        rejectAfter(this.toolCallTimeoutMs, `callTool(${spec.tool}) timeout`),
      ]);
      return normalizeSignalResult(raw, spec.capability, spec.tool);
    } catch (err) {
      console.warn(
        `[${this.providerId}] tool ${spec.tool} (${spec.capability}) failed:`,
        err,
      );
      return [];
    }
  }

  private async safeClose(
    client: Client | null,
    transport: StreamableHTTPClientTransport | null,
  ): Promise<void> {
    try {
      if (client) await client.close();
    } catch {
      /* swallow */
    }
    try {
      if (transport) await transport.close();
    } catch {
      /* swallow */
    }
  }
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

/** Map a desk asset to the USDT pair the derivatives tools expect. */
export function toUsdtSymbol(asset: string): string {
  const upper = asset.trim().toUpperCase();
  if (!upper) return "BTCUSDT";
  if (upper.endsWith("USDT")) return upper;
  if (upper.startsWith("R")) return `${upper.slice(1)}USDT`;
  return `${upper}USDT`;
}

/** Map a desk asset to a CoinGecko coin id for crypto_market OHLCV. */
export function toCoinId(asset: string): string {
  const upper = asset.trim().toUpperCase();
  const stripped = upper.startsWith("R") ? upper.slice(1) : upper;
  const base = stripped.endsWith("USDT") ? stripped.slice(0, -4) : stripped;
  const known: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    BNB: "binancecoin",
    XRP: "ripple",
    DOGE: "dogecoin",
    ADA: "cardano",
    AVAX: "avalanche-2",
    LINK: "chainlink",
    DOT: "polkadot",
  };
  return known[base] ?? base.toLowerCase();
}

/** Extract the JSON payload from an MCP tool-call result envelope. */
export function extractSignalPayload(raw: unknown): unknown {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object") return raw;

  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.content)) {
    const textBlock = obj.content.find(
      (c: unknown) =>
        typeof c === "object" &&
        c !== null &&
        (c as Record<string, unknown>).type === "text",
    ) as Record<string, unknown> | undefined;
    if (textBlock?.text && typeof textBlock.text === "string") {
      try {
        return JSON.parse(textBlock.text);
      } catch {
        return textBlock.text;
      }
    }
  }

  return obj;
}

/**
 * Best-effort numeric fact extraction for observations that carry a
 * comparable value (sentiment index, ratios, prices, rates).
 */
export function extractSignalValue(payload: unknown): { value: number; unit: string } | null {
  if (typeof payload !== "object" || payload === null) return null;
  const obj = payload as Record<string, unknown>;

  const candidates: Array<[string, string]> = [
    ["value", "index"],
    ["fear_greed_index", "index"],
    ["long_short_ratio", "ratio"],
    ["longShortRatio", "ratio"],
    ["taker_ratio", "ratio"],
    ["price", "USD"],
    ["federal_funds_rate", "percent"],
    ["fed_funds", "percent"],
    ["btc_dominance", "percent"],
    ["market_cap_change_24h", "percent"],
  ];

  for (const [key, unit] of candidates) {
    const v = obj[key];
    if (typeof v === "number" && Number.isFinite(v)) return { value: v, unit };
  }
  return null;
}

/**
 * Normalize one MCP tool result into capability-tagged observations.
 * Every observation carries:
 *   providerId = "bitget-signal"
 *   source     = "bitget-signal/<capability>/<tool>"
 * so provenance can show which Signal capability produced each fact.
 */
export function normalizeSignalResult(
  raw: unknown,
  capability: SignalCapability,
  toolName: string,
): NormalizedResearchObservation[] {
  const payload = extractSignalPayload(raw);
  if (payload === null) return [];
  // Live servers embed upstream outages as error-shaped payloads; they are
  // not facts. Skip them so the Desk only sees real observations.
  if (isEmptyUpstreamPayload(payload)) return [];

  const now = new Date().toISOString();
  const source = `bitget-signal/${capability}/${toolName}`;

  const make = (
    title: string,
    summary: string,
    url?: string,
    timestamp?: string,
    value?: { value: number; unit: string },
  ): NormalizedResearchObservation => ({
    id: `sig-${capability}-${toolName}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    providerId: "bitget-signal",
    source,
    title,
    summary: summary.substring(0, MAX_SUMMARY_LENGTH),
    observedTimestamp: timestamp ?? now,
    providerStatus: "AVAILABLE",
    url,
    ...(value ?? {}),
  });

  const summarize = (p: unknown): string => {
    if (typeof p === "string") return p;
    try {
      return JSON.stringify(p);
    } catch {
      return String(p);
    }
  };

  // News-shaped arrays (news_feed / tradfi_news / social_trending).
  if (Array.isArray(payload)) {
    const items = payload.slice(0, MAX_ITEMS_PER_CALL);
    const normalized: NormalizedResearchObservation[] = [];
    for (const item of items) {
      const n = NewsItemSchema.safeParse(item);
      if (n.success) {
        normalized.push(
          make(
            n.data.title,
            n.data.summary ?? n.data.source ?? "",
            n.data.url,
            n.data.published_at ?? n.data.publishedAt ?? n.data.date,
          ),
        );
      } else {
        normalized.push(make(`${toolName}: ${capability}`, summarize(item)));
      }
    }
    return normalized;
  }

  // Numeric/index payloads.
  const numeric = extractSignalValue(payload);

  switch (toolName) {
    case "rates_yields": {
      const parsed = RatesSnapshotSchema.safeParse(payload);
      if (parsed.success) {
        const r = parsed.data;
        const ff = r.federal_funds_rate ?? r.fed_funds;
        return [
          make(
            "Macro: rates snapshot",
            `Fed funds ${ff ?? "N/A"} | 10Y ${r.ten_year ?? "N/A"} | 2Y ${
              r.two_year ?? "N/A"
            } | 10Y-2Y ${r.spread_10y2y ?? "N/A"}`,
            undefined,
            undefined,
            typeof ff === "number" ? { value: ff, unit: "percent" } : undefined,
          ),
        ];
      }
      break;
    }
    case "macro_indicators": {
      const parsed = MacroIndicatorsSchema.safeParse(payload);
      if (parsed.success) {
        return [
          make(
            "Macro: economic indicators",
            summarize(payload),
            undefined,
            parsed.data.as_of,
          ),
        ];
      }
      break;
    }
    case "global_assets": {
      const parsed = GlobalAssetPriceSchema.safeParse(payload);
      if (parsed.success) {
        const g = parsed.data;
        if (typeof g.price === "number") {
          return [
            make(
              `Macro: ${g.name ?? g.symbol ?? "global asset"}`,
              `${g.symbol ?? ""} price ${g.price}`.trim(),
              undefined,
              g.timestamp,
              { value: g.price, unit: "USD" },
            ),
          ];
        }
      }
      break;
    }
    case "crypto_market": {
      if (capability === "technical-analysis") {
        const parsed = OhlcvSchema.safeParse(payload);
        if (parsed.success) {
          const candles = (parsed.data.ohlcv ?? []).slice(-MAX_ITEMS_PER_CALL);
          return [
            make(
              "Technical: recent OHLCV (raw context)",
              // Deliberately NOT indicator math — that stays in the
              // AI-host technical-analysis Skill (pandas/numpy).
              `Raw daily OHLCV context, last ${candles.length} candles: ${summarize(
                candles,
              )}`,
            ),
          ];
        }
      }
      const global = CryptoGlobalSchema.safeParse(payload);
      if (global.success) {
        const g = global.data;
        return [
          make(
            "Market intel: global crypto market",
            `MCap ${g.total_market_cap_usd ?? "N/A"} (24h ${
              g.market_cap_change_24h ?? "N/A"
            }%) | BTC dom ${g.btc_dominance ?? "N/A"}% | Vol ${
              g.total_volume_usd ?? "N/A"
            }`,
            undefined,
            undefined,
            typeof g.market_cap_change_24h === "number"
              ? { value: g.market_cap_change_24h, unit: "percent" }
              : undefined,
          ),
        ];
      }
      break;
    }
    case "sentiment_index": {
      const parsed = SentimentIndexSchema.safeParse(payload);
      if (parsed.success) {
        const s = parsed.data;
        return [
          make(
            "Sentiment: market mood index",
            `${s.classification ?? s.label ?? "Index"}: ${s.value ?? "N/A"}`,
            undefined,
            s.timestamp,
            typeof s.value === "number" ? { value: s.value, unit: "index" } : undefined,
          ),
        ];
      }
      break;
    }
    case "derivatives_sentiment": {
      const parsed = DerivativesSentimentSchema.safeParse(payload);
      if (parsed.success) {
        const d = parsed.data;
        const ratio = d.long_short_ratio ?? d.longShortRatio ?? d.taker_ratio;
        return [
          make(
            "Sentiment: derivatives positioning",
            `${d.symbol ?? ""} ${d.period ?? ""} ratio ${ratio ?? "N/A"}`.trim(),
            undefined,
            undefined,
            typeof ratio === "number" ? { value: ratio, unit: "ratio" } : undefined,
          ),
        ];
      }
      break;
    }
    case "news_feed":
    case "tradfi_news": {
      // Non-array news payload: treat as a single item if it parses.
      const n = NewsItemSchema.safeParse(payload);
      if (n.success) {
        return [
          make(n.data.title, n.data.summary ?? "", n.data.url, n.data.published_at),
        ];
      }
      break;
    }
    default:
      break;
  }

  // Generic fallback — the payload is still recorded, bounded, and
  // capability-tagged, but flagged in the title so consumers can tell it
  // came through the generic path.
  return [make(`${toolName}: ${capability}`, summarize(payload))];
}

/**
 * Detect upstream-failure payloads the public server returns INSTEAD of
 * data when its own upstream providers time out (live-verified shapes:
 * `{"error": ""}`, `{"alt_me_error": ""}`,
 * `{"fed_funds_target_upper": {"error": ""}, ...}`,
 * `"Error executing tool crypto_market: ConnectTimeout('')"`, and feed
 * envelopes whose every `items` array is empty).
 *
 * These must be SKIPPED, never normalized into junk observations — an
 * upstream outage is not a research fact.
 */
export function isEmptyUpstreamPayload(payload: unknown): boolean {
  if (typeof payload === "string") {
    return payload.trim().startsWith("Error executing tool");
  }
  if (Array.isArray(payload)) {
    if (payload.length === 0) return true;
    // Feed envelopes: [{feed, error, items: [...]}] — empty when no feed
    // carries any item.
    const withItems = payload.filter(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        Array.isArray((item as Record<string, unknown>).items),
    );
    if (withItems.length > 0) {
      return withItems.every(
        (item) =>
          ((item as Record<string, unknown>).items as unknown[]).length === 0,
      );
    }
    return false;
  }
  if (typeof payload === "object" && payload !== null) {
    const obj = payload as Record<string, unknown>;
    const entries = Object.entries(obj);
    if (entries.length === 0) return false;
    const isErrorKey = (k: string) => k === "error" || k === "alt_me_error";
    // Shape 1: every value is an error-string (e.g. {"alt_me_error": ""}).
    if (entries.every(([k, v]) => isErrorKey(k) && typeof v === "string")) {
      return true;
    }
    // Shape 2: every value is an error-string or a nested error object
    // (e.g. {"t10y": {"error": ""}, "sofr": {"error": ""}}).
    if (
      entries.every(([k, v]) => {
        if (isErrorKey(k)) return typeof v === "string";
        if (typeof v === "object" && v !== null) {
          const sub = Object.entries(v as Record<string, unknown>);
          return (
            sub.length > 0 &&
            sub.every(([sk, sv]) => isErrorKey(sk) && typeof sv === "string")
          );
        }
        return false;
      })
    ) {
      return true;
    }
    // Shape 3 (live-verified 2026-09-20): failure markers alongside plain
    // string metadata and empty item lists — e.g.
    // {"platform":"github","provider":"all_failed","items":[]} and
    // {"url":"https://mempool.space/...","error":""}. An upstream outage
    // is not a fact even when the envelope carries identifiers.
    const hasFailureMarker =
      entries.some(([k, v]) => isErrorKey(k) && typeof v === "string") ||
      obj.provider === "all_failed" ||
      (Array.isArray(obj.items) && obj.items.length === 0);
    if (
      hasFailureMarker &&
      entries.every(
        ([k, v]) =>
          (isErrorKey(k) && typeof v === "string") ||
          typeof v === "string" ||
          (Array.isArray(v) && v.length === 0),
      )
    ) {
      return true;
    }
    return false;
  }
  return false;
}

/** Promise that rejects after `ms` milliseconds. */
function rejectAfter(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
}
