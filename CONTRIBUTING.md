# Contributing — Bitget AI RedTeam Desk

Thanks for looking at the desk. This is a hackathon-track project with an unusually strict
integrity standard; contributing here means keeping that standard.

## The one rule that governs everything

**Recorded numbers beat intercepted numbers.** No route mocking, no injected artifacts,
no invented prices, no time compression of live acts — not in code, not in demos, not in
docs. Every claim a judge or maintainer can check must trace to a committed test, a raw
capture, or the artifact of record (see [scripts/README.md](scripts/README.md) and
[docs/PROBLEMS_AND_SOLUTIONS.md](docs/PROBLEMS_AND_SOLUTIONS.md) for the standard in practice).

## Setup

```bash
npm ci            # npm is the package manager (bun.lock is archived, not used)
npm run dev       # dev server on :3000
npm test          # build:core + node --test TAP suite
npm run verify-clean   # ci + typecheck + lint + test + build — run before any handoff
```

Requires Node 20+. Core decision logic lives in `src/core/` and is compiled separately
(`npm run build:core`) before the tests can run; `npm test` does this for you.

## Where things live

| Path | What it is |
|---|---|
| `src/core/` | Deterministic decision engine (policy, scenarios, parser) — pure, tested |
| `src/services/` | Workflow orchestration (SSE stage pipeline) |
| `src/adapters/` | External integrations (Bitget market data, research providers) |
| `tests/*.test.cjs` | Node test runner suites against `dist-core` builds |
| `scripts/` | Demo-video pipeline + evidence tooling (indexed in its README) |
| `docs/` | Judge-facing and engineering docs (indexed in `docs/README.md`) |

## Test conventions

- Tests run against the **compiled core** (`dist-core`), CommonJS, `node:test` + `node:assert/strict`.
- Name the behavior, not the implementation: a test title should read like a spec line.
- Expected values come from an independent source of truth — a worked example, the
  documented contract, or a recorded artifact — never from re-implementing the logic.
- Regression tests for a bug land in the same change as the fix; the ledger entry in
  `PROBLEMS_AND_SOLUTIONS.md` names them.

## Git conventions

- Conventional-ish subjects: `fix:`, `feat:`, `docs:`, `chore:`, `test:` + scope.
- The repo's `.githooks/` (active via `core.hooksPath`) strips AI-agent trailers from
  commit messages and rejects pushes containing them — write human commits.
- Nothing is committed without `npm run verify-clean` green.

## Honesty ledger

Broke something? Found something that cannot be fixed before submission? It goes in
[docs/PROBLEMS_AND_SOLUTIONS.md](docs/PROBLEMS_AND_SOLUTIONS.md) — problem, root cause,
fix, verification — rather than in a commit message or a quiet revert. Disclosed debt is
maintainable debt.
