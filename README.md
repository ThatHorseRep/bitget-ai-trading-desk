# 🛡️ Bitget AI Trading Desk — RedTeam Risk Workbench
### *Decision Stress Testing, 65.5h Weekend Overhang Analysis & Off-Hours Synthetic Hedging for Tokenized US Equities (rTokens)*

> Built for the **Bitget AI Base Camp Hackathon S2**  
> **Track 3:** AI Trading Desk (Sub-Theme: *Decision Stress Testing*)  
> **Institution:** Federal University of Technology, Minna (FUTMINNA)

---

## 📌 Executive Overview

When tokenized US equities (rTokens) trade 24/7 while traditional equity venues (NYSE/Nasdaq) close for 65.5 hours over the weekend, retail traders face catastrophic blindspots:
- **Implied Monday Opening Gaps** driven by off-hours macro developments.
- **Off-Hours Liquidity Traps** where market depth drops 85–92%, leading to severe basis risk.
- **Cross-Asset Correlation Blindness** where tech equities and crypto fall in tandem during liquidity shocks.

The **RedTeam Trading Desk** rejects generic "predictive price bots" in favor of an **adversarial risk workbench**. It interrogates trader theses, quantifies downside tail risk (Expected Shortfall / VaR), models off-hours dislocation, and suggests deterministic synthetic hedges via Bitget futures and paper trading sandbox.

---

## 📚 Core Research Dossier & Architecture

| Document | Description | Key Focus Areas |
| :--- | :--- | :--- |
| 📄 [**`AI Trading Desk Research Plan.md`**](./AI%20Trading%20Desk%20Research%20Plan.md) | **Strategic Blueprint & Architecture** | Hybrid MCP architecture, legal/regulatory framework, quantitative risk metrics (Expected Shortfall, VaR), and Bitget Agent Hub integration. |
| 📄 [**`Bitget_AI_Trading_Desk_Market_Survey_Product_Blueprint.md`**](./Bitget_AI_Trading_Desk_Market_Survey_Product_Blueprint.md) | **Product Specification & UX Architecture** | Complete 4-module engine, state reconstruction engine, competitive teardown (Bloomberg ASKB, FinChat, Koyfin), and the 2-minute demo scenario. |
| 📄 [**`AI_Trading_Desk_Market_Survey_Blueprint.md`**](./AI_Trading_Desk_Market_Survey_Blueprint.md) | **Microstructure & Empirical Survey** | 7×24 liquidity analysis, Block Scholes empirical research, Binance Research data, and trader persona failure modes. |
| 📄 [**`trader_market_research_dossier.md`**](./trader_market_research_dossier.md) | **Trader Psychology & Hackathon Submission** | Everyday trader behavioral flaws, institutional stress testing methods adapted for retail, and complete ready-to-submit 6-part Google Form text. |

---

## 🏛️ System Architecture

The desk employs a **Hybrid Model Context Protocol (MCP)** architecture:
- **Semantic Layer (LLM):** Thesis extraction, counter-factual challenge formulation, narrative parsing via Qwen 3.8-max / Claude.
- **Deterministic Math Engine:** Value-at-Risk (VaR), Expected Shortfall (CVaR), beta-weighted cross-asset hedging calculations computed strictly via deterministic code (NumPy/Pandas/TypeScript math).
- **Perception Layer:** Bitget Agent Hub `bitget-signal` zero-API-key skills (`macro-analyst`, `sentiment-analyst`, `market-intel`, `technical-analysis`).
- **Simulation Layer:** Bitget Agent Hub Paper Trading (`--paper-trading`) for non-custodial synthetic hedge staging.

---

## 🎯 Target Submission Details
- **Hackathon:** Bitget AI Base Camp Hackathon S2
- **Track:** Track 3 — AI Trading Desk
- **Theme:** Decision Stress Testing
- **Eligible Categories:** Grand Prize ($3,000), Theme Prize ($500), University Special Prize ($500 via FUTMINNA), Best Spread ($300).
