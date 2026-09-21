# Bitget AI RedTeam Desk: Architecture & Production Roadmap

## Overview
The RedTeam Desk is designed to separate a trader's **fundamental thesis** from their **execution and position risk**. It uses an LLM to parse natural language intent, but enforces a strict, deterministic risk layer to evaluate market viability (basis decoupling, contagion, off-hours liquidity) before execution.

This document outlines the current MVP architecture, known technical constraints, and the roadmap for enterprise production.

## MVP Architecture
- **Frontend / API**: Next.js (App Router) React application.
- **Decision Engine**: 100% deterministic TypeScript rule engine (Zero LLM hallucinations in the risk math).
- **Extraction Layer**: LLM endpoint utilized strictly for semantic extraction (Asset, Size, Direction, Thesis).
- **Market State Synthesis**: Bitget API for tokenized equity pricing + scraped reference data for underlying cash equities.

---

## Known Limitations & Path to Production

### 1. Market Depth & Liquidity (L1 vs L2 Data)
* **Current State (MVP)**: The Bitget API endpoint utilized for the MVP provides top-of-book (L1) visible liquidity. To prevent standard position sizes from triggering false-positive illiquidity rejections, the engine uses an `estimatedDepthMultiplier` heuristic to simulate orderbook depth.
* **Production Roadmap**: Integrate Bitget's WebSocket feeds to stream deep L2/L3 orderbook data. This allows the deterministic engine to calculate exact slippage down the book for the requested notional size instead of relying on a static scaling heuristic.

### 2. Static Risk Profiling
* **Current State (MVP)**: Advanced risk metrics (like `betaToBtc` for contagion shocks, `volScalar` for threshold widening, and `dailyBorrowPct` for carrying costs) are managed via a static `ASSET_RISK_PROFILES` configuration dictionary.
* **Production Roadmap**: Integrate a live, quantitative risk backend. The system will dynamically calculate rolling covariance matrices for Beta, measure historical volatility, and fetch live funding rates/borrow costs directly from the exchange API.

### 3. Reference Pricing (Basis Calculation)
* **Current State (MVP)**: To calculate the basis premium/discount of a tokenized asset against its underlying U.S. Equity, the system scrapes reference data (e.g., Yahoo Finance) using custom User-Agents and sleep backoffs. 
* **Production Roadmap**: Transition to an institutional, low-latency market data API (e.g., Polygon.io, Bloomberg, or Refinitiv). While the current MVP degrades gracefully if the scraper is blocked (marking the basis as "Unavailable"), a robust, authenticated feed is required for production SLA reliability.

### 4. LLM Endpoint Stability
* **Current State (MVP)**: Due to constraints with the current LLM's streaming capabilities, the system uses synchronous JSON payload extraction. If the LLM returns slightly malformed data, the system automatically intercepts the failure and initiates a retry loop.
* **Production Roadmap**: Migrate to a provider with native Structured Outputs (JSON Schema enforcement) and reliable Server-Sent Events (SSE) streaming to reduce latency and eliminate the need for multi-second retry loops.

## Optional Ecosystem Integrations (PRE24 series)

Beyond the core pipeline, the app optionally enriches its evidence with ecosystem providers, assembled at a single composition root (`src/adapters/research/defaultRegistry.ts`, PRE24-01). Every slot is optional at the type level; absent providers are a supported runtime state, and provenance records distinguish every source. Full classification (native vs external/agent-host), status, and safety boundaries are in [B07_Optional_Bitget_Ecosystem_Integrations.md](./B07_Optional_Bitget_Ecosystem_Integrations.md). Summary:

- **Bitget US Equity MCP (PRE24-02):** read-only US Stocks/ETF market-data MCP over Streamable HTTP, implemented in-app with tool discovery, category dispatch, validation, and bounded timeouts. **Live-verified 2026-09-21** (real NVDA quote/profile/earnings through the app's own adapter) via the live server's `guide` + `do_query` catalog protocol, which the adapter speaks alongside the documented named-tools shape. Reachability is environment-dependent (local DNS had to be bypassed with diagnostic DoH tooling); unreachable endpoints still degrade to `UNAVAILABLE`. Optional, native outbound.
- **Bitget Signal (PRE24-03):** read-only sentiment/market-intel MCP, implemented in-app (programmatic HTTP default; opt-in AI-host Skills file bridge). Upstream-dependent; degrades gracefully. Optional.
- **Chainbase AgentKey (PRE24-05):** **external partner, not a Bitget product.** Implemented as an AI-host handoff bridge (structured request file → AI host with AgentKey → validated observations back); no programmatic endpoint is documented and none was invented. Gated to tokenized-stock research. Optional.
- **Agent Hub read-only handoff (PRE24-06):** a structured payload on every decision result with `executionAllowed` typed as literal `false`; the live read-only session runs in the developer's own AI host (`@bitget-ai/bitget-agent-mcp --read-only`). The app never launches a stdio MCP and never contacts Agent Hub. Optional.
- **Agentic Account (PRE24-07):** handoff document plus a seven-state connection state machine with no "order placed" state; OAuth happens only in the official MCP inside the user's AI host. Authorization is not execution. Optional.
- **Paper Trading (PRE24-08/10):** a demo-only verification harness driving the official Agent Hub MCP hardcoded to `--paper-trading` against Bitget's Demo Trading environment (separate `BITGET_DEMO_*` credentials, namespace-checked; human confirmation required for execution; every report labeled DEMO/PAPER). Not imported by any app route; the app itself never trades, even in demo. Optional, external developer tool.
- **Playbook / GetAgent:** ecosystem distribution surfaces; **no integration implemented**. Track 3 does not require Playbook.

These integrations only add evidence and handoff surfaces. No optional capability is a hidden dependency of the core, and none enables autonomous trading in any configuration.

## Graceful Degradation Philosophy
A core design tenet of the RedTeam Desk is **Safety First**. The system is built to fail safely rather than process bad data:
- If Reference Pricing fails, the system bypasses the basis shock but flags the missing data to the user.
- If the LLM completely fails or hallucinates, the system halts and asks for manual clarification.
- If live networks or APIs fail entirely, the **Deterministic Fixture** (Demo Mode) provides an offline, fully verified execution path to ensure continuous availability.
- If any optional ecosystem provider (US Equity MCP, Signal, AgentKey bridge) is absent or unreachable, the workflow completes with the remaining evidence and attaches `UNAVAILABLE` provenance — integrations are enrichment, never dependencies (see B07).
