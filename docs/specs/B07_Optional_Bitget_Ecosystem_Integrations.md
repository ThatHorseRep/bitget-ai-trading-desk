# B07: Optional Bitget Ecosystem Integrations

## 1. Purpose and Ground Rules

This document describes the optional integrations between the Bitget AI RedTeam Desk and the wider Bitget ecosystem (plus the Chainbase AgentKey external partnership). It exists so that developers, judges, and AI operators share one truthful account of **what is implemented in this repository**, **what is an external/agent-host step**, and **what remains optional**.

Status labels used throughout:

- **Implemented (in-app)** — real code in this repository, wired into the workflow, covered by tests.
- **Implemented as a handoff (external execution)** — the app produces a structured payload; the live external session is a developer-side step that this repository never performs.
- **External setup only** — no integration code exists; an external guide describes how a human connects it. Never described as "implemented".

Non-negotiable claims discipline:

- The core decision is defensible **with zero optional integrations enabled**. Integrations enrich evidence; they never replace, gate, or weaken the core.
- No optional capability is a hidden dependency. Absence of every external provider is a supported, first-class runtime state.
- Nothing in this product places orders, holds credentials, or acts autonomously. The desk is pre-trade decision support only.

## 2. The Composition Root

All optional research providers are assembled in exactly one place: `src/adapters/research/defaultRegistry.ts` (`createDefaultResearchRegistry`, PRE24-01). Four explicit slots:

| Slot | Provider | Status |
| --- | --- | --- |
| 1 | Legacy evidence provider (Yahoo-backed composite, adapted) | Implemented (in-app), live |
| 2 | Bitget US Equity MCP provider | Implemented (in-app) and live-verified 2026-09-21 via the `guide` + `do_query` catalog protocol — real NVDA quote/profile/earnings retrieved through the app's own adapter. Reachability from any given network is still environment-dependent (local DNS had to be bypassed with diagnostic DoH tooling). |
| 3 | Bitget Signal provider (programmatic) or AI-host file bridge (opt-in) | Implemented (in-app); upstream-dependent |
| 4 | Chainbase AgentKey bridge | Implemented as an AI-host handoff |

Every slot is optional at the type level: a caller may omit any provider and the registry simply contains fewer of them. Absent providers are not errors. `tests/expanded-vertical-slice.test.cjs` proves the full workflow produces a defensible core decision both with all integrations enabled (Run A) and with all optional integrations disabled (Run B).

## 3. Native vs External/Agent-Host Based

**Native (runs inside this app, no agent host required):**
- The deterministic decision core: scenario engine, decision policy, evidence arbitration (PRE24-04), decision artifact.
- The LLM layer (extraction, challenge, assessment) using the operator's own configured LLM endpoint.
- Market state from Bitget's public ticker API and reference-equity pricing (graceful degradation when unavailable).
- The Bitget US Equity MCP provider and the Bitget Signal programmatic provider (outbound HTTP from the app; read-only; no credentials).
- All handoff/payload builders: Agent Hub handoff, Agentic Account handoff document, paper-trading companion state.

**External / agent-host based (runs in the user's own AI host — Claude Code, Codex, OpenClaw, GetAgent Studio — never inside this app):**
- Any MCP launched as a local stdio process (`@bitget-ai/bitget-agent-mcp`, `bgc`). A serverless function cannot and must not host these.
- The five official Bitget Signal Skills (they execute in an AI host and write observation files that the opt-in bridge ingests).
- Chainbase AgentKey data retrieval (AgentKey is installed in the AI host; the app only writes a structured request file).
- OAuth for the Agentic Account (`authorize_start` runs in the official MCP inside the user's AI host).
- Any execution, including paper execution (the paper-trading harness drives the official MCP locally; the app itself never trades).

## 4. The Integrations

### 4.1 Bitget US Equity MCP (PRE24-02) — Implemented (in-app)

- **What it is:** Bitget's read-only US Stocks/ETF market-data MCP service (per the S2 handbook), reached programmatically by this app over Streamable HTTP at the documented endpoint (`agent.bitget.com/mcp`). No credentials required.
- **Implemented:** real MCP client with automatic tool discovery; discovered tools are keyword-classified into the six documented categories (quotes, fundamentals, corporate_actions, institutional_analyst, etf, news_sentiment); topic-based category dispatch; Zod `.passthrough()` validation; bounded timeouts (5 s connect / 8 s call); response caps (500-char summaries, 20 observations per category).
- **Asset gating:** only rToken-mapped US reference tickers are requested (rNVDA → NVDA). Plain crypto assets never reach this service.
- **Truthful caveat:** the integration is **live-verified as of 2026-09-21**: the endpoint answered, the MCP handshake succeeded, and the app's adapter returned five real NVDA observations (quote at 222.53, profile, earnings 2026-11-17, price history, balance statement) — but only after diagnostic DoH tooling bypassed a locally poisoned DNS resolver. Reachability is therefore **environment-dependent**: on networks where local DNS fails, the provider degrades to `UNAVAILABLE` / `[]` exactly as designed. The live catalog uses a `guide` + `do_query` protocol; the adapter supports it **and** the documented named-tools shape, with the catalog taking precedence when present.
- **Classification:** native outbound call, read-only, optional.

### 4.2 Bitget Signal (PRE24-03) — Implemented (in-app), upstream-dependent

- **What it is:** Bitget's Signal market-sentiment MCP service (`@bitget-ai/bitget-signal`), usable two ways:
  - **Programmatic (default):** the app calls the documented Streamable HTTP endpoint directly. Live-verified at integration time: `listTools()` returned 19 tools with all 14 documented names present. The Signal service's own upstream APIs were failing/slow at verification (15–32 s per call), so observation yield was zero under production bounds — degradation is by design and the provider stayed healthy.
  - **AI-host Skills (opt-in bridge):** the five official Skills (`macro-analyst`, `market-intel`, `news-briefing`, `sentiment-analyst`, `technical-analysis`) run inside an AI host and write observation files; `BitgetSignalAgentBridge` ingests them. Selected by passing `signalBridgePath` to the composition root.
- **Not claimed:** the web app does not run the Skills themselves; `technical-analysis` indicator math stays in the AI-host Skill.
- **Classification:** default path is native outbound; Skills path is external/agent-host. Read-only, optional, upstream-dependent.

### 4.3 Chainbase AgentKey (PRE24-05) — Implemented as a handoff (external)

- **Identity:** **Chainbase is an external partner, not a Bitget product.** The S2 handbook positions AgentKey as independent of Agent Hub, Playbook, the MCP Server, and the rest of the Bitget toolchain. This document and all provenance records preserve that distinction (observations are attributed `chainbase-agentkey/<capability>/<source>`).
- **Documented architecture:** `Your App → AI Agent → AgentKey → External Data Sources`. No programmatic server-side endpoint is documented for AgentKey, and none was invented. `ChainbaseAgentKeyBridge` writes a structured request file; an AI host with the AgentKey MCP installed retrieves data and writes validated structured observations back.
- **Use-case gate:** only tokenized-stock (rToken) multi-signal research triggers the handoff; plain crypto never produces a request. Capability routing covers the five documented families (market, on-chain, news, social, company).
- **Credentials:** none in this app. The AI host's AgentKey installation holds its own key; the server never sees or stores one.
- **Remaining (external setup):** claim AgentKey access, connect an AI host, and run a live handoff. The bridge is ready for that demo; until then this is a handoff implementation, not a live data source.
- **Classification:** external/agent-host based, read-only data retrieval, optional.

### 4.4 Agent Hub — read-only (PRE24-06) — Implemented as a handoff (external execution)

- **What it is:** Bitget's Agent Hub tooling (`@bitget-ai/bitget-agent-mcp` MCP server and the `bgc` CLI) are **local AI-host tools**; `--read-only` is the documented safe mode. No hosted/browser Agent Hub API is documented.
- **Implemented in this app:** a structured read-only handoff payload (`agentHubHandoff`) attached to every DECISION_READY workflow result — asset, artifact id, market state, thesis, challenge, stress results, product verdict, limitations — with `executionAllowed` typed as the literal `false`. The type system cannot express permission.
- **Implemented deliberately:** the app never launches a stdio MCP from a serverless function and never places orders.
- **To use (developer-side):** copy the payload into your own AI host running `@bitget-ai/bitget-agent-mcp --read-only` (or `bgc` read-only) and ask read-only research questions. No exchange credentials exist in this repo.
- **Classification:** payload native; session external/agent-host; read-only; optional.

### 4.5 Agentic Account (PRE24-07) — Implemented as a handoff (external authorization)

- **What it is:** Bitget's mechanism for connecting an agent to an account. Per the official connection guide, OAuth runs **only** via the official `@bitget-ai/bitget-agent-mcp`'s `authorize_start` tool inside the user's own AI host; credentials are written locally by that MCP — never environment variables, never user-pasted, never this repository.
- **Implemented in this app:** the `agenticHandoff` document on every DECISION_READY result, plus a seven-state connection state machine (UNAVAILABLE → AUTH_REQUIRED → AUTHORIZING → AUTHORIZED → HUMAN_CONFIRMATION_REQUIRED → READY_FOR_EXTERNAL_EXECUTION, with ERROR). There is **no state meaning "order placed"**. The document carries the embedded read-only research handoff and explicit "authorization is NOT execution" disclosures.
- **Human-side steps for a live flow:** install the official skill + MCP in the AI host, run `authorize_start`, finish OAuth in the browser, confirm via `get_auth_status`, then review the handoff and explicitly confirm any proposed action. Execution happens solely in the official Agentic session, never in this app.
- **Not done (deliberately):** no live authorization, no order, no credential of any kind.
- **Classification:** handoff native; authorization and any action external/agent-host; optional.

### 4.6 Paper Trading (PRE24-08, companion PRE24-10) — Implemented as an external harness

- **What it is:** a verification harness (`src/adapters/agenthub/paperTrading.ts`) that drives the official Agent Hub MCP in **paper-trading mode** against Bitget's Demo Trading environment — no real funds involved.
- **Safety rules enforced in code and tests:**
  - The launch command is hardcoded with `--paper-trading` (mutually exclusive with `--read-only` by official docs; paper mode **is** the safety boundary). No code path launches the MCP without it.
  - Only `BITGET_DEMO_*` variables are mapped into the child environment, under the official names. Production-namespace variables (`BITGET_API_KEY`, `BITGET_SECRET_KEY`, `BITGET_PASSPHRASE`) are never forwarded — and if a demo value equals a production-namespace value, the harness refuses to run (a separate Demo API Key is a hard requirement).
  - Paper execution runs only when a human explicitly confirms (`--confirm-execution`); otherwise the harness stops at the confirmation boundary, and no order-verb call without `dryRun` is ever issued.
  - Every step and the whole report are labeled `DEMO / PAPER`.
  - The module is not imported by any app route or service (test-enforced). This app itself still never trades — even in demo.
- **GetAgent Studio companion (PRE24-10):** an optional `paperTradingStatus` field on the Decision Artifact (`enabledByUser`, `externalSetupComplete`, environment label) for a GetAgent Studio paper-trading workflow. Absent by default; added only when the user explicitly enables paper trading; the core artifact is fully functional without it. Configuring GetAgent Studio demo credentials is an **external setup step** — the field records readiness, it does not perform it.
- **Classification:** harness native (as a standalone developer tool); execution external/agent-host; demo-only; optional.

### 4.7 Playbook / GetAgent (ecosystem surfaces) — External setup only

- **What they are:** Bitget-ecosystem programs referenced by the S2 handbook alongside Agent Hub and the MCP Server. They are surfaces through which agents and agent assets are discovered/distributed, not APIs this repository calls.
- **Implemented here:** nothing. There is no Playbook integration and no GetAgent API client in this codebase, and none is claimed. The only code presence of "GetAgent Studio" is the PRE24-10 paper-trading companion state described in §4.6, which records external setup status — it is not an integration with Playbook.
- **Relationship to the hackathon track:** the desk targets **Track 3 (AI Trading Desk, Decision Stress Testing)** on its own merits. Track 3 does not require Playbook, and this project makes no such claim. Playbook/GetAgent are potential future distribution surfaces for the handoff documents produced in §4.4–4.6, nothing more.
- **Classification:** external ecosystem surface; optional; no integration implemented.

## 5. What Remains Optional — And Why That Is the Design

Every item in §4 is optional in the strongest sense available:

1. **Type-level:** all provider slots accept omission; handoff fields are absent unless produced.
2. **Runtime-level:** unreachable endpoints, missing bridge files, and failed providers degrade to `UNAVAILABLE` / `[]` and the workflow completes.
3. **Semantic-level:** the decision verdict is computed from core market state and deterministic scenarios; optional providers only add `EvidenceItem`s with `state: RESEARCH_PROVIDER` and a `providerId`, which the EvidenceArbitrator treats exactly like any other evidence.
4. **Provenance-level:** every observation carries its source (`bitget-us-equity-mcp`, `bitget-signal`, `chainbase-agentkey/<capability>/<source>`, legacy composite), its retrieval/published timestamps, and its provenance type. Sources are never merged silently; numeric conflicts between sources are flagged `UNRESOLVED_CONFLICT` and never reconciled into a third invented value.
5. **Test-level:** the vertical-slice suite runs the full workflow with all integrations enabled and again with all optional integrations disabled, asserting a defensible core decision, provenance separation, and non-dependency in both configurations.

The rule for future work: **core first, enrichment second.** A new integration may add evidence, limitations, and handoff surfaces — it may never become a prerequisite for a verdict, a hidden dependency of the core modules, or a source the engine trusts above deterministic calculations.

## 6. Safety Boundaries

These boundaries hold regardless of which integrations are enabled:

- **No autonomous trading.** The desk is pre-trade decision support. It produces verdicts (EXECUTE / WAIT / REJECT), stress results, and handoff documents. It never places orders, never holds trading credentials, and has no execution code path. Any execution — including demo execution — happens in an external, human-driven session.
- **Authorization is not execution.** A connected Agentic Account authorizes read/confirm flows in the official session; the state machine contains no "order placed" state, and human confirmation precedes any external action.
- **Read-only by default.** Agent Hub handoffs are consumed with `--read-only`. Paper trading is the only order-shaped surface, it is demo-environment only, hardcoded to `--paper-trading`, human-confirmed, and unreachable from the app.
- **Credential hygiene.** No exchange credentials in the repository, ever. OAuth stays inside the official MCP in the user's AI host; demo credentials live only in the developer's environment and are namespace-separated with a refuse-on-collision check.
- **Deterministic authority.** The LLM never performs market math. External/agent-host observations (including Skill verdicts typed `AI_INTERPRETATION`) never overwrite deterministic values. Source conflicts are surfaced, not resolved.
- **Honest labeling.** Demo/paper results are always labeled as such; unproven endpoints are described as unproven; external setup guides are never presented as shipped features.

## 7. Related Documents

- `PENDING_TASKS.md` — per-integration implementation determinations and verification logs.
- `PRE24_BASELINE.md` — baseline verification of the provider architecture.
- `ARCHITECTURE_AND_LIMITATIONS.md` — core architecture and graceful-degradation philosophy.
- `B06_Hackathon_Demo_and_Quality.md` — demo truthfulness and quality gates.
