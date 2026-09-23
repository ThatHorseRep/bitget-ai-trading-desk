import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";
import type {
  NormalizedResearchObservation,
  ResearchProvider,
  ResearchProviderStatus,
} from "./types.js";

// ===========================================================================
// Zod schemas for the six documented bitget-mcp-server tool categories
// (inlined to avoid Turbopack module-resolution issues on Windows)
// ===========================================================================

// 1. Quotes & History
const QuoteResponseSchema = z
  .object({
    symbol: z.string(),
    price: z.number().optional(),
    open: z.number().optional(),
    high: z.number().optional(),
    low: z.number().optional(),
    close: z.number().optional(),
    volume: z.number().optional(),
    timestamp: z.string().optional(),
    // Live catalog (equity_price_quote) field names observed 2026-09-21:
    last_price: z.number().optional(),
    bid: z.number().optional(),
    ask: z.number().optional(),
    prev_close: z.number().optional(),
    change_percent: z.number().optional(),
    last_timestamp: z.string().optional(),
    // Historical OHLCV rows (equity_price_historical, observed 2026-09-21)
    // carry a bar `date` and OHLC fields instead of last_price/bid/ask.
    date: z.string().optional(),
  })
  .passthrough();

// 2. Fundamentals
const CompanyProfileSchema = z
  .object({
    symbol: z.string(),
    companyName: z.string().optional(),
    sector: z.string().optional(),
    industry: z.string().optional(),
    marketCap: z.number().optional(),
    description: z.string().optional(),
    // Live catalog (equity_profile) field names observed 2026-09-21:
    name: z.string().optional(),
    employees: z.number().optional(),
    industry_name: z.string().optional(),
    listed_board_name: z.string().optional(),
    time: z.number().optional(),
  })
  .passthrough();

const FinancialStatementSchema = z
  .object({
    symbol: z.string(),
    period: z.string().optional(),
    revenue: z.number().optional(),
    netIncome: z.number().optional(),
    eps: z.number().optional(),
  })
  .passthrough();

const EarningsCalendarSchema = z
  .object({
    symbol: z.string(),
    date: z.string().optional(),
    epsEstimate: z.number().optional(),
    epsActual: z.number().optional(),
    // Live catalog (equity_calendar_earnings) field names observed 2026-09-21:
    report_date: z.string().optional(),
    eps_consensus: z.number().optional(),
  })
  .passthrough();

// Live catalog guide listing (guide({ category: "equity" }) shape, observed
// 2026-09-21): each entry describes one queryable dataset.
const GuideParamSummarySchema = z
  .object({
    name: z.string(),
    required: z.boolean().optional(),
  })
  .passthrough();

const GuideEntrySchema = z
  .object({
    id: z.string(),
    url_path: z.string().optional(),
    title: z.string(),
    summary: z.string().optional(),
    params_summary: z.array(GuideParamSummarySchema).default([]),
  })
  .passthrough();

const GuideResponseSchema = z
  .object({
    entries: z.array(GuideEntrySchema),
  })
  .passthrough();

// 3. Institutional & Analyst
const AnalystEstimateSchema = z
  .object({
    symbol: z.string(),
    targetPrice: z.number().optional(),
    consensusRating: z.string().optional(),
    forwardPE: z.number().optional(),
    forwardEPS: z.number().optional(),
  })
  .passthrough();

// 4. News & Sentiment
const NewsItemSchema = z
  .object({
    title: z.string(),
    summary: z.string().optional(),
    url: z.string().optional(),
    publishedAt: z.string().optional(),
    sentiment: z.string().optional(),
  })
  .passthrough();

// ===========================================================================
// Types
// ===========================================================================

const TOOL_CATEGORIES = [
  "quotes",
  "fundamentals",
  "corporate_actions",
  "institutional_analyst",
  "etf",
  "news_sentiment",
] as const;

type ToolCategory = (typeof TOOL_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONNECT_TIMEOUT_MS = 5_000;
const TOOL_CALL_TIMEOUT_MS = 8_000;
const MAX_OBSERVATIONS_PER_CATEGORY = 20;
const MAX_SUMMARY_LENGTH = 500;
/**
 * Catalog-protocol bounds (live `guide` + `do_query` interface, observed
 * 2026-09-21). Each do_query is a network round trip, so the per-run call
 * cap keeps worst-case latency inside the workflow budget; entries are
 * ranked so the most decision-relevant (quote, profile, earnings) go first.
 */
const MAX_DO_QUERY_CALLS = 5;
// Serverless functions have a hard wall-clock kill (Vercel maxDuration).
// Research must leave room for the three sequential LLM stages, so the
// catalog walk is capped tighter there; result: fewer observations, never
// a killed workflow.
const MAX_DO_QUERY_CALLS_SERVERLESS = 2;
const MAX_OBSERVATIONS_TOTAL = 24;

/**
 * PRE24-02 — asset gating.
 *
 * The documented bitget-mcp-server is a US stock / ETF read-only data
 * service. It is only asked about supported reference assets: our rToken
 * trade symbols (e.g. rNVDA / rNVDAUSDT) are mapped to their US reference
 * ticker (NVDA). Anything else (pure crypto pairs like BTC) is NOT a US
 * equity question and must never reach this service.
 */
export function toReferenceSymbol(asset: string): string | null {
  const upper = asset.trim().toUpperCase();
  // Must be an rToken (rNVDA / rNVDAUSDT) — mirrors the market layer's
  // supported-asset rule. Plain crypto tickers (BTC, BTCUSDT, SOL) are not
  // US-equity questions and never reach this service.
  if (!upper.startsWith("R")) return null;
  let symbol = upper.slice(1);
  if (symbol.endsWith("USDT")) symbol = symbol.slice(0, -4);
  // A US listing ticker is 1–5 capital letters (NVDA, TSLA, AAPL, GOOG...).
  return /^[A-Z]{1,5}$/.test(symbol) ? symbol : null;
}

/**
 * Heuristic keyword map: when a discovered MCP tool name contains one of
 * these substrings we file it under that category.  This avoids guessing
 * exact tool names while still enabling automatic dispatch once the
 * endpoint becomes reachable and `listTools()` succeeds.
 */
const CATEGORY_KEYWORDS: Record<ToolCategory, string[]> = {
  quotes: ["quote", "price", "kline", "candle", "ohlc", "history", "ticker"],
  fundamentals: [
    "profile", "company", "financial", "balance", "income",
    "cash_flow", "cashflow", "ratio", "valuation", "earnings",
  ],
  corporate_actions: ["dividend", "insider", "shareholder", "split", "corporate"],
  institutional_analyst: [
    "13f", "holding", "analyst", "target", "estimate",
    "consensus", "forward", "institutional",
  ],
  etf: ["etf"],
  news_sentiment: ["news", "sentiment", "headline"],
};

// ---------------------------------------------------------------------------
// Discovered-tool metadata cached after the first successful listTools()
// ---------------------------------------------------------------------------

interface DiscoveredTool {
  name: string;
  description?: string;
  category: ToolCategory | "unknown";
}

/**
 * One entry of the live guide catalog (e.g. `equity_price_quote`).
 * `requiredParams` gates dispatch: only entries whose required parameters
 * are satisfiable with the reference symbol alone are ever called.
 */
interface DiscoveredEntry {
  id: string;
  urlPath?: string;
  title: string;
  summary?: string;
  category: ToolCategory | "unknown";
  requiredParams: string[];
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class BitgetUsEquityMcpProvider implements ResearchProvider {
  readonly providerId = "bitget-us-equity-mcp";

  private endpoint: string;
  private discoveredTools: DiscoveredTool[] | null = null;
  /** True when the live server exposes the `guide` + `do_query` catalog. */
  private usesCatalogProtocol = false;
  private catalogEntries: DiscoveredEntry[] | null = null;

  constructor(endpoint?: string) {
    this.endpoint =
      endpoint ??
      process.env.BITGET_US_EQUITY_MCP_ENDPOINT ??
      "https://agent.bitget.com/mcp";
  }

  // -----------------------------------------------------------------------
  // ResearchProvider interface
  // -----------------------------------------------------------------------

  async getStatus(): Promise<ResearchProviderStatus> {
    const { client, transport } = await this.connect();
    if (!client) return "UNAVAILABLE";
    try {
      await this.discoverTools(client);
      return "AVAILABLE";
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
    // Gate: only US reference equities are decision-relevant for this
    // service. Unsupported assets degrade to zero observations rather than
    // issuing malformed requests against a US-equity-only tool catalog.
    const referenceSymbol = toReferenceSymbol(asset);
    if (!referenceSymbol) return [];

    const { client, transport } = await this.connect();
    if (!client) return [];

    try {
      const tools = await this.discoverTools(client);
      if (tools.length === 0) return [];

      // Live servers may expose the `guide` + `do_query` catalog interface
      // (observed 2026-09-21 on agent.bitget.com/mcp) instead of named
      // per-category tools. When present, it takes precedence.
      // NOTE: `return await` is REQUIRED here — a bare `return <promise>`
      // would run this function's `finally` (which closes the client)
      // immediately, while the catalog calls are still in flight.
      if (this.usesCatalogProtocol) {
        return await this.getObservationsViaCatalog(client, referenceSymbol, topic);
      }

      const categories = this.categoriesForTopic(topic);
      const results: NormalizedResearchObservation[] = [];

      for (const cat of categories) {
        const catTools = tools.filter((t) => t.category === cat);
        for (const tool of catTools) {
          const obs = await this.callToolSafe(client, tool, referenceSymbol, cat);
          results.push(...obs);
          if (results.length >= MAX_OBSERVATIONS_PER_CATEGORY * categories.length) break;
        }
      }

      return results;
    } catch (err) {
      console.warn(`[${this.providerId}] getObservations error:`, err);
      return [];
    } finally {
      await this.safeClose(client, transport);
    }
  }

  // -----------------------------------------------------------------------
  // Connection helper
  // -----------------------------------------------------------------------

  private async connect(): Promise<{
    client: Client | null;
    transport: StreamableHTTPClientTransport | null;
  }> {
    let transport: StreamableHTTPClientTransport | null = null;
    let client: Client | null = null;
    try {
      // Documented transport (S2 handbook, "How to connect"): HTTP via
      // https://agent.bitget.com/mcp — Streamable HTTP, not SSE, and no
      // credentials are required for this read-only data service.
      transport = new StreamableHTTPClientTransport(new URL(this.endpoint));
      client = new Client(
        { name: "bitget-us-equity-client", version: "1.0.0" },
        { capabilities: {} },
      );
      await Promise.race([
        client.connect(transport),
        rejectAfter(CONNECT_TIMEOUT_MS, "Connection timeout"),
      ]);
      return { client, transport };
    } catch (err) {
      console.warn(`[${this.providerId}] connect failed:`, err);
      await this.safeClose(client, transport);
      return { client: null, transport: null };
    }
  }

  // -----------------------------------------------------------------------
  // Tool discovery (cached)
  // -----------------------------------------------------------------------

  private async discoverTools(client: Client): Promise<DiscoveredTool[]> {
    if (this.discoveredTools) return this.discoveredTools;

    const result = await Promise.race([
      client.listTools(),
      rejectAfter(TOOL_CALL_TIMEOUT_MS, "listTools timeout"),
    ]);

    const rawTools: Array<{ name: string; description?: string }> =
      (result as { tools?: Array<{ name: string; description?: string }> })
        .tools ?? [];

    this.discoveredTools = rawTools.map((t) => ({
      name: t.name,
      description: t.description,
      category: classifyTool(t.name, t.description),
    }));

    // Catalog-protocol detection: the live server (observed 2026-09-21)
    // exposes `guide` + `do_query` instead of named per-category tools.
    const names = new Set(this.discoveredTools.map((t) => t.name));
    this.usesCatalogProtocol = names.has("guide") && names.has("do_query");

    return this.discoveredTools;
  }

  // -----------------------------------------------------------------------
  // Catalog protocol (live `guide` + `do_query` interface)
  // -----------------------------------------------------------------------

  /**
   * Fetch the queryable catalog via `guide`. Only the equity / ETF / news
   * domains are requested: this provider is asset-gated to US reference
   * tickers, so crypto and crypto-sentiment entries can never apply.
   * A failed domain listing is skipped — never fatal.
   */
  private async discoverCatalog(client: Client): Promise<DiscoveredEntry[]> {
    if (this.catalogEntries) return this.catalogEntries;
    if (!this.usesCatalogProtocol) return [];

    const domains = ["equity", "etf", "news"];
    const entries: DiscoveredEntry[] = [];

    for (const domain of domains) {
      let res: unknown;
      try {
        res = await Promise.race([
          client.callTool({ name: "guide", arguments: { category: domain } }),
          rejectAfter(TOOL_CALL_TIMEOUT_MS, `guide(${domain}) timeout`),
        ]);
      } catch (err) {
        console.warn(`[${this.providerId}] guide(${domain}) failed:`, err);
        continue;
      }
      const parsed = GuideResponseSchema.safeParse(extractPayload(res));
      if (!parsed.success) {
        console.warn(`[${this.providerId}] guide(${domain}) payload failed validation`);
        continue;
      }
      for (const entry of parsed.data.entries) {
        entries.push({
          id: entry.id,
          urlPath: entry.url_path,
          title: entry.title,
          summary: entry.summary,
          category: classifyTool(`${entry.url_path ?? ""} ${entry.title} ${entry.summary ?? ""}`),
          requiredParams: entry.params_summary.filter((p) => p.required).map((p) => p.name),
        });
      }
    }

    this.catalogEntries = entries;
    return entries;
  }

  /**
   * Rank catalog entries for one decision run. Entries whose required
   * params are not satisfiable with the reference symbol alone are never
   * called (-1). Quote / profile / earnings lead — the cheapest, most
   * decision-relevant reads for a pre-trade stress test.
   */
  private rankCatalogEntries(entries: DiscoveredEntry[], topic?: string): DiscoveredEntry[] {
    const t = (topic ?? "").toLowerCase();
    const relevantCategories: Array<ToolCategory | "unknown"> = t
      ? this.categoriesForTopic(t)
      : [];
    const score = (e: DiscoveredEntry): number => {
      if (e.requiredParams.some((p) => p !== "symbol")) return -1;
      const id = e.id.toLowerCase();
      if (id.includes("quote")) return 100;
      if (id.includes("profile")) return 90;
      if (id.includes("earnings")) return 80;
      if (relevantCategories.includes(e.category)) return 60;
      if (e.category === "quotes" || e.category === "fundamentals") return 40;
      return 20;
    };
    return entries
      .map((e) => ({ e, s: score(e) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.e);
  }

  /**
   * Query the catalog: bounded do_query calls in ranked order, each
   * validated and normalized exactly like a named-tool response.
   */
  private async getObservationsViaCatalog(
    client: Client,
    referenceSymbol: string,
    topic?: string,
  ): Promise<NormalizedResearchObservation[]> {
    const entries = await this.discoverCatalog(client);
    if (entries.length === 0) return [];

    const callCap = process.env.VERCEL ? MAX_DO_QUERY_CALLS_SERVERLESS : MAX_DO_QUERY_CALLS;
    const ranked = this.rankCatalogEntries(entries, topic).slice(0, callCap);
    const results: NormalizedResearchObservation[] = [];

    for (const entry of ranked) {
      try {
        const raw = await Promise.race([
          client.callTool({
            name: "do_query",
            arguments: { entry_id: entry.id, params: { symbol: referenceSymbol } },
          }),
          rejectAfter(TOOL_CALL_TIMEOUT_MS, `do_query(${entry.id}) timeout`),
        ]);
        const payload = extractPayload(raw);
        if (payload === null) continue;
        const unwrapped = unwrapDoQueryResults(payload, entry.category);
        if (unwrapped === null) continue; // server-side error envelope — never an observation
        results.push(
          ...this.normalisePayload(
            unwrapped,
            { name: entry.id, description: entry.summary, category: entry.category },
            referenceSymbol,
            entry.category,
            entry.id,
          ),
        );
        if (results.length >= MAX_OBSERVATIONS_TOTAL) break;
      } catch (err) {
        console.warn(`[${this.providerId}] do_query(${entry.id}) failed:`, err);
      }
    }

    return results;
  }

  // -----------------------------------------------------------------------
  // Invoke a single tool and normalise the response
  // -----------------------------------------------------------------------

  private async callToolSafe(
    client: Client,
    tool: DiscoveredTool,
    asset: string,
    category: ToolCategory,
  ): Promise<NormalizedResearchObservation[]> {
    try {
      const raw = await Promise.race([
        client.callTool({ name: tool.name, arguments: { symbol: asset } }),
        rejectAfter(TOOL_CALL_TIMEOUT_MS, `callTool(${tool.name}) timeout`),
      ]);

      return this.normalise(raw, tool, asset, category);
    } catch (err) {
      console.warn(`[${this.providerId}] tool ${tool.name} failed:`, err);
      return [];
    }
  }

  // -----------------------------------------------------------------------
  // Response normalisation & Zod validation
  // -----------------------------------------------------------------------

  private normalise(
    raw: unknown,
    tool: DiscoveredTool,
    asset: string,
    category: ToolCategory,
  ): NormalizedResearchObservation[] {
    const payload = extractPayload(raw);
    if (payload === null) return [];
    return this.normalisePayload(payload, tool, asset, category);
  }

  private normalisePayload(
    payload: unknown,
    tool: DiscoveredTool,
    asset: string,
    category: ToolCategory | "unknown",
    entryId?: string,
  ): NormalizedResearchObservation[] {
    const now = new Date().toISOString();

    switch (category) {
      case "quotes": {
        // A quotes payload is either a single live-quote row or a historical
        // OHLCV series (multi-row, oldest first). Presenting a historical
        // bar as "Quote: <asset>" stamped "now" manufactured a false
        // evidence conflict (observed 2026-09-21: live quote 722.05 vs the
        // OLDEST bar 706.32 of equity_price_historical, both titled
        // "Quote: QQQ" — the arbitrator correctly refused to reconcile).
        // Historical rows carry `date`+`close` and never `last_price`.
        const rows: unknown[] = Array.isArray(payload) ? payload : [payload];
        const parsedRows = rows.flatMap((r) => {
          const p = QuoteResponseSchema.safeParse(r);
          return p.success ? [p.data] : [];
        });

        const historical = parsedRows.filter(
          (r) =>
            typeof r.date === "string" &&
            typeof r.close === "number" &&
            r.last_price === undefined,
        );
        if (historical.length > 0 && historical.length === parsedRows.length) {
          // Pick the LATEST bar by its real date — never assume series order.
          const latest = historical.reduce((a, b) =>
            Date.parse(b.date as string) > Date.parse(a.date as string) ? b : a,
          );
          const barMs = Date.parse(latest.date as string);
          const observedAt = Number.isNaN(barMs) ? now : new Date(barMs).toISOString();
          const barDay = observedAt.slice(0, 10);
          return [
            makeObs(
              tool.name, asset, `Price history (as of ${barDay}): ${asset}`,
              `Historical close ${latest.close} on ${barDay} (bar date, not a live quote) | Vol ${latest.volume ?? "N/A"}`,
              observedAt, undefined, latest.close, "USD",
            ),
          ];
        }

        const q = parsedRows[0];
        if (!q) return this.genericObs(tool, asset, payload, now);
        const price = q.last_price ?? q.price ?? q.close;
        const observedAt =
          typeof q.last_timestamp === "string" && !Number.isNaN(Date.parse(q.last_timestamp))
            ? q.last_timestamp
            : now;
        return [
         makeObs(
           tool.name, asset, `Quote: ${asset}`,
           `Price ${price ?? "N/A"} | Bid ${q.bid ?? "N/A"} / Ask ${q.ask ?? "N/A"} | Vol ${q.volume ?? "N/A"}`,
            observedAt, undefined, price, "USD",
         ),
        ];
      }
      case "fundamentals": {
        // Entry-id hints take precedence when the catalog protocol provides
        // one — payload shapes alone cannot disambiguate statements from
        // profiles because every live row carries `symbol`.
        const hint = (entryId ?? tool.name).toLowerCase();
        if (hint.includes("earnings")) {
          const earn = EarningsCalendarSchema.safeParse(payload);
          if (earn.success) {
            const e = earn.data;
            const est = e.eps_consensus ?? e.epsEstimate;
            return [
              makeObs(
                tool.name, asset, `Earnings: ${asset}`,
                `Next report ${e.report_date ?? e.date ?? "N/A"} | EPS est ${est ?? "N/A"}`, now,
              ),
            ];
          }
          return this.genericObs(tool, asset, payload, now);
        }
        if (hint.includes("balance") || hint.includes("income") || hint.includes("cash") || hint.includes("ratio") || hint.includes("valuation")) {
          // Statement/ratio datasets: keep the raw bounded payload as the
          // observation rather than guessing field names we have not
          // verified — honesty over fabricated labels.
          return this.genericObs(tool, asset, payload, now);
        }
        const profile = CompanyProfileSchema.safeParse(payload);
        if (profile.success) {
          const p = profile.data;
          return [
            makeObs(
              tool.name, asset, `Company: ${p.companyName ?? p.name ?? asset}`,
              `Industry ${p.industry_name ?? p.sector ?? "N/A"} | Employees ${p.employees ?? "N/A"} | Board ${p.listed_board_name ?? "N/A"}`, now,
            ),
          ];
        }
        const fin = FinancialStatementSchema.safeParse(payload);
        if (fin.success) {
          const f = fin.data;
          return [
            makeObs(
              tool.name, asset, `Financials: ${asset} ${f.period ?? ""}`,
              `Rev ${f.revenue ?? "N/A"} | EPS ${f.eps ?? "N/A"}`, now,
            ),
          ];
        }
        const earn2 = EarningsCalendarSchema.safeParse(payload);
        if (earn2.success) {
          const e = earn2.data;
          const est = e.eps_consensus ?? e.epsEstimate;
          return [
            makeObs(
              tool.name, asset, `Earnings: ${asset}`,
              `Next report ${e.report_date ?? e.date ?? "N/A"} | EPS est ${est ?? "N/A"}`, now,
            ),
          ];
        }
        return this.genericObs(tool, asset, payload, now);
      }
      case "institutional_analyst": {
        const est = AnalystEstimateSchema.safeParse(payload);
        if (est.success) {
          const a = est.data;
          return [
            makeObs(
              tool.name, asset, `Analyst: ${asset}`,
              `Target ${a.targetPrice ?? "N/A"} | Rating ${a.consensusRating ?? "N/A"}`,
              now, undefined, a.targetPrice, "USD",
            ),
          ];
        }
        return this.genericObs(tool, asset, payload, now);
      }
      case "news_sentiment": {
        if (Array.isArray(payload)) {
          return payload
            .slice(0, MAX_OBSERVATIONS_PER_CATEGORY)
            .map((item: unknown) => {
              const n = NewsItemSchema.safeParse(item);
              if (!n.success) return null;
              return makeObs(
                tool.name, asset, n.data.title,
                (n.data.summary ?? "").substring(0, MAX_SUMMARY_LENGTH),
                n.data.publishedAt ?? now, n.data.url,
              );
            })
            .filter(Boolean) as NormalizedResearchObservation[];
        }
        const single = NewsItemSchema.safeParse(payload);
        if (single.success) {
          return [
            makeObs(
              tool.name, asset, single.data.title,
              (single.data.summary ?? "").substring(0, MAX_SUMMARY_LENGTH),
              single.data.publishedAt ?? now, single.data.url,
            ),
          ];
        }
        return this.genericObs(tool, asset, payload, now);
      }
      default:
        return this.genericObs(tool, asset, payload, now);
    }
  }

  /** Last-resort normaliser: stringify whatever the server returned. */
  private genericObs(
    tool: DiscoveredTool, asset: string,
    payload: unknown, timestamp: string,
  ): NormalizedResearchObservation[] {
    const summary = JSON.stringify(payload).substring(0, MAX_SUMMARY_LENGTH);
    return [makeObs(tool.name, asset, `${tool.name}: ${asset}`, summary, timestamp)];
  }
  // -----------------------------------------------------------------------
  // Topic -> category routing
  // -----------------------------------------------------------------------

  private categoriesForTopic(topic?: string): ToolCategory[] {
    if (!topic) return ["quotes", "fundamentals", "news_sentiment"];
    const t = topic.toLowerCase();
    const matched: ToolCategory[] = [];

    if (/price|quote|chart|kline|candle/.test(t)) matched.push("quotes");
    if (/fundamental|earning|revenue|eps|financ|balance|income|ratio/.test(t))
      matched.push("fundamentals");
    if (/dividend|insider|split|corporate/.test(t))
      matched.push("corporate_actions");
    if (/analyst|target|estimate|institutional|13f|holding|consensus/.test(t))
      matched.push("institutional_analyst");
    if (/etf/.test(t)) matched.push("etf");
    if (/news|sentiment|headline/.test(t)) matched.push("news_sentiment");

    return matched.length > 0 ? matched : ["quotes", "fundamentals", "news_sentiment"];
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  private async safeClose(
    client: Client | null, transport: StreamableHTTPClientTransport | null,
  ): Promise<void> {
    try { if (client) await client.close(); } catch { /* swallow */ }
    try { if (transport) await transport.close(); } catch { /* swallow */ }
  }

  /** Resets the cached tool list so the next call re-discovers tools. */
  resetToolCache(): void {
    this.discoveredTools = null;
    this.catalogEntries = null;
  }
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

/** Classify a tool name + description into one of the documented categories. */
export function classifyTool(
  name: string, description?: string,
): ToolCategory | "unknown" {
  const haystack = `${name} ${description ?? ""}`.toLowerCase();
  // Check categories in specificity order to avoid substring collisions.
  // E.g., "dividend_history" contains "history" (quotes) but should match
  // "dividend" (corporate_actions) first.
  // Check order matters: more specific keywords must be tested before
  // generic ones that could overlap via substring matching.
  // e.g. "etf_holdings" contains "holding" (institutional) but "etf" is
  // more specific, so etf must be checked first.
  const checkOrder: ToolCategory[] = [
    "etf",
    "corporate_actions",
    "institutional_analyst",
    "news_sentiment",
    "fundamentals",
    "quotes",
  ];

  for (const cat of checkOrder) {
    const keywords = CATEGORY_KEYWORDS[cat];
    if (keywords.some((kw) => haystack.includes(kw))) return cat;
  }

  return "unknown";
}

/**
 * Live catalog do_query envelope (observed 2026-09-21):
 * `{ success: boolean, status_code: number, data: { results: [...] }, error: null }`.
 * A `success: false` / non-null `error` payload is a server-side failure —
 * unwrapping returns null so it is skipped, never normalized into an observation.
 */
const DoQueryEnvelopeSchema = z
  .object({
    success: z.boolean(),
    status_code: z.number().optional(),
    data: z
      .object({
        results: z.array(z.unknown()).optional(),
      })
      .passthrough()
      .optional(),
    error: z.unknown().optional(),
  })
  .passthrough();

/**
 * Reduce a do_query response to the dataset payload: unwrap the live
 * envelope (`data.results`, first element when single-record datasets),
 * pass through anything else (named-tool servers, already-naked payloads).
 * Returns null only for an explicit server-side error envelope.
 */
export function unwrapDoQueryResults(
  payload: unknown,
  category: ToolCategory | "unknown",
): unknown {
  const env = DoQueryEnvelopeSchema.safeParse(payload);
  if (env.success) {
    if (!env.data.success || (env.data.error !== null && env.data.error !== undefined)) {
      return null;
    }
    const results = env.data.data?.results;
    if (!Array.isArray(results)) return null;
    if (results.length === 0) return null;
    // Multi-record datasets (news rows, statements, historical OHLCV
    // series) keep the array; true single-record datasets (profile,
    // earnings) use the first row. Quotes keep the array so the normalizer
    // can distinguish a live quote row from a historical bar series -
    // taking results[0] here handed back the OLDEST historical bar as if
    // it were current (the 2026-09-21 false-conflict bug).
    return category === "news_sentiment" || category === "quotes" ? results : results[0];
  }
  return payload;
}

/** Extract the JSON payload from an MCP tool-call result envelope. */
export function extractPayload(raw: unknown): unknown {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object") return raw;

  const obj = raw as Record<string, unknown>;

  // MCP SDK wraps results as { content: [ { type: "text", text: "..." } ] }
  if (Array.isArray(obj.content)) {
    const textBlock = obj.content.find(
      (c: unknown) =>
        typeof c === "object" && c !== null &&
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

/** Build a NormalizedResearchObservation with the provider ID baked in. */
function makeObs(
  toolName: string,
  asset: string,
  title: string,
  summary: string,
  timestamp: string,
  url?: string,
  value?: number,
  unit?: string,
): NormalizedResearchObservation {
  return {
    id: `use-${asset}-${toolName}-${Date.now()}`,
    providerId: "bitget-us-equity-mcp",
    source: `bitget-mcp-server/${toolName}`,
    title,
    summary: summary.substring(0, MAX_SUMMARY_LENGTH),
    observedTimestamp: timestamp,
    providerStatus: "AVAILABLE",
    url,
    value,
    unit,
  };
}

/** Promise that rejects after `ms` milliseconds. */
function rejectAfter(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms),
  );
}
