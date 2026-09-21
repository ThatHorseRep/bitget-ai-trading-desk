# External Connectivity Report

**Run Date:** 2026-09-21T14:32:22.949Z  
**Machine:** `localhost (Linux 4.19.0-gvisor x64) | Node.js v22.23.2`  
**Probe Timeout:** 10,000ms per endpoint  

## Connectivity Results

| Provider | Endpoint URL | HTTP Status | Latency (ms) | Bytes | First 200 Chars of Body |
|---|---|---|---|---|---|
| **Bitget Public Spot Ticker** | `https://api.bitget.com/api/v3/market/tickers?category=SPOT&symbol=BTCUSDT` | `200` | 393 | 420 | `{"code":"00000","msg":"success","requestTime":1790001139322,"data":[{"category":"SPOT","symbol":"BTCUSDT","ts":"1790001137514","lastPrice":"85726.88","openPrice24h":"80575","highPrice24h":"85837.35","` |
| **Bitget Public Spot Instrument** | `https://api.bitget.com/api/v3/market/instruments?category=SPOT&symbol=BTCUSDT` | `200` | 293 | 541 | `{"code":"00000","msg":"success","requestTime":1790001139635,"data":[{"symbol":"BTCUSDT","category":"SPOT","baseCoin":"BTC","quoteCoin":"USDT","symbolType":"crypto","buyLimitPriceRatio":"0.02","sellLim` |
| **Bitget Public Market Candles (Kline)** | `https://api.bitget.com/api/v2/spot/market/candles?symbol=BTCUSDT&granularity=1day&limit=5` | `200` | 247 | 650 | `{"code":"00000","msg":"success","requestTime":1790001139886,"data":[["1789574400000","75790.01","77161","75060.94","76784.99","3759.515544","286639078.95519455","286639078.95519455"],["1789660800000",` |
| **Bitget Reality Calendar** | `https://api.bitget.com/api/v3/reality/market/calendar` | `200` | 260 | 365 | `{"code":"00000","msg":"success","requestTime":1790001140145,"data":{"timeZone":"EST","specificConfig":[{"remark":"","startTime":"2026-06-18 20:00","endTime":"2026-06-19 20:00"},{"remark":"","startTime` |
| **Yahoo Finance Chart (Query1)** | `https://query1.finance.yahoo.com/v8/finance/chart/NVDA?range=5d&interval=1d` | `200` | 86 | 1761 | `{"chart":{"result":[{"meta":{"currency":"USD","symbol":"NVDA","exchangeName":"NMS","fullExchangeName":"NasdaqGS","instrumentType":"EQUITY","firstTradeDate":917015400,"regularMarketTime":1790001139,"ha` |
| **Yahoo Finance Chart (Query2 Fallback)** | `https://query2.finance.yahoo.com/v8/finance/chart/NVDA?range=5d&interval=1d` | `200` | 1304 | 1761 | `{"chart":{"result":[{"meta":{"currency":"USD","symbol":"NVDA","exchangeName":"NMS","fullExchangeName":"NasdaqGS","instrumentType":"EQUITY","firstTradeDate":917015400,"regularMarketTime":1790001140,"ha` |
| **Yahoo Finance Search (News/Evidence)** | `https://query1.finance.yahoo.com/v1/finance/search?q=NVDA&quotesCount=5&newsCount=5` | `200` | 379 | 5014 | `{"explains":[],"count":9,"quotes":[{"exchange":"NMS","shortname":"NVIDIA Corporation","quoteType":"EQUITY","symbol":"NVDA","index":"quotes","score":2.86496992E8,"typeDisp":"Equity","longname":"NVIDIA ` |
| **Bitget US Equity MCP Gateway** | `https://agent.bitget.com/mcp` | `400` | 609 | 95 | `{"jsonrpc":"2.0","id":null,"error":{"code":-32600,"message":"Bad Request: Missing session ID"}}` |
| **Bitget Signal DataHub MCP Gateway** | `https://datahub.noxiaohao.com/mcp` | `406` | 299 | 126 | `{"jsonrpc":"2.0","id":"server-error","error":{"code":-32600,"message":"Not Acceptable: Client must accept text/event-stream"}}` |

## Analysis & Findings

### Bitget Public Spot Ticker
- **URL**: `https://api.bitget.com/api/v3/market/tickers?category=SPOT&symbol=BTCUSDT`
- **Status**: `200`
- **Latency**: 393ms (420 bytes)
- **Health**: Reachable and responding.

### Bitget Public Spot Instrument
- **URL**: `https://api.bitget.com/api/v3/market/instruments?category=SPOT&symbol=BTCUSDT`
- **Status**: `200`
- **Latency**: 293ms (541 bytes)
- **Health**: Reachable and responding.

### Bitget Public Market Candles (Kline)
- **URL**: `https://api.bitget.com/api/v2/spot/market/candles?symbol=BTCUSDT&granularity=1day&limit=5`
- **Status**: `200`
- **Latency**: 247ms (650 bytes)
- **Health**: Reachable and responding.

### Bitget Reality Calendar
- **URL**: `https://api.bitget.com/api/v3/reality/market/calendar`
- **Status**: `200`
- **Latency**: 260ms (365 bytes)
- **Health**: Reachable and responding.

### Yahoo Finance Chart (Query1)
- **URL**: `https://query1.finance.yahoo.com/v8/finance/chart/NVDA?range=5d&interval=1d`
- **Status**: `200`
- **Latency**: 86ms (1761 bytes)
- **Health**: Reachable and responding.

### Yahoo Finance Chart (Query2 Fallback)
- **URL**: `https://query2.finance.yahoo.com/v8/finance/chart/NVDA?range=5d&interval=1d`
- **Status**: `200`
- **Latency**: 1304ms (1761 bytes)
- **Health**: Reachable and responding.

### Yahoo Finance Search (News/Evidence)
- **URL**: `https://query1.finance.yahoo.com/v1/finance/search?q=NVDA&quotesCount=5&newsCount=5`
- **Status**: `200`
- **Latency**: 379ms (5014 bytes)
- **Health**: Reachable and responding.

### Bitget US Equity MCP Gateway
- **URL**: `https://agent.bitget.com/mcp`
- **Status**: `400`
- **Latency**: 609ms (95 bytes)
- **Health**: Reachable and responding.

### Bitget Signal DataHub MCP Gateway
- **URL**: `https://datahub.noxiaohao.com/mcp`
- **Status**: `406`
- **Latency**: 299ms (126 bytes)
- **Health**: Reachable and responding.

