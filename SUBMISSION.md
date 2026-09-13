# Bitget AI Trading Desk — RedTeam Risk Workbench
**Bitget AI Base Camp Hackathon S2 Submission**

## 1. Project Description
Bitget AI Trading Desk (RedTeam Risk Workbench) is a pre-trade decision-support product designed specifically for the unique structural risks of tokenized U.S. equities on Bitget. When traditional U.S. reference markets (NYSE/Nasdaq) close, Bitget's tokenized equities (e.g., rNVDA, rCOIN) continue to trade 24/7. This creates off-hours basis un-anchoring, crypto-contagion risks, and liquidity shifts that most retail traders fail to price in. 

Instead of generating generic market summaries, the AI Trading Desk acts as an adversarial "Red Team" against the user's proposed trade. It isolates fundamental market rationale from off-hours execution risk, stresses the position mathematically, and forces the trader to confront the consequences of their decision *before* capital is deployed.

## 2. Track Fit
**Track:** Trading / Risk Management
This project aligns perfectly with building advanced AI-driven solutions for trading. By leveraging LLMs for adversarial reasoning (Red Teaming) and coupling them with deterministic stress testing, this application directly enhances a trader's risk assessment and decision-making for Bitget's distinct tokenized asset offerings.

## 3. Target User
**The Crypto-Native Retail Trader**
- Already trades crypto and is comfortable making decisions in a 24/7 market.
- Is beginning to trade tokenized U.S. equities alongside their crypto exposure.
- Often evaluates market state, token microstructure, and thesis logic separately rather than as a single, unified decision.
- Lacks a simple, unified process for checking thesis quality and position risk off-hours.

## 4. Core Job
> **"Stress-test a trade I am about to make before I commit money to it."**

The product is hired to improve the quality of the decision immediately before action. It reduces the gap between *"I have a trade idea"* and *"I understand the risks of the decision I am about to make."*

## 5. Role of the LLM
**The LLM is strictly confined to qualitative reasoning and thesis extraction.**
- **What it does:** The LLM is used for natural language parsing (extracting the trade direction, asset, and size from user input), thesis deconstruction (identifying assumptions), and adversarial reasoning (generating the counter-thesis/challenge).
- **What it NEVER does:** The LLM is **NEVER** used for deterministic market calculations. P&L impacts, basis spread, exposure sizing, and scenario math are all calculated deterministically by the application logic, ensuring zero hallucination risk on financial figures.

## 6. X (Twitter) Post Draft

**Tweet:**
Trading tokenized equities on the weekend? 🛑 Don't execute until you've Red-Teamed your thesis.

Built the Bitget AI Trading Desk for the #BitgetHackathon to stress-test 24/7 token trades against off-hours basis risk and crypto contagion.

Thesis ≠ Position. 

@Bitget_AI
