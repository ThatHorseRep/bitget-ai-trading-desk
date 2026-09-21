# 🏆 Hackathon Submission Checklist

Before you submit your final project, make sure to complete these critical steps:

## 1. 🔄 Confirm the Hackathon LLM Configuration
The production environment (Vercel Project Settings) and local `.env.local` must point at the provided hackathon gateway:
```env
LLM_API_BASE_URL=https://hackathon.bitgetops.com/v1
LLM_MODEL=qwen3.8-max
LLM_API_KEY=<hackathon-provided key>
```
The app sends `enable_thinking: false` by default (measured: raw model latency with hidden reasoning was blowing the workflow budget); set `LLM_ENABLE_THINKING=1` to opt back in.

## 2. ⏱️ Know the Degradation Story (it is a feature, not an apology)
The workflow runs under a hard wall-clock budget anchored at request start. If the LLM gateway is slow, the affected stage is skipped with an **explicit limitation line** ("Skipped adversarial challenge: workflow time budget exhausted…") and the deterministic stress math + policy still return a complete verdict. The serverless function is never killed mid-stream, and the UI never shows a silent "Analysis failed".

Do **not** tell judges the API is "faulty" or that the app "aborts after 15 seconds" — neither is true anymore. The accurate framing: *the desk always returns a decision, degraded with honest limitations when a dependency underperforms.*

## 3. 📝 Judge-Facing Copy
`SUBMISSION.md` carries the Project Description, Target User, and Role of the LLM text. README links it. If judges hit gateway latency on a live run, the **Deterministic Fixture** toggle (top right) replays the canonical weekend scenario instantly — clearly banner-labeled as demo data, never passed off as live.

## 4. 🚀 Deployment Verification
- [ ] Vercel production env vars current (LLM gateway + key)?
- [ ] Redeployed after the latest `main`?
- [ ] Live URL answers: `https://www.redteamdesk.name.ng` (health: `/api/stress-test` GET)?
- [ ] Demo video recorded — fixture mode for the guaranteed path, one live run to show graceful degradation?
- [ ] `SUBMISSION.md`, X post text (in `SUBMISSION.md`), and `#BitgetHackathon @Bitget_AI` post published and linked in the form?
