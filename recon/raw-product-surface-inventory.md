# RedTeam Desk — Raw Product Surface Reconnaissance

Repository: `/app/applet`
Branch: `Command 'git branch --show-current' returned non-zero exit status 128.`
Files inspected: **343**

> This is a structural reconnaissance of the existing repository. It intentionally does not evaluate visual design.

## 1. Screen / Page Candidates

- `src/app/page.tsx` — score 15 — page/index file, route/screen/view directory, interactive state, page-level markup
- `src/app/offline/page.tsx` — score 13 — page/index file, route/screen/view directory
- `src/app/error.tsx` — score 9 — route/screen/view directory, screen-like filename, interactive state
- `src/app/api/stress-test/route.ts` — score 8 — route/screen/view directory, screen-like filename
- `src/app/not-found.tsx` — score 8 — route/screen/view directory, screen-like filename
- `_delete-me/BitgetAI_RedTeamDesk_Identity/04_Product_Assets/src/app/layout.tsx` — score 5 — route/screen/view directory
- `src/app/api/market-price/route.ts` — score 5 — route/screen/view directory
- `src/app/layout.tsx` — score 5 — route/screen/view directory
- `src/app/loading.tsx` — score 5 — route/screen/view directory
- `src/app/opengraph-image.tsx` — score 5 — route/screen/view directory
- `src/components/workspace/DecisionArtifactView.tsx` — score 5 — screen-like filename, interactive state, page-level markup
- `src/components/workspace/TradeInputSurface.tsx` — score 5 — screen-like filename, interactive state, page-level markup

## 2. Component Candidates

### `src/app/loading.tsx`
- `AppBootLoader`
- `Loading`
### `src/app/page.tsx`
- `AbortController`
- `AnalysisProgressView`
- `AnalysisStage`
- `ClarificationModal`
- `DecisionArtifact`
- `DecisionArtifactView`
- `LandingSurface`
- `MobileBottomNav`
- `NormalizedReviewCard`
- `ParsedTradeResult`
- `ProvenanceDrawer`
- `ProvenanceRecord`
- `TradeInputSurface`
- `WorkspaceHeader`
- `WorkspacePage`
- `WorkspaceStep`
### `src/app/layout.tsx`
- `PwaProvider`
- `RootLayout`
### `src/app/opengraph-image.tsx`
- `OpenGraphImage`
### `src/app/error.tsx`
- `GlobalError`
- `Link`
### `src/app/not-found.tsx`
- `Link`
- `NotFound`
### `src/app/offline/page.tsx`
- `Link`
- `Lockup`
- `OfflinePage`
### `src/components/workspace/DecisionArtifactView.tsx`
- `DecisionArtifactView`
- `Reveal`
- `VerdictGlyph`
### `src/components/workspace/ClarificationModal.tsx`
- `ClarificationModal`
### `src/components/workspace/MobileBottomNav.tsx`
- `MobileBottomNav`
### `src/components/workspace/ProvenanceDrawer.tsx`
- `ProvenanceDrawer`
- `ProvenanceType`
### `src/components/workspace/WorkspaceHeader.tsx`
- `Lockup`
- `PwaInstallButton`
- `WorkspaceHeader`
### `src/components/workspace/NormalizedReviewCard.tsx`
- `NormalizedReviewCard`
### `src/components/workspace/AnalysisProgressView.tsx`
- `AnalysisProgressView`
- `VerdictScaleLoader`
### `src/components/workspace/TradeInputSurface.tsx`
- `TradeInputSurface`
### `src/components/landing/LandingSurface.tsx`
- `Image`
- `LandingSurface`
- `Reveal`
- `VerdictGlyph`
### `src/components/motion/Reveal.tsx`
- `HTMLElement`
- `Reveal`
- `Tag`
### `src/components/brand/VerdictGlyph.tsx`
- `Mark`
- `VerdictBadge`
- `VerdictGlyph`
### `src/components/brand/Logo.tsx`
- `Lockup`
- `Mark`
### `src/components/pwa/PwaManager.tsx`
- `BeforeInstallPromptEvent`
- `PwaContext`
- `PwaContextType`
- `PwaInstallButton`
- `PwaProvider`
### `src/components/feedback/AppBootLoader.tsx`
- `AppBootLoader`
### `src/components/feedback/VerdictScaleLoader.tsx`
- `VerdictScaleLoader`
### `_delete-me/BitgetAI_RedTeamDesk_Identity/04_Product_Assets/src/app/layout.tsx`
- `RootLayout`
### `_delete-me/BitgetAI_RedTeamDesk_Identity/04_Product_Assets/src/components/brand/Logo.tsx`
- `Lockup`
- `Mark`
### `_delete-me/BitgetAI_RedTeamDesk_Identity/04_Product_Assets/src/components/brand/VerdictGlyph.tsx`
- `Mark`
- `VerdictBadge`
- `VerdictGlyph`

## 3. Navigation

### `src/app/error.tsx`
- `/`
### `src/app/not-found.tsx`
- `/`
### `src/app/offline/page.tsx`
- `/`

## 4. User-Facing Text

### `src/app/page.tsx`
- ) : (
- !
- Analysis Could Not Proceed
- Back to edit
- Restart workspace
### `src/app/opengraph-image.tsx`
- ⯛
- Deterministic Risk Engine S05
- Adversarial Pre-Trade Risk Workbench
- Stress-test off-hours basis decoupling, crypto liquidity contagion, and thesis invalidation on 24/7 tokenized equities.
- STATE 1 • REJECT
- STATE 2 • WAIT
- STATE 3 • REDUCE
- STATE 4 • PROCEED
- PURE MATH GATING • PROVENANCE TRACEABLE
### `src/app/error.tsx`
- !
- Workbench Interruption
- Retry operation
- Return to desk
### `src/app/not-found.tsx`
- ?
- 404 • ROUTE NOT FOUND
- Resource Outside Scope
- Return to primary workbench
### `src/app/offline/page.tsx`
- OFFLINE MODE
- Network Connection Unavailable
- RETRY CONNECTION →
- BITGET AI REDTEAM DESK • PRE-TRADE ADVERSARIAL FIREWALL
### `src/components/workspace/DecisionArtifactView.tsx`
- Audit provenance
- Deterministic policy
- Proposed trade
- 0 && (
- LIMITATION:
- SNAPSHOT DATA:
- e.state === "UNAVAILABLE" || e.state === "CURATED_DEMO_FIXTURE") && (
- WARNING:
- Live evidence is UNAVAILABLE. Operating on explicitly labeled CURATED DEMO FIXTURE data.
- l.includes("Bitget API unavailable"))) && (
- DEMO SAFETY NET:
- 2
- Decisive policy reasons
- [PROV: RULE-EVAL]
- 3
- Market state reconstruction
- Basis premium
- Orderbook spread
- Equity session
- Liquidity depth
- Bitget token
- Underlying equity
- United States market clock
- Orderbook class
- 4
- Deterministic stress scenarios
- Zero speculative heuristics • Pure deterministic arithmetic
- STRESS
- Shocked token:
- Position P and L:
- Return shock:
- Assumptions:
- 5
- Core product thesis
- Thesis quality versus position quality deconstruction
- Thesis Quality
- Position Quality
- Deterministic Drivers
- Key mismatch identified
- ) : (
- Qualitative Synthesis
- Unavailable due to system degradation. Proceeding on deterministic bounds only.
- 6A
- Thesis deconstruction
- Normalized thesis
- Extracted assumptions
- Provenance links
- Key dependencies
- Thesis Deconstruction
- Unavailable due to system degradation.
- 6B
- Adversarial counter challenge
- Strongest counter thesis
- Vulnerable assumptions attacked
- Contradictory evidence refs
- Adversarial Challenge
- 7
- Actionable change conditions
- ✓
- Stress test another trade
- Trace to deterministic policy / qualitative logic
- AI Model Identity
### `src/components/workspace/ClarificationModal.tsx`
- Clarification needed
- Field required for deterministic calculations:
- What we extracted so far:
- 0 && (
- Your answer
- Back to edit full trade
- Processing...
### `src/components/workspace/MobileBottomNav.tsx`
- Risk Desk
- Overview
- New Trade
- ) : hasArtifact && onOpenProvenance ? (
- Provenance
- ) : canInstall ? (
- Install
- ) : (
- Top
- Mobile workspace navigation
- Risk Desk View
- System Overview
- Start new trade stress test
- Open Audit Provenance
- Install PWA Application
- Scroll to top
### `src/components/workspace/ProvenanceDrawer.tsx`
- Data provenance and audit S09
- Evidence and verification chain
- Deterministic separation of facts, formulas, and hypotheses
- 0 && (
- Inputs and parameters:
- Close drawer
- Provenance details
- Close provenance drawer
### `src/components/workspace/WorkspaceHeader.tsx`
- DEMO MODE: Simulating Weekend Off-Hours Session
- Risk workbench
- ← System overview
- Live Bitget
- Deterministic fixture
- New stress test
- Bitget AI RedTeam Desk Mark
### `src/components/workspace/NormalizedReviewCard.tsx`
- Checkpoint S04
- Normalized trade review
- Confirm how the desk understood your trade before running stress scenarios.
- Edit trade
- You told us this (user intent)
- Asset and direction:
- Position size:
- Time horizon:
- 0 && (
- Existing exposure:
- Thesis:
- Specified entry price:
- System derived and observed
- Bitget spot pair:
- Instrument classification:
- Reference underlying:
- Working entry price:
- 0 ? (
- ) : (
- Pending live fetch...
- Implied token quantity:
- Calculated at execution
- Inferred mappings:
- Cancel or edit
- Starting analysis...
- Confirm and run stress test
### `src/components/workspace/TradeInputSurface.tsx`
- Desk thesis: separate thesis quality from position quality
- Stress test your trade
- before entering the market.
- Proposed trade and rationale
- Natural language parsed deterministically
- Test Verdict Policy Gates:
- STATE 4
- PROCEED
- STATE 3
- REDUCE
- STATE 2
- WAIT
- STATE 1
- REJECT
- Quick start scenarios:
- Analyzing trade...
- ) : (
- Stress test trade
- Core thesis
- A trader can have a reasonable thesis
- and still hold a vulnerable position.
- Describe what you plan to buy or sell and why...
### `src/components/landing/LandingSurface.tsx`
- HOW IT WORKS
- TEMPLATES
- BENCHMARKS
- DOCUMENTATION
- RUN DESK
- 05 / APPLICATION WEBSITE
- TOKENIZED EQUITIES PRE-TRADE
- THIS IS NOT A COPILOT.
- THIS IS AN ADVERSARY.
- EXPLORE ARCHITECTURE
- 01 / DETERMINISTIC VERDICT SCALE
- Automated policy gates evaluated on every trade.
- STATE 4
- SCORE ≥ 0.80
- PROCEED
- Clear execution runway. Basis within parameters, thesis fully falsifiable, risk within account limit.
- Gated Policy: Green
- TEST PROCEED →
- STATE 3
- SCORE ≥ 0.60
- REDUCE
- Basis risk elevated. Trim notional position size by 40% or hedge crypto contagion drag.
- Gated Policy: Warning
- TEST REDUCE →
- STATE 2
- SCORE ≥ 0.35
- WAIT
- Off-hours market close or un-anchored basis drift. Defer execution until cash open at 09:30 ET.
- Gated Policy: Deferral
- TEST WAIT →
- STATE 1
- SCORE &lt; 0.35
- REJECT
- Critical tail risk or unfalsifiable thesis. Position blocked from trade execution.
- Gated Policy: Blocked
- TEST REJECT →
- 01 • STRUCTURAL VULNERABILITY
- Off-hours dislocation on tokenized equities.
- 65.5-Hour Liquidity Void
- Un-Anchored Basis Drift
- Contagion Spillover
- Crypto Correlation Drag
- Monday Open Snap
- Basis Premium Collapse
- 02 • EXECUTION PIPELINE
- Seven verifiable pipeline stages.
- STAGE 1
- S01 / S02
- Trade Input &amp; Natural Language Parsing
- STAGE 2
- S04 STREAM
- Live Price &amp; Market State Reconstruction
- STAGE 3
- ARBITRATION
- Evidence Gathering &amp; Arbitration
- STAGE 4
- ADVERSARIAL CORE
- Thesis Deconstruction &amp; Adversarial Challenge
- STAGE 5
- MATHEMATICAL SHOCK
- Deterministic Quantitative Stress Testing
- STAGE 6
- POLICY GATING
- Policy Verdict &amp; Thesis vs. Position Deconstruction
- STAGE 7
- S06 DECISION READY / S09 AUDIT
- Provenance Graph Assembly
- 03 • TARGET USER SPECIFICATION
- Engineered for 24/7 tokenized equity traders.
- Trading Focus
- Tokenized equities (`rNVDA`, `rTSLA`, `rAAPL`), crypto cross-hedges, and off-hours execution.
- Decision Protection
- Pre-trade adversarial interrogation, deterministic basis checks, and explicit invalidation thresholds.
- Stress-test your trade before committing capital.
- Enter the RedTeam Desk with the canonical golden-path scenario or input your own tokenized equity trade thesis.
- RUN GOLDEN PATH DESK
- ENTER CUSTOM THESIS
- BITGET AI REDTEAM DESK • ADVERSARIAL PRE-TRADE FIREWALL
- Bitget AI RedTeam Desk Mark
- Watermark
### `src/components/pwa/PwaManager.tsx`
- Promise
- Install PWA app
- Install Bitget AI RedTeam Desk PWA
### `src/components/feedback/AppBootLoader.tsx`
- SUBSYSTEM
- STATUS
- Bitget API Gateway
- READY
- Deterministic Policy Matrix
- LOADED
- Audit &amp; Provenance Chain
- ONLINE
### `src/components/feedback/VerdictScaleLoader.tsx`
- Stress Test Engine S05
- Deterministic Risk Evaluation
- Clear
- Moderate
- High Risk
- Critical
- 0 && stages[activeStageIndex] && (
- 0 && (
- ✓ DONE
- ) : isCurrent ? (
- RUNNING
- ) : (
- QUEUED
- Stress test analysis in progress
### `_delete-me/BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/brand-guidelines.html`
- RedTeam Desk — Identity Standards
- BITGET AI
- REDTEAM DESK
- Identity standards
- 01 — THE IDEA
- The mark carries the metric
- 02 — THE VERDICT SYSTEM
- Four states, one construction
- These map one-to-one onto
- Decision.verdict
- in
- src/core/decision/policy.ts
- PROCEED
- displacement 0u
- Thesis and position both survive the stress case.
- REDUCE
- displacement 4.5u
- Survives only at smaller size.
- WAIT
- displacement 9u
- Inputs are degraded or uncertain. Do not act yet.
- REJECT
- displacement 15u
- The counter-thesis holds. Do not deploy capital.
- 03 — LOGO
- Masters and lockups
- Primary · Reversed · Single-colour · Knockout
- Mark.tsx
- 04 — COLOUR
- Red is a verdict, not a decoration
- #0E2436
- Blueprint Navy
- Primary structure. The body of the mark, headings, dark surfaces.
- #C8102E
- Stamp Red
- The fault, and REJECT. Reserved. Never decoration.
- #E7E9E6
- Proof Gray
- The ground. Report stock, not a warm cream.
- #06121C
- Deep Field
- App chrome, night applications, packaging.
- #54697E
- Steel
- Rules, axes, secondary type, the WAIT verdict.
- #0E9F8B
- #C98A14
- 05 — TYPE
- Sans speaks, mono computes
- WORDMARK
- ENDORSER
- HEADLINE
- FIGURES
- −$412 · 2.8% · −88% · 0.71
- PROSE
- Bring a trade idea. We argue the other side, then compute what it costs you.
- 06 — THE FAULT DEVICE
- A measured rule at −12°
- It never crosses type.
- 07 — MISUSE
- What breaks the computation
- Do not change the displacement outside the verdict scale.
- Offset is data. An arbitrary offset states a risk reading that the engine never returned.
- Do not recolour the seam.
- Except to a verdict colour, in a verdict glyph. The seam is the only red surface in the system.
- Do not rotate, stretch, outline or shade the mark.
- −12° is fixed. The mark has no depth; it is a plan view of a fracture.
- Do not let anything enter the clearspace.
- 18 units on all sides, the same value as the chamfer.
- Do not set figures in the sans.
- The mono face is the claim that a number was computed rather than narrated. It is the product's core promise.
- 08 — IN APPLICATION
- Where it lands
- BITGET AI · REDTEAM DESK · IDENTITY STANDARDS v1.0
- Construction grid
- Horizontal lockup
- Clearspace
- Size ladder
- Thesis not equal to Position
- The overhang rule
- Misuse
- Billboard
- Business cards
- Packaging
- Website
- Storefront
- Product

## 5. Runtime / Data Dependencies

- `src/setupLlm.ts` → api
- `src/app/page.tsx` → api route, fetch
- `src/adapters/bitget/client.ts` → api, api route
- `src/core/verdictStore.ts` → localStorage
- `src/core/thesis/llmClient.ts` → fetch
- `src/scripts/verify-signal-connectivity.ts` → fetch
- `public/sw.js` → api route, fetch
- `scripts/probe-providers.ts` → api, api route, fetch

## 6. Interaction / State Signals

- `test_run.ts` → errors
- `test-real.ts` → errors
- `test_theses.ts` → errors, loading
- `next.config.ts` → errors
- `test-resilience.js` → errors
- `tests/yahoo.live.test.ts` → empty_states
- `tests/bitget.live.test.ts` → empty_states
- `src/setupLlm.ts` → errors
- `src/app/loading.tsx` → loading
- `src/app/page.tsx` → buttons, click_actions, dialogs, drawers, errors, forms, loading, state
- `src/app/error.tsx` → buttons, click_actions, effects, errors
- `src/app/not-found.tsx` → conditional_ui
- `src/app/api/market-price/route.ts` → errors
- `src/app/api/stress-test/route.ts` → errors
- `src/adapters/evidence/provider.ts` → empty_states, errors
- `src/adapters/network/http.ts` → errors
- `src/adapters/research/bitgetUsEquityMcpProvider.ts` → errors
- `src/adapters/research/bitgetSignalAgentBridge.ts` → empty_states, errors
- `src/adapters/research/bitgetSignalProvider.ts` → empty_states, errors
- `src/adapters/agenthub/paperTrading.ts` → errors
- `src/adapters/bitget/client.ts` → errors
- `src/adapters/reference/yahoo.ts` → errors
- `src/adapters/reference/composite.ts` → errors
- `src/adapters/agentic/handoff.ts` → errors
- `src/hooks/useVerdict.ts` → effects, state
- `src/components/workspace/DecisionArtifactView.tsx` → buttons, click_actions, state
- `src/components/workspace/ClarificationModal.tsx` → buttons, click_actions, dialogs, forms, inputs, state
- `src/components/workspace/MobileBottomNav.tsx` → buttons, click_actions
- `src/components/workspace/ProvenanceDrawer.tsx` → buttons, click_actions, dialogs, drawers, effects, state
- `src/components/workspace/WorkspaceHeader.tsx` → buttons, click_actions
- `src/components/workspace/types.ts` → drawers, errors, loading
- `src/components/workspace/NormalizedReviewCard.tsx` → buttons, click_actions, loading
- `src/components/workspace/TradeInputSurface.tsx` → buttons, click_actions, forms, inputs, loading, state
- `src/components/landing/LandingSurface.tsx` → buttons, click_actions
- `src/components/motion/Reveal.tsx` → effects
- `src/components/pwa/PwaManager.tsx` → buttons, click_actions, effects, errors, state
- `src/core/calculations/financial.ts` → errors
- `src/core/validation/runtime.ts` → errors
- `src/core/thesis/extractor.ts` → errors
- `src/core/thesis/llmClient.ts` → errors
- `src/core/thesis/challenger.ts` → errors
- `src/core/thesis/assessment.ts` → errors
- `src/scripts/verify-paper-trading.ts` → errors
- `src/scripts/verify-connectivity.ts` → errors
- `src/scripts/verify-signal-connectivity.ts` → errors
- `src/lib/rateLimit.ts` → errors
- `src/services/marketStateService.ts` → errors
- `src/services/decisionDeskService.ts` → errors
- `public/sw.js` → buttons, errors
- `scripts/testPositionQuality.ts` → errors
- `scripts/probe-providers.ts` → errors

## 7. Product Documentation

### `PROMPT_BOOK.md`
# PROMPT BOOK: Bitget AI RedTeam Desk
## P01: INFRASTRUCTURE & DATA VERIFICATION
### PURPOSE
### DEPENDENCIES
### START PROMPT
### EXPECTED DELIVERABLES
### AUDIT PROMPT
## P02: AI LAYER IMPLEMENTATION
### PURPOSE
### DEPENDENCIES
### START PROMPT
### EXPECTED DELIVERABLES
### AUDIT PROMPT
## P03: DESIGN & UI INTEGRATION
### PURPOSE
### DEPENDENCIES
### START PROMPT
### EXPECTED DELIVERABLES
### AUDIT PROMPT
## P04: END-TO-END INTEGRATION & ERROR HANDLING
### PURPOSE
### DEPENDENCIES
### START PROMPT
### EXPECTED DELIVERABLES
### AUDIT PROMPT
## P05: HACKATHON DEMO POLISH & SUBMISSION
### PURPOSE
### DEPENDENCIES
### START PROMPT
### EXPECTED DELIVERABLES
### AUDIT PROMPT
### `B03_Experience_Architecture.md`
# B03 — Experience Architecture
## 1. EXPERIENCE PRINCIPLE
## 2. PRIMARY USER JOURNEY
### Stage 1 — Open Product
### Stage 2 — Start Trade Stress Test
### Stage 3 — Describe Trade
### Stage 4 — Clarify Only If Necessary
### Stage 5 — Review Normalized Trade
### Stage 6 — Analysis
### Stage 7 — Decision Artifact
## 3. ENTRY EXPERIENCE
### Before submission, the experience should show
### Before submission, the experience should NOT show
## 4. TRADE SUBMISSION EXPERIENCE
### The system extracts
### The system should derive rather than ask for
### Clarification rule
## 5. NORMALIZED TRADE REVIEW
### User-editable information
### System-derived information
### Missing information
### Inferred information
### Confirmation behavior
## 6. ANALYSIS EXPERIENCE
### Visible progress stages
### What should be visible
### What should remain hidden
## 7. DECISION ARTIFACT EXPERIENCE
### Information hierarchy
### Progressive disclosure
### Uncertainty
### Scenario assumptions
### Provenance
## 8. THESIS EXPERIENCE
### Presentation order
### Correction mechanism
### AI behavior
### Vague thesis
## 9. REDTEAM / CHALLENGE EXPERIENCE
### How the challenge is introduced
### What accompanies the challenge
### Inspecting the challenge
### Avoiding meaningless bear cases
### No strong counter-thesis
### RedTeam naming
## 10. STRESS SCENARIO EXPERIENCE
### Scenario 1 — Market Risk
### Scenario 2 — Crypto Contagion
### Scenario 3 — Token Microstructure
### Scenario 4 — Combined Shock
### Optional Scenario — Thesis Failure
### Scenario interaction rule
## 11. THESIS VS POSITION EXPERIENCE
### Thesis Quality presentation
### Position Quality presentation
### Relationship explanation
### Effect on final decision
## 12. DECISION EXPERIENCE
### Decision presentation
### Decision language
### User responsibility
## 13. CHANGE CONDITIONS EXPERIENCE
### Normal quantity
### Priority
### Relationship to thesis
### Relationship to decision
### MVP interaction
## 14. PROVENANCE & TRUST EXPERIENCE
### Four information types
### Progressive disclosure model
### Trust behavior
### Source conflicts
### Stale information
### Missing information
## 15. ERROR & UNCERTAINTY EXPERIENCE
### Incomplete trade input
### Vague thesis
### Missing market data
### Stale data
### Conflicting sources
### Unavailable reference price
### Illiquid token
### Missing portfolio context (Future)
### Unsupported asset
### No meaningful counter-thesis
### Scenario cannot be calculated reliably
### General rule
## 16. MOBILE-FIRST VS DESKTOP
### Mobile must support
### Desktop may optimize for
### Decision Artifact adaptation
### Small-screen interaction rules
## 17. THE HACKATHON DEMO EXPERIENCE
### 1. Starting state
### 2. Trade submission
### 3. Normalization
### 4. Market-state reconstruction
### 5. Thesis extraction
### 6. Challenge
### 7. Stress scenarios
### 8. Thesis vs Position
### 9. Final decision
### 10. Change conditions
### 11. Decision Artifact
### Demo rule
## 18. EXPERIENCE STATES
### Empty
### Input
### Clarification
### Normalized
### Analysing
### Partial Analysis
### Analysis Complete / Decision Ready
### Error
## 19. MVP EXPERIENCE BOUNDARY
### MUST HAVE
### SUPPORTING
### CUT
### `PENDING_TASKS.md`
# Pending Tasks: US Equity MCP Integration
## Agent Hub (PRE24-06) — read-only handoff implemented; live session is a developer-side step
## Chainbase AgentKey (PRE24-05) — implemented as documented AI-host handoff
## Bitget Signal (PRE24-03) — implemented, live-proven, upstream-dependent
## Completed (PRE24-02, verified 2026-09-20)
## Remaining (requires live endpoint)
## Live-endpoint verification (2026-09-20 → 2026-09-21)
## Agentic Account (PRE24-07) — handoff path implemented; authorization is a human-side step
### `PRE24_ALL_OPTIONAL_TOOLKIT_EXPANSION_SPEC.md`
# PRE-24 — Bitget AI RedTeam Desk
# All-Optional-Toolkit Expansion Specification
## 0. READ THIS FIRST
# 1. WHY WE ARE ADDING THESE THINGS
# 2. CURRENT-STATE ASSUMPTIONS
# 3. A CURRENT SPEC DRIFT TO PRESERVE
# 4. TOOLKIT CAPABILITY MATRIX
## 4.1 Bitget US Equity / ETF MCP
## 4.2 Bitget Signal
# 5. CHAINBASE AGENTKEY
# 6. BITGET AGENT HUB — READ-ONLY
# 7. AGENTIC ACCOUNT — HUMAN-CONFIRMED ONLY
### Allowed
### Forbidden
# 8. PAPER TRADING
# 9. PLAYBOOK / GETAGENT
# 10. GETAGENT SKILL
# 11. WHAT MUST NEVER CHANGE
### 11.1 Deterministic math remains deterministic
### 11.2 Evidence remains traceable
### 11.3 Optional providers cannot become hidden dependencies
### 11.4 No autonomous execution
### 11.5 Human decision remains final
### 11.6 The product remains one workspace
# 12. FEATURE-FLAG PLAN
# 13. PROVIDER ARCHITECTURE
# 14. SOURCE ARBITRATION
# 15. ERROR AND TIMEOUT POLICY
# 16. VERCEL / SERVERLESS RULE
### Web-deployable integration
### Developer/agent-host integration
### User-external integration
# 17. JUDGE-VISIBLE EXPERIENCE
# 18. THE IDEAL SHOWCASE FLOW AFTER THESE ADDITIONS
### Main story
### Optional second story
### Optional third story
# 19. NON-CODE OPTIONAL HACKATHON ADVANTAGES
# 20. SUCCESS CRITERIA
### Core
### Research
### Safety
### Product
### Submission
# 21. DEFINITION OF DONE
# 22. SOURCES
### `SUBMISSION.md`
# Submission — Bitget AI RedTeam Desk
## Project Description
## Target User
## Role of the LLM
## Safety Boundaries
## Suggested X (Twitter) Post Text
### `B05_AI_Behavior_and_Prompts.md`
# B05: AI Behavior and Prompts
## 1. Purpose and Scope
## 2. Fundamental AI Principles
## 3. Core AI Modules
### 3.1 Module 1: Thesis Extractor
### 3.2 Module 2: Thesis Challenger (RedTeam)
### 3.3 Module 3: Thesis vs Position Assessor
## 4. Fallback and Failure Modes
### `B06_Hackathon_Demo_and_Quality.md`
# B06: Hackathon Demo and Quality
## 1. Purpose and Scope
## 2. The Demo Wedge: Off-Hours Trading
### 2.1 The Timing Problem
### 2.2 The "Demo Mode" Solution
## 3. The Core Demo Script
## 4. Submission Artifacts
## 5. Quality Gates
## 6. Optional Integrations: Demo Truthfulness Gates
### `CLAUDE.md`
### `B04_Information_Architecture_and_Screen_Specification.md`
# B04 — Information Architecture & Screen Specification
## 1. INFORMATION ARCHITECTURE PRINCIPLE
### MVP structural model
### Navigation decisions
## 2. SCREEN / SURFACE INVENTORY
## 3. S01 — ENTRY / START
### Required information
### Optional information
### Must NOT appear
### Mobile behavior
### Desktop behavior
## 4. S02 — TRADE INPUT
### Required information
### Optional information
### Information structure
### Example
### Validation
### What must NOT happen
### Mobile behavior
### Desktop behavior
## 5. S03 — CLARIFICATION
### Required information
### Optional information
### Must NOT appear
### Interaction rule
### Mobile behavior
### Desktop behavior
## 6. S04 — NORMALIZED TRADE REVIEW
### Required information
### Optional information
### Information distinction
### Editable
### System-derived / read-only
### Warnings
### Must NOT appear
### Mobile behavior
### Desktop behavior
## 7. S05 — ANALYSIS
### Visible progress stages
### What the user sees
### What stays hidden
### Must NOT appear
### Mobile behavior
### Desktop behavior
## 8. S06 — DECISION ARTIFACT
### Exact information hierarchy
### 1. Trade + Verdict
### 2. Decisive Reasons
### 3. Market State
### 4. Thesis
### 5. Challenge
### 6. Stress Scenarios
### 7. Thesis vs Position
### 8. Change Conditions
### 9. Evidence / Provenance
### Must NOT appear
### Mobile behavior
### Desktop behavior
## 9. S07 — PARTIAL ANALYSIS / QUALIFIED RESULT
### Required information
### Must NOT appear
### Mobile behavior
### Desktop behavior
## 10. S08 — ERROR / BLOCKED
### Required information
### Must NOT appear
### Mobile behavior
### Desktop behavior
## 11. S09 — PROVENANCE DETAIL SURFACE
### Required information
### Optional information
### Must NOT appear
### Mobile behavior
### Desktop behavior
## 12. ENTRY / TRADE INPUT INFORMATION ARCHITECTURE
### Validation behavior
## 13. NORMALIZED TRADE INFORMATION ARCHITECTURE
### Primary order
## 14. ANALYSIS SURFACE INFORMATION ARCHITECTURE
### Progress information
### Stable findings
### Limitations
### Completion
## 15. DECISION ARTIFACT — MOBILE
### Immediately visible
### Early expandable content
### Lower-priority detail
### Sticky / persistent
### Mobile rules
## 16. DECISION ARTIFACT — DESKTOP
### Appropriate uses of width
### Canonical rule
### Must NOT become
## 17. ERROR / PARTIAL ANALYSIS INFORMATION ARCHITECTURE
## 18. SESSION / HISTORY
### Recommended MVP decision — No dedicated history product.
### What is deferred
### Conditional future addition
## 19. NAVIGATION
### Primary navigation
### Back behavior
### Restart behavior
### Earlier-step editing
### Previous analyses
## 20. RESPONSIVE INFORMATION ARCHITECTURE
### Structurally identical
### Adaptive presentation
### Mobile priority
### Desktop opportunity
## 21. SCREEN-TO-SCREEN FLOW
### Transition rules
## 22. HACKATHON DEMO SURFACE
### Demo navigation rule
### Minimum demo story
## 23. MVP SCREEN BOUNDARY
### MUST BUILD
### SUPPORTING
### CUT
## 24. INFORMATION ARCHITECTURE NORTH STAR
### `B02_MVP_Product_Mechanics.md`
# B02 — MVP Product Mechanics
## 1. MVP USER ENTRY
### Required
### Optional
### System-derived
### Input behavior
## 2. TRADE NORMALIZATION
### Canonical fields
### Normalization rules
## 3. MARKET STATE REQUIREMENTS
### 3.1 Token price
### 3.2 Reference price
### 3.3 Basis/divergence
### 3.4 Reference-market status
### 3.5 Token-market status
### 3.6 Liquidity
### 3.7 Relevant cross-asset conditions
### 3.8 Fresh relevant events
### Market-state minimum
## 4. THESIS EXTRACTION
### Required thesis structure
### Extraction behavior
### Vague thesis behavior
## 5. THESIS CHALLENGE
### What the system challenges
### How the counter-thesis is formed
### Credible challenge requirements
### No meaningful counter-thesis
## 6. STRESS TEST ENGINE
### Scenario 1 — Market Risk
### Scenario 2 — Crypto Contagion
### Scenario 3 — Token Microstructure
### Scenario 4 — Combined Shock
### Scenario 5 — Thesis Failure
### Scenario rules
## 7. THESIS VS POSITION
## Thesis Quality
### Inputs
### Evaluation
### Output
## Position Quality
### Inputs
### Evaluation
### Output
### How they affect the decision
## 8. PORTFOLIO CONTEXT (FUTURE)
### Minimum portfolio context
### Bitget retrieval
### System calculations
### When portfolio information is unavailable
## 9. DECISION SYNTHESIS
### Possible decisions
### Inputs
### Decision logic
### Uncertainty handling
### User responsibility
## 10. CHANGE CONDITIONS
### Sources of change conditions
### Required form
### Rules
## 11. MVP DECISION ARTIFACT
### 11.1 Decision Summary
### 11.2 Market State
### 11.3 Thesis
### 11.4 Challenge
### 11.5 Stress Scenarios
### 11.6 Thesis vs Position
### 11.7 Change Conditions
### 11.8 Evidence & Provenance
### Artifact composition rule
## 12. FAILURE & EDGE CASES
### 12.1 Incomplete trade input
### 12.2 Vague thesis
### 12.3 Missing market data
### 12.4 Stale data
### 12.5 Conflicting sources
### 12.6 Unavailable reference price
### 12.7 Illiquid token
### 12.8 Missing portfolio context (Future)
### 12.9 Unsupported asset
### 12.10 No meaningful counter-thesis
### 12.11 Scenario cannot be calculated reliably
### General failure rule
## 13. THE SINGLE VERTICAL SLICE
### User
### Asset
### Market condition
### Trade idea
### Thesis
### Relevant data
### Stress scenarios
### Expected challenge
### Expected decision artifact
### Expected final decision
## 14. MVP FEATURE INVENTORY
### MUST BUILD
### SUPPORTING
### CUT
## Product Mechanics Summary
### `SUBMISSION_CHECKLIST.md`
# 🏆 Hackathon Submission Checklist
## 1. 🔄 Confirm the Hackathon LLM Configuration
## 2. ⏱️ Know the Degradation Story (it is a feature, not an apology)
## 3. 📝 Judge-Facing Copy
## 4. 🚀 Deployment Verification
### `B07_Optional_Bitget_Ecosystem_Integrations.md`
# B07: Optional Bitget Ecosystem Integrations
## 1. Purpose and Ground Rules
## 2. The Composition Root
## 3. Native vs External/Agent-Host Based
## 4. The Integrations
### 4.1 Bitget US Equity MCP (PRE24-02) — Implemented (in-app)
### 4.2 Bitget Signal (PRE24-03) — Implemented (in-app), upstream-dependent
### 4.3 Chainbase AgentKey (PRE24-05) — Implemented as a handoff (external)
### 4.4 Agent Hub — read-only (PRE24-06) — Implemented as a handoff (external execution)
### 4.5 Agentic Account (PRE24-07) — Implemented as a handoff (external authorization)
### 4.6 Paper Trading (PRE24-08, companion PRE24-10) — Implemented as an external harness
### 4.7 Playbook / GetAgent (ecosystem surfaces) — External setup only
## 5. What Remains Optional — And Why That Is the Design
## 6. Safety Boundaries
## 7. Related Documents
### `ARCHITECTURE_AND_LIMITATIONS.md`
# Bitget AI RedTeam Desk: Architecture & Production Roadmap
## Overview
## MVP Architecture
## Known Limitations & Path to Production
### 1. Market Depth & Liquidity (L1 vs L2 Data)
### 2. Static Risk Profiling
### 3. Reference Pricing (Basis Calculation)
### 4. LLM Endpoint Stability
## Optional Ecosystem Integrations (PRE24 series)
## Graceful Degradation Philosophy
### `B01_Product_Foundation.md`
# B01 — Product Foundation
## 1. Product Identity
## 2. Product Thesis
## 3. Primary User
## 4. Core Job
## 5. Core Problem
## 6. Product Promise
### What the product promises
### What the product does not promise
## 7. Product Principles
### 7.1 Evidence before narrative
### 7.2 Challenge before confirmation
### 7.3 Scenario before prediction
### 7.4 Position before generic asset analysis
### 7.5 Deterministic numbers
### 7.6 Transparent provenance
### 7.7 Decision over conversation
### 7.8 Explicit uncertainty
### 7.9 Minimum necessary complexity
## 8. Core Product Loop
### Stage 1 — Trade Idea
### Stage 2 — Reconstruct Market State
### Stage 3 — Decompose Thesis
### Stage 4 — Challenge Thesis
### Stage 5 — Stress Position
### Stage 6 — Check Portfolio Impact (FUTURE)
### Stage 7 — Decide
### Stage 8 — Define What Changes the Decision
## 9. Decision Artifact
### 9.1 Decision Summary
### 9.2 Market State
### 9.3 Thesis
### 9.4 Challenge
### 9.5 Stress Scenarios
### 9.6 Thesis vs Position
### 9.7 Change Conditions
### 9.8 Evidence & Provenance
## 10. Product Boundaries
### IN SCOPE
### OUT OF SCOPE FOR THE HACKATHON
### FUTURE / CONDITIONAL
### Explicit handling of requested boundary areas
## 11. Trust Model
### 11.1 Observed Fact
### 11.2 Calculated Metric
### 11.3 Scenario Assumption
### 11.4 AI Interpretation
### Handling missing information
### Handling conflicting information
### Handling stale information
### Handling uncertainty
### False-precision rule
## 12. Differentiation
## 13. Success Criteria
## 14. Product North Star
### `PRODUCT_DESCRIPTION.md`
# Product Description
## 1. Thesis
## 2. Target User & Product Value
## 3. Validation Data & Key Metrics
## 4. Progress
## 5. Deliverables
## 6. Our Take on AI Trading
### `README.md`
# Bitget AI RedTeam Desk
## About the Project
## Getting Started
### Prerequisites
### Installation
### Configuration
### Running the Application (UI)
### Running Tests
## Implementation Map (Capabilities)
## Architecture & Specifications
### `AGENTS.md`
# This is NOT the Next.js you know
### `PRE24_BASELINE.md`
# PRE24 Baseline Report — Bitget AI RedTeam Desk
## 1. Verification Results (final working-tree state)
### 1.1 The single test failure
### 1.2 Working-tree transition during this baseline (actual history)
### 1.3 Committed HEAD state (`9ebbf44`) — verified in an isolated worktree
### 1.4 Conclusion
## 2. Optional Integrations — Implementation Status
### 2.1 Implemented and wired into the production workflow
### 2.2 Supporting infrastructure
### 2.3 Not implemented (confirmed absent from runtime code)
## 3. Portfolio-Context Status
## 4. Environment Variables
### 4.1 Product code (`src/`)
### 4.2 Scripts / diagnostics
### 4.3 Test gates
### 4.4 Declared but never read by code (dead entries)
### 4.5 Test-time only
## 5. Authoritative Files
### 5.1 Specification / governance (stable — do not edit during buildout)
### 5.2 Runtime authority map (single source of truth per concern)
### 5.3 Non-authoritative
## 6. Open Items Blocking a Fully Green Baseline
## 7. PRE24 Baseline Verification (2026-09-20)
### 7.1 Deployment-related configuration
### 7.2 External providers (runtime code)
### 7.3 Final integration list (what truly exists today)
### 7.4 Portfolio-context status
## 8. PRE24-01 Implementation Record (2026-09-20)
### 8.1 What already existed (reused, not rebuilt)
### 8.2 What PRE24-01 added
### 8.3 Verification after PRE24-01
### 8.4 Untouched-surface guarantee
## 9. PRE24-01 Audit Record (2026-09-20) — PASS
## 10. PRE24-02 Implementation Record (2026-09-20)
### 10.1 Documented interface (verified, not guessed)
### 10.2 What changed
### 10.3 Live verification result
### 10.4 Untouched-surface guarantee
## 11. PRE24-02 Audit Record (2026-09-20) — PASS
## 12. PRE24-03 Bitget Signal Provider (2026-09-20) — COMPLETE
## 13. PRE24-03 Audit Record (2026-09-20) — PASS
## 14. PRE24-04 Evidence-Layer Source Arbitration (2026-09-20) — COMPLETE
## 15. PRE24-04 Audit Record (2026-09-20) — PASS
## 16. PRE24-05 Chainbase AgentKey (2026-09-20) — COMPLETE
## 17. PRE24-05 Audit Record (2026-09-20) — PASS
## 18. PRE24-06 Agent Hub Read-Only Handoff (2026-09-20) — COMPLETE
## 19. PRE24-06 Audit Record (2026-09-20) — PASS
### 9.1 Contributor condition for merge
## 20. PRE24-07 — Bitget Agentic Account Handoff (2026-09-20)
## 21. PRE24-07 Audit Record (2026-09-20) — PASS
### `_delete-me/README.md`
### `_delete-me/llm-as-partner-workflow.md`
# Skill: LLM-as-Partner Design Workflow
## What problem it solves
## The posture shift
## The 7-step workflow
### 1. Lock brand DNA first
### 2. Get visuals before building
### 3. Bring a rejection list, not a request list
### 4. Bring references, not prompts
### 5. Review like a creative director
### 6. Write the copy yourself
### 7. Keep a system
## The unexpected benefit
## The warning
## Appendix — Chief Brand Designer prompt
### `_delete-me/editorial-landing-page.md`
# Skill: Editorial Landing Page System
## What problem it solves
## When to use
## Bootstrap prompt (paste into any new chat)
## Core color slots (fill per project)
## Critical gotchas
### Stroke text — MUST be inline style
### Glow hover — MUST be React component
### Satori (next/og) limitations
### Resend lazy init (critical)
### Video — iOS autoplay
### Git — strip AI co-author trailers
# verify:
## Button law
## Section eyebrow pattern (used everywhere)
## Phone video frame
## Reference sites
## Reference: full playbook
### `_delete-me/REVISED_IMPLEMENTATION_PLAN.md`
# Bitget AI RedTeam Desk — Identity Implementation Plan (Revised)
## Executive Summary
## 📊 Codebase Audit Results
## 🗺️ Revised Phase Flow (Graphical)
## 🔧 Detailed Phase Breakdown
### Phase 0: Discovery & Planning ✅ (Completed)
### Phase 1: Token Foundation
### Phase 2: CSS Variable Injection (Safe)
### Phase 3: Component Refactor
### Phase 4: Animation & Micro-interactions
### Phase 5: Automated Testing (Parallel Track)
### Phase 6: Metadata & SEO (Semantic Checks)
### Phase 7: Manual Smoke Tests + Lighthouse
### Phase 8: PWA Infrastructure (Deferred)
### Phase 9: Rollback Strategy
## 🚦 Success Metrics
## 📅 Estimated Timeline
## ⚠️ Risk Mitigation
## 🎯 Next Immediate Actions
### `_delete-me/IMPLEMENTATION_PROMPT_BOOK.md`
# Bitget AI RedTeam Desk — Complete Implementation Prompt Book
## Phase 0: Mobile-First PWA Foundation & Verdict UI Setup
### Prompt 0.1 — PWA Manifest & Service Worker Configuration
### Audit Prompt 0.1 — PWA Foundation Verification
### Prompt 0.2 — Mobile-First Viewport & Responsive Meta Tags
### Audit Prompt 0.2 — Mobile Meta Tags Verification
### Prompt 0.3 — Verdict UI State Management Setup
### Audit Prompt 0.3 — Verdict State Verification
## Phase 1: Project Discovery & Context Gathering
### Prompt 1.1 — Repository Structure Analysis
### Audit Prompt 1.1 — Structure Verification
## Phase 2: Static Assets Installation
### Prompt 2.1 — Copy Brand Assets to Public Directory
### Audit Prompt 2.1 — Asset Integrity Check
## Phase 3: Brand Tokens Configuration
### Prompt 3.1 — Replace branding.ts
### Audit Prompt 3.1 — Brand Tokens Validation
## Phase 4: Design Tokens in CSS
### Prompt 4.1 — Update globals.css
### Audit Prompt 4.1 — CSS Tokens Verification
## Phase 5: Metadata & Layout Updates
### Prompt 5.1 — Update layout.tsx
### Audit Prompt 5.1 — Metadata Integrity Check
## Phase 6: Brand Components Creation
### Prompt 6.1 — Create mark.ts Geometry Engine
### Audit Prompt 6.1 — Geometry Engine Validation
### Prompt 6.2 — Create Logo.tsx Components
### Audit Prompt 6.2 — Logo Components Verification
### Prompt 6.3 — Create VerdictGlyph.tsx Components
### Audit Prompt 6.3 — Verdict Components Validation
## Phase 7: Component Wiring
### Prompt 7.1 — Wire Lockup into WorkspaceHeader
### Audit Prompt 7.1 — WorkspaceHeader Integration Check
### Prompt 7.2 — Wire VerdictBadge into DecisionArtifactView
### Audit Prompt 7.2 — DecisionArtifactView Integration Check
### Prompt 7.3 — Optional: Animate Mark in AnalysisProgressView
### Audit Prompt 7.3 — Animation Implementation Check
## Phase 8: README & Documentation Updates
### Prompt 8.1 — Update README.md with Banner
### Audit Prompt 8.1 — README Verification
## Phase 9: Full Build & Type Check
### Prompt 9.1 — Run Complete Type Check
### Audit Prompt 9.1 — Type Check Certification
### Prompt 9.2 — Run Linter
### Audit Prompt 9.2 — Lint Certification
### Prompt 9.3 — Run Production Build
### Audit Prompt 9.3 — Build Certification
## Phase 10: Runtime Verification
### Prompt 10.1 — Start Dev Server & Smoke Test
### Audit Prompt 10.1 — Visual Regression Check
### Prompt 10.2 — Accessibility Audit
### Audit Prompt 10.2 — Accessibility Certification
## Phase 11: Performance & PWA Verification
### Prompt 11.1 — Performance Audit
### Audit Prompt 11.1 — Performance Certification
### Prompt 11.2 — PWA Installability Check
### Audit Prompt 11.2 — PWA Certification
## Phase 12: Final Integration Report
### Prompt 12.1 — Generate Integration Summary
### Audit Prompt 12.1 — Final Verification
## Emergency Rollback Procedure
## Success Criteria Checklist
### `_delete-me/BitgetAI_RedTeamDesk_Identity/editorial-landing-page.md`
# Skill: Editorial Landing Page System
## What problem it solves
## When to use
## Bootstrap prompt (paste into any new chat)
## Core color slots (fill per project)
## Critical gotchas
### Stroke text — MUST be inline style
### Glow hover — MUST be React component
### Satori (next/og) limitations
### Resend lazy init (critical)
### Video — iOS autoplay
### Git — strip AI co-author trailers
# verify:
## Button law
## Section eyebrow pattern (used everywhere)
## Phone video frame
## Reference sites
## Reference: full playbook
### `_delete-me/BitgetAI_RedTeamDesk_Identity/00_START_HERE.md`
# Bitget AI RedTeam Desk — Brand Identity
## Open these first
## The idea in one paragraph
## Contents
## Notes on the artwork
## Two standing rules
### `_delete-me/BitgetAI_RedTeamDesk_Identity/IMPLEMENTATION_PROMPT_BOOK.md`
# Bitget AI RedTeam Desk — Complete Implementation Prompt Book
## Phase 0: Mobile-First PWA Foundation & Verdict UI Setup
### Prompt 0.1 — PWA Manifest & Service Worker Configuration
### Audit Prompt 0.1 — PWA Foundation Verification
### Prompt 0.2 — Mobile-First Viewport & Responsive Meta Tags
### Audit Prompt 0.2 — Mobile Meta Tags Verification
### Prompt 0.3 — Verdict UI State Management Setup
### Audit Prompt 0.3 — Verdict State Verification
## Phase 1: Project Discovery & Context Gathering
### Prompt 1.1 — Repository Structure Analysis
### Audit Prompt 1.1 — Structure Verification
## Phase 2: Static Assets Installation
### Prompt 2.1 — Copy Brand Assets to Public Directory
### Audit Prompt 2.1 — Asset Integrity Check
## Phase 3: Brand Tokens Configuration
### Prompt 3.1 — Replace branding.ts
### Audit Prompt 3.1 — Brand Tokens Validation
## Phase 4: Design Tokens in CSS
### Prompt 4.1 — Update globals.css
### Audit Prompt 4.1 — CSS Tokens Verification
## Phase 5: Metadata & Layout Updates
### Prompt 5.1 — Update layout.tsx
### Audit Prompt 5.1 — Metadata Integrity Check
## Phase 6: Brand Components Creation
### Prompt 6.1 — Create mark.ts Geometry Engine
### Audit Prompt 6.1 — Geometry Engine Validation
### Prompt 6.2 — Create Logo.tsx Components
### Audit Prompt 6.2 — Logo Components Verification
### Prompt 6.3 — Create VerdictGlyph.tsx Components
### Audit Prompt 6.3 — Verdict Components Validation
## Phase 7: Component Wiring
### Prompt 7.1 — Wire Lockup into WorkspaceHeader
### Audit Prompt 7.1 — WorkspaceHeader Integration Check
### Prompt 7.2 — Wire VerdictBadge into DecisionArtifactView
### Audit Prompt 7.2 — DecisionArtifactView Integration Check
### Prompt 7.3 — Optional: Animate Mark in AnalysisProgressView
### Audit Prompt 7.3 — Animation Implementation Check
## Phase 8: README & Documentation Updates
### Prompt 8.1 — Update README.md with Banner
### Audit Prompt 8.1 — README Verification
## Phase 9: Full Build & Type Check
### Prompt 9.1 — Run Complete Type Check
### Audit Prompt 9.1 — Type Check Certification
### Prompt 9.2 — Run Linter
### Audit Prompt 9.2 — Lint Certification
### Prompt 9.3 — Run Production Build
### Audit Prompt 9.3 — Build Certification
## Phase 10: Runtime Verification
### Prompt 10.1 — Start Dev Server & Smoke Test
### Audit Prompt 10.1 — Visual Regression Check
### Prompt 10.2 — Accessibility Audit
### Audit Prompt 10.2 — Accessibility Certification
## Phase 11: Performance & PWA Verification
### Prompt 11.1 — Performance Audit
### Audit Prompt 11.1 — Performance Certification
### Prompt 11.2 — PWA Installability Check
### Audit Prompt 11.2 — PWA Certification
## Phase 12: Final Integration Report
### Prompt 12.1 — Generate Integration Summary
### Audit Prompt 12.1 — Final Verification
## Emergency Rollback Procedure
## Success Criteria Checklist
### `_delete-me/BitgetAI_RedTeamDesk_Identity/REVISED_IMPLEMENTATION_PLAN.md`
# Bitget AI RedTeam Desk — Identity Implementation Plan (Revised)
## Executive Summary
## 📊 Codebase Audit Results
## 🗺️ Revised Phase Flow (Graphical)
## 🔧 Detailed Phase Breakdown
### Phase 0: Discovery & Planning ✅ (Completed)
### Phase 1: Token Foundation
### Phase 2: CSS Variable Injection (Safe)
### Phase 3: Component Refactor
### Phase 4: Animation & Micro-interactions
### Phase 5: Automated Testing (Parallel Track)
### Phase 6: Metadata & SEO (Semantic Checks)
### Phase 7: Manual Smoke Tests + Lighthouse
### Phase 8: PWA Infrastructure (Deferred)
### Phase 9: Rollback Strategy
## 🚦 Success Metrics
## 📅 Estimated Timeline
## ⚠️ Risk Mitigation
## 🎯 Next Immediate Actions
### `_delete-me/BitgetAI_RedTeamDesk_Identity/llm-as-partner-workflow.md`
# Skill: LLM-as-Partner Design Workflow
## What problem it solves
## The posture shift
## The 7-step workflow
### 1. Lock brand DNA first
### 2. Get visuals before building
### 3. Bring a rejection list, not a request list
### 4. Bring references, not prompts
### 5. Review like a creative director
### 6. Write the copy yourself
### 7. Keep a system
## The unexpected benefit
## The warning
## Appendix — Chief Brand Designer prompt
### `_delete-me/BitgetAI_RedTeamDesk_Identity/04_Product_Assets/INTEGRATION.md`
# Integration — dropping the identity into the repo
## 1. Static assets
## 2. Brand tokens
## 3. Design tokens in CSS
## 4. Metadata
## 5. Brand components **(new)**
### Where to wire it in
## 6. README
## 7. Submission and campaign surfaces
## 8. Verification
### `_delete-me/BitgetAI_RedTeamDesk_Identity/01_Brand_Guidelines/Design_Rationale.md`
# Bitget AI RedTeam Desk — Design Rationale
## 1. What the brief actually was
## 2. The central idea: the mark carries the metric
### Why this matters more than it first appears
## 3. Colour strategy: red is a verdict, not a decoration
## 4. Typography: the sans speaks, the mono computes
### One piece of proprietary type
## 5. The fault device, and the rule discovered by breaking it
## 6. Market positioning
## 7. Longevity
## 8. What was rejected along the way
### `docs/IDENTITY_INVENTORY.md`
# Bitget AI RedTeam Desk — Identity Asset Inventory
## 1. Complete File Listing (`find BitgetAI_RedTeamDesk_Identity -type f | sort`)
## 2. Text & Markdown Documentation Inventory
## 3. Image Assets Inventory
## WIRED ASSETS
### Verdict Scale (State 1..4, most-critical = state-1)
### Next.js App Router Metadata Icons
### Verified Checksums & Byte Counts of Wired Assets
### `docs/CONNECTIVITY_REPORT.md`
# External Connectivity Report
## Connectivity Results
## Analysis & Findings
### Bitget Public Spot Ticker
### Bitget Public Spot Instrument
### Bitget Public Market Candles (Kline)
### Bitget Reality Calendar
### Yahoo Finance Chart (Query1)
### Yahoo Finance Chart (Query2 Fallback)
### Yahoo Finance Search (News/Evidence)
### Bitget US Equity MCP Gateway
### Bitget Signal DataHub MCP Gateway
### `docs/REBRAND_MAP.md`
# Bitget AI RedTeam Desk — Rebrand Conversion Map
## Conversion Table
### `docs/ASSET_MIGRATION_LOG.md`
# Bitget AI RedTeam Desk — Asset Migration Log
## Verification of public/ directory contents:
### `docs/REPO_FACTS.md`
### `docs/SUBMISSION.md`
# Project Description & Submission Packet
## 1. Thesis / Core Hypothesis
## 2. Specific Target User
## 3. Validation Data / Key Metrics
## 4. Current Progress and What's Left
## 5. Deliverables List
## 6. Reflections on AI Trading
## 7. Role of the LLM
### `docs/VERDICT_GATING.md`
# Verdict Gating Audit & Current State Analysis
## 1. Where Each Value is Produced
### `thesisQuality`
### `positionQuality`
## 2. Whether It Is Currently LLM-Generated
## 3. Every Place Consumed
## 4. Current Thresholds and Decision Branches
### `docs/IDENTITY_TOKENS.md`
# Bitget AI RedTeam Desk — Identity Token Manifest
## TABLE 1 - COLOR
## TABLE 2 - TYPOGRAPHY
## TABLE 3 - SPACING / RADIUS / ELEVATION
## TABLE 4 - LOGO RULES
## GAPS
### `docs/GAP_MAP.md`
# Gap Map & Reconnaissance Audit: Bitget AI RedTeam Desk
## AVAILABLE SKILLS
### From `https://github.com/ThatHorseRep/skills`
### From `https://github.com/ThatHorseRep/ai-design-skills`
## 1. WORKING SURFACES
## 2. PARTIAL SURFACES
## 3. MISSING SURFACES
## 4. MISSING APPLICATION STATES
## 5. MISSING SYSTEM SURFACES
## 6. MOBILE INFORMATION ARCHITECTURE
## 7. GOLDEN PATH TRACE
## 8. DEPENDENCIES
## 9. DO NOT TOUCH
## 10. ORDERED PRIORITY
### A. Must work before any visual work
### B. Must exist before final polish
### C. Should exist if time permits
### D. Nice to have / defer
## 11. TIMELINE VERDICT
## 12. DOCUMENT RECONCILIATION
### `docs/GOLDEN_PATH.md`
# Bitget AI RedTeam Desk — Canonical Golden Path Demo Runbook
## 1. Canonical Demo Scenario & Verbatim Input
### Verbatim Copy-Pasteable Input
### Scenario Specification
## 2. Ordered Pipeline Stages
## 3. Expected Stage Outputs & Final Verdict
### Expected Final Verdict Band
### Wall-Clock Execution Time
## 4. End-to-End Verification Record
## VERIFIED RUN
### Run 1 (Executed 2026-09-21)
### Run 2 (Deterministic Repeat Verification)
### `docs/archive/MASTER_CONTEXT_BUILD_READINESS_AUDIT.md`
# MASTER CONTEXT & BUILD READINESS AUDIT
### Bitget AI RedTeam Desk — Bitget AI RedTeam Desk
## HOW TO READ THIS DOCUMENT
# PART 1 — RECONSTRUCT THE PROJECT
# PART 2 — HACKATHON ALIGNMENT AUDIT
# PART 3 — DOCUMENT CONSISTENCY AUDIT
# PART 4 — TECHNICAL REALITY CHECK
# PART 5 — PRODUCT DIFFERENTIATION TEST
# PART 6 — MVP VERTICAL SLICE TEST
# PART 7 — WHAT MUST BE REAL VS MOCKED
# PART 8 — TECHNICAL RISK REGISTER
### P0 — Could kill the demo
### P1 — Could materially weaken the demo
### P2 — Can be deferred
# PART 9 — BUILD READINESS
# PART 10 — WHAT WE SHOULD NOT DO
# PART 11 — FINAL DECISION
## BUILD NOW
# PART 12 — FIRST IMPLEMENTATION MILESTONE
## CURRENT PROJECT STATE
## DECISIONS LOCKED
## DECISIONS OUTSTANDING
## RISKS
## BUILD / FIX / RETHINK
## NEXT SINGLE ACTION
### `docs/archive/Bitget_AI_Trading_Desk_Market_Survey_Product_Blueprint.md`
# Bitget AI Base Camp Hackathon S2 — Market Survey & Product Blueprint
## Executive thesis
## 0. Hackathon fit and strategic constraints
# 1. Anatomy of tokenized U.S. stocks and the 7×24 reality
## 1.1 What a tokenized equity actually is
## 1.2 The economic anchor: 1:1 backing plus a conversion/redemption mechanism
### xStocks
### Backed / bTokens and xStocks
### Ondo Stocks
## 1.3 How NAV arbitrage should work conceptually
# 2. The weekend and off-hours market
## 2.1 Friday 4:00 PM ET is not "the market stops"
## 2.2 The evidence says this is already happening
## 2.3 Where liquidity traps can form
### Regime A — Friday close
### Regime B — Friday night / Saturday
### Regime C — Sunday evening / Asian session
### Regime D — Monday pre-open
### Regime E — Monday open
# 3. Trader personas and real pain points
## Persona 1 — Crypto-native trader diversifying into tech equities
### Profile
### Core pain
## Persona 2 — Retail equity swing trader entering the 7×24 world
### Profile
### Core pain
# 4. The five highest-value pain points
## Pain Point 1 — Weekend Information Overhang
## Pain Point 2 — Sunday Night Anxiety / Information Compression
## Pain Point 3 — Cross-Asset Correlation Blindness
## Pain Point 4 — Sizing and Concentration Bias
## Pain Point 5 — Emotional/Reactive Trading
# 5. Why generic AI trading bots fail the serious-trader test
## 5.1 The market is already moving beyond simple chat
## 5.2 What traders actually distrust
### Failure mode A — stale or wrong state
### Failure mode B — source opacity
### Failure mode C — narrative bias
### Failure mode D — no portfolio context
### Failure mode E — no counterfactual
### Failure mode F — no execution reality
### Failure mode G — no memory of the trader
### Failure mode H — false precision
# 6. What would make an AI desk feel indispensable?
## Capability 1 — State reconstruction
## Capability 2 — Evidence graph
## Capability 3 — Thesis decomposition
## Capability 4 — Adversarial counter-thesis
## Capability 5 — Historical analogues
## Capability 6 — Scenario engine
## Capability 7 — Portfolio impact
## Capability 8 — Decision memo
# 7. Institutional stress testing translated for retail traders
## 7.1 What institutions actually do
## 7.2 The retail translation
### "What happens to me?"
# 8. The golden niche: 7×24 cross-market decision stress testing
# 9. Product architecture blueprint
## 9.1 Core modules
### A. LUI / Conversation layer
### B. Market State Engine
### C. Evidence & News Engine
### D. Thesis Engine
### E. Historical Analogue Engine
### F. Stress Engine
### G. Portfolio Lens
### H. Adversarial Reviewer
### I. Decision Memo
# 10. Bitget integration strategy
# 11. Competitive teardown
## ChatGPT / general-purpose LLMs
### Strengths
### Weaknesses for a serious trading workflow
## FinChat
## Koyfin
## Bloomberg Terminal / ASKB
## Perplexity Research
## TradeGPT
# 12. Product differentiation: the "institutional risk officer" test
### 1. Evidence before narrative
### 2. Portfolio before prediction
### 3. Counter-thesis before confirmation
### 4. Scenario before confidence
### 5. Decision before essay
# 13. Proposed information architecture for the UI
## Workspace header
## Main conversation
## Evidence rail
## Thesis panel
## Stress panel
## Portfolio panel
## Decision panel
# 14. The "killer demo" scenario
## Scenario
## 0:00–0:15 — Understand the decision
## 0:15–0:35 — Reconstruct the live state
## 0:35–0:55 — Decompose the thesis
## 0:55–1:20 — Attack the trade
### Scenario A
### Scenario B
### Scenario C
### Scenario D
## 1:20–1:40 — Find the hidden problem
## 1:40–1:55 — Actionable decision
## 1:55–2:00 — Define what changes the decision
# 15. Metrics and validation plan
## Primary metric — Decision Quality / Task Completion
## Product targets
## Research quality benchmark
# 16. Product roadmap
## MVP — required for hackathon
### Must ship
## V1 — after hackathon
## V2 — serious product
# 17. Product language / positioning
## Avoid
## Prefer
### Positioning statement
### Expanded
### Core promise
### 7×24-specific promise
### Product philosophy
# 18. Exact six-part Bitget Google Form Project Description blueprint
## 1 · Thesis
## 2 · Target user and product value
## 3 · Validation data and key metrics
## 4 · Progress
## 5 · Deliverables
## 6 · Your take on AI Trading
# 19. Recommended product thesis
# 20. What we should build first
# 21. Research conclusions and product implications
# 22. Sources
# 23. Evidence discipline and limitations
# 24. Bottom line
### `docs/archive/trader_market_research_dossier.md`
# MARKET RESEARCH DOSSIER: THE 7×24 TOKENIZED EQUITY REVOLUTION & TRADER PAIN POINTS
## EXECUTIVE SUMMARY & STRATEGIC POSITIONING
### The Structural Market Inflection
### The Problem: Humans Sleep, Markets Don't, and Retail Traders Get Crushed
### The Product Opportunity: "Bitget AI RedTeam Desk" / The 24/7 Off-Hours Risk Terminal
## CHAPTER 1: THE ANATOMY OF TOKENIZED US STOCKS (rTokens) & 7×24 MECHANICS
### 1.1 How rTokens Actually Work
### 1.2 The 65.5-Hour Weekend Window
### 1.3 Off-Hours Liquidity Mechanics & Failure Modes
## CHAPTER 2: TRADER PERSONAS & DEEP BEHAVIORAL PAIN POINTS
### 2.1 Target User Personas
### 2.2 The 6 Everyday Trader Pain Points
#### Pain Point 1: "Sunday Night Gap Anxiety" (Weekend Macro Overhang)
#### Pain Point 2: Cross-Asset "Correlation Blindness" (The False Diversification Trap)
#### Pain Point 3: Invalidation Line Ambiguity (The "Moving Goalposts" Syndrome)
#### Pain Point 4: Sizing & Concentration Ignorance
#### Pain Point 5: The Inability to Hedge When Markets Are Closed
#### Pain Point 6: Information Overload & Echo Chamber Fatigue
## CHAPTER 3: COMPETITIVE TEARDOWN — WHY TRADERS HATE "AI TRADING BOTS"
### 3.1 The Competitive Landscape
### 3.2 The Fundamental Flaws of Existing AI Trading Tools
### 3.3 What Institutional Desks Do That Retail Needs
## CHAPTER 4: PRODUCT ARCHITECTURE — "Bitget AI RedTeam Desk"
### 4.1 Product Identity & Core Thesis
### 4.2 The 4 Core Interactive Modules
#### Module 1: The Adversarial Thesis & Invalidation Card
#### Module 2: The 65.5h Weekend Overhang & Implied Gap Estimator
#### Module 3: Cross-Asset Correlation & Portfolio Heat Map
#### Module 4: The 24/7 Weekend Hedge Calculator
## CHAPTER 5: BITGET AGENT HUB & QWEN TECHNICAL INTEGRATION
### 5.1 Leveraging Bitget's Built-In Tools
## CHAPTER 6: BITGET HACKATHON S2 SUBMISSION FORM BLUEPRINT
### PART 1: THESIS & CORE HYPOTHESIS (Highest Judge Weight)
### PART 2: TARGET USER & PRODUCT VALUE
### PART 3: VALIDATION DATA & KEY METRICS
### PART 4: PROGRESS & IMPLEMENTATION DETAILS
### PART 5: DELIVERABLES
### PART 6: PERSPECTIVE ON AI TRADING & THE AGENTIC ERA
## CHAPTER 7: THE 2-MINUTE KILLER DEMO SCENARIO SCRIPT
## CHAPTER 8: EXECUTION TIMELINE & CHECKLIST (SEPT 10 – SEPT 21)
### `docs/archive/AI_Trading_Desk_Market_Survey_Blueprint.md`
# Market Survey & Product Blueprint
## AI Trading Desk — Bitget AI Base Camp Hackathon S2
## Executive Summary
## 1. The Anatomy of Tokenized US Stocks (rTokens) & the 7×24 Market Reality
### 1.1 How the wrapper actually works
### 1.2 What actually happens Friday 4pm EST → Monday 9:30am EST
### 1.3 Where the sharpest dislocations and liquidity traps concentrate
## 2. Real Trader Pain Points & Behavioral Failure Modes
### 2.1 Target personas
### 2.2 Five documented pain points
### 2.3 Why risk management specifically fails in 24/7 markets
## 3. The Failure of "Generic AI Trading Bots" & Competitive Teardown
### 3.1 Why serious traders dismiss most "AI trading" products
### 3.2 Competitive teardown
### 3.3 What would make an AI tool feel like an institutional risk officer instead of a search bar
## 4. "Decision Stress Testing" & the Research Workbench Golden Niche
### 4.1 How institutional desks actually do this
### 4.2 Translating this to a retail-accessible workbench
## 5. Product Copy & Positioning Blueprint
### 5.1 Working product name & one-line thesis
### 5.2 Six-part Google Form Project Description (draft)
### 5.3 The "Killer Demo Scenario" — 2-minute walkthrough
### 5.4 Positioning line for judges (ties the whole dossier together)
## Sources Consulted
### `docs/archive/AI Trading Desk Research Plan.md`
# **Strategic Blueprint for an AI-Driven Tokenized Equity Trading Desk**
## **Executive Summary**
## **Current Product Thesis**
## **Key Research Findings**
## **Tokenized Equity Market Structure**
### **Legal and Custodial Frameworks**
### **Market Mechanics: Arbitrage and Settlement**
## **24/7 / Off-Hours Market Analysis**
### **The Mechanics of Weekend Price Discovery**
## **Trader Personas**
## **Trader Pain Points & The User Journey**
## **AI Trading Bot Failure Modes**
### **The AIEQ Case Study**
### **The Core Distinction**
## **Competitive Landscape**
## **White-Space Analysis**
## **Decision Stress Testing Research**
### **Institutional Risk Metrics Adapted for Retail**
## **Thesis Interrogation**
## **Review & Self-Evolution**
## **Data Infrastructure**
## **Bitget Ecosystem & Hackathon Fit**
### **Leveraging Bitget Infrastructure**
## **AI/Agent Architecture**
### **The MCP Advantage**
## **Implementation Feasibility**
### **Development Tiers**
### **What NOT to Build**
## **Security & Reliability**
## **Regulatory & Legal Constraints**
## **Demo Strategy**
## **Benchmark & Validation Framework**
## **Product Opportunities Ranked**
## **Final Strategic Recommendation**
#### **Works cited**
### `docs/archive/Technical_Definition_Vertical_Slice.md`
# Technical Definition — Vertical Slice
## Purpose
# 1. Reference Vertical Slice
# 2. Technical Responsibility Map
## Responsibility categories
### Must be deterministic
### AI-assisted
### External data
# 3. Minimum Data Requirements
## Data rule
# 4. Bitget Integration
## 4.1 Required Bitget integration
### Public market data
### Why this is required
## 4.2 Optional Bitget integration
### Account/position read
### Decision
## 4.3 Do not integrate for MVP
## 4.4 Bitget AI capabilities
# 5. Minimum Market / Reference-Price Model
## Market status
## Liquidity
## Cross-asset state
# 6. Trade Object
## Field ownership
### User supplied
### Inferred
### System derived
# 7. Market State Object
# 8. Thesis Object
# 9. Stress Scenario Engine
## Scenario 1 — Market Risk
### Assumption
### Required inputs
### Calculation
### Output
### Interpretation
### Applicability
## Scenario 2 — Crypto Contagion
### Assumption
### Required inputs
### Calculation
### Output
### Applicability
## Scenario 3 — Token Microstructure
### Assumption
### Required inputs
### Calculation
### Output
### Applicability
## Scenario 4 — Combined Shock
### Assumption
### Required inputs
### Calculation
### Output
### Applicability
## Scenario 5 — Thesis Failure
# 10. Thesis vs Position
## Thesis Quality
### Inputs
### Evaluation
## Position Quality
### Inputs
### Evaluation
### Combination rule
# 11. Decision Synthesis
## Possible decisions
## Decision inputs
## Decision policy
### Reject / block
### Wait
### Reduce
### Proceed
## Final explanation
# 12. Decision Artifact Model
## Verdict
## Decisive reasons
## Challenge
## Evidence
## Change conditions
## Limitations
# 13. Provenance Model
## Minimum provenance fields
## Provenance rule
# 14. LLM Responsibilities
## Allowed
## Must not
## Structured output requirement
# 15. Deterministic Responsibilities
### Trade calculations
### Market calculations
### Stress calculations
### Decision calculations
# 16. State Machine
## EMPTY
## INPUT
## CLARIFICATION
## NORMALIZED
## ANALYSING
## PARTIAL
## DECISION_READY
## ERROR
# 17. Persistence
## MVP decision
## What exists transiently
## What is not persisted
## Why
# 18. Mock vs Real
## Mocking rule
# 19. Minimum Technical Stack
## 19.1 Frontend + application shell
### Why
### Simpler alternative
## 19.2 Validation / schemas
### Why
### Simpler alternative
### Decision
## 19.3 LLM access
### Why
### Simpler alternative
### Decision
## 19.4 Data access
## 19.5 Deterministic calculations
### Why
## 19.6 Persistence
## 19.7 Deployment
# 20. Conceptual System Diagram
## Architectural rule
# 21. Vertical Slice Build Order
## 1. Contract foundation
## 2. Deterministic core
## 3. Trade input + normalization
## 4. Real Bitget market state
## 5. Reference market state
## 6. Evidence retrieval
## 7. Thesis extraction
## 8. Thesis challenge
## 9. Stress engine integration
## 10. Thesis vs Position
## 11. Decision synthesis
## 12. Decision Artifact
## 13. Provenance + limitations
## 14. Failure handling
## 15. Experience polish
## Milestone rule
# 22. Technical MVP Boundary
## MUST BUILD
## CAN MOCK
## SUPPORTING
## CUT
# 23. Technical North Star
### `docs/archive/Technical_Integration_Reconnaissance.md`
# Technical Integration Reconnaissance
## Executive conclusion
# 1. Repository Inspection
## Current repository state
# 2. Reference Vertical Slice
# 3. Technical Responsibility Map
## Responsibility rules
### Must be deterministic
### AI-assisted
### External data
# 4. Bitget Market Data Path
## 4.1 rNVDA symbol
## 4.2 Instrument discovery
## 4.3 rNVDA ticker
## 4.4 BTC ticker
## 4.5 Liquidity data
## 4.6 Bitget instrument/reference relationship
# 5. Live Bitget Request Verification
### Representative documented ticker shape
# 6. Reference NVDA Data
## Recommended primary source: Yahoo Finance quote/chart data
### Required reference fields
### Why this source
### Important limitation
### Fallback
### MVP rule
# 7. US Market Session Status
## Recommended MVP method
## Required state
## Why not simply trust a text field from an AI or news source
# 8. Fresh Evidence
## Recommended source: GDELT DOC 2.0
## Minimum retrieval behavior
## Important evidence rule
## Why not a paid news API
# 9. LLM Provider
## Repository finding
## Recommended MVP pattern
## Current practical provider
### Technical recommendation
### Structured output rule
# 10. Deterministic Core Configuration
## 10.1 Liquidity configuration
## 10.2 Stress-scenario assumptions
## 10.3 Decision policy configuration
### REJECT
### WAIT
### REDUCE
### PROCEED
## Important implementation rule
# 11. Trade Object
### Ownership
# 12. Market State Object
# 13. Thesis Object
# 14. Stress Scenario Engine
## Scenario 1 — Market Risk
## Scenario 2 — Crypto Contagion
## Scenario 3 — Token Microstructure
## Scenario 4 — Combined Shock
## Optional Scenario 5 — Thesis Failure
# 15. Thesis vs Position
## Thesis Quality
## Position Quality
# 16. Decision Synthesis
# 17. Decision Artifact Contract
# 18. Provenance Model
# 19. LLM Boundary
## Allowed
## Forbidden
# 20. Persistence
# 21. Technical Risks
## P0 — Can block the demo
### P0.1 Live Bitget connectivity from the actual runtime
### P0.2 Reference NVDA programmatic source stability
### P0.3 Real off-hours rNVDA scenario availability
## P1 — Can materially weaken the demo
### P1.1 Fresh evidence quality
### P1.2 Provider/schema failure
### P1.3 False liquidity confidence
### P1.4 Decision-policy calibration
## P2 — Can be deferred
# 22. Mock vs Real
### Final demo requirement
# 23. Minimum Technical Shape
# 24. Exact Recommended Implementation Path
### Step 1 — Create the application shell
### Step 2 — Establish runtime schemas
### Step 3 — Prove deterministic calculations in isolation
### Step 4 — Prove live Bitget connectivity
### Step 5 — Prove NVDA reference state
### Step 6 — Prove session state
### Step 7 — Prove evidence retrieval
### Step 8 — Add LLM trade/thesis parsing
### Step 9 — Add grounded challenge
### Step 10 — Connect stress engine
### Step 11 — Add thesis-vs-position assessment
### Step 12 — Add deterministic decision policy
### Step 13 — Add LLM explanation
### Step 14 — Assemble the Decision Artifact
### Step 15 — Run the exact rNVDA reference scenario
# 25. APPROVED
# 26. NEEDS DECISION
### 26.1 Exact NVDA reference provider
### 26.2 Exact LLM model ID
### 26.3 Initial scenario configuration values
### 26.4 Demo off-hours condition
# 27. BLOCKERS
# 28. RECOMMENDED IMPLEMENTATION PATH
# 29. DO NOT BUILD
# 30. Final Technical Verdict

## 8. Planned / Incomplete Signals

### `B03_Experience_Architecture.md`
- Line 277: `The wording may be refined later, but the stages should describe real product operations rather than generic AI activity.`
- Line 749: `### Missing portfolio context (Future)`
- Line 751: `**Experience:** Portfolio impact is deferred to a future phase.`
### `B04_Information_Architecture_and_Screen_Specification.md`
- Line 35: `- a settings area unless later required for basic product operation;`
- Line 58: `S01–S08 are not necessarily separate routes. They are the meaningful states of the same primary workspace unless implementation later demonstrates a strong reason to separate them physically.`
- Line 516: `**Preferred model:** Inline source/timestamp metadata with an expandable detail treatment. A drawer or panel may be used later if required by the final visual interaction, but no separate research route is necessary.`
- Line 695: `### Conditional future addition`
- Line 696: `A small recent-analysis list may be added later if usability testing shows users need to return to prior decisions, but it should not become a primary navigation surface in the hackathon MVP.`
- Line 864: `- Optional paper-trading handoff surface only if later product decisions keep it within scope.`
### `B02_MVP_Product_Mechanics.md`
- Line 26: `- **Entry price** — if different from the current market price or if the user has a specific planned entry.`
- Line 59: `The user's natural-language proposal is converted into a canonical **Normalized Trade**. This is an internal product object that gives every later stage the same starting point.`
- Line 461: `## 8. PORTFOLIO CONTEXT (FUTURE)`
- Line 463: `Portfolio context is **deferred to a future release**.`
- Line 663: `**Interactive:** Scenario assumptions may be inspectable; the product may allow a bounded assumption adjustment later without changing the underlying decision model.`
- Line 763: `### 12.8 Missing portfolio context (Future)`
- Line 767: `**Behavior:** Portfolio context is deferred to a future phase.`
### `B07_Optional_Bitget_Ecosystem_Integrations.md`
- Line 107: `- **Relationship to the hackathon track:** the desk targets **Track 3 (AI Trading Desk, Decision Stress Testing)** on its own merits. Track 3 does not require Playbook, and this project makes no such claim. Playbook/GetAgent are potential future distribution surfaces for the handoff documents produced in §4.4–4.6, nothing more.`
- Line 120: `The rule for future work: **core first, enrichment second.** A new integration may add evidence, limitations, and handoff surfaces — it may never become a prerequisite for a verdict, a hidden dependency of the core modules, or a source the engine trusts above deterministic calculations.`
### `B01_Product_Foundation.md`
- Line 62: `- accurate prediction of future prices;`
- Line 88: `The product should reason about explicit possible conditions rather than pretending to know the future.`
- Line 208: `### Stage 6 — Check Portfolio Impact (FUTURE)`
- Line 210: `**Purpose:** (Deferred to future) Determine whether the proposed trade changes the user's existing risk in a material way.`
- Line 381: `- promises that monitoring will guarantee a correct future decision.`
- Line 436: `### FUTURE / CONDITIONAL`
- Line 438: `These capabilities may be considered later, but they are not part of the MVP promise:`
- Line 451: `**Price prediction:** Not an MVP capability. Future scenarios may describe possible outcomes, but the product does not claim to know future prices or attach unsupported probabilities to them.`
- Line 455: `**Portfolio management:** Deferred to future versions. The MVP does not attempt to manage or optimize the portfolio.`
- Line 457: `**Synthetic hedging:** Removed from MVP core. Future versions may explore hedge candidates as optional scenario analysis only after methodology and trust are sufficiently validated.`
- Line 533: `The product must not manufacture precision to make the analysis appear more sophisticated. In particular, it should not invent probabilities, exact future prices, precise hedge ratios, or institutional-style risk scores unless the underlying methodology and inputs justify them.`
### `test-resilience.js`
- Line 6: `console.log("Not implemented yet");`
### `PRODUCT_DESCRIPTION.md`
- Line 28: `- Playbook/GetAgent: no integration is implemented; they are potential future distribution surfaces for the handoff documents (Track 3 does not require Playbook).`
### `README.md`
- Line 55: `- **Portfolio Context/Impact:** Marked as FUTURE/DEFERRED in documentation (not implemented in MVP).`
### `PRE24_BASELINE.md`
- Line 66: `### 2.3 Not implemented (confirmed absent from runtime code)`
- Line 78: `**Deferred / not implemented.** Verified points:`
- Line 87: `Conclusion: matches B02 §8 ("Portfolio context — deferred to a future release"); the only portfolio signal is user-declared exposure text.`
- Line 229: `Unchanged from §3: **deferred / not implemented**. Type-level `ExistingExposure` and parser-level user-declared exposure only; no concentration, overlap, correlation, or portfolio-impact calculation anywhere in `src/`.`
- Line 248: `1. **`src/adapters/research/defaultRegistry.ts`** — the explicit composition root (`createDefaultResearchRegistry`) with four documented slots: legacy evidence provider, Bitget US Equity MCP, Bitget Signal bridge, and a **reserved Chainbase AgentKey slot** (type-level seam only — no stub implementation, nothing fake registered). Supports full override via `providers: []` for tests and granular seams (endpoint, bridge path, evidence provider).`
- Line 371: `**Runtime proof (real call):** audit probes to `datahub.noxiaohao.com/mcp`: `macro_indicators` 21.0 s → `{"error":""}`; `network_status` 15.8 s → `{"url":…,"error":""}`; `social_trending` 30.4 s → `{"provider":"all_failed","items":[]}`; `derivatives_sentiment` 15.7 s → `{"error":""}` — all real protocol responses, all correctly skipped by the hardened upstream-failure detector (new test covers every live shape). Provenance through the real workflow proven with a Signal-slot stub: evidence `provi`
### `tests/llmClient.test.cjs`
- Line 10: `// These tests stub global.fetch so nothing leaves the machine.`
### `tests/arbitrationAudit.test.cjs`
- Line 93: `providerId: "stub-audit",`
### `tests/arbitrator.test.cjs`
- Line 365: `providerId: "stub-evil",`
### `tests/researchProviders.test.cjs`
- Line 70: `providerId: "stub",`
- Line 71: `source: "Stub Source",`
- Line 72: `title: "Stub observation",`
- Line 73: `summary: "Stub summary for PRE24-01 tests",`
- Line 184: `registry.register(makeProvider('stub-provider', {`
- Line 187: `providerId: 'stub-provider',`
- Line 188: `url: 'https://example.com/stub',`
- Line 198: `assert.ok(ev, 'stub observation must flow through to evidence');`
- Line 199: `assert.equal(ev.providerId, 'stub-provider');`
- Line 200: `assert.equal(ev.source, 'Stub Source');`
- Line 201: `assert.equal(ev.url, 'https://example.com/stub');`
### `src/adapters/evidence/provider.ts`
- Line 26: `summary: "Major cloud providers (Microsoft, Alphabet, Meta) reiterated planned capital expenditure increases for AI data center infrastructure through 2026.",`
### `src/adapters/research/chainbaseAgentKeyBridge.ts`
- Line 34: `* stores credentials. (In a future server-side integration, keys would be`
### `src/adapters/research/defaultRegistry.ts`
- Line 91: `* reserved Chainbase slot so future providers plug in without core changes.`
### `src/components/workspace/ClarificationModal.tsx`
- Line 103: `placeholder={fieldName.toLowerCase().includes("size") ? "For example, $2,000" : "For example, long"}`
- Line 104: `className="w-full border border-[var(--rt-border-subtle)] bg-white px-4 py-2.5 text-base text-[var(--rt-text-primary)] placeholder:text-[var(--rt-text-muted)] focus-visible:border-[var(--rt-text-primary)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"`
### `src/components/workspace/TradeInputSurface.tsx`
- Line 83: `placeholder="Describe what you plan to buy or sell and why..."`
- Line 84: `className="w-full border border-[var(--rt-border-subtle)] bg-white p-4 text-base text-[var(--rt-text-primary)] placeholder:text-[var(--rt-text-muted)] focus-visible:border-[var(--rt-text-primary)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--rt-text-muted)] focus-visible:ring-offset-2 motion-safe:transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] resize-y [text-wrap:pretty]"`
### `src/lib/rateLimit.ts`
- Line 47: `limitations: ["Rate limit exceeded. Please try again later."],`
### `src/services/decisionDeskService.ts`
- Line 74: `// bridge, and a reserved Chainbase AgentKey slot (not implemented yet).`
### `_delete-me/REVISED_IMPLEMENTATION_PLAN.md`
- Line 253: `- [ ] Dark mode readiness (future-proof)`
### `_delete-me/IMPLEMENTATION_PROMPT_BOOK.md`
- Line 241: `3. title.template includes %s placeholder and BRANDING.SHORT_NAME`
### `_delete-me/BitgetAI_RedTeamDesk_Identity/IMPLEMENTATION_PROMPT_BOOK.md`
- Line 241: `3. title.template includes %s placeholder and BRANDING.SHORT_NAME`
### `_delete-me/BitgetAI_RedTeamDesk_Identity/REVISED_IMPLEMENTATION_PLAN.md`
- Line 253: `- [ ] Dark mode readiness (future-proof)`
### `_delete-me/BitgetAI_RedTeamDesk_Identity/04_Product_Assets/INTEGRATION.md`
- Line 48: ``evaluateDecision()` in `src/core/decision/policy.ts`. If you later add a fifth verdict,`
- Line 157: `rather than Tailwind classes so they cannot be broken by a future Tailwind config`
### `_delete-me/BitgetAI_RedTeamDesk_Identity/04_Product_Assets/src/config/branding.ts`
- Line 4: `* Replaces the previous one-line PRODUCT_NAME stub. Everything the UI needs to`
### `docs/REBRAND_MAP.md`
- Line 20: `| `text-zinc-400` | 7 | `text-[var(--rt-text-muted)]` | Light captions and placeholder indicators (`#54697E`). |`
### `docs/IDENTITY_TOKENS.md`
- Line 92: `5. **Skeleton Placeholder Color**:`
### `docs/GAP_MAP.md`
- Line 221: `| **Editorial Landing Surface** | first-use/empty | NO | Missing surface (not implemented) |`
- Line 411: `- *Conflict*: Directly conflicts with brand guidelines. The brand guidelines and B01–B07 win; this file remains staged in `_delete-me/` and is not implemented.`
### `docs/archive/MASTER_CONTEXT_BUILD_READINESS_AUDIT.md`
- Line 75: `| Historical analogues | **RESOLVED / OBSOLETE tension** | B01 lists it as "Future/Conditional"; B02 lists it as "SUPPORTING"; research-reconciliation-2 flags this exact inconsistency and resolves it: not core MVP, include only with a clearly defensible matching method. Treat as **settled: cut from MVP**, mention only as a stated non-goal in the submission form (helps address the sub-theme's "retrieve historical distribution" language honestly) |`
- Line 173: `4. **Under-use of Bitget's own free AI Skills** (`bitget-signal`) despite a judging rubric that explicitly names "Skill integration count and effectiveness." Currently zero Bitget Skills are planned; only raw market-data endpoints.`
### `docs/archive/Bitget_AI_Trading_Desk_Market_Survey_Product_Blueprint.md`
- Line 917: `Show what happens under different states rather than pretending to know one future.`
- Line 1454: `9. Backed, **"The Future is xStocks — Upgrading bTokens,"** 2026. https://backed.fi/news-updates/the-future-is-xstocks-upgrading-btokens`
### `docs/archive/trader_market_research_dossier.md`
- Line 324: `The future of trading will not belong to autonomous black-box bots that gamble human capital without oversight, nor will it belong to manual traders reading 500-page filings. The future belongs to symbiotic AI-Human Trading Desks: human traders provide market intuition, risk appetite, and final execution authority, while multi-agent AI systems serve as continuous perception engines, risk governors, and adversarial sparring partners. In a 7×24 financial world where tokenized equities never sleep,`
### `docs/archive/AI Trading Desk Research Plan.md`
- Line 112: `The research dictates a strict architectural mandate: **LLMs are exceptionally poor at predictive time-series forecasting and deterministic arithmetic, but they are exceptionally good at semantic reasoning, narrative synthesis, and identifying logical contradictions.** The product must never pretend to predict the future.`
- Line 139: `> 4. *Decision Journaling / Post-Trade Review* (High Future Expansion Potential).`
- Line 228: `* **Do not build predictive pricing models.** Avoid any architecture that attempts to forecast the future price of an asset.`
- Line 304: `> 5. Model Context Protocol (MCP), APIs, and the Future of Agentic AI, [https://computerfraudsecurity.com/index.php/journal/article/download/817/560/1577](https://computerfraudsecurity.com/index.php/journal/article/download/817/560/1577)`
### `docs/archive/Technical_Definition_Vertical_Slice.md`
- Line 57: `| Artifact | Render structured object | Assemble canonical output | Supply numeric results | Supply language fields | Supply source metadata | Supply Bitget observations | Optional later | Attach provenance to material claims |`
- Line 980: `A later product version may persist Decision Artifacts, but that is conditional on actual user demand.`
- Line 1001: `| Historical analogues | No | Yes | Supporting/future capability |`
### `docs/archive/Technical_Integration_Reconnaissance.md`
- Line 103: `| Thesis vs Position | Render | Combine results | Position/exposure metrics | Qualitative thesis assessment | — | Account data only if later enabled | — | Link judgments to inputs |`
- Line 1030: `| Historical analogues | No | Yes | Future/supporting |`

## 9. Repository Status

```text
Command 'git status --short' returned non-zero exit status 128.
```