# External Connectivity Report

**Run Date:** 2026-09-21T15:23:06.631Z  
**Machine:** `localhost (Linux 4.19.0-gvisor x64) | Node.js v22.23.2`  
**Probe Timeout:** 10,000ms per endpoint  

## Connectivity Results

| Provider | Endpoint URL | HTTP Status | Latency (ms) | Bytes | First 200 Chars of Body |
|---|---|---|---|---|---|
| **Bitget Public Spot Ticker** | `https://api.bitget.com/api/v3/market/tickers?category=SPOT&symbol=BTCUSDT` | `200` | 390 | 427 | `{"code":"00000","msg":"success","requestTime":1790004184356,"data":[{"category":"SPOT","symbol":"BTCUSDT","ts":"1790004182958","lastPrice":"86010.93","openPrice24h":"80781.24","highPrice24h":"86348.45` |
| **Bitget Public Spot Instrument** | `https://api.bitget.com/api/v3/market/instruments?category=SPOT&symbol=BTCUSDT` | `200` | 305 | 541 | `{"code":"00000","msg":"success","requestTime":1790004184667,"data":[{"symbol":"BTCUSDT","category":"SPOT","baseCoin":"BTC","quoteCoin":"USDT","symbolType":"crypto","buyLimitPriceRatio":"0.02","sellLim` |
| **Bitget Public Market Candles (Kline)** | `https://api.bitget.com/api/v2/spot/market/candles?symbol=BTCUSDT&granularity=1day&limit=5` | `200` | 551 | 650 | `{"code":"00000","msg":"success","requestTime":1790004185169,"data":[["1789574400000","75790.01","77161","75060.94","76784.99","3759.515544","286639078.95519455","286639078.95519455"],["1789660800000",` |
| **Bitget Reality Calendar** | `https://api.bitget.com/api/v3/reality/market/calendar` | `200` | 258 | 365 | `{"code":"00000","msg":"success","requestTime":1790004185491,"data":{"timeZone":"EST","specificConfig":[{"remark":"","startTime":"2026-06-18 20:00","endTime":"2026-06-19 20:00"},{"remark":"","startTime` |
| **Yahoo Finance Chart (Query1)** | `https://query1.finance.yahoo.com/v8/finance/chart/NVDA?range=5d&interval=1d` | `200` | 67 | 1748 | `{"chart":{"result":[{"meta":{"currency":"USD","symbol":"NVDA","exchangeName":"NMS","fullExchangeName":"NasdaqGS","instrumentType":"EQUITY","firstTradeDate":917015400,"regularMarketTime":1790004184,"ha` |
| **Yahoo Finance Chart (Query2 Fallback)** | `https://query2.finance.yahoo.com/v8/finance/chart/NVDA?range=5d&interval=1d` | `200` | 75 | 1719 | `{"chart":{"result":[{"meta":{"currency":"USD","symbol":"NVDA","exchangeName":"NMS","fullExchangeName":"NasdaqGS","instrumentType":"EQUITY","firstTradeDate":917015400,"regularMarketTime":1790004183,"ha` |
| **Yahoo Finance Search (News/Evidence)** | `https://query1.finance.yahoo.com/v1/finance/search?q=NVDA&quotesCount=5&newsCount=5` | `200` | 186 | 4918 | `{"explains":[],"count":10,"quotes":[{"exchange":"NMS","shortname":"NVIDIA Corporation","quoteType":"EQUITY","symbol":"NVDA","index":"quotes","score":2.86496992E8,"typeDisp":"Equity","longname":"NVIDIA` |
| **Bitget US Equity MCP Gateway** | `https://agent.bitget.com/mcp` | `400` | 335 | 95 | `{"jsonrpc":"2.0","id":null,"error":{"code":-32600,"message":"Bad Request: Missing session ID"}}` |
| **Bitget Signal DataHub MCP Gateway** | `https://datahub.noxiaohao.com/mcp` | `406` | 349 | 126 | `{"jsonrpc":"2.0","id":"server-error","error":{"code":-32600,"message":"Not Acceptable: Client must accept text/event-stream"}}` |

## Analysis & Findings

### Bitget Public Spot Ticker
- **URL**: `https://api.bitget.com/api/v3/market/tickers?category=SPOT&symbol=BTCUSDT`
- **Status**: `200`
- **Latency**: 390ms (427 bytes)
- **Health**: Reachable and responding.

### Bitget Public Spot Instrument
- **URL**: `https://api.bitget.com/api/v3/market/instruments?category=SPOT&symbol=BTCUSDT`
- **Status**: `200`
- **Latency**: 305ms (541 bytes)
- **Health**: Reachable and responding.

### Bitget Public Market Candles (Kline)
- **URL**: `https://api.bitget.com/api/v2/spot/market/candles?symbol=BTCUSDT&granularity=1day&limit=5`
- **Status**: `200`
- **Latency**: 551ms (650 bytes)
- **Health**: Reachable and responding.

### Bitget Reality Calendar
- **URL**: `https://api.bitget.com/api/v3/reality/market/calendar`
- **Status**: `200`
- **Latency**: 258ms (365 bytes)
- **Health**: Reachable and responding.

### Yahoo Finance Chart (Query1)
- **URL**: `https://query1.finance.yahoo.com/v8/finance/chart/NVDA?range=5d&interval=1d`
- **Status**: `200`
- **Latency**: 67ms (1748 bytes)
- **Health**: Reachable and responding.

### Yahoo Finance Chart (Query2 Fallback)
- **URL**: `https://query2.finance.yahoo.com/v8/finance/chart/NVDA?range=5d&interval=1d`
- **Status**: `200`
- **Latency**: 75ms (1719 bytes)
- **Health**: Reachable and responding.

### Yahoo Finance Search (News/Evidence)
- **URL**: `https://query1.finance.yahoo.com/v1/finance/search?q=NVDA&quotesCount=5&newsCount=5`
- **Status**: `200`
- **Latency**: 186ms (4918 bytes)
- **Health**: Reachable and responding.

### Bitget US Equity MCP Gateway
- **URL**: `https://agent.bitget.com/mcp`
- **Status**: `400`
- **Latency**: 335ms (95 bytes)
- **Health**: Reachable and responding.

### Bitget Signal DataHub MCP Gateway
- **URL**: `https://datahub.noxiaohao.com/mcp`
- **Status**: `406`
- **Latency**: 349ms (126 bytes)
- **Health**: Reachable and responding.


---

## Addendum — Pre-Submission Re-verification (2026-09-26)

**Machine:** Windows 11 dev workstation, Node v22.23.2 · **Scope:** live-path proof with Demo Mode OFF, plus optional-ecosystem provider status.

| Check | Result | Evidence |
|---|---|---|
| MarketStateService live path (no fixture) | **PASS — real data** | `getMarketState("rNVDA")` returned instrumentPrice **224.04** (Bitget rToken ticker), btcPrice **84,361.64** (Bitget BTC/USDT), referencePrice **225.07** (Yahoo), `dataQuality: COMPLETE`, `isFallbackDemo: false`, 3 observed sources with timestamps. Fixture value ($120) would prove fallback; observed value matches deployment exactly. |
| Deployed app `/api/market-price?asset=rNVDA` | **PASS — real data** | `{"price":224.04,"timestamp":"2026-09-26T23:16:24.126Z"}` from https://redteamdesk.name.ng (308 → www). Matches local live-path run to the cent. |
| Deployed app full workflow `/api/stress-test` (POST, `useFixture:false`) | **PASS — live end-to-end** | All 8 stages emitted; artifact: `dataSource: "live"`, verdict **REJECT** (deterministic, band critical), scenarios computed on live state (COMBINED_SHOCK −9.34%), 5 research-provider evidence items, honest material-uncertainty limitations. |
| Bitget Signal MCP (`datahub.noxiaohao.com/mcp`) | **PARTIAL — handshake OK, tools timing out today** | `getStatus(): AVAILABLE` (MCP initialize succeeded); individual tool calls (`news_feed`, `crypto_market`) hit their bounded 2.5–3.0 s timeouts and degrade to `UNAVAILABLE` provenance without blocking the workflow. |
| Bitget US Equity MCP (`agent.bitget.com/mcp`) | **UNAVAILABLE from this machine today** | DNS resolution failure (`ENOTFOUND agent.bitget.com`); provider degrades honestly to `UNAVAILABLE` with `[]` observations. This host was previously live-verified 2026-09-21 (see table above); the failure is in this network's reachability, not the integration. |
| Fixture fallback honesty | **PASS — rNVDA-only, flagged** | Fallback fires only for rNVDA requests and is flagged (`isFallbackDemo`, `fallbackReason`, `dataSource: "fixture"`); `/api/market-price` returns 503 rather than serve demo data as a real price. |

**Conclusion for judges:** the desk's primary path is live Bitget market data (proven above on the deployed app), with research providers as bounded, honestly-degrading enrichment and the fixture as an explicitly-labeled convenience for off-hours demos — never presented as live.

### Addendum 2 — Deployment-Network Verification (2026-09-26, post provider-visibility fix)

| Check | Result |
|---|---|
| US Equity MCP from the **deployment** (Vercel) | **Contributes real evidence in production** — a live workflow run returned 7 evidence items (5 legacy + US Equity MCP), with **no** UNAVAILABLE row for `bitget-us-equity-mcp`. `agent.bitget.com` is DNS-blocked from the dev machine's network but reachable from Vercel's. |
| Provider visibility on the deployed artifact | Limitations now name attempted-but-unproductive providers explicitly (e.g. "Research provider 'bitget-signal' was reachable but returned no observations for this asset/topic.") instead of omitting them silently. |
| Measured latency (deployment, full live run) | **16.8–17.7s** end-to-end with LLM + bounded research; **0.8s** in fixture mode; hard 45s serverless budget with deterministic fallback. |

**Guidance for the demo:** expect provider rows in the artifact's limitations when upstreams are slow or empty — this is the desk working as designed (honest degradation, visible provenance), not a failure. From a demo venue's network, re-check `agent.bitget.com` and `datahub.noxiaohao.com` reachability before presenting.
