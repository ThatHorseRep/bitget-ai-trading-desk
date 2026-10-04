/**
 * Launcher preset data for the trade-input surface.
 *
 * Kept in a plain module (not the component) so the fixture drift pin in
 * tests/preset-cards.test.cjs can replay every prompt through the engine and
 * fail if a card ever advertises a result the engine does not return.
 *
 * The four cards are four trade *shapes*, not a 2x2 calibration. The
 * deterministic fixture is a single hardcoded WEEKEND market state, so weekend
 * gating pins three of them to WAIT regardless of size or thesis, and the
 * fourth names no asset and stops at clarification. Recorded fixture runs:
 *
 *   cash-hours $10k -> WAIT          (worst COMBINED_SHOCK -9.25%)
 *   leverage $50k    -> WAIT          (worst COMBINED_SHOCK -9.25%)
 *   weekend $2k      -> WAIT          (worst COMBINED_SHOCK -9.25%)
 *   unhedged $100k   -> CLARIFICATION (no asset named)
 *
 * Thresholds were NOT tuned to manufacture four distinct verdicts. These are
 * four different inputs; the result shown is what the engine returned.
 * Re-run tests/preset-cards.test.cjs after any policy change.
 */
import type { Verdict } from "@/config/branding";

/** What the deterministic fixture engine returns for a preset prompt. */
export type PresetResult =
  | { kind: "verdict"; verdict: Verdict }
  | { kind: "clarification" };

export interface ScenarioPreset {
  id: string;
  label: string;
  badge: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  size: string;
  result: PresetResult;
  summary: string;
  expectedShortfall: string;
  basisGap: string;
  depthVsSession: string;
  cryptoBeta: string;
  actionText: string;
  promptText: string;
}

export const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    id: "cash-hours",
    label: "Cash-Hours Entry, $10k",
    badge: "Weekend gate",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$10,000",
    result: { kind: "verdict", verdict: "WAIT" },
    summary: "Names a clean execution window, but the fixture is off-hours: weekend gating still returns WAIT with a -9.25% worst case.",
    expectedShortfall: "-9.25%",
    basisGap: "+2.56%",
    depthVsSession: "NORMAL",
    cryptoBeta: "fixture",
    actionText: "Run Desk",
    promptText:
      "I plan to buy $10,000 rNVDA token during US cash market hours at 10:15 AM ET with 0.02% basis spread. Data center revenue beat + low crypto correlation."
  },
  {
    id: "leverage",
    label: "5x Leverage, $50k",
    badge: "Weekend gate",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$50,000",
    result: { kind: "verdict", verdict: "WAIT" },
    summary: "Larger notional and 5x leverage. Size raises quantity, not the percentage stress, so the verdict is unchanged at WAIT.",
    expectedShortfall: "-9.25%",
    basisGap: "+2.56%",
    depthVsSession: "NORMAL",
    cryptoBeta: "fixture",
    actionText: "Run Desk",
    promptText:
      "I plan to buy $50,000 rNVDA token with 5x leverage during extended hours. Basis spread elevated at 0.45%."
  },
  {
    id: "weekend",
    label: "Weekend 65.5h Void, $2k",
    badge: "Weekend gate",
    symbol: "rNVDA",
    direction: "LONG",
    size: "$2,000",
    result: { kind: "verdict", verdict: "WAIT" },
    summary: "The canonical weekend-basis case. +2.56% basis against a weak BTC backdrop is exactly what the desk defers on.",
    expectedShortfall: "-9.25%",
    basisGap: "+2.56%",
    depthVsSession: "NORMAL",
    cryptoBeta: "fixture",
    actionText: "Run Desk",
    promptText:
      "I am thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it."
  },
  {
    id: "unhedged",
    label: "Unhedged, No Thesis",
    badge: "Missing asset",
    symbol: "—",
    direction: "LONG",
    size: "$100,000",
    result: { kind: "clarification" },
    summary: "No asset is named, so the desk stops at clarification rather than guessing a position. Add the ticker to stress it.",
    expectedShortfall: "—",
    basisGap: "—",
    depthVsSession: "—",
    cryptoBeta: "—",
    actionText: "Run Desk",
    promptText:
      "Ape $100,000 with max leverage into tokenized equity with no thesis, no stop loss, and liquidation cascade risk."
  }
];
