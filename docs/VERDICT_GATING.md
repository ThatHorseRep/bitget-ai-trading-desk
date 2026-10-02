# Verdict Gating & Risk-Tolerance Policy — Current State (2026-10-01)

> Single source of truth for how a verdict is produced. If this document and the code disagree,
> **the code is authoritative** (`src/core/decision/policy.ts`, pinned by `tests/tolerances.test.cjs`).
> This replaces the earlier audit written against the retired REJECT/WARN/APPROVE vocabulary
> (preserved in git history).

## 1. The four verdicts, one engine

`PROCEED / WAIT / REDUCE / REJECT` are computed by **one pure function**,
`evaluateDecision` in `src/core/decision/policy.ts`. There is no second verdict path:

- **Server:** `decisionDeskService` attaches `evaluateDecision` output to the artifact.
- **UI lever:** when the trader changes risk tolerance after the artifact landed,
  `DecisionArtifactView` recomputes through the **same** exported engine on the artifact's own
  inputs (`displayDecision` memo). The screen never paints an override; the stored artifact keeps
  the verdict it was generated with, and `riskToleranceApplied` records the shift verbatim.

## 2. Inputs and where each is produced

| Input | Producer | Nature |
|---|---|---|
| `thesisQuality` (STRONGER / MIXED / WEAKER / INSUFFICIENT) | LLM via `src/core/thesis/assessment.ts`; on LLM failure defaults to `INSUFFICIENT` | LLM (language only) |
| `positionQuality` | `classifyPositionQuality` (`src/core/decision/classifyPosition.ts`) from deterministic scenario P&L, basis, liquidity | Deterministic |
| Gated risk band | `gateVerdict` (`src/lib/verdict/scoring.ts`), attached as `positionAssessment.gatedVerdictResult` | Deterministic |
| `materialUncertainty`, `dataQuality`, `criticalBlockers` | Service layer from observed market state and validation | Deterministic |
| `riskTolerance` (CONSERVATIVE / MODERATE / AGGRESSIVE) | Trader, via the workspace-header lever (UI labels LOW / MED / HIGH) | Human input |

## 3. Decision order (policy.ts)

1. **Critical trade blockers** → `REJECT` (`FATAL_INVALID_TRADE`). Never relaxed by tolerance.
2. **`dataQuality: INVALID`** → `WAIT` (`CRITICAL_DATA_BLOCKER`). Never relaxed.
3. **`INSUFFICIENT` thesis** → `REJECT` (`INSUFFICIENT_THESIS`). Never relaxed — the LLM cannot
   talk its way past the deterministic floor.
4. **Contradicted thesis + weak position** (ungated fallback) → `REJECT`.
5. **Material uncertainty** (gated path): the trader's tolerance shifts the computed band one step
   via `applyRiskToleranceToBand` — CONSERVATIVE stricter, AGGRESSIVE looser — and returns
   REJECT / PROCEED accordingly, with the uncertainty reasons retained verbatim. MODERATE (the
   default) keeps the historical verdict byte-for-byte. In the *ungated* off-hours branch the
   lever is honestly inert (band shifts would not change the WAIT; matrix Trade C documents this).
6. **Off-hours weakness** (ungated fallback) → `WAIT` (`OFF_HOURS_WAIT`).
7. **Gated band path:** tolerance-adjusted band, then a **liquidity floor** — a position graded
   WEAKER by the deterministic scenario engine may be downgraded further but never upgraded past
   REDUCE/WAIT, because the gated score never sees execution microstructure.
8. elevated band: `WAIT` off-hours / `REDUCE` in-session; clear band: `PROCEED` reasons.

## 4. The tolerance contract (pinned by 15 tests)

`tests/tolerances.test.cjs` runs on every `npm test` and fails the suite if anyone changes:

- **MODERATE (and unset) preserves the historical verdict exactly** — the pre-lever behavior,
  byte-for-byte, with `riskToleranceApplied: null`.
- **CONSERVATIVE shifts the gated band one step worse** (elevated → critical ⇒ REJECT, blocker
  disclosed).
- **AGGRESSIVE shifts one step better** (elevated → moderate ⇒ PROCEED) but **never past
  REDUCE/WAIT for WEAKER-graded positions** (liquidity floor).
- **Hard blockers are never relaxed** by any tolerance (`FATAL_INVALID_TRADE`,
  `INSUFFICIENT_THESIS`, `CRITICAL_DATA`).
- **Every shift is disclosed verbatim** on the artifact via
  `riskToleranceApplied.bandShiftNote`.

Beyond the unit contract, the behavior was probed through the real UI across three different
trades × three tolerances (9-cell matrix, live and banner-labeled fixture runs — summarized in
the signoff), and both brand cuts show the lever moving a verdict on screen (desktop:
LOW→REJECT / HIGH→PROCEED on live engine recomputes; mobile: Act 6 re-rendered 2026-10-01 to
the same engine-true verdicts after the tolerance fix).
