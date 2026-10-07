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
> **Character Count Verification:** Exactly **131 characters** (Strictly ≤ 140).

```text
A pre-trade firewall for Bitget tokenized equities: deterministic stress tests and historical precedents before you commit capital.
```

---

### 13. Project Description (Thesis, target user, validation data, progress, AI take) *

```text
Part 1 · Thesis (highest weight)
When retail traders buy tokenized stocks like rTSLA or rNVDA on Bitget on a Saturday, they think they're making a normal stock trade. But the cash markets in New York closed on Friday at 4 PM and won't reopen for 65.5 hours. During that entire weekend void, traders are flying blind: the token un-anchors from the underlying equity, orderbooks thin out, and unexpected Bitcoin drops spill straight into the token price.

Most traders who lose money over the weekend don't have bad directional ideas—they walk straight into structural market traps they never saw coming.

We built the RedTeam Desk to act like an institutional pre-trade risk officer before you hit buy. You explain your trade in plain English, and the desk does two things:
1. It uses an adversarial AI to stress-test your thinking, pointing out what could go wrong and what hidden assumptions you're making.
2. It runs 100% deterministic math on live Bitget orderbook data and 9 historical market shock precedents (like the August 2024 Yen-carry unwind) to show you your exact downside in dollars and cents.

Crucially, the AI never touches the math. Generative models hallucinate numbers and invent probabilities—which is dangerous when real capital is on the line. Instead, deterministic code computes every shock loss, basis spread, and policy verdict (PROCEED / WAIT / REDUCE / REJECT), with full audit lineage back to real orderbook quotes.

Part 2 · Target user and product value
Our users are active retail traders on Bitget who trade tokenized U.S. equities (rNVDA, rTSLA, rMSTR, rCOIN, rAAPL) alongside their crypto holdings, typically putting $1,000 to $50,000 to work on multi-day swings.

Their biggest problem is that weekend crypto trading tricks them into treating tokenized equities like ordinary altcoins. Existing tools fail them completely: standard charts only show the last printed token price without revealing that cash equity markets are shut, and generic AI trading bots hallucinate risk metrics without understanding off-hours liquidity.

The RedTeam Desk gives these traders institutional-grade pre-trade clarity in under 30 seconds: live basis spreads against cash closes, severe shock scenarios, historical gap precedents, and an interactive What-If sandbox where they can dial back position size to see how much capital they save before pulling the trigger.

Part 3 · Validation data and key metrics
What we've built and validated so far:
- 397/397 passing tests across 41 test files with zero failures, thoroughly verifying competitor sabotage handling, prompt injection defense, and strict risk-tolerance behavior.
- 9 verified historical gap precedents (including the August 2024 global market unwind and the DeepSeek tech drop), giving traders real historical basis widening (+280 bps median) and re-anchor timelines instead of guesswork.
- Rock-solid speed and reliability: Sub-second (0.51s) evaluation in offline fixture mode, and 11.75s–50.62s end-to-end on live Bitget production feeds with zero unhandled crashes across all test sessions.
- Three fully reproducible case studies (weekend basis drag, pre-earnings expansion, crypto contagion) executed end-to-end through the engine.

Where we're heading post-hackathon:
- Community onboarding: Reaching 200 active Bitget tokenized equity traders within 60 days via Telegram trade-share integrations and social decision card exports.
- Real capital protection: Targeting ≥15% average drawdown avoided on trades flagged with REDUCE or WAIT before market open.
- Trader retention: Targeting a 45% 30-day retention rate for swing traders using the desk for weekend pre-trade checkups.

Part 4 · Progress
What is live and working today:
- Conversational trade parser: Type any natural English trade idea, and the desk extracts size, ticker, and entry assumptions automatically.
- Adversarial thesis challenger: Generates aggressive, contextual counter-theses targeting the weakest link in your argument.
- Deterministic shock engine: Computes 4 exact scenarios (Market Risk, Crypto Contagion, Token Microstructure, Combined Shock) with carry borrow fees.
- Real-time Bitget integration: Connects to live Bitget spot tickers, L2 orderbooks (/api/v3/market/orderbook), and recent candles.
- Interactive What-If Sandbox: Instant zero-latency toggles to test cutting position size (100% / 50% / 25%) or waiting for the Monday cash open, showing exact dollars saved.
- Triple-redundant AI failover: Hackathon Qwen gateway -> Google Gemini 2.5 Flash -> Deterministic heuristics, ensuring the desk never hangs if an LLM provider drops.
- Full provenance drawer: One click reveals the exact source, timestamp, and mathematical formula behind every single number.
- Risk tolerance slider: Toggles between Conservative, Moderate, and Aggressive profiles while preserving hard safety limits.

What's on the immediate roadmap:
- Direct portfolio balance sync via Bitget API keys.
- Automated weekend webhook notifications when basis spreads cross dangerous thresholds.
- Rolling dynamic covariance tracking for real-time beta calculations against Bitcoin.

Part 5 · Your take on AI Trading
Most people in crypto are using AI backwards—they build autonomous bots that try to predict where prices will go next week and execute trades automatically. That almost always blows up because language models are fundamentally incapable of reliable arithmetic and probability estimation; they hallucinate decimals and panic during outlier volatility.

The real breakthrough for AI in trading isn't letting bots pull the trigger. It's using AI as an adversarial sparring partner. Humans are prone to confirmation bias and FOMO, especially during off-hours when rumors spread on social media. AI is brilliant at asking uncomfortable questions, poking holes in lazy theses, and pointing out hidden dependencies.

By pairing an adversarial AI that challenges your ideas with deterministic code that computes the math without hallucinations, you get the best of both worlds: human intuition, AI critical thinking, and unbreakable arithmetic.
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
We deliberately separated the AI from the math. The LLM never calculates a price, never computes a P&L shock, and never decides the final mathematical verdict on its own.

Instead, it does what humans usually need an experienced risk officer for:
1. Spotting hidden assumptions: It parses the trader's plain-English thesis and separates hard verifiable facts from hopeful speculation (like assuming an unconfirmed weekend rumor will hold until Monday).
2. Playing the cynical counter-party: It examines observed off-hours market conditions—such as basis spread widening or thin orderbook depth—and builds a targeted counter-argument directly challenging the trade.
3. Evaluating thesis durability: It assesses the logical consistency and resilience of the trader's reasoning against historical market realities.

Everything numerical—position sizing, scenario losses, slippage estimates, carry costs, and gating thresholds—is computed by verified deterministic algorithms with full audit provenance.

Models Used: Primary model is qwen3.8-max via the official hackathon gateway, backed by an automated Circuit Breaker failover to Google Gemini 2.5 Flash / Flash Lite (with header-based x-goog-api-key authentication), and a final safety fallback to deterministic heuristic rules.
```

---

### 16. X Project Post URL *
```text
https://x.com/ThatHorseRep1/status/2107786783325134865
```

> **Live Post Published:** [`https://x.com/ThatHorseRep1/status/2107786783325134865`](https://x.com/ThatHorseRep1/status/2107786783325134865)  
> Quote-tweets the official hackathon tweet with tags `@Bitget_AI` and `#BitgetHackathon`.

---

#### 🧵 Tweet 1 (Thread Starter / Quote-Tweet) — 269 / 280 chars:
```text
Nothing hurts like buying a tokenized stock on Saturday, feeling smart, only to watch your capital get wrecked by a 300 bps basis crush before NYSE even opens on Monday.

Most off-hours losses aren't bad thesis calls. The market structure broke underneath you. 🧵 (1/4)
```

#### 🧵 Tweet 2 (The Structural Trap) — 267 / 280 chars:
```text
U.S. markets close for 65.5 hours every weekend.

During that void, 24/7 tokens like $rTSLA & $rNVDA trade blind:
• Zero cash price discovery
• Paper-thin orderbooks
• BTC dumps bleed into equities

Traders don't need bots guessing prices. They need a firewall. (2/4)
```

#### 🧵 Tweet 3 (The RedTeam Desk Solution) — 270 / 280 chars:
```text
That's why I built @Bitget_AI RedTeam Desk for the Hackathon S2 (Track 3).

State your trade in plain English. The desk red-teams your thesis, pulls 9 historical gap precedents, and runs 100% deterministic math to issue a verdict: PROCEED, WAIT, REDUCE, or REJECT. (3/4)
```

#### 🧵 Tweet 4 (Proof & Live Links) — 262 / 280 chars:
```text
Zero LLM math hallucinations. 397/397 tests passing. Auditable provenance on every single metric.

Try it before risking capital:
🌐 App: https://redteamdesk.name.ng
📦 Repo: https://github.com/ThatHorseRep/bitget-ai-trading-desk
🎥 Demo: https://redteamdesk.name.ng/demo/brand-desktop-demo.mp4

#BitgetHackathon @Bitget_AI (4/4)
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
