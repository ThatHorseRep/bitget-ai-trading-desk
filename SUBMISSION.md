# Submission — Bitget AI RedTeam Desk
> *Supplementary judge-facing material — architecture overview, safety boundaries, and X post draft. The canonical Google Form text is [PRODUCT_DESCRIPTION.md](./PRODUCT_DESCRIPTION.md).*

**Track:** Track 3 — AI Trading Desk (Decision Stress Testing). Track 3 does not require Playbook, and no such dependency is claimed.

**Live deployment:** https://www.redteamdesk.name.ng (Vercel). Repository: https://github.com/ThatHorseRep/bitget-ai-trading-desk

## Project Description

Bitget AI RedTeam Desk is a pre-trade decision-support desk for crypto-native Bitget traders who trade tokenized U.S. equities (rNVDA and other rTokens) that stay tradable 24/7 while NYSE/Nasdaq are closed. Those off-hours sessions carry structural risks a normal chart does not show: basis un-anchoring between token and underlying, crypto-contagion spillover when BTC moves over a weekend, and thin top-of-book liquidity.

The trader states a proposed trade in plain language. The desk deterministically reconstructs the trade, shows the actual market state (session status, basis, spread, liquidity) with every source and timestamp, retrieves external evidence with provenance, adversarially challenges the thesis, stress-tests the position with fully deterministic scenario math (P&L, basis widening, contagion shocks), and returns a structured decision artifact: verdict (PROCEED / WAIT / REDUCE / REJECT), reasons, and change conditions. The trader — never the system — makes the final call.

One canonical demo works any time, market open or closed: the built-in Deterministic Fixture mode replays a weekend off-hours scenario (labeled "DEMO MODE: Simulating Weekend Off-Hours Session" in the UI), so no lucky market moment is required.

## Target User

Crypto-native retail traders on Bitget holding roughly $1,000–$50,000 who trade tokenized U.S. equities alongside their crypto portfolios, weekly or better. They can read a basis premium, but they currently evaluate thesis, market state, and position risk in three separate places — the desk unifies that into one pre-trade check.

## Role of the LLM

The LLM (hackathon gateway, Qwen-class `qwen3.8-max`) performs exactly three language-only jobs:

1. **Thesis extraction** — decompose the trader's statement into a normalized thesis, assumptions (user-stated vs AI-inferred), dependencies, and invalidation conditions. Every evidence reference the model emits is validated against the evidence actually supplied; hallucinated references are dropped.
2. **Adversarial counter-thesis (Red Teaming)** — attack the weakest assumptions of the thesis against the observed market state.
3. **Thesis-quality synthesis** — judge thesis quality (STRONGER / MIXED / WEAKER / INSUFFICIENT) from evidence and the counter-thesis.

The LLM is **never** used for market parsing, price selection, scenario math, P&L, basis arithmetic, liquidity classification, or the final verdict. Position quality and the verdict come from a deterministic rule engine (`src/core/decision/`); when the LLM is slow, rate-limited, or unreachable, the desk degrades honestly — limitations are recorded and a deterministic verdict is always produced. Parsing of the natural-language trade itself is deterministic (rule-based), not LLM-based.

## Safety Boundaries

- No trade execution exists in any code path; there is no autonomous trading in any configuration.
- Publication and execution boundaries require explicit human confirmation; the paper-trading harness is a developer-side, human-confirmed external tool against Bitget Demo Trading — the desk itself never places orders, paper or live.
- Optional ecosystem integrations (Bitget US Equity MCP, Bitget Signal, Agent Hub read-only handoff, Agentic Account handoff, Chainbase AgentKey — an external partner, not a Bitget product) are enrichment only: the core decision is fully defensible with every one of them disabled (see `docs/specs/B07_Optional_Bitget_Ecosystem_Integrations.md`).

## External Forces & Engineering Resilience Surmounted

1. **Shared Hackathon Qwen Gateway Sockets & Rate Limits (HTTP 429):** The shared gateway (`hackathon.bitgetops.com`) regularly returned 429 rate-limit spikes under heavy concurrent hackathon traffic. We implemented a low-latency Circuit Breaker with instant failover to secondary model endpoints (Gemini Flash) and graceful degradation to rule-based evaluation. The desk never crashes or times out the user.
2. **Deterministic Risk Separation vs. LLM Hallucinations:** Eliminated LLM hallucination risk in quantitative calculations by separating language tasks from numerical logic. P&L, basis uncoupling, and scenario shocks are 100% computed in a deterministic TypeScript engine.
3. **Market Hours Barrier (The Deterministic Demo Wedge):** Because hackathon judges review submissions during active market hours when off-hours basis spreads are minimal, we built an explicit Deterministic Fixture toggle that simulates an authentic 65.5-hour weekend closure and basis gap.
4. **Upstream MCP Outages & Latency Bounds:** Unstable or slow third-party research MCPs (e.g., Bitget Signal / US Equity) are bounded to 2.5–3.0s parallel timeouts with upstream failure payload filters, preserving pipeline execution under strict serverless budgets.

## Suggested X (Twitter) Post Text

> Most traders judge a tokenized stock by its chart. Nobody stress-tests the *structure* underneath it.
>
> We built the Bitget AI RedTeam Desk: state your trade in plain English — it reconstructs the off-hours market state, adversarially attacks your thesis, and stress-tests the position with fully deterministic math. Verdict + reasons + what would change it. You stay the decision-maker.
>
> rNVDA on a Sunday? That's exactly the case it was built for. 🧵👇
>
> #BitgetHackathon @Bitget_AI
