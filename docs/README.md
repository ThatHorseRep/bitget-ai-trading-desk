# Documentation Index — Bitget AI RedTeam Desk

> Every tracked document in this repository, organized by what it's for. Judges: start with the
> top row — the rest is engineering depth. If any document disagrees with the shipped behavior,
> **the code and the test suite are authoritative** (`npm test`, 366/366).

## Start here (judge-facing)

| Document | What it covers |
|---|---|
| [`../README.md`](../README.md) | Project overview, problem statement, track fit, quick start, architecture map, submission checklist |
| [`../PRODUCT_DESCRIPTION.md`](../PRODUCT_DESCRIPTION.md) | **Canonical judge-facing text** (pasted into the hackathon form): thesis, target user, validation data with honesty tags |
| [`../SUBMISSION.md`](../SUBMISSION.md) | Supplementary judge material: architecture overview, LLM role, safety boundaries, X post draft |
| [`SUBMISSION_SIGNOFF.md`](./SUBMISSION_SIGNOFF.md) | **Final sign-off:** audit scorecard, proof table (every claim → observable), video provenance, remaining human items |
| [`../ARCHITECTURE_AND_LIMITATIONS.md`](../ARCHITECTURE_AND_LIMITATIONS.md) | MVP architecture, known limitations (L1 vs L2 data, static risk profiles, reference pricing, LLM stability), optional-integration boundaries |
| [`PROBLEMS_AND_SOLUTIONS.md`](./PROBLEMS_AND_SOLUTIONS.md) | Problem → root cause → fix → verification ledger, with test proof |
| [`../SUBMISSION_CHECKLIST.md`](../SUBMISSION_CHECKLIST.md) | Pre-submission operational checklist (LLM gateway config, degradation story, deployment verification) |

## How the desk decides (policy & methodology)

| Document | What it covers |
|---|---|
| [`VERDICT_GATING.md`](./VERDICT_GATING.md) | **Verdict policy as shipped (2026-10-01):** four verdicts from one engine, the risk-tolerance contract, the 15-test pin |
| [`GOLDEN_PATH.md`](./GOLDEN_PATH.md) | Canonical demo runbook: verbatim input, pipeline stages, expected outputs |
| [`SHOCK_CALIBRATION_METHODOLOGY.md`](./SHOCK_CALIBRATION_METHODOLOGY.md) | Every deterministic shock parameter: derivation intent, assumption status, executable source of truth |
| [`RETROSPECTIVE_CASE_STUDIES.md`](./RETROSPECTIVE_CASE_STUDIES.md) | Illustrative engine-executed walkthroughs — explicitly *not* historical trades (platform launched May 2026) |
| [`PRE_SUBMISSION_REPORT.md`](./PRE_SUBMISSION_REPORT.md) | Integrity-fix diff summary, self-certification checklist, explicit incompleteness statement, honest judge-risk closing |
| [`CONNECTIVITY_REPORT.md`](./CONNECTIVITY_REPORT.md) | External endpoint connectivity (Bitget, Yahoo Finance, MCP gateways) with dates and re-verification addenda |

## Where the raw evidence lives

The **tracked** proof is the signoff proof table plus the test suite itself (`npm test` →
366/366 across 38 files; `tests/tolerances.test.cjs` pins the tolerance contract). The **raw
verification ledger** (unedited TAP captures, parser outputs, tolerance matrix, live-data path —
built by `scripts/build-evidence-dump.cjs`) and the entire historical archive
(`docs/archive/`: engineering specs, market-research dossier, brand-identity manifest, session-era
recon) are kept **locally only** — on disk and recoverable from git history, deliberately not
part of the judged tree. Every claim a judge can check lives in the tracked docs, the proof
table, or the test suite.

## Conventions

- **Honesty tags.** Judge-facing claims carry `[OBSERVED]` / `[ILLUSTRATIVE]` /
  `[ASSUMPTION, documented]` / `[TARGET]` tags — used throughout
  [`../PRODUCT_DESCRIPTION.md`](../PRODUCT_DESCRIPTION.md) and
  [`RETROSPECTIVE_CASE_STUDIES.md`](./RETROSPECTIVE_CASE_STUDIES.md).
- **Where numbers come from.** Shock parameters: [`SHOCK_CALIBRATION_METHODOLOGY.md`](./SHOCK_CALIBRATION_METHODOLOGY.md);
  verdict policy: [`VERDICT_GATING.md`](./VERDICT_GATING.md); if doc and code disagree,
  **the code is authoritative**.
- **Session scratch artifacts** (`raw_*.tmp.*`, `*.tmp.cjs`) are local-only by design (gitignored).
