# Report 03: System Durability & Defensive Architecture Spec

## Defensive Principles

### 1. Deterministic Gating Superiority
All critical decision outputs are determined by strict, pure mathematical functions rather than probabilistic LLM generations. The LLM is restricted to narrative extraction and evidence summarization; the final verdict (`PROCEED`, `REJECT`, `WAIT`, `REDUCE`) is computed via the deterministic `VerdictGate` policy engine.

### 2. Worst-Band Conservatism (Monotonic Risk Principle)
The final risk band is governed by the worst assessment between fundamental thesis quality and position structural risk:
$$\text{FinalBand} = \min(\text{Band}_{\text{thesis}}, \text{Band}_{\text{position}})$$
A high-conviction fundamental thesis cannot override an overleveraged or illiquid position, and a conservative position cannot override a falsified thesis.

### 3. Quantitative Input Clamping & Sanitization
* **Hedge Coverage:** Bounded strictly to $[0, 1]$ to prevent unbounded hedge laundering.
* **Gap Exposure:** Bounded strictly to $[0, 1]$.
* **Financial Quantities:** All currency and token quantities are rounded and validated with $10^{-8}$ precision (`roundFinancial`).
* **Finite Metric Enforcement:** All calculations pass through `Number.isFinite()` guards before participating in score deductions.

### 4. Feed & Liquidity Resilience
* **Crossed Orderbook Quarantine:** If an exchange reports $\text{bid} > \text{ask}$, the spread calculation safely defaults to `null`, degrading data quality to `UNKNOWN` and triggering defensive review rather than crashing the process.
* **Off-Hours Market Session Gate:** Trades on synthetic equities during weekend or off-market hours are flagged. Trades with elevated risk are routed to `WAIT` until US market open (Monday 09:30 ET).
* **Storage Schema Validation:** All browser-persisted audit entries and drafts are type-checked and filtered upon deserialization to prevent malicious injection or corrupted cache crashes.
