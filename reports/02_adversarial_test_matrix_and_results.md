# Report 02: Adversarial Test Matrix & Results

## Test Suite Execution Summary
* **Total Subtests:** 291
* **Passed:** 291 (100%)
* **Failed:** 0 (0%)
* **Skipped:** 0 (0%)
* **Duration:** ~52.8 seconds
* **Compiler State:** Clean build (`tsc` and `next build` 0 errors)

---

## Test Suites Breakdown

| Test Suite / Area | Subtests | Status | Key Coverage |
| :--- | :---: | :---: | :--- |
| **`tests/parser-matrix.test.cjs`** | 22 | PASS | Natural language parsing, punctuation stripping, case-insensitivity, causal clause extraction, USD vs USDT prefixes. |
| **`tests/calculations.test.cjs`** | 12 | PASS | Spread calculation, midpoint division guards, 8-decimal scaling, PnL calculations for LONG and SHORT, liquidity classification. |
| **`tests/competitor-sabotage.test.cjs`** | 24 | PASS | Tier 1 (Crossed books, zero books, NaN/Infinity), Tier 2 (Prompt injections, SQL injection, sub-cent penny inputs), Tier 3 (Hedge laundering exploit, gate monotonicity), Tier 4 (Feed staleness, clock skew), Tier 5 (Stress scenarios, policy gates). |
| **`tests/decision.test.cjs`** | 21 | PASS | Hard fatal blockers, data quality degradation vs invalidation, material uncertainty gating, precedence hierarchy, off-hours session overrides. |
| **`tests/verdict-scoring.test.cjs`** | 24 | PASS | Thesis scoring bands (clear, moderate, elevated, critical), Position scoring bands, Worst-band gating across all 16 permutations, Determinism across 100 iterations. |
| **`tests/truth-table.test.cjs`** | 1 | PASS | Independent recomputation and verification of all 5 stress scenarios across LONG and SHORT positions. |
| **`tests/adversarial-llm.test.cjs`** | 3 | PASS | Extractor resilience against unknown evidence IDs, schema violation retries, and invalid enum values. |
| **`tests/live-integration.test.cjs`** | 2 | PASS | End-to-end execution of the full live service pipeline without hardcoded fixtures. |
| **`tests/yahoo.test.cjs`** | 5 | PASS | Yahoo reference provider resilience, previous close fallback, timeout handling, malformed JSON recovery. |
| **`tests/session-persistence.test.cjs`** | 6 | PASS | LocalStorage save/restore, corrupt cache handling, 30-entry audit history deduplication, clear actions. |
| **`tests/runtime-validation.test.cjs`** | 3 | PASS | Schema validation for TradeIdea, NormalizedTrade, and MarketState. |
| **`tests/data-quality.test.cjs`** | 7 | PASS | Data completeness, missing secondary benchmarks, stale observations, zero instrument price flags. |
| **`tests/scenarios.test.cjs`** | 5 | PASS | Market shock, crypto contagion, token microstructure, combined shock, carry cost computation. |
| **`tests/arbitration.test.cjs` & `arbitrator.test.cjs`** | 4 | PASS | Evidence ranking, source reliability weighting, and conflict resolution across multiple research feeds. |
