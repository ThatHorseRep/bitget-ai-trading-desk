# B06: Hackathon Demo and Quality

## 1. Purpose and Scope
This document specifies the strategy and requirements for the Bitget AI Base Camp Hackathon S2 final submission and live demonstration. It ensures the product's unique value proposition (decision support for 24/7 tokenized equities) is clearly visible to judges regardless of when they review the project.

## 2. The Demo Wedge: Off-Hours Trading
The core differentiator of the Bitget AI RedTeam Desk is handling structural risk during periods when the reference equity market (NYSE/Nasdaq) is closed but the Bitget token (rNVDA) remains tradable.

### 2.1 The Timing Problem
If a hackathon judge reviews the project at 2:00 PM EST on a Wednesday, the reference market is open, liquidity is likely normal, and basis is tight. The most interesting stress scenarios (off-hours basis un-anchoring) won't trigger naturally.

### 2.2 The "Demo Mode" Solution
The application must include a developer/demo toggle (e.g., `useFixture=true` or a UI switch).
When activated, the system:
1. Forces the `sessionStatus` to `WEEKEND`.
2. Fixes the `referencePrice` to a specific Friday close (e.g., $118.00).
3. Assumes a token basis premium (e.g., Token trading at $121.50).
4. **Transparency Rule:** The UI must visibly display a banner: "DEMO MODE: Simulating Weekend Off-Hours Session" so judges know we are not faking live data silently.

## 3. The Core Demo Script
The submission video and README must walk through this exact scenario:

**Step 1: The Input**
> "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it."

**Step 2: Market Reconstruction**
The UI shows live (or demo) Bitget prices, confirming the U.S. market is CLOSED but the token is tradable.

**Step 3: The Challenge**
The AI acknowledges the strong AI infrastructure thesis, but attacks the position: *"You are paying a 3% premium on a weekend when BTC is weakening. You have 65.5 hours of un-anchored basis risk before Monday's open."*

**Step 4: Stress Tests**
The deterministic engine shows the exact USD loss if a Crypto Contagion shock (-8% BTC) and a Basis Widening (+3%) hit the $2,000 position simultaneously.

**Step 5: The Verdict**
The final artifact splits the judgment:
- **Thesis:** STRONGER
- **Position:** WEAKER
- **Verdict:** WAIT

## 4. Submission Artifacts
To satisfy all Bitget Hackathon S2 requirements, the final commit must include:
1. **The Codebase:** The Next.js repository with no hidden backend services.
2. **Project Description:** Covering Target User, Core Job, and Validation Metrics.
3. **Role of the LLM:** A clear statement that the LLM is used for thesis extraction and adversarial reasoning, but NEVER for deterministic market calculations (P&L, basis).
4. **X (Twitter) Post:** The obligatory `#BitgetHackathon @Bitget_AI` post demonstrating the UI.

## 5. Quality Gates
Before the final build is tagged:
- **Live Connectivity:** Can the backend successfully hit `api.bitget.com` without CORS/DNS issues in production (e.g., on Vercel)?
- **Graceful Degradation:** If the Yahoo Finance reference price fails, does the app still work using token-only data? (Yes, the UI must handle `referencePrice: null` gracefully).
- **Static Checks:** `npm run build` must pass with zero TypeScript errors.


