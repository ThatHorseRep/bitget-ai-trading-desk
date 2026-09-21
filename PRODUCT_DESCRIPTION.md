# Product Description
**Bitget AI Base Camp Hackathon S2 Submission**

## 1. Thesis
**Product:** Bitget AI RedTeam Desk is a pre-trade decision-support product that mathematically stress-tests tokenized U.S. equities and challenges user theses against off-hours structural risks.

## 2. Target User & Product Value
**Target user:** Crypto-native retail traders who trade tokenized U.S. equities alongside their crypto portfolios on Bitget. They have moderate capital size ($1,000–$50,000) and trade weekly. Because tokenized equities (e.g., rNVDA, rCOIN) trade 24/7 on Bitget even when the NYSE/Nasdaq are closed, these users are specifically afraid of off-hours basis un-anchoring, crypto-contagion risks, and liquidity shifts that could silently ruin a good fundamental thesis. They need a simple, unified process to check their thesis quality and position risk before executing during off-hours.

## 3. Validation Data & Key Metrics
**Validation so far:**
- 219/220 automated tests passing in our test suite (core scenario determinism, AI parsing fallbacks, off-hours session simulation, integration isolation, US Equity MCP catalog protocol, LLM client thinking-mode contract, etc.; the one skip is a live-integration test that self-skips without credentials).
- [TARGET/PLAN]: No live user data or user metrics collected yet.

## 4. Progress
**What's built and working:**
- Natural language parsing & thesis deconstruction (deterministic parsing in src/core/trade/parser.ts; LLM thesis extraction in src/core/thesis/extractor.ts)
- Adversarial reasoning / Counter-thesis generation (src/core/thesis/challenger.ts)
- Mathematical position stressing, deterministic scenarios, and P&L (src/core/scenarios/engine.ts)
- Thesis vs. Position synthesis (deterministic position quality in src/core/decision/classifyPosition.ts; LLM thesis-quality synthesis in src/core/thesis/assessment.ts)
- Decision Artifact generation & Policy (src/core/decision/policy.ts)
- Transparent "Demo Mode" for off-hours trading simulation (fixture in src/fixtures/rnvda-demo.ts; UI toggle in src/components/workspace/WorkspaceHeader.tsx; API in src/app/api/stress-test/route.ts)
- Optional ecosystem integrations as pure enrichment: Bitget US Equity MCP, Bitget Signal, Chainbase AgentKey (external partner), Agent Hub read-only handoff, and Agentic Account handoff — the core decision is fully defensible with all of them disabled (see B07_Optional_Bitget_Ecosystem_Integrations.md)

**What's not built yet / known gaps:**
- Live user portfolio context integration (currently marked as deferred/post-MVP).
- Native trade execution of any kind. There is no autonomous trading and no execution code path. A demo-only paper-trading verification harness (driving the official Bitget Agent Hub MCP with `--paper-trading` against the Demo Trading environment, human-confirmed) exists as an external developer tool, but the desk itself never places orders — paper or live.
- Playbook/GetAgent: no integration is implemented; they are potential future distribution surfaces for the handoff documents (Track 3 does not require Playbook).
- Synthetic hedging suggestions.

**Problems I hit and fixed:**
- *Problem:* The LLM was initially hallucinating P&L and basis math. *Fix:* Completely removed mathematical capabilities from the LLM, relying strictly on deterministic TypeScript engines (src/core/scenarios/engine.ts), leaving the LLM exclusively for qualitative thesis extraction and adversarial reasoning.
- *Problem:* Hackathon judges reviewing the app during live market hours wouldn't see the core value proposition (off-hours basis risk). *Fix:* Built the explicit, transparent "Demo Wedge" to safely force the UI into a weekend session state with a realistic un-anchored token premium.

## 5. Deliverables
**Tech stack:**
- Next.js (App Router, React)
- TypeScript (Strict mode)
- OpenAI API (for strictly-typed JSON LLM outputs)
- Tailwind CSS

**Links:**
- **Source code link:** [Insert Repo URL]
- **Live demo link:** [Insert Live Demo URL once deployed]
- **Demo video link:** [Insert Video URL once uploaded]

## 6. Our Take on AI Trading
We believe LLMs are currently dangerous when used for quantitative position sizing, mathematical shock calculation, or autonomous execution without guardrails. However, they are exceptionally good at qualitative reasoning, adversarial challenge, and extracting assumptions from natural language. By pairing a deterministic risk engine with an adversarial AI "Red Team", we can give retail traders institutional-grade pre-trade stress testing without the hallucination risks of generic AI agents.
