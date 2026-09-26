# Shock Parameter Specification & Calibration Status

> **Read this first — what "calibrated" means here.**
> Bitget's tokenized-equity (Reality / rToken) platform launched in **May 2026**. There is no multi-year rToken price history from which to fit 95th-percentile distributions, and we will not pretend otherwise. The parameters below are **fixed, conservative, a-priori choices** — desk assumptions and policy decisions, documented openly — not statistically fitted calibrations. Where a parameter is informed by publicly observable market history (e.g., Bitcoin's repeatedly documented weekend drawdowns), we say so qualitatively and name the class of events; we do not claim a fitted percentile we cannot reproduce.
>
> **Executable source of truth:** the values below live in `src/core/scenarios/config.ts` (`SCENARIO_CONFIG`, `ASSET_RISK_PROFILES`) and are consumed by `src/core/scenarios/engine.ts`. If this document and the code ever disagree, the code is authoritative — it is what runs in production and in the demo.

---

## Parameter Table (status-labeled)

| # | Parameter | Value | Status | Rationale & Source |
|---|-----------|-------|--------|--------------------|
| 1 | Reference market gap shock | **-5.0%** (long) / +5.0% (short) | **ASSUMPTION** | Conservative round number for an adverse Monday opening gap in a mega-cap equity. Public market history contains many single-session gaps of this magnitude for high-beta names around binary events; we choose a fixed -5% rather than claiming a fitted percentile we cannot reproduce from a named public distribution. |
| 2 | BTC benchmark shock | **-8.0%** | **ASSUMPTION**, informed by public history | Weekend BTC drawdowns of ~8% or more have occurred repeatedly in publicly observable crypto history (e.g., the May 2021 deleveraging, the August 2024 yen-carry unwind, and subsequent liquidation cascades). The specific "-8%" is our chosen benchmark, not a computed percentile. |
| 3 | Direct token contagion shock | **-4.0%** (token, independent of β path) | **ASSUMPTION** | Captures crypto-venue risk-off flowing into tokenized wrappers through flows other than the β channel (stablecoin liquidity, venue-level de-risking). Chosen conservatively; no fitted basis. |
| 4 | Basis widening shock | **+300 bps** (adverse) | **ASSUMPTION** | Weekend un-anchoring of a token from its underlying is the core structural risk the desk models. 3 percentage points is a deliberately severe-but-plausible widening; the platform is too young for a fitted distribution of weekend basis dislocations. |
| 5 | Liquidity depth reduction | **-50%** | **ASSUMPTION** | Off-hours top-of-book thinning is a well-known microstructure effect; the specific 50% haircut is a conservative modeling choice, not a measured median. |
| 6 | Asset β to BTC (per asset) | see table below | **ASSUMPTION** (sensitivity weights) | Used to scale the BTC shock per asset. These are judgment-based sensitivity weights reflecting each underlying's business linkage to crypto — **not** regression-fitted betas. |
| 7 | Verdict gating threshold | combined-shock drawdown vs. desk risk policy bands | **POLICY DECISION** | The boundary between WAIT / REDUCE / REJECT outcomes is a risk-policy choice, documented in `src/lib/verdict/scoring.ts` and `src/core/decision/policy.ts`. It is not derived from any distribution. |

---

## Asset β to BTC (assumption weights, mirrored from `ASSET_RISK_PROFILES`)

| Asset | β to BTC | Assumption basis (business logic, not fitting) |
|-------|----------|------------------------------------------------|
| `rMSTR` | 0.85 | Corporate treasury is substantially Bitcoin; strongest mechanical linkage. |
| `rCOIN` | 0.75 | Exchange revenue is highly tied to crypto transaction volumes. |
| `rTSLA` | 0.40 | Retail cross-asset sentiment overlap; historical corporate Bitcoin holdings (since divested) keep the weight elevated. |
| `rNVDA` | 0.20 | AI-infrastructure proxy; weaker direct crypto linkage. |
| `rAAPL` | 0.25 | General mega-cap risk-asset sensitivity. |
| `rAMZN` | 0.30 | General mega-cap risk-asset sensitivity. |
| `DEFAULT` | 0.40 | Fallback for unlisted assets; conservative. |

> Note: earlier versions of this document listed `rTSLA` β = 0.35; the engine uses **0.40**. The code is authoritative.

---

## Scenario Formulas (deterministic, in `engine.ts`)

1. **Market Risk:** `Price_shocked = Price_token × (1 + Shock_market)`, with `Shock_market = -5.0%` for longs, `+5.0%` for shorts.
2. **Crypto Contagion:** the BTC shock propagates through the asset β weight; a direct token contagion shock (-4%) is also applied. `Δ_token = f(Shock_BTC × β_asset, Shock_direct)`.
3. **Token Microstructure:** basis shifts adversely by +300 bps (directional: widening against the position) and visible depth is cut by 50%; the stressed book is re-classified against liquidity thresholds.
4. **Combined Shock:** the simultaneous composition of 1–3. For reference: a $25,000 `rTSLA` long entered at a +3.81% weekend premium (assumed state; see the walkthroughs in [`RETROSPECTIVE_CASE_STUDIES.md`](./RETROSPECTIVE_CASE_STUDIES.md)) produces a combined-shock P&L of **-$2,674.38 (-10.70%)** — engine-executed, reproducible, and illustrative of the gating threshold in action.

---

## How a Skeptical Reader Should Treat These Numbers

- **Every shock value is an assumption or policy choice.** The desk's honesty claim is not "our percentiles are fitted" — it is "our parameters are fixed, documented, and applied identically to every evaluation, and every output number traces to them."
- **The determinism is the verifiable part.** Same inputs → same shocks → same P&L → same verdict band, every run, byte-for-byte. That property is tested (`tests/scenarios.test.cjs`) and is the substance of the audit story.
- **Directional risk is well-evidenced even where magnitudes are chosen.** Weekend basis un-anchoring, off-hours liquidity thinning, and crypto-contagion spillover into tokenized wrappers are structural, publicly observable phenomena; the magnitudes we assign them are conservative desk choices.
- **We label, you judge.** Nothing in this document should be read as an audited backtest, a fitted VaR model, or a claim about realized trader outcomes. The illustrative walkthroughs are engine arithmetic under stated assumptions — nothing more.
