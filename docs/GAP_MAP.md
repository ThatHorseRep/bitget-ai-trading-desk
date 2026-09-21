# Gap Map & Reconnaissance Audit: Bitget AI RedTeam Desk

Date: 2026-09-21  
Environment: Next.js 16 App Router / TypeScript  
Audit Phase: Task P1 (Read-Only Reconnaissance Pass)

---

## AVAILABLE SKILLS

Indexed from external repositories cloned to scratch directory (`~/scratch/`):

### From `https://github.com/ThatHorseRep/skills`
- **ask-matt** (`engineering/ask-matt`): Ask which skill or flow fits your situation. A router over the skills in this repo.
- **code-review** (`engineering/code-review`): Review changes since a fixed point along Standards and Spec axes with parallel sub-agents.
- **codebase-design** (`engineering/codebase-design`): Shared vocabulary and principles for designing deep modules and clean module interfaces.
- **diagnosing-bugs** (`engineering/diagnosing-bugs`): Systematic diagnosis loop for hard bugs and performance regressions.
- **domain-modeling** (`engineering/domain-modeling`): Build and sharpen a project's domain model, terminology, and architecture decisions.
- **grill-with-docs** (`engineering/grill-with-docs`): Relentless interview to sharpen a plan or design while generating ADRs and glossary docs.
- **implement** (`engineering/implement`): Implement a piece of work based on a formal specification or set of tickets.
- **improve-codebase-architecture** (`engineering/improve-codebase-architecture`): Scan a codebase for deepening opportunities and present an interactive visual HTML report.
- **prototype** (`engineering/prototype`): Build a throwaway prototype to answer state model, user flow, or UI design questions.
- **research** (`engineering/research`): Investigate questions against high-trust primary sources and capture findings as Markdown.
- **resolving-merge-conflicts** (`engineering/resolving-merge-conflicts`): Structured resolution process for in-progress git merge/rebase conflicts.
- **setup-matt-pocock-skills** (`engineering/setup-matt-pocock-skills`): Configure repository issue trackers, triage labels, and domain documentation layouts.
- **tdd** (`engineering/tdd`): Test-driven development loop (red-green-refactor) for integration and unit verification.
- **to-spec** (`engineering/to-spec`): Synthesize unstructured conversation or user notes into a published technical specification.
- **to-tickets** (`engineering/to-tickets`): Deconstruct a plan or spec into a dependency-linked graph of tracer-bullet execution tickets.
- **triage** (`engineering/triage`): Route and categorize inbound issues and external PRs through a structured triage state machine.
- **wayfinder** (`engineering/wayfinder`): Multi-session roadmap planning through an evolving graph of decision tickets.
- **wizard** (`engineering/wizard`): Generate interactive bash scripts to guide humans through manual cloud or credential setup tasks.
- **claude-handoff** (`in-progress/claude-handoff`): Package conversational state into a structured handoff document for a background agent.
- **implement-spec** (`in-progress/implement-spec`): Execute implementation of an engineering specification in code.
- **loop-me** (`in-progress/loop-me`): Interactive interview framework to formulate detailed workflow specifications.
- **retro** (`in-progress/retro`): Structured retrospective review of an engineering or coding session.
- **setup-ts-deep-modules** (`in-progress/setup-ts-deep-modules`): Integrate dependency-cruiser to enforce strict deep-module boundaries in TypeScript.
- **writing-beats** (`in-progress/writing-beats`): Narrative structural drafting technique grounding key terms before developing arguments.
- **writing-fragments** (`in-progress/writing-fragments`): Unstructured exploratory idea and quote capture without preconceived layout.
- **writing-shape** (`in-progress/writing-shape`): Narrative synthesis transforming raw fragments into cohesive, paragraph-by-paragraph copy.
- **git-guardrails-claude-code** (`misc/git-guardrails-claude-code`): Protective hooks preventing destructive git operations (`reset --hard`, force pushes).
- **migrate-to-shoehorn** (`misc/migrate-to-shoehorn`): Automated migration from brittle TypeScript `as` casting in tests to `@total-typescript/shoehorn`.
- **scaffold-exercises** (`misc/scaffold-exercises`): Generates boilerplate directories and boilerplate files for interactive learning exercises.
- **setup-pre-commit** (`misc/setup-pre-commit`): Configures Husky, lint-staged, Prettier, and commit-time type checking.
- **grill-me** (`productivity/grill-me`): Rigorous adversarial interview session to expose flaws in a proposed plan.
- **grilling** (`productivity/grilling`): Adversarial stress-testing framework challenging plans, decisions, or architectural assumptions.
- **handoff** (`productivity/handoff`): Distill in-flight context into an actionable handover payload for another engineer or AI operator.
- **teach** (`productivity/teach`): Pedagogical framework for breaking down and explaining complex technical subjects.
- **to-questionnaire** (`productivity/to-questionnaire`): Convert ambiguous architectural decisions into structured questionnaires for stakeholders.
- **wait-what** (`productivity/wait-what`): Fast conversational reset and re-pitching protocol when instructions fail to land.
- **writing-for-agents** (`productivity/writing-for-agents`): Authoring standards for agent-facing prompt books, system rules, and markdown guidelines.

### From `https://github.com/ThatHorseRep/ai-design-skills`
- **landing-page-design** (`landing-page-design`): High-converting marketing and landing page design system covering typography, layout, copywriting, and visual hierarchy.

*(Note: `redesign-skill` was neither cloned nor indexed, adhering strictly to Standing Rule 4).*

---

## 1. WORKING SURFACES

| ROUTE_OR_COMPONENT | FILE_PATH | WHAT IT DOES | EVIDENCE IT WORKS |
|---|---|---|---|
| `WorkspaceHeader` | `src/components/workspace/WorkspaceHeader.tsx` | Top workspace navigation bar containing the brand wordmark, deterministic fixture toggle, and "New trade" action. | Verified: rendered in browser via `next dev` (HTTP 200 via `curl http://localhost:3000`). |
| `TradeInputSurface` | `src/components/workspace/TradeInputSurface.tsx` | Natural-language trade input surface featuring character count, submit button, and preset demo chips (`rNVDA Weekend Gap`). | Verified: rendered via `next dev` (HTTP 200); underlying parser verified by `tests/parser.test.cjs` and `tests/parser-matrix.test.cjs`. |
| `ClarificationModal` | `src/components/workspace/ClarificationModal.tsx` | Interactive modal prompting the user to disambiguate missing or ambiguous parameters (e.g. underlying NVDA vs tokenized rNVDA). | Verified: test `tests/parser.test.cjs` ("clarification required on ambiguous asset NVDA"). |
| `NormalizedReviewCard` | `src/components/workspace/NormalizedReviewCard.tsx` | S04 structured review card summarizing asset, direction, position size, reference price, implied leverage, and extracted thesis before execution. | Verified: test `tests/validation.test.cjs` and `tests/parser.test.cjs`. |
| `AnalysisProgressView` | `src/components/workspace/AnalysisProgressView.tsx` | S05 multi-stage progress indicator animating real-time SSE stream events (market reconstruction, evidence arbitration, scenario execution, verdict). | Verified: test `tests/apiEndpoint.test.cjs` ("streams progress stages via SSE"). |
| `DecisionArtifactView` | `src/components/workspace/DecisionArtifactView.tsx` | S06 structured Decision Artifact presenting verdict badge (`REJECT`, `WAIT`, `REDUCE`, `PROCEED`), confidence score, key risks, 4 stress scenarios, and action checklist. | Verified: tests `tests/decision.test.cjs`, `tests/verticalSlice.test.cjs`, and `tests/expanded-vertical-slice.test.cjs`. |
| `ProvenanceDrawer` | `src/components/workspace/ProvenanceDrawer.tsx` | S09 sliding detail drawer displaying source timestamps, citations, reference feeds, and model confidence for any clicked metric. | Verified: tests `tests/evidence.test.cjs` and `tests/expanded-vertical-slice.test.cjs`. |
| `API: /api/market-price` | `src/app/api/market-price/route.ts` | Serverless endpoint returning live or reference prices for tokenized equities (e.g. rNVDA). | Verified: runtime execution returning HTTP 200 via `curl http://localhost:3000/api/market-price?asset=rNVDA`. |
| `API: /api/stress-test` | `src/app/api/stress-test/route.ts` | Serverless streaming SSE endpoint orchestrating the end-to-end trade deconstruction, market reconstruction, and stress testing pipeline. | Verified: test `tests/apiEndpoint.test.cjs`. |

---

## 2. PARTIAL SURFACES

| ROUTE_OR_COMPONENT | FILE_PATH | WHAT EXISTS | WHAT IS MISSING |
|---|---|---|---|
| `Brand Token Theming` | `src/app/globals.css`, `src/components/workspace/*.tsx` | Functional components with hardcoded Tailwind `zinc-*` / `rose-*` / `emerald-*` classes. | CSS custom property injection matching `docs/IDENTITY_TOKENS.md` (`--rt-surface-base: #E7E9E6`, `--rt-text-primary: #0E2436`, `--rt-verdict-*`, local Geist Mono typography). |
| `Mobile Workspace Layout` | `src/app/page.tsx`, `src/components/workspace/DecisionArtifactView.tsx` | Desktop-centric layouts with standard Tailwind `sm:` / `lg:` breakpoints. | Progressive disclosure on narrow viewports for the 4-column stress test scenario matrix, fixed mobile verdict bar, and touch targets >= 44px. |
| `Rate Limiting & Degradation UI` | `src/app/page.tsx`, `src/lib/rateLimit.ts` | In-memory token-bucket limiter returning HTTP 429 and error message string. | Client-side visual cooldown countdown timer, retry button, or automatic fallback to offline deterministic fixture mode when rate-limited. |
| `Market State Status Bar` | `src/components/workspace/WorkspaceHeader.tsx` | Basic "Deterministic fixture mode" checkbox toggle. | Visual market state indicator displaying reference market status (`OPEN`, `CLOSED`, `WEEKEND`) and current basis spread / un-anchoring warning. |

---

## 3. MISSING SURFACES

| SURFACE | WHY IT IS NEEDED | WHICH B-DOC SPECIFIES IT |
|---|---|---|
| `Editorial Landing Surface` | Introduction to the core thesis of off-hours tokenized equity risks and desk capabilities prior to entering active trade stress-testing. | B03 §2 ("OPEN PRODUCT"), B04 §1 ("Primary surface"), and `_delete-me/editorial-landing-page.md`. |
| `Global 404 Not Found Page` | Standard Next.js App Router error handling ensuring unmatched routes match the brand identity rather than generic Next.js defaults. | Standard App Router spec / B03 §1 ("Calm, evidence-led desk"). |
| `Route Error Boundary (error.tsx)` | Route-level React error boundary allowing client recovery without reloading the entire application shell. | B04 §2.8 ("Error / Blocked State"). |
| `Offline Degraded PWA Shell` | Service worker offline caching shell allowing users to view cached Decision Artifacts and test trades during intermittent connectivity. | B03 §1 and `IMPLEMENTATION_PROMPT_BOOK.md` §Phase 0. |
| `Export & Share Artifact Surface` | Mechanism to copy/export the structured Decision Artifact into Markdown, JSON, or printable summary for external review. | B04 §4.5 ("Export and Action") and B02 §6 ("Decision Artifact"). |

---

## 4. MISSING APPLICATION STATES

Go through EVERY surface in sections 1-3 and check each of these states individually.

| SURFACE | STATE | EXISTS? | FILE IF IT EXISTS |
|---|---|---|---|
| **WorkspaceHeader** | first-use/empty | YES | src/components/workspace/WorkspaceHeader.tsx |
|  | loading | NO | Header does not show global async loading state |
|  | partial-results | N/A | Static navigation header |
|  | stale-data | NO | No stale-data indicator in header |
|  | provider-unavailable | NO | No upstream provider outage indicator |
|  | error | N/A | Header does not handle errors |
|  | retry | N/A | Header has no retry action |
|  | no-results | N/A | Static header |
|  | rate-limited | NO | No rate-limit status display |
| **TradeInputSurface** | first-use/empty | YES | src/components/workspace/TradeInputSurface.tsx (empty textarea) |
|  | loading | YES | src/components/workspace/TradeInputSurface.tsx (isLoading disables input) |
|  | partial-results | N/A | Accepts freeform text input |
|  | stale-data | N/A | User input surface |
|  | provider-unavailable | NO | Does not warn if LLM API is offline before submit |
|  | error | NO | Input error state delegates to page container |
|  | retry | NO | No inline retry action |
|  | no-results | N/A | Text input |
|  | rate-limited | NO | No countdown throttle indicator |
| **ClarificationModal** | first-use/empty | YES | src/components/workspace/ClarificationModal.tsx |
|  | loading | YES | src/components/workspace/ClarificationModal.tsx (isSubmitting spinner) |
|  | partial-results | YES | src/components/workspace/ClarificationModal.tsx (shows identified vs missing fields) |
|  | stale-data | N/A | Interactive disambiguation modal |
|  | provider-unavailable | NO | No offline fallback if price prefetch fails |
|  | error | NO | Modal delegates errors to page container |
|  | retry | YES | src/components/workspace/ClarificationModal.tsx (Back to edit button) |
|  | no-results | NO | Assumes parser produced at least one clarification item |
|  | rate-limited | NO | No rate limit handling inside modal |
| **NormalizedReviewCard** | first-use/empty | YES | src/components/workspace/NormalizedReviewCard.tsx |
|  | loading | YES | src/components/workspace/NormalizedReviewCard.tsx (isAnalyzing state) |
|  | partial-results | YES | src/components/workspace/NormalizedReviewCard.tsx (renders optional field fallbacks) |
|  | stale-data | NO | Does not display timestamp age of reference quote |
|  | provider-unavailable | NO | No banner if live quote was substituted by fixture |
|  | error | NO | Delegated to page container |
|  | retry | YES | src/components/workspace/NormalizedReviewCard.tsx (Edit trade button) |
|  | no-results | N/A | Card requires parsed trade object |
|  | rate-limited | NO | No throttle badge on confirmation button |
| **AnalysisProgressView** | first-use/empty | YES | src/components/workspace/AnalysisProgressView.tsx (initial stage 0) |
|  | loading | YES | src/components/workspace/AnalysisProgressView.tsx (animated pulse on active stage) |
|  | partial-results | YES | src/components/workspace/AnalysisProgressView.tsx (renders completed stages during stream) |
|  | stale-data | N/A | Real-time SSE event stream |
|  | provider-unavailable | NO | Does not identify which provider failed on timeout |
|  | error | NO | Stream drops straight to global error container |
|  | retry | NO | No cancel/restart button in progress view |
|  | no-results | NO | Assumes SSE stream emits progress events |
|  | rate-limited | NO | Treated as transport error |
| **DecisionArtifactView** | first-use/empty | YES | src/components/workspace/DecisionArtifactView.tsx |
|  | loading | N/A | Rendered only after artifact is complete |
|  | partial-results | NO | Only renders complete artifact; cannot render partial scenarios |
|  | stale-data | YES | src/components/workspace/DecisionArtifactView.tsx (shows market timestamp) |
|  | provider-unavailable | YES | src/components/workspace/DecisionArtifactView.tsx (renders limitations notes) |
|  | error | NO | Handled by page container |
|  | retry | YES | src/components/workspace/DecisionArtifactView.tsx (New Trade button) |
|  | no-results | NO | Requires valid artifact object |
|  | rate-limited | N/A | Rendered post-analysis |
| **ProvenanceDrawer** | first-use/empty | YES | src/components/workspace/ProvenanceDrawer.tsx |
|  | loading | NO | Synchronous drawer rendering |
|  | partial-results | YES | src/components/workspace/ProvenanceDrawer.tsx (renders available items) |
|  | stale-data | YES | src/components/workspace/ProvenanceDrawer.tsx (displays claim timestamps) |
|  | provider-unavailable | YES | src/components/workspace/ProvenanceDrawer.tsx (marks mock vs live provider records) |
|  | error | NO | Drawer assumes valid record data |
|  | retry | N/A | Inspection drawer |
|  | no-results | YES | src/components/workspace/ProvenanceDrawer.tsx (No records available fallback) |
|  | rate-limited | N/A | Local inspection |
| **API: /api/market-price** | first-use/empty | YES | src/app/api/market-price/route.ts (handles missing asset param with 400) |
|  | loading | N/A | Serverless HTTP endpoint |
|  | partial-results | NO | Returns single price object or error |
|  | stale-data | YES | src/app/api/market-price/route.ts (returns timestamp in response) |
|  | provider-unavailable | YES | src/app/api/market-price/route.ts (falls back to demo reference price) |
|  | error | YES | src/app/api/market-price/route.ts (returns JSON error status 400/500) |
|  | retry | N/A | Server endpoint |
|  | no-results | YES | src/app/api/market-price/route.ts (returns 404 for unknown ticker) |
|  | rate-limited | NO | Endpoint does not enforce per-IP rate limit |
| **API: /api/stress-test** | first-use/empty | YES | src/app/api/stress-test/route.ts (validates empty body with 400) |
|  | loading | YES | src/app/api/stress-test/route.ts (emits initial SSE connected event) |
|  | partial-results | YES | src/app/api/stress-test/route.ts (streams incremental stage progress chunks) |
|  | stale-data | YES | src/app/api/stress-test/route.ts (includes market state timestamps in payload) |
|  | provider-unavailable | YES | src/app/api/stress-test/route.ts (falls back gracefully to synthetic evidence) |
|  | error | YES | src/app/api/stress-test/route.ts (streams error event then closes SSE) |
|  | retry | N/A | Server endpoint |
|  | no-results | YES | src/app/api/stress-test/route.ts (returns 422 for unparseable trade) |
|  | rate-limited | YES | src/lib/rateLimit.ts (returns HTTP 429 when bucket exhausted) |
| **Brand Token Theming** | first-use/empty | PARTIAL | src/app/globals.css (basic CSS exists without full --rt-* token set) |
|  | loading | N/A | Static design system |
|  | partial-results | YES | src/app/globals.css (partial Tailwind utility classes applied) |
|  | stale-data | N/A | CSS token layer |
|  | provider-unavailable | N/A | Local styles |
|  | error | N/A | CSS rules do not throw |
|  | retry | N/A | Static stylesheet |
|  | no-results | N/A | Static stylesheet |
|  | rate-limited | N/A | Design tokens |
| **Mobile Workspace Layout** | first-use/empty | YES | src/app/page.tsx (renders standard desktop viewport on mobile) |
|  | loading | YES | src/app/page.tsx (mobile inherits desktop loading progress) |
|  | partial-results | YES | src/app/page.tsx (renders partial states with horizontal overflow) |
|  | stale-data | NO | No dedicated mobile indicator |
|  | provider-unavailable | NO | No mobile-specific fallback sheet |
|  | error | YES | src/app/page.tsx (mobile renders desktop error banner) |
|  | retry | YES | src/app/page.tsx (retry button on mobile error card) |
|  | no-results | NO | No mobile-specific empty card |
|  | rate-limited | NO | No mobile rate limit modal |
| **Rate Limiting & Degradation UI** | first-use/empty | YES | src/lib/rateLimit.ts (bucket full on start) |
|  | loading | N/A | In-memory rate limiter |
|  | partial-results | N/A | Binary allow/deny |
|  | stale-data | N/A | In-memory timestamps |
|  | provider-unavailable | N/A | In-process logic |
|  | error | YES | src/app/page.tsx (renders raw 429 error string) |
|  | retry | NO | No visual cooldown timer or auto-retry |
|  | no-results | N/A | Rate limit check |
|  | rate-limited | YES | src/lib/rateLimit.ts (returns 429 Too Many Requests) |
| **Market State Status Bar** | first-use/empty | PARTIAL | src/components/workspace/WorkspaceHeader.tsx (demo checkbox exists) |
|  | loading | NO | No loading skeleton for market status |
|  | partial-results | NO | Only shows toggle checkbox |
|  | stale-data | NO | No display of quote age |
|  | provider-unavailable | NO | No indicator if reference market feed is down |
|  | error | NO | Header does not display market feed error |
|  | retry | NO | No reconnect button for feeds |
|  | no-results | NO | Missing market feed indicator |
|  | rate-limited | NO | No market data throttle indicator |
| **Editorial Landing Surface** | first-use/empty | NO | Missing surface (not implemented) |
|  | loading | NO | Missing surface |
|  | partial-results | NO | Missing surface |
|  | stale-data | NO | Missing surface |
|  | provider-unavailable | NO | Missing surface |
|  | error | NO | Missing surface |
|  | retry | NO | Missing surface |
|  | no-results | NO | Missing surface |
|  | rate-limited | NO | Missing surface |
| **Global 404 Not Found Page** | first-use/empty | NO | Missing surface (src/app/not-found.tsx not created) |
|  | loading | NO | Missing surface |
|  | partial-results | NO | Missing surface |
|  | stale-data | NO | Missing surface |
|  | provider-unavailable | NO | Missing surface |
|  | error | NO | Missing surface |
|  | retry | NO | Missing surface |
|  | no-results | NO | Missing surface |
|  | rate-limited | NO | Missing surface |
| **Route Error Boundary (error.tsx)** | first-use/empty | NO | Missing surface (src/app/error.tsx not created; global-error.tsx exists for root only) |
|  | loading | NO | Missing surface |
|  | partial-results | NO | Missing surface |
|  | stale-data | NO | Missing surface |
|  | provider-unavailable | NO | Missing surface |
|  | error | NO | Missing surface |
|  | retry | NO | Missing surface |
|  | no-results | NO | Missing surface |
|  | rate-limited | NO | Missing surface |
| **Offline Degraded PWA Shell** | first-use/empty | NO | Missing surface (service worker src/app/sw.ts not created) |
|  | loading | NO | Missing surface |
|  | partial-results | NO | Missing surface |
|  | stale-data | NO | Missing surface |
|  | provider-unavailable | NO | Missing surface |
|  | error | NO | Missing surface |
|  | retry | NO | Missing surface |
|  | no-results | NO | Missing surface |
|  | rate-limited | NO | Missing surface |
| **Export & Share Artifact Surface** | first-use/empty | NO | Missing surface (no export modal or copy-markdown button) |
|  | loading | NO | Missing surface |
|  | partial-results | NO | Missing surface |
|  | stale-data | NO | Missing surface |
|  | provider-unavailable | NO | Missing surface |
|  | error | NO | Missing surface |
|  | retry | NO | Missing surface |
|  | no-results | NO | Missing surface |
|  | rate-limited | NO | Missing surface |

---

## 5. MISSING SYSTEM SURFACES

1. **Page Metadata & OpenGraph**:
   - *Status*: PARTIAL. `src/app/layout.tsx` defines basic `title` and `description`, but lacks OpenGraph image tags pointing to `public/og-image.png`, Twitter card tags, and dynamic viewport tags.
2. **Favicon & App Icon Wiring**:
   - *Status*: COMPLETE. `src/app/favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png`, `public/favicon.ico`, `public/favicon.svg`, and `public/apple-touch-icon.png` are wired and checksum-verified.
3. **404 Page (`src/app/not-found.tsx`)**:
   - *Status*: MISSING. Visiting an invalid route defaults to the framework's unstyled 404 page rather than the branded RedTeam Desk aesthetic.
4. **Error Boundary (`src/app/error.tsx`)**:
   - *Status*: MISSING. While `src/app/global-error.tsx` exists for root crash recovery, a route-level `src/app/error.tsx` is required by Next.js App Router for graceful client component recovery without a hard refresh.
5. **Offline / Degraded Shell**:
   - *Status*: MISSING. Service worker registration and cache-first offline fallback pages do not exist in `src/app/`.
6. **Web App Manifest**:
   - *Status*: COMPLETE. `public/manifest.webmanifest` exists, specifies standalone mode, icons, and theme colors, and is linked in `src/app/layout.tsx`.
7. **Robots & Sitemap**:
   - *Status*: MISSING. Neither `public/robots.txt` / `src/app/robots.ts` nor `src/app/sitemap.ts` exist.

---

## 6. MOBILE INFORMATION ARCHITECTURE

On a mobile screen (viewport <= 430px width), the following structural changes are required:

1. **Structural Progressive Disclosure**:
   - *Desktop*: The 4 stress test scenarios (Baseline, Volatility Spike, Weekend Gap, Basis Blowout) render as a 4-column side-by-side comparison table.
   - *Mobile*: The table causes horizontal overflow. It must be refactored into a vertical swipeable card stack or an accordion disclosure where only the active scenario and its primary P&L delta are displayed, with scenario details expandable on demand.
2. **Primary Navigation Transformation**:
   - *Desktop*: Full horizontal header displaying the endorsed logo lockup, status pills, deterministic fixture toggle, and action buttons.
   - *Mobile*: Header must collapse to a compact 48px bar containing only the mark glyph and a slide-out status menu. The "New Trade" action must move to a sticky bottom action bar.
3. **Narrow-Screen Decision Artifact Layout**:
   - *Hierarchy*: The verdict badge (`REJECT`, `WAIT`, `REDUCE`, `PROCEED`) must be sticky at the top of the viewport with large, high-contrast monospace typography.
   - *Executive Summary*: Must precede all granular metrics, with thesis challenge points formatted as distinct bulleted warning blocks rather than multi-column text.
   - *Provenance Inspection*: Desktop uses an off-canvas drawer (`max-w-md`). Mobile must render as a full-height bottom sheet modal with drag-down dismiss.
4. **Touch Targets Currently Below 44px (A11y Violations)**:
   - Preset chips in `TradeInputSurface.tsx`: `py-1.5 px-3` (~28px touch height).
   - Provenance pill badges in `DecisionArtifactView.tsx`: `text-xs py-0.5 px-1.5` (~20px touch height).
   - "Deterministic fixture mode" toggle checkbox in `WorkspaceHeader.tsx`: 16px native checkbox.
   - Scenario detail toggles and table cells: sub-32px clickable regions.

---

## 7. GOLDEN PATH TRACE

Canonical Demo Scenario: Trader asks a natural-language question about an rToken weekend gap (`rNVDA`), the system normalizes the trade, reconstructs the off-hours market state, challenges the thesis, executes quantitative stress tests, and returns an actionable decision verdict.

| STEP | FILE / FUNCTION | STATUS | BLOCKER IF ANY |
|---|---|---|---|
| 1. Trader enters trade prompt | `src/components/workspace/TradeInputSurface.tsx` | WORKS | None. Presets and custom text entry work cleanly. |
| 2. Natural language parsing & normalization | `src/core/trade/parser.ts` (`parseNaturalLanguageTrade`) | WORKS | None. Direction (`LONG`), asset (`rNVDA`), size (`$2,000`), and thesis extracted. Verified by `tests/parser.test.cjs`. |
| 3. Pre-fetch reference asset price | `src/app/api/market-price/route.ts` & `src/app/page.tsx` | WORKS | None. Falls back gracefully to working price if offline. |
| 4. User reviews & confirms trade | `src/components/workspace/NormalizedReviewCard.tsx` | WORKS | None. Structured review card correctly displays trade parameters. |
| 5. Dispatch stress test request | `POST /api/stress-test` (`src/app/api/stress-test/route.ts`) | WORKS | None. Dispatches to `DecisionDeskService.executeWorkflow` with SSE streaming. |
| 6. Reconstruct market state (Weekend Session) | `src/services/marketStateService.ts` & `src/fixtures/rnvda-demo.ts` | WORKS | None. In fixture mode, forces `WEEKEND` session, Friday close $118.00, token $121.50 (+2.97% basis premium). |
| 7. Gather & arbitrate market evidence | `src/adapters/evidence/arbitrator.ts` & `provider.ts` | WORKS | None. Reconciles reference equity quotes, liquidity depth, and crypto sentiment indicators. |
| 8. Deconstruct & challenge thesis | `src/core/thesis/extractor.ts` & `challenger.ts` | WORKS | None. Identifies invalidation risks (weekend crypto weakness dragging token before Monday open). Verified by `tests/adversarial-llm.test.cjs`. |
| 9. Quantitative scenario stress testing | `src/core/scenarios/engine.ts` (`runStressScenarios`) | WORKS | None. Deterministically calculates P&L across Baseline, Volatility Spike, Weekend Gap (-5% underlying), and Basis Blowout. Verified by `tests/scenarios.test.cjs`. |
| 10. Position classification & policy decision | `src/core/decision/classifyPosition.ts` & `policy.ts` | WORKS | None. Classifies position quality as `UNBALANCED` or `VULNERABLE`; outputs verdict (`WAIT` or `REDUCE`). Verified by `tests/truth-table.test.cjs`. |
| 11. Stream progress events to UI | `src/app/api/stress-test/route.ts` & `AnalysisProgressView.tsx` | WORKS | None. SSE chunks stream real-time stage updates to client. |
| 12. Render structured Decision Artifact | `src/components/workspace/DecisionArtifactView.tsx` | WORKS | None. Complete verdict, confidence score, risk checklist, scenarios, and actions rendered. |
| 13. Deep provenance inspection | `src/components/workspace/ProvenanceDrawer.tsx` | WORKS | None. Drawer opens and displays verifiable data sources and calculation logic. |

*Golden Path Verdict*: **COMPLETE & FUNCTIONAL**. The end-to-end demo chain from natural-language input to final decision artifact is fully operational and passes automated test verification.

---

## 8. DEPENDENCIES

| ITEM | DEPENDS ON | WHY |
|---|---|---|
| `Token-Themed UI Polish` | `docs/IDENTITY_TOKENS.md` | Colors, typography, spacing, and radii must strictly map to verified design tokens rather than ad-hoc CSS classes. |
| `Mobile Viewport Polish` | `src/components/workspace/DecisionArtifactView.tsx` | Scenario matrix and summary blocks must be restructured for viewports < 430px. |
| `Offline Service Worker` | `public/manifest.webmanifest`, `src/app/sw.ts` | Offline shell requires cached static assets and manifest declarations. |
| `Next.js Error Boundaries` | `src/app/layout.tsx` | Route-level error handling requires `error.tsx` alongside existing `global-error.tsx`. |
| `Ecosystem Handoffs` | `src/adapters/agenthub/handoff.ts`, `src/adapters/agentic/handoff.ts` | External AI-host integration requires serialized handoff payloads in the Decision Artifact. |

---

## 9. DO NOT TOUCH

The following modules are thoroughly tested and mechanically complete. They **must not be modified or refactored** during UI and styling phases:

1. **Deterministic Financial Math (`src/core/calculations/financial.ts`, `market.ts`)**:
   - *Reason*: Governs basis spread, position quantity, margin requirement, and P&L calculations. Fully covered by `tests/calculations.test.cjs`. Modifying math alters financial truth.
2. **Scenario Stress Testing Engine (`src/core/scenarios/engine.ts`, `config.ts`)**:
   - *Reason*: Core analytical engine executing the 4 canonical stress tests. Verified by `tests/scenarios.test.cjs` and `tests/truth-table.test.cjs`.
3. **Decision Policy & Position Classifier (`src/core/decision/policy.ts`, `classifyPosition.ts`)**:
   - *Reason*: Implements the deterministic rule engine that maps scenario results and thesis quality to the 4 verdicts (`PROCEED`, `WAIT`, `REDUCE`, `REJECT`). Verified by `tests/decision.test.cjs`.
4. **Natural Language Trade Parser Core (`src/core/trade/parser.ts`)**:
   - *Reason*: Strict extraction regex and tokenization for assets, directions, and position sizes. Fully covered by 223 unit tests in `tests/parser-matrix.test.cjs`.
5. **Deterministic Demo Fixtures (`src/fixtures/rnvda-demo.ts`)**:
   - *Reason*: Provides repeatable, predictable test data for the hackathon judging demo during off-hours. Verified by `tests/expanded-vertical-slice.test.cjs`.

---

## 10. ORDERED PRIORITY

### A. Must work before any visual work
1. **Design Token CSS Variable Injection** (`src/app/globals.css`): Inject all 11 `--rt-*` color tokens, typography scales, and spacing tokens into `:root`. *(Estimate: 1.5 hours)*
2. **Local Font Declaration & Typography Verification** (`src/app/layout.tsx`): Verify Geist and Geist Mono font face references match token definitions. *(Estimate: 1.0 hour)*
3. **Route Error Boundary (`src/app/error.tsx`) & 404 Page (`src/app/not-found.tsx`)**: Implement standard App Router error and not-found boundaries using brand tokens. *(Estimate: 1.5 hours)*
*Subtotal A: 4.0 hours*

### B. Must exist before final polish
1. **Workspace Header & Logo Lockup Brand Update**: Replace generic header elements with official SVG brand assets and token-based layout. *(Estimate: 2.0 hours)*
2. **Trade Input Surface & Normalized Review Card Brand Styling**: Re-skin inputs, buttons, chips, and review card with `--rt-surface-raised`, `--rt-border-subtle`, and 2px radii. *(Estimate: 2.5 hours)*
3. **Decision Artifact View Token Wiring & Verdict Badges**: Wire the 4 official SVG verdict state icons (`state-1.svg` through `state-4.svg`) and brand colors into the artifact. *(Estimate: 3.0 hours)*
4. **Mobile Layout Refactoring for Stress Scenarios**: Transform desktop 4-column scenario table into mobile-responsive card stack with touch targets >= 44px. *(Estimate: 2.5 hours)*
*Subtotal B: 10.0 hours*

### C. Should exist if time permits
1. **Editorial Landing View / Modal**: Lightweight introductory surface explaining the 24/7 tokenized equity risk problem and desk capabilities. *(Estimate: 3.5 hours)*
2. **Provenance Drawer Brand Refinement**: Apply brand typography and subtle border styling to the provenance drawer. *(Estimate: 2.0 hours)*
3. **Export Decision Artifact to Markdown / Clipboard**: Actionable export utility for traders to archive or share their stress-test verdict. *(Estimate: 2.5 hours)*
*Subtotal C: 8.0 hours*

### D. Nice to have / defer
1. **PWA Offline Service Worker & Asset Caching**: Background service worker caching for offline readiness. *(Estimate: 4.0 hours)*
2. **Interactive Scroll & Entry Transitions**: Motion-driven micro-interactions on stage completions. *(Estimate: 3.0 hours)*
3. **External Ecosystem Gateway Visualizer**: Educational UI diagram detailing the Agent Hub / AgentKey MCP handoff paths. *(Estimate: 5.0 hours)*
*Subtotal D: 12.0 hours*

---

## 11. TIMELINE VERDICT

Verdict: **YES** — Steps P0 through P8 fit within the runway remaining between today (21 Sept 2026) and the final submission deadline (27 Sept 2026).

The total estimated time across all priority tiers is **34.0 hours** (Tier A: 4.0h, Tier B: 10.0h, Tier C: 8.0h, Tier D: 12.0h), which translates to approximately 5.6 hours per day over the remaining 6 days.

If unanticipated blockers or API latency issues compress the available build window, the following **strict cut order** will be applied:
1. **First cut**: P7 Scroll & Micro-interaction Polish (saves 3.0 hours).
2. **Second cut**: P5 Standalone Editorial Landing Page (saves 3.5 hours; the single decision workspace is the core product authority).
3. **Third cut**: PWA Offline Service Worker & Installability (saves 4.0 hours).

Core phases **P0 through P4 will not be shrunk or compromised under any circumstances**, as they establish the brand tokens, core workspace UI, verdict graphics, and mobile usability required for a successful hackathon demo.

---

## 12. DOCUMENT RECONCILIATION

1. **`_delete-me/editorial-landing-page.md`**:
   - *Analysis*: Proposes a dark-themed marketing landing page with Syne and Space Grotesk typography. It does not add anything that B01–B07 and the identity folder do not already cover, as the brand identity explicitly mandates a high-contrast light theme (`#E7E9E6` Proof surface, `#0E2436` Ink primary) using Geist and Geist Mono.
   - *Conflict*: Directly conflicts with brand guidelines. The brand guidelines and B01–B07 win; this file remains staged in `_delete-me/` and is not implemented.
2. **`_delete-me/llm-as-partner-workflow.md`**:
   - *Analysis*: Outlines a conceptual creative direction philosophy for prompting generative models during design exploration. It does not contain product specifications, user journeys, or implementation rules.
   - *Verdict*: Does not conflict mechanically, but adds zero technical or domain requirements beyond what B01–B07 specify.
3. **`_delete-me/IMPLEMENTATION_PROMPT_BOOK.md`**:
   - *Analysis*: Contains an earlier sequential prompt plan that prioritized PWA setup and test framework additions before basic token wiring. The revised plan correctly supersedes this by prioritizing CSS tokens, core workspace reskinning, and mobile accessibility first.
   - *Verdict*: Kept in `_delete-me/` as historical reference; current work follows the revised prompt sequence.
4. **`_delete-me/REVISED_IMPLEMENTATION_PLAN.md`**:
   - *Analysis*: Outlines the adaptive phase flow from token foundation to component refinement. Its operational phases are aligned with the B-docs and identity folder, but it is superseded by the specific checklist requirements in this reconnaissance gap map.
   - *Verdict*: Fully reconciled; remaining execution directly adheres to the priority tiers established above.
