# B03 — Experience Architecture

## 1. EXPERIENCE PRINCIPLE

Bitget AI RedTeam Desk should feel like a **focused decision desk**: the user brings a specific trade idea, the product organizes the decision around it, and the experience progressively reveals the evidence, challenge, stress and conclusion that matter.

The experience is not a chatbot because conversation is not the primary product output. It is not a spreadsheet because the user should not have to manually assemble calculations. It is not a research terminal because the product should retrieve only information that materially affects the proposed decision. It is not a dashboard because the user's attention is centered on one decision at a time.

The experience follows five rules:

1. **Start with the trade, not the market.** The user should begin from an intended action.
2. **Ask only for missing information that materially affects the analysis.** The experience should feel lightweight even when the underlying analysis is sophisticated.
3. **Show progress through meaningful work.** The product communicates which decision stage is being completed rather than pretending to expose internal AI reasoning.
4. **Surface the most decision-relevant information first.** Detail is progressively disclosed rather than presented as a wall of data.
5. **End with a decision artifact.** The user should leave with a clear understanding of what was considered, what could break the trade, what the stress scenarios show, and what would change the conclusion.

The experience should feel **deliberate, calm and evidence-led rather than sensational or predictive**.

---

## 2. PRIMARY USER JOURNEY

The canonical journey is:

**OPEN PRODUCT**  
↓  
**START TRADE STRESS TEST**  
↓  
**DESCRIBE TRADE**  
↓  
**CLARIFY ONLY IF NECESSARY**  
↓  
**REVIEW NORMALIZED TRADE**  
↓  
**ANALYSIS**  
↓  
**DECISION ARTIFACT**

The internal analysis stages are represented within the analysis experience and should not become separate navigation destinations.

### Stage 1 — Open Product

**User goal:** Understand immediately what the product is for.

**What the user sees:** A focused entry experience centered on the action **Stress-test a trade** and a minimal amount of supporting explanation.

**What the user does:** Starts a trade stress test.

**What the system does:** Establishes a new analysis session.

**What can go wrong:** The user does not understand the product's purpose.

**What allows continuation:** The primary action is obvious and requires no prior setup.

### Stage 2 — Start Trade Stress Test

**User goal:** Begin analyzing a specific trade.

**What the user sees:** A simple natural-language trade input area with a useful example.

**What the user does:** Describes what they are considering and why.

**What the system does:** Accepts the trade idea and determines which minimum fields can be extracted.

**What can go wrong:** The input contains no recognizable trade, unsupported asset, or insufficient information.

**What allows continuation:** A recognizable trade with the minimum required information is accepted; otherwise the product asks for the smallest missing clarification.

### Stage 3 — Describe Trade

**User goal:** Explain the actual decision in their own words.

**What the user sees:** One primary input area rather than a long form.

**What the user does:** Enters asset, direction, proposed size, and reason/thesis in natural language.

**What the system does:** Extracts the normalized trade fields and identifies material ambiguity.

**What can go wrong:** The user omits direction, size, asset, or any other information required for meaningful analysis.

**What allows continuation:** Required information is present or obtained through minimal clarification.

### Stage 4 — Clarify Only If Necessary

**User goal:** Resolve ambiguity without feeling like they are completing a financial questionnaire.

**What the user sees:** One or a small number of targeted questions, each tied to a specific analysis dependency.

**What the user does:** Supplies or corrects missing information.

**What the system does:** Determines whether clarification is genuinely necessary and avoids asking for information it can derive reliably.

**What can go wrong:** The system asks for unnecessary information or creates a long sequence of questions.

**What allows continuation:** The minimum information needed for the analysis is available.

### Stage 5 — Review Normalized Trade

**User goal:** Verify that the product understood the intended trade.

**What the user sees:** A compact representation of the proposed position, including user-supplied versus system-derived values.

**What the user does:** Confirms or edits any material field.

**What the system does:** Shows its interpretation before committing to the full analysis.

**What can go wrong:** The asset, direction, size, or thesis has been misunderstood.

**What allows continuation:** The user confirms the normalized trade or corrects it.

### Stage 6 — Analysis

**User goal:** Let the desk evaluate the decision without having to manage the analysis process.

**What the user sees:** Meaningful progress stages and emerging evidence summaries, not raw system activity.

**What the user does:** Primarily observes. The user may inspect or correct a material issue if the experience surfaces one.

**What the system does:** Reconstructs market state, extracts the thesis, finds relevant contradictions, stress-tests the position, and synthesizes the decision.

**What can go wrong:** Required data is missing, stale, conflicting, or impossible to calculate reliably.

**What allows continuation:** The product can either complete the analysis with explicit limitations or move to a partial-analysis state when a missing dependency prevents a reliable conclusion.

### Stage 7 — Decision Artifact

**User goal:** Understand and act on the result.

**What the user sees:** A concise decision artifact organized around the trade, key findings, challenge, stress consequences, thesis-vs-position distinction, and change conditions.

**What the user does:** Reviews the conclusion and supporting information; the actual trade decision remains theirs.

**What the system does:** Presents the completed analysis with provenance and uncertainty.

**What can go wrong:** The conclusion is too vague, too long, overly confident, or unsupported.

**What allows continuation:** The artifact clearly explains what was found, what remains uncertain, and why the conclusion follows.

---

## 3. ENTRY EXPERIENCE

The first experience should make one action dominant:

> **Stress-test a trade.**

The user should be able to begin almost immediately without configuring a dashboard, connecting a portfolio, selecting indicators, or learning product terminology.

### Before submission, the experience should show

- the primary action;
- a short explanation of the job the product performs;
- one realistic example of a trade description;
- only the minimum contextual information necessary to understand the product.

### Before submission, the experience should NOT show

- a dense market dashboard;
- a large watchlist;
- generic AI chat history as the main focus;
- a large collection of market indicators;
- a portfolio-management interface;
- a feed of unsolicited trade ideas;
- a large collection of product features.

The user should be able to start without first understanding terms such as "decision artifact," "basis risk," or "scenario engine."

---

## 4. TRADE SUBMISSION EXPERIENCE

The primary input method is **natural language**.

A suitable prompt style is:

> **"I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. Stress-test it."**

The exact example may vary by supported market state, but the interaction should communicate the intended behavior: **tell the desk what you are considering and why.**

### The system extracts

- asset;
- direction;
- proposed position size;
- user thesis/reason;
- time horizon when explicitly provided or required for the analysis;
- relevant existing exposure when explicitly provided.

### The system should derive rather than ask for

- current market price;
- reference price where applicable;
- market status;
- token/reference relationship;
- liquidity observations;
- relevant current evidence.

### Clarification rule

The product asks a question only when the missing information materially changes whether the analysis can be performed or materially changes the conclusion.

Examples of acceptable clarification:

> **"What position size are you considering?"**

> **"When you say 'buy', do you mean a long position in rNVDA?"**

Examples of unacceptable clarification:


> requesting an exact stop-loss when the MVP does not use one;

> requesting technical indicators the system can retrieve or does not need.

The system must not silently fill a material user-intent field with an invented value.

---

## 5. NORMALIZED TRADE REVIEW

Immediately after submission and any required clarification, the user sees:

> **"This is what I think you are trying to trade."**

The normalized trade review is the final checkpoint before full analysis.

### User-editable information

- asset;
- direction;
- proposed position size;
- proposed entry/current working price when explicitly supplied by the user;
- time horizon when supplied;
- thesis/reason;
- relevant existing exposure supplied by the user.

### System-derived information

- current market/reference prices;
- asset/session status;
- token/reference relationship;
- retrieved market-state values.

System-derived values should be visually distinguished from values supplied or confirmed by the user, but the visual treatment should remain simple.

### Missing information

Required missing information is surfaced explicitly. Optional missing information is not turned into a blocking step.

### Inferred information

When the system infers something material, it must identify it as inferred and give the user an opportunity to correct it.

### Confirmation behavior

The user confirms the trade or edits it. Confirmation starts the full analysis.

A minor non-material inference should not require a confirmation loop. A material misunderstanding must be correctable before analysis proceeds.

---

## 6. ANALYSIS EXPERIENCE

The product should communicate progress through the actual work being completed. It must not simulate or expose chain-of-thought.

### Visible progress stages

The user should see a compact sequence such as:

1. **Reconstructing market state**
2. **Understanding the thesis**
3. **Testing the thesis**
4. **Stress-testing the position**
5. **Checking relevant exposure**
6. **Building the decision**

The wording may be refined later, but the stages should describe real product operations rather than generic AI activity.

### What should be visible

- the current stage;
- completion of earlier stages;
- high-level findings when they are stable enough to communicate;
- important data limitations or blockers;
- a clear indication when the result is ready.

### What should remain hidden

- chain-of-thought;
- internal prompts;
- hidden intermediate deliberation;
- raw tool traces;
- unnecessary system/debug messages;
- arbitrary AI "thinking" animations that imply invisible intelligence without communicating useful progress.

The experience should feel like a **research process being executed**, not a model pretending to think on screen.

---

## 7. DECISION ARTIFACT EXPERIENCE

The artifact should answer the user's questions in this order:

> **What am I considering?**  
> **What did the desk find?**  
> **What could break the thesis?**  
> **What happens if things go badly?**  
> **Is the thesis better than the position?**  
> **What would change my mind?**

### Information hierarchy

The highest-priority information is:

1. proposed trade and verdict;
2. decisive reasons;
3. material market-state findings;
4. strongest challenge;
5. stress consequences;
6. thesis-vs-position distinction;
7. change conditions;
8. detailed evidence/provenance.

The artifact should be scan-friendly. Long prose is a failure mode.

### Progressive disclosure

The main artifact should contain conclusions and only the context necessary to understand them. Detailed source information, calculation inputs, scenario assumptions, and supporting evidence should be inspectable without overwhelming the primary view.

### Uncertainty

Material uncertainty should appear near the conclusion when it affects the decision. It should not be buried solely in a source drawer or footnote.

### Scenario assumptions

Each scenario must expose its assumption close to its consequence so the user never mistakes a hypothetical shock for a forecast.

### Provenance

Evidence details should be accessible through progressive disclosure from the relevant claim rather than requiring a separate research page.

---

## 8. THESIS EXPERIENCE

The thesis section should make the trader feel:

> **"Yes. That is actually what I'm thinking."**

The user's reasoning must remain recognizably theirs.

### Presentation order

1. **Your thesis** — concise restatement of the user's idea.
2. **Key assumptions** — conditions the thesis depends on.
3. **Supporting evidence** — evidence connected to those assumptions.
4. **Dependencies** — external conditions that materially affect the thesis.
5. **Invalidation conditions** — developments that would weaken or invalidate it.

### Correction mechanism

The user can correct the thesis or an extracted assumption without restarting the entire experience where practical.

### AI behavior

The AI may clarify structure and wording, but it must not silently add a causal argument the user did not make.

For example, if the user says:

> "rNVDA looks strong because AI demand is still strong."

the system can identify:

> **Thesis:** AI demand supports further NVDA upside.

It should not silently convert that into a detailed claim about earnings, margins, guidance, valuation, or macro conditions unless those are separately supported and clearly labeled as analysis.

### Vague thesis

A vague thesis remains visibly vague. The system may ask one targeted question where necessary, or continue with a limitation statement where useful analysis is still possible.

---

## 9. REDTEAM / CHALLENGE EXPERIENCE

The challenge should feel useful rather than theatrical.

The experience should communicate:

> **"Here is the strongest reason your trade may be wrong."**

not:

> **"The AI is fighting you."**

### How the challenge is introduced

The challenge appears as a deliberate analytical step after the thesis has been reconstructed.

### What accompanies the challenge

- the central counter-thesis;
- the specific assumption it attacks;
- supporting contradictory evidence or observed market conditions;
- the expected decision implication.

### Inspecting the challenge

The user should be able to inspect the evidence supporting a material challenge and see whether the challenge is based on:

- direct contradictory evidence;
- a critical assumption failing;
- market-state mismatch;
- a position mismatch;
- a plausible alternative explanation.

### Avoiding meaningless bear cases

The system should not invent opposition merely because the product has a "challenge" section.

The challenge should be prioritized according to decision relevance. A mildly negative article is less important than a direct contradiction of a critical thesis dependency.

### No strong counter-thesis

The product should be willing to say:

> **"No strong contradictory evidence found in the available data."**

It can still identify uncertainty, but it should not fabricate a bearish argument.

### RedTeam naming

"RedTeam" may be used as an internal/product-mode label, but the primary user-facing concept should remain understandable without the term. A more direct label such as **Challenge** should remain viable in the experience.

---

## 10. STRESS SCENARIO EXPERIENCE

The stress section should make each scenario immediately understandable as:

> **"If this happens, this is what happens to my trade."**

The four core scenarios are presented consistently.

### Scenario 1 — Market Risk

**Title:** Market Risk

**Assumption:** The relevant underlying asset, sector, or index experiences a material adverse move.

**Consequence:** Estimated position P&L impact under the explicit assumed move.

**Position impact:** Deterministic estimated gain/loss.


**Interpretation:** Explains direct price sensitivity and whether the proposed position is disproportionately exposed to the scenario.

**Provenance:** Scenario assumption and deterministic calculation inputs are visible on inspection.

### Scenario 2 — Crypto Contagion

**Title:** Crypto Contagion

**Assumption:** Broad crypto risk deteriorates materially while the token remains exposed to the crypto trading environment.

**Consequence:** Estimated effect on the proposed position only where a defensible relationship or explicit exposure exists.

**Position impact:** Deterministic consequence under the stated contagion assumption; no invented beta.


**Interpretation:** Explains whether the trade has meaningful crypto-market dependence beyond its nominal underlying thesis.

**Provenance:** Crypto observation, scenario assumption, and any relationship calculation are inspectable.

### Scenario 3 — Token Microstructure

**Title:** Token Microstructure

**Assumption:** Token/reference basis widens and/or liquidity deteriorates.

**Consequence:** Additional estimated exposure/cost or impaired exit quality supported by available data.

**Position impact:** Deterministic calculation where spread, basis, depth, or equivalent liquidity inputs support it.


**Interpretation:** Shows how the trade can suffer even when the underlying equity thesis remains broadly correct.

**Provenance:** Observed market conditions and hypothetical shock are distinguishable.

### Scenario 4 — Combined Shock

**Title:** Combined Shock

**Assumption:** Multiple adverse conditions occur together, such as underlying weakness, broader crypto deterioration, and worse token liquidity.

**Consequence:** Combined deterministic position impact.

**Position impact:** Result of applying the explicit component shocks together.


**Interpretation:** Identifies the dominant contributing risk and shows whether the position becomes materially weaker when vulnerabilities align.

**Provenance:** Each component assumption remains identifiable rather than being hidden inside one number.

### Optional Scenario — Thesis Failure

When the user's thesis contains a sufficiently concrete dependency, a **Thesis Failure** scenario may be shown.

It should identify:

- the dependency that fails;
- what that failure means for the thesis;
- quantitative impact only where a defensible market translation exists;
- the resulting decision implication.

### Scenario interaction rule

The main view should show the assumption and consequence together. More detailed calculation inputs may be expanded. Scenarios should not require the user to interpret raw formulas.

No scenario should display an unsupported probability or present its assumption as a prediction.

---

## 11. THESIS VS POSITION EXPERIENCE

The product must make the distinction obvious:

> **A good idea can still be a bad position.**

### Thesis Quality presentation

Show a concise qualitative judgment such as:

> **Thesis: Strongly supported**

or

> **Thesis: Mixed**

The label must be accompanied by the principal evidence and assumptions behind it. It must not become an unexplained numerical score.

### Position Quality presentation

Show a separate qualitative judgment such as:

> **Position: Too exposed**

or

> **Position: Reasonable under current conditions**

The explanation should identify the main drivers: size, liquidity, basis, or scenario sensitivity.

### Relationship explanation

Where the two judgments differ, the product should explicitly explain the relationship:

> **"The thesis is supported, but the proposed size makes the position vulnerable to a 24/7 liquidity shock."**

### Effect on final decision

The final verdict should visibly draw from both judgments rather than collapsing them into one score.

Examples:

- Strong thesis + strong position → Proceed may be reasonable.
- Strong thesis + weak position → Wait or Reduce may be appropriate.
- Weak thesis + acceptable position → the position does not rescue the thesis.
- Weak thesis + weak position → Reject is strongly supported.

These are explanatory patterns, not hard-coded verdict rules.

---

## 12. DECISION EXPERIENCE

The final decision is one of:

- **Proceed**
- **Wait**
- **Reduce**
- **Reject**

The user should understand the verdict without opening additional sections.

### Decision presentation

The decision must contain:

1. **Verdict**
2. **Why** — the decisive factors
3. **Evidence** — the material observations behind those factors
4. **Uncertainty** — important unknowns or limitations
5. **Change conditions** — what would materially alter the conclusion

### Decision language

The verdict should be framed as a conclusion from the available evidence and assumptions, not as an oracle.

For example:

> **WAIT**
>
> The thesis remains plausible, but the token is trading under materially weaker liquidity while the reference market is closed, and the proposed position adds meaningful correlated exposure.

This is preferable to a statement such as:

> **"AI confidence: 87%."**

### User responsibility

The product does not execute the decision or imply that the verdict guarantees an outcome. The user's actual trading decision remains separate from the product's conclusion.

---

## 13. CHANGE CONDITIONS EXPERIENCE

The section should answer:

> **"What would change my mind?"**

The conditions are derived from the actual trade and decision.

### Normal quantity

Normally present **2–4 high-value conditions**. The product should prefer a small number of conditions capable of materially changing the conclusion over a long monitoring list.

### Priority

Conditions should be ordered by decision importance:

1. conditions that invalidate the thesis;
2. conditions that materially change position quality;
3. conditions that resolve a critical uncertainty.

### Relationship to thesis

Each condition should connect back to an assumption or dependency.

### Relationship to decision

Each condition should explain what happens to the current verdict if it occurs.

Recommended structure:

> **Condition → Why it matters → Decision impact**

### MVP interaction

The conditions are informative rather than a full monitoring system. The user can inspect the reasoning but there is no requirement for automated alerts, continuous tracking, or trading actions in the MVP.

---

## 14. PROVENANCE & TRUST EXPERIENCE

Provenance should be available **at the point of relevance** without cluttering the primary decision view.

### Four information types

**Observed Fact** — retrieved or directly observed information.

**Calculated Metric** — deterministic result derived from known inputs.

**Scenario Assumption** — explicit hypothetical condition.

**AI Interpretation** — analysis or synthesis generated from the preceding information.

### Progressive disclosure model

The main artifact should show concise claims and labels where needed. A user can inspect a claim to reveal:

- source;
- timestamp;
- observed value where relevant;
- calculation basis where relevant;
- scenario assumptions where relevant;
- AI interpretation where relevant.

### Trust behavior

A user asking:

> **"Where did this come from?"**

should be able to answer that question without leaving the decision artifact.

### Source conflicts

When sources disagree, the experience should surface the disagreement rather than displaying one blended conclusion as fact.

### Stale information

A stale observation should be labeled as such when freshness could materially affect the decision.

### Missing information

Missing inputs should be surfaced where they change the reliability of a conclusion.

The product should avoid a separate "trust center" in MVP. Trust should be embedded in the relevant information hierarchy.

---

## 15. ERROR & UNCERTAINTY EXPERIENCE

Errors should be handled as **decision-state changes**, not merely technical error messages.

### Incomplete trade input

**Experience:** Ask only for the smallest missing required field.

**Continue when:** The missing field is supplied.

### Vague thesis

**Experience:** Show the thesis as stated, identify what is missing, and ask one targeted clarification only when necessary.

**Continue when:** The system has enough information for a useful challenge, or explicitly marks the thesis analysis as limited.

### Missing market data

**Experience:** Identify exactly which market-state component is unavailable and how that limits the analysis.

**Continue when:** Remaining data supports a partial or qualified conclusion.

### Stale data

**Experience:** Mark the stale observation and downgrade the strength of conclusions that depend on it.

**Continue when:** The analysis remains useful with the freshness limitation visible.

### Conflicting sources

**Experience:** Show the conflict and its decision relevance. Do not silently choose an apparently convenient value.

**Continue when:** A qualified analysis can still be performed; otherwise move to Partial Analysis.

### Unavailable reference price

**Experience:** Do not fabricate a reference value or basis calculation.

**Continue when:** Token-specific analysis can still be useful, but reference-dependent conclusions are explicitly unavailable.

### Illiquid token

**Experience:** Elevate the liquidity limitation because it can materially affect position quality.

**Continue when:** Price-based scenarios remain useful, with execution/liquidity conclusions clearly bounded.

### Missing portfolio context (Future)

**Experience:** Portfolio impact is deferred to a future phase.

**Continue when:** Position-level analysis is sufficient to produce a qualified result.

### Unsupported asset

**Experience:** State that the asset is not currently supported and explain what is missing at a high level.

**Continue when:** User selects a supported asset or exits the analysis.

### No meaningful counter-thesis

**Experience:** State that no strong contradictory evidence was found rather than inventing one.

**Continue when:** The rest of the analysis can proceed normally.

### Scenario cannot be calculated reliably

**Experience:** Show the scenario as unavailable or qualitative, explain why, and do not substitute a fabricated estimate.

**Continue when:** Other scenarios support the decision or the artifact can present a partial result.

### General rule

The product should prefer **Partial Analysis with explicit limitations** over a complete-looking result built on unsupported assumptions.

---

## 16. MOBILE-FIRST VS DESKTOP

The product is one experience that adapts across form factors. It is not two separate products.

### Mobile must support

- starting a stress test immediately;
- natural-language trade submission;
- targeted clarification;
- reviewing and correcting the normalized trade;
- following analysis progress;
- scanning the decision artifact quickly;
- understanding the verdict and decisive reasons;
- opening evidence/provenance details;
- reviewing stress scenarios without complex manipulation;
- understanding Thesis vs Position;
- viewing change conditions.

### Desktop may optimize for

- denser side-by-side comparison of thesis, challenge, scenarios and evidence;
- easier inspection of source and calculation detail;
- larger information surfaces where they improve analysis comprehension.

### Decision Artifact adaptation

The content hierarchy should remain the same across devices. The main change is layout density and disclosure behavior, not product logic.

On mobile, the experience should prioritize:

**Verdict → Why → Key risk → Stress consequence → Thesis vs Position → Change conditions → Evidence**

More detailed evidence remains accessible through expansion.

### Small-screen interaction rules

Interactions should remain simple enough for one-handed or low-attention use. The experience should not depend on hover, dense tables, precise pointer interactions, or multi-panel navigation to understand the conclusion.

---

## 17. THE HACKATHON DEMO EXPERIENCE

The reference demo uses the B02 vertical slice: a crypto-native Bitget trader considering a meaningful rNVDA position while the U.S. reference market is closed and the token remains tradable.

The demo should demonstrate the actual workflow rather than force a predetermined verdict.

### 1. Starting state

**User sees:** A focused entry experience with **Stress-test a trade** as the dominant action.

**Demonstrates:** Product clarity.

### 2. Trade submission

**User enters:**

> "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. Stress-test it."

**Demonstrates:** Natural-language entry and low friction.

### 3. Normalization

**User sees:** Recognized asset, long direction, proposed size, thesis, and any system-derived context that is already available.

**User action:** Confirms or corrects.

**Demonstrates:** The product understands the decision before analyzing it.

### 4. Market-state reconstruction

The system establishes the relevant current token/reference state, including whether the reference market is closed, token trading status, basis where available, liquidity condition, and relevant fresh evidence.

**Demonstrates:** The product understands the environment in which the trade would actually occur.

### 5. Thesis extraction

The system shows the trader's thesis and its key assumptions.

**Demonstrates:** The product analyzes the user's reasoning rather than replacing it with generic asset commentary.

### 6. Challenge

The system presents the strongest evidence-backed counterargument or explicitly states when no strong contradiction is found.

**Demonstrates:** The adversarial decision mechanism.

### 7. Stress scenarios

The user sees the four core scenarios:

- Market Risk
- Crypto Contagion
- Token Microstructure
- Combined Shock

Each shows the explicit assumption and deterministic consequence.

**Demonstrates:** The product does not need to predict the market to show how the trade can fail.

### 8. Thesis vs Position

The product separately explains the quality of the idea and the quality of the proposed size/structure.

**Demonstrates:** The core conceptual differentiation.

### 9. Final decision

The system produces **Proceed, Wait, Reduce, or Reject** based on the actual evidence and calculations available at runtime.

**Demonstrates:** The product synthesizes rather than merely displaying analysis.

### 10. Change conditions

The product identifies the small number of conditions most likely to alter the verdict.

**Demonstrates:** The result is not presented as permanent certainty.

### 11. Decision Artifact

The complete decision is shown as a compact reusable artifact with provenance and uncertainty available through progressive disclosure.

**Demonstrates:** The product's output is a decision record, not an AI transcript.

### Demo rule

The demo must not hard-code a predetermined verdict to make the product look intelligent. The runtime decision should be allowed to emerge from the state, evidence, assumptions and calculations available for the chosen scenario.

The demo should, however, use a stable reference scenario and known supported inputs so the workflow itself can be shown reliably.

---

## 18. EXPERIENCE STATES

The MVP requires the following major states.

### Empty

**Meaning:** No trade analysis has started.

**User can do:** Start a trade stress test.

### Input

**Meaning:** The user is describing the proposed trade.

**User can do:** Enter or edit the trade idea and submit it.

### Clarification

**Meaning:** Required information is materially missing or ambiguous.

**User can do:** Answer the targeted question or correct the relevant detail.

### Normalized

**Meaning:** The system has formed a normalized representation of the intended trade.

**User can do:** Review, edit, and confirm.

### Analysing

**Meaning:** The system is performing the decision workflow.

**User can do:** Observe progress and inspect meaningful surfaced limitations; not manipulate hidden analysis steps.

### Partial Analysis

**Meaning:** The system has enough information to provide useful analysis but one or more important components are unavailable or unreliable.

**User can do:** Review the qualified result and limitations.

### Analysis Complete / Decision Ready

**Meaning:** The system has completed the available analysis and produced a decision artifact.

**User can do:** Review the verdict, evidence, stress results, thesis-vs-position distinction, and change conditions.

### Error

**Meaning:** The requested analysis cannot currently continue because a critical requirement failed or the asset is unsupported.

**User can do:** Correct the input, select a supported trade, or exit the analysis.

The experience should not create separate states for every intermediate calculation or AI sub-operation. The states above are sufficient to represent the user's meaningful progression.

---

## 19. MVP EXPERIENCE BOUNDARY

### MUST HAVE

- Immediate **Stress-test a trade** entry.
- Natural-language trade submission.
- Minimal targeted clarification.
- Normalized trade review and correction.
- Visible analysis progress based on real product stages.
- Decision artifact with clear information hierarchy.
- Thesis reconstruction and correction.
- Evidence-backed challenge experience.
- Four core stress scenarios with explicit assumptions and consequences.
- Clear Thesis vs Position distinction.
- Decision verdict with explanation and uncertainty.
- Trade-specific change conditions.
- Progressive disclosure for evidence and provenance.
- Honest handling of missing, stale, conflicting, and unsupported information.
- Mobile-first usability with a credible desktop adaptation.
- A stable reference demo flow that demonstrates the complete decision loop without hard-coded intelligence.

### SUPPORTING

- Optional thesis-failure scenario.
- Expanded calculation detail.
- Richer desktop side-by-side evidence inspection.
- Limited interaction for correcting or refining analysis inputs after normalization.
- Constrained paper-trading handoff if it can be added without changing the core experience.

### CUT

- Generic chat as a primary navigation destination.
- Generic market dashboard.
- Watchlist-first experience.
- Full portfolio-management workflow.
- Continuous market-monitoring interface.
- Automated alerts.
- Autonomous trade actions.
- Hedge-construction workflow.
- Price-prediction interface.
- Large indicator library.
- Full charting-terminal replacement.
- Multi-agent activity visualizations.
- Decorative AI "thinking" experiences.
- Any interaction that requires users to understand internal product terminology before beginning.


