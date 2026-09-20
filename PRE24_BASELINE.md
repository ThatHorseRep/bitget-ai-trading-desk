# PRE24 Baseline Report — Bitget AI RedTeam Desk

**Baseline lock point:** Task 23 working tree, verified 2026-09-19.
**Method:** every claim below was verified against the current working tree and runtime source; nothing is asserted from docs alone. Committed HEAD was additionally verified in an isolated throwaway worktree (this working tree's sources were never modified).

> **Concurrent-work note:** an active parallel effort (PRE24-04 EvidenceArbitrator) landed changes in this working tree *during* this baseline run. All verification results below reflect the final state observed, including that work. The report records the mid-run transitions because they are the baseline's actual history.

---

## 1. Verification Results (final working-tree state)

| Command | Result |
|---|---|
| `npm run typecheck` | **PASS** (exit 0) |
| `npm run lint` | **PASS** (exit 0) |
| `npm run build` (`next build`) | **PASS** (exit 0; compiled, type-checked, 5/5 static pages; routes `/`, `/_not-found`, `/api/market-price`, `/api/stress-test`) |
| `npm run test` | **PASS with 1 failure** — 157 tests: **155 passed, 1 failed, 1 skipped** (live-integration test, correctly gated behind `RUN_LIVE_TESTS=true`) |

**No exit codes were swallowed in the final table:** every command above was re-run and its raw exit code captured.

### 1.1 The single test failure

- **Test:** `tests/arbitrator.test.cjs` → *"arbitrator: malformed external observation → UNAVAILABLE, source preserved"* (line 230)
- **Assertion:** `assert.ok(limitations.length >= 1)` at line 256 — expected a limitation to be attached when an observation is malformed/unavailable; the arbitrator returned none.
- **Scope:** entirely inside the in-progress PRE24-04 work (`tests/arbitrator.test.cjs` + `src/adapters/evidence/arbitrator.ts`); no pre-existing test regressed.

### 1.2 Working-tree transition during this baseline (actual history)

1. **At session start**, the tree was **red**: 11 TS errors (8 × TS2554 positional-vs-object `makeObs()` calls in the uncommitted `bitgetUsEquityMcpProvider.ts` rewrite; 3 errors in the untracked `arbitrator.ts` — 2 × TS2345 `ConflictState | undefined`, 1 × TS2322 `provenanceType: string`). Typecheck, `build:core`, `next build` all failed; `npm test` was **blocked before any test ran**.
2. **Mid-run**, the parallel effort fixed those errors, wired `EvidenceArbitrator` into `DecisionDeskService` (PRE24-04), and added `tests/arbitrator.test.cjs`. Typecheck/build went green; the new suite introduced the single failure in §1.1.

### 1.3 Committed HEAD state (`9ebbf44`) — verified in an isolated worktree

- **HEAD typecheck:** PASS
- **HEAD test suite:** PASS — 150 tests: 149 passed, 1 skipped (live gate); 0 failures
- Build was not re-verified at HEAD; it was passing at merge time per repo history.
- PRODUCT_DESCRIPTION.md's "124/124 tests" is **stale** against both states (150 at HEAD, 157 now).

### 1.4 Conclusion

The committed baseline is green; the working tree is green except for one assertion in the in-progress arbitrator suite. The deterministic core, policy, parsers, adapters, and end-to-end fixture slice all pass.

---

## 2. Optional Integrations — Implementation Status

Verified from runtime code (what is registered and executed), not from documentation claims.

### 2.1 Implemented and wired into the production workflow

All three providers are registered in `DecisionDeskService`'s **default registry** and participate in every non-fixture analysis run via `ResearchProviderRegistry.gatherObservations()`:

| Integration | File | Status |
|---|---|---|
| **Bitget US Equity MCP provider** (PRE24-02) | `src/adapters/research/bitgetUsEquityMcpProvider.ts` | **Implemented, wired.** Real MCP client (`@modelcontextprotocol/sdk`, SSE) to `https://agent.bitget.com/mcp`; automatic tool discovery via `listTools()`; keyword classification into six GitBook categories; topic→category routing; Zod `.passthrough()` validation (schemas inlined in the uncommitted rewrite); 5 s connect / 8 s tool-call timeouts; summary caps (500 chars, 20 obs/category). **Caveat:** no live-endpoint verification exists in the repo, so runtime reachability is unproven; the provider degrades to `[]`/`UNAVAILABLE` when unreachable. |
| **Bitget Signal Agent Bridge** (PRE24-03) | `src/adapters/research/bitgetSignalAgentBridge.ts` | **Implemented, wired** — but as a **file-based contract, not a live call**. Writes a `SignalRequest` to `$TMPDIR/signal-bridge-input.json` and reads `$TMPDIR/signal-bridge-output.json` if an external AI host has produced it; returns `[]` otherwise. The web app never calls the Signal MCP server itself (by design, per the module header). |
| **Legacy evidence adapter** | `src/adapters/research/legacyAdapter.ts` | **Implemented, wired.** Bridges the original `CompositeEvidenceProvider` (live Yahoo Finance news search with curated-NVDA fallback) into the `ResearchProvider` interface as `providerId: "legacy-evidence-provider"`. The only provider with live-proven network behavior in the repo (tests mock fetch for the rest). |
| **Evidence arbitrator** (PRE24-04, in progress) | `src/adapters/evidence/arbitrator.ts` + wiring in `src/services/decisionDeskService.ts` | **Implemented, wired, mid-development.** Deterministic post-retrieval authority: dedup, staleness (`STALE`), numeric-conflict detection beyond a 0.5% tolerance (`UNRESOLVED_CONFLICT` with `conflictingSources` preserved — never reconciled), malformed input → `UNAVAILABLE`. One test failure pending (§1.1); not yet counted as stable. |

### 2.2 Supporting infrastructure

- `src/adapters/research/usEquitySchemas.ts` — the six category schemas (also inlined into the provider in the uncommitted rewrite).
- `src/scripts/verify-connectivity.ts` + `scripts/verify-us-equity-mcp.mjs` — one-off live-endpoint diagnostics (not part of the product workflow).
- `PENDING_TASKS.md` item 4 ("Wire into DecisionDeskService — currently only used when explicitly registered") is **stale**: the MCP provider is now registered in the default registry.

### 2.3 Not implemented (confirmed absent from runtime code)

- **Live user portfolio context** — see §3.
- **Direct paper-trading handoff / API order execution** — no execution code anywhere; `stress-test` route is analysis-only.
- **Synthetic hedging suggestions** — no hedge-candidate code.
- **WebSocket / L2 order-book depth** — L1 ticker only, with the documented `estimatedDepthMultiplier` heuristic.
- **Live quantitative risk backend** — beta/vol/borrow parameters are the static `ASSET_RISK_PROFILES` table (`src/core/scenarios/config.ts`), as documented in ARCHITECTURE_AND_LIMITATIONS.md.

---

## 3. Portfolio-Context Status

**Deferred / not implemented.** Verified points:

- `src/domain/trade/types.ts` defines `ExistingExposure` and `NormalizedTrade.existingExposure` — **type-level only**.
- `src/core/trade/parser.ts` populates `relevantExposure` only from the **user's own natural-language statement** of existing holdings (e.g. "I already have $10,000 of BTC"); it is surfaced read-only in `NormalizedReviewCard.tsx`.
- No service, adapter, or engine consumes `existingExposure`/`relevantExposure` for portfolio calculations: **no concentration, overlap, correlation, or portfolio-level scenario impact is computed anywhere** in `src/`.
- The Stress Engine and Decision Policy operate exclusively on position-level data; artifacts correctly do **not** claim portfolio impact.
- No Bitget account/holdings retrieval exists (public market-data client only).
- The fixture's `buildRnvdaDemoTrade()` sets `relevantExposure: []`.

Conclusion: matches B02 §8 ("Portfolio context — deferred to a future release"); the only portfolio signal is user-declared exposure text.

---

## 4. Environment Variables

Complete inventory. Sources: `.env.example`, `.env.local` (**names only — values not inspected**), and every `process.env.*` reference in `src/`, `scripts/`, and `tests/`.

### 4.1 Product code (`src/`)

| Variable | Where used | Purpose | In `.env.example` | In `.env.local` |
|---|---|---|---|---|
| `LLM_API_BASE_URL` | `src/core/thesis/llmClient.ts` (required) | OpenAI-compatible LLM endpoint (`/chat/completions` appended if absent) | ✅ | ✅ |
| `LLM_API_KEY` | `src/core/thesis/llmClient.ts` (required) | LLM bearer token | ✅ | ✅ |
| `LLM_MODEL` | `src/core/thesis/llmClient.ts` (optional; falls back to `deepseek-v4-flash`) | Model name | ✅ | ✅ |
| `BITGET_API_BASE_URL` | `src/adapters/bitget/client.ts` | Bitget REST base URL (validated against a trusted-origin allowlist) | ✅ | — |
| `TEST_MODE` | `src/core/thesis/llmClient.ts`, `extractor.ts`, `challenger.ts` | `=mock_llm` returns canned LLM JSON for tests | — | — |
| `VERCEL` | `src/core/thesis/llmClient.ts` | Selects the 15 s (vs 90 s) LLM timeout | — | — |
| `NODE_ENV` | `src/adapters/bitget/client.ts` | `=test` permits `http://127.0.0.1` mock origins | — | — |

### 4.2 Scripts / diagnostics

| Variable | Where used |
|---|---|
| `BITGET_MCP_ENDPOINT` | `src/scripts/verify-connectivity.ts` (default `https://agent.bitget.com/mcp`) — not read by product code |

### 4.3 Test gates

| Variable | Where used |
|---|---|
| `RUN_LIVE_TESTS` | `tests/live-integration.test.cjs` (`=true` enables the live end-to-end test; skipped otherwise) |

### 4.4 Declared but never read by code (dead entries)

`NVDA_REFERENCE_BASE_URL` and `EVIDENCE_BASE_URL` exist only in `.env.example`. No `process.env` reference anywhere; the Yahoo endpoint is hardcoded (with an allowlist) and the evidence base URL is hardcoded in `CompositeEvidenceProvider`.

### 4.5 Test-time only

`TEST_MODE=mock_llm` (above) is how `npm test` avoids real LLM calls; adversarial tests additionally mock `global.fetch`.

---

## 5. Authoritative Files

### 5.1 Specification / governance (stable — do not edit during buildout)

- `B01_Product_Foundation.md` — product identity, promise, principles, core loop, artifact contract, trust model
- `B02_MVP_Product_Mechanics.md` — normalization, market-state minimums, thesis extraction/challenge, 4+1 scenarios, thesis-vs-position, decision synthesis, the rNVDA vertical slice
- `B03_Experience_Architecture.md` — journey, progressive disclosure, artifact/challenge/stress UX, states, demo experience
- `B04_Information_Architecture_and_Screen_Specification.md` — S01–S09 surfaces, mobile/desktop hierarchy, navigation
- `B05_AI_Behavior_and_Prompts.md` — LLM module contracts, structured-output schemas, fallback rules
- `B06_Hackathon_Demo_and_Quality.md` — demo wedge, demo script, submission artifacts, quality gates
- `PRODUCT_DESCRIPTION.md` — submission-facing description (note: §3 test count is stale vs §1.3)
- `PROMPT_BOOK.md` — phase P01–P05 execution playbook
- `ARCHITECTURE_AND_LIMITATIONS.md` — architecture and documented technical constraints (L1 depth heuristic, static risk profiles, scraper-based reference pricing, non-streaming LLM with retry)
- `PRE24_ALL_OPTIONAL_TOOLKIT_EXPANSION_SPEC.md` — **referenced in the tasking but not present in the repository**

### 5.2 Runtime authority map (single source of truth per concern)

| Concern | Authoritative file |
|---|---|
| Workflow orchestration / composition root | `src/services/decisionDeskService.ts` |
| Market-state reconstruction | `src/services/marketStateService.ts` (+ `SUPPORTED_ASSET_MAPPINGS`, dynamic rToken mapping) |
| Bitget market data | `src/adapters/bitget/client.ts` |
| Reference pricing | `src/adapters/reference/composite.ts` + `src/adapters/reference/yahoo.ts` |
| Evidence retrieval | `src/adapters/evidence/provider.ts` (`CompositeEvidenceProvider`, curated fallback) |
| Evidence arbitration | `src/adapters/evidence/arbitrator.ts` (PRE24-04, in progress — §1.1) |
| Research provider layer | `src/adapters/research/registry.ts` + the three providers in §2.1 |
| Deterministic scenarios | `src/core/scenarios/engine.ts` + `src/core/scenarios/config.ts` (`SCENARIO_CONFIG`, `ASSET_RISK_PROFILES`) |
| Decision policy | `src/core/decision/policy.ts` (+ `classifyPosition.ts`) |
| Thesis extraction / challenge / assessment | `src/core/thesis/extractor.ts`, `challenger.ts`, `assessment.ts` via `src/core/thesis/llmClient.ts` |
| NL trade parsing | `src/core/trade/parser.ts` |
| Session/liquidity/data-quality rules | `src/core/market/session.ts`, `src/core/calculations/market.ts`, `src/core/validation/*` |
| Domain contracts | `src/domain/**` (trade, market, thesis, scenarios, decision) |
| HTTP surface | `src/app/api/stress-test/route.ts` (NDJSON streaming, rate limit), `src/app/api/market-price/route.ts` |
| UI states / workspace | `src/components/workspace/*` (workspace flow, `WorkspaceHeader` demo-mode banner) |
| Demo fixture | `src/fixtures/rnvda-demo.ts` (`RNVDA_WEEKEND_REFERENCE_SCENARIO_V1`) |
| Demo-mode force | `useFixture` through route → service → fixture |

### 5.3 Non-authoritative

`.kilo/worktrees/*` (parallel worktrees), root-level ad-hoc scripts (`test_*.cjs/js/ts`, `check_credits.js`, `list-tools.mjs`, `parse-html.cjs`, `a11y-test.js`, `scratch_test.ts`), `docs/archive/*` (superseded research), packaged tarballs (`bitget-*.tgz`), and build artifacts (`dist-core/`, `.next/`, `tsconfig.tsbuildinfo`).

---

## 6. Open Items Blocking a Fully Green Baseline

Exactly **one** known open item in the working tree (in-progress PRE24-04 work, untouched per the baseline-lock instruction):

1. `tests/arbitrator.test.cjs` — "malformed external observation" case expects a limitation when the arbitrator marks an observation `UNAVAILABLE`; the current arbitrator implementation does not emit one. Fix by either emitting the limitation for unavailable/malformed observations or adjusting the test's expectation — the caller's `limitations.push(...arbitration.limitations)` wiring in `DecisionDeskService` is already in place.

Also outstanding from the repo's own checklists (not blockers, recorded for completeness):

- `SUBMISSION_CHECKLIST.md` items: restore the mandatory hackathon LLM env vars, README judge warning, deployment verification (Vercel health **not verified in this baseline** — no deployment was checked).
- `PENDING_TASKS.md` items 1–3 (tighten Zod schemas / tune `classifyTool` keywords / confirm `{ symbol }` argument convention) all require the live MCP endpoint; item 4 is stale (already wired).
- PRODUCT_DESCRIPTION.md §3 test count is stale (says 124/124; actual 157 with 1 failure).

---

## 7. PRE24 Baseline Verification (2026-09-20)

All gates re-run fresh from the final working tree, exit codes captured:

| Gate | Command | Result |
|---|---|---|
| Build | `npm run build` | **PASS** (exit 0; routes `/`, `/_not-found`, `/api/market-price`, `/api/stress-test`) |
| Typecheck | `npm run typecheck` | **PASS** (exit 0) |
| Lint | `npm run lint` | **PASS** (exit 0) |
| Tests | `npm run test` | **FAIL (exit 1)** — 157 tests: 155 pass, 1 fail, 1 skip; the sole failure is the documented §1.1 arbitrator case |

**Verdict: BASELINE PASS** — every gate is green except the single, fully documented PRE24-04 arbitrator test failure (§1.1), which belongs to in-progress parallel work, not to the baseline scope. Per the baseline rule (PASS when documented), the baseline is locked and it is **safe to begin PRE24-01**; closing the arbitrator mismatch is recommended but not blocking.

### 7.1 Deployment-related configuration

- **No deployment configuration exists in the repository**: no `vercel.json`, `Dockerfile`, `docker-compose.yml`, `wrangler.toml`, `render.yaml`, or `railway.json`.
- Next.js build verified locally only; **no deployed environment was checked and no deployment health is claimed**.
- Both API routes declare `export const maxDuration = 60` (Vercel-style serverless timeout hint).
- `GET /api/stress-test` returns a static health payload (`status: "OK"`) **without probing dependencies** — it does not imply external providers are healthy.
- `SUBMISSION_CHECKLIST.md` references Vercel env vars/redeployment, but no Vercel project config is checked in; deployment remains unverified.
- `.github/` contains only `github-app.yml` (automation config); no CI workflow exists.

### 7.2 External providers (runtime code)

| Provider | Endpoint | Live-verified? |
|---|---|---|
| Bitget REST (tickers, instruments, Reality calendar) | `api.bitget.com` via `BITGET_API_BASE_URL` (allowlisted) | **Yes** — `/api/market-price?asset=rNVDA` returned a live observed price during the preview run |
| Reference equity quotes (basis) | Yahoo Finance (`query1.finance.yahoo.com`, allowlisted, scraper with UA + backoff) | Code present; graceful `referencePrice: null` degradation verified by tests; no live proof recorded in this baseline |
| LLM (OpenAI-compatible) | `LLM_API_BASE_URL` (required; model default `deepseek-v4-flash`; 15 s timeout on Vercel, 90 s otherwise; 1 retry) | Env-configured; exercised only via mocked fetch in tests |
| Bitget US Equity MCP | `https://agent.bitget.com/mcp` (SSE) | **Not live-verified** — reachability unproven; degrades to `[]`/`UNAVAILABLE` |
| Bitget Signal bridge | file contract in `$TMPDIR` (no network call from the app) | Inactive unless an external AI host writes the bridge file |

### 7.3 Final integration list (what truly exists today)

1. `legacy-evidence-provider` — Yahoo Finance news + curated fallback, wired in default registry, live-proven network path.
2. `bitget-us-equity-mcp` (PRE24-02) — wired in default registry, full MCP client with discovery/routing/validation/timeouts; endpoint reachability unproven.
3. `bitget-signal-agent-bridge` (PRE24-03) — wired in default registry; file-based contract, not a live call.
4. `EvidenceArbitrator` (PRE24-04, in progress) — wired into `DecisionDeskService` evidence assembly; deterministic conflict/dedup/staleness authority; 1 failing test pending (§1.1).

Absent (confirmed no runtime code): live portfolio context (§3), paper-trading handoff, synthetic hedging, L2/WS order-book depth, live quantitative risk backend.

### 7.4 Portfolio-context status

Unchanged from §3: **deferred / not implemented**. Type-level `ExistingExposure` and parser-level user-declared exposure only; no concentration, overlap, correlation, or portfolio-impact calculation anywhere in `src/`.

---

## 8. PRE24-01 Implementation Record (2026-09-20)

**Scope delivered:** smallest clean abstraction for optional external research providers + composition mechanism. No external providers implemented.

### 8.1 What already existed (reused, not rebuilt)

The PRE24-02/03/04 work had already established the abstraction this task asks for; PRE24-01 formalized it rather than duplicating it:

- **Normalized observation schema** — `NormalizedResearchObservation` (`src/adapters/research/types.ts`) carries exactly the required fields: `providerId`, `source`, `title`/`summary`, `observedTimestamp`, `providerStatus` (`AVAILABLE | DEGRADED | UNAVAILABLE`), optional `url`, plus optional numeric `value`/`unit` for cross-source arbitration.
- **Provider contract** — the `ResearchProvider` interface (`getStatus()` + `getObservations(asset, topic?)`).
- **Domain boundary** — `src/domain/` imports nothing from `src/adapters/` (now enforced by a test); raw MCP responses never reach the core domain.
- **Evidence normalization** — `EvidenceArbitrator` maps observations to `EvidenceItem`s (provenanceType `OBSERVED_FACT`, `RESEARCH_PROVIDER` state for research providers, conflicts/dedup/staleness handled deterministically).

### 8.2 What PRE24-01 added

1. **`src/adapters/research/defaultRegistry.ts`** — the explicit composition root (`createDefaultResearchRegistry`) with four documented slots: legacy evidence provider, Bitget US Equity MCP, Bitget Signal bridge, and a **reserved Chainbase AgentKey slot** (type-level seam only — no stub implementation, nothing fake registered). Supports full override via `providers: []` for tests and granular seams (endpoint, bridge path, evidence provider).
2. **`DecisionDeskService`** constructor now delegates to the factory — provider assembly is no longer buried in the service; behavior is identical.
3. **Registry hardening** — `gatherObservations` normalizes non-array provider returns (`null`, single object, undefined) to `[]`; a misbehaving provider can no longer break the gather loop.
4. **Strengthened `tests/researchProviders.test.cjs`** (now hermetic via `TEST_MODE=mock_llm` + injected deterministic `MarketStateService` — no live LLM/network): proves (a) an empty registry still completes the full workflow; (b) throwing providers are isolated from the core, both at the registry and through `runWorkflow`; (c) non-array provider returns cannot crash the workflow; (d) the workflow behaves exactly as before when providers are disabled/absent (same verdict surface, same scenario engine, same market-state path; fixture golden path unchanged); (e) observation→evidence provenance preservation (id, providerId, source, url, timestamp, `OBSERVED_FACT`, value/unit); (f) the four composition-root slots incl. the Chainbase seam; (g) the domain-does-not-import-adapters boundary.

### 8.3 Verification after PRE24-01

| Gate | Result |
|---|---|
| `npm run build:core` | PASS (exit 0) |
| `npm run typecheck` | PASS (exit 0) |
| `npm run lint` | PASS (exit 0) |
| `npm run test` | **PASS — 161 tests: 160 pass, 0 fail, 1 skip** (live gate) |

### 8.4 Untouched-surface guarantee

`git diff --name-only` after PRE24-01 contains only: `registry.ts`, `defaultRegistry.ts` (new), `decisionDeskService.ts`, `researchProviders.test.cjs` (+ the parallel effort's pre-existing `arbitrator.ts` fix). **No changes** to scenario math (`core/scenarios/*`), decision policy (`core/decision/*`), thesis schemas (`domain/thesis/*`), UI (`components/`, `app/`), or the `DecisionArtifact` shape.

Note: the earlier §1.1 single test failure was fixed by the parallel PRE24-04 effort (arbitrator now emits limitations for malformed observations); the suite was already 157/157-green before PRE24-01 work began.

---

## 9. PRE24-01 Audit Record (2026-09-20) — PASS

Independent audit of the PRE24-01 diff, all gates re-run with exit codes captured:

| Audit check | Result |
|---|---|
| Core workflow behaves the same | **PASS** — fixture golden path and disabled-provider path produce identical verdict/scenario/market-state surfaces (proven by tests, not asserted) |
| No deterministic calculation modified | **PASS** — diff touches no file under `core/scenarios`, `core/calculations`, `core/decision`, `core/thesis`, `core/trade`, `core/market`, `core/validation`, `domain/`, `components/`, `app/`, `fixtures/` |
| Provider failures representable without crashing | **PASS** — throwing providers isolated at registry and through `runWorkflow`; non-array returns normalized to `[]` |
| Optional providers independently enabled/disabled | **PASS** — runtime-proven: mixed registry (1 UNAVAILABLE + 1 AVAILABLE) gathers only the enabled provider's observations |
| Tests | **PASS** — 161 tests, 160 pass, 0 fail, 1 skip (exit 0) |
| Build | **PASS** — `next build` exit 0 |
| Typecheck | **PASS** — exit 0 (lint also exit 0) |
| Architecture drift scan | **PASS** — no new adapter imports into core/domain; no `DecisionArtifact` shape change; only surgical changes: composition-root delegation, defensive array normalization, arbitration completion fix (parallel PRE24-04) |

**Verdict: PRE24-01 PASS.**

---

## 10. PRE24-02 Implementation Record (2026-09-20)

**Scope:** `BitgetUsEquityMcpProvider` re-verified against the official S2 Developer Toolkit documentation and corrected; no other provider replaced; core untouched.

### 10.1 Documented interface (verified, not guessed)

Source: official S2 handbook (local `gitbook.md`, matching `bitget-ai.gitbook.io/bitgetai_hackathons2`), section *"Bitget MCP Server (US Stocks / ETF — Read-Only Data)"*:

- **Transport: HTTP** — `https://agent.bitget.com/mcp` (`--transport http`). The provider previously used **SSE**, contradicting the handbook; corrected to `StreamableHTTPClientTransport`.
- **Read-only US stock/ETF data service**; explicitly *not* the Agent Hub trading MCP and *not* `bitget-signal`; **no Bitget account or API key required** (none added).
- **Six documented categories** (quotes & history, fundamentals, corporate actions, institutional & analyst, ETF, news & sentiment) — **no tool names or request shapes are published**, so runtime `listTools()` discovery + keyword classification (zero guessed names) remains the correct mechanism.

### 10.2 What changed

1. **Transport corrected** to documented Streamable HTTP (provider + `src/scripts/verify-connectivity.ts` + `scripts/verify-us-equity-mcp.mjs`).
2. **Asset gating added** (`toReferenceSymbol`): only rToken-mapped US reference tickers (rNVDA/rNVDAUSDT → NVDA) are requested; plain crypto (BTC, BTCUSDT, SOL) never reaches this US-equity-only service. Requests carry the **reference symbol**, not the raw trade symbol.
3. **Existing strengths retained:** runtime tool discovery, Zod validation per category with generic-observation fallback, 5 s connect / 8 s tool-call timeouts, 500-char summaries, 20 obs/category bound, provider id + source (`bitget-mcp-server/<tool>`) + timestamps on every observation.
4. **Tests rewritten hermetically (15, all passing):** an in-process MCP fixture server speaking the documented Streamable HTTP transport proves end-to-end behavior — discovery, per-category normalization (quote value/unit USD, news array bounding, company/analyst fields), source identity + timestamps, reference-symbol requests (asserted from the wire), asset gating (zero network traffic for crypto), malformed-payload degradation, unreachable-endpoint degradation (provider + registry levels), and pure-helper contracts. No live network in the suite.
5. **Real-connectivity verification script** (`src/scripts/verify-connectivity.ts`, 4-step diagnostic) — runs outside the test suite.

### 10.3 Live verification result

Run 2026-09-20: **DNS could not resolve `agent.bitget.com`** from the current network (`ENOTFOUND`). Control probes at the same moment: `api.bitget.com` also failed while `github.com`/`registry.npmjs.org` resolved — a local network/DNS issue, not a documented-endpoint failure (the same machine fetched live Bitget prices earlier the same day). The provider degraded exactly as specified: `UNAVAILABLE`, zero requests issued, workflow unaffected. **Production behavior requirement satisfied by construction:** unreachable MCP ⇒ provider returns `[]`/`UNAVAILABLE` ⇒ the legacy Yahoo evidence provider still feeds the workflow. Schemas stay `.passthrough()` until the script succeeds from a reachable environment (see PENDING_TASKS.md).

### 10.4 Untouched-surface guarantee

Diff limited to: the provider file, the two verification scripts, the provider test file, PENDING_TASKS.md, this report. **No changes** to the Bitget token client (`adapters/bitget/*`), Yahoo/composite reference providers, scenario math, decision policy, thesis schemas, UI, or artifact shape. The MCP remains optional in the default registry.

---

## 11. PRE24-02 Audit Record (2026-09-20) — PASS

| Audit proof | Result |
|---|---|
| 1. Official US-equity MCP interface | **PASS** — documented Streamable HTTP transport to `agent.bitget.com/mcp` (S2 handbook); not the Agent Hub trading MCP, not `bitget-signal`; no credentials; no guessed tool names (runtime discovery only) |
| 2. Real request OR documented environment limitation | **PASS (documented limitation)** — live script re-run: `ENOTFOUND agent.bitget.com`; same-moment controls `api.bitget.com` FAIL / `github.com` 200 → local DNS limitation, documented in §10.3 and PENDING_TASKS.md |
| 3. Result normalized | **PASS** — fixture tests assert `NormalizedResearchObservation` fields (id/providerId/source/timestamp/status/url/value/unit) per category |
| 4. Provenance records the provider correctly | **PASS** — runtime-proven end-to-end: evidence `providerId=bitget-us-equity-mcp`, `source=bitget-mcp-server/<tool>`, `state=RESEARCH_PROVIDER`, `provenanceType=OBSERVED_FACT`; artifact provenance chain carries the matching `OBSERVED_FACT` record with `evidenceState` |
| 5. Existing behavior works with provider disabled | **PASS** — disabled/absent provider paths produce `DECISION_READY` (test-proven); live degradation exercised same-day |
| 6. Failure and timeout handled | **PASS** — 5 s connect / 8 s tool-call bounded timeouts; unreachable → `[]`/`UNAVAILABLE`; malformed payload → generic observation; registry isolation |
| 7. No secrets in git | **PASS** — `git grep` of tracked tree clean; `git log --all -S ghp_` empty |
| 8. build / typecheck / test | **PASS** — 0 / 0 / 0 (155 tests: 154 pass, 0 fail, 1 skip) |

**Verdict: PRE24-02 PASS.** Provider is real (documented transport, validated payloads, normalized contract) and correctly labelled (`bitget-us-equity-mcp`).

### 9.1 Contributor condition for merge

At audit time the GitHub repo (`ThatHorseRep/bitget-ai-trading-desk`) has exactly **one collaborator (`ThatHorseRep`, admin)** and **zero pending invitations**; all commit authors/committers across all branches are the owner's two identities (`ThatHorseRep` / `Stallion`). There are no other contributors to remove — the removal condition is satisfied vacuously. Commits for this merge are authored solely as the owner (no co-author trailers, per owner request).
