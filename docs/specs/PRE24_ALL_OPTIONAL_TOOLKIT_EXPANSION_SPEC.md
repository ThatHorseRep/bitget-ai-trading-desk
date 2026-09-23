# PRE-24 — Bitget AI RedTeam Desk
# All-Optional-Toolkit Expansion Specification

Status: Prepared for the current ~23-complete project state  
Purpose: Safely add **all relevant optional Developer Toolkit / ecosystem capabilities** from Bitget AI Base Camp Hackathon S2 without destabilising the working RedTeam Desk.

---

## 0. READ THIS FIRST

This document is **not** a request to rebuild the product.

The current RedTeam Desk already has a defined product identity, a deterministic risk core, a natural-language trade workflow, AI thesis/challenge/assessment passes, provenance, a demo fixture, streaming analysis, and a deployed Vercel target.

The mission here is narrower:

> Keep the existing product intact while adding the maximum amount of **real, demonstrable, correctly-labelled Bitget ecosystem depth** that can be added safely before the hackathon.

The optional integrations are valuable only when they are real.

Do not:

- add a fake MCP checkbox;
- add a fake “Agentic account connected” label;
- paste API keys into the repository;
- move deterministic calculations into an LLM;
- let external tools replace the current risk engine;
- turn the product into a generic trading terminal;
- make the core decision workflow depend on an optional provider;
- introduce autonomous live execution;
- add a dashboard simply to display integrations;
- claim Chainbase AgentKey is a Bitget product;
- claim Playbook backtesting is required for Track 3;
- claim an integration is complete when only documentation has been added.

The rule is:

> **Real capability, isolated boundary, explicit provenance, safe default, graceful failure, verified before proceeding.**

---

# 1. WHY WE ARE ADDING THESE THINGS

The Hackathon S2 Developer Toolkit describes the AI Trading Desk path as:

- `bitget-mcp-server` for U.S. stock / ETF information;
- `bitget-signal` for crypto-side research Skills;
- optional Agent Hub execution assistance using `--read-only`, or an Agentic account for human-confirmed orders;
- Playbook as generally unnecessary for the AI Trading Desk unless strategy validation is part of the demo;
- Chainbase AgentKey as an optional external partner add-on.

The handbook also strongly recommends safe modes such as `--read-only` and `--paper-trading`.

The purpose of this expansion is not to turn every item into the primary experience. The purpose is to make the RedTeam Desk visibly capable of using the ecosystem around the same core research decision.

The desired result is:

```text
                 ┌───────────────────────────┐
                 │   REDTEAM DESK CORE        │
                 │                           │
User trade ───→  │ normalize → research →   │
                 │ challenge → stress →      │
                 │ decide → artifact         │
                 └─────────────┬─────────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
          READ-ONLY RESEARCH        OPTIONAL ACTION HELP
                  │                         │
      ┌───────────┼───────────┐       ┌─────┴─────────────┐
      │           │           │       │                   │
 Bitget US    Bitget      Chainbase  Agent Hub        Playbook /
 MCP          Signal      AgentKey   read-only /       GetAgent
      │           │           │       Agentic           │
      └───────────┴───────────┘       │                  │
                 │                    │                  │
                 └──────── Evidence ──┴──── Handoff ─────┘
                                  ↓
                           Decision Artifact
```

The deterministic core remains the authority for numerical results.

---

# 2. CURRENT-STATE ASSUMPTIONS

The current repository should be treated as approximately 23-complete.

Already-established components include:

- Bitget market-state retrieval;
- reference-price retrieval;
- evidence retrieval;
- thesis extraction;
- adversarial challenge;
- deterministic scenario calculations;
- deterministic position quality;
- deterministic decision policy;
- provenance compilation;
- demo fixture / off-hours mode;
- NDJSON progress streaming;
- structured error handling;
- B01–B06 product specifications;
- Product Description;
- current prompt book;
- Vercel deployment target.

Do not recreate any of those.

---

# 3. A CURRENT SPEC DRIFT TO PRESERVE

B02 currently says **Basic relevant portfolio context** is a MUST-BUILD MVP capability and also lists paper-trading handoff as SUPPORTING.

The README / Product Description still describe live portfolio integration as deferred.

Do not quietly rewrite one document to make the mismatch disappear.

The implementation agent must first inspect the current code and decide whether portfolio context is already present. If not, record it as a separate known gap or implement only the smallest basic context required by the existing product specification.

Do not build a full portfolio manager.

---

# 4. TOOLKIT CAPABILITY MATRIX

## 4.1 Bitget US Equity / ETF MCP

Canonical handbook role:

- read-only U.S. stock / ETF quotes;
- historical data;
- company fundamentals;
- corporate actions;
- analyst / institutional information;
- ETF data;
- related news / sentiment.

Handbook connection:

`https://agent.bitget.com/mcp`

Important:

This is conceptually different from Bitget Agent Hub's trading MCP.

Use it as a **research data source**.

Safety:

- no account credentials;
- no order capability;
- strict timeout;
- schema validation;
- source timestamps;
- provenance in Decision Artifact;
- fallback to current reference provider if unavailable.

Preferred result:

The Market State / Evidence layer can say:

```text
US EQUITY RESEARCH SOURCE
Source: Bitget US Equity MCP
Data: NVDA quote / reference / company context
Observed: <timestamp>
```

The user should never see the system pretending that an unavailable source was used.

---

## 4.2 Bitget Signal

Current official ecosystem package:

`@bitget-ai/bitget-signal`

The official package provides five market-analysis Skills:

1. `macro-analyst`
2. `market-intel`
3. `news-briefing`
4. `sentiment-analyst`
5. `technical-analysis`

The package combines local Skill instructions with a public market-data MCP. No Bitget account or API key is required.

Use these as **research enrichment**, not as a replacement for the RedTeam workflow.

Suggested decision relevance:

| Signal | When useful |
|---|---|
| Macro | Fed, rates, DXY, Nasdaq / cross-asset context |
| Market Intel | ETF flows, whales, institutional / on-chain context |
| News Briefing | Recent event/narrative discovery |
| Sentiment | Fear/Greed, funding, positioning |
| Technical Analysis | Momentum / indicator context |

Do not force all five into every trade.

The system may route to one or more based on relevance, but all five should be technically supported.

---

# 5. CHAINBASE AGENTKEY

Chainbase AgentKey is an **external partner service**, not a Bitget product.

The official handbook describes it as a unified data layer for:

- market;
- on-chain;
- news;
- social;
- company data.

Its recommended architecture is:

```text
Your App → AI Agent → AgentKey → External Data Sources
```

This distinction matters.

Do not describe AgentKey in the UI or README as:

- "Bitget AgentKey";
- "Bitget MCP";
- "official Bitget data".

Call it:

> Chainbase AgentKey — optional external research provider.

Safe implementation:

1. Add an optional AgentKey research provider boundary.
2. Never store its secret in source control.
3. Never make the core workflow depend on it.
4. Keep its returned observations tagged with provider identity.
5. Feed only validated, structured observations into the same EvidenceItem boundary.
6. If AgentKey is unavailable, the desk continues with Bitget/MCP/Signal/current providers.
7. Do not add a dozen new UI panels.
8. Expose it through the existing progressive-disclosure provenance system.

Best judge-visible use:

> A multi-signal research decision where the Desk can combine market + on-chain + news/social/company context while retaining one final human decision artifact.

---

# 6. BITGET AGENT HUB — READ-ONLY

The handbook explicitly permits optional execution assistance via Agent Hub.

For a safety-first implementation, first support:

```text
Agent Hub / bitget-agent-mcp
--read-only
```

This mode should not place orders.

The official Agent Hub ecosystem currently uses:

- `@bitget-ai/bitget-agent-mcp` for the desktop MCP surface;
- `@bitget-ai/bitget-agent-cli` for terminal AI;
- `@bitget-ai/bitget-agent-skill` for terminal reasoning instructions.

The read-only mode is the intended first safety gate.

Implementation goal:

> Make the RedTeam Desk capable of handing research context to a Bitget Agent Hub environment while guaranteeing that the application itself cannot silently turn that handoff into an order.

Possible handoff payload:

```json
{
  "asset": "rNVDAUSDT",
  "intent": "review-only",
  "decisionArtifactId": "...",
  "marketState": "...",
  "thesis": "...",
  "challenge": "...",
  "scenarios": "...",
  "decision": "WAIT",
  "humanConfirmationRequired": true,
  "executionAllowed": false
}
```

Do not add "Buy", "Sell", or hidden order functions merely because Agent Hub can technically support them.

---

# 7. AGENTIC ACCOUNT — HUMAN-CONFIRMED ONLY

The handbook describes Agentic Account as a dedicated account for the Agent, with isolated funds, quota control, no withdrawals, and OAuth.

The current official connection guide says the OAuth flow should be started by the MCP; the agent should not manually construct authorization URLs or ask the user to paste API keys.

Therefore:

### Allowed

- provide an Agentic-account handoff;
- invoke the official OAuth-capable Agent Hub flow;
- confirm authorization status;
- show "ready for human-confirmed execution";
- use isolated / demo environments;
- require explicit confirmation before any order.

### Forbidden

- storing the user's Agentic credentials in the repo;
- asking the user to paste a secret into the application;
- generating a fake OAuth URL;
- placing an order automatically after analysis;
- converting the RedTeam Desk into an autonomous trader.

The core product remains:

> AI assists. Human decides.

The optional execution capability is:

> Human explicitly confirms. Agent Hub performs the chosen action.

---

# 8. PAPER TRADING

Paper trading is not required to prove Track 3.

But it is a strong safety and credibility enhancement.

Use:

```text
--paper-trading
```

with a separate Bitget Demo API credential.

The purpose in this project is:

- prove the optional execution path;
- demonstrate that the handoff can be rehearsed without real capital;
- produce a clear safety story;
- validate integration behavior before any human-confirmed live capability.

Do not treat paper trading logs as evidence of production performance.

Do not claim a paper result is a live result.

---

# 9. PLAYBOOK / GETAGENT

Playbook is not normally necessary for an AI Trading Desk.

Because the user explicitly wants every optional advantage, include it as an **optional validation companion**, not as the Desk's main workflow.

Safe product concept:

```text
Decision Artifact
       ↓
"Validate as Strategy" (optional)
       ↓
GetAgent Skill / Playbook
       ↓
Local validation
       ↓
Sandbox backtest
       ↓
Human review
       ↓
Optional publish
```

Rules:

- never auto-publish;
- never let Playbook determine the RedTeam verdict;
- never replace deterministic scenario stress testing;
- never call a backtest a guarantee;
- keep all Playbook metrics labelled as external validation;
- the core Desk should still function if Playbook is unavailable;
- publish should require explicit user approval;
- paper trading must remain separate from live trading.

Because Playbook is more naturally aligned with strategy validation, the UI should describe it as:

> Optional Strategy Validation

not:

> Core Decision Engine.

---

# 10. GETAGENT SKILL

The official handbook pairs GetAgent Skill with Playbook.

Treat it as a developer / agent-side integration.

The codebase should contain:

- an export format;
- a documented strategy specification derived from the Decision Artifact;
- a safe local validation command;
- instructions for an AI agent to use the official GetAgent Skill;
- a verification checklist.

Do not copy third-party skill source into the repo unless licensing and necessity are clear.

Prefer using the official install command.

---

# 11. WHAT MUST NEVER CHANGE

The following architectural invariants survive every optional integration:

### 11.1 Deterministic math remains deterministic

The LLM does not calculate:

- P&L;
- basis;
- spread;
- quantity;
- scenario arithmetic;
- position quality.

### 11.2 Evidence remains traceable

Every new source must have:

- provider;
- source name;
- observation/retrieval timestamp;
- source state;
- relevant source reference where available.

### 11.3 Optional providers cannot become hidden dependencies

Any provider may fail.

The Desk must:

- show the failure;
- continue if safe;
- downgrade the analysis when needed;
- never invent a missing observation.

### 11.4 No autonomous execution

No feature flag may secretly enable autonomous live orders.

### 11.5 Human decision remains final

The Desk can recommend a product-generated verdict such as Proceed / Wait / Reduce / Reject, but the user makes the actual trading decision.

### 11.6 The product remains one workspace

Do not build:

- a generic dashboard;
- a separate research portal;
- a portfolio-management terminal;
- an alert center;
- a huge integrations settings page.

Optional capabilities should appear where they help the current decision.

---

# 12. FEATURE-FLAG PLAN

Use separate capabilities.

Suggested names:

```text
ENABLE_BITGET_US_MCP
ENABLE_BITGET_SIGNAL
ENABLE_CHAINBASE_AGENTKEY
ENABLE_AGENT_HUB_READ_ONLY
ENABLE_AGENTIC_HANDOFF
ENABLE_PAPER_TRADING
ENABLE_PLAYBOOK_VALIDATION
ENABLE_PLAYBOOK_PUBLISH
```

Default safety:

```text
Research integrations:
    false until verified, then true if stable

Agent Hub read-only:
    false until verified

Agentic handoff:
    false until user completes OAuth / local setup

Paper trading:
    false until a Demo account is confirmed

Playbook validation:
    true only when explicitly configured

Playbook publish:
    ALWAYS false by default
```

Do not put secrets in client-side environment variables.

---

# 13. PROVIDER ARCHITECTURE

Create one generic concept for external research:

```ts
interface ExternalResearchProvider {
  id: string;
  capabilities: string[];
  isAvailable(): Promise<boolean>;
  retrieve(query: ResearchQuery): Promise<ResearchObservation[]>;
}
```

Then implement separate adapters:

```text
BitgetUsEquityMcpProvider
BitgetSignalProvider
ChainbaseAgentKeyProvider
CurrentEvidenceProvider
```

The core should receive normalized evidence, not raw MCP responses.

A useful internal flow:

```text
External tool
   ↓
Adapter
   ↓
schema validation
   ↓
normalization
   ↓
provenance
   ↓
EvidenceItem[]
   ↓
DecisionDeskService
```

This allows you to add and remove providers without changing the risk engine.

---

# 14. SOURCE ARBITRATION

Multiple providers may report different values.

Never silently pick a convenient number.

Record:

- provider;
- value;
- observation timestamp;
- freshness;
- confidence/quality state if already supported;
- whether the observation agrees or conflicts with another source.

When sources conflict:

```text
CONFLICT DETECTED
Source A: ...
Source B: ...
```

The LLM may discuss the conflict.

It must not resolve it by inventing a third number.

---

# 15. ERROR AND TIMEOUT POLICY

Each optional integration needs:

- short timeout;
- bounded response size;
- schema validation;
- no unbounded retries;
- provider-specific error status;
- graceful fallback;
- provenance state.

Suggested lifecycle:

```text
AVAILABLE
↓
FETCHING
↓
VALIDATED
↓
USED

or

FETCHING
↓
TIMEOUT / INVALID / UNAVAILABLE
↓
NOT USED
↓
LIMITATION RECORDED
```

---

# 16. VERCEL / SERVERLESS RULE

Do not assume that a local stdio MCP server can be launched inside a Vercel request.

The implementation agent must distinguish:

### Web-deployable integration

A remote HTTP API/MCP endpoint that can safely be called from the server.

### Developer/agent-host integration

A local MCP/CLI/Skill that belongs in Cursor, Codex, Claude, etc.

### User-external integration

A browser/OAuth flow that the user must explicitly perform.

Never fake a web integration because the official tool is designed for a local AI host.

---

# 17. JUDGE-VISIBLE EXPERIENCE

The final product should remain visually simple.

Use the current Decision Artifact / provenance disclosure.

A judge should be able to discover:

```text
Research Sources
───────────────
Bitget US Equity
Bitget Signal
Chainbase AgentKey
```

and, when configured:

```text
Optional Action
───────────────
Review with Bitget Agent
Human confirmation required
```

and:

```text
Optional Strategy Validation
───────────────
Open in Playbook
```

These should be secondary actions, not the first thing the judge sees.

---

# 18. THE IDEAL SHOWCASE FLOW AFTER THESE ADDITIONS

### Main story

1. User enters the rNVDA trade.
2. Desk reconstructs market state.
3. Desk gathers US-equity information.
4. Desk gathers crypto-side signals.
5. Optional AgentKey adds a cross-source observation where relevant.
6. AI extracts thesis.
7. AI Red Team challenges it.
8. Deterministic engine stress-tests the position.
9. Decision Artifact shows source provenance.
10. Human makes the decision.

### Optional second story

From the same artifact:

11. User chooses "Review with Bitget Agent".
12. Read-only Agent Hub verifies relevant account/market context.
13. No write is possible in read-only mode.

### Optional third story

14. User chooses "Validate as Strategy".
15. GetAgent/Playbook validates or backtests the strategy independently.
16. Results are labelled as external validation.
17. Nothing automatically trades.

This gives the project more ecosystem depth without sacrificing its identity.

---

# 19. NON-CODE OPTIONAL HACKATHON ADVANTAGES

These are not application features, but they should also be prepared.

The handbook currently provides:

- University Special Prize: fill the full university name in the submission form if eligible.
- Demo Day application: all teams can check the box at submission.
- Best Spread Award: publish progress on X and attach the team's own qualifying X post.
- Qwen build credits: separate application; not required for hackathon participation.
- K3 post-event subsidy: opt in through the project submission form.
- Playbook productization opportunity for high-quality entries selected for review.

These belong in the final submission checklist, not in the application architecture.

---

# 20. SUCCESS CRITERIA

The optional expansion is successful only when all of the following are true:

### Core

- Existing main workflow still works.
- Existing tests still pass.
- Build still passes.
- Vercel deployment still works.
- Demo Mode still works.
- Decision Artifact still works.

### Research

- Bitget US MCP is either actually queried or explicitly documented as unavailable.
- Bitget Signal is either actually queried or explicitly documented as host-side only.
- Chainbase AgentKey is either actually integrated or explicitly documented as agent-side only.
- Every used source has provenance.

### Safety

- No secrets committed.
- No live orders occur automatically.
- Read-only mode is verified.
- Paper trading is verified separately if enabled.
- Agentic OAuth follows the official flow.
- Playbook publication requires explicit approval.

### Product

- No dashboard creep.
- No generic chatbot creep.
- No duplicate market-data layers without justification.
- The Desk remains recognisably the RedTeam Desk.

### Submission

- README accurately describes what is actually implemented.
- Product Description does not claim incomplete integrations.
- B06 and any new B07/B08 specification matches the code.
- Optional toolkit integrations are explicitly named.
- External partner tooling is clearly attributed.

---

# 21. DEFINITION OF DONE

Do not mark the expansion "done" because package installation worked.

Mark a capability done only if:

```text
Installed
↓
Connected
↓
Called
↓
Returned real data
↓
Validated
↓
Normalized
↓
Stored with provenance
↓
Reached the intended product layer
↓
Displayed or handed off correctly
↓
Failure mode tested
↓
Tests/build pass
↓
Documentation matches reality
```

---

# 22. SOURCES

Bitget AI Base Camp Hackathon S2 handbook:
https://bitget-ai.gitbook.io/bitgetai_hackathons2

Developer Toolkit:
https://bitget-ai.gitbook.io/bitgetai_hackathons2#v.-developer-toolkit

Bitget Agent Hub:
https://github.com/Bitget-AI/agent_hub

Bitget Agent MCP:
https://github.com/Bitget-AI/agent-mcp

Bitget Signal:
https://www.npmjs.com/package/@bitget-ai/bitget-signal

Bitget Agentic Account connection guide:
https://www.bitget.com/support/articles/12560603894122

GetAgent / Playbook instructions:
See Developer Toolkit section of the S2 handbook.

Chainbase AgentKey:
https://agentkey.app

Current RedTeam Desk repository:
https://github.com/ThatHorseRep/bitget-ai-trading-desk
