# Project Description & Submission Packet

## 1. Thesis / Core Hypothesis
<!-- filled by step N -->

## 2. Specific Target User
The primary user is a crypto-native retail trader active on Bitget who is beginning to trade tokenized U.S. equities (such as rNVDA) alongside existing crypto exposure in a 24/7 market. This trader understands basic position sizing and direction, but lacks a disciplined, unified pre-trade system to stress-test basis risk, off-hours liquidity un-anchoring, and thesis invalidation before committing capital.

## 3. Validation Data / Key Metrics
<!-- filled by step N -->

## 4. Current Progress and What's Left
Step 0 complete: backup verified, assets wired to standard locations, identity folder staged.
- Working Surfaces: 9 verified surfaces (7 UI workspace components, 2 API endpoints).
- Partial Surfaces: 4 surfaces requiring brand token styling, mobile restructuring, and UI state polish.
- Missing Surfaces: 5 surfaces identified for graceful error handling, landing introduction, and offline resilience.

## 5. Deliverables List
<!-- filled by step N -->

## 6. Reflections on AI Trading
<!-- filled by step N -->

## 7. Role of the LLM
The LLM's responsibilities are strictly restricted to, and ONLY these:
- parsing the trader's free-text thesis into the ThesisSignals booleans (it extracts, it does not score)
- writing the adversarial interrogation questions
- writing the narrative explanation of a verdict it did not decide
- summarising retrieved precedents

The LLM performs extraction and explanation; verdict thresholds are deterministic and unit-tested.
