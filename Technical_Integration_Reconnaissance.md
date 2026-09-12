# Technical Integration Reconnaissance

**Product:** Bitget AI Trading Desk  
**Scope:** First complete rNVDA vertical slice  
**Status:** Pre-implementation reconnaissance  
**Date:** 2026-09-12

## Executive conclusion

The defined rNVDA vertical slice is technically buildable with a small single-application system. The critical path can be implemented without agents, MCP servers, databases, queues, microservices, or autonomous trading.

The required runtime path is:

> Natural-language trade input → normalized trade → Bitget rNVDA/BTC market state → reference NVDA state → fresh evidence → deterministic calculations → single LLM reasoning pass or small set of sequential LLM calls → deterministic decision policy → Decision Artifact.

The main remaining uncertainty is not product architecture. It is **live-data/runtime verification in the developer's actual environment**, because this reconnaissance environment could not resolve `api.bitget.com` for direct HTTP requests. Official Bitget documentation does, however, establish the relevant public endpoints and response contracts.

A second important finding is that the repository is currently a documentation/research repository rather than an existing application. No `package.json`, `tsconfig.json`, `.env.example`, or deployment configuration was found at the current main-branch paths checked. The next step can therefore be a clean application scaffold followed by the vertical slice.

---

# 1. Repository Inspection

## Current repository state

The GitHub repository currently exposes the research/Product Bible material but no implemented application under the checked main-branch paths. The repository page currently lists the original research documents, while the newly added B01–B04 files are individually accessible from their main-branch paths.

The following common application files were checked and were not present:

- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `.env.example`
- `vercel.json`

There is consequently no existing frontend, backend/API layer, test suite, package-manager lockfile, or deployment setup to preserve.

The existing product and technical documents are therefore the current design contracts rather than code constraints.

**Evidence:** repository root and raw B01/B02/B03/B04 files.  
Repository: https://github.com/ThatHorseRep/bitget-ai-trading-desk

---

# 2. Reference Vertical Slice

The first implementation must support one complete scenario:

> A crypto-native Bitget trader is considering a meaningful rNVDA position, ideally during a period when the U.S. equity market is closed while the Bitget token remains tradable.

Example input:

> “I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. Stress-test it.”

Required system path:

```text
USER
  ↓
TRADE INPUT
  ↓
TRADE NORMALIZATION
  ↓
MARKET STATE
  ├── Bitget rNVDA
  ├── Bitget BTC
  ├── NVDA reference
  └── US market session
  ↓
EVIDENCE
  ↓
THESIS EXTRACTION
  ↓
THESIS CHALLENGE
  ↓
DETERMINISTIC STRESS SCENARIOS
  ↓
THESIS VS POSITION
  ↓
DETERMINISTIC DECISION POLICY
  ↓
LLM EXPLANATION / SYNTHESIS
  ↓
DECISION ARTIFACT
```

This is the only path the technical system is required to prove first.

**Product contract:** B01–B04 and `research-reconciliation-2`.

---

# 3. Technical Responsibility Map

| Stage | Frontend | Application logic | Deterministic code | LLM | External data | Bitget | Persistence | Provenance |
|---|---|---|---|---|---|---|---|---|
| Trade input | Capture text | Validate envelope | — | — | — | — | — | Record original user text |
| Normalization | Review/edit | Validate normalized trade | — | Parse intent | — | Symbol metadata if needed | — | User vs inferred vs derived |
| Market state | Render | Orchestrate requests | Basis, spread, liquidity metrics | Interpret relevance only | NVDA reference/news | rNVDA/BTC data | — | Timestamp every observation |
| Thesis | Render | Assemble context | — | Extract thesis, assumptions, dependencies | Evidence | — | — | Link claims to origins |
| Challenge | Render | Assemble evidence context | — | Counter-thesis and contradiction synthesis | Fresh evidence | Optional signals only | — | Link challenge claims to evidence |
| Stress | Render | Pass inputs | Scenario arithmetic, P&L | Explain consequence | Reference inputs where required | Market inputs | — | Record assumptions and calculation inputs |
| Thesis vs Position | Render | Combine results | Position/exposure metrics | Qualitative thesis assessment | — | Account data only if later enabled | — | Link judgments to inputs |
| Decision | Render | Apply policy | Verdict gates | Explain decision | — | — | — | Link decisive factors |
| Artifact | Render | Assemble object | Numeric outputs | Human-readable interpretation | Source metadata | Bitget observations | Not required | Complete claim provenance |

## Responsibility rules

### Must be deterministic

- required-input validation;
- position quantity/value arithmetic;
- basis and basis percentage;
- spread and spread percentage;
- top-of-book liquidity classification;
- scenario assumptions application;
- scenario P&L;
- portfolio impact when portfolio data exists;
- decision-policy gates;
- provenance classification.

### AI-assisted

- trade parsing;
- ambiguity detection;
- thesis extraction;
- assumptions/dependencies/invalidation extraction;
- evidence synthesis;
- contradiction identification;
- grounded challenge generation;
- qualitative thesis assessment;
- scenario interpretation;
- final explanation.

### External data

- Bitget market observations;
- NVDA reference price/session state;
- fresh relevant evidence/news.

The LLM never becomes the source of truth for price, liquidity, timestamps, market status, account state, or arithmetic.

---

# 4. Bitget Market Data Path

## 4.1 rNVDA symbol

The exact Bitget Reality trading pair is:

> **`rNVDAUSDT`**

Bitget's own current rToken material identifies rNVDA as NVIDIA exposure and its live Bitget spot page uses `rNVDA/USDT`. The official Reality trading guide says Reality symbols use the `r` prefix, for example `rAAPLUSDT`, and are handled through the current UTA market-data API.  
Sources: Bitget rToken product page; Bitget rNVDA trading page; Reality Trading Guide.

- https://www.bitget.com/campaigns/bitget-rtoken
- https://www.bitget.com/asia/spot/RNVDAUSDT
- https://www.bitget.com/docs/uta/reality-trading-guide

## 4.2 Instrument discovery

Use:

`GET /api/v3/market/instruments`

with:

`category=SPOT`

The response includes:

- `symbol`
- `category`
- `baseCoin`
- `quoteCoin`
- `isRwa`
- `isReality`
- `symbolType`
- precision/trading-rule fields

For Reality symbols, `isReality=yes` identifies the token as a Reality stock token.

**Rate limit:** 20 requests/sec/IP according to current Bitget documentation.

This endpoint is sufficient to validate that a submitted symbol is a supported Reality/rToken instrument. There is no reason to maintain a manually curated rToken registry as the primary source for the MVP.

Source: https://www.bitget.com/docs/catalog/market-market-data/market-instruments

## 4.3 rNVDA ticker

Use:

`GET /api/v3/market/tickers`

Parameters:

```text
category=SPOT
symbol=rNVDAUSDT
```

Relevant fields:

- `lastPrice`
- `ask1Price`
- `bid1Price`
- `bid1Size`
- `ask1Size`
- `volume24h`
- `turnover24h`
- `platformTurnover24h`
- `price24hPcnt`
- `ts`

Bitget documents `ts` as a Unix timestamp in milliseconds.

**Rate limit:** 20 requests/sec/IP.

The `platformTurnover24h` field is specifically documented as available for rTokens.

Source: https://www.bitget.com/docs/catalog/market/market-data

## 4.4 BTC ticker

Use the same endpoint:

`GET /api/v3/market/tickers`

Parameters:

```text
category=SPOT
symbol=BTCUSDT
```

Use:

- `lastPrice`
- `price24hPcnt`
- `ts`

The same public endpoint therefore covers both the rToken and BTC benchmark without a second Bitget market API family.

Source: https://www.bitget.com/docs/catalog/market/market-data

## 4.5 Liquidity data

For MVP we should use the ticker's top-of-book fields:

- bid;
- ask;
- bid size;
- ask size.

Calculate:

```text
spreadAbsolute = ask - bid
spreadPercent = (ask - bid) / ((ask + bid) / 2) × 100
```

This is intentionally a **top-of-book liquidity signal**, not a full market-depth model.

Bitget also exposes the generic public order-book endpoint:

`GET /api/v3/market/orderbook`

with `category=SPOT`, a symbol, and depth limit. The current documentation lists a 20/sec/IP rate limit. However, Bitget's separate Reality Trading Guide states that the Reality-specific order-book endpoint currently requires whitelist access. Therefore the MVP should **not depend on Reality order-book depth**. The public ticker fields are sufficient for the first liquidity state.

Source: https://www.bitget.com/docs/catalog/market/market-data  
Source: https://www.bitget.com/docs/uta/reality-trading-guide

## 4.6 Bitget instrument/reference relationship

The public instrument metadata can establish that `rNVDAUSDT` is a Reality stock token, but the application should not assume that the generic instrument response itself contains the underlying ticker relationship.

For the rNVDA MVP, the mapping should therefore be represented explicitly as product-supported metadata:

```text
rNVDAUSDT → NVDA
```

This is a supported-product mapping, not a user-supplied fact and not an LLM inference.

The mapping should be validated against Bitget's current rToken naming/product documentation when the supported-asset registry is created.

---

# 5. Live Bitget Request Verification

Direct public HTTP requests were attempted from the reconnaissance runtime for:

- `/api/v3/market/instruments?category=SPOT`
- `/api/v3/market/tickers?category=SPOT&symbol=rNVDAUSDT`
- `/api/v3/market/tickers?category=SPOT&symbol=BTCUSDT`
- `/api/v3/reality/market/stock-info`
- `/api/v3/reality/market/states`
- `/api/v3/reality/market/calendar`

The runtime could not resolve `api.bitget.com` and therefore did **not** obtain a live API response. No live response has been fabricated.

The official documentation was successfully inspected and establishes the public ticker/instrument contracts and their example response shapes.

### Representative documented ticker shape

```json
{
  "code": "00000",
  "msg": "success",
  "requestTime": 1765444397411,
  "data": [
    {
      "category": "SPOT",
      "symbol": "BTCUSDT",
      "lastPrice": "90253.5",
      "openPrice24h": "92590.86",
      "highPrice24h": "94475.75",
      "lowPrice24h": "89394.71",
      "ask1Price": "90253.5",
      "bid1Price": "90253.49",
      "bid1Size": "2.368684",
      "ask1Size": "0.402938",
      "price24hPcnt": "-0.02524",
      "volume24h": "7386.014738",
      "turnover24h": "677732572.225658",
      "platformTurnover24h": "677732572.225658",
      "ts": "1765444395778"
    }
  ]
}
```

This is the **official documented example response**, not a current rNVDA live response.

Source: https://www.bitget.com/docs/catalog/market/market-data

---

# 6. Reference NVDA Data

## Recommended primary source: Yahoo Finance quote/chart data

For the smallest hackathon implementation, use Yahoo Finance as the reference NVDA source, with an important caveat: its web quote pages are current enough for verification, but the underlying programmatic quote/chart interfaces are not presented by Yahoo as a stable public developer contract.

Current Yahoo Finance coverage shows NVDA's Nasdaq quote, previous close, current/after-hours observations, quote timestamps, and session context. The current quote page was reporting NVDA at a September 11, 2026 close of 218.29 USD and an after-hours observation of 218.26 USD when inspected on September 12, 2026.

Source: https://ca.finance.yahoo.com/quote/NVDA/

### Required reference fields

- `symbol = NVDA`
- latest available price
- previous close
- quote timestamp
- session/after-hours indication when available

### Why this source

- familiar and easy to validate manually;
- no separate financial-data platform is required for the concept;
- sufficient for a single-symbol hackathon reference;
- provides the actual underlying equity quote rather than another crypto wrapper.

### Important limitation

This is the weakest external dependency in the current path because Yahoo's programmatic endpoints are not a clean, officially documented application API comparable to Bitget's API contract.

### Fallback

Use Stooq as a low-dependency fallback/reference snapshot if Yahoo access is unavailable. Stooq exposes public stock quote/chart data for `NVDA.US`, but it should be treated as a secondary source rather than a more authoritative real-time feed.

Source: https://stooq.com/q/?s=nvda.us

### MVP rule

Do not build a provider abstraction for multiple stock-data vendors yet. Implement one provider contract and one fallback only.

If the selected programmatic Yahoo path proves unstable during implementation, switch the single reference provider rather than introducing a data-platform layer.

---

# 7. US Market Session Status

Market-session status should be deterministic and must not be delegated to the LLM.

## Recommended MVP method

Use:

1. deterministic U.S. equity regular-session rules;
2. Bitget's public Reality market calendar for holiday/special closure information.

Bitget currently provides:

`GET /api/v3/reality/market/calendar`

with no request parameters, no authentication, and a documented rate limit of 1/sec/IP. The response includes a `timeZone`, regular closure days, and special closure intervals.

Source: https://www.bitget.com/api-doc/uta/reality/market/Get-Market-Calendar

## Required state

```text
referenceMarketStatus:
  OPEN | CLOSED | UNKNOWN

session:
  REGULAR | OFF_HOURS | WEEKEND | UNKNOWN

observedAt:
  UTC timestamp
```

The application determines the state from the current UTC time converted to the relevant U.S. Eastern market timezone plus the calendar/closure data.

The standard regular session boundary is treated as 09:30–16:00 Eastern on normal trading days. Holiday and special-closure exceptions come from the calendar source.

## Why not simply trust a text field from an AI or news source

Session status is a deterministic temporal fact. There is no reason to involve an LLM or a probabilistic data source.

---

# 8. Fresh Evidence

## Recommended source: GDELT DOC 2.0

The MVP does not need a news terminal. It needs a small number of recent, relevant evidence candidates for the thesis challenge.

GDELT DOC 2.0 is appropriate because its document search API can query recent news coverage without an API key and return article metadata including URL, title, publication date, domain and source information.

Source: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

## Minimum retrieval behavior

Query using the normalized thesis/asset context, for example:

```text
NVDA OR NVIDIA + the material thesis topic
```

Limit the result set to a small number of recent candidates, such as the top 5.

Each evidence record should retain:

- headline/title;
- URL;
- domain/source;
- publication timestamp when returned;
- retrieval timestamp;
- query/context used.

## Important evidence rule

GDELT is an evidence-discovery layer, not automatically a truth layer. A headline should not be treated as proof of a claim merely because it appears in search results.

For the MVP, retrieved article metadata can support challenge discovery; material claims should be phrased conservatively and should preserve the underlying source reference. Where a material conclusion depends on details not contained in the retrieved metadata, the system should mark the evidence as limited rather than inventing the missing details.

## Why not a paid news API

It introduces credentials, account setup, rate limits and another dependency without proving the core decision workflow.

---

# 9. LLM Provider

## Repository finding

No LLM provider configuration exists in the repository because there is no application yet.

## Recommended MVP pattern

Use **one OpenAI-compatible provider** through a thin server-side provider wrapper.

The wrapper should expose only what the product needs:

- structured trade parsing;
- thesis extraction;
- challenge generation;
- qualitative assessment;
- final explanation.

Do not add model routing, multiple model providers, agents, or an orchestration framework.

## Current practical provider

The current development environment already has access to an OpenAI-compatible AgentRouter setup outside the repository, but the repository itself does not specify it. Current AgentRouter documentation describes an OpenAI-compatible endpoint at:

`https://co.agentrouter.org/v1`

and lists OpenAI-compatible model IDs that vary by available resource pool; the current guide includes examples such as `gpt-5.5`, `glm-5.1`, and `kimi-k2.6`.

Source: https://co.agentrouter.org/portal/guide

### Technical recommendation

Use the existing OpenAI-compatible provider available to the developer rather than introducing a new provider solely for the project. The exact model ID remains an implementation-time environment decision because the provider's available model pool is key-dependent.

### Structured output rule

Do not trust provider JSON blindly. The application must validate every LLM result against the product schema before accepting it into the pipeline.

If the provider cannot guarantee strict schema-constrained output, use a validated JSON response contract with bounded retries rather than adding a second model.

---

# 10. Deterministic Core Configuration

The MVP requires explicit configuration for scenario assumptions and decision policy. None of these values should be implied by the LLM.

## 10.1 Liquidity configuration

The first implementation should use simple, explainable top-of-book rules.

Required configuration:

```text
spreadWarnPercent
minVisibleBidSize
minVisibleAskSize
```

The exact values are **configuration choices, not research-derived truths**.

Recommended initial behavior:

- `NORMAL` when spread and visible size are within configured bounds;
- `THIN` when spread is above the warning threshold or visible size falls below the configured minimum;
- `UNKNOWN` when bid/ask or sizes are missing.

Do not call this an institutional liquidity score.

## 10.2 Stress-scenario assumptions

The four MVP scenarios require explicit assumptions:

| Scenario | Required configuration |
|---|---|
| Market risk | direct asset/reference shock percentage |
| Crypto contagion | direct token shock or validated sensitivity mode |
| Token microstructure | basis widening and liquidity deterioration assumptions |
| Combined shock | combination of the above assumptions |

Suggested starting **demo assumptions**, explicitly labeled as hypothetical rather than empirical:

- Market shock: **-5%** for the relevant underlying/token exposure.
- BTC contagion: **-8% BTC shock**, with direct token impact mode unless a validated sensitivity relation exists.
- Basis stress: **+3 percentage points of basis widening** where basis is available.
- Liquidity stress: **50% reduction in visible top-of-book size**.
- Combined: apply the above adverse assumptions together.

These are scenario knobs, not forecasts and not claims about expected market behavior.

## 10.3 Decision policy configuration

The MVP does not need a single numerical trade score.

### REJECT

Use when:

- trade intent is invalid/unsupported;
- a required market dependency is unavailable;
- a required stress calculation cannot be produced reliably.

### WAIT

Use when:

- evidence is materially stale/conflicting;
- the thesis has a material unresolved dependency;
- the current market state is too uncertain to justify proceeding;
- a key challenge materially weakens the trade but does not establish that the underlying thesis is invalid.

### REDUCE

Use when:

- thesis remains reasonably supported;
- but position size/exposure or stress consequences make the proposed position structurally weak.

### PROCEED

Use when:

- trade is fully understood;
- no material blocker exists;
- thesis has credible support;
- position remains acceptable under configured scenarios;
- remaining uncertainty is not material enough to require waiting.

## Important implementation rule

The decision policy should remain deterministic. The LLM explains the resulting verdict; it does not secretly override it.

---

# 11. Trade Object

The normalized trade object remains deliberately small.

```text
Trade
- asset
- assetType
- direction
- positionSize
- entryPrice
- timeHorizon
- thesis
- userAssumptions[]
- relevantExposure[]
```

### Ownership

**User supplied:** direction, size, thesis, optional entry, optional horizon, optional exposure.  
**Inferred:** asset symbol, standardized wording, only strongly implied fields.  
**System derived:** asset type/support status, current market price, reference mapping, basis, session state, liquidity.

No user-intent field is silently invented.

---

# 12. Market State Object

```text
MarketState
- observedAt
- token
  - symbol
  - lastPrice
  - bid
  - ask
  - bidSize
  - askSize
  - volume24h
  - observedAt
- reference
  - symbol
  - price
  - previousClose
  - marketStatus
  - observedAt
- relationship
  - basisAbsolute
  - basisPercent
  - available
- liquidity
  - spreadAbsolute
  - spreadPercent
  - state
- crossAsset
  - BTC
    - price
    - change24h
    - observedAt
- events[]
  - title
  - source
  - url
  - publishedAt
  - retrievedAt
- limitations[]
```

This is the minimum state required for the reference scenario.

---

# 13. Thesis Object

```text
Thesis
- traderStatement
- normalizedThesis
- assumptions[]
- dependencies[]
- supportingEvidenceRefs[]
- invalidationConditions[]
- unresolvedAmbiguities[]
```

Each thesis item should preserve its origin:

```text
ThesisItem
- text
- origin: USER_STATED | AI_INFERRED
- extractionConfidence
- evidenceRefs[]
```

`extractionConfidence` is about interpretation reliability, not probability that the trade succeeds.

The original user statement remains preserved.

---

# 14. Stress Scenario Engine

The stress engine is a small deterministic module.

```text
ScenarioResult
- scenarioId
- title
- assumptions[]
- inputs[]
- calculations[]
- positionImpact
- portfolioImpact
- riskExposed
- limitations[]
```

## Scenario 1 — Market Risk

**Assumption:** relevant token/reference exposure declines by the configured shock.

**Inputs:** position value, current/working entry, shock.

**Calculation:**

```text
longPnl = positionValue × shockPercent
shortPnl = -positionValue × shockPercent
```

When the token/reference relationship is being stressed separately, use the explicit token shock instead of assuming perfect tracking.

**Applicability:** all supported trades; core for rNVDA.

## Scenario 2 — Crypto Contagion

**Assumption:** BTC falls by the configured adverse shock while rNVDA remains tradable.

**Inputs:** BTC state, token position, configured shock.

**Calculation:** direct token-shock mode for MVP.

Do not invent beta.

**Applicability:** tokenized-equity trades in the 24/7 crypto environment.

## Scenario 3 — Token Microstructure

**Assumption:** token/reference basis widens and visible liquidity deteriorates.

**Inputs:** token price, reference price if available, bid/ask, bid/ask sizes, configured basis/liquidity assumptions.

**Calculation:** deterministic revaluation under the explicitly stated stressed token/basis condition and liquidity state.

**Applicability:** core for rToken trades.

## Scenario 4 — Combined Shock

**Assumption:** market shock + crypto shock + token microstructure deterioration occur together.

**Calculation:** apply the configured adverse assumptions deterministically. No probability and no independence assumption.

**Applicability:** core for the reference rNVDA experience.

## Optional Scenario 5 — Thesis Failure

Only use when the user's key assumption can be stated clearly enough to test.

This is primarily semantic and need not produce a numeric price target.

---

# 15. Thesis vs Position

## Thesis Quality

Inputs:

- trader statement;
- normalized thesis;
- assumptions;
- dependencies;
- supporting/contradictory evidence;
- invalidation conditions.

Output:

```text
STRONGER | MIXED | WEAKER | INSUFFICIENT
```

plus:

- principal support;
- principal weakness;
- evidence limitation.

This judgment is qualitative and AI-assisted.

## Position Quality

Inputs:

- position size;
- current/reference price;
- basis;
- spread/liquidity;
- relevant exposure;
- stress results;
- time horizon when available.

Output:

```text
STRONGER | MIXED | WEAKER | INSUFFICIENT
```

plus:

- structural risk;
- scenario vulnerability;
- missing context.

This judgment is driven by explicit metrics and rules, with AI explanation.

The two assessments remain independent.

---

# 16. Decision Synthesis

The decision pipeline is:

```text
Structured analysis
        ↓
Deterministic policy
        ↓
Verdict
        ↓
LLM explanation
```

The LLM receives the structured state and verdict inputs. It explains the conclusion but does not override policy gates.

Every verdict should reference the factors that caused it:

- thesis evidence/challenge;
- scenario consequences;
- position quality;
- portfolio context when available;
- material limitations.

The final artifact must be able to explain its verdict without re-running the model.

---

# 17. Decision Artifact Contract

```text
DecisionArtifact
- artifactId
- createdAt
- trade
- verdict
- decisiveReasons[]
- marketState
- thesis
- challenge
- scenarios[]
- thesisVsPosition
- changeConditions[]
- evidence[]
- limitations[]
```

Every decisive reason should reference one or more source objects, calculations, scenario results, thesis items, or limitations.

This object is the contract between application logic and the eventual frontend.

---

# 18. Provenance Model

Four provenance types are sufficient:

```text
OBSERVED_FACT
CALCULATED_METRIC
SCENARIO_ASSUMPTION
AI_INTERPRETATION
```

Minimum record:

```text
Provenance
- id
- type
- source
- sourceRef
- publishedAt / observedAt / retrievedAt
- inputs[]
- generatedBy
```

The important rule is not perfect lineage for every byte. It is that **every decisive user-facing claim can be traced to where it came from**.

---

# 19. LLM Boundary

## Allowed

- parse trade language;
- identify ambiguity;
- extract thesis and assumptions;
- synthesize evidence;
- formulate a grounded challenge;
- classify thesis quality qualitatively;
- interpret scenario results;
- formulate change conditions;
- write concise explanations.

## Forbidden

- invent prices or market state;
- invent citations or articles;
- perform authoritative financial arithmetic;
- invent probabilities;
- invent confidence as a forecast;
- silently rewrite user intent;
- override deterministic blockers;
- place trades.

The model is a reasoning component inside a deterministic product pipeline, not the product's financial authority.

---

# 20. Persistence

No database is required for the first vertical slice.

The active analysis can be transient:

- request/session state;
- client state for the current artifact;
- no persistent account/history requirement.

Do not add authentication, user profiles, long-term thesis memory, journal/history infrastructure, or portfolio storage before the core workflow proves value.

---

# 21. Technical Risks

## P0 — Can block the demo

### P0.1 Live Bitget connectivity from the actual runtime

The current reconnaissance environment could not resolve Bitget's API host. This does not invalidate the official API contract, but live connectivity must be verified in the developer runtime before relying on real rNVDA/BTC data.

**Mitigation:** first implementation milestone is a standalone read-only connectivity test for instruments + rNVDA ticker + BTC ticker.

### P0.2 Reference NVDA programmatic source stability

Yahoo's web data is accessible, but its programmatic access is not as formally contracted as Bitget's API.

**Mitigation:** isolate one provider adapter and keep Stooq as a fallback reference source; do not build a multi-vendor platform.

### P0.3 Real off-hours rNVDA scenario availability

The hackathon demo is strongest when rNVDA is tradable while the U.S. market is closed. The demo date/time may not naturally produce that state.

**Mitigation:** the application should support a deterministic demo fixture for the session label/reference snapshot while still using real Bitget rNVDA data. The fixture must be clearly marked as simulated context if used.

## P1 — Can materially weaken the demo

### P1.1 Fresh evidence quality

A no-key news search can surface low-quality or irrelevant sources.

**Mitigation:** cap results, preserve source metadata, rank conservatively, and allow “insufficient evidence” rather than forcing a challenge.

### P1.2 Provider/schema failure

LLM structured output may be malformed or incomplete.

**Mitigation:** runtime schema validation and bounded retry; never pass unvalidated model output into calculations or verdict gates.

### P1.3 False liquidity confidence

Top-of-book bid/ask size is not full market depth.

**Mitigation:** label the liquidity state as top-of-book only; use `UNKNOWN` when required fields are missing.

### P1.4 Decision-policy calibration

The simple policy rules are product safeguards, not empirically validated trading rules.

**Mitigation:** treat them as explicit configurable policy and avoid presenting them as a universal risk standard.

## P2 — Can be deferred

- Bitget account integration;
- historical analogue search;
- richer factor/correlation analysis;
- paper trading;
- persistent history;
- real-time background monitoring;
- deeper order-book analytics.

---

# 22. Mock vs Real

| Component | Must be real | Can be mocked | Reason |
|---|---:|---:|---|
| Trade input | Yes | No | Core product behavior |
| Normalization | Yes | No | Core product behavior |
| Bitget rNVDA ticker | Yes for final demo | Development fixture only | Proves Bitget-native value |
| Bitget BTC ticker | Yes for final demo | Development fixture only | Required contagion state |
| rToken classification | Yes | Development fixture only | Must prove supported asset path |
| NVDA reference price | Yes for final credible demo | Controlled snapshot for development/demo | Required relationship |
| US market session | Yes | Controlled fixture for repeatable tests | Required wedge condition |
| Fresh evidence | Prefer real | Curated fixture for deterministic testing | Challenge needs evidence |
| LLM reasoning | Yes | Test fixtures for unit tests | AI behavior is part of thesis |
| Deterministic calculations | Yes | No | Trust-critical |
| Portfolio context | No | Yes | Optional product context |
| Account authentication | No | Yes | Not required |
| Bitget paper trading | No | Yes | Out of core MVP |
| Historical analogues | No | Yes | Future/supporting |
| Persistence | No | Yes/transient | No history product |

### Final demo requirement

The parts that prove the product's unique claim must be real:

> **Bitget market state + reference state + evidence/provenance + deterministic stress calculations + LLM challenge/reasoning + Decision Artifact.**

Fixtures may be used to stabilize conditions, but they must never be presented as live observations.

---

# 23. Minimum Technical Shape

The smallest viable runtime is one web application with server-side access to external APIs.

```text
                    USER
                      │
                      ▼
              WEB APPLICATION
              Input / Workspace
              Decision Artifact
                      │
                      ▼
              APPLICATION LAYER
              Validate / Orchestrate
                      │
       ┌──────────────┼───────────────┐
       ▼              ▼               ▼
  BITGET +       REFERENCE /       LLM PROVIDER
  MARKET DATA    EVIDENCE           Reasoning
       │              │               │
       └──────────────┼───────────────┘
                      ▼
             DETERMINISTIC ENGINE
             Basis / Liquidity
             Stress / P&L
             Decision Policy
                      │
                      ▼
              DECISION ARTIFACT
                      │
                      ▼
                     USER
```

No separate services are needed.

No database is needed.

No queue or worker is needed.

No MCP server is needed.

No multi-agent layer is needed.

---

# 24. Exact Recommended Implementation Path

The next build should proceed in this order:

### Step 1 — Create the application shell

Start from a clean single web application because the repository does not contain an existing runtime.

### Step 2 — Establish runtime schemas

Implement the contract types for:

- Trade;
- MarketState;
- Thesis;
- Challenge;
- ScenarioResult;
- ThesisVsPosition;
- DecisionArtifact;
- Provenance.

### Step 3 — Prove deterministic calculations in isolation

Manually verify:

- basis;
- spread;
- position P&L;
- four stress scenarios;
- verdict policy.

### Step 4 — Prove live Bitget connectivity

Validate from the actual development runtime:

- instruments;
- `rNVDAUSDT` ticker;
- `BTCUSDT` ticker;
- timestamps;
- missing/error responses.

### Step 5 — Prove NVDA reference state

Connect the selected reference provider and validate the price/timestamp contract.

### Step 6 — Prove session state

Implement deterministic U.S. session status using exchange-session rules plus the Bitget holiday calendar.

### Step 7 — Prove evidence retrieval

Retrieve a small number of current NVDA-relevant articles and preserve provenance.

### Step 8 — Add LLM trade/thesis parsing

Validate the structured output against the product schemas.

### Step 9 — Add grounded challenge

Feed only normalized trade, market state, thesis and retrieved evidence to the model.

### Step 10 — Connect stress engine

Run the deterministic scenarios against real market inputs.

### Step 11 — Add thesis-vs-position assessment

Keep qualitative thesis analysis separate from deterministic position analysis.

### Step 12 — Add deterministic decision policy

Generate the verdict from structured inputs.

### Step 13 — Add LLM explanation

Explain the already-computed decision rather than asking the model to invent one.

### Step 14 — Assemble the Decision Artifact

Make the artifact independently renderable and fully provenance-aware.

### Step 15 — Run the exact rNVDA reference scenario

Only after the path works should experience polish and demo hardening begin.

---

# 25. APPROVED

The following can be implemented confidently:

- single application runtime;
- stateless active analysis;
- natural-language trade parsing;
- normalized trade contract;
- Bitget public rNVDA and BTC ticker path;
- Bitget instrument validation;
- top-of-book liquidity calculation;
- deterministic U.S. session state;
- one NVDA reference-price provider;
- small current-evidence retrieval path;
- structured LLM reasoning;
- deterministic scenario engine;
- separate thesis and position assessments;
- deterministic verdict policy;
- provenance-aware Decision Artifact.

These are directly supported by B01–B04 and current API documentation.

---

# 26. NEEDS DECISION

Only the following should remain open before implementation begins:

### 26.1 Exact NVDA reference provider

**Preferred direction:** Yahoo Finance with Stooq fallback, because it minimizes setup.  
**Reason still open:** the programmatic Yahoo interface is less formally documented than Bitget's API.

### 26.2 Exact LLM model ID

The provider pattern can be fixed now, but the exact model should be selected from the available models on the developer's existing provider/key. The product does not require a specific model family.

### 26.3 Initial scenario configuration values

The suggested -5% / -8% / +3pp / 50% assumptions are demo configuration values, not empirical claims. They should be explicitly accepted as product configuration during implementation rather than silently treated as facts.

### 26.4 Demo off-hours condition

The implementation should support real session state and a clearly marked controlled fixture so the hackathon demo is not dependent on the current clock landing in the ideal off-hours state.

---

# 27. BLOCKERS

There is currently **no product-architecture blocker**.

There is one **implementation-readiness blocker**:

> Live Bitget public API connectivity must be verified from the actual development runtime before the real-data path can be declared operational.

The reconnaissance environment could not perform this live verification because `api.bitget.com` DNS resolution failed. Official Bitget documentation provides the required API contracts, so this is a runtime verification issue rather than an unresolved API-design issue.

---

# 28. RECOMMENDED IMPLEMENTATION PATH

The smallest credible path is:

```text
1. Clean single web app
        ↓
2. Runtime schemas
        ↓
3. Deterministic calculation module
        ↓
4. Bitget rNVDA + BTC public data
        ↓
5. NVDA reference data
        ↓
6. Deterministic US session state
        ↓
7. Small evidence retrieval
        ↓
8. LLM trade/thesis extraction
        ↓
9. Grounded challenge
        ↓
10. Stress scenarios
        ↓
11. Thesis vs Position
        ↓
12. Deterministic verdict
        ↓
13. LLM explanation
        ↓
14. Decision Artifact + provenance
```

The first successful milestone should be:

> **One real rNVDA trade idea produces one complete Decision Artifact using live Bitget market data, a reference NVDA observation, current evidence, deterministic scenario calculations, and validated LLM reasoning.**

No breadth should be added before this works.

---

# 29. DO NOT BUILD

Do not introduce any of the following into the first implementation:

- MCP infrastructure;
- multi-agent orchestration;
- agent memory systems;
- autonomous trading;
- order execution;
- paper-hedge execution;
- synthetic hedge recommendations;
- full order-book analytics;
- portfolio management;
- account authentication as a core dependency;
- persistent database/history;
- market monitoring/background workers;
- price prediction;
- probability forecasts;
- Monte Carlo;
- VaR/Expected Shortfall stack;
- historical analogue engine;
- multi-vendor market-data platform;
- generic AI chat mode;
- full trading terminal.

Every one of these can wait without weakening the first complete rNVDA Decision Artifact.

---

# 30. Final Technical Verdict

**Yes — the defined rNVDA vertical slice is technically feasible with a small system.**

The Bitget side is the strongest part of the path: current public UTA market APIs provide Reality instrument identification and ticker fields needed for price, bid/ask, size, volume and timestamps, while Bitget separately exposes a US-stock market calendar. citehttps://www.bitget.com/docs/catalog/market/market-datahttps://www.bitget.com/docs/catalog/market-market-data/market-instrumentshttps://www.bitget.com/api-doc/uta/reality/market/Get-Market-Calendar

The weak dependency is the external NVDA reference-price source, followed by the quality/freshness of freely retrieved evidence. Both are manageable without changing the architecture.

The implementation should therefore proceed as a **single, explicit, observable pipeline** rather than as an agent system.
