# B01 — Product Foundation

## 1. Product Identity

Bitget AI Trading Desk is a **pre-trade decision-support product for crypto-native Bitget traders**, initially focused on tokenized U.S. equities and the unusual risks created when those assets remain tradable while their underlying U.S. markets are closed. The product takes a specific proposed trade, reconstructs the relevant market state, extracts and examines the trader's thesis, deliberately challenges it, stress-tests the proposed position, considers relevant portfolio exposure, and produces a structured decision artifact that helps the trader decide whether to proceed, wait, reduce, or reject the trade. It is not a generic AI trading assistant, research chatbot, trading terminal, or portfolio manager.

## 2. Product Thesis

Crypto-native Bitget traders can make poor trade decisions even when their underlying market thesis is reasonable because **market state, token microstructure, evidence, and portfolio exposure are often evaluated separately rather than as one decision**. This is especially relevant for tokenized U.S. equities, where 24/7 token trading can continue while the underlying market is closed. Bitget AI Trading Desk addresses this by reconstructing the proposed trade as a decision, challenging its assumptions, stress-testing the actual position, and making the consequences and uncertainty explicit before the trader acts.

## 3. Primary User

The primary user is a **crypto-native retail trader already active on Bitget who is beginning to trade tokenized U.S. equities alongside crypto exposure**.

This user:

- already trades crypto and is comfortable making decisions in a 24/7 market;
- understands basic trading concepts such as position size, entry, direction, and risk;
- is willing to express a reason or thesis for a proposed trade;
- may hold crypto and equity-linked exposure at the same time;
- does not currently have a simple, unified process for checking thesis quality and position risk before acting;
- is most likely to use the product when considering a meaningful new position, especially during off-hours or unusual market conditions.

The user is **not** primarily looking for autonomous trading, guaranteed signals, a prediction engine, a general market-news chatbot, or a full professional trading terminal.

## 4. Core Job

> **Stress-test a trade I am about to make before I commit money to it.**

The product is hired to improve the quality of the decision immediately before action, not to generate a constant stream of market commentary or trading ideas.

## 5. Core Problem

The underlying problem is **decision fragmentation**.

A trader can form a reasonable thesis and still make a poor trade because the decision is assembled from disconnected pieces:

- the asset's current market state;
- the relationship between a tokenized asset and its reference asset;
- relevant evidence and events;
- the assumptions behind the thesis;
- the conditions that could invalidate it;
- the size and structure of the proposed position;
- the trader's existing related exposure.

Existing tools can provide many of these pieces individually. The problem is not simply a lack of information or an excess of information. The problem is that the trader still has to **manually turn those pieces into one coherent pre-trade decision**.

The product therefore does not exist to give the trader more information for its own sake. It exists to reduce the gap between **"I have a trade idea"** and **"I understand the decision I am about to make."**

## 6. Product Promise

### What the product promises

> **Before you act, the desk shows you what your thesis misses, how the proposed position can fail, and what would change the decision.**

The promise is deliberately limited to decision support. The product aims to make the reasoning and consequences around a proposed trade more visible and structured.

### What the product does not promise

The product does **not** promise:

- investment advice or a guaranteed recommendation;
- accurate prediction of future prices;
- certainty about market outcomes;
- guaranteed risk reduction;
- profitable trades;
- autonomous execution;
- autonomous trading decisions;
- a substitute for the user's own judgment and responsibility.

Any verdict such as **Proceed, Wait, Reduce, or Reject** is a product-generated decision-support conclusion based on the available evidence, calculations, and stated scenarios. It is not presented as a guaranteed or personalized investment instruction.

## 7. Product Principles

### 7.1 Evidence before narrative

Important conclusions should be grounded in identifiable evidence before they are presented as a story. The system should make it possible to distinguish what is known from what is inferred.

**In practice:** conclusions should be traceable to current data, retrieved sources, explicit calculations, or clearly stated assumptions.

### 7.2 Challenge before confirmation

The product should actively search for reasons a proposed trade may be wrong instead of optimizing only for confirmation of the user's thesis.

**In practice:** every meaningful decision should surface a strong counter-thesis, weak assumptions, or contradictory evidence where available.

### 7.3 Scenario before prediction

The product should reason about explicit possible conditions rather than pretending to know the future.

**In practice:** use statements such as "under this scenario" and "if this changes" rather than unsupported probability or price forecasts.

### 7.4 Position before generic asset analysis

The product evaluates the **proposed trade**, not merely the underlying asset.

**In practice:** position size, existing exposure, liquidity, basis, and scenario loss matter alongside the thesis about the asset itself.

### 7.5 Deterministic numbers

Where the product presents a numerical result, calculations should come from deterministic logic and explicit inputs rather than from the language model's arithmetic.

**In practice:** P&L, basis, exposure, concentration, and scenario impacts are calculated from known values and disclosed assumptions.

### 7.6 Transparent provenance

Users should be able to understand where important information came from and when it was observed.

**In practice:** relevant evidence carries source and timestamp information, and the product distinguishes source facts from generated interpretation.

### 7.7 Decision over conversation

The product's primary deliverable is a useful decision artifact, not a long AI conversation.

**In practice:** the final result should remain useful after the chat or analysis session ends and should be understandable as a standalone record of the decision.

### 7.8 Explicit uncertainty

Unknowns, stale information, weak evidence, conflicting sources, and model limitations should be surfaced rather than hidden behind confident language.

**In practice:** the system should be able to say that a conclusion is limited because an input is missing, stale, conflicting, or not directly observable.

### 7.9 Minimum necessary complexity

Every data source, metric, scenario, or feature must justify its place by improving the user's decision.

**In practice:** the MVP should prefer a small set of decision-relevant inputs and scenarios over a broad but shallow trading terminal.

## 8. Core Product Loop

The canonical workflow is:

**TRADE IDEA**  
↓  
**RECONSTRUCT MARKET STATE**  
↓  
**DECOMPOSE THESIS**  
↓  
**CHALLENGE THESIS**  
↓  
**STRESS POSITION**  
↓  
**CHECK PORTFOLIO IMPACT**  
↓  
**DECIDE**  
↓  
**DEFINE WHAT CHANGES THE DECISION**

Evidence is not a separate standalone stage. Relevant evidence is gathered and used throughout the workflow.

### Stage 1 — Trade Idea

**Purpose:** Establish exactly what the user is considering.

**Input:** Asset, proposed direction, proposed position size, and trader thesis. Existing relevant holdings and time horizon may be supplied when available.

**Output:** A normalized proposed trade with its stated rationale.

**What the system does:** Interprets the user's natural-language idea and identifies missing information that materially affects the analysis.

**What the user does:** States what they are considering and why.

### Stage 2 — Reconstruct Market State

**Purpose:** Establish the minimum current context required to evaluate the decision.

**Input:** Proposed trade plus relevant live/current data.

**Output:** A compact market-state picture covering token/reference relationship, market status, liquidity, relevant cross-asset conditions, and major fresh events.

**What the system does:** Retrieves current information, calculates required state metrics, and timestamps the observations.

**What the user does:** Reviews the reconstructed state and corrects any material misunderstanding.

### Stage 3 — Decompose Thesis

**Purpose:** Turn an informal trade rationale into an explicit thesis that can be examined.

**Input:** User thesis plus relevant evidence.

**Output:** Thesis statement, assumptions, supporting evidence, and key dependency conditions.

**What the system does:** Extracts the logic of the trade and distinguishes claims from assumptions.

**What the user does:** Confirms that the extracted thesis represents what they actually believe.

### Stage 4 — Challenge Thesis

**Purpose:** Deliberately test whether the thesis survives contrary evidence and alternative explanations.

**Input:** Thesis, assumptions, market state, and relevant evidence.

**Output:** Strongest counter-thesis, vulnerable assumptions, and material evidence against the trade.

**What the system does:** Generates and explains adversarial challenges rather than simply reinforcing the original view.

**What the user does:** Evaluates whether the challenge exposes a genuine weakness or an irrelevant objection.

### Stage 5 — Stress Position

**Purpose:** Test the consequences of explicit adverse conditions on the proposed trade.

**Input:** Normalized position, market state, and predefined scenario assumptions.

**Output:** Estimated position impact for each relevant scenario.

**What the system does:** Applies deterministic shocks and calculates the resulting position consequences.

**What the user does:** Assesses whether the proposed trade remains acceptable under those conditions.

### Stage 6 — Check Portfolio Impact

**Purpose:** Determine whether the proposed trade changes the user's existing risk in a material way.

**Input:** Position stress results plus relevant existing holdings/exposure.

**Output:** Estimated portfolio-level impact, concentration, and relevant overlap or correlation where supported.

**What the system does:** Connects the proposed trade to available portfolio context and calculates decision-relevant exposure effects.

**What the user does:** Provides or verifies the relevant portfolio context.

### Stage 7 — Decide

**Purpose:** Turn the analysis into a clear decision-support conclusion.

**Input:** Market state, thesis, challenge, stress results, and portfolio impact.

**Output:** **Proceed / Wait / Reduce / Reject** plus the principal reason.

**What the system does:** Synthesizes the evidence and calculations into a concise decision conclusion.

**What the user does:** Makes the actual trading decision.

### Stage 8 — Define What Changes the Decision

**Purpose:** Prevent the analysis from becoming static or falsely certain.

**Input:** Decision, thesis dependencies, and current uncertainties.

**Output:** Invalidation/change conditions and the most important things to monitor.

**What the system does:** Identifies conditions that would materially alter the conclusion.

**What the user does:** Uses those conditions to decide what matters after the analysis.

## 9. Decision Artifact

The canonical output is a **Decision Artifact**. It is a structured record of the decision-support process and must remain useful after the analysis session ends.

### 9.1 Decision Summary

**Purpose:** Give the user the conclusion immediately.

**Required information:**
- proposed trade;
- verdict: Proceed / Wait / Reduce / Reject;
- concise primary reason.

**Optional information:**
- relevant time horizon;
- one-line key uncertainty.

**Must never appear:**
- unsupported certainty claims;
- a guaranteed-profit statement;
- an unexplained score presented as objective truth;
- a disguised autonomous order instruction.

### 9.2 Market State

**Purpose:** Show the current conditions that materially affect the decision.

**Required information:**
- token price where applicable;
- reference price where applicable;
- basis/divergence where applicable;
- reference-market status;
- token-market status;
- liquidity condition;
- relevant cross-asset conditions;
- major fresh events materially relevant to the trade.

**Optional information:**
- additional risk proxy;
- relevant volatility or correlation context where justified.

**Must never appear:**
- an oversized market terminal;
- irrelevant indicators included merely for completeness;
- stale data presented as current.

### 9.3 Thesis

**Purpose:** Make the trader's actual reasoning explicit.

**Required information:**
- thesis statement;
- key assumptions;
- supporting evidence;
- evidence strength or quality explanation.

**Optional information:**
- time horizon;
- secondary supporting factors.

**Must never appear:**
- AI-generated reasons silently substituted for the user's actual rationale;
- unsupported claims presented as evidence.

### 9.4 Challenge

**Purpose:** Provide the strongest credible case against the proposed trade.

**Required information:**
- strongest counter-thesis;
- vulnerable assumptions;
- relevant contradictory or cautionary evidence.

**Optional information:**
- secondary alternative explanations;
- unresolved information conflicts.

**Must never appear:**
- fabricated evidence;
- contrarian arguments created merely to look adversarial;
- arbitrary "bear case" filler.

### 9.5 Stress Scenarios

**Purpose:** Show what happens to the proposed position under explicit adverse conditions.

**Required information:**
- scenario assumption;
- estimated position impact;
- estimated portfolio impact where portfolio context exists;
- principal risk exposed.

**MVP scenarios:**
1. Market risk — relevant underlying or sector declines materially.
2. Crypto contagion — broader crypto risk declines while the token remains tradable.
3. Token microstructure — basis widens and/or liquidity deteriorates.
4. Combined shock — multiple adverse conditions occur together.

A fifth **Thesis Failure** scenario may be used where the trader's key catalyst or assumption can be expressed clearly enough to test.

**Optional information:**
- additional user-relevant stress assumptions.

**Must never appear:**
- invented probabilities;
- forecast prices presented as known outcomes;
- scenario assumptions hidden inside calculations;
- numerical precision unsupported by the inputs.

### 9.6 Thesis vs Position

**Purpose:** Separate the quality of the idea from the quality of the proposed trade structure.

**Required information:**
- **Thesis quality:** whether the underlying idea is reasonably supported;
- **Position quality:** whether the specific size and structure of the trade are sensible given the state, exposure, liquidity, basis, and stress results.

**Optional information:**
- principal factor driving the difference between the two judgments.

**Must never appear:**
- a single composite score that conceals the distinction;
- an implication that a strong thesis automatically makes a good position.

### 9.7 Change Conditions

**Purpose:** Define what could materially change the decision.

**Required information:**
- invalidation conditions;
- important conditions to monitor;
- what would materially change the current conclusion.

**Optional information:**
- priority/order of monitoring conditions.

**Must never appear:**
- false precision around timing;
- promises that monitoring will guarantee a correct future decision.

### 9.8 Evidence & Provenance

**Purpose:** Make the basis of the analysis inspectable.

**Required information:**
- source or origin;
- timestamp;
- classification of important information as observed fact, calculated metric, scenario assumption, or AI interpretation.

**Optional information:**
- source-quality notes;
- conflicting-source explanation.

**Must never appear:**
- fabricated citations or source claims;
- unlabelled model assumptions presented as facts;
- stale evidence represented as live state.

## 10. Product Boundaries

### IN SCOPE

The MVP is responsible for:

- natural-language proposed trade input;
- Bitget-connected or Bitget-relevant market state;
- token/reference/basis awareness for supported tokenized equities;
- the minimum relevant liquidity and market-status context;
- relevant evidence and event retrieval with provenance;
- thesis extraction and assumption identification;
- adversarial thesis challenge;
- deterministic position stress testing;
- basic portfolio context and relevant portfolio impact;
- explicit Thesis vs Position assessment;
- structured Decision Artifact;
- uncertainty, invalidation, and change conditions;
- meaningful use of Bitget AI capabilities within the decision workflow.

### OUT OF SCOPE FOR THE HACKATHON

The product will deliberately not attempt to become:

- an autonomous trading system;
- a live order-execution engine;
- a price-prediction engine;
- a probabilistic Monday-gap forecaster;
- a full portfolio management platform;
- a full institutional risk platform with unnecessary VaR/Expected Shortfall breadth;
- a generic AI trading chatbot as the primary experience;
- a general-purpose market research terminal;
- a full trading terminal or charting replacement;
- an automated trading agent that acts without human decision authority;
- a core synthetic-hedging recommendation system.

### FUTURE / CONDITIONAL

These capabilities may be considered later, but they are not part of the MVP promise:

- constrained historical analogues where the matching methodology is defensible;
- richer correlation and factor analysis;
- additional market-state signals;
- paper-trading handoff;
- decision history and review;
- additional Bitget AI research capabilities;
- optional hedge-candidate analysis after the core decision workflow has been validated.

### Explicit handling of requested boundary areas

**Price prediction:** Not an MVP capability. Future scenarios may describe possible outcomes, but the product does not claim to know future prices or attach unsupported probabilities to them.

**Autonomous execution:** Not in scope. The user remains responsible for the actual trading action.

**Portfolio management:** Limited to decision-relevant portfolio context and impact analysis. The MVP does not attempt to manage or optimize the portfolio.

**Synthetic hedging:** Removed from MVP core. Future versions may explore hedge candidates as optional scenario analysis only after methodology and trust are sufficiently validated.

**Historical analogues:** Not required for a successful MVP decision. They are conditional on a defensible matching method.

**Generic market research:** Not the product's job. Research is performed only to support a specific trade decision.

**Generic chat:** Conversation may support input and explanation, but it is not the product's primary output or interaction model.

**Market monitoring:** Not a primary MVP loop. The product defines what should be monitored but does not require a full continuous monitoring platform.

**Automated trading agents:** Explicitly out of scope. AI can analyze and synthesize; it does not autonomously trade.

**Full trading terminal functionality:** Explicitly out of scope. The product is a decision layer, not a replacement for the exchange or a charting platform.

## 11. Trust Model

Trust is earned by making the source and status of each important statement visible.

Every material piece of information should belong to one of four categories.

### 11.1 Observed Fact

Information retrieved from a source or directly observed from a connected market/data source.

**Example:** "The token is trading at X while the U.S. reference market is closed."

**Requirements:** source, timestamp, and current/stale status where relevant.

### 11.2 Calculated Metric

A deterministic result produced from known inputs.

**Example:** "At the proposed position size, a 5% asset decline corresponds to approximately $X position loss."

**Requirements:** inputs and calculation basis should be inspectable enough to understand the result.

### 11.3 Scenario Assumption

A deliberately hypothetical condition used for stress testing.

**Example:** "Assume the reference asset falls 4%."

**Requirements:** clearly labeled as hypothetical and never presented as a forecast.

### 11.4 AI Interpretation

Reasoning, synthesis, classification, or explanation generated by the AI from the available evidence and calculations.

**Example:** "This weakens the trade because the thesis depends heavily on continued sector momentum while the proposed position increases correlated exposure."

**Requirements:** presented as interpretation, not as an observed fact.

### Handling missing information

If a required input is missing, the system should:

1. use a clearly stated non-destructive assumption only when reasonable and low-risk;
2. ask for the smallest additional input when the missing information materially affects the conclusion; or
3. state that the analysis is limited when the missing information cannot reasonably be recovered.

### Handling conflicting information

Conflicting sources should not be silently merged into one apparent truth.

The system should identify the conflict, show the relevant source/timestamp context, and explain how the disagreement affects the decision.

### Handling stale information

Information that may materially affect the decision should carry a freshness context. Stale observations should not be presented as though they represent the current market state.

### Handling uncertainty

The product should prefer an explicit uncertainty statement over a confident but unsupported conclusion. Uncertainty is part of the output, not a failure to produce one.

### False-precision rule

The product must not manufacture precision to make the analysis appear more sophisticated. In particular, it should not invent probabilities, exact future prices, precise hedge ratios, or institutional-style risk scores unless the underlying methodology and inputs justify them.

## 12. Differentiation

The product's differentiation is **workflow-level, not model-level**.

ChatGPT can reason. TradingView can visualize markets. Bitget already provides AI-enabled market and trading capabilities. Research platforms can retrieve and summarize financial information. None of those capabilities alone is the product we are defining.

The product's distinctive unit is the **pre-trade decision**:

> **proposed trade → reconstructed state → explicit thesis → adversarial challenge → position stress → portfolio impact → structured decision artifact**

The important difference is that the system does not merely answer a market question or summarize information. It reconstructs the user's intended action and asks whether **that specific trade**, at **that specific size**, under **that current market state**, survives its own assumptions and relevant stress conditions.

The strongest defensible asset is therefore the **decision model and workflow**. AI, market data, Bitget integration, retrieval, and stress calculations are enabling components rather than the differentiation themselves.

This differentiation is strongest in the tokenized-equity wedge because 24/7 token trading and closed underlying markets make market state, basis, liquidity, cross-asset conditions, and portfolio exposure unusually important to the decision.

## 13. Success Criteria

The MVP is successful when all of the following are true for a supported trade scenario:

1. A user can submit a real proposed trade without first completing a complex financial form.
2. The system reconstructs the minimum relevant current market state.
3. The system identifies and states the trader's actual thesis and key assumptions.
4. The system presents a credible counter-thesis rather than only reinforcing the user's view.
5. The system stress-tests the proposed position using explicit, deterministic scenario assumptions.
6. The system distinguishes **Thesis quality** from **Position quality**.
7. The system considers relevant portfolio impact when portfolio context is available.
8. The system produces a structured Decision Artifact rather than only a conversational response.
9. The user can understand where important conclusions came from.
10. Facts, calculations, assumptions, and AI interpretations are clearly distinguishable.
11. Missing, stale, conflicting, or uncertain information is surfaced rather than hidden.
12. The product demonstrates a meaningful Bitget-specific workflow rather than merely displaying a Bitget logo or generic exchange data.
13. The resulting analysis is useful without requiring the product to claim predictive certainty, autonomous execution, or guaranteed risk reduction.

## 14. Product North Star

> **Before a Bitget trader commits to a proposed trade, the product must turn that trade into a transparent, adversarial, scenario-tested decision the trader can understand and own.**
