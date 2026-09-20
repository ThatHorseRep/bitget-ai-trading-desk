# Pending Tasks: US Equity MCP Integration

## Agent Hub (PRE24-06) — read-only handoff implemented; live session is a developer-side step

- **Determination:** Agent Hub's MCP Server and `bgc` CLI are LOCAL AI-host
  tools (official docs); `--read-only` is the documented safe mode. No
  hosted/browser Agent Hub API is documented, so the app implements a
  structured handoff payload — it never launches a stdio MCP from a
  serverless function and never places orders.
- **Payload:** every DECISION_READY workflow result carries
  `agentHubHandoff` (asset, artifact id, market state, thesis, challenge,
  stress results, product verdict, limitations) with `executionAllowed`
  typed as literal `false` — the type system cannot express permission.
- **To use:** copy the payload into your own AI host running
  `@bitget-ai/bitget-agent-mcp --read-only` (or `bgc` read-only) and ask
  read-only research questions. No exchange credentials exist in the repo.

## Chainbase AgentKey (PRE24-05) — implemented as documented AI-host handoff

- **Integration determination (documented, not guessed):** the S2 handbook's
  recommended architecture is `Your App → AI Agent → AgentKey → External Data
  Sources`, and AgentKey's own docs position it as a unified MCP gateway for
  AI hosts. No programmatic endpoint is documented for server-side use; none
  was invented. The bridge (`ChainbaseAgentKeyBridge`, slot 4) writes a
  structured request; an AI host with AgentKey installed retrieves data and
  writes validated structured observations back.
- **Identity:** every imported observation is attributed
  `chainbase-agentkey/<capability>/<source>` — Chainbase is an EXTERNAL
  PARTNER, never labelled a Bitget product.
- **Use-case gate:** only tokenized-stock (rToken) multi-signal research
  triggers the handoff; plain crypto never produces a request. Capability
  routing covers the five official families (market, on-chain, news, social,
  company) — only topic-relevant ones are requested.
- **No credentials app-side:** the AI host's AgentKey installation holds its
  own key; the server never sees or stores one.
- **Remaining (external):** claim AgentKey access at agentkey.app, connect
  an AI host, and run a live handoff; the bridge is ready for a real demo.

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

## Agentic Account (PRE24-07) — handoff path implemented; authorization is a human-side step

- **Determination:** per the official Agentic Account Connection Guide
  (bitget.com/support/articles/12560603894122), OAuth runs ONLY via the official
  `@bitget-ai/bitget-agent-mcp`'s `authorize_start` tool inside the user's own AI host;
  credentials are written locally by that MCP (never env vars, never user-pasted, never
  this repo). This app therefore implements the handoff only: no OAuth URL building, no
  credentials, no stdio MCP launch, no execution.
- **Delivered:** the seven-state connection state machine (UNAVAILABLE → AUTH_REQUIRED →
  AUTHORIZING → AUTHORIZED → HUMAN_CONFIRMATION_REQUIRED → READY_FOR_EXTERNAL_EXECUTION,
  with ERROR; no state meaning "order placed") + `AgenticHandoffDocument` on every
  DECISION_READY result (`agenticHandoff` field), carrying asset, artifact id, market
  state, product verdict, trade, stress results, limitations, the embedded read-only
  research handoff, and the explicit "authorization is NOT execution" disclosures.
- **Human-side steps for a live flow:** install the official skill + MCP
  (`npx @bitget-ai/bitget-agent-skill --target all --skill agentic`, then register
  `npx -y @bitget-ai/bitget-agent-mcp`), restart the AI-host session, call
  `authorize_start`, finish OAuth in the browser, confirm via `get_auth_status`. Only then
  review the handoff document and explicitly confirm any proposed action — execution
  happens solely in the official Agentic session, never in this app.
- **Not done (deliberately):** no live authorization, no order, no credential of any kind.
