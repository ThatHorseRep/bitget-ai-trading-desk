# Bitget AI RedTeam Desk

[![CI](https://github.com/ThatHorseRep/bitget-ai-trading-desk/actions/workflows/ci.yml/badge.svg)](https://github.com/ThatHorseRep/bitget-ai-trading-desk/actions/workflows/ci.yml)

Implementation workspace for the **Bitget AI Base Camp Hackathon S2**.

## About the Project
Bitget AI RedTeam Desk is a pre-trade decision-support product designed specifically for the unique structural risks of tokenized U.S. equities on Bitget. It acts as an adversarial "Red Team" against a user's proposed trade, isolating fundamental market rationale from off-hours execution risk and stressing the position mathematically before capital is deployed.

For full details on the project, the target user, the core job, and the role of the LLM, please see the [PRODUCT_DESCRIPTION.md](./PRODUCT_DESCRIPTION.md) file.

## Getting Started

### Prerequisites
- Node.js 22+ (required: the test script uses `--env-file-if-exists`, available from Node 22)
- npm

### Installation
```bash
npm install
```

### Configuration
Copy the example environment file and add your OpenAI-compatible LLM endpoint and key:
```bash
cp .env.example .env.local
```
Update `.env.local` with your `LLM_API_KEY` and `LLM_API_BASE_URL`.

### Running the Application (UI)
Start the Next.js development server to interact with the UI:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. 
To test the Hackathon "Demo Wedge" (Off-Hours Trading), click the **"Official scenario"** button in the UI.

### Running Tests
The deterministic engine and LLM integration can be tested using the automated test suite:
```bash
npm run test
```
*(Note: If you encounter rate limit errors, wait 60 seconds and try again, or test manually via the UI).*

## Implementation Map (Capabilities)
- **Natural Language Trade Parsing & Thesis Extraction:** Deterministic parsing in src/core/trade/parser.ts; LLM thesis extraction in src/core/thesis/extractor.ts.
- **Adversarial Challenge (Red Teaming):** Implemented in src/core/thesis/challenger.ts.
- **Deterministic Scenario Stress Testing (P&L, basis, liquidity):** Implemented in src/core/scenarios/engine.ts.
- **Thesis vs Position Assessment:** Deterministic position quality in src/core/decision/classifyPosition.ts; LLM thesis-quality synthesis in src/core/thesis/assessment.ts.
- **Deterministic Decision Policy:** Implemented in src/core/decision/policy.ts.
- **Transparent Demo Mode (Off-Hours Wedge):** Fixture data in src/fixtures/rnvda-demo.ts; triggered via the header toggle and src/components/workspace/TradeInputSurface.tsx, processed in src/app/api/stress-test/route.ts.
- **Optional Ecosystem Integrations (enrichment, not dependencies):** The core decision is fully defensible with zero optional integrations enabled. Optional providers/handoffs — Bitget US Equity MCP, Bitget Signal, Chainbase AgentKey (external partner, not a Bitget product), Agent Hub read-only handoff, Agentic Account handoff, and a demo-only paper-trading harness — are documented in [B07_Optional_Bitget_Ecosystem_Integrations.md](./B07_Optional_Bitget_Ecosystem_Integrations.md), including their implemented vs external/agent-host status and safety boundaries. No autonomous trading exists in any configuration.
- **Portfolio Context/Impact:** Marked as FUTURE/DEFERRED in documentation (not implemented in MVP).

## Architecture & Specifications
The official product specs and architecture documents (B01-B07) are located in the root directory. Early research drafts and planning notes have been archived in the `docs/archive/` folder.



