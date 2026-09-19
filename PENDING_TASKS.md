# Pending Tasks: US Equity MCP Integration

## Completed (PRE24-02)

The provider shell is fully implemented with:

- **Automatic tool discovery** — `listTools()` result is classified into the six
  GitBook categories (quotes, fundamentals, corporate_actions, institutional_analyst,
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

4. **Wire into DecisionDeskService** — Register the provider in the service's
   default registry so it participates in production workflows. Currently the
   provider is only used when explicitly registered.
