# Problems Faced & Solved — Engineering Log

> **What this document is.** The complete problem → root-cause → fix → verification ledger for the Bitget AI RedTeam Desk, in one place. Every fix is tied to the commit, test run, or raw capture that proves it, following this repository's evidence-first convention (raw verification output lives in the local-only raw ledger `docs/archive/EVIDENCE_DUMP.md`, regenerable via `scripts/build-evidence-dump.cjs`).
>
> **Sources:** the 2026-09-27 evidence-and-fix session (raw captures in `raw_*.tmp.*` + commits `6b4efaf`, `f78537a`), the 2026-09-30 demo-pipeline integrity session (probes and proofs in [`SUBMISSION_SIGNOFF.md`](./SUBMISSION_SIGNOFF.md)), the 2026-10-01 submission audit (response hardening, test-integrity fixes, judge-doc corrections), and fixes mined from the commit history. Fix dates are UTC. Capture files are local-only scratch (gitignored); the durable proof for each entry is the commit and/or test file named alongside it.

---

## 1. Session of 2026-09-30 — demo-pipeline integrity: recorded numbers beat intercepted numbers

### 1.1 Route interception produced demo numbers that could not be distinguished from fabrication

- **Problem.** Earlier demo-video takes captured the UI while network routes were mocked and (in one mechanism) verdict badges were painted from a band lookup in the component layer. The numbers looked right on screen, but nothing tied them to a run the app actually produced — indistinguishable from fabrication from the outside, and two sources of truth for the verdict.
- **Root cause.** Interception and DOM painting are presentation shortcuts: they bypass the policy engine and leave no artifact a skeptic can re-derive.
- **Fix.** The mobile brand cut (Video 4) was rebuilt on a zero-mock pipeline: a read-only CDP `Runtime.addBinding` fetch-tee in `scripts/record-brand-mobile.js` mirrors the app's own SSE to disk (no interception, no injection); `scripts/extract-brand-live-artifact.cjs` reconstructs the artifact of record (`demo-out/brand-live-recorded-artifact.json`); TTS and SFX are derived from recorded values (`scripts/build-brand-live-audio.py`); captions ship as a separate `.srt` (no burn-in). Integrity rules now encoded in `scripts/README.md`: no route mocking, no injected artifacts, no time compression of live acts.
- **Verification.** Full trace of the six numbers of record: **14/14 checks** in the [Submission Sign-Off §4](./SUBMISSION_SIGNOFF.md) (artifact-verbatim plus exact-derivation standard, timeline cross-check). **Follow-up (2026-09-30, later session):** the desktop brand cut (Video 3) was rebuilt on this same zero-mock pipeline (`scripts/record-brand-desktop.js`, 1280×720) — the route-interception gap is now **closed on both brand cuts**; the desktop trace stands at **17/17 checks** in [`scratch/video3/trace-desktop.cjs`](../scratch/video3/trace-desktop.cjs) (local, re-derivable), and a new wall-clock sync guard (heartbeat + drift assertion) was added to the recorder after frame-drop compression was caught in the first takes.

## 2. Session of 2026-09-30 (II) — research-provider honesty pass + stream-abort guard

### 2.1 Provider advisory lines diagnosed: budget starvation, wrong endpoint, and honest EMPTY

- **Problem.** Every live run emitted three provider advisories (`bitget-us-equity-mcp` unavailable, `bitget-signal` timed out, `chainbase-agentkey` empty), which read as breakage. Probes showed the causes were environmental, not code defects: the `.env.local` override pointed the US-equity provider at `https://datahub.noxiaohao.com` (missing `/mcp`), the signal gateway's own MCP handshake measured ~4.2s against a 2.5s connect / 5s outer race budget, and the registry's per-provider budget was hard-coded.
- **Root cause.** The outer race budget in `ResearchProviderRegistry` (fixed 5s) silently overrode the signal provider's own documented timeout knobs; the endpoint override routed a US-equity catalog request to a gateway that serves only crypto/macro tools (verified live `tools/list`: 19 tools, no `guide`/`do_query`).
- **Fix.** Registry budget is now env-tunable via `RESEARCH_PROVIDER_BUDGET_MS` (default 5s unchanged, clamped [3s, 30s]; pure helper `resolveProviderBudgetMs`, pinned by `tests/research-budget.test.cjs`), with `BITGET_SIGNAL_CONNECT_TIMEOUT_MS=4000` / `BITGET_SIGNAL_TOOL_TIMEOUT_MS=12000` in local env. The wrong US-equity override was **removed** rather than corrected: pointing it at datahub would trade an honest UNAVAILABLE for a manufactured TIMEOUT, and the real catalog host (`agent.bitget.com`) is DNS-blocked on this network — a condition only the operator can lift.
- **Verification.** Live run after restart: `bitget-signal` moved from TIMEOUT to **reachable** (EMPTY is the accurate outcome for a US-equity trade — its tools are crypto/macro); latency for the standard trade fell **2.6 min → 96s**; suite 319/319. The remaining two advisory lines are now *accurate statements* about the environment, not failures to hide.

### 2.2 SSE final-result enqueue crashed when a client aborted mid-stream

- **Problem.** `POST /api/stress-test` logged `Internal service error during stream: TypeError: Invalid state: Controller is already closed` whenever a client disconnected while the workflow ran (browser timeout, probe abort). The progress path guarded closed controllers; the final-result path did not.
- **Fix.** Same guard pattern applied to the final-result enqueue in `src/app/api/stress-test/route.ts`.
- **Verification.** Probe abort during a long run produces no stream error; successful runs still deliver the result frame.

### 2.3 Browser-relayed stack frames across a `.next` cache generation lied about the source

- **Problem.** After an abrupt dev-server kill, an open browser tab kept reporting `ReferenceError: Cannot access 'decision' before initialization` at a source line that no longer existed in the file on disk.
- **Root cause.** The tab held pre-kill HMR chunks referencing deleted chunk hashes; Next's error overlay decompiled them against the *current* source map, producing stack frames that pointed at the wrong lines.
- **Fix.** Cold-clear `.next` and hard-refresh clients after any abrupt dev-server kill. Never diagnose from a stale tab's relayed stack.
- **Verification.** Fresh-chunk headless probe drove the full landing → workspace → artifact → tolerance-lever flow with **0 console errors** (`scratch/verify/tdz-probe.cjs`, local).

### 2.4 The dev service worker replayed stale Turbopack chunks after every rebuild

- **Problem.** After a rebuild, a dev session kept executing pre-rebuild modules; the code on screen lagged the code on disk and errors pointed at lines that no longer existed.
- **Root cause.** `PwaProvider` registered the service worker in every environment. The SW caches `/_next/static/*` cache-first — correct for hashed production chunks, wrong for dev, where Turbopack reuses unhashed chunk URLs across rebuilds.
- **Fix.** Registration is now production-only (`process.env.NODE_ENV === "production"` guard in `src/components/pwa/PwaManager.tsx`).
- **Verification.** The guard is structural (dev installs no SW; production registration unchanged); suite 331/331 at the time and `npx tsc --noEmit` 0 after the change (the count has since re-baselined to **397/397 across 41 files** — see §4A.7).

## 3. Session of 2026-09-27 — evidence dump → parser hardening → latency honesty

The session ran in two passes, per the methodology in the raw evidence ledger (local-only `docs/archive/EVIDENCE_DUMP.md`, regenerable via `scripts/build-evidence-dump.cjs`): **first** a no-fixes evidence dump of every claim, parser input, policy matrix, and live-data path; **then** fixes for what the dump exposed.

### 3.1 Latency claim in judge-facing docs was falsified by fresh measurement

- **Problem.** PRODUCT_DESCRIPTION Part 3 claimed live evaluation at "16.8–17.7s." Fresh runs against the deployed app measured **12.76s–50.62s** — the 50.62s outlier breached the stated 45s budget. The evidence dump logged the MISMATCH with no fix applied.
- **Root cause.** The earlier range came from a small sample on a day the primary LLM gateway happened to behave; it was written as if steady-state.
- **Fix.** Commit `f78537a` replaced the range across all three judge-facing docs (PRODUCT_DESCRIPTION.md, docs/CONNECTIVITY_REPORT.md, docs/PRE_SUBMISSION_REPORT.md) with the honest 6-run range **11.75s–50.62s** (fixture mode 0.51s), stating the mechanism: the shared Qwen gateway was unavailable in **all 6 measurements — 0/18 LLM stage calls landed on Qwen; every stage ran on the Gemini failover path** (`circuitState: "FAILOVER_GEMINI"`; see raw capture `raw_recon_circuit.tmp.txt` methodology and commit history). The spread tracks whether a run's window hit a Qwen retry-probe (5s timeout before fallback). Also stated plainly: the workflow carries a **45s internal LLM-stage deadline** with deterministic fallback and a **60s hard function ceiling**; the slowest run exceeded the internal deadline and still completed inside the ceiling.
- **Verification.** Raw SSE captures of all 6 live runs (3 evidence-dump + 3 recon runs) with per-run wall clock, verdict, and circuit state; 6/6 runs returned `DECISION_READY` — the 100%-of-runs claim held.

### 3.2 Parser silently accepted invented r-tokens (evidence dump ADV2)

- **Problem.** `buy $2,000 of rQXYZ because moon` was accepted as a valid trade: the generic r-token rule captured the invented asset and the parser produced a full `normalizedTrade` — which would dead-end at the market-state step. Caught by the evidence dump, not by the test suite.
- **Root cause.** The parser's supported-asset list was a hand-maintained literal `[\"rNVDA\", \"rTSLA\", \"rMSTR\", \"rCOIN\", \"rAAPL\", \"rAMZN\"]` used only for typo correction; an unknown r-token that survived typo correction fell through as valid.
- **Fix.** Commit `6b4efaf`: the supported list is now derived from `ASSET_RISK_PROFILES` (`src/core/scenarios/config.ts` — the exact set the deterministic stress engine can model, minus the `DEFAULT` fallback key). An unknown r-token that survives typo correction returns an **asset clarification naming the supported tokens**, with `normalizedTrade: null`.
- **Verification.** Post-fix capture shows `status 422 / CLARIFICATION` with `\"rQXYZ isn't a supported asset — did you mean one of: rNVDA, rTSLA, rMSTR, rCOIN, rAAPL, rAMZN?\"`; regression test `unsupported invented r-token triggers asset clarification (evidence dump ADV2)` in `tests/competitor-sabotage.test.cjs`; full parser matrix re-run byte-compared against the pre-fix capture (only elapsed-ms timing differs).

### 3.3 Parser silently resolved contradictory direction (evidence dump ADV4)

- **Problem.** `long but I think it'll crash, $3,000 rNVDA` resolved to a silent LONG; the contradicting text passed through as thesis content and a full `normalizedTrade` was produced with `requiresClarification: false`.
- **Root cause.** Direction extraction took the first directional keyword and had no contradiction channel.
- **Fix.** Commit `6b4efaf`: direction-contradiction detection (opposing directional language vs. the resolved direction) surfaced through the parser's existing ambiguity channel — an inferred `direction-contradiction` field plus a direction clarification request. Guard cases added so bullish \"short squeeze\" / \"short interest\" vocabulary does not false-positive on LONG inputs (negative lookahead) and `long` inside ordinary words never matches (existing `\b` boundaries).
- **Verification.** Regression tests: `direction contradiction in thesis triggers direction clarification (evidence dump ADV4)`, `bare 'short' still triggers direction contradiction on LONG`, plus both negative guards (see 1.4); post-fix parser capture identical on all untouched cases.

### 3.4 Mid-fix regression caught by the suite — then resolved

- **Problem.** The first cut of the ADV4 fix over-triggered: 2 new guard-case tests failed (`raw_tests_afterfix3.tmp.txt`) — \"short squeeze\" vocabulary on a LONG input and `long` inside \"belongs/longer\" on SHORT inputs were being flagged as contradictions.
- **Root cause.** Naive keyword matching treated the word \"short\" in bullish trading vocabulary as an opposing-direction signal.
- **Fix.** Negative lookahead (`/\bshort(?!\s*(?:squeeze|interest))\b/`) plus the parser's existing word-boundary matching.
- **Verification.** Next full run: **298/298 passing, 0 skipped** (`raw_tests_afterfix4.tmp.txt`). Re-verified fresh on 2026-09-27: `npm test` → `# tests 298 / # pass 298 / # fail 0`.

### 3.5 Side effect: test-count claims in judge-facing docs went stale

- **Problem.** The parser fix added 5 sabotage subtests (Tier 2: 8 → 13), growing the suite **293 → 298** — but PRODUCT_DESCRIPTION.md and PRE_SUBMISSION_REPORT.md still claimed 293/293 and \"28 adversarial subtests.\"
- **Fix.** Counts corrected to **298/298 across 32 test files, 33 sabotage subtests** in this pass (PRODUCT_DESCRIPTION.md Part 3; PRE_SUBMISSION_REPORT.md verification state and addendum).
- **Verification.** Fresh `npm test` count (1.4) + `ls tests/*.test.cjs | wc -l` = 32.

### 3.6 Circuit-breaker behavior under a dead primary gateway (validated, not a bug)

- **Problem (question posed).** Does the failover story hold when the shared Qwen gateway is fully down?
- **Finding.** Recon across 3 identical live runs (`raw_recon_circuit.tmp.txt`): every LLM stage reported `FAILOVER_GEMINI`; run wall-clocks 19.50s / 11.75s / 18.40s; all 3 runs returned `DECISION_READY` with verdict `REJECT` from live data. Zero of 9 stage calls landed on Qwen and the user-visible workflow never failed — the resilience claim in [`SUBMISSION.md`](../SUBMISSION.md) is confirmed, and the primary-path outage is disclosed in 1.1.

### 3.7 Repository hygiene from the session

- The session left ~30 `raw_*.tmp.*` captures, 6 throwaway harness scripts (`evidump_*.tmp.*`, `parserdump/riskdump/recon_circuit/diff_cases`), and `scripts/build-evidence-dump.cjs` (rebuilds the raw ledger from fresh captures). All are local-only scratch, now covered by `.gitignore` patterns; the raw ledger itself is also local-only (untracked 2026-10-01) — the durable evidence is this log, the sign-off, and the test suite.
- `next-env.d.ts`: Next.js regenerated it from `./.next/dev/types/*` (dev server) to `./.next/types/*` (build) — a generated-file artifact of running `next build` after `next dev`; see §2.6.
- `.githooks/` (wired via `core.hooksPath`): `commit-msg` strips AI-agent trailers from commit messages; `pre-push` rejects any push whose commits still contain them — a project-policy guard, not a bug fix.

---

## 4. Historical fixes (mined from commit history, newest last)

| Problem | Root cause | Fix | Proof |
|---|---|---|---|
| Windows production build failed | Turbopack could not resolve win32-msvc native binaries for `lightningcss` + `@tailwindcss/oxide` loader fallback chains | `optionalDependencies` entries + postinstall binary staging + `serverExternalPackages` (commits `5b57b63`/`600fdc7`) | `docs/PRE_SUBMISSION_REPORT.md` §\"Windows build repaired\"; clean `npm run build` (12 routes) |
| Explosive retry cascade on LLM timeout | Timeout errors re-entered the retry loop, multiplying latency | Retry-cascade prevention (`036d06c`) | adversarial-llm timeout tests |
| `AbortError` treated as JSON parse error | AI modules misclassified abort signals, logging spurious parse failures and re-prompting | Distinct AbortError handling (`8768586`), plus stream-buffering fix (`e518771`) and 60s Vercel function ceiling (`1aa8866`) | adversarial-llm suite, Provider Timeout subtest |
| Shared hackathon gateway returned HTTP 429 under load | Single upstream LLM with no failover | Circuit breaker with instant Gemini failover + graceful deterministic degradation (documented in [`SUBMISSION.md`](../SUBMISSION.md) §Resilience) | recon captures (§1.6); 429/5xx/timeout subtests |
| Fabricated historical P&L in judge-facing docs | \"$4,515 …\" etc. presented as audited 2024 rToken outcomes — impossible (platform launched May 2026) | All fabricated figures purged; retrospective content relabeled `[ILLUSTRATIVE]` engine-executed walkthroughs (`cecdd18`) | [`RETROSPECTIVE_CASE_STUDIES.md`](./RETROSPECTIVE_CASE_STUDIES.md) disclaimer; grep-verified zero hits |
| Falsified latency claim (\"under 12 seconds cold\") | Claim written from best-case sample, never measured against deployment | Corrected twice — first to measured 16.8–17.7s, then to the honest 6-run 11.75s–50.62s range (§1.1) | Raw-ledger §1b MISMATCH entry (`docs/archive/EVIDENCE_DUMP.md`, local-only); commit `f78537a` |
| \"Thinner live than README\" — MCP providers contributed zero evidence silently | Provider failures were swallowed; artifact showed no per-provider outcome | Research registry reports per-provider outcomes (OBSERVATIONS / EMPTY / UNAVAILABLE / ERROR / TIMEOUT); limitations name every attempted provider and failure mode | `PRE_SUBMISSION_REPORT` addendum item 2; live limitations rows in captures |
| Parser missed full company names (\"NVIDIA\") and near-miss typos (\"rNVDDA\") | Asset recognition matched only exact r-tokens | Company-name mapping + edit-distance ≤ 2 typo correction surfaced as inferred field (`0dd3d78`) | sabotage Tier-2 subtests (FIX1/FIX2 cases) |
| Parser regex failed on exposure amounts without trailing preposition | Regex assumed \"of/between \"$N\" phrasing | Regex fix (`4a87a5c`) | sabotage Tier-2 subtests |
| CI lockfile drift (`lucide-react`) | Dependency added to `package.json` without syncing lockfile | Lockfile re-synchronized (`691a1f4`, `e7e6902`) | green CI on `main` |
| UI fake progress + hardcoded assumptions | Workbench showed canned progress not tied to pipeline stages | Stage-bound SSE progress wired to the real pipeline (`7865fd3`) | live SSE captures (8 stages) |
| Hidden-reasoning LLM latency blowing the workflow budget | Hackathon Qwen model ran with thinking enabled by default | `enable_thinking: false` by default, opt-in via `LLM_ENABLE_THINKING=1` | [`ARCHITECTURE_AND_LIMITATIONS.md`](../ARCHITECTURE_AND_LIMITATIONS.md) §5 |
| No security headers on any response (submission audit finding) | Next.js defaults: responses carried only the `X-Powered-By` fingerprint and zero hardening | CSP (same-origin; `'unsafe-inline'` script tradeoff documented in-file), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, host-only HSTS, `Permissions-Policy`; `poweredByHeader: false` | curl on a production build: all six headers on `/`, POST `/api/stress-test`, media, and 404; browser pass under CSP; commit 9 of the Phase 4 ladder |

---

## 4A. Wrap-up pass (2026-10-03): parser P0, provenance wiring, mobile control sizing

### 4A.1 Parser read a clock time as an entry price (P0)

- **Problem.** "I plan to buy $10,000 rNVDA ... at 10:15 AM ET" parsed to `entryPrice: 1`, `quantity: 10000`, `MARKET_RISK estimatedPnlPct: +11300%`, and the artifact emitted the reason "Worst-case scenario loss (10789.49%) is within the STRONGER threshold (>= -5.00%)" — an absurd number passing a safety gate. The same path turned "elevated at 0.45%" into a $0.40 entry price (quantity 125,000 on a $50,000 position).
- **Root cause.** `plainAtMatch` used a greedy `[\d,]+` under a trailing-only guard. The guard rejects the *full* match, so on backtracking the engine shrank "10:15" to "1" and satisfied the guard. Both preset prompts hit it.
- **Fix.** "/(?:at|@\s*(?<![\d.,])(-?\d[\d,]*(?:\.\d+)?)(?!\d)(?!\.\d)/" — lookbehind rejects a mid-number start, the lookaheads reject truncation.
- **Verification.** 39-case before/after corpus diff: **7 behavioral changes, all correct** (the two reported bugs, plus `at 12:00 pm`, `at 11:30 ET`, `at 100 bps`, `at 130.5%`, `at 0.5%` now correctly not treated as prices). Every legitimate form (`at 130.50`, `at 1,250`, `at 9.35 usd`, `at 2,500.50`, `at $350`, `@ -50`) byte-identical. Matrix cases 19–23 pin it. End-to-end via `DecisionDeskService`: `COMBINED_SHOCK` went from `+10789%` to `-9.25%`.

### 4A.2 Provenance lineage was declared but never wired

- **Problem.** `provenanceIdFor` was imported by nothing but its own test, and `onSelectProvenance` sat on `DecisionArtifactViewProps` without a single call site — the prop was threaded from `page.tsx` into a component that ignored it, so no headline number was clickable while the README advertised the affordance.
- **Fix.** Four market-state tiles and four scenario cards now call `onSelectProvenance(provenanceIdFor(...))`. The market-state id derives from `marketState.sources[0]?.id` rather than a hardcoded string, so the link resolves in fixture mode (`prov-source-fixture-bitget`) and live mode alike. Removed the `{ id: recordId } as any` cast in `page.tsx` by typing the drawer selection `{ id: string } | null` — the drawer only ever read `.id`.
- **Verification.** `tsc` clean; `eslint` clean. Caught a real regression during this pass: converting the scenario card from `div` to `button` dropped `key={sc.id}` and `eslint` surfaced it as `react/jsx-key` — restored.

### 4A.3 Mobile header controls resized on every state change

- **Problem.** Every mobile control sized to its own label, so the bar reflowed as state changed: the mode toggle swung between `LIVE` (4 chars) and `FALLBACK` (8) — roughly 2x its width; the risk lever shifted 6px (`MED` 29px → `HIGH` 35px) for one extra character; the audit badge grew when its count pill appeared. All were below the 44px touch minimum (`29x28`, `35x28`).
- **Root cause.** `padding + auto width` with no fixed slot, so character count set the geometry.
- **Fix.** One rule across the mobile header: every control gets a fixed slot, and state is carried by **color and icon, never text length**. Mode `w-[92px]` with a two-letter code (`FX`/`LIVE`/`FB`/`OFF`); risk lever `w-[72px]` cycling `LOW`→`MED`→`HIGH` with a fixed 34px label slot; theme `w-[44px]`; audit badge `w-[44px]` with the count pinned as an absolute overlay (clamped to `9+`). Full words remain in `title`/`aria-label`. The theme button's `DAY`/`NIGHT` text was removed per request — glyph only, names kept in `aria-label`/`title`. Desktop keeps its segmented group and `THEME` label.
- **Verification.** Playwright against a production build: 8 state transitions (2 mode toggles, 3 risk levels, 2 theme toggles) at 360px and 390px, re-measuring `getBoundingClientRect()` after every click. **Every control held a byte-identical size in all 8 samples** (mode `92x44`, risk `72x44`, theme `44x44`, audit `44x44`); no horizontal page scroll; zero page errors.

### 4A.4 Dev server cannot hydrate — browser verification must use a production build

- **Problem.** Under `next dev`, React fails with "eval() is not supported in this environment" and **no button responds**. Two verification passes were silently blocked before the cause was found.
- **Root cause.** `next.config.ts` sets `script-src 'self' 'unsafe-inline'` with no `'unsafe-eval'`; React needs eval in development mode.
- **Fixed (2026-10-04).** Two causes, not one. (1) `script-src` now appends `'unsafe-eval'` **only** when `NODE_ENV === "development"`; production stays `'self' 'unsafe-inline'` (probed on a production build header — no eval). (2) Next 16 blocks dev-only resources (HMR socket, dev fonts) when the page is opened by IP instead of `localhost`; `allowedDevOrigins: ["127.0.0.1"]` was added to `next.config.ts` (development-only; production serving unaffected). Verified with Playwright on both `127.0.0.1:3000` and `localhost:3000`: React mounts (219 hydrated fibers), a preset click fills the thesis textarea, the risk lever cycles, and there are zero WebSocket/CSP/eval errors. UI release verification still uses `npm run build` + `next start`.

### 4A.5 Launcher presets advertised verdicts the engine never returned

- **Problem.** The four preset cards were labeled `PROCEED` / `REDUCE` / `WAIT` / `REJECT` under a "Calibrated Policy Scenarios" header and a "4 PRESETS" count, implying a 2x2 calibration. The `verdict` field was decorative: it was rendered but never compared against the engine result.
- **Root cause.** The deterministic fixture is a single hardcoded `WEEKEND` market state (`src/fixtures/rnvda-demo.ts`). Weekend gating fires on every fixture run, so position size and thesis cannot move the verdict. The 2x2 could not be reproduced from any threshold.
- **Fix.** Relabelled each card to the verdict it actually returns, and changed the grid copy to "Trade shapes (engine decides verdict)" / "4 SHAPES" so the four cards are presented as four *inputs*, not four guaranteed outcomes. Thresholds were **not** tuned to manufacture distinct verdicts.
- **Verification — recorded fixture runs (deterministic):**
  - `cash-hours $10k` -> **WAIT**, worst `COMBINED_SHOCK -9.25%`
  - `leverage $50k` -> **WAIT**, worst `COMBINED_SHOCK -9.25%`
  - `weekend $2k` -> **WAIT**, worst `COMBINED_SHOCK -9.25%`
  - `unhedged $100k` -> **CLARIFICATION** (`asset`: the prompt names no ticker, so the desk refuses to guess)
- **Verification — live sample (NOT a regression signal):** one run of the $2k weekend prompt returned **REJECT** at 30.6s with `dataSource: live`, basis `+0.32%`, spread `0.034%`, worst `COMBINED_SHOCK -9.32%`. Note the live verdict differs from the fixture verdict on the same input — live basis is ~8x smaller than the fixture's +2.56%, which is enough to cross a policy threshold. Live runs land on the Gemini failover path (Qwen circuit open) and are nondeterministic; treat this as a **sample of one**, not a calibration.
- **Consequence.** Preset cards now show fixture-mode expectations. A trader who runs one on live data may see a different verdict, which is the engine working correctly, not a broken preset.

### 4A.6 Mobile header: crushed lockup at 360px and a state border that never rendered

- **Problem.** At 360px the four fixed mobile controls (264px total) plus the brand lockup exceeded the header width, so the brand button shrank 94px -> 64px and the lockup collapsed; the risk lever's state border computed at `border-width: 0px` (a border colour class with no width), so LOW/HIGH never showed the intended frame; and `bg-[var(--rtd-reduce)] text-[var(--rtd-paper)]` produced low-contrast ink on amber in light mode.
- **Fix.** Compact the fixed slots (mode 92 -> 70px, risk 72 -> 64px), collapse the duplicate nested `md:hidden` wrappers, add a real 1px state border and a visible `RISK` micro-label to the lever, and use `text-[var(--rtd-void)]` on amber fills (dark in both themes).
- **Verification.** Production build at 360px and 390px: lockup at its natural 94px, controls 70x44 / 64x44 / 44x44 / 44x44 with byte-identical sizes across 8 state transitions (`pw-stable.cjs` PASS), no clipping, no page scroll; HIGH-chip contrast measured ~5.9:1 in light mode and high in dark.

### 4A.7 Test-count re-baseline, preset drift pin, and case-study re-verification

- **Test count.** Suite re-baselined **388/388 across 39 files -> 397/397 across 41 files** (2026-10-06) after the conversational follow-up assistant and dossier export suites. Judge-facing docs state the current number; earlier ledger entries keep their dated values with a pointer here.
- **Preset drift pin.** `tests/preset-cards.test.cjs` replays all four launcher prompts through the deterministic fixture workflow and asserts the card labels equal engine output (WAIT x3 with worst `COMBINED_SHOCK -9.25%`; the unhedged card stops at `CLARIFICATION`). A policy change that moves a verdict now fails the suite instead of shipping a card that lies.
- **Case studies.** All three `RETROSPECTIVE_CASE_STUDIES.md` walkthroughs re-executed against the current engine (states reconstructed from their documented assumptions): **every displayed shocked price and percentage reproduces exactly**; dollar P&Ls reproduce to within **$0.05** (the engine rounds internally at 8 decimals while the docs display 2-decimal assumptions). Case 3's `"at 04:00 AM ET"` input no longer parses a clock time as a price.

## 5. Open items (tracked, not solved)

1. **Qwen primary-path recovery.** All 6 latency measurements ran on the Gemini failover path. When the shared gateway recovers, re-measure and update the latency range in PRODUCT_DESCRIPTION Part 3 / CONNECTIVITY_REPORT (expected to tighten).
2. **Latency outliers vs. internal deadline.** The 50.62s run exceeded the 45s internal LLM-stage deadline (inside the 60s ceiling). Candidate engineering follow-up: lower per-stage budgets so worst-case wall clock stays under 45s even with a dead primary.
3. **`next-env.d.ts` churn — RESOLVED 2026-10-03.** The build-time variant is committed (`bff13de`); `git status` stays clean.
4. **Evidence-dump reruns.** The raw ledger (`docs/archive/EVIDENCE_DUMP.md`, local-only) is a point-in-time artifact; `scripts/build-evidence-dump.cjs` rebuilds it from fresh captures when the session's methodology is repeated.
5. **Dev-generated type corruption.** `.next/dev/types/routes.d.ts` was observed mid-session with stray closing braces (TS1128) after source files were reverted under the watching dev server, failing `tsc --noEmit` with no source-file errors. `npx next typegen` regenerates clean types. If typecheck fails only inside `.next/dev/types/`, regenerate before touching source. (Same class as the `next-env.d.ts` churn in item 3.)
6. **Hydration console observation + nonce CSP.** During the CSP-enabled browser audit one React #418 hydration exception appeared with zero CSP "Refused to" violations — cause not isolated and not attributable to blocked resources; re-check in a clean incognito profile during the cold rehearsal. A nonce-based CSP via middleware is the post-submission hardening step; `script-src 'unsafe-inline'` is the honest current scope.

7. **Post-submission debt: split the large workspace components.** `DecisionArtifactView.tsx` is ~1007 lines mixing provenance wiring, the counterfactual sandbox, and export; `TradeInputSurface.tsx` is 543 lines. Deferred out of the submission pass deliberately — a pre-submission extraction is churn with no judge-visible benefit. Split them behind the existing test suite after submission.

---

*Related reading: raw verification methodology — the local-only raw ledger (`docs/archive/EVIDENCE_DUMP.md`, regenerable via `scripts/build-evidence-dump.cjs`). Full documentation index — [`docs/README.md`](./README.md).*
