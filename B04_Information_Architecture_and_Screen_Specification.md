# B04 — Information Architecture & Screen Specification

## 1. INFORMATION ARCHITECTURE PRINCIPLE

The MVP uses a **single primary decision workspace** with state-based transitions rather than a collection of conventional product pages.

The information architecture is built around one object: **the current trade stress test**.

The user starts a trade, resolves only material ambiguity, confirms what the system understood, watches the analysis progress, and receives the Decision Artifact in the same continuous workspace.

### MVP structural model

**Primary surface:** Trade Stress Test Workspace

**Meaningful states within the workspace:**
- Empty / Start
- Input
- Clarification
- Normalized Trade
- Analysing
- Partial Analysis
- Decision Ready
- Error / Blocked

**Secondary surface:** lightweight provenance detail attached to claims, metrics, evidence, and scenario assumptions.

### Navigation decisions

The MVP does **not** require:
- a persistent dashboard navigation;
- a watchlist area;
- a generic chat destination;
- a portfolio-management section;
- a standalone research section;
- a settings area unless later required for basic product operation;
- a dedicated history product.

The product should feel like entering one decision workspace, not browsing an application with multiple departments.

---

## 2. SCREEN / SURFACE INVENTORY

The MVP should use the following minimum surface inventory.

| ID | Surface / State | Type |
|---|---|---|
| S01 | Entry / Start | Workspace state |
| S02 | Trade Input | Workspace state |
| S03 | Clarification | Workspace state |
| S04 | Normalized Trade Review | Workspace state |
| S05 | Analysis | Workspace state |
| S06 | Decision Artifact | Workspace state |
| S07 | Partial Analysis / Qualified Result | Artifact state |
| S08 | Error / Blocked | Workspace state |
| S09 | Provenance Detail | Progressive-disclosure surface |

S01–S08 are not necessarily separate routes. They are the meaningful states of the same primary workspace unless implementation later demonstrates a strong reason to separate them physically.

S09 is intentionally a supporting surface rather than a destination.

---

## 3. S01 — ENTRY / START

**Purpose:** Make the product's job immediately obvious and give the user one obvious starting action.

**User goal:** Begin stress-testing a specific trade.

**Entry condition:** User opens the product with no active analysis.

**Exit / next action:** Start Trade Stress Test → S02.

**Primary action:** **Stress-test a trade**.

**Secondary actions:** None required for MVP. A lightweight explanation may be visible.

### Required information
- product purpose in plain language;
- primary action;
- one realistic example of a trade description.

### Optional information
- concise explanation of how the desk works;
- minimal trust statement explaining that the product provides decision support, not guaranteed predictions.

### Must NOT appear
- market dashboard;
- watchlist;
- unsolicited trade ideas;
- portfolio dashboard;
- generic chat history;
- feature catalogue;
- dense technical terminology.

### Mobile behavior
The primary action and trade input should be immediately usable without scrolling through product explanation.

### Desktop behavior
Additional explanatory space may be used, but the workspace must retain the same single-purpose focus.

---

## 4. S02 — TRADE INPUT

**Purpose:** Capture the trader's proposed action and rationale with minimal friction.

**User goal:** Tell the desk what they are considering in their own words.

**Entry condition:** User starts a stress test from S01.

**Exit / next action:** Submit → either S03 Clarification or S04 Normalized Trade Review.

**Primary action:** Submit trade for interpretation.

**Secondary actions:** Clear / edit input.

### Required information
- asset;
- direction;
- proposed position size;
- thesis/reason.

### Optional information
- entry price;
- time horizon;
- relevant existing exposure;
- user-stated assumptions.

### Information structure
One dominant natural-language input area should be the primary interaction. The product may optionally expose small contextual fields or chips for information the user wants to add, but these must not become a conventional trading form.

### Example
> "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. Stress-test it."

### Validation
The system checks whether the minimum required information can be identified.

### What must NOT happen
The user should not be forced to provide technical indicators, stop-loss values, full portfolio information, or internal product terminology before starting.

### Mobile behavior
The input area, example, and submission action must fit naturally into a compact first interaction.

### Desktop behavior
The same input model remains primary. Extra width must not become a reason to expose a large form.

---

## 5. S03 — CLARIFICATION

**Purpose:** Resolve only ambiguity that materially prevents reliable analysis.

**User goal:** Answer the smallest necessary question and continue.

**Entry condition:** S02 submission lacks a required field or contains material ambiguity.

**Exit / next action:** Answer → return to normalized interpretation → S04.

**Primary action:** Provide requested clarification.

**Secondary actions:** Edit original trade statement where useful.

### Required information
Only the specific missing or ambiguous value required to proceed.

### Optional information
None unless the user volunteers it.

### Must NOT appear
- questionnaire sequences;
- unrelated onboarding;
- requests for fields the system can retrieve or does not need;
- hidden assumptions presented as confirmed user intent.

### Interaction rule
Questions should be atomic where possible.

Example:

> **"What position size are you considering?"**

rather than a list of unrelated questions.

### Mobile behavior
Clarification should be answerable in one short interaction.

### Desktop behavior
The original trade text may remain visible alongside the clarification, but the interaction stays focused.

---

## 6. S04 — NORMALIZED TRADE REVIEW

**Purpose:** Provide the user's final checkpoint before the full analysis begins.

**User goal:** Confirm that the system understood the intended trade correctly.

**Entry condition:** Required information is complete and normalized.

**Exit / next action:** Confirm → S05 Analysis. Edit → update normalized trade and remain in S04.

**Primary action:** **Confirm trade**.

**Secondary actions:** Edit material field / correct misunderstanding.

### Required information
- asset;
- direction;
- position size;
- thesis/reason.

### Optional information
- entry price;
- time horizon;
- relevant existing exposure;
- user-stated assumptions.

### Information distinction
The surface must make two categories understandable:

**You told us this**
- user-entered trade intent;
- user-stated thesis;
- user-supplied optional context.

**We derived / observed this**
- current market price;
- reference price;
- asset/session information;
- other system-derived market context.

### Editable
User-intent fields may be edited directly or through a focused correction interaction.

### System-derived / read-only
Market observations and derived context should not be presented as user-editable trade intent.

### Warnings
Material ambiguity, unsupported asset status, or missing decision-critical market dependencies should be visible before confirmation when known.

### Must NOT appear
- full market analysis;
- verdict;
- large scenario output;
- hidden assumptions;
- unnecessary data tables.

### Mobile behavior
Use a compact vertically ordered review with the most important user-intent fields first.

### Desktop behavior
User-supplied and system-derived information may be visually separated, but the structure must remain simple.

---

## 7. S05 — ANALYSIS

**Purpose:** Communicate that the decision is being evaluated through the real MVP workflow.

**User goal:** Understand what stage the desk is at without being exposed to internal reasoning.

**Entry condition:** User confirms the normalized trade.

**Exit / next action:** Complete → S06; qualified result → S07; critical failure → S08.

**Primary action:** None; analysis is system-led.

**Secondary actions:** None required. Material surfaced limitations may be inspectable.

### Visible progress stages
1. **Reconstructing market state**
2. **Understanding the thesis**
3. **Testing the thesis**
4. **Stress-testing the position**
5. **Checking relevant exposure**
6. **Building the decision**

These stages should map to genuine work in the product.

### What the user sees
- current stage;
- completed stages;
- stable high-level findings when safe to reveal;
- material limitations/blockers;
- readiness for result.

### What stays hidden
- chain-of-thought;
- prompts;
- raw tool traces;
- model deliberation;
- arbitrary "AI thinking" animations.

### Must NOT appear
A stream of meaningless activity messages that gives the appearance of intelligence without communicating product progress.

### Mobile behavior
Progress should be compact and easy to scan. It should not require the user to watch every stage.

### Desktop behavior
The larger surface can show more stable interim findings, but it remains the same sequence rather than a live debugging console.

---

## 8. S06 — DECISION ARTIFACT

**Purpose:** Present the complete decision-support result as a structured, reusable artifact.

**User goal:** Understand the conclusion quickly, inspect the reasoning when needed, and leave with clear change conditions.

**Entry condition:** Analysis completes sufficiently for a decision-ready result.

**Exit / next action:** Review artifact; start another analysis from the same workspace.

**Primary action:** Review decision.

**Secondary actions:** Expand evidence; inspect scenario assumptions/calculations; start another stress test.

### Exact information hierarchy

1. **Trade + Verdict**
2. **Decisive Reasons**
3. **Market State**
4. **Thesis**
5. **Challenge**
6. **Stress Scenarios**
7. **Thesis vs Position**
8. **Change Conditions**
9. **Evidence / Provenance**

### 1. Trade + Verdict
**Headline information:** asset, direction, proposed size, and Proceed / Wait / Reduce / Reject.

**Supporting information:** working entry/current price and time horizon where relevant.

**Expandable:** decision limitations.

**Actions:** inspect key reasons.

**Provenance:** market-derived values carry source/time context.

### 2. Decisive Reasons
**Headline information:** the small number of factors that most materially drove the conclusion.

**Supporting information:** links to the relevant market-state, thesis, challenge, and scenario sections.

**Expandable:** supporting evidence and interpretation.

**Actions:** inspect underlying evidence.

**Provenance:** each sourced/counted claim remains traceable.

### 3. Market State
**Headline information:** the state dimensions that materially affect this trade.

**Supporting information:** token/reference price relationship, market status, liquidity, relevant cross-asset context, and fresh events as applicable.

**Expandable:** calculation detail and source information.

**Actions:** inspect individual observations.

**Provenance:** source + timestamp.

### 4. Thesis
**Headline information:** concise restatement of the user's thesis.

**Supporting information:** assumptions, dependencies, supporting evidence.

**Expandable:** detailed evidence and interpretation.

**Actions:** inspect evidence or return to correction only where the workflow permits.

**Provenance:** user-stated reasoning is clearly distinguished from system analysis.

### 5. Challenge
**Headline information:** strongest credible reason the trade may be wrong.

**Supporting information:** assumption attacked, contradictory evidence, alternative explanation, decision implication.

**Expandable:** source details and conflict context.

**Actions:** inspect supporting evidence.

**Provenance:** material challenge claims are traceable.

### 6. Stress Scenarios
**Headline information:** four core scenarios and their position consequences.

**Supporting information:** explicit assumption, position impact, portfolio impact where available, interpretation.

**Expandable:** calculation inputs and component assumptions.

**Actions:** inspect scenario details.

**Provenance:** observed inputs, deterministic calculations, and hypothetical assumptions remain distinct.

### 7. Thesis vs Position
**Headline information:** separate qualitative judgments for thesis quality and position quality.

**Supporting information:** principal reasons each judgment differs or aligns.

**Expandable:** relevant exposure and stress drivers.

**Actions:** inspect drivers.

**Provenance:** judgments point back to evidence and calculations.

### 8. Change Conditions
**Headline information:** the small set of conditions that would materially change the decision.

**Supporting information:** connection to the relevant thesis dependency or risk.

**Expandable:** evidence supporting why the condition matters.

**Actions:** inspect the originating thesis dependency.

**Provenance:** supporting current observations remain traceable.

### 9. Evidence / Provenance
**Headline information:** compact source/timestamp indicators attached to relevant content.

**Supporting information:** full source and evidence classification.

**Expandable:** detailed source context, conflicts, freshness, calculation inputs, and assumptions.

**Actions:** inspect provenance without leaving the decision artifact.

### Must NOT appear
- giant uninterrupted AI essay;
- generic news feed;
- unsupported confidence score;
- prediction presented as fact;
- raw formulas in the primary hierarchy;
- a full charting terminal;
- autonomous trading controls.

### Mobile behavior
The artifact is a single vertical sequence. The first viewport should prioritize the verdict and decisive reasons. Lower-priority detail is collapsed/expandable.

### Desktop behavior
The same hierarchy remains canonical. Additional width may allow side-by-side inspection of evidence or scenario details, but the desktop version must not create a different information architecture.

---

## 9. S07 — PARTIAL ANALYSIS / QUALIFIED RESULT

**Purpose:** Preserve useful analysis when one or more non-critical dependencies are unavailable or unreliable.

**User goal:** Understand what can be concluded and what cannot.

**Entry condition:** Analysis can continue usefully but cannot support a fully qualified result.

**Exit / next action:** Review qualified artifact; optionally correct a missing input when requested; or start another analysis.

**Primary action:** Review partial result.

**Secondary actions:** Resolve requested limitation where practical; restart analysis.

### Required information
- what was analyzed;
- what is unavailable or unreliable;
- how the limitation affects the conclusion;
- which sections remain valid.

### Must NOT appear
- complete-looking verdict built on hidden missing information;
- false completeness;
- unsupported numerical estimates.

### Mobile behavior
Limitations should appear near the affected result, not hidden at the bottom.

### Desktop behavior
The same limitation hierarchy applies; additional detail can be inspected without obscuring the qualified status.

---

## 10. S08 — ERROR / BLOCKED

**Purpose:** Clearly handle cases where a reliable analysis cannot proceed.

**User goal:** Understand why the analysis is blocked and what to do next.

**Entry condition:** A critical requirement fails or the asset is unsupported.

**Exit / next action:** Correct input, choose supported asset, or restart.

**Primary action:** Fix the blocking issue.

**Secondary actions:** Restart / exit.

### Required information
- concise explanation of the blocking condition;
- the specific action needed where recoverable.

### Must NOT appear
- generic error codes as the only explanation;
- fake analysis;
- unrelated recommendations.

### Mobile behavior
The corrective action should be immediately accessible.

### Desktop behavior
May show additional technical context only where it helps the user understand the limitation; internal debugging detail remains hidden.

---

## 11. S09 — PROVENANCE DETAIL SURFACE

**Purpose:** Let users answer "Where did this come from?" without turning the product into a research terminal.

**Type:** Progressive-disclosure detail surface attached to the relevant claim, metric, scenario, or evidence item.

**Preferred model:** Inline source/timestamp metadata with an expandable detail treatment. A drawer or panel may be used later if required by the final visual interaction, but no separate research route is necessary.

### Required information
- source/origin;
- timestamp;
- classification: Observed Fact / Calculated Metric / Scenario Assumption / AI Interpretation.

### Optional information
- source-quality note;
- calculation inputs;
- conflict explanation;
- freshness status.

### Must NOT appear
- full research report;
- unrelated sources;
- technical retrieval logs;
- hidden chain-of-thought.

### Mobile behavior
Open in-place or as a compact bottom/side detail surface without losing the user's position in the artifact.

### Desktop behavior
May use more available space for source and calculation inspection while preserving the same content model.

---

## 12. ENTRY / TRADE INPUT INFORMATION ARCHITECTURE

The input surface should follow this hierarchy:

1. **Intent:** "Stress-test a trade."
2. **Primary input:** the user's natural-language trade description.
3. **Example:** a concrete rNVDA-style example.
4. **Submission:** one clear action.
5. **Optional context:** only information the user wants to add or the product requires after interpretation.

### Validation behavior

The product should classify extracted values into:

- confirmed user-provided;
- inferred but material;
- system-derived;
- missing.

Material inferred values must be correctable before analysis.

---

## 13. NORMALIZED TRADE INFORMATION ARCHITECTURE

The review surface should prioritize **intent correctness** over market detail.

### Primary order
1. Asset + direction
2. Position size
3. Thesis/reason
4. Entry/time horizon if supplied
5. Relevant exposure if supplied
6. Material derived context
7. Warnings / limitations
8. Confirmation

The user should not need to understand why every derived field exists. The goal is simply to verify that the trade being analyzed is the trade they intended.

---

## 14. ANALYSIS SURFACE INFORMATION ARCHITECTURE

The analysis state is not a separate dashboard. It is a temporary progress state within the primary workspace.

### Progress information
The stage list should be the main structural element.

### Stable findings
Only findings that are unlikely to change during the remaining analysis should be surfaced during execution.

### Limitations
A newly discovered material limitation should be attached to the affected stage immediately.

### Completion
The transition to Decision Artifact should clearly communicate that the result is ready rather than merely stopping a progress indicator.

---

## 15. DECISION ARTIFACT — MOBILE

The mobile artifact uses a strict single-column hierarchy.

### Immediately visible
- Trade + Verdict
- Decisive Reasons
- primary uncertainty/limitation, when material
- highest-impact stress consequence

### Early expandable content
- Market State
- Thesis
- Challenge
- Stress Scenarios
- Thesis vs Position
- Change Conditions

### Lower-priority detail
- Evidence / Provenance
- detailed calculation inputs
- source-quality or conflict detail

### Sticky / persistent
The final verdict and core trade identity should remain easy to recover while reviewing the artifact, but the product should avoid turning the screen into a permanent control bar.

### Mobile rules
- no dense multi-column tables;
- no requirement to compare more than one screen region at once;
- scenario cards/sections must communicate assumption → consequence directly;
- long evidence lists remain collapsed;
- uncertainty should be visible near the conclusion when material.

---

## 16. DECISION ARTIFACT — DESKTOP

Desktop uses additional width to improve comparison and inspection, not to add unrelated information.

### Appropriate uses of width

- side-by-side Thesis and Challenge inspection;
- scenario comparison;
- position versus portfolio impact;
- evidence alongside the claim it supports;
- calculation detail alongside the resulting metric.

### Canonical rule
The same content order and conceptual grouping remain in force. A desktop layout is an expanded presentation of the same artifact, not a second product.

### Must NOT become
- permanent multi-panel trading terminal;
- chart-heavy dashboard;
- source browser;
- dense institutional risk screen.

---

## 17. ERROR / PARTIAL ANALYSIS INFORMATION ARCHITECTURE

Not every failure gets its own screen.

| Condition | Experience treatment |
|---|---|
| Incomplete required input | Clarification state with targeted question |
| Vague thesis | Inline clarification or qualified thesis limitation |
| Missing non-critical market data | Inline limitation on affected section |
| Stale data | Freshness warning attached to affected observation |
| Conflicting sources | Provenance detail + conflict notice |
| Unavailable reference price | Qualified token-only analysis where useful; reference-dependent sections marked unavailable |
| Illiquid token | Elevated position-risk warning; no implied execution certainty |
| Missing portfolio context | Continue position analysis; state portfolio impact is unassessed |
| Unsupported asset | Blocked error state |
| No meaningful counter-thesis | Explicitly state none was found; do not manufacture one |
| Scenario not reliably calculable | Scenario marked unavailable or qualitative-only |
| Critical market input missing | Block or qualify only the affected analysis depending on severity |

---

## 18. SESSION / HISTORY

### Recommended MVP decision — No dedicated history product.

The core experience does not require a persistent history/navigation system to prove the product thesis.

A completed Decision Artifact exists for the current session. A lightweight same-session ability to start another analysis is sufficient.

### What is deferred
- searchable analysis history;
- journaling;
- decision performance tracking;
- behavioral analytics;
- portfolio history.

### Conditional future addition
A small recent-analysis list may be added later if usability testing shows users need to return to prior decisions, but it should not become a primary navigation surface in the hackathon MVP.

---

## 19. NAVIGATION

Navigation should be intentionally minimal.

### Primary navigation
There is effectively one destination:

> **Trade Stress Test Workspace**

### Back behavior
- From Clarification → return to the active input context.
- From Normalized Trade → return to Input for correction.
- During Analysis → do not expose arbitrary navigation that can orphan the active run; allow cancellation/restart only if necessary.
- From Decision Artifact → remain in the current workspace or start a new analysis.

### Restart behavior
**New Trade** starts a clean analysis without requiring the user to navigate through a dashboard.

### Earlier-step editing
After normalization, corrections should preserve as much existing work as safely possible, but a material change to the trade may require re-running affected analysis.

### Previous analyses
No dedicated navigation is required for MVP.

The user should always understand:

**where they are → what the system is doing → what happens next.**

---

## 20. RESPONSIVE INFORMATION ARCHITECTURE

The product has one structural model across mobile and desktop.

### Structurally identical
- same workspace;
- same state sequence;
- same decision-artifact sections;
- same evidence classifications;
- same verdict options;
- same scenario logic;
- same trust model.

### Adaptive presentation
Only the density, grouping, and progressive-disclosure behavior may change.

### Mobile priority
**Verdict → Why → Key Risk → Stress Consequence → Thesis vs Position → Change Conditions → Evidence**

### Desktop opportunity
Relevant sections may be compared side-by-side where this makes understanding faster.

Desktop must not introduce information that is absent from the product model merely because space exists.

---

## 21. SCREEN-TO-SCREEN FLOW

```text
ENTRY / START
     ↓
TRADE INPUT
     ↓
CLARIFICATION ───────────────┐
     │                        │
     └───────────────────────┘
              ↓
      NORMALIZED TRADE
              ↓
          ANALYSIS
         ↙       ↘
PARTIAL ANALYSIS   ERROR / BLOCKED
         ↓               ↓
   DECISION ARTIFACT   CORRECT / RESTART
```

### Transition rules

**Entry → Trade Input:** User chooses the single primary action.

**Trade Input → Clarification:** Required information is materially missing or ambiguous.

**Trade Input → Normalized Trade:** Minimum required information is available.

**Clarification → Normalized Trade:** Targeted question is answered.

**Normalized Trade → Analysis:** User confirms the intended trade.

**Analysis → Decision Artifact:** Required analysis is sufficiently complete.

**Analysis → Partial Analysis:** Useful output exists but one or more important dependencies are unavailable/unreliable.

**Analysis → Error:** A critical dependency prevents a defensible analysis.

**Decision Artifact → New Analysis:** User chooses to stress-test another trade.

---

## 22. HACKATHON DEMO SURFACE

The rNVDA reference scenario requires only the core workspace states:

1. **Entry / Start** — establish the product's purpose.
2. **Trade Input** — submit the natural-language trade.
3. **Normalized Trade** — demonstrate understanding before analysis.
4. **Analysis** — show the real workflow progressing.
5. **Decision Artifact** — demonstrate the complete value of the product.
6. **Provenance Detail** — inspect one or two material claims without leaving the artifact.

Clarification, Partial Analysis, and Error remain essential product states but do not need to be central to the happy-path demo.

### Demo navigation rule
The demo should not visit a dashboard, settings area, history page, portfolio-management page, or generic chat screen because none is required to tell the product story.

### Minimum demo story

```text
"I'm thinking about buying $2,000 of rNVDA..."
              ↓
      "This is what we understood."
              ↓
       "Here's the market state."
              ↓
        "Here's your thesis."
              ↓
       "Here's what challenges it."
              ↓
      "Here's how the position
       behaves under stress."
              ↓
       "Here's thesis vs position."
              ↓
        "Here's the verdict."
              ↓
    "Here's what would change it."
```

The verdict must emerge from the actual runtime evidence and calculations. The information architecture should make that visible without requiring navigation through unrelated product areas.

---

## 23. MVP SCREEN BOUNDARY

### MUST BUILD

- One primary Trade Stress Test Workspace.
- Entry / Start state.
- Natural-language Trade Input state.
- Targeted Clarification state.
- Normalized Trade Review state.
- Analysis progress state.
- Decision Artifact state.
- Partial Analysis state.
- Error / Blocked state.
- Progressive-disclosure provenance detail.
- Clear responsive hierarchy for mobile and desktop.
- Same workspace continuity across the core journey.
- Explicit state transitions and correction/restart behavior.

### SUPPORTING

- Optional lightweight contextual input for relevant existing exposure.
- Richer desktop comparison within the same artifact.
- Lightweight same-session "New Trade" action.
- Optional paper-trading handoff surface only if later product decisions keep it within scope.

### CUT

- Dedicated dashboard.
- Persistent watchlist.
- Generic chat screen.
- Full research browser.
- Full portfolio-management surface.
- History/journal product.
- Continuous monitoring dashboard.
- Alert center.
- Autonomous execution surface.
- Hedge-construction workflow.
- Price-prediction screen.
- Full trading terminal.
- Multi-agent visualization.
- Separate screens for every calculation or AI sub-operation.

---

## 24. INFORMATION ARCHITECTURE NORTH STAR

> **One trade, one workspace, one continuous decision journey: start with the action, expose only what matters, and end with a decision artifact the trader can understand and own.**
