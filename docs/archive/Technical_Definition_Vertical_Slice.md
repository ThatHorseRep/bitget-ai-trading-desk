# Technical Definition — Vertical Slice

## Purpose

This document defines the smallest real technical system capable of delivering the Bitget AI RedTeam Desk MVP vertical slice defined in B01–B04.

It is not a production architecture, enterprise architecture, or implementation ticket set. It deliberately avoids unnecessary services, agents, persistence, infrastructure, and market-data breadth.

The technical target is one complete flow:

> **Trade Input → Normalization → Market State → Thesis → Challenge → Stress → Thesis vs Position → Decision → Decision Artifact**

The system must be credible enough for a live hackathon demonstration while remaining small enough to build, validate, and debug quickly.

---

# 1. Reference Vertical Slice

The first complete system must support this scenario:

A crypto-native Bitget trader is considering a meaningful **rNVDA** position while U.S. equity markets are closed. The trader submits a natural-language trade idea such as:

> "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. Stress-test it."

The system then:

1. accepts the trade idea;
2. extracts and normalizes the intended trade;
3. asks for clarification only if a required field is genuinely missing or ambiguous;
4. retrieves the current Bitget rToken state and the relevant reference-market state;
5. calculates token/reference basis and basic liquidity measures;
6. extracts the trader's thesis, assumptions, dependencies, and invalidation conditions;
7. retrieves relevant evidence and identifies contradictions;
8. generates a grounded counter-thesis;
9. applies deterministic market, crypto-contagion, token-microstructure, and combined stress scenarios;
10. evaluates thesis quality separately from position quality;
11. considers relevant portfolio exposure when available;
12. derives a transparent Proceed / Wait / Reduce / Reject conclusion;
13. returns the complete Decision Artifact with provenance and limitations.

The technical system should support this flow end to end before adding breadth.

---

# 2. Technical Responsibility Map

| Stage | Frontend | Backend / Application | Deterministic Engine | LLM | External Data | Bitget | Persistence | Provenance |
|---|---|---|---|---|---|---|---|---|
| Trade input | Capture natural language | Validate request envelope | — | — | — | — | — | Record user input as origin |
| Normalization | Review/edit normalized fields | Validate normalized trade | — | Parse intent/fields | — | Optional symbol metadata | — | Mark user-supplied vs inferred |
| Market state | Render state | Orchestrate retrieval | Basis/liquidity metrics | Interpret relevance only | Reference price/news/cross-asset | rToken/crypto market data | — | Timestamp every observation |
| Thesis | Render extracted thesis | Store transient result | — | Extract thesis/assumptions/dependencies | Evidence retrieval | — | — | Link claims to source/user statement |
| Challenge | Render counter-thesis | Assemble evidence context | — | Generate grounded challenge | Relevant evidence | Optional Bitget signals | — | Link challenge claims to evidence |
| Stress | Render scenarios | Pass validated inputs | Apply deterministic shocks and P&L | Explain implications | Historical/reference inputs only where needed | Market inputs | — | Record assumptions + calculation inputs |
| Thesis vs Position | Render two judgments | Combine structured evidence | Position metrics | Qualitative thesis assessment | — | Optional account exposure | — | Trace judgments to inputs |
| Decision | Render verdict | Apply decision policy | Supply calculated gates/conditions | Explain conclusion | — | — | — | Link decisive factors |
| Artifact | Render structured object | Assemble canonical output | Supply numeric results | Supply language fields | Supply source metadata | Supply Bitget observations | Optional later | Attach provenance to material claims |

## Responsibility categories

### Must be deterministic

- trade validation rules;
- position exposure calculations;
- token/reference basis;
- spread/liquidity measures derived from market data;
- scenario shock arithmetic;
- position P&L under scenarios;
- portfolio impact calculations when portfolio inputs exist;
- decision-policy thresholds and blocking conditions;
- classification of result provenance.

### AI-assisted

- natural-language trade parsing;
- thesis extraction;
- assumption/dependency extraction;
- evidence synthesis;
- contradiction identification;
- counter-thesis formulation;
- qualitative thesis-quality assessment;
- scenario interpretation;
- concise decision explanation;
- change-condition wording.

### External data

- Bitget market/account data;
- reference-stock price/state;
- relevant crypto price/state;
- fresh relevant news/events.

The LLM is never the source of truth for externally observable market values or arithmetic.

---

# 3. Minimum Data Requirements

The vertical slice does not need a general market-data platform.

| Data | Why required | Source | Freshness | Real required? | Fallback | Unavailable behavior |
|---|---|---|---|---|---|---|
| rToken last price | Current tradable state | Bitget public market API | Near-real-time | Yes for demo | None | Block live-state decision for supported rToken trade |
| rToken bid/ask and sizes | Spread/liquidity condition | Bitget market data | Near-real-time | Yes | Simplified liquidity state only if depth unavailable | Mark liquidity as unknown and qualify result |
| Reference stock price | Compare token to reference | External reference-price provider | Current/latest available | Yes for rToken wedge | Carefully labelled reference snapshot for demo only | Do not calculate basis; qualify/limit analysis |
| Reference market status | Determine open/closed regime | Calendar/session logic + market source | Current | Yes | Deterministic exchange-session calendar | State as unknown; do not assert off-hours regime |
| BTC price / change | Crypto-contagion scenario | Bitget public market data | Near-real-time | Yes | None for demo scenario | Remove contagion scenario and mark it untestable |
| Relevant equity/sector proxy | Context for market-risk scenario | Reference market/public data | Current/latest | Prefer real | Reference snapshot for controlled demo only | Scenario can still run if direct asset shock is used |
| Fresh relevant events | Thesis support/challenge | News/search source | Minutes-hours depending on source | Yes for realistic challenge | Curated demo fixture only when clearly labelled | Continue with limited evidence and explicit limitation |
| Existing relevant exposure | Position-quality / portfolio impact | Bitget account API or user input | Current | Prefer real | User-provided exposure | Run position analysis without portfolio-level conclusion |

## Data rule

Only data that changes a decision belongs in the MVP. A metric is not included merely because it is available.

---

# 4. Bitget Integration

Bitget integration is a product dependency, not decoration.

Bitget's current public market API exposes ticker data including latest price, bid/ask, sizes, volume and timestamps, and its instrument metadata identifies RWA/Reality instruments. Bitget also opened Reality stock spot API access in August 2026. citeturn267111search2turn267111search3

## 4.1 Required Bitget integration

### Public market data

Use Bitget public market data for:

- supported rToken ticker;
- bid/ask and available size where returned;
- timestamp;
- relevant crypto benchmark such as BTC;
- instrument metadata required to confirm the asset type.

This is the minimum Bitget integration that makes the product genuinely Bitget-native.

### Why this is required

The core wedge is a decision made inside a 24/7 tokenized-equity market. The product must therefore use the actual Bitget market state rather than a fabricated demo market.

## 4.2 Optional Bitget integration

### Account/position read

Use a read-only Bitget account connection only if it can be added without slowing the reference vertical slice.

Its purpose is narrowly limited to retrieving:

- current relevant holdings;
- position quantity/value needed for portfolio context.

It is not used to manage the account.

Bitget's current Agent ecosystem and UTA API expose account and market operations, while market data itself is public. citeturn267111search1turn267111search4

### Decision

For the first complete slice, **portfolio context must be optional**. The product must work without a private Bitget API key.

## 4.3 Do not integrate for MVP

- live order placement;
- paper hedge execution;
- autonomous trading tools;
- trade-write permissions;
- full account management;
- every Bitget Agent Hub capability.

The official Bitget Agent ecosystem does support paper trading and write-safe tooling, but those capabilities do not materially improve the core decision workflow enough to justify making them MVP dependencies. citeturn267111search0turn267111search4

## 4.4 Bitget AI capabilities

The product may use Bitget's market-analysis capabilities where they genuinely improve evidence collection, but they should not become a required orchestration layer.

Bitget's current Agent Hub separates market-analysis skills (`bitget-signal`) from its trading/execution tooling. citeturn267111search0turn267111search1

For the vertical slice, direct application-level data retrieval plus the product's own LLM reasoning is simpler and more controllable. Bitget AI capabilities should be included where they provide a clear hackathon value demonstration, not merely because MCP or Agent Hub exists.

---

# 5. Minimum Market / Reference-Price Model

The MVP needs one compact representation of the relationship between a tokenized asset and its reference asset.

```text
Tradable Asset
- symbol
- assetType
- venue
- tokenPrice
- tokenBid
- tokenAsk
- tokenBidSize
- tokenAskSize
- observedAt

Reference Asset
- symbol
- referencePrice
- marketStatus
- observedAt

Relationship
- basisAbsolute
- basisPercent
- basisAvailable
- liquidityState
```

## Market status

The system needs only:

- reference market status: OPEN / CLOSED / UNKNOWN;
- token market status: OPEN / CLOSED / UNKNOWN;
- current session label: REGULAR / OFF_HOURS / WEEKEND / UNKNOWN.

## Liquidity

MVP liquidity is not a full order-book model. It is a compact state derived from the available bid/ask and size data:

- spread amount;
- spread percentage;
- visible bid/ask size;
- liquidity state: NORMAL / THIN / UNKNOWN.

The exact classification thresholds should be explicit configuration, not an LLM judgment.

## Cross-asset state

Only the minimum benchmark state is required:

- BTC price/change for crypto-contagion;
- one relevant equity/sector reference where justified.

No broad factor library is required.

---

# 6. Trade Object

The canonical normalized trade should be small enough to pass between every stage.

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

## Field ownership

### User supplied

- asset, when stated;
- direction;
- position size;
- thesis;
- entry price, if explicitly supplied;
- time horizon, if explicitly supplied;
- existing exposure, if explicitly supplied.

### Inferred

- asset symbol from natural language;
- direction from language;
- standardized thesis wording;
- inferred time horizon only when strongly implied, and always marked inferred.

### System derived

- current market price;
- reference symbol/relationship;
- current token/reference basis;
- market session state;
- liquidity state.

No inferred user intent is silently converted into a confirmed user statement.

---

# 7. Market State Object

```text
MarketState
- asset
- observedAt
- token
  - lastPrice
  - bid
  - ask
  - bidSize
  - askSize
- reference
  - symbol
  - price
  - marketStatus
  - observedAt
- relationship
  - basisAbsolute
  - basisPercent
- liquidity
  - spreadAbsolute
  - spreadPercent
  - state
- crossAsset[]
  - symbol
  - price
  - change
  - observedAt
- events[]
  - headline
  - source
  - publishedAt
  - retrievedAt
- limitations[]
```

Every market observation must carry an observation timestamp.

Every externally sourced event must carry source and publication/retrieval timestamps where available.

The object should permit partial completeness without silently substituting fabricated values.

---

# 8. Thesis Object

```text
Thesis
- traderStatement
- normalizedThesis
- assumptions[]
- dependencies[]
- supportingEvidence[]
- invalidationConditions[]
- unresolvedAmbiguities[]
```

Each extracted item should retain its origin:

```text
ThesisItem
- text
- origin: USER_STATED | AI_INFERRED
- confidence
- evidenceRefs[]
```

`confidence` here describes extraction confidence, not probability that the thesis will succeed.

The original trader statement must be preserved so the user can detect an incorrect interpretation.

---

# 9. Stress Scenario Engine

The scenario engine is intentionally deterministic and rule-based.

It should accept a normalized trade plus market/portfolio inputs and return explicit scenario results.

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

### Assumption

The relevant underlying/reference asset or sector declines by a configured shock.

### Required inputs

- current position value;
- reference/current token price;
- shock percentage.

### Calculation

For a simple long position:

`positionImpact = positionValue × shock`

For a simple short position, the sign is reversed.

Where token/reference basis is explicitly modelled, the scenario can use the chosen token-price shock directly rather than assuming perfect tracking.

### Output

- assumed market shock;
- estimated position P&L;
- estimated portfolio P&L where portfolio value is known.

### Interpretation

AI explains what the loss means for the trader's thesis and position structure.

### Applicability

Universal for supported trades.

---

## Scenario 2 — Crypto Contagion

### Assumption

BTC or the selected crypto-risk benchmark experiences a configured adverse shock while the token remains tradable.

### Required inputs

- token position;
- BTC/current benchmark value;
- scenario shock;
- optional empirically supported sensitivity relationship if available.

### Calculation

MVP must not invent a beta.

Use one of two modes:

**Direct token shock mode:** apply an explicit token shock assumption attributed to crypto contagion.

**Relationship mode:** only use a calculated sensitivity if a valid, sufficient observation window exists.

### Output

- crypto shock assumption;
- estimated token-position impact;
- confidence/limitation statement about the relationship basis.

### Applicability

Conditionally useful for tokenized equity trades in a 24/7 crypto environment.

---

## Scenario 3 — Token Microstructure

### Assumption

Token basis widens and liquidity deteriorates.

### Required inputs

- current token price;
- reference price where available;
- current spread;
- visible liquidity;
- configured basis/liquidity shock.

### Calculation

Calculate:

- stressed token price or basis assumption;
- resulting position value/P&L;
- spread/liquidity change where measurable.

The system must not claim that a particular basis widening will occur. It is an explicit stress assumption.

### Output

- basis assumption;
- liquidity assumption;
- position consequence;
- warning about execution/liquidity uncertainty.

### Applicability

Core for tokenized-equity trades.

---

## Scenario 4 — Combined Shock

### Assumption

Relevant underlying risk, crypto risk, and token microstructure deteriorate together.

### Required inputs

The inputs required by Scenarios 1–3.

### Calculation

Apply the explicitly configured combined assumptions in a deterministic sequence.

Do not assume statistical independence or invent a probability of joint occurrence.

### Output

- each scenario assumption;
- combined position impact;
- portfolio impact where available;
- dominant risk contributor.

### Applicability

Core for the reference rToken experience.

---

## Scenario 5 — Thesis Failure

Optional in the MVP.

This is primarily semantic rather than a generic numerical stress. It is used only when the trader's key catalyst or assumption can be represented clearly enough to evaluate.

It should return:

- failed assumption;
- supporting evidence or contradiction;
- resulting effect on thesis quality;
- resulting effect on the decision.

It does not need to produce a fabricated numerical price outcome.

---

# 10. Thesis vs Position

The two judgments must remain separate.

## Thesis Quality

### Inputs

- normalized trader thesis;
- assumptions;
- dependencies;
- supporting evidence;
- contradictory evidence;
- invalidation conditions.

### Evaluation

The LLM produces a structured qualitative judgment based on these inputs.

The output must include:

- assessment: STRONGER / MIXED / WEAKER / INSUFFICIENT;
- principal supporting reason;
- principal weakness;
- evidence limitations.

No arbitrary 0–100 score is required.

## Position Quality

### Inputs

- position size;
- current/reference price;
- basis;
- spread/liquidity;
- relevant portfolio exposure;
- stress-scenario results;
- time horizon when available.

### Evaluation

Position quality is determined from explicit risk conditions and scenario consequences.

The output must include:

- assessment: STRONGER / MIXED / WEAKER / INSUFFICIENT;
- principal structural risk;
- principal scenario vulnerability;
- relevant missing context.

The position assessment must not inherit the thesis assessment automatically.

### Combination rule

Possible outcomes include:

> Thesis: STRONGER
> Position: WEAKER

The final decision may therefore be **Wait** or **Reduce** even when the thesis itself remains credible.

---

# 11. Decision Synthesis

The final verdict is a deterministic policy over structured inputs, with the LLM responsible for explanation rather than secretly choosing the result.

## Possible decisions

- **Proceed**
- **Wait**
- **Reduce**
- **Reject**

## Decision inputs

- trade completeness;
- market-state completeness;
- thesis assessment;
- challenge severity;
- scenario losses;
- position-quality assessment;
- portfolio impact where available;
- material uncertainty/limitations.

## Decision policy

The exact thresholds should be configuration rather than model intuition.

At minimum:

### Reject / block

Use when:
- trade intent is invalid or unsupported;
- a required market dependency is unavailable and prevents meaningful analysis;
- the trade cannot be stress-tested reliably enough to support the requested decision.

### Wait

Use when:
- the thesis may be reasonable but current evidence or market state is too uncertain;
- a key confirmation condition has not been met;
- market/reference information is stale or materially conflicting.

### Reduce

Use when:
- the thesis remains credible;
- but position size/exposure creates disproportionate stress consequences or structural risk.

### Proceed

Use when:
- the trade is sufficiently understood;
- no material blocker exists;
- the thesis has credible support;
- position risk remains acceptable under the defined MVP scenarios;
- remaining uncertainty does not invalidate the decision.

The policy must be conservative when key evidence is missing rather than treating missing information as neutral evidence.

## Final explanation

The LLM receives the structured decision inputs and produces a concise explanation of:

- why the verdict was reached;
- the two or three most decisive factors;
- the principal uncertainty;
- what would change the decision.

The LLM may explain the decision but may not silently override the deterministic decision policy.

---

# 12. Decision Artifact Model

The Decision Artifact is the central backend/frontend contract.

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

## Verdict

```text
Verdict
- value: PROCEED | WAIT | REDUCE | REJECT
- basisRefs[]
```

## Decisive reasons

Each reason must reference one or more:

- thesis item;
- evidence item;
- scenario result;
- portfolio/position calculation;
- limitation.

## Challenge

```text
Challenge
- counterThesis
- vulnerableAssumptions[]
- contradictoryEvidence[]
- strength: STRONG | MODERATE | WEAK | NONE
- limitations[]
```

## Evidence

```text
EvidenceItem
- id
- claim
- source
- publishedAt
- retrievedAt
- type: OBSERVED_FACT | CALCULATED_METRIC | SCENARIO_ASSUMPTION | AI_INTERPRETATION
- sourceRef
```

## Change conditions

```text
ChangeCondition
- condition
- linkedThesisRefs[]
- linkedDecisionRefs[]
- priority: HIGH | MEDIUM | LOW
```

## Limitations

```text
Limitation
- category
- description
- severity: INFO | MATERIAL | BLOCKING
```

The artifact must be renderable without re-running the LLM.

---

# 13. Provenance Model

Provenance is intentionally simple.

Every material claim is represented by one of four types:

| Type | Meaning | Example |
|---|---|---|
| OBSERVED_FACT | External/user-observed information | Bitget rNVDA last price |
| CALCULATED_METRIC | Deterministic output | Basis = token price − reference price |
| SCENARIO_ASSUMPTION | Explicit hypothetical | Assume token falls 8% |
| AI_INTERPRETATION | Model-generated reasoning | This weakens the trade because... |

## Minimum provenance fields

```text
Provenance
- id
- type
- source
- sourceRef
- observedAt / publishedAt / retrievedAt
- inputs[]
- generatedBy
```

`generatedBy` identifies whether the value came from a data source, deterministic engine, or LLM.

## Provenance rule

A user should be able to trace every decisive conclusion back to the evidence, calculation, assumption, or interpretation that produced it.

The UI may progressively disclose the details; the backend contract must retain them.

---

# 14. LLM Responsibilities

The LLM is a reasoning and language layer, not a market-data or calculation layer.

## Allowed

- parse the user's natural-language trade;
- identify ambiguity;
- extract thesis;
- extract assumptions;
- extract dependencies;
- identify likely invalidation conditions;
- summarize retrieved evidence;
- identify contradictions in supplied evidence;
- generate a grounded counter-thesis;
- interpret stress-test consequences;
- qualitatively assess thesis quality;
- explain position-quality issues from structured inputs;
- formulate change conditions;
- write the final concise artifact narrative.

## Must not

- invent prices, volumes, market status, or account holdings;
- invent news or citations;
- perform authoritative arithmetic;
- manufacture probabilities;
- manufacture confidence scores that look like forecasts;
- silently change the user's trade direction, size, or thesis;
- choose inputs for deterministic calculations without declaring the assumption;
- override blocking conditions;
- place trades.

## Structured output requirement

The model should return schema-constrained structured data for machine-consumed outputs. Freeform narrative is limited to fields intended for human explanation.

---

# 15. Deterministic Responsibilities

The deterministic layer should remain a small, auditable set of pure functions.

It must handle:

### Trade calculations

- position value;
- units where applicable;
- directional P&L.

### Market calculations

- basis absolute;
- basis percentage;
- spread absolute;
- spread percentage;
- liquidity classification;
- simple exposure measures.

### Stress calculations

- scenario shocks;
- stressed position value;
- scenario P&L;
- portfolio impact when portfolio inputs exist;
- combined-scenario arithmetic.

### Decision calculations

- minimum required-input checks;
- blocker detection;
- policy thresholds;
- deterministic verdict policy.

No VaR, Expected Shortfall, Monte Carlo, factor optimizer, or other institutional framework is required for the first slice.

---

# 16. State Machine

The technical state machine is intentionally identical to the B04 product state model.

```text
EMPTY
  ↓
INPUT
  ↓
CLARIFICATION (only if required)
  ↓
NORMALIZED
  ↓
ANALYSING
  ├──→ PARTIAL
  ├──→ ERROR
  ↓
DECISION_READY
```

## EMPTY

No active trade analysis exists.

**Recoverability:** Start a new analysis.

## INPUT

The user is composing or submitting the trade idea.

**Exit:** Submit.

## CLARIFICATION

A required field or material ambiguity prevents reliable normalization.

**Exit:** User answers or edits the trade.

## NORMALIZED

A valid normalized trade exists and awaits user confirmation.

**Exit:** Confirm → analysis.

## ANALYSING

The workflow is executing.

**Exit:** Decision-ready, partial, or error.

## PARTIAL

Analysis completed with a material limitation but enough information remains to provide a qualified result.

**Recoverability:** Review limitation; accept partial artifact or restart with additional context.

## DECISION_READY

A complete or qualified Decision Artifact exists.

**Recoverability:** Review or start a new analysis.

## ERROR

A technical or data condition prevents trustworthy analysis.

**Recoverability:** Retry, correct input, or restart.

No separate state exists for every data failure. Data-quality conditions are represented inside the analysis or artifact unless they genuinely block the workflow.

---

# 17. Persistence

## MVP decision

**No database is required for the first vertical slice.**

The MVP does not require a history product, journal, saved sessions, or long-lived portfolio records.

The current analysis can remain transient for the duration of the session/request and be held client-side after completion if needed for the current interaction.

## What exists transiently

- raw user trade input;
- normalized trade;
- market state snapshot;
- thesis;
- challenge;
- scenario results;
- Decision Artifact.

## What is not persisted

- user account profile;
- trading history;
- portfolio history;
- behavioral history;
- long-term thesis memory;
- saved analyses.

## Why

Persistence does not prove the core product thesis and would introduce unnecessary authentication, schema, migration, privacy, and operational work.

A later product version may persist Decision Artifacts, but that is conditional on actual user demand.

---

# 18. Mock vs Real

| Component | Must be real | Can be mocked | Why |
|---|---|---|---|
| User trade input | Yes | No | Core interaction |
| Trade normalization | Yes | No | Core product behavior |
| Bitget rToken market price | Yes | No for final demo | Proves Bitget-native value |
| Bitget bid/ask/liquidity | Yes where available | Limited fallback | Necessary for token microstructure |
| Reference stock price | Yes for final credible demo | Controlled snapshot for development | Needed for basis/state reconstruction |
| Reference market status | Yes | Controlled fixture during development | Critical to off-hours wedge |
| BTC state | Yes | Fixture during development | Needed for contagion scenario |
| Fresh evidence/news | Prefer real | Curated fixture during development | Challenge quality depends on relevant evidence |
| LLM reasoning | Yes | Prebuilt responses only for unit testing | AI reasoning is part of the thesis |
| Deterministic calculations | Yes | No | Trust-critical |
| Portfolio context | No | Yes / user input | Optional in B02/B04 |
| Account authentication | No | Yes | Not required for first slice |
| Bitget paper trading | No | Yes | Explicitly outside core MVP |
| Historical analogues | No | Yes | Supporting/future capability |
| Decision persistence | No | Yes/transient | No history product in MVP |

## Mocking rule

A mocked component is acceptable when it does not undermine the product claim being demonstrated.

For the final hackathon demo, the following must remain real:

> **Bitget market state + decision-specific calculations + evidence/provenance + LLM reasoning + final artifact.**

Controlled fixtures may still be used for unavailable reference-market data, test repeatability, or failure-state demonstrations, but must be visibly treated as fixtures rather than live facts.

---

# 19. Minimum Technical Stack

The minimum recommended stack is a **single TypeScript web application** with a small server-side application layer.

## 19.1 Frontend + application shell

**Next.js + TypeScript**

### Why

- one deployable application;
- frontend and server-side application logic can live together;
- straightforward server-side API access for secrets;
- strong fit for the single-workspace MVP;
- avoids introducing a separate frontend and backend deployment.

### Simpler alternative

A single-page frontend with a small Node server is also sufficient. The reason to prefer Next.js is not functionality the product requires; it is reduced project wiring for a small full-stack web app.

## 19.2 Validation / schemas

**Zod or equivalent TypeScript runtime schema library**

### Why

The system has multiple structured contracts — Trade, MarketState, Thesis, ScenarioResult, DecisionArtifact. Runtime validation is valuable at the boundaries between user input, external data, LLM output, and deterministic calculations.

### Simpler alternative

Handwritten TypeScript types alone.

### Decision

Use runtime validation because malformed LLM or external data can directly corrupt the Decision Artifact. This is one of the few small dependencies that materially improves reliability.

## 19.3 LLM access

**One LLM provider through a server-side adapter**

The product should not hard-code the conceptual architecture around multiple models or agents.

### Why

The vertical slice needs one reasoning model capable of structured extraction, evidence synthesis, challenge generation, and concise explanation.

### Simpler alternative

Direct SDK calls without an adapter.

### Decision

A very thin provider wrapper is preferable so the application can change model/provider without changing the product contract. This is an implementation seam, not an agent framework.

## 19.4 Data access

**Direct HTTP/API clients from the server-side application layer.**

Use Bitget's official public API for market data and the smallest external data providers required for reference price and fresh events.

Do not create a separate data service.

## 19.5 Deterministic calculations

**Native TypeScript arithmetic for the MVP.**

A separate numerical service or Python engine is unnecessary for the defined calculations.

### Why

The MVP calculations are simple and auditable:

- basis;
- spread;
- exposure;
- P&L;
- scenario shocks;
- simple portfolio impact.

A Python/NumPy service would add cross-runtime deployment complexity without a demonstrated need.

## 19.6 Persistence

**None for MVP.**

Use transient in-memory/server request state and client-side state only where required by the active session.

## 19.7 Deployment

**One web deployment.**

The technical definition does not require separate services, containers, workers, queues, or event infrastructure.

---

# 20. Conceptual System Diagram

```text
                         USER
                           │
                           ▼
              ┌───────────────────────┐
              │   WEB APPLICATION     │
              │  Input / Workspace    │
              │  Decision Artifact    │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ APPLICATION LAYER     │
              │ Validate / Orchestrate│
              │ Assemble artifact     │
              └───────┬───────┬───────┘
                      │       │
          ┌───────────┘       └──────────────┐
          ▼                                  ▼
┌──────────────────────┐          ┌──────────────────────┐
│ EXTERNAL DATA        │          │ LLM REASONING        │
│                      │          │                      │
│ Bitget market API    │          │ Parse trade          │
│ Reference price      │          │ Extract thesis       │
│ BTC state            │          │ Challenge thesis     │
│ Fresh evidence/news  │          │ Interpret scenarios  │
└──────────┬───────────┘          │ Explain decision     │
           │                      └──────────┬───────────┘
           └──────────────┬──────────────────┘
                          ▼
              ┌───────────────────────┐
              │ DETERMINISTIC ENGINE  │
              │                       │
              │ Basis / spread        │
              │ Exposure / P&L        │
              │ Stress scenarios      │
              │ Portfolio impact      │
              │ Decision policy       │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ DECISION ARTIFACT     │
              │ Structured contract   │
              │ + provenance          │
              │ + limitations         │
              └───────────┬───────────┘
                          │
                          ▼
                         USER
```

## Architectural rule

The application layer orchestrates the workflow. It is not an autonomous agent.

There is one decision pipeline with explicit stages.

No microservices, queues, event buses, or multi-agent orchestration are required.

---

# 21. Vertical Slice Build Order

The implementation order should follow dependency risk rather than the original product-document order exactly.

## 1. Contract foundation

Define and validate the core objects:

- Trade;
- MarketState;
- Thesis;
- ScenarioResult;
- DecisionArtifact;
- Provenance.

These are the interfaces between every major subsystem.

## 2. Deterministic core

Implement and manually verify:

- basis;
- spread;
- position value/P&L;
- scenario calculations;
- portfolio impact;
- decision-policy rules.

This should exist before trusting any LLM-generated numbers.

## 3. Trade input + normalization

Build natural-language submission and normalized-trade validation.

Prove that ambiguous input is handled correctly.

## 4. Real Bitget market state

Connect the supported rToken and BTC market data.

Validate timestamps, symbol mapping, bid/ask and missing-data behavior.

## 5. Reference market state

Add the minimum reference price and market-status source required for rToken analysis.

## 6. Evidence retrieval

Add only the minimum fresh evidence/news retrieval needed to support thesis challenge.

## 7. Thesis extraction

Connect the LLM to the normalized trade and retrieved evidence.

Validate structured thesis output.

## 8. Thesis challenge

Add grounded counter-thesis generation and provenance links.

## 9. Stress engine integration

Connect the deterministic scenario engine to the real market state.

## 10. Thesis vs Position

Combine qualitative thesis assessment with deterministic position metrics.

## 11. Decision synthesis

Apply the deterministic policy and use the LLM only to explain the resulting decision.

## 12. Decision Artifact

Assemble the canonical artifact contract and render the complete result.

## 13. Provenance + limitations

Verify that every decisive claim can be traced and every material missing input is surfaced.

## 14. Failure handling

Test the critical failure states before visual polish.

## 15. Experience polish

Only after the entire slice works:

- improve transitions;
- tighten information hierarchy;
- improve mobile behavior;
- refine loading/progress communication;
- prepare demo reliability.

## Milestone rule

The first meaningful milestone is **one complete rNVDA analysis from input to Decision Artifact**.

Do not build breadth before that path works.

---

# 22. Technical MVP Boundary

## MUST BUILD

- single web application;
- runtime schemas for core contracts;
- natural-language trade input;
- trade normalization;
- real Bitget rToken market data;
- real BTC benchmark data;
- minimum reference price/status data;
- minimum fresh evidence retrieval;
- LLM thesis extraction;
- grounded thesis challenge;
- deterministic stress engine;
- thesis-quality assessment;
- position-quality assessment;
- basic portfolio-input path without requiring account integration;
- deterministic decision policy;
- structured Decision Artifact;
- provenance model;
- explicit limitations/failure handling;
- one complete rNVDA vertical slice.

## CAN MOCK

- portfolio/account retrieval;
- historical analogue data;
- unavailable secondary evidence during development;
- controlled reference-market fixtures for repeatable testing;
- paper trading;
- long-lived session storage;
- optional Bitget Agent Hub skill calls where direct retrieval is sufficient.

## SUPPORTING

- optional read-only Bitget account connection;
- additional cross-asset benchmark;
- richer source ranking;
- constrained historical analogue;
- paper-trading handoff after the core slice works.

## CUT

- autonomous trading;
- live order execution;
- synthetic hedge recommendation;
- price prediction;
- probabilistic forecasting;
- Monte Carlo;
- VaR / Expected Shortfall stack;
- full portfolio optimization;
- portfolio management;
- generic AI chat destination;
- full market terminal;
- custom MCP infrastructure;
- custom multi-agent orchestration;
- background monitoring platform;
- database-backed history product;
- behavioral journal;
- microservices / queue / event-bus infrastructure.

---

# 23. Technical North Star

> **The smallest trustworthy system is the one that can take a real Bitget trade idea, reconstruct only the state needed to understand it, challenge the trader's reasoning, deterministically show how the position can fail, and return a traceable Decision Artifact without pretending to predict the market or trade autonomously.**


