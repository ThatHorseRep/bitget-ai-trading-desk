# Bitget AI Base Camp Hackathon S2 — Market Survey & Product Blueprint

## Executive thesis

The strongest opportunity in Bitget AI Base Camp S2's **AI Trading Desk** track is not another "AI stock analyst." The market already has increasingly capable research copilots, terminals, chart readers, and general-purpose research agents. The more defensible opportunity is a **decision system for the 7×24 tokenized-equity market**: a desk that takes a concrete trade idea, reconstructs the relevant state of the market, exposes the information and portfolio assumptions behind the idea, stress-tests it against historical and hypothetical shocks, and returns a decision-ready risk memo with explicit uncertainty and invalidation conditions.

The structural reason is new market microstructure. Tokenized equities can trade onchain outside the hours of the underlying exchange, but the quality and availability of liquidity are not constant. Recent research finds that price gaps between tokenized assets and their underlying securities widen outside core hours, consistent with limits to arbitrage. A 2026 Binance Research study of bStocks found that 92% of onchain volume over a recent seven-day window occurred while U.S. equity markets were closed and that weekend prices captured a median 92% of the following Monday's opening gap across seven weekends. Those findings are early and venue-specific, but they establish a credible product problem: **the information state is continuous while the reference market is discontinuous**.[1][2]

The product should therefore be positioned as a **risk-and-research workbench for the moments when normal equity research assumptions break** — nights, weekends, earnings windows, geopolitical shocks, crypto/stock correlation shifts, and concentrated portfolio decisions.

---

## 0. Hackathon fit and strategic constraints

Bitget S2 is explicitly focused on **AI × U.S. stock trading**, including tokenized U.S. stocks and related contract scenarios. The handbook defines the AI Trading Desk as a natural-language research workbench in which AI processes information, invokes tools, and presents analysis while a human trader makes the final decision.[3]

For this track, the submission must demonstrate:

1. An **accessible demo**.
2. One complete research task, from a user's question to an **actionable insight**.
3. A compliant X promotional post containing `#BitgetHackathon` and `@Bitget_AI`.[3]

The track is judged subjectively on four things:

- **Feature depth** — breadth and effectiveness of data sources and skill/tool integrations.
- **Research quality** — whether the output is genuinely useful rather than merely verbose.
- **LUI fluency** — whether natural-language interaction is a strong interface for the workflow.
- **Personalized thesis** — whether the system understands the user's actual position, intent, and context.[3]

The handbook's five named AI Trading Desk sub-themes are:

| Sub-theme | Core question | Product implication |
|---|---|---|
| Information Extraction & Signal Generation | Can AI turn unstructured earnings, macro and news information into useful signals? | Build an evidence-to-signal pipeline. |
| Review & Self-Evolution | Can AI help a trader review decisions and improve the research framework? | Build a trade/research memory and review loop. |
| Decision Stress Testing | Can AI retrieve similar historical scenarios and test a proposed position? | Build an adversarial pre-trade decision engine. |
| Personalized Research Workbench | Can AI create a customized workflow around a thesis? | Build an extensible research cockpit. |
| Execution Assistance | Can AI improve order splitting and slippage management after the human decides? | Build execution analytics/assistance. |
| Open Theme | Can an AI-assisted trading tool/workbench solve a compelling adjacent problem? | Candidate: portfolio-aware AI PM / copilot. |

The handbook specifically suggests a portfolio-aware AI PM as an Open Theme example and explicitly describes Decision Stress Testing as an input-trade-idea → historical-distribution → preset-stress-test workflow.[3]

**Recommendation:** target **Decision Stress Testing** as the primary named sub-theme, while architecting the product so that it naturally includes Information Extraction, Personalized Research Workbench, and eventually Review & Self-Evolution capabilities. This creates one coherent product rather than a bundle of unrelated features.

---

# 1. Anatomy of tokenized U.S. stocks and the 7×24 reality

## 1.1 What a tokenized equity actually is

A tokenized security is not simply "a stock on a blockchain." The SEC's January 2026 statement defines a tokenized security as a financial instrument that is a security under federal securities law and is represented or formatted as a crypto asset, with ownership recorded in whole or in part on one or more crypto networks. The SEC distinguishes issuer-sponsored tokenization from third-party tokenization.[4]

For retail-facing products such as Ondo Stocks and xStocks, the important product-level abstraction is:

> **There is an underlying traditional security held through a custody/brokerage structure, and a blockchain token representing economic exposure to that asset.**

FINRA similarly explains that tokenized securities can be traditional securities held by an intermediary that tokenizes the associated security entitlements, or securities where the issuer/transfer agent maintains the securityholder registry onchain.[5]

That distinction matters for an AI desk because "tokenized stock price" does not automatically mean "the same market as the NYSE/Nasdaq stock price." The product must reason about **venue, issuer, custody, redemption rights, market depth, and reference price**.

---

## 1.2 The economic anchor: 1:1 backing plus a conversion/redemption mechanism

### xStocks

xStocks describes its tokens as 1:1-backed tokenized U.S. equities and ETFs, held with regulated custody, transferable onchain and tradeable 24/7. The xStocks platform currently advertises more than 700 stocks/ETFs, $40B+ transaction volume, and availability across multiple chains.[6]

Its xChange infrastructure illustrates how the primary-market anchor can work: a user requests a quote; the engine pulls the real market price; market makers/solvers receive the quote; and an atomic transaction can settle the token and payment simultaneously. xStocks says the mechanism is intended to complement onchain liquidity with issuer-direct execution.[7]

The implication is important: **mint/redeem is not the only source of liquidity**, but it is one of the mechanisms that can connect secondary onchain pricing back to the underlying market.

### Backed / bTokens and xStocks

Backed's bNVDA product is an ERC-20 token tracking NVIDIA, with a 0% management fee and a 0.5% issuance/redemption fee. Its listed service providers include Alpaca Securities, InCore Bank and Maerki Baumann as brokers/custodians.[8] Backed subsequently announced that bTokens were being upgraded to xStocks, with equity mappings such as bNVDA → NVDAx and bTSLA → TSLAx.[9]

### Ondo Stocks

Ondo describes its tokenized stocks as blockchain tokens providing economic exposure to traditional public securities. Its current product page says tokens are fully backed by corresponding U.S. stocks/ETFs and cash in transit, with traditional exchange liquidity accessed through instant minting/redemption mechanisms. Ondo's current implementation offers 24/5 minting/redemption for the broader set and 24/7 minting/redemption for a smaller group of highly traded assets, including NVDAon, SPYon, CRCLon, TSLAon, QQQon and GOOGLon, subject to operational and risk-control exceptions.[10]

This is a critical nuance for product architecture:

> **24/7 token transfer/trading is not identical to 24/7 primary-market redemption for every asset.**

The desk therefore needs separate states for:

- token trading availability;
- primary mint availability;
- primary redemption availability;
- underlying exchange availability;
- reference-price freshness;
- market-maker depth.

---

## 1.3 How NAV arbitrage should work conceptually

Suppose an underlying share is worth $100 and an eligible token is trading at $103.

If an authorized market participant can:

1. acquire or mint the token against the underlying/cash;
2. sell the token at $103;
3. redeem/settle through the underlying mechanism;
4. capture the spread after fees, financing, execution costs and operational constraints;

then arbitrage pressure should push the token back toward its economic reference value.

If the token trades at $98, the reverse pressure can occur: buying the discounted token and converting/redeeming it can create a path toward the underlying value.

However, this is **not a frictionless peg**. Bybit's current xStocks terms explicitly warn that prices can deviate from the underlying because of liquidity, latency and order-book depth, and that trading may be suspended or delayed when market depth is insufficient.[11]

Therefore the correct mental model is:

```text
Underlying security
       │
       │  reference value / custody
       ▼
Primary issuance & redemption
       │
       ▼
Tokenized security
       │
 ┌─────┼─────────┐
 ▼     ▼         ▼
CEX   DEX     Wallet/DeFi
 │     │         │
 └─────┴─────────┘
       │
       ▼
Secondary-market price discovery
```

The arbitrage band is determined not just by NAV, but by:

- issuance/redemption fees;
- gas/network costs;
- trading fees;
- spread;
- slippage;
- financing costs;
- transfer restrictions;
- eligibility/KYC;
- market depth;
- latency;
- operational downtime;
- corporate-action restrictions.

An AI desk should therefore avoid the simplistic statement **"token = stock, so any price difference is free arbitrage."**

---

# 2. The weekend and off-hours market

## 2.1 Friday 4:00 PM ET is not "the market stops"

At the U.S. equity close, the underlying reference market stops continuously discovering prices until the next regular session. But tokenized equities can continue trading. Ondo explicitly says its tokenized stocks can be transferred and traded peer-to-peer 24/7, including on exchanges and DeFi protocols, subject to platform operation and asset-specific restrictions.[10]

xStocks similarly markets 24/7 trading.[6]

That creates a new information/price-state problem:

```text
Friday 4:00 PM ET

Underlying stock:     CLOSED
Tokenized stock:      TRADING
Crypto:               TRADING
News:                  ARRIVING
X/social sentiment:    MOVING
Macro expectations:    MOVING
Geopolitics:           MOVING

                 ↓

Monday 9:30 AM ET

Underlying stock:     OPENS
Price discovery:      RECONNECTS
```

The tokenized market therefore has to perform price discovery while its primary reference market is unavailable.

---

## 2.2 The evidence says this is already happening

The most important current evidence is Binance Research's July 2026 study of bStocks.

Across seven weekends:

- bStocks captured a **median 92% of the subsequent Monday opening gap**;
- for Monday gaps greater than 3%, the direction was correct in **41/41 observations** in the sample;
- $1.5B of bStocks traded on Binance while U.S. equity markets were closed;
- in the seven days through July 28, **92% of onchain volume** and 59% of Binance volume occurred outside U.S. market hours.[1]

The study also found a distinctive time-of-day pattern: onchain activity peaked around the start of the Asian trading day and remained elevated through the Asian session, suggesting demand that legacy U.S. equity hours do not serve.[1]

These numbers should not be treated as a universal law. The sample is short, the venue is specific, and the product is still young. But the result is strategically significant: **off-hours tokenized equity trading is not merely theoretical.**

A separate 2026 academic paper using tokenized financial-asset data found that trading remains concentrated during regular exchange hours despite 24/7 access, while price gaps between tokenized assets and underlying securities widen outside core hours, consistent with limits to arbitrage.[2]

The two findings are complementary, not contradictory:

- **Demand remains highest when the underlying is open.**
- **The marginal value of 24/7 trading becomes visible precisely when the underlying is closed.**
- **The cost of trading outside core hours can rise because liquidity and arbitrage capacity are thinner.**

---

## 2.3 Where liquidity traps can form

The most dangerous periods are not simply "weekends." They are **transitions between information regimes**.

### Regime A — Friday close

The underlying market shuts, but tokens remain tradeable. Market makers lose access to continuous reference prices and immediate hedging in the primary market.

Expected consequences:

- wider spreads;
- smaller displayed depth;
- higher inventory risk premiums;
- more dependence on futures/proxies;
- increased basis uncertainty.

### Regime B — Friday night / Saturday

Information continues to arrive while the reference equity is frozen.

Potential sources:

- company announcements;
- geopolitical developments;
- crypto market moves;
- commodity shocks;
- policy headlines;
- social-media narratives.

The token price becomes part market and part **expectation market**.

### Regime C — Sunday evening / Asian session

Global participants return and crypto liquidity increases. This can be a period of rapid repricing before U.S. traders return.

### Regime D — Monday pre-open

The token market is approaching the point at which its price can be compared directly with the opening of the primary exchange. Hedging and arbitrage incentives become stronger.

### Regime E — Monday open

The reference market reopens. Latent information is compressed into the opening auction, and the token can converge toward the underlying or expose a basis error.

xStocks' current xChange documentation explicitly says spreads are tightest during market hours and wider during extended hours because underlying liquidity is reduced.[7]

Bybit's terms likewise warn that inadequate market depth can lead to trading suspension/delay and that xStocks can deviate from the underlying because of liquidity, latency and order-book depth.[11]

**Product conclusion:** the AI desk should treat "market closed" as a **risk regime**, not merely a clock label.

---

# 3. Trader personas and real pain points

## Persona 1 — Crypto-native trader diversifying into tech equities

### Profile

- Comfortable with wallets, CEXs, DEXs and crypto market structure.
- Comfortable with 24/7 markets.
- Interested in recognizable technology names such as NVDA, TSLA, AAPL, MSFT, GOOGL and QQQ.
- Often thinks in terms of crypto-native concepts: momentum, flows, funding, narratives, whales, liquidity and risk-on/risk-off.
- May not have the same mental model for equity-specific fundamentals, earnings expectations, valuation, corporate actions and exchange-hour mechanics.

xStocks explicitly markets itself around this global crypto-native audience, including the proposition that users want to hold stocks in wallets, avoid moving funds between platforms and use tokenized equities in DeFi.[6]

### Core pain

**Cross-market context is fragmented.**

The trader may see:

- NVDA token price;
- BTC price;
- X sentiment;
- a headline;
- funding rates;

but lack a coherent model connecting them to:

- the underlying stock;
- the next market open;
- portfolio concentration;
- expected volatility;
- valuation/fundamental context.

---

## Persona 2 — Retail equity swing trader entering the 7×24 world

### Profile

- Understands traditional equities.
- Thinks in daily/weekly setups.
- May be used to the psychological boundary created by the closing bell.
- Now has access to a tokenized representation that can trade through nights and weekends.

### Core pain

**The closing bell used to create a forced pause. 24/7 tokenized markets remove it.**

That can create more opportunities, but also more opportunities to act without sufficient information or risk control.

---

# 4. The five highest-value pain points

## Pain Point 1 — Weekend Information Overhang

The trader knows the underlying stock cannot reprice on the primary exchange until Monday, but news continues to arrive.

The question becomes:

> "Is this headline already priced into the token, or am I reacting late?"

The desk should answer this with an **Information-to-Price timeline**:

```text
NEWS EVENT
   ↓
Timestamp
   ↓
First market reaction
   ↓
Token price response
   ↓
Crypto / sector response
   ↓
Current implied move
   ↓
Historical analogues
   ↓
Remaining uncertainty
```

---

## Pain Point 2 — Sunday Night Anxiety / Information Compression

Sunday evening is psychologically awkward: the trader can see the token move but cannot yet see the primary market confirm it.

The question is not merely:

> "Will NVDA go up?"

It is:

> "How much of Monday's move is already embedded in this token price, and what would have to happen for Monday to invalidate it?"

This is exactly the type of question that makes a stress-testing interface valuable.

---

## Pain Point 3 — Cross-Asset Correlation Blindness

A crypto-native trader may treat NVDA as an isolated stock. But the portfolio can have hidden exposure through:

- NVDA;
- AI/semiconductor ETFs;
- BTC;
- ETH;
- tech-heavy tokens;
- AI narrative assets;
- leveraged products.

The relevant question is therefore not:

> "Is NVDA bullish?"

but:

> **"What happens to my entire risk book if the AI/tech/risk-on factor reverses?"**

Institutional risk platforms such as Aladdin explicitly model exposures by factor, sector and security and use scenario analysis to evaluate portfolio outcomes.[12]

---

## Pain Point 4 — Sizing and Concentration Bias

A trader can be correct on direction and still make a bad portfolio decision.

For example:

- good thesis;
- good entry;
- bad position size;
- excessive correlated exposure.

The NBER literature on household portfolios finds that concentrated investors can sometimes outperform, but concentration also carries greater total risk and lower Sharpe ratios.[13]

The desk should therefore separate:

**THESIS QUALITY**

from

**POSITION QUALITY**.

A trade can be a good idea and still be a bad trade **for this portfolio at this size**.

---

## Pain Point 5 — Emotional/Reactive Trading

Classic behavioral evidence shows that heavy individual trading is associated with worse performance. Barber and Odean found that the most active households in a large brokerage sample earned substantially less than the market, with overconfidence offered as one explanation.[14]

More recent work shows retail investors can trade contrarian to large earnings surprises, with younger and more attentive investors especially prone to the behavior.[15]

The 24/7 environment creates a new version of this problem:

> **There is always another candle, another headline, another price move and another opportunity to act.**

The desk should therefore create friction **before** a decision rather than after a loss.

---

# 5. Why generic AI trading bots fail the serious-trader test

## 5.1 The market is already moving beyond simple chat

The competitive bar is much higher than it was a year ago.

Bloomberg's current ASKB product already provides a conversational AI interface over Bloomberg's proprietary structured data, news, research and analytics. It coordinates multiple agents, provides source attribution, supports multi-step research workflows, and can expose underlying BQL code for analysis.[16]

FinChat already combines global financial data, fundamentals, KPIs, investor-relations content, estimates, ownership data, 13F data, dashboards, visualization and AI research workflows.[17]

Koyfin provides broad market data, visual analytics and research workflows aimed at investors and CIO/research teams.[18]

Perplexity's Research mode can autonomously search dozens of sources, read hundreds of sources, reason iteratively and produce a report, including for finance.[19]

TradeGPT offers chart-image analysis, pattern recognition, levels, momentum, entry/stop/target plans and position-sizing/risk suggestions.[20]

Therefore:

> **"We added an LLM to market data" is no longer a differentiated proposition.**

---

## 5.2 What traders actually distrust

There is no defensible basis for saying that exactly "95%" of AI trading assistants are useless. That should remain product rhetoric, not a factual market statistic.

However, trader communities repeatedly describe a recognizable failure mode: generic LLM outputs can sound financially sophisticated while failing on current data, precise market context, execution assumptions, or causal reasoning. Recent discussions in r/algotrading explicitly criticize LLMs that merely reproduce generic technical-analysis language and emphasize the need for clean datasets, forward testing, tool grounding and domain-specific workflows.[21]

The trust problem can be summarized as:

### Failure mode A — stale or wrong state

The AI says something plausible about a market state that has already changed.

### Failure mode B — source opacity

The trader cannot tell which claim came from which source.

### Failure mode C — narrative bias

The model tells a coherent story instead of measuring whether the story matters.

### Failure mode D — no portfolio context

It evaluates the asset, not the proposed position.

### Failure mode E — no counterfactual

It explains why a trade could work but does not rigorously test why it could fail.

### Failure mode F — no execution reality

It ignores spread, liquidity, market depth and off-hours conditions.

### Failure mode G — no memory of the trader

It does not know that the user has made this mistake six times before.

### Failure mode H — false precision

It presents a probability or target without a clear statistical or scenario basis.

---

# 6. What would make an AI desk feel indispensable?

A serious trading desk should behave less like a chatbot and more like a **research operating system**.

## Capability 1 — State reconstruction

Before answering a question, reconstruct:

- asset;
- token venue;
- underlying venue;
- market state;
- reference price;
- token price;
- basis/premium/discount;
- liquidity/depth;
- volatility;
- recent news;
- macro state;
- crypto state;
- portfolio exposure.

## Capability 2 — Evidence graph

Every material claim should have a source and timestamp.

```text
Claim
 ├── Source
 ├── Timestamp
 ├── Data value
 ├── Confidence
 └── Relationship to thesis
```

## Capability 3 — Thesis decomposition

Turn:

> "I want to buy NVDA because AI spending is accelerating."

into explicit assumptions:

1. AI capex continues to grow.
2. NVDA retains pricing power.
3. earnings expectations are not already too high.
4. current price does not fully discount the thesis.
5. the token's off-hours premium/discount is acceptable.
6. portfolio concentration remains tolerable.

Now each assumption can be tested.

## Capability 4 — Adversarial counter-thesis

The system must actively attempt to disprove the trade.

## Capability 5 — Historical analogues

Find prior periods with similar combinations of:

- volatility;
- market regime;
- earnings surprise;
- macro backdrop;
- sector performance;
- BTC/Nasdaq relationship;
- token/underlying basis.

## Capability 6 — Scenario engine

Allow the trader to ask:

> "What if BTC drops 8% while Nasdaq is closed?"

or:

> "What if oil rises 10%, yields rise 30 bps and NVDA's token is already +3% Sunday night?"

## Capability 7 — Portfolio impact

Show:

- position weight;
- sector exposure;
- factor exposure;
- beta;
- correlation;
- concentration;
- estimated drawdown under scenarios.

## Capability 8 — Decision memo

End with:

> **Proceed / Reduce / Wait / Reject / Needs more evidence**

but always show:

- why;
- what could invalidate it;
- what evidence matters next;
- what size/risk constraint should apply.

---

# 7. Institutional stress testing translated for retail traders

## 7.1 What institutions actually do

Institutional risk systems do not merely ask whether an asset is bullish. They model how a **portfolio** responds to changes in underlying risk drivers.

BlackRock's Aladdin Risk describes factor, sector and security exposure analysis alongside scenario analysis and stress testing. It supports both historical event replay and hypothetical shocks to multiple variables, including equity indices, interest rates, commodities and FX.[12]

Aladdin's stress-testing examples explicitly include questions such as what happens if equity markets move 10%, rates move 1%, oil moves 10%, or the dollar changes materially.[22]

For registered funds using derivatives, SEC rules require written risk-management programs that include quantitative guidelines, stress testing, backtesting, internal reporting and escalation for relevant derivatives risks.[23]

The lesson is not that our hackathon product should recreate Aladdin.

It is that **the institutional workflow is conceptually simple**:

```text
Portfolio
   ↓
Risk drivers
   ↓
Historical + hypothetical shocks
   ↓
Portfolio response
   ↓
Decision / hedge / escalation
```

Our job is to make that workflow accessible through natural language.

---

## 7.2 The retail translation

Instead of exposing:

- covariance matrices;
- factor-loading matrices;
- Monte Carlo distributions;
- VaR decomposition;

we can expose:

### "What happens to me?"

For example:

> **Scenario:** BTC -8%, Nasdaq -4%, NVDA token -6%, USD +1%

Then show:

```text
YOUR PORTFOLIO

Estimated impact: -4.9%

Largest contributors
1. NVDA        -2.1%
2. BTC         -1.7%
3. ETH         -0.8%
4. QQQ         -0.5%

Hidden issue
You thought you owned four different assets.
The desk estimates you are effectively long one dominant
"AI / risk-on" factor.
```

This is the product's core translation layer:

> **institutional risk analytics → plain-language decision support.**

---

# 8. The golden niche: 7×24 cross-market decision stress testing

The strongest product territory combines four things that are rarely presented together:

1. **Tokenized equity microstructure**
2. **Crypto cross-asset context**
3. **Historical scenario retrieval**
4. **Personalized portfolio decision analysis**

This is more differentiated than a general stock copilot.

The key workflow is:

```text
USER HAS A TRADE IDEA
        ↓
"I want to buy NVDAon Sunday night."
        ↓
DESK RECONSTRUCTS MARKET STATE
        ↓
Token price vs reference
Liquidity / spread
News
Crypto
Macro
Portfolio
        ↓
THESIS DECOMPOSITION
        ↓
HISTORICAL ANALOGUES
        ↓
ADVERSARIAL STRESS TEST
        ↓
PORTFOLIO IMPACT
        ↓
DECISION MEMO
```

This aligns tightly with Bitget's Decision Stress Testing sub-theme while also satisfying the handbook's requirement for a complete research task from question to actionable insight.[3]

---

# 9. Product architecture blueprint

## 9.1 Core modules

### A. LUI / Conversation layer

Natural-language input:

> "I'm thinking of buying $1,500 of NVDAon Sunday. What am I missing?"

The interface should allow follow-ups without forcing the trader into forms.

### B. Market State Engine

Collect and normalize:

- token price;
- underlying/reference price;
- spread/basis;
- market hours;
- order-book depth;
- volatility;
- volume;
- crypto market state;
- macro state.

### C. Evidence & News Engine

Collect:

- corporate announcements;
- earnings/transcripts;
- macro releases;
- relevant geopolitical events;
- market news;
- social/sentiment signals.

### D. Thesis Engine

Convert the natural-language trade idea into testable assumptions.

### E. Historical Analogue Engine

Search for comparable market states/events.

### F. Stress Engine

Run:

- single-factor shocks;
- multi-factor shocks;
- historical event replay;
- token/underlying basis shocks;
- crypto-equity correlation shocks;
- liquidity/spread shocks.

### G. Portfolio Lens

Calculate:

- concentration;
- sector exposure;
- cross-asset exposure;
- beta;
- correlation;
- scenario P&L.

### H. Adversarial Reviewer

A separate reasoning pass whose job is to attack the thesis.

### I. Decision Memo

Produce the final actionable output.

---

# 10. Bitget integration strategy

Bitget's own developer toolkit makes this architecture practical. The S2 handbook says Agent Hub exposes 89 UTA v3 operations condensed into 14 intent verbs and includes market/account/trading capabilities. It also provides five research Skills that do not require an account or API key: macro analysis, market intelligence, news briefing, sentiment/positioning analysis, and technical analysis.[24]

The five research Skills are especially valuable for an AI Trading Desk:

| Skill | Desk role |
|---|---|
| `macro-analyst` | Fed, DXY, Nasdaq, gold, cross-asset regime |
| `market-intel` | ETF flows, whale activity, DeFi TVL, institutional/onchain context |
| `news-briefing` | Event discovery and narrative synthesis |
| `sentiment-analyst` | Fear & Greed, long/short ratio, funding, positioning |
| `technical-analysis` | Technical indicators and market structure |

Bitget explicitly recommends combining these research Skills as the perception layer for AI Trading Desk projects.[24]

This is strategically important because the judging rubric rewards **feature depth and skill integration count/effectiveness**. We should therefore use Bitget's native capabilities as actual components of the workflow rather than mentioning them only in the README.

---

# 11. Competitive teardown

## ChatGPT / general-purpose LLMs

### Strengths
- Flexible reasoning interface.
- Can synthesize diverse information.
- Increasing access to financial tools/data.
- Excellent natural-language interaction.

### Weaknesses for a serious trading workflow
- General-purpose rather than tokenized-equity-native.
- Requires the user to assemble the research workflow.
- Portfolio/risk state is not automatically reconstructed.
- Generic answers can create false confidence.

**Our response:** turn the prompt into a structured research workflow rather than merely a better answer.

---

## FinChat

FinChat already provides global financial data, fundamentals, KPIs, dashboards, estimates, ownership data, investor-relations content and AI research.[17]

**Do not compete on fundamental-data breadth.**

Compete on:

- tokenized equity microstructure;
- crypto/stock interaction;
- off-hours regimes;
- scenario stress testing;
- personalized portfolio decisions.

---

## Koyfin

Koyfin is a broad financial analytics and visualization platform serving investors, advisors and research teams.[18]

**Do not compete by building another charting terminal.**

Instead, make charts secondary evidence inside a reasoning workflow.

---

## Bloomberg Terminal / ASKB

This is the benchmark we should respect, not pretend doesn't exist.

Bloomberg now offers ASKB as a conversational AI layer across Bloomberg data, news, research and analytics, including multi-agent workflows, transparent attribution and structured research workflows.[16]

We cannot beat Bloomberg on data breadth.

We can potentially beat a generic Bloomberg-like concept on **one narrow new market problem**:

> "What does this tokenized equity trade mean for my portfolio while the underlying U.S. market is closed?"

---

## Perplexity Research

Perplexity's Research mode can conduct iterative multi-source research and synthesize reports, including for finance.[19]

Again, the differentiator cannot be "we research the web better."

It must be:

> **We understand the trading state, the position, the risk, and the market mechanics — not merely the documents.**

---

## TradeGPT

TradeGPT focuses on fast chart interpretation, technical patterns, levels, entry/stop/target plans and risk calculations.[20]

This validates demand for rapid AI-assisted trading interpretation, but it also shows the crowded nature of chart-reading products.

**Do not make chart analysis the product.** Make it one input to the decision engine.

---

# 12. Product differentiation: the "institutional risk officer" test

A judge should be able to ask:

> "Why isn't this just ChatGPT + Bloomberg?"

The answer should be:

> **Because the desk doesn't just answer market questions. It reconstructs a trade decision, identifies its assumptions, attacks those assumptions, models portfolio consequences and shows the trader what would invalidate the thesis.**

The five product principles should be:

### 1. Evidence before narrative

Every important claim is sourced and timestamped.

### 2. Portfolio before prediction

A good asset thesis can still be a bad portfolio decision.

### 3. Counter-thesis before confirmation

The system must actively search for evidence against the trade.

### 4. Scenario before confidence

Show what happens under different states rather than pretending to know one future.

### 5. Decision before essay

The final output must be actionable.

---

# 13. Proposed information architecture for the UI

## Workspace header

```text
MARKET STATE
US EQUITIES: CLOSED
TOKEN MARKET: OPEN
CRYPTO: OPEN
REGIME: HIGH UNCERTAINTY
```

## Main conversation

The trader asks a natural-language question.

## Evidence rail

```text
LIVE DATA
NEWS
MACRO
SENTIMENT
TECHNICAL
ONCHAIN
```

## Thesis panel

```text
YOUR THESIS
----------------
Catalyst
Expected move
Time horizon
Invalidation
Confidence
```

## Stress panel

```text
BASE CASE
BULL CASE
BEAR CASE
HISTORICAL ANALOGUE
CUSTOM SHOCK
```

## Portfolio panel

```text
POSITION
CONCENTRATION
CORRELATION
FACTOR EXPOSURE
SCENARIO P&L
```

## Decision panel

```text
DESK VERDICT
WAIT / PROCEED / REDUCE / REJECT

Why
What could invalidate this
What to monitor next
```

---

# 14. The "killer demo" scenario

## Scenario

**Sunday night.** U.S. markets are closed. Crypto is trading. A tokenized NVIDIA position is active.

The trader asks:

> **"I'm thinking of buying $2,000 of NVDAon before Monday because AI infrastructure demand still looks strong. I already hold BTC and QQQ. Stress-test this trade."**

The demo should take approximately two minutes.

---

## 0:00–0:15 — Understand the decision

The desk immediately extracts:

- asset: NVDAon;
- amount: $2,000;
- timing: Sunday/off-hours;
- thesis: AI infrastructure demand;
- existing exposures: BTC + QQQ;
- horizon: inferred short swing unless user specifies otherwise.

It asks no unnecessary questions.

---

## 0:15–0:35 — Reconstruct the live state

Show:

```text
NVDAon
Token price:       $X
Reference price:   $Y
Basis:             +Z%
Liquidity:         MEDIUM
Market:            CLOSED

BTC:               +/−X%
QQQ proxy:         +/−X%
Semis:             +/−X%
Volatility:        HIGH
```

Then show the top relevant news/events.

The point is to establish:

> **What is actually happening right now?**

---

## 0:35–0:55 — Decompose the thesis

The desk displays:

```text
THESIS

1. AI capex remains strong        ✓ / ?
2. NVDA fundamentals support it   ✓ / ?
3. Current price has upside        ?
4. Weekend token price is fair     ?
5. Portfolio can absorb exposure   ✕
```

This is where the desk starts becoming more than a chatbot.

---

## 0:55–1:20 — Attack the trade

The adversarial engine asks:

> "What would make this trade wrong?"

It retrieves historical analogues and runs scenarios such as:

### Scenario A

BTC −8%

### Scenario B

Nasdaq −4%

### Scenario C

NVDA token −6% before Monday open

### Scenario D

BTC −8% + Nasdaq −4% + token liquidity deterioration

The output is visual and simple:

```text
                 Portfolio impact
Base case             0.0%
BTC -8%              -1.8%
Nasdaq -4%           -2.6%
Combined shock       -5.7%
Liquidity shock      -6.4%
```

Numbers should be clearly labeled as **model estimates**, not forecasts.

---

## 1:20–1:40 — Find the hidden problem

The desk explains:

> **"Your NVDA thesis is not the primary risk. Your portfolio already carries overlapping AI/risk-on exposure through QQQ and BTC. The proposed purchase increases concentration into the same underlying macro regime."**

Then:

```text
YOUR TRADE
Good thesis:          YES
Good timing:          UNCERTAIN
Portfolio fit:        WEAK
Off-hours risk:       ELEVATED
```

---

## 1:40–1:55 — Actionable decision

The desk does not say:

> BUY / SELL.

It says:

> **WAIT / REDUCE SIZE**

Suggested rationale:

> "The evidence supports the fundamental thesis, but the incremental portfolio risk is unattractive before Monday's liquidity returns. Consider waiting for the underlying market to reopen or reducing the intended position size."

---

## 1:55–2:00 — Define what changes the decision

The final screen says:

```text
I WOULD CHANGE THIS VIEW IF:

• NVDAon basis compresses
• Nasdaq/semiconductor momentum confirms
• weekend risk premium falls
• portfolio concentration falls
• new information strengthens the catalyst
```

That final step is important. The product does not claim certainty.

It tells the trader **what to watch next**.

---

# 15. Metrics and validation plan

Bitget allows AI Trading Desk entries to use test-user, task-completion and usage data rather than trading-performance metrics.[3]

Because the project will be built under time pressure, the validation plan should be simple and credible.

## Primary metric — Decision Quality / Task Completion

Recruit a small set of traders/builders to complete predefined research tasks.

Example task:

> "Decide whether to add NVDAon to this portfolio before Monday open."

Measure:

- task completion rate;
- time to decision;
- number of sources manually searched before the desk;
- number of material risks identified;
- user-rated usefulness;
- percentage of outputs with correct source attribution;
- percentage of scenario calculations completed without manual intervention.

## Product targets

Label all targets clearly as targets rather than observed facts.

Suggested hackathon targets:

- ≥90% task completion;
- <3 minutes to a full decision memo;
- 100% source attribution for material external claims;
- ≥80% user-rated usefulness on predefined tasks;
- 0 fabricated market-data values in validation cases;
- 100% of recommendations accompanied by explicit uncertainty/invalidation conditions.

## Research quality benchmark

Create a 10–20 scenario evaluation set covering:

- earnings shock;
- macro shock;
- geopolitical event;
- crypto crash;
- sector rotation;
- weekend gap;
- high token premium;
- low liquidity;
- correlation breakdown;
- concentrated portfolio.

Score each output against an expert-written checklist.

---

# 16. Product roadmap

## MVP — required for hackathon

### Must ship

- natural-language trade idea input;
- Bitget research Skills integration;
- live/near-live market-state retrieval;
- news/event retrieval;
- thesis decomposition;
- historical analogue search;
- 3–5 preset stress scenarios;
- portfolio exposure input;
- adversarial counter-thesis;
- decision memo;
- source attribution;
- accessible demo.

## V1 — after hackathon

- persistent portfolio;
- trade journal;
- personal decision history;
- self-evolution/review module;
- custom scenario builder;
- token-vs-underlying basis monitor;
- off-hours liquidity monitor;
- watchlists;
- alerts.

## V2 — serious product

- automated factor model;
- portfolio optimizer;
- probabilistic scenario engine;
- historical event similarity model;
- execution assistant;
- broker/exchange connectivity;
- institutional risk APIs;
- team collaboration.

---

# 17. Product language / positioning

## Avoid

- "AI predicts the market."
- "Beat the market with AI."
- "Your AI trading genius."
- "Never lose again."
- "95% of trading bots are useless."
- "Institutional-grade Bloomberg killer."

These claims either create credibility problems or invite comparisons we cannot win.

## Prefer

### Positioning statement

> **An AI trading desk that stress-tests your trade before the market does.**

### Expanded

> Research the market, challenge your thesis, stress-test your portfolio, and understand what could go wrong — especially when tokenized equities keep trading after Wall Street closes.

### Core promise

> **Don't ask AI what to buy. Ask it what you're missing.**

### 7×24-specific promise

> **When the stock market closes, the information doesn't. Your risk desk shouldn't either.**

### Product philosophy

> **Evidence. Challenge. Stress. Decide.**

---

# 18. Exact six-part Bitget Google Form Project Description blueprint

The following is intentionally written as a submission-ready draft but should only be finalized after the actual product has generated real validation evidence. Bitget states that the first three sections carry the highest weight and requires the six parts in one Project Description field.[3]

## 1 · Thesis

**Working draft**

Tokenized U.S. equities are creating a market where information moves continuously even when traditional equity markets are closed. A trader can now hold and trade an equity-linked token on a Saturday or Sunday, while the underlying stock will not establish its next primary-market price until Monday. This creates a new decision problem: traders can act 24/7, but they do not have a continuous reference market, and off-hours liquidity, basis, cross-asset correlations and information quality can change rapidly.

We are building an AI Trading Desk that stress-tests a trader's proposed position before they act. Instead of answering generic questions such as "Is NVDA bullish?", the desk reconstructs the current market state, decomposes the trader's thesis into testable assumptions, retrieves relevant historical analogues, runs historical and hypothetical stress scenarios, evaluates portfolio concentration and cross-asset exposure, and produces an evidence-backed decision memo with explicit invalidation conditions.

The core hypothesis is that AI becomes materially more useful for trading when it is used as an **adversarial decision system**, not a prediction chatbot: the system should help a trader identify what they are missing, quantify how their portfolio could behave under stress, and understand what evidence would change the decision.

---

## 2 · Target user and product value

**Working draft**

Our primary user is a **crypto-native retail trader with approximately $5,000–$100,000 of deployable capital**, who already trades crypto and is beginning to use tokenized U.S. equities such as NVIDIA, Tesla, Apple, QQQ or SPY as part of a cross-asset portfolio. The user typically trades several times per month, is comfortable with 24/7 crypto markets, but lacks an institutional-style workflow for evaluating tokenized-equity positions during nights and weekends.

The desk is designed for traders who do not need another chart or generic market summary. Their problem is decision quality: understanding whether a trade idea is already priced into the token, how off-hours liquidity changes the risk, how the idea interacts with BTC/crypto/sector exposure, and what happens if the market moves against the thesis before the traditional market reopens.

The product value is a faster path from **trade idea → evidence → counter-thesis → stress test → actionable decision**.

---

## 3 · Validation data and key metrics

**Working draft — replace targets with observed results before submission**

We will validate the desk using a structured research-task benchmark and a small group of test users. Each test user will receive predefined trading scenarios involving tokenized U.S. equities, cross-asset exposure and off-hours market conditions. Users will be asked to reach a decision with and without the desk.

Primary observed metrics will include task completion rate, time to actionable insight, number of material risks identified, source-attribution accuracy, scenario completion rate and user-rated usefulness. We will also benchmark the system on a fixed scenario set covering earnings shocks, macro events, geopolitical shocks, crypto drawdowns, weekend gaps, liquidity deterioration, basis dislocations and portfolio concentration.

**Target metrics:** ≥90% task completion, <3 minutes to a complete decision memo, 100% source attribution for material external claims, ≥80% usefulness rating, and zero fabricated market-data values across the validation set. All target figures will be labeled as targets until observed.

For distribution, our initial target is to onboard a small group of crypto-native and retail-equity testers during the hackathon, collect qualitative feedback, and publish the resulting research-task findings with the final submission.

---

## 4 · Progress

**Working draft**

The project is being built as a natural-language research workbench with a modular research layer and a decision/stress-testing layer. The research layer integrates Bitget's market, macro, news, sentiment and technical-analysis capabilities. The reasoning layer converts a user's trade idea into explicit assumptions, retrieves evidence and historical analogues, and constructs a counter-thesis. The stress layer evaluates portfolio and scenario impacts before producing the final decision memo.

The hackathon MVP will focus on one high-value workflow: a trader proposes a tokenized-equity position during an off-hours period and asks the desk whether the trade makes sense. The system will demonstrate the complete flow from question to market-state reconstruction, evidence gathering, adversarial analysis, stress testing and actionable conclusion.

The remaining work is to finalize the scenario engine, validation benchmark, accessible demo and submission documentation.

---

## 5 · Deliverables

**Working draft**

1. Accessible AI Trading Desk demo.
2. Complete end-to-end research-task walkthrough.
3. Source-attributed research outputs.
4. Historical analogue and stress-test results.
5. Portfolio-impact visualization.
6. Decision memo with explicit uncertainty and invalidation conditions.
7. Scenario benchmark and validation report.
8. Source code / technical documentation.
9. Short demo recording showing the complete workflow.
10. Compliant X promotional post documenting the project and hackathon participation.

---

## 6 · Your take on AI Trading

**Working draft**

Our view is that the strongest near-term role for AI in trading is not pretending to replace market expertise with a single prediction. AI is more useful when it coordinates information, tools and structured reasoning around a human decision. Tokenized equities make this particularly interesting because the market is becoming continuous while traditional reference markets remain session-based.

We are therefore using AI as a research orchestrator, thesis decomposer and adversarial reviewer. Deterministic calculations remain responsible for portfolio arithmetic and scenario math, while the LLM is responsible for interpreting unstructured information, connecting evidence, challenging assumptions and presenting the result in natural language. This separation is intentional: the AI should be flexible where language and reasoning matter, and deterministic where numerical correctness matters.

---

# 19. Recommended product thesis

The evidence supports a narrower thesis than "AI trading assistant":

> **The emerging 7×24 tokenized-equity market creates a new class of trading decisions where the trader needs continuous information but cannot rely on continuous primary-market price discovery. The opportunity is an AI research desk that reconstructs the market state, attacks the trader's thesis, stress-tests portfolio consequences and explains what would change the decision.**

This thesis has three advantages:

1. **It is directly native to Bitget S2.** The handbook is explicitly about AI × U.S. stock trading and the 7×24 rToken environment.[3]
2. **It is differentiated from generic AI research.** The product is organized around a decision and its risks, not a general question-answering interface.
3. **It is feasible for the hackathon.** Bitget already supplies research Skills for macro, market intelligence, news, sentiment and technical analysis, allowing the project to concentrate on orchestration, stress testing, portfolio reasoning and UX.[24]

---

# 20. What we should build first

The first implementation should **not** be the entire trading desk.

The first vertical slice should be:

```text
Trade idea
   ↓
Market state
   ↓
Evidence
   ↓
Thesis decomposition
   ↓
Counter-thesis
   ↓
3 stress scenarios
   ↓
Portfolio impact
   ↓
Decision memo
```

If this vertical slice is excellent, the rest of the product can grow around it.

If this vertical slice is weak, adding more indicators, more agents or more charts will not save the product.

---

# 21. Research conclusions and product implications

| Research finding | Product implication |
|---|---|
| Tokenized securities can represent traditional securities through different legal/technical structures.[4][5] | Model asset structure and rights explicitly; don't treat all rTokens as identical. |
| xStocks are 1:1-backed and tradeable 24/7.[6] | Separate token availability from underlying market hours. |
| Ondo provides 24/5 mint/redeem broadly and 24/7 for selected assets.[10] | Track primary-market availability separately from secondary trading. |
| xChange spreads widen outside market hours.[7] | Include off-hours spread/liquidity state in trade analysis. |
| Bybit warns of deviations caused by liquidity, latency and depth.[11] | Treat basis deviations as risk, not automatic arbitrage. |
| Academic evidence finds wider token/underlying price gaps outside core hours.[2] | Make market regime a first-class input. |
| Binance Research found substantial off-hours bStocks volume and strong weekend price discovery in a short sample.[1] | Weekend token price is potentially informative, but should be presented with uncertainty and sample caveats. |
| Active individual trading has historically hurt returns.[14] | Add decision friction and challenge before action. |
| Retail trading can be contrarian around earnings surprises.[15] | Use an adversarial reviewer around news/earnings. |
| Institutional risk platforms use factors, scenarios and stress tests.[12][22] | Translate institutional risk workflows into natural language. |
| Bloomberg/FinChat/Koyfin/Perplexity already provide broad research capabilities.[16][17][18][19] | Compete on workflow specificity, not generic research breadth. |
| Trader communities distrust generic LLM trading advice and emphasize grounding/testing.[21] | Use deterministic data calculations, explicit evidence, timestamps and validation. |

---

# 22. Sources

1. Binance Research, **"Stock Price Discovery Moves On-Chain,"** July 29, 2026. https://www.binance.com/en/research/analysis/stock-price-discovery-moves-on-chain
2. Journal of International Financial Markets, Institutions and Money, **"Fractional and around the clock: Trading activity in tokenized financial assets,"** Volume 110, July 2026, Article 102355. https://doi.org/10.1016/j.intfin.2026.102355
3. Bitget AI Base Camp Hackathon S2 Handbook, **"Base Camp Hackathon S2 EN,"** current 2026 handbook. https://bitget-ai.gitbook.io/bitgetai_hackathons2
4. U.S. Securities and Exchange Commission, **"Statement on Tokenized Securities,"** January 28, 2026. https://www.sec.gov/newsroom/speeches-statements/corp-fin-statement-tokenized-securities-012826-statement-tokenized-securities
5. FINRA, **"Crypto Assets" / Tokenized Securities guidance.** https://www.finra.org/investors/investing/investment-products/crypto-assets
6. xStocks, **"Tokenized Equities — The Stock Market, Onchain,"** current product site. https://xstocks.com/
7. xStocks Docs, **"xChange — Atomic RFQ,"** current documentation. https://docs.xstocks.fi/docs/issuance-and-redemption/atomic-rfq-xchange
8. Backed Assets, **"Backed NVIDIA (bNVDA) — Product Details,"** current product page. https://assets.backed.fi/products/bnvda
9. Backed, **"The Future is xStocks — Upgrading bTokens,"** 2026. https://backed.fi/news-updates/the-future-is-xstocks-upgrading-btokens
10. Ondo Finance, **"Ondo Stocks,"** current product page. https://ondo.finance/ondo-stocks
11. Bybit, **"xStocks Terms and Conditions,"** 2026. https://www.bybit.com/common-static/compliance/legal/BYBIT/485dfd009557eff45012412ea14a79f5.pdf
12. BlackRock Aladdin, **"Risk Management Services / Aladdin Risk,"** current product documentation. https://www.blackrock.com/aladdin/platforms/products/aladdin-risk
13. Ivković, Sialm & Weisbenner, **"Portfolio Concentration and the Performance of Individual Investors,"** NBER Working Paper 10675. https://www.nber.org/papers/w10675
14. Barber & Odean, **"Trading Is Hazardous to Your Wealth: The Common Stock Investment Performance of Individual Investors,"** Journal of Finance, 2000. https://doi.org/10.1111/0022-1082.00226
15. Luo, Ravina, Sammon & Viceira, **"Retail Investors' Contrarian Behavior Around News, Attention, and the Momentum Effect,"** NBER Working Paper 34086, 2025. https://www.nber.org/papers/w34086
16. Bloomberg Professional Services, **"AI on Bloomberg / ASKB,"** current product documentation. https://professional.bloomberg.com/products/bloomberg-terminal/ai/
17. FinChat, **"The Complete AI Powered Stock Research Platform,"** current product site. https://finchat.io/
18. Koyfin, **"Comprehensive Financial Data Analysis,"** current product site. https://www.koyfin.com/
19. Perplexity Help Center, **"What is Research mode?,"** updated July 16, 2026. https://www.perplexity.ai/help-center/en/articles/10738684-what-is-research-mode
20. TradeGPT, **"AI Trading Assistant: Read Any Chart in Seconds,"** current product documentation. https://tradegpt.app/ai-trading-assistant
21. r/algotrading community discussion, **"LLMs are not the right tool for algo trading,"** January 2026. https://www.reddit.com/r/algotrading/comments/1qbvzxn/llms_are_not_the_right_tool_for_algo_trading/
22. BlackRock Aladdin Wealth, **"Power of Stress Testing with Aladdin Wealth,"** current product documentation. https://www.blackrock.com/aladdin/platforms/solutions/aladdin-wealth/insights/power-of-stress-testing
23. U.S. Securities and Exchange Commission, **"Use of Derivatives by Registered Investment Companies and Business Development Companies — Small Entity Compliance Guide,"** risk-management/stress-testing requirements. https://www.sec.gov/resources-small-businesses/small-business-compliance-guides/use-derivatives-registered-investment-companies-business-development-companies-small-entity
24. Bitget AI Base Camp Hackathon S2 Handbook, **Developer Toolkit / Bitget Agent Hub and research Skills.** https://bitget-ai.gitbook.io/bitgetai_hackathons2

---

# 23. Evidence discipline and limitations

This dossier deliberately separates **observed facts** from **product hypotheses**.

The strongest current 7×24 market evidence is still early-stage. Binance's weekend study covers seven weekends and one major venue/product family; the 92% statistic should therefore be presented as an observed sample result, not as a permanent law of tokenized-equity markets.[1] The academic evidence is broader but still reflects an evolving tokenized-asset market and should not be assumed to represent every issuer, venue or token.[2]

Likewise, statements such as "retail traders suffer from revenge trading" are better treated as behavioral design hypotheses unless tied to specific empirical evidence. The evidence base is strongest for overtrading, overconfidence, attention effects, contrarian behavior around news and concentration/risk trade-offs.[13][14][15]

Finally, the competitive teardown does not claim that current products are bad. Quite the opposite: Bloomberg, FinChat, Koyfin, Perplexity and specialized trading tools have raised the baseline substantially. The strategic opportunity is therefore **specialization around a new market structure and a high-value decision workflow**, not trying to recreate an entire financial terminal.

---

# 24. Bottom line

The product should not be:

> **"ChatGPT for trading."**

It should be:

> **"An AI risk-and-research desk for decisions that happen when the normal market structure breaks."**

The strongest wedge is:

> **Trade idea → evidence → adversarial challenge → historical analogue → stress test → portfolio impact → decision.**

And the defining market insight is:

> **Tokenized equities make the market continuous, but the information and liquidity regime is not continuous.**

That mismatch is where the product has a reason to exist.


