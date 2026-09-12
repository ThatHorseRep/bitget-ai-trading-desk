# MASTER CONTEXT & BUILD READINESS AUDIT
### Bitget AI Trading Desk — RedTeam Risk Workbench
**Track:** AI Trading Desk (Sub-Theme: Decision Stress Testing) · **Hackathon:** Bitget AI Base Camp Hackathon S2
**Audit date:** 2026-09-12 · **Submission deadline:** 2026-09-21 (UTC+8) — **≈9 days remaining**
**Repository:** https://github.com/ThatHorseRep/bitget-ai-trading-desk

---

## HOW TO READ THIS DOCUMENT

This is a handoff document for a fresh AI coding/product conversation. It assumes no prior context beyond what is written here. It synthesizes:

- B01–B04 (Product Bible), `Technical_Definition_Vertical_Slice.md`, `Technical_Integration_Reconnaissance.md`, `research-reconciliation` / `research-reconciliation-2`
- The official Bitget AI Base Camp Hackathon S2 GitBook
- Current official Bitget API documentation and Agent Hub materials

**Bottom line up front:** The product thinking is unusually mature and internally consistent for a hackathon entry. The repository is 100% documentation — **zero lines of application code exist**. Time is the binding constraint, not idea quality. The single biggest unforced error risk is *not* technical feasibility — it's spending the remaining ~9 days polishing product philosophy documents instead of shipping the vertical slice, and under-using Bitget's own free AI Skills (which the judging rubric explicitly rewards).

---

# PART 1 — RECONSTRUCT THE PROJECT

**What are we building?** A pre-trade decision-support workbench ("RedTeam Trading Desk") that takes one proposed trade — starting with rNVDA (Bitget's tokenized NVIDIA exposure) — reconstructs the current market state, extracts and adversarially challenges the trader's thesis, deterministically stress-tests the specific position under four scenarios, separately judges thesis quality vs. position quality, and returns a structured, provenance-tagged **Decision Artifact** ending in Proceed / Wait / Reduce / Reject.

**Who is it for?** A crypto-native retail trader already active on Bitget who is beginning to trade tokenized U.S. equities alongside existing crypto exposure. Not a professional/institutional trader, not a portfolio manager, not someone looking for signals or autonomous execution.

**What problem does it solve?** Decision fragmentation. A trader can have a reasonable thesis and still make a bad trade because market state, token microstructure, evidence, and existing exposure are evaluated as separate, disconnected pieces rather than as one decision. The product's job is to compress "I have a trade idea" into "I understand the decision I am about to make."

**Why does this matter in a 24/7 crypto/tokenized-equity environment specifically?** rNVDA and similar Reality/rToken instruments remain tradable on Bitget while the underlying NYSE/Nasdaq market is closed (evenings, weekends, holidays — up to ~65.5 hours Friday close to Monday open). During that window, price discovery, liquidity, and basis behave very differently from the reference asset, and a thesis that is valid for "NVDA the stock" is not automatically valid for "rNVDA the token, right now, at this size." This is a real, structural, Bitget-specific risk surface that generic tools (ChatGPT, TradingView, a news feed) do not model.

**What is our actual differentiated capability?** Not the AI, not the market data, not the stress math individually — the **decision workflow**: proposed trade → reconstructed state → explicit thesis → adversarial challenge → deterministic position stress → thesis-vs-position split → structured artifact. The differentiation is workflow-level, not model-level, and it is strongest precisely in the tokenized-equity/off-hours wedge because that's where market state, basis, liquidity, and portfolio exposure become unusually decision-relevant.

**What is the smallest MVP?** One complete rNVDA analysis: natural-language trade input → normalized trade → real Bitget rNVDA + BTC market data → NVDA reference price/session status → thesis extraction → grounded challenge → 4 deterministic stress scenarios → thesis-vs-position judgment → deterministic verdict → Decision Artifact with provenance. No database, no auth, no multi-agent orchestration, no portfolio management, no execution.

**What is explicitly out of scope?** Autonomous trading, live order execution, price/Monday-gap prediction, synthetic hedge recommendations, full portfolio management, institutional VaR/Expected Shortfall stacks, generic AI chat as the primary interface, a full trading terminal, decision history/journaling, multi-agent orchestration, and MCP infrastructure beyond simple API calls.

---

# PART 2 — HACKATHON ALIGNMENT AUDIT

| Requirement | Our current approach | Status | Risk |
|---|---|---|---|
| Track fit (AI Trading Desk = "AI research workbench, human makes final decision") | Product explicitly refuses to be autonomous; AI reasons, deterministic engine calculates, human decides | 🟢 GREEN | Low — this is a near-perfect textual match to the track's own positioning statement |
| Named sub-theme "Decision Stress Testing" ("Input trade idea → retrieve historical distribution; preset stress tests") | Product is built around exactly this concept (4 deterministic stress scenarios + thesis-vs-position) | 🟢 GREEN | Low. Note: the official example mentions "retrieve historical distribution" — our docs deliberately cut historical analogues from MVP. This is defensible (analogue quality unproven) but should be named explicitly in the submission so judges don't read it as a missed requirement |
| "Complete research task demo (question → actionable insight)" (required material) | Fully specified as the rNVDA vertical slice | 🟡 YELLOW | Medium — spec is complete, but **zero code exists**. This requirement cannot be satisfied by documentation alone |
| Accessible Demo (required material) | Not started | 🔴 RED | High — no deployed/runnable artifact exists yet. This is a hard submission blocker, not a quality issue |
| Judging: "Feature depth (data sources / Skill integration count and effectiveness)" | Current tech plan uses Bitget market API (good) + Yahoo/Stooq (external) + GDELT (external) for evidence. **Does not use any Bitget Agent Hub `bitget-signal` skills** (macro-analyst, market-intel, news-briefing, sentiment-analyst, technical-analysis — free, no API key) | 🟡 YELLOW | Medium — this is a direct, named judging criterion and we are currently leaving free points on the table. See Part 5 and Part 11 |
| Judging: "research quality" | Strong — evidence-before-narrative, provenance model, explicit uncertainty handling | 🟢 GREEN | Low |
| Judging: "LUI fluency" (language-user-interface) | B03/B04 define a careful natural-language-in, structured-artifact-out experience | 🟢 GREEN | Low, contingent on actually being built |
| Judging: "personalized thesis" | Thesis extraction explicitly preserves the user's own reasoning rather than substituting AI reasoning | 🟢 GREEN | Low |
| Project Description — Part 1 "Thesis" (highest weight) | B01 §2 gives a strong, specific thesis | 🟢 GREEN | Low |
| Project Description — Part 2 "Target user" (must be specific, "all traders" not accepted) | Already specific: crypto-native Bitget trader beginning to trade tokenized U.S. equities | 🟢 GREEN | Low |
| Project Description — Part 3 "Validation data and key metrics" | Not yet written; no test users, no usage data | 🔴 RED | Medium — form explicitly allows *targets* labeled as targets ("aiming for X"), so this is fixable with an honest paragraph, not a blocker, but it is currently undone |
| "Role of the LLM in Your Project" (required field) | Well documented internally (B-docs, Technical docs) but not yet written as a submission answer | 🟡 YELLOW | Low — content exists, just needs transcription |
| Compliant X post w/ `#BitgetHackathon` `@Bitget_AI` (required — missing = incomplete submission) | Not started | 🔴 RED | High — this is a hard eligibility gate, independent of product quality |
| "No simple reuse of S1 work" | N/A — this is a new S2 entry | 🟢 GREEN | None |
| University Special Prize eligibility (FUTMinna) | Eligible if University Name field is filled and no main-track prize won | 🟢 GREEN | None, but mutually exclusive with main-track prizes — a strategic, not technical, decision at submission time |
| Best Spread Award (X reach) | Requires ongoing "build in public" posts, not just one post at the end | 🟡 YELLOW | Low priority given time constraints — optional upside only |

**Overall alignment reading:** The *product* is arguably one of the best-fitted entries possible for this specific track and sub-theme — it is hard to imagine the track description being written any more precisely to match B01–B04. The risk is entirely **execution and submission-mechanics**, not conceptual fit.

---

# PART 3 — DOCUMENT CONSISTENCY AUDIT

| Item | Classification | Notes |
|---|---|---|
| Core product loop (Trade → Market State → Thesis → Challenge → Stress → Portfolio → Decide → Change Conditions) | **LOCKED** | Consistent across B01, B02, B03, B04, both Technical docs, and research-reconciliation-2 |
| 4 core deterministic scenarios (Market Risk, Crypto Contagion, Token Microstructure, Combined) + optional 5th (Thesis Failure) | **LOCKED** | Identical across every document |
| Thesis vs Position as two independent, non-collapsing judgments | **LOCKED** | Repeated verbatim across B01/B02/B03/research-reconciliation-2 as "one of the strongest concepts in the product" |
| Deterministic-calculation / AI-interpretation separation | **LOCKED** | This is the single most consistently repeated principle across all 6 documents |
| No database / no persistence for MVP | **LOCKED** | Explicit in B04 §18, Technical_Definition §17, Technical_Integration §20 |
| Portfolio context is optional, not required | **LOCKED** | Consistent everywhere |
| "RedTeam" naming | **NEEDS DECISION** | research-reconciliation-2 explicitly flags this as one of only 3 unresolved decisions ("RedTeam Challenge" vs. "Challenge This Trade"). The repo's own README still uses "RedTeam Risk Workbench" as the primary product name — this should be resolved before writing submission copy, since the GitBook target-user field and thesis field will use whichever name is chosen |
| Historical analogues | **RESOLVED / OBSOLETE tension** | B01 lists it as "Future/Conditional"; B02 lists it as "SUPPORTING"; research-reconciliation-2 flags this exact inconsistency and resolves it: not core MVP, include only with a clearly defensible matching method. Treat as **settled: cut from MVP**, mention only as a stated non-goal in the submission form (helps address the sub-theme's "retrieve historical distribution" language honestly) |
| Synthetic hedging | **LOCKED (cut)** | Explicitly removed from MVP core in B01, B02, and research-reconciliation-2 with matching rationale each time. No contradiction |
| Reference market data source (Yahoo Finance / Stooq fallback) | **NEEDS DECISION → now effectively LOCKED by Technical_Integration_Reconnaissance** | B-docs leave this abstract ("reference price provider"); the Technical Integration doc commits to Yahoo primary / Stooq fallback. This is the correct level of specificity and should not be revisited absent a concrete failure |
| Evidence source (GDELT vs. Bitget `bitget-signal` news-briefing skill) | **NEEDS DECISION (not previously surfaced in any document)** | Every document assumes external evidence retrieval (GDELT) without discussing Bitget's own free news/market-intel skills, because those documents were written from B01–B04's abstract "evidence retrieval" requirement outward, not from the GitBook's judging criteria inward. This is a genuine gap this audit is introducing — not a pre-existing contradiction — but it needs a decision before Step 7 of the build order (see Part 11) |
| LLM provider / model | **IMPLEMENTATION DETAIL** | Technical_Integration_Reconnaissance correctly treats this as an environment-dependent choice, not a product decision. Qwen (`qwen3.8-max`) is explicitly subsidized by the hackathon itself via `hackathon.bitgetops.com` and is worth strong default consideration given "Role of the LLM" is a judged field and Qwen is the named sponsor token |
| "89.5-hour" vs "65.5-hour" weekend closure figure | **OBSOLETE (already resolved)** | research-reconciliation-2 explicitly retires the 89.5-hour figure in favor of the correct 65.5-hour Friday-close-to-Monday-open interval. The repo README already uses "65.5h" — confirms the correction propagated. No outstanding action |
| Next.js + TypeScript, no microservices, no queues | **LOCKED** | Consistent between Technical_Definition and Technical_Integration; sensible for the timeline |

**No manufactured disagreements found** beyond the above. The document set is unusually well-reconciled for a solo/small-team hackathon research pass — the two `research-reconciliation` files did real work.

---

# PART 4 — TECHNICAL REALITY CHECK

| Assumption | Status | Basis |
|---|---|---|
| `rNVDAUSDT` is the correct Bitget Reality symbol for tokenized NVIDIA | **CONFIRMED** | Matches Bitget's own rToken campaign page, live spot page (`bitget.com/asia/spot/RNVDAUSDT`), and the Reality Trading Guide's `r`-prefix convention |
| `GET /api/v3/market/tickers?category=SPOT&symbol=rNVDAUSDT` returns `lastPrice`, `bid1Price`, `ask1Price`, `bid1Size`, `ask1Size`, `ts`, `platformTurnover24h` | **PARTIALLY CONFIRMED** | Contract and example response are documented by Bitget officially; **no live call has actually been executed successfully** from any environment used so far (DNS resolution to `api.bitget.com` failed in the reconnaissance sandbox). This must be verified from the actual build machine before anything else |
| `GET /api/v3/market/instruments?category=SPOT` exposes `isReality`/`isRwa` flags for asset-type validation | **PARTIALLY CONFIRMED** | Documented; not live-tested |
| BTC benchmark via the same ticker endpoint (`symbol=BTCUSDT`) | **PARTIALLY CONFIRMED** | Same endpoint family as rNVDA — low incremental risk once rNVDA connectivity is proven |
| Reality order-book depth endpoint requires whitelist access; MVP should rely on top-of-book only | **CONFIRMED** | Explicitly stated in Bitget's own Reality Trading Guide — correctly reflected in Technical_Integration_Reconnaissance's decision not to depend on full depth |
| `GET /api/v3/reality/market/calendar` gives U.S. market holiday/closure data, 1 req/sec, no auth | **CONFIRMED** | Documented Bitget endpoint; combine with deterministic 09:30–16:00 ET session math for reference-market status |
| NVDA reference price via Yahoo Finance web/quote data | **UNVERIFIED as a stable programmatic contract** | Explicitly flagged by the repo's own reconnaissance as the weakest dependency in the entire stack — Yahoo's programmatic quote endpoints are not an officially documented developer API. This is a real, not hypothetical, risk |
| Stooq (`stooq.com/q/?s=nvda.us`) as fallback reference source | **CONFIRMED reachable, UNVERIFIED reliability under load/rate-limiting** | Public, no-key data source; acceptable secondary, not to be over-engineered |
| Bitget Agent Hub `bitget-signal` skills (macro-analyst, market-intel, news-briefing, sentiment-analyst, technical-analysis) are real, free, and require no Bitget account or API key | **CONFIRMED** (verified via Bitget-AI/agent_hub GitHub repo and multiple March–April 2026 Bitget press coverage) | This is real infrastructure sitting unused by the current technical plan. `news-briefing` in particular could plausibly replace or supplement GDELT for the evidence-retrieval stage, and doing so would be a direct, verifiable answer to the "Skill integration count and effectiveness" judging line |
| LLM structured-output workflow (schema-validated JSON, bounded retries, no blind trust of model output) | **CONFIRMED as sound practice**, not yet implemented | Standard and low-risk given the small number of structured objects (Trade, MarketState, Thesis, ScenarioResult, DecisionArtifact) |
| Deterministic stress-scenario arithmetic (basis, spread, P&L under shocks) | **CONFIRMED as correct approach** | Pure TypeScript arithmetic is sufficient; no need for NumPy/Python service, no need for VaR/Monte Carlo |
| Qwen (`qwen3.8-max`) via `https://hackathon.bitgetops.com/v1`, OpenAI-compatible | **CONFIRMED** as documented in the official GitBook, with working Codex/Cursor setup instructions | Free credits (first 300 KYC'd teams) — worth pursuing given tight timeline and because using the sponsor's own model plausibly nudges "Role of the LLM" scoring, though this is a reasonable inference rather than a stated judging rule |

**Net technical reality check:** The plan is sound and well-sourced. The two genuine open risks are (1) unverified live Bitget connectivity from the actual dev machine, and (2) an unstable/unofficial NVDA reference-price dependency. Neither requires an architecture change — both require a 30-minute verification spike before building anything else.

---

# PART 5 — PRODUCT DIFFERENTIATION TEST

**Why would a serious trader use this instead of ChatGPT + Bitget + a chart + Google?** Because assembling "what's the current basis, is the reference market closed, what would a Nasdaq -4% move plus a BTC -8% move do to my specific $2,000 position, and does my actual thesis survive the strongest counter-argument" by hand, across four browser tabs, is exactly the fragmentation the product is designed to remove. ChatGPT alone cannot give live Bitget prices, cannot be trusted to do the arithmetic, and will not adversarially attack the user's own thesis unless heavily prompted — and even then won't do it consistently or with provenance.

**What is the one capability that makes this feel like a decision workbench rather than an LLM wrapper?** The deterministic stress engine bound to a specific position size, combined with the hard separation of Thesis Quality from Position Quality. A wrapper would let the LLM narrate "this seems risky." This product forces an explicit, inspectable "Thesis: STRONGER / Position: WEAKER" split backed by numbers the LLM did not invent.

- **Strongest differentiator:** The Thesis-vs-Position split, married to deterministic (non-LLM) P&L math under named scenarios, with full provenance labeling (fact vs. calculation vs. assumption vs. interpretation).
- **Weakest differentiator:** The "Challenge" / adversarial-thesis stage. Generating a counter-argument to a stated thesis is something any competent LLM can already do reasonably well with a good prompt; the product's value-add here is *process discipline and evidence-grounding*, not a technique competitors can't replicate in an afternoon.
- **Most defensible capability:** The deterministic decision-policy layer that the LLM explains but cannot override. This is genuinely harder to fake in a live demo than it sounds, and judges will notice if a competing "AI trading desk" entry lets the model just narrate a vibes-based verdict.
- **Most easily copied capability:** The four stress scenarios themselves (market shock, crypto contagion, basis widening, combined) — these are a reasonable but not exotic checklist; several other Track 3 entries will likely converge on something similar given the track's own sub-theme description literally suggests "preset stress tests."
- **Most impressive capability for a 2-minute demo:** Watching the system reconstruct real, live rNVDA basis/liquidity/session-status during an actual off-hours window and then produce a verdict that visibly depends on that real state (not a scripted one).
- **Most likely judge objection:** "This is a well-designed spec, but is any of it actually running against live Bitget data, or is this a mockup?" — because the track's judging criteria weight "feature depth (data sources/Skill integration)" heavily, and a static demo of a beautifully documented idea with fixture data will score worse than a rougher demo genuinely hitting Bitget's API.

**Honest assessment:** The differentiation is real but not exotic — it is a *disciplined workflow*, not a novel technique. That is fine for this track (which explicitly wants human-in-the-loop research tools, not moonshot autonomy), but the team should not oversell novelty in the submission copy; the honest and more persuasive claim is rigor and trustworthiness, not invention.

---

# PART 6 — MVP VERTICAL SLICE TEST

**Scenario:** *"I want to buy rNVDA because I think NVDA will keep rallying, but it is Sunday and BTC is weakening."*

| Step | Required input | Required data | Deterministic calc | AI reasoning | Output | Failure condition |
|---|---|---|---|---|---|---|
| 1. Trade input | Free text | — | — | Parse asset/direction/size/thesis | Raw trade candidate | Asset/direction/size/thesis not extractable → clarification |
| 2. Normalization | Confirmed/edited fields | Current rNVDA price (for notional calc if size given in units) | Notional value | Standardize thesis wording | Normalized Trade object | Ambiguous direction/size unresolved after 1 clarification |
| 3. Market state | — | rNVDA ticker, BTC ticker, NVDA reference price, U.S. market calendar | Basis, spread, session status (CLOSED — Sunday) | Interpret relevance only | MarketState object incl. "reference market CLOSED, token tradable" | Bitget ticker unreachable → block; NVDA reference unreachable → degrade to token-only analysis |
| 4. Evidence | — | Fresh NVDA/AI-demand news (GDELT and/or `bitget-signal news-briefing`) | — | Rank relevance, extract candidate support/contradiction | Evidence list with provenance | No evidence found → proceed with explicit "limited evidence" flag, do not fabricate |
| 5. Thesis extraction | — | Evidence | — | Extract thesis, assumptions, dependencies | Thesis object, origin-tagged | Thesis too vague → 1 targeted clarification, else proceed with limitation |
| 6. Challenge | — | Evidence, market state | — | Generate grounded counter-thesis (likely: "reference market closed all weekend — a Sunday BTC weakness signal has no confirmed transmission to Monday's NVDA open, and buying token exposure now takes on 65.5h of basis/liquidity risk to bet on an underlying catalyst you cannot yet observe reacting") | Challenge object with strength label | No credible counter found → explicit "no strong contradictory evidence" statement, not a fabricated one |
| 7. Stress scenarios | Normalized trade, market state | BTC change, configured shock %s | P&L under 4 scenarios (incl. crypto contagion, which is *directly implicated* by "BTC is weakening" in the prompt) | Interpret what each loss means for the thesis | 4 ScenarioResult objects | Missing basis/liquidity data → mark Scenario 3 unavailable, don't fabricate |
| 8. Thesis vs Position | — | All prior objects | Position-quality metrics (size vs. liquidity, basis exposure) | Qualitative STRONGER/MIXED/WEAKER for both dimensions independently | Two independent judgments | — |
| 9. Decision | — | All prior objects | Deterministic policy gates | Explain, do not decide | PROCEED / WAIT / REDUCE / REJECT — plausibly **WAIT** given closed reference market + live crypto-contagion warning signal in the prompt itself | Missing critical dependency → REJECT/block with reason |
| 10. Change conditions | — | Thesis dependencies, challenge | — | Derive 2–4 conditions (e.g., "BTC stabilizes before Monday open," "Monday NVDA open confirms rather than contradicts the AI-demand catalyst") | ChangeCondition list | — |
| 11. Artifact | — | All above | Assemble | Final narrative fields only | Rendered Decision Artifact | Any stage failed critically → Partial Analysis state, not a fake complete one |

**Minimum component count to make this convincing:** trade parser, one Bitget ticker client (rNVDA + BTC via the same endpoint), one NVDA reference client, one calendar/session module, one evidence retrieval call, one LLM call (or small sequential set) for thesis+challenge+explanation, one deterministic scenario/decision module, one artifact renderer. That's roughly 8 real components — small enough to build in the remaining time if scoped tightly, large enough that skipping any one of them (especially live Bitget data) visibly breaks the demo's honesty.

---

# PART 7 — WHAT MUST BE REAL VS MOCKED

| Component | Must be real? | Can be mocked? | Recommendation |
|---|---|---|---|
| Bitget rNVDA ticker (price/bid/ask/size) | **Yes** | No, for the final demo | This is the product's entire claim to being Bitget-native. Verify live connectivity in week 1, not week 2 |
| Bitget BTC ticker | **Yes** | No | Same endpoint family as rNVDA — nearly free once the above works |
| Bitget instrument validation (`isReality`) | Yes, cheaply | Could hardcode `rNVDAUSDT → NVDA` as product config instead | Hardcoding the single supported mapping is explicitly sanctioned by the docs and is the pragmatic choice given one supported asset |
| U.S. market session status | **Yes** | A controlled fixture is acceptable *only* to guarantee the demo lands in an off-hours window if the live clock doesn't cooperate, and must be visibly labeled as such | Build the real deterministic calendar+clock logic regardless — it's cheap and it's the whole point of the wedge |
| NVDA reference price | Prefer real | Controlled snapshot acceptable for rehearsal, not for the graded submission demo | Given this is the flagged weakest dependency, build a thin provider interface now so swapping Yahoo→Stooq→a third source costs one file, not a rewrite |
| Evidence/news | Prefer real | Curated fixture acceptable if the free API returns nothing useful in the room | Try `bitget-signal news-briefing` first (see Part 11) — using Bitget's own skill instead of a generic scraper strengthens both reliability and the "Skill integration" judging line simultaneously |
| Deterministic scenario math, basis, spread, P&L | **Yes, always** | Never | This is the trust-critical core the entire product philosophy is built around; mocking it defeats the product's own thesis |
| LLM reasoning (thesis extraction, challenge, explanation) | **Yes** for the demo | Fixture responses only for isolated unit tests during development | Must run live in the actual demo — a scripted/canned LLM response would be immediately detectable by an attentive judge and would contradict "the verdict must emerge from real evidence" |
| Portfolio/account context | No | Yes — optional, user-typed relevant exposure only | Correctly out of scope; do not build Bitget account auth under time pressure |
| Persistence/history | No | Yes — none needed at all | Confirmed correct; skip entirely |
| Paper trading, hedging, execution | No | N/A — should not exist in this build at all | Out of scope; do not touch |

---

# PART 8 — TECHNICAL RISK REGISTER

### P0 — Could kill the demo
1. **Live Bitget API connectivity has never been verified from an actual runtime.** The only reconnaissance attempt hit DNS failure. If `api.bitget.com` is unreachable from the eventual deploy environment (or blocked by network policy on a student/campus connection), the entire Bitget-native claim collapses. *Mitigate immediately — this is the first thing to test, today, before writing any other code.*
2. **NVDA reference price source is not a stable, officially contracted API.** If Yahoo's programmatic endpoint changes shape or rate-limits during the live judged demo, the basis/reference-dependent half of the artifact silently degrades. *Mitigate with a thin provider interface and a rehearsed fallback (Stooq), tested in advance, not discovered live.*
3. **No code exists yet, and 9 days remain**, including time for the required X post, project-description writing, and rehearsal. Scope discipline is now the single largest risk factor in the entire project.

### P1 — Could materially weaken the demo
4. **Under-use of Bitget's own free AI Skills** (`bitget-signal`) despite a judging rubric that explicitly names "Skill integration count and effectiveness." Currently zero Bitget Skills are planned; only raw market-data endpoints.
5. **Evidence quality from a no-key news search** (GDELT or otherwise) may surface irrelevant or thin results for a niche thesis, weakening the Challenge stage's credibility live.
6. **LLM structured-output reliability** — malformed JSON from the model mid-demo, without validation/retry, could break the pipeline visibly in front of judges.
7. **Off-hours demo timing** — the strongest demo requires the reference market to actually be closed. If the live judged session happens to fall during U.S. market hours, the "wedge" is less visually obvious. A clearly-labeled fixture toggle is a reasonable safety net but must not be presented as live data.
8. **"RedTeam" branding indecision** could leak into submission copy inconsistently (README still says "RedTeam Risk Workbench," while the newer docs prefer a plain "Challenge" framing) — small but visible polish risk to judges.

### P2 — Can be deferred
9. Historical analogues, richer correlation/factor analysis, paper trading, decision history, portfolio/account integration, Bitget Agentic account/OAuth, Best Spread Award X-campaign optimization.

---

# PART 9 — BUILD READINESS

**PRODUCT: 9/10** — Exceptionally well-specified, internally consistent, and precisely matched to the track and named sub-theme. Losing a point only because two small naming/scope decisions ("RedTeam" branding, historical-analogue framing for the submission form) remain technically open.

**TECHNICAL: 7/10** — The architecture is correctly minimal and every claim in the technical docs is either confirmed or clearly flagged as unverified rather than asserted as fact. Docked for the two live, unverified external dependencies (Bitget connectivity, NVDA reference source) and for the fact that literally none of it has been executed yet.

**HACKATHON ALIGNMENT: 8/10** — Conceptual fit to the track and sub-theme is close to perfect. Docked for missing the Skill-integration opportunity that the judging rubric explicitly names, and for three still-open submission-mechanics items (X post, validation-metrics paragraph, LLM-role paragraph) that are easy but currently undone.

**DIFFERENTIATION: 7/10** — The Thesis-vs-Position split plus deterministic-math-bound-to-position-size is a genuinely defensible mechanism, not just branding. Docked because the underlying "challenge an LLM to argue the other side" technique is not hard to replicate, and several competing Track 3 entries will likely converge on similar stress-testing framing given the sub-theme's own wording.

**DEMO READINESS: 2/10** — No application exists. This is the score that matters most right now: everything above this line is worth zero to a judge until a runnable, accessible demo exists.

---

# PART 10 — WHAT WE SHOULD NOT DO

Specific to this project, in the remaining ~9 days:

- Do **not** write a fifth strategy/research document. The product thinking is done; further reconciliation passes have negative marginal value now.
- Do **not** build portfolio management, account authentication, or any Bitget account/OAuth flow — B01–B04 already correctly cut this, and it directly competes for time against the one thing that's actually required (a working demo).
- Do **not** attempt historical-analogue retrieval "because the sub-theme mentions it" — the repo's own reconciliation already correctly identified this as unproven and out of MVP scope. Address it in the submission text ("deliberately deferred, here's why") instead of building it under time pressure.
- Do **not** build a multi-vendor market-data abstraction layer for the NVDA reference price. One provider + one fallback, both already chosen.
- Do **not** add a database, decision history, or session persistence. Explicitly and repeatedly ruled out — correctly.
- Do **not** attempt a synthetic-hedge feature to "show off" Bitget futures integration. Already correctly killed in three separate documents; resurrecting it now would be pure risk with no product upside.
- Do **not** spend meaningful time on visual polish, animations, or a "thinking" UI before the core rNVDA → Decision Artifact path works end-to-end once, live, against real Bitget data.
- Do **not** wait until the last day to record the required X post or write the Project Description — these are hard eligibility gates independent of code quality, and the Best Spread Award specifically rewards *early and ongoing* posts, not a single last-minute one.
- Do **not** let "RedTeam" vs. "Challenge" naming indecision bleed into inconsistent submission copy — pick one now (see below).

---

# PART 11 — FINAL DECISION

## BUILD NOW

The product is not underspecified, and no further product-strategy decision is blocking implementation. The three genuinely open items (RedTeam naming, evidence-source choice, exact demo off-hours handling) are small enough to resolve in minutes, not days, and should be resolved *as part of* building, not before it.

**Exact first engineering task:** Before writing any product code, spend the first work session on a **standalone, throwaway connectivity script** that does nothing but:
1. Call `GET /api/v3/market/instruments?category=SPOT` and confirm `rNVDAUSDT` returns with `isReality`/`isRwa` set.
2. Call `GET /api/v3/market/tickers?category=SPOT&symbol=rNVDAUSDT` and `symbol=BTCUSDT` and print the live response shape.
3. Call `GET /api/v3/reality/market/calendar` and print the live response shape.
4. Attempt one live NVDA reference fetch (Yahoo) and one Stooq fallback fetch and print both.

If all four succeed, the P0 risks in Part 8 are retired and the team can proceed straight down the Technical_Integration_Reconnaissance build order (Part 21 of that document) with confidence. If any fail, that failure — not this audit — determines the next decision (e.g., swap reference provider, or escalate connectivity troubleshooting) before any further product code is written.

---

# PART 12 — FIRST IMPLEMENTATION MILESTONE

**Milestone name:** *Live rNVDA Market State Slice*

**Objective:** Prove the one dependency everything else in the product is built on top of — that this application can, right now, from the real development/deploy environment, pull live Bitget rNVDA + BTC market data and a live (or credibly-fallback) NVDA reference price, and turn it into the `MarketState` object defined in `Technical_Definition_Vertical_Slice.md` §7.

**Inputs:**
- Hardcoded product config: `rNVDAUSDT → NVDA` mapping.
- No user input required for this milestone — this is an infrastructure proof, not a feature.

**Outputs:**
- A single logged/rendered `MarketState` object containing: rNVDA last price, bid/ask/sizes, timestamp; BTC last price/24h change/timestamp; NVDA reference price/previous close/timestamp; calculated basis (absolute + percent) and spread (absolute + percent); U.S. reference-market status (OPEN/CLOSED/UNKNOWN) computed from real UTC time + Bitget's calendar endpoint; an explicit `limitations[]` array if any component failed.

**Technical components:**
- Next.js + TypeScript app shell (empty otherwise).
- Zod (or equivalent) schema for `MarketState`.
- One Bitget API client function (ticker + instruments + calendar).
- One NVDA reference client function (Yahoo primary, Stooq fallback) behind a single provider interface.
- Pure-function basis/spread/session-status calculators (Technical_Definition §7, §5).

**Acceptance criteria:**
- Running the app (or a CLI script) produces a real, current `MarketState` object with real Bitget timestamps, not fixture data.
- If the NVDA reference call fails, the object still renders with `relationship.available = false` and a stated limitation — it does not crash and does not fabricate a price.
- If Bitget connectivity itself fails, the milestone is **not met** and this becomes the top-priority bug of the entire project, ahead of any other feature.

**Explicitly excluded from this milestone:** trade input/normalization, thesis extraction, LLM calls of any kind, stress scenarios, decision policy, the Decision Artifact UI, and any evidence retrieval. This milestone proves data plumbing only — the smallest possible checkpoint that retires the project's single largest unverified risk.

---

## CURRENT PROJECT STATE
A fully documentation-complete, well-reconciled hackathon entry for Bitget AI Base Camp Hackathon S2, Track 3 (AI Trading Desk), sub-theme Decision Stress Testing. Zero application code exists. Product philosophy, information architecture, and technical design are all locked to a level of detail well beyond what most hackathon teams produce before writing code.

## DECISIONS LOCKED
Core decision loop; four deterministic stress scenarios; Thesis-vs-Position as two independent, non-collapsible judgments; strict deterministic/AI-interpretation separation; no persistence/database for MVP; portfolio context optional; no synthetic hedging; no historical analogues in MVP core; Next.js/TypeScript single-app architecture; Bitget public market API as the primary data path (`rNVDAUSDT`, `BTCUSDT`, instruments, Reality calendar); Yahoo-primary/Stooq-fallback NVDA reference provider.

## DECISIONS OUTSTANDING
1. Final user-facing product name/branding ("RedTeam Challenge" vs. a plainer "Challenge This Trade" framing) — resolve before writing submission copy.
2. Whether to route evidence retrieval through Bitget's own `bitget-signal news-briefing`/`market-intel` skills instead of, or alongside, GDELT — resolve during Step 7 of the build order, informed by which returns more relevant results for an NVDA-demand thesis in testing.
3. Exact LLM provider/model — default recommendation is the hackathon-subsidized Qwen (`qwen3.8-max` via `hackathon.bitgetops.com/v1`) given free credits and sponsor alignment, with any OpenAI-compatible fallback if structured-output reliability proves inadequate in testing.

## RISKS
See Part 8 in full. Top three: (1) unverified live Bitget API connectivity from the real dev/deploy environment; (2) unstable/unofficial NVDA reference-price dependency; (3) zero code with ~9 days to a hard submission deadline that also requires an X post and a six-part project description independent of the code itself.

## BUILD / FIX / RETHINK
**BUILD NOW.** No product-strategy question is blocking implementation. Proceed directly to the first implementation milestone.

## NEXT SINGLE ACTION
Run the standalone Bitget + NVDA-reference connectivity verification described in Part 11, today, before writing any other code. Everything else in the project is contingent on its result.
