# Pending Tasks: US Equity MCP Integration

## Bitget Signal (PRE24-03) — implemented, live-proven, upstream-dependent

- **Programmatic path (runtime):** `BitgetSignalProvider` speaks the documented
  Streamable HTTP transport to `https://datahub.noxiaohao.com/mcp` (registered by
  `@bitget-ai/bitget-signal@1.2.0`). Live-verified: `listTools()` returns 19 tools,
  all 14 documented names present. The server's own upstream APIs were failing and
  slow (15–32 s per call) at verification time, so observation yield was 0 under
  production bounds — degradation is by design and the provider stays healthy.
  Re-run `verify-signal-connectivity` (40 s diagnostic window) when upstreams may
  have recovered to capture real samples.
- **Agent-host path (Skills):** the five official Skills (`macro-analyst`,
  `market-intel`, `news-briefing`, `sentiment-analyst`, `technical-analysis`) run
  in AI hosts via the package installer; the file bridge (`signalBridgePath` in
  the composition root) ingests their observations. Proven end-to-end in the
  PRE24-03 audit.
- **Not claimed:** the web app does not run the Skills themselves; indicator math
  for `technical-analysis` stays in the AI-host Skill (pandas/numpy).

## Completed (PRE24-02, verified 2026-09-20)

The provider is fully implemented against the documented interface:

- **Documented transport** — Streamable HTTP to `https://agent.bitget.com/mcp`
  (S2 handbook, "Bitget MCP Server (US Stocks / ETF — Read-Only Data)"); the
  earlier SSE transport was corrected. No credentials required (read-only
  service, explicitly not the Agent Hub trading MCP and not `bitget-signal`).
- **Asset gating** — only rToken-mapped US reference tickers (rNVDA → NVDA)
  are requested; plain crypto assets never reach this service
  (`toReferenceSymbol`, unit-tested).
- **Automatic tool discovery** — `listTools()` result is classified into the six
  documented categories (quotes, fundamentals, corporate_actions, institutional_analyst,
  etf, news_sentiment) via keyword heuristics. No tool names are guessed.
- **Category-based dispatch** — topic text is matched to relevant categories;
  default is quotes + fundamentals + news_sentiment.
- **Zod validation** — lenient `.passthrough()` schemas in `usEquitySchemas.ts`
  validate each category's expected shape while preserving unknown fields.
- **Bounded timeouts** — 5 s connect, 8 s per tool call.
- **Response size limits** — summaries capped at 500 chars, max 20 observations
  per category.
- **Graceful degradation** — unreachable endpoint returns `UNAVAILABLE` /`[]`;
  individual tool failures are isolated.
- **Comprehensive tests** — 18 test cases covering degradation, classifyTool,
  extractPayload, registry integration, and resetToolCache.
- **Connectivity verification script** — `src/scripts/verify-connectivity.ts`
  performs a 4-step diagnostic (status, tool dump, sample call, observations).

## Remaining (requires live endpoint)

1. **Tighten Zod schemas** — Once `listTools()` succeeds against the live
   `agent.bitget.com/mcp` endpoint, inspect the actual response payloads and
   replace `.passthrough()` with `.strict()`, adjusting field names as needed.

2. **Adjust `classifyTool` keywords** — The keyword heuristics may need tuning
   once real tool names are visible. Run `verify-connectivity.ts` and review the
   `[category]  toolName` dump to check classification accuracy.

3. **Confirm `{ symbol }` argument convention** — The provider currently passes
   `{ symbol: asset }` to every tool call. If some tools use a different argument
   name (e.g. `ticker`, `code`), add a per-category argument mapper.

4. ~~**Wire into DecisionDeskService**~~ — DONE: the provider is registered in
   the default registry via `createDefaultResearchRegistry` (PRE24-01).

## Live-endpoint verification (2026-09-20)

`src/scripts/verify-connectivity.ts` (HTTP transport) was run against the live
endpoint. Result: **DNS cannot resolve `agent.bitget.com` from the current
network** (`ENOTFOUND`; control host `api.bitget.com` also failed at the same
moment while github.com/npmjs.org resolved — a local network issue, not a
documented-endpoint failure). The provider degraded exactly as designed
(`UNAVAILABLE`, zero requests issued). Items 1–3 above remain open until the
endpoint is reachable from some environment and real payloads/tool names can
be inspected. Re-run the script from a deployment environment (e.g. Vercel)
before tightening schemas.
