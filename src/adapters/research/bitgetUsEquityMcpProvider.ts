import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type {
  NormalizedResearchObservation,
  ResearchProvider,
  ResearchProviderStatus,
} from "./types.js";
import {
  QuoteResponseSchema,
  CompanyProfileSchema,
  FinancialStatementSchema,
  EarningsCalendarSchema,
  AnalystEstimateSchema,
  NewsItemSchema,
  type ToolCategory,
} from "./usEquitySchemas.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONNECT_TIMEOUT_MS = 5_000;
const TOOL_CALL_TIMEOUT_MS = 8_000;
const MAX_OBSERVATIONS_PER_CATEGORY = 20;
const MAX_SUMMARY_LENGTH = 500;

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

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class BitgetUsEquityMcpProvider implements ResearchProvider {
  readonly providerId = "bitget-us-equity-mcp";

  private endpoint: string;
  private discoveredTools: DiscoveredTool[] | null = null;

  constructor(endpoint?: string) {
    this.endpoint = endpoint ?? "https://agent.bitget.com/mcp";
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
    const { client, transport } = await this.connect();
    if (!client) return [];

    try {
      const tools = await this.discoverTools(client);
      if (tools.length === 0) return [];

      const categories = this.categoriesForTopic(topic);
      const results: NormalizedResearchObservation[] = [];

      for (const cat of categories) {
        const catTools = tools.filter((t) => t.category === cat);
        for (const tool of catTools) {
          const obs = await this.callToolSafe(client, tool, asset, cat);
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
    transport: SSEClientTransport | null;
  }> {
    let transport: SSEClientTransport | null = null;
    let client: Client | null = null;
    try {
      transport = new SSEClientTransport(new URL(this.endpoint));
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

    return this.discoveredTools;
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

    const now = new Date().toISOString();

    switch (category) {
      case "quotes": {
        const parsed = QuoteResponseSchema.safeParse(payload);
        if (!parsed.success) return this.genericObs(tool, asset, payload, now);
        const q = parsed.data;
        return [
          makeObs(
            tool.name, asset, `Quote: ${asset}`,
            `Price ${q.price ?? "N/A"} | Vol ${q.volume ?? "N/A"}`, now,
          ),
        ];
      }
      case "fundamentals": {
        const profile = CompanyProfileSchema.safeParse(payload);
        if (profile.success) {
          const p = profile.data;
          return [
            makeObs(
              tool.name, asset, `Company: ${p.companyName ?? asset}`,
              `Sector ${p.sector ?? "N/A"} | MCap ${p.marketCap ?? "N/A"}`, now,
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
        const earn = EarningsCalendarSchema.safeParse(payload);
        if (earn.success) {
          const e = earn.data;
          return [
            makeObs(
              tool.name, asset, `Earnings: ${asset}`,
              `Est ${e.epsEstimate ?? "N/A"} | Act ${e.epsActual ?? "N/A"}`, now,
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
              `Target ${a.targetPrice ?? "N/A"} | Rating ${a.consensusRating ?? "N/A"}`, now,
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
    client: Client | null, transport: SSEClientTransport | null,
  ): Promise<void> {
    try { if (client) await client.close(); } catch { /* swallow */ }
    try { if (transport) await transport.close(); } catch { /* swallow */ }
  }

  /** Resets the cached tool list so the next call re-discovers tools. */
  resetToolCache(): void {
    this.discoveredTools = null;
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
  toolName: string, asset: string, title: string,
  summary: string, timestamp: string, url?: string,
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
  };
}

/** Promise that rejects after `ms` milliseconds. */
function rejectAfter(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms),
  );
}
