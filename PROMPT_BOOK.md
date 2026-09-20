# PROMPT BOOK: Bitget AI RedTeam Desk

This document is the operational manual for building the Bitget AI RedTeam Desk. It defines the exact prompts to feed into fresh AntiGravity conversations to execute the remaining build phases.

**CRITICAL INSTRUCTION FOR AI OPERATORS:** Do not rely on hidden conversation history. Read the relevant Markdown specs (B01-B07) and inspect the codebase before writing code. You must execute the **Audit Prompt** before ending your conversation and committing the code. (B07 defines the optional ecosystem integrations and their safety boundaries — when working on anything integration-related, treat B07's non-negotiable claims discipline as binding: core first, enrichment second, no hidden dependencies, no autonomous trading.)

---

## P01: INFRASTRUCTURE & DATA VERIFICATION

### PURPOSE
Verify that the deployed environment can actually hit `api.bitget.com` and the Yahoo Finance APIs without DNS/CORS blocks. This retires the project's #1 risk.

### DEPENDENCIES
- Next.js scaffold in `src/`
- `Technical_Integration_Reconnaissance.md`

### START PROMPT
```text
You are the Technical Product Lead for the Bitget AI RedTeam Desk.
We are executing Phase P01: Infrastructure & Data Verification.

TASK:
1. Read `Technical_Integration_Reconnaissance.md`.
2. Inspect `src/adapters/bitget/client.ts` and `src/adapters/reference/yahoo.ts`.
3. Create a standalone test script (e.g., `src/scripts/verify-connectivity.ts`) that:
   - Fetches the rNVDAUSDT ticker from Bitget.
   - Fetches the BTCUSDT ticker from Bitget.
   - Fetches the NVDA reference price from Yahoo Finance.
4. Execute the script using `tsx` or `ts-node` to prove live connectivity works in this environment.

DO NOT:
- Do not build UI.
- Do not integrate LLMs yet.
```

### EXPECTED DELIVERABLES
- A working test script.
- Log output proving 200 OK responses from Bitget and Yahoo.

### AUDIT PROMPT
```text
Before we close this phase, run the connectivity script one last time.
Did Bitget return a valid `lastPrice` and `ts`?
Did Yahoo return a valid `regularMarketPrice`?
If yes, commit the changes with message: "feat: verify live data adapter connectivity".
If no, diagnose the network failure and fix it before committing.
```

---

## P02: AI LAYER IMPLEMENTATION

### PURPOSE
Replace the static mocks in the `src/core/thesis/` directory with real, structured LLM API calls.

### DEPENDENCIES
- `B05_AI_Behavior_and_Prompts.md`
- OpenAI SDK (or equivalent Qwen client)

### START PROMPT
```text
You are the AI Product Architect for the Bitget AI RedTeam Desk.
We are executing Phase P02: AI Layer Implementation.

TASK:
1. Read `B05_AI_Behavior_and_Prompts.md`.
2. Inspect `src/core/thesis/extractor.ts`, `challenger.ts`, and `assessment.ts`.
3. Install the OpenAI SDK (`npm install openai zod`).
4. Replace the hardcoded mock returns in those three files with actual LLM calls.
5. You MUST enforce the Zod schemas defined in B05 for the structured outputs.
6. The LLM must be passed the `MarketState` and `EvidenceItem[]` context so it does not hallucinate.

DO NOT:
- Do not change the deterministic math in `src/core/scenarios/engine.ts`.
- Do not change the `DecisionArtifact` interface.
```

### EXPECTED DELIVERABLES
- Working LLM integration for Extractor, Challenger, and Assessor.
- Fallback handling if the JSON fails to parse.

### AUDIT PROMPT
```text
Before we close this phase, run a test trade through `app/api/stress-test/route.ts` using the live LLM.
Did the LLM return valid JSON?
Did the Challenger reference the provided evidence?
If yes, commit the changes with message: "feat: implement structured LLM reasoning layer".
If no, fix the system prompts or retry logic before committing.
```

---

## P03: DESIGN & UI INTEGRATION

### PURPOSE
Apply the official `ai-design-skills` to the existing Next.js UI scaffold to ensure high-quality visual hierarchy and typography.

### DEPENDENCIES
- `B03_Experience_Architecture.md`
- `B04_Information_Architecture_and_Screen_Specification.md`
- https://github.com/ThatHorseRep/ai-design-skills

### START PROMPT
```text
You are the UX Strategist and Frontend Lead.
We are executing Phase P03: Design & UI Integration.

TASK:
1. Review the components in `src/components/workspace/`.
2. Inspect the design system guidelines at https://github.com/ThatHorseRep/ai-design-skills (or assume standard modern Tailwind/Shadcn UI principles if the repo is abstract).
3. Apply a coherent typography, color, and spacing system to the existing components.
4. Ensure the `DecisionArtifactView` clearly separates "Thesis Quality" from "Position Quality" visually.
5. Ensure the "DEMO MODE" banner is implemented for off-hours simulation.

DO NOT:
- Do not alter the underlying React state machine or API routes.
- Do not build a dashboard; keep the single-column progressive disclosure layout.
```

### EXPECTED DELIVERABLES
- Polished, responsive Tailwind CSS implementation.
- Accessible contrast ratios and clear typography.

### AUDIT PROMPT
```text
Before we close this phase, run `npm run build` and `npm run lint`.
Does the app compile without errors?
Does the UI look cohesive and professional?
If yes, commit the changes with message: "style: apply design system to workspace UI".
If no, fix the CSS/layout errors before committing.
```

---

## P04: END-TO-END INTEGRATION & ERROR HANDLING

### PURPOSE
Wire the live frontend, live Bitget API, and live LLM together, and ensure graceful degradation under failure.

### DEPENDENCIES
- Phases P01, P02, P03 complete.

### START PROMPT
```text
You are the Technical Product Lead.
We are executing Phase P04: End-to-End Integration & Error Handling.

TASK:
1. Run the full pipeline from the Next.js frontend by submitting a trade idea.
2. Verify that if Yahoo Finance fails (or times out), the system gracefully falls back to a "Token-Only" analysis without crashing.
3. Verify that if the LLM rate-limits, a clear error message is shown to the user on the frontend, allowing them to reset.
4. Ensure the `useFixture` (Demo Mode) toggle correctly forces the U.S. market to `WEEKEND` and alters the prices predictably.

DO NOT:
- Do not add new features. Only harden existing ones.
```

### EXPECTED DELIVERABLES
- A robust application that does not crash on edge cases.

### AUDIT PROMPT
```text
Run `npm run build` and start the server.
Trigger an API failure intentionally (e.g., break the Yahoo URL). Does the app handle it gracefully?
If yes, commit the changes with message: "fix: end-to-end error handling and graceful degradation".
```

---

## P05: HACKATHON DEMO POLISH & SUBMISSION

### PURPOSE
Finalize all non-code requirements for the Bitget Hackathon S2 submission.

### DEPENDENCIES
- `B06_Hackathon_Demo_and_Quality.md`

### START PROMPT
```text
You are the Hackathon Strategist.
We are executing Phase P05: Hackathon Demo Polish & Submission.

TASK:
1. Review `B06_Hackathon_Demo_and_Quality.md`.
2. Write a 1-page `SUBMISSION.md` containing the Project Description, Target User, and "Role of the LLM" text.
3. Verify that the UI says "Challenge This Trade" (or the chosen unified brand name) consistently everywhere.
4. Draft the exact text for the required X (Twitter) post including #BitgetHackathon and @Bitget_AI.

DO NOT:
- Do not touch the application code unless it is a typo fix.
```

### EXPECTED DELIVERABLES
- `SUBMISSION.md`
- Final README updates.

### AUDIT PROMPT
```text
Are all submission requirements (Track fit, Role of the LLM, X Post text) documented?
Is the codebase clean and ready for judges?
If yes, commit the changes with message: "docs: finalize hackathon submission artifacts".
This marks the completion of the project.
```


