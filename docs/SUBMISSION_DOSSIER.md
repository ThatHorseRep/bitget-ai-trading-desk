# Bitget AI Trading Competition Submission Dossier
### Bitget AI Hackathon S2 — Official Submission Form Answers
> **Track:** AI Trading Desk  
> **Sub-theme:** Decision Stress Testing  
> **Project Name:** Bitget AI RedTeam Desk  
> **Submission Deadline:** October 8, 2026, 23:59 (UTC+8)  
> **Submission Form:** [Bitget AI Trading Competition Submission Form](https://bitget-ai.gitbook.io/bitgetai_hackathons2/)

---

## Quick Reference / Form Field Map

Use the exact copy-paste blocks below to complete each field in the official Google Form.

---

### 1. Team Name *
```text
ThatHorseRep
```
*(Or your preferred team / solo handle)*

---

### 2. Team Lead Bitget UID (numbers only) *
```text
6098344457
```
*(Verified numeric Bitget UID).*

---

### 3. Team Lead Email *
```text
thathorserep@gmail.com
```
*(Or your active primary email address).*

---

### 4. Team Lead Contact (Telegram Handle or other) *
```text
@ThatHorseRep
```
*(Telegram handle preferred. If unavailable, provide your X handle).*

---

### 5. Member Background *
- [x] **Developer**
*(Select Developer, Trader, or Student as applicable).*

---

### 6. University Name
```text
Federal University of Technology Minna (FUTMINNA)
```
*(Leave blank if not applying for the University Special Award).*

---

### 7. Apply for Demo Day
- [x] **Yes, I would like to apply**

---

### 8. How did you hear about this event? *
- [x] **Twitter / X**

---

### 9. Competition Track *
```text
AI Trading Desk
```

---

### 10. Competition Sub-theme *
```text
Decision Stress Testing
```

---

### 11. Project Name *
```text
Bitget AI RedTeam Desk
```

---

### 12. One-line Project Summary (140 characters max) *
> **Character Count Verification:** Exactly **139 characters** (Strictly ≤ 140).

```text
Pre-trade adversarial firewall for Bitget tokenized equities: deterministic stress tests + historical precedents before committing capital.
```

---

### 13. Project Description (Thesis, target user, validation data, progress, AI take) *

```text
Part 1 · Thesis (highest weight)
Bitget's tokenized U.S. equities (rTokens like rNVDA, rTSLA) trade 24/7, but the underlying NYSE/Nasdaq cash equity market is closed for up to 65.5 consecutive hours every weekend. During this off-hours window, retail traders face severe structural risks invisible on a basic price chart: basis un-anchoring from reference assets, crypto-contagion spillover when BTC fluctuates over the weekend, and orderbook depth collapse. 

Our core hypothesis: Off-hours trading losses are overwhelmingly caused by structural, deterministic risk factors—unanchored basis premium, contagion beta, and liquidity voids—rather than wrong directional opinions. If these structural risks are surfaced, adversarially red-teamed, and tested against empirical historical gap precedents before capital is committed, retail traders avoid catastrophic gap crush and liquidation without needing speculative price prediction models.

To guarantee zero mathematical hallucination, verdicts (PROCEED / WAIT / REDUCE / REJECT) and P&L shocks are computed strictly via 100% deterministic TypeScript arithmetic and policy gating. The LLM is confined strictly to qualitative language reasoning: thesis deconstruction, extracting falsifiable assumptions, and formulating adversarial counter-theses. Every number output by the desk links back to an auditable provenance record (OBSERVED_FACT, CALCULATED_METRIC, SCENARIO_ASSUMPTION, or AI_INTERPRETATION).

Part 2 · Target user and product value
Target Segment: Crypto-native retail traders on Bitget trading tokenized U.S. equities (rTokens) alongside crypto portfolios.
- Capital Size: $1,000–$50,000.
- Trading Frequency: Weekly to multi-day swing trades.
- Primary Market: Bitget Spot RWA / Tokenized U.S. Equities (rNVDA, rTSLA, rMSTR, rCOIN, rAAPL).
- Core Pain Point: Holding tokenized equities through weekend market closures and high-volatility macro announcements without knowing their basis spread risk, BTC contagion beta, or orderbook slippage. Existing solutions either force unconstrained LLM trading bots that hallucinate risk math or provide static charting tools that completely ignore the 65.5-hour cash market closure void. The RedTeam Desk unifies thesis deconstruction, live Bitget orderbook depth, deterministic scenario shocks, and historical precedent retrieval into one actionable pre-trade gate.

Part 3 · Validation data and key metrics
Validation so far [OBSERVED]:
- Full Test Suite Determinism: 397/397 automated tests passing across 41 test files with 0 failures, covering 5-tier competitor sabotage matrices, 10-case adversarial LLM injections, and a 15-test risk-tolerance contract.
- Historical Precedent Retrieval Engine: Catalog of 9 verified off-hours weekend/holiday gap precedents (e.g. August 2024 Yen-Carry unwind, DeepSeek AI weekend shock) providing empirical basis shifts (median +280 bps), peak drawdowns, and post-open re-anchor durations.
- Latency & Reliability: Measured end-to-end evaluation at 11.75s–50.62s across live production runs via failover cascades, and 0.51s in deterministic fixture mode. 100% task completion rate across simulated user sessions with zero unhandled runtime crashes.
- Empirical Walkthroughs: Three reproducible case studies (weekend basis premium, pre-earnings expansion, crypto contagion) executed through the production engine (docs/RETROSPECTIVE_CASE_STUDIES.md).

Target Validation & Distribution Plan [TARGET]:
- Activation & Adoption: Onboard 200 active Bitget tokenized equity traders within 60 days post-launch via Telegram community integrations and X decision artifact exports.
- Capital Protection: Target ≥15% average drawdown avoided on positions flagged with REDUCE or WAIT during weekend sessions.
- User Retention: Target 45% 30-day retention for traders utilizing pre-trade checkups prior to weekend sessions.

Part 4 · Progress
What is built and working:
- Natural language trade & thesis parser with automatic parameter normalization (src/core/trade/parser.ts).
- Adversarial red-team thesis challenger & counter-argument generator (src/core/thesis/challenger.ts).
- Deterministic 4-scenario quantitative stress engine (Market Risk, Crypto Contagion, Token Microstructure, Combined Shock) with carry borrow modeling (src/core/scenarios/engine.ts).
- Historical Scenario Precedent Retrieval Engine with empirical gap distributions (src/core/scenarios/retrieval.ts).
- Bitget Market Client with live spot ticker, L2 orderbook depth (/api/v3/market/orderbook), historical OHLCV candles (/api/v3/market/candles), and Reality market holiday calendar.
- Interactive What-If Counterfactual Sandbox with real-time position sizing toggles (100%/50%/25%), execution session timing switch, and simulated saved capital metrics.
- Triple-redundant LLM Failover Pipeline: Hackathon Qwen gateway -> Google Gemini Flash with header-based x-goog-api-key transport -> Deterministic heuristic rules.
- Conversational LUI Follow-up Assistant executing deterministic what-if modeling, contagion explanations, and session timing guidance (src/core/assistant/conversationalFollowup.ts).
- Multi-Asset Cross-Asset Pre-Trade Scanner across all 6 supported tokenized equities (src/components/workspace/MultiAssetRadar.tsx).
- 1-Click Compliance Audit Dossier Export generating Markdown memos and structured JSON decision artifacts (src/lib/exportDossier.ts).
- Auditable Provenance Drawer linking every metric to source timestamps and calculation inputs.
- Risk-tolerance persona lever (CONSERVATIVE / MODERATE / AGGRESSIVE) dynamically shifting risk bands while strictly preserving hard safety gates.

What comes next / known gaps:
- Live user portfolio context integration (account balance and position sizing checks).
- Webhook-based alerts for weekend basis expansion thresholds.
- Dynamic rolling covariance calculations for real-time betaToBtc updates.

Part 5 · Your take on AI Trading
LLMs are inherently ill-suited for autonomous order placement and arithmetic risk calculations because non-deterministic generation leads to catastrophic tail hallucinations in financial math. However, LLMs excel at qualitative reasoning, identifying hidden assumptions, and formulating adversarial counter-arguments. The future of Agentic Trading is not autonomous black-box bots, but deterministic supervisory firewalls where verified financial arithmetic gates execution while AI stress-tests human thesis quality.
```

---

### 14. Submission Material Links (one link per line, labeled by type) *

```text
Project Link (Live App): https://www.redteamdesk.name.ng
Project Mirror (Vercel): https://bitget-ai-redteam-desk.vercel.app
Source Code (GitHub): https://github.com/ThatHorseRep/bitget-ai-trading-desk
Run Records (Walkthrough Video - Desktop Brand Cut): https://redteamdesk.name.ng/demo/brand-desktop-demo.mp4
Run Records (Walkthrough Video - Mobile Brand Cut): https://redteamdesk.name.ng/demo/brand-mobile-demo.mp4
Product Specification: https://github.com/ThatHorseRep/bitget-ai-trading-desk/blob/main/PRODUCT_DESCRIPTION.md
Historical Scenario Engine & Methodology: https://github.com/ThatHorseRep/bitget-ai-trading-desk/blob/main/docs/SHOCK_CALIBRATION_METHODOLOGY.md
```

---

### 15. Role of the LLM / AI in Your Project *

```text
The Large Language Model is strictly confined to qualitative language reasoning and adversarial argumentation, with zero involvement in mathematical calculations, price selection, or final policy verdict gating.

Specifically, the LLM performs three language-only roles:
1. Thesis Deconstruction: Parses the trader's natural language statement into falsifiable assumptions (differentiating user-stated vs AI-inferred premises), critical dependencies, and structural invalidation levels.
2. Adversarial Red Teaming (Counter-Thesis Generation): Analyzes observed off-hours market state, basis spreads, and orderbook depth to formulate aggressive counter-arguments targeting the weakest assumptions in the trader's thesis.
3. Thesis Quality Synthesis: Evaluates overall thesis robustness (STRONGER, MIXED, WEAKER, INSUFFICIENT) based on empirical evidence and adversarial counter-theses.

All quantitative metrics (P&L shocks, basis spreads, slippage estimates, carry costs, and the final PROCEED/WAIT/REDUCE/REJECT verdict) are executed by 100% deterministic TypeScript algorithms. 

Models Used: Primary model is Qwen 2.5 (qwen3.8-max) via the official hackathon gateway, backed by an automated Circuit Breaker failover to Google Gemini 2.5 Flash / Flash Lite (utilizing secure x-goog-api-key header authentication), with fallback to deterministic heuristic rules.
```

---

### 16. X Project Post URL *
> **Action Required:** Publish the post below on X, quote-tweeting the official hackathon tweet, then paste the resulting tweet URL here.

**Target Tweet to Quote-Tweet:**  
`https://x.com/Bitget_AI/status/2100519318824055159?s=20`

**Post Copy:**
```text
Most traders evaluate a tokenized stock solely by its price chart. Almost no one stress-tests the market structure underneath it.

When NYSE and NASDAQ close for 65.5 hours every weekend, 24/7 tokenized stocks like $rTSLA and $rNVDA face structural basis decoupling, crypto contagion shocks, and thin orderbook liquidity.

We built @Bitget_AI RedTeam Desk: an adversarial pre-trade firewall for tokenized equities. State your trade in plain English—the desk reconstructs live off-hours market state, retrieves historical gap precedents, and runs 100% deterministic stress math.

Verdict: PROCEED / WAIT / REDUCE / REJECT with auditable data provenance.

🌐 Live App: https://redteamdesk.name.ng
📦 GitHub: https://github.com/ThatHorseRep/bitget-ai-trading-desk
🎥 Demo: https://redteamdesk.name.ng/demo/brand-desktop-demo.mp4

Built for the Bitget AI Base Camp Hackathon S2 (Track 3: Decision Stress Testing). #BitgetHackathon @Bitget_AI
```

---

### 17. Did this team participate in S1? *
- [x] **No**

---

### 18. Apply for Post-event Kimi K3 Token Credits (30U per team) *
- [x] **Yes**

---

### 19. Open to Playbook Review and Listing Discussion *
- [x] **Yes**
