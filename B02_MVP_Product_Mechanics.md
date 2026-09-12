# B02 — MVP Product Mechanics

## 1. MVP USER ENTRY

The MVP begins from a simple intent:

> **"I'm thinking about making this trade. Stress-test it."**

The user should be able to enter the trade in ordinary language. The product then extracts the structured information it needs rather than forcing the user through a large trading form.

### Required

The minimum required information is:

- **Asset** — what the user intends to trade.
- **Direction** — buy/long or sell/short.
- **Proposed position size** — the amount or quantity the user intends to commit.
- **Trader thesis/reason** — why the user wants to make the trade.

Without these four elements, the system cannot construct the decision it is being asked to stress-test.

### Optional

The user may also provide:

- **Entry price** — if different from the current market price or if the user has a specific planned entry.
- **Time horizon** — for example, intraday, several days, or several weeks.
- **Relevant existing exposure** — assets or positions that materially overlap with the proposed trade.
- **User-stated assumptions** — conditions the trader already believes must hold for the thesis to work.

Optional information should improve the analysis, not determine whether the user can begin.

### System-derived

The product should retrieve or calculate wherever possible:

- current/observed market price;
- asset type and supported reference relationship;
- reference price where applicable;
- current market/session status;
- token/reference basis where applicable;
- liquidity indicators;
- relevant cross-asset context;
- fresh relevant events/evidence;
- deterministic scenario impacts;
- derived position exposure.

### Input behavior

The system should normalize the user's statement and identify missing information.

It should only ask a follow-up question when the missing value materially changes the decision. It should not ask for information that can be derived reliably from available data.

The user should never be required to know the product's internal terminology before starting.

---

## 2. TRADE NORMALIZATION

The user's natural-language proposal is converted into a canonical **Normalized Trade**. This is an internal product object that gives every later stage the same starting point.

### Canonical fields

| Field | Required | Definition |
|---|---|---|
| Asset | Yes | The instrument the user proposes to trade. |
| Asset type | System-derived | Tokenized equity, crypto asset, or another supported type. |
| Direction | Yes | Long/buy or short/sell. |
| Position size | Yes | Proposed capital amount or trade quantity, normalized to a common representation. |
| Proposed entry | No | User-specified entry; otherwise current observed market price may be used as the working reference and explicitly labeled. |
| Time horizon | No | User's intended holding period when supplied. |
| Thesis | Yes | The user's stated reason for making the trade. |
| Relevant existing exposure | No | Existing holdings/exposure supplied or retrieved when available and permitted. |
| User-stated assumptions | No | Conditions the user explicitly says must be true. |

### Normalization rules

1. The system must preserve the user's meaning rather than inventing a more sophisticated thesis.
2. A missing optional field must not be silently converted into a fact.
3. If a working value is inferred or derived, its source must be recorded.
4. If position size is provided only in quantity, the system may calculate notional value from the relevant observed price.
5. If no entry is given, the analysis must explicitly state that the current observed price is being used as the working entry/reference for scenario calculations.
6. If direction or position size is ambiguous, the system must resolve it before stress testing.

The normalized trade is the single source of truth for the remainder of the analysis.

---

## 3. MARKET STATE REQUIREMENTS

The MVP does not attempt to reconstruct the entire market. It reconstructs only the state that can materially change the decision.

### 3.1 Token price

**What it is:** Current observed price of the traded tokenized asset.

**Why needed:** It establishes the actual market price at which the proposed position is being considered and is required for position and scenario calculations.

**Source/type:** Retrieved observation.

**Applies:** All supported trades; especially important for tokenized equities.

**If unavailable:** The product cannot produce a current-price-dependent stress test. It should request a usable price or state that a live analysis cannot be completed.

### 3.2 Reference price

**What it is:** Current or latest available reference price for the underlying asset where a supported token/reference relationship exists.

**Why needed:** It allows the product to distinguish the token's trading condition from the underlying reference market.

**Source/type:** Retrieved observation.

**Applies:** Conditionally, for tokenized equities or other supported assets with a defined reference relationship.

**If unavailable:** Continue with token-only analysis where safe, but explicitly mark reference-dependent analysis as unavailable rather than inventing a reference price.

### 3.3 Basis/divergence

**What it is:** The observable difference between the token price and its reference price, expressed using the product's defined basis calculation.

**Why needed:** A meaningful token/reference divergence can materially affect the quality of the proposed position, particularly when the underlying market is closed.

**Source/type:** Calculated metric from observed prices.

**Applies:** Conditionally for tokenized/reference-linked assets.

**If unavailable:** Omit the basis calculation and state why.

### 3.4 Reference-market status

**What it is:** Whether the relevant underlying/reference market is open, closed, or in another relevant session state.

**Why needed:** The same token price can carry different decision implications depending on whether the reference market can currently provide continuous price discovery.

**Source/type:** Retrieved/derived market-status observation.

**Applies:** All trades where a reference market exists; particularly important for tokenized equities.

**If unavailable:** State that reference-session context is unknown and reduce confidence in any off-hours interpretation.

### 3.5 Token-market status

**What it is:** Whether the token itself is currently tradable/active and what relevant session condition applies.

**Why needed:** The core wedge depends on cases where the token remains tradable while the underlying market is closed.

**Source/type:** Retrieved observation.

**Applies:** Conditionally for tokenized assets.

**If unavailable:** Do not make a closed-reference/off-hours claim.

### 3.6 Liquidity

**What it is:** A minimum useful measure of trading conditions, such as spread and available market depth or an equivalent supported liquidity classification.

**Why needed:** A theoretical stress result may be misleading if the proposed position cannot reasonably be entered or exited under the observed market conditions.

**Source/type:** Retrieved observations and, where applicable, deterministic derived metrics.

**Applies:** All supported trades, with increased importance for tokenized/off-hours conditions.

**If unavailable:** Continue with price-based analysis but explicitly mark liquidity risk as unassessed. The product must not claim the position is practically executable.

### 3.7 Relevant cross-asset conditions

**What it is:** A small set of market variables that materially relate to the trade, beginning with broad crypto risk and a relevant equity/sector proxy where justified.

**Why needed:** The product evaluates the proposed position in its actual cross-market environment rather than in isolation.

**Source/type:** Retrieved observations, with deterministic relationship calculations only where supported.

**Applies:** Conditionally based on asset and thesis.

**If unavailable:** The product may continue but should omit cross-asset conclusions that depend on missing inputs.

### 3.8 Fresh relevant events

**What it is:** Recent news, announcements, scheduled events, or other evidence that can materially affect the stated thesis.

**Why needed:** A trader's thesis may be invalidated or weakened by information that appeared after the thesis was formed.

**Source/type:** Retrieved evidence with source and timestamp.

**Applies:** Any trade where current events could materially affect the thesis.

**If unavailable:** State that fresh-event coverage is incomplete; do not imply that no relevant event exists.

### Market-state minimum

For a tokenized-equity trade, the minimum state required to call the analysis complete is:

**token price + reference price where available + market status + minimum liquidity context + relevant current evidence.**

Basis and cross-asset analysis should be included when their inputs are available and decision-relevant.

---

## 4. THESIS EXTRACTION

The user's explanation is converted into an explicit thesis without silently expanding it.

### Required thesis structure

The system extracts:

**Thesis** — what the trader believes will make the trade worthwhile.

**Assumptions** — conditions that must hold for the thesis to work.

**Supporting evidence** — evidence supplied by the user or retrieved by the system that directly supports the thesis.

**Dependencies** — important external conditions the thesis relies on.

**Invalidation conditions** — observable developments that would materially weaken or invalidate the thesis.

### Extraction behavior

The AI should identify relationships such as:

> "I think X because Y, assuming Z remains true."

It must preserve the distinction between:

- what the user actually stated;
- what evidence supports it;
- what the system infers as a dependency;
- what remains unknown.

### Vague thesis behavior

If the user gives a vague reason such as:

> "NVDA looks strong."

the system should not invent a detailed thesis and proceed as though the user stated it.

Instead it should:

1. extract the minimal stated thesis;
2. identify the missing causal reasoning;
3. ask for the smallest clarification needed when the lack of specificity would materially weaken the challenge;
4. proceed only with clearly labeled limitations when the analysis can still be useful.

A vague thesis should produce a weaker analysis, not a fabricated stronger one.

---

## 5. THESIS CHALLENGE

The adversarial stage is not a generic "devil's advocate" prompt. Its job is to find the **strongest decision-relevant reason the proposed trade could be wrong**.

### What the system challenges

The challenge should target:

1. **Critical assumptions** — assumptions on which the thesis depends.
2. **Contradictory evidence** — credible evidence that conflicts with the thesis.
3. **Alternative explanations** — another explanation for the observed market behavior.
4. **Market-state mismatch** — cases where the thesis may make sense for the underlying asset but the current token/liquidity/session conditions make the trade poor.
5. **Position mismatch** — cases where the thesis may be sound but the proposed size or exposure makes the trade unsuitable.

### How the counter-thesis is formed

The system should prioritize challenges using this order:

**direct contradictory evidence → failure of a critical assumption → material market-state risk → plausible alternative explanation.**

The strongest challenge is not necessarily the most negative argument. It is the argument most capable of changing the decision.

### Credible challenge requirements

A challenge should have at least one of:

- identifiable supporting evidence;
- a directly observable market condition;
- a clearly stated logical consequence of the user's assumptions;
- a deterministic position/risk consequence.

The system must not generate a bear case merely to satisfy an adversarial template.

### No meaningful counter-thesis

Sometimes the evidence does not support a strong counterargument.

In that case the product should say so explicitly:

> **"No strong contradictory evidence found in the available data."**

It may still identify residual uncertainty, but it must not manufacture opposition.

---

## 6. STRESS TEST ENGINE

The MVP stress test applies explicit assumptions to the proposed position and calculates consequences. It does not predict which scenario will happen.

Every scenario contains:

**Assumption → Inputs → Deterministic calculation → Position impact → Portfolio impact where available → Interpretation**

### Scenario 1 — Market Risk

**Trigger/assumption:** The relevant underlying asset, index, or sector experiences a material adverse move.

**Required inputs:** Proposed position, working entry/current price, and a defined adverse price shock.

**Calculation:** Recalculate position value/P&L under the assumed price move.

**Output:** Estimated position gain/loss and, where portfolio context exists, estimated portfolio impact.

**Interpretation:** Shows how vulnerable the proposed position is to direct market movement.

**Application:** Universal, provided the asset has an applicable price series.

### Scenario 2 — Crypto Contagion

**Trigger/assumption:** Broad crypto risk deteriorates materially while the traded token remains exposed to the crypto trading environment.

**Required inputs:** Relevant crypto market observation and a defined adverse shock. A defensible relationship to the traded position must exist before translating the shock into position impact.

**Calculation:** Where a supported relationship is available, apply the defined shock to the relevant exposure or use a conservative linked scenario. Do not invent a beta.

**Output:** Estimated consequence to the position under the explicit contagion assumption.

**Interpretation:** Shows whether the proposed trade is exposed to broader crypto risk beyond its nominal underlying thesis.

**Application:** Conditional. Especially relevant to tokenized equities traded in a crypto-native venue.

### Scenario 3 — Token Microstructure

**Trigger/assumption:** Token/reference basis widens and/or liquidity deteriorates while the trade remains open.

**Required inputs:** Token/reference relationship, observed spread/depth or equivalent liquidity inputs, and explicit basis/liquidity shock assumptions.

**Calculation:** Apply the defined basis/liquidity shock and calculate the resulting mark-to-market or execution-relevant consequence that can be supported by available inputs.

**Output:** Estimated additional exposure/cost or reduced exit quality.

**Interpretation:** Shows how the trade can fail even when the underlying asset thesis remains broadly correct.

**Application:** Conditional for tokenized/reference-linked assets and especially relevant during closed-reference periods.

### Scenario 4 — Combined Shock

**Trigger/assumption:** Multiple adverse conditions occur together, such as underlying weakness plus crypto risk deterioration plus poorer token liquidity.

**Required inputs:** Inputs required by the applicable component scenarios.

**Calculation:** Apply the explicitly defined shocks together and calculate the resulting deterministic position/portfolio consequence.

**Output:** Combined estimated impact and the dominant contributing risk.

**Interpretation:** Shows whether the proposed trade remains tolerable when multiple known vulnerabilities align.

**Application:** Universal where the required component inputs exist.

### Scenario 5 — Thesis Failure

**Trigger/assumption:** The user's key catalyst or critical thesis dependency fails.

**Required inputs:** Explicit thesis dependency and a sufficiently concrete failure condition.

**Calculation:** Quantitative calculation is used only where the failure condition can be translated into a supported market shock. Otherwise the result is qualitative.

**Output:** Which part of the thesis breaks and the resulting decision implication.

**Interpretation:** Tests the logic of the trade rather than only its market-price sensitivity.

**Application:** Conditional. Use when the thesis can be expressed clearly enough to test.

### Scenario rules

The MVP does not attach unsupported probabilities to these scenarios.

A scenario is presented as:

> **"Assume this happens. Here is what it would do to the proposed position."**

not:

> **"This is likely to happen."**

---

## 7. THESIS VS POSITION

The product must explicitly evaluate the trade on two separate dimensions.

## Thesis Quality

### Inputs

- user's stated thesis;
- assumptions;
- supporting evidence;
- contradictory evidence;
- relevant dependencies;
- invalidation conditions.

### Evaluation

The system determines whether the thesis is:

- reasonably supported;
- mixed/contested;
- weakly supported;
- or materially undermined.

This is primarily qualitative, grounded in evidence. It is not an arbitrary numerical score.

### Output

A concise judgment explaining:

> **"The idea itself appears stronger/weaker because..."**

## Position Quality

### Inputs

- proposed position size;
- entry/current reference price;
- market state;
- liquidity;
- token/reference basis where applicable;
- relevant existing exposure;
- scenario impacts.

### Evaluation

The system determines whether the specific trade structure appears:

- sensible under the observed conditions;
- sensitive but potentially manageable;
- poorly structured;
- or materially exposed to avoidable risk.

### Output

A concise judgment explaining:

> **"Even if the thesis is correct, this position is stronger/weaker because..."**

### How they affect the decision

The final decision considers both dimensions independently.

Examples:

**Strong thesis + strong position → Proceed may be reasonable.**

**Strong thesis + weak position → Wait or Reduce may be appropriate.**

**Weak thesis + acceptable position → the position does not rescue the underlying idea; Wait or Reject may be appropriate.**

**Weak thesis + weak position → Reject is strongly supported.**

These are decision patterns, not hard-coded verdict rules. No single thesis or position assessment automatically determines the final outcome.

---

## 8. PORTFOLIO CONTEXT

Portfolio context is **important but not required to begin the MVP analysis**.

The product is not a portfolio manager. It only needs enough context to answer:

> **"What does this proposed trade add to the risk I already have?"**

### Minimum portfolio context

The MVP needs only relevant existing exposure, not a full portfolio-management model.

The preferred input is:

- asset/exposure;
- approximate current value or quantity;
- where known, direction (long/short).

The user may provide only the positions relevant to the proposed trade.

### Bitget retrieval

Where a supported Bitget connection makes current holdings available, those holdings may be used as system-derived portfolio context.

The product must not require full account ingestion when a smaller relevant exposure set is enough to answer the decision.

### System calculations

The MVP calculates only decision-relevant effects such as:

- added notional exposure;
- concentration where it can be calculated reliably;
- overlapping/correlated exposure where supported;
- estimated portfolio impact under the chosen scenarios.

### When portfolio information is unavailable

The analysis can proceed.

The artifact must explicitly say that portfolio impact is **not assessed** rather than implying that no portfolio risk exists.

The final decision should rely more heavily on position-level analysis when portfolio context is absent.

---

## 9. DECISION SYNTHESIS

The verdict is a structured synthesis of the preceding analysis, not an unexplained AI score.

### Possible decisions

**PROCEED** — The available evidence and stress results do not reveal a material reason to avoid the proposed position under the user's stated assumptions.

**WAIT** — The trade may be reasonable, but a missing confirmation, unresolved uncertainty, market-state condition, or timing issue makes immediate action less defensible.

**REDUCE** — The thesis may remain viable, but the proposed size/exposure creates a materially weaker position than the idea itself justifies.

**REJECT** — The thesis is materially undermined, the position is structurally poor, or a critical risk makes the proposed trade unsuitable under the stated conditions.

### Inputs

The synthesis uses:

- normalized trade;
- market state;
- thesis quality;
- challenge findings;
- stress scenarios;
- portfolio impact where available;
- unresolved uncertainty;
- data quality/freshness.

### Decision logic

The system should reason in this order:

1. **Is the thesis sufficiently supported to remain actionable?**
2. **Does the current market state create a material problem for the thesis or position?**
3. **Does the proposed position survive the relevant stress scenarios?**
4. **Does existing exposure materially change the quality of the position?**
5. **Are there unresolved unknowns large enough to prevent a reliable conclusion?**

The product may synthesize these factors into a verdict, but it must explain which factors were decisive.

### Uncertainty handling

High uncertainty should normally move the decision toward **Wait** or toward a clearly qualified conclusion rather than being converted into a confident prediction.

A lack of evidence is not equivalent to evidence against the trade, but it is also not evidence in favor of the trade.

### User responsibility

The product provides analysis and a decision-support verdict. The user remains responsible for whether and how to trade.

---

## 10. CHANGE CONDITIONS

"What would change my mind?" is derived from the actual decision, not generated as generic monitoring advice.

### Sources of change conditions

The system derives them from:

- the trader's critical thesis assumptions;
- identified dependencies;
- strongest counter-thesis;
- key market-state risks;
- scenario assumptions;
- unresolved evidence conflicts.

### Required form

Each change condition should state:

**Condition → Why it matters → Decision impact**

Example:

> **Reference market moves materially against the thesis → the catalyst is no longer producing the expected underlying response → reassess or reject the trade.**

### Rules

Change conditions must be:

- specific to the trade;
- observable or definable;
- connected to a thesis dependency or decision risk;
- limited to the conditions that could materially change the conclusion.

They must not become an automatic monitoring/alert system in the MVP.

---

## 11. MVP DECISION ARTIFACT

The Decision Artifact is the canonical product output. It should be readable quickly and remain useful after the analysis session.

### 11.1 Decision Summary

**User sees:** Proposed trade, current verdict, and the one or two most important reasons.

**Calculated:** Position notional and basic consequence figures where relevant.

**AI-generated:** Concise synthesis of the decisive factors.

**Sourced:** Any current market condition referenced in the summary.

**Interactive:** May expose the supporting reasoning behind the verdict.

**Optional:** One key uncertainty.

### 11.2 Market State

**User sees:** Current token price, reference price where applicable, basis, market status, liquidity condition, and relevant cross-asset state.

**Calculated:** Basis and other deterministic state metrics.

**AI-generated:** Explanation of why the current state matters to this trade.

**Sourced:** Current observations and relevant events with timestamps.

**Interactive:** Source/provenance inspection and limited detail expansion.

**Optional:** Additional market variable when materially relevant.

### 11.3 Thesis

**User sees:** Their normalized thesis, key assumptions, dependencies, and strongest supporting evidence.

**Calculated:** None required beyond evidence-derived metrics already established elsewhere.

**AI-generated:** Thesis extraction and synthesis.

**Sourced:** Supporting evidence.

**Interactive:** User may inspect evidence or correct a material thesis interpretation before finalization.

**Optional:** Time horizon when supplied.

### 11.4 Challenge

**User sees:** Strongest counter-thesis, most vulnerable assumption, and relevant contradictory evidence.

**Calculated:** Deterministic consequences when the challenge depends on a measurable exposure.

**AI-generated:** Counter-thesis and interpretation.

**Sourced:** Contradictory evidence and timestamps.

**Interactive:** Evidence inspection and challenge rationale.

**Optional:** Secondary challenge if materially useful.

### 11.5 Stress Scenarios

**User sees:** A compact set of 4 core scenarios, each showing assumption, estimated position impact, portfolio impact where available, and principal risk.

**Calculated:** All quantitative scenario consequences.

**AI-generated:** Plain-language interpretation of why each scenario matters.

**Sourced:** Inputs used for the scenario calculations.

**Interactive:** Scenario assumptions may be inspectable; the product may allow a bounded assumption adjustment later without changing the underlying decision model.

**Optional:** Thesis-failure scenario.

### 11.6 Thesis vs Position

**User sees:** Separate judgments for thesis quality and position quality, with a concise explanation of each.

**Calculated:** Supporting metrics where applicable.

**AI-generated:** Qualitative assessment and comparison.

**Sourced:** Evidence and market-state inputs supporting the assessment.

**Interactive:** User may inspect why the two judgments differ.

**Optional:** A single primary factor explaining the gap between thesis and position.

### 11.7 Change Conditions

**User sees:** The specific conditions that would materially alter the current decision.

**Calculated:** Thresholds only where derived from explicit supported inputs.

**AI-generated:** Link between the condition and decision change.

**Sourced:** Underlying observations or evidence when relevant.

**Interactive:** May show the thesis dependency that created each condition.

**Optional:** Priority/order of conditions.

### 11.8 Evidence & Provenance

**User sees:** Source, timestamp, and classification for material evidence.

**Calculated:** Calculation inputs and derivations where necessary to understand the result.

**AI-generated:** Source synthesis and conflict explanation.

**Sourced:** All externally observed material facts.

**Interactive:** Source inspection and conflict/staleness details.

**Optional:** Source-quality notes.

### Artifact composition rule

The user should be able to understand:

**what the trade is → what the system found → what could break it → what happens under stress → whether the position is sensible → what would change the conclusion**

without reading a long AI essay.

---

## 12. FAILURE & EDGE CASES

### 12.1 Incomplete trade input

**Condition:** Asset, direction, position size, or thesis is missing/ambiguous.

**Behavior:** Ask only for the missing information required to construct the normalized trade. Do not begin a full analysis with material ambiguity.

### 12.2 Vague thesis

**Condition:** The user supplies a reason that does not contain enough causal content to challenge meaningfully.

**Behavior:** Preserve the stated thesis, identify the missing reasoning, and request minimal clarification only where necessary. Never fabricate the user's thesis.

### 12.3 Missing market data

**Condition:** One or more current market inputs are unavailable.

**Behavior:** Determine whether the missing input is decision-critical. Continue with the unaffected parts if possible; otherwise stop the affected analysis and explain why.

### 12.4 Stale data

**Condition:** A material observation is old enough that its use as current state is questionable.

**Behavior:** Mark it as stale, do not represent it as live, and reduce or qualify any conclusion depending on it.

### 12.5 Conflicting sources

**Condition:** Credible sources disagree on a material fact.

**Behavior:** Preserve the disagreement, show the relevant source/timestamp context, and explain how the conflict affects the decision. Do not collapse conflicting facts into one artificial value.

### 12.6 Unavailable reference price

**Condition:** The traded token exists, but a usable underlying/reference price is unavailable.

**Behavior:** Continue token-only analysis if meaningful, but omit basis/reference-dependent conclusions and disclose the limitation.

### 12.7 Illiquid token

**Condition:** Spread/depth or equivalent liquidity condition indicates poor trading quality.

**Behavior:** Treat liquidity as a position-level risk. Do not present a price-only stress result as though execution were guaranteed. If the proposed position cannot be meaningfully stressed because liquidity inputs are insufficient, say so.

### 12.8 Missing portfolio context

**Condition:** Relevant holdings are unavailable.

**Behavior:** Perform position-level analysis and explicitly mark portfolio impact as unassessed. Do not infer an empty portfolio.

### 12.9 Unsupported asset

**Condition:** The asset is not supported by the MVP's available market/reference/evidence capabilities.

**Behavior:** Clearly state that the product cannot reliably stress-test this trade and explain what is unsupported. Do not provide a generic analysis under the appearance of full product support.

### 12.10 No meaningful counter-thesis

**Condition:** Available evidence does not provide a credible challenge.

**Behavior:** State that no strong contradictory evidence was found. Surface residual uncertainties rather than manufacturing a bear case.

### 12.11 Scenario cannot be calculated reliably

**Condition:** Required deterministic inputs are missing or the scenario relationship is unsupported.

**Behavior:** Mark the scenario as unavailable or qualitative-only. Never substitute a made-up number.

### General failure rule

A partial but transparent analysis is preferable to a complete-looking analysis built on hidden assumptions.

---

## 13. THE SINGLE VERTICAL SLICE

The reference MVP scenario should demonstrate the product's unique value in the environment where its wedge is strongest.

### User

A crypto-native Bitget trader considering a tokenized U.S. equity position.

### Asset

**rNVDA** or the supported Bitget tokenized NVIDIA exposure used by the final demo environment.

### Market condition

A **weekend/off-hours period** in which the token remains tradable while the relevant U.S. equity market is closed.

### Trade idea

> **"I want to buy $2,000 of rNVDA because the latest NVIDIA/AI demand story makes me think the underlying will move higher when the U.S. market reopens. Stress-test this trade."**

### Thesis

The user believes a current NVIDIA/AI catalyst supports upside in the underlying and expects that view to justify entering the tokenized exposure before the U.S. market reopens.

The exact catalyst should come from the chosen demo evidence rather than being fabricated in advance.

### Relevant data

At minimum:

- current rNVDA token price;
- latest usable NVIDIA reference price;
- token/reference basis;
- U.S. equity market status;
- token market status;
- minimum liquidity context;
- relevant fresh NVIDIA/AI evidence;
- BTC/crypto context;
- relevant existing user exposure if available.

### Stress scenarios

1. **Underlying market shock** — NVIDIA/reference exposure falls materially.
2. **Crypto contagion** — broad crypto risk deteriorates while the token remains tradable.
3. **Token microstructure shock** — basis widens and/or liquidity deteriorates.
4. **Combined shock** — adverse underlying movement plus crypto deterioration plus weaker token liquidity.

A thesis-failure scenario may be added when the actual demo catalyst provides a clear invalidation condition.

### Expected challenge

The challenge should not simply say:

> "NVIDIA could go down."

The strongest expected challenge is likely to examine whether the user's thesis about the **underlying NVIDIA catalyst** is sufficient to justify taking **token exposure during a period when the underlying market is closed**, especially if token/reference basis or liquidity is unfavorable.

The actual challenge must be generated from current evidence and observed state.

### Expected decision artifact

The artifact should show:

- the proposed $2,000 rNVDA trade;
- the observed weekend/off-hours market state;
- the user's extracted thesis and assumptions;
- the strongest evidence against the thesis or against acting now;
- four explicit stress scenarios with deterministic consequences;
- separate thesis and position judgments;
- the conditions that would change the conclusion;
- complete provenance for material observations.

### Expected final decision

The demo should **not be scripted to force a particular verdict**.

The expected behavior is that the verdict emerges from the actual evidence, state, scenario results, and position context. For the demo to be convincing, the system should be capable of producing different verdicts when the underlying inputs materially change.

The reference scenario is therefore a test of the product's reasoning workflow, not a pre-written story disguised as analysis.

---

## 14. MVP FEATURE INVENTORY

### MUST BUILD

- Natural-language trade submission.
- Minimal trade normalization.
- Supported tokenized-equity market-state reconstruction.
- Current token price and reference price where applicable.
- Reference/token market status.
- Token/reference basis calculation.
- Minimum liquidity assessment.
- Relevant fresh evidence retrieval with provenance.
- Thesis extraction and assumption identification.
- Evidence-grounded adversarial challenge.
- Four deterministic stress scenarios.
- Basic relevant portfolio context.
- Separate Thesis Quality and Position Quality judgments.
- Decision synthesis into Proceed / Wait / Reduce / Reject.
- Trade-specific change conditions.
- Structured Decision Artifact.
- Fact/calculation/scenario/AI labeling.
- Missing/stale/conflicting-data handling.
- A complete rNVDA-style reference vertical slice for the hackathon demo.

### SUPPORTING

- User-supplied entry price handling when different from current price.
- User-supplied time horizon.
- Limited historical analogue when a clearly defensible match exists.
- Optional thesis-failure scenario.
- Richer but still decision-relevant correlation context.
- Basic decision history.
- Paper-trading handoff, only if the core workflow is already stable.

### CUT

- Autonomous execution.
- Live autonomous trading.
- Price prediction.
- Probabilistic Monday-gap forecasting.
- Unsupported probability scores.
- Core synthetic hedge recommendations.
- Full portfolio management.
- Full portfolio optimization.
- Full institutional VaR/Expected Shortfall stack.
- General-purpose market research mode.
- Generic AI trading chatbot as the primary product.
- Full charting/trading-terminal replacement.
- Continuous automated market monitoring as a primary MVP function.
- Automated trading-agent behavior.
- Custom multi-agent complexity that does not materially improve the single decision workflow.

---

## Product Mechanics Summary

The MVP should feel like one action, not a collection of tools:

> **Tell the desk what you want to trade.**
>
> **The desk reconstructs the relevant state.**
>
> **It makes your thesis explicit.**
>
> **It tries to break the thesis with evidence.**
>
> **It stress-tests the actual position.**
>
> **It checks what the trade adds to your existing exposure.**
>
> **It gives you a transparent decision and tells you what would change it.**

That is the complete MVP job.
