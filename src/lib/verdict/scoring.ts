/**
 * Pure Deterministic Verdict Scoring Module
 *
 * Requirements:
 * - Pure functions only: no network calls, no LLM calls, no Date.now(), no randomness.
 * - Same output for same input, always.
 * - Deterministic verdict gating replacing LLM judgment.
 */

export type QualityBand = "critical" | "elevated" | "moderate" | "clear";

export interface ThesisSignals {
  hasInvalidationLevel: boolean;   // trader stated a price/condition that would prove the thesis wrong
  hasStatedHorizon: boolean;       // an explicit time horizon exists
  hasNamedCatalyst: boolean;       // a specific event/driver is identified
  hasDirectionalClaim: boolean;    // the thesis is falsifiable, not vague
  precedentCount: number;          // historical analogues retrieved
}

export interface PositionSignals {
  expectedShortfall: number;       // ES at the configured confidence, as a positive fraction of notional
  valueAtRisk: number;             // same units
  positionFraction: number;        // position notional / account equity
  gapExposureFraction: number;     // fraction of holding period in off-hours
  hedgeCoverageFraction: number;   // 0 if unhedged, 1 if fully offset
}

export interface ScoringResult {
  score: number;
  band: QualityBand;
  reasons: string[];
}

export interface VerdictGateResult {
  band: QualityBand;
  reasons: string[];
}

const BAND_RANKS: Record<QualityBand, number> = {
  critical: 0,
  elevated: 1,
  moderate: 2,
  clear: 3,
};

function assignBand(score: number): QualityBand {
  if (score >= 0.80) return "clear";
  if (score >= 0.60) return "moderate";
  if (score >= 0.35) return "elevated";
  return "critical";
}

/**
 * Score thesis quality deterministically based on structured signals.
 *
 * Scoring rules:
 * - Start at 0.
 * - +0.30 hasInvalidationLevel
 * - +0.20 hasStatedHorizon
 * - +0.20 hasNamedCatalyst
 * - +0.15 hasDirectionalClaim
 * - +0.15 * min(precedentCount / 5, 1)
 *
 * Bands:
 * - >= 0.80: clear
 * - >= 0.60: moderate
 * - >= 0.35: elevated
 * - else: critical
 */
export function scoreThesis(s: ThesisSignals): ScoringResult {
  let score = 0.0;
  const reasons: string[] = [];

  if (s.hasInvalidationLevel) {
    score += 0.30;
    reasons.push("Explicit invalidation level identified (+0.30)");
  } else {
    reasons.push("No invalidation level stated (-0.30)");
  }

  if (s.hasStatedHorizon) {
    score += 0.20;
    reasons.push("Explicit time horizon identified (+0.20)");
  } else {
    reasons.push("No explicit time horizon stated (-0.20)");
  }

  if (s.hasNamedCatalyst) {
    score += 0.20;
    reasons.push("Specific named catalyst driver identified (+0.20)");
  } else {
    reasons.push("No named catalyst identified (-0.20)");
  }

  if (s.hasDirectionalClaim) {
    score += 0.15;
    reasons.push("Falsifiable directional claim present (+0.15)");
  } else {
    reasons.push("Vague or non-directional thesis claim (-0.15)");
  }

  const safeCount = Math.max(0, s.precedentCount || 0);
  const precedentRatio = Math.min(safeCount / 5, 1);
  const precedentContribution = 0.15 * precedentRatio;
  score += precedentContribution;

  if (safeCount >= 5) {
    reasons.push("Strong historical precedent support (5+ analogues, +0.15)");
  } else if (safeCount > 0) {
    reasons.push(`Partial historical precedent support (${safeCount} analogues, +${precedentContribution.toFixed(2)})`);
  } else {
    reasons.push("No historical precedent analogues retrieved (+0.00)");
  }

  // Round to 4 decimal places to prevent floating point drift
  score = Math.round(score * 10000) / 10000;
  const band = assignBand(score);

  return { score, band, reasons };
}

/**
 * Score position quality deterministically based on quantitative risk metrics.
 *
 * Scoring rules:
 * - Start at 1.0 and subtract:
 *   - min(expectedShortfall / 0.20, 1) * 0.40
 *   - min(positionFraction / 0.25, 1) * 0.25
 *   - gapExposureFraction * 0.20
 *   + hedgeCoverageFraction * 0.15
 * - Clamp final result to [0, 1].
 *
 * Bands:
 * - >= 0.80: clear
 * - >= 0.60: moderate
 * - >= 0.35: elevated
 * - else: critical
 */
export function scorePosition(s: PositionSignals): ScoringResult {
  let score = 1.0;
  const reasons: string[] = [];

  const esRatio = Math.min(Math.max(0, s.expectedShortfall) / 0.20, 1);
  const esDeduction = esRatio * 0.40;
  score -= esDeduction;
  if (esDeduction > 0) {
    reasons.push(`Expected shortfall ${(s.expectedShortfall * 100).toFixed(1)}% of notional (-${esDeduction.toFixed(2)})`);
  } else {
    reasons.push("Expected shortfall within baseline limits (0.00)");
  }

  const pfRatio = Math.min(Math.max(0, s.positionFraction) / 0.25, 1);
  const pfDeduction = pfRatio * 0.25;
  score -= pfDeduction;
  if (pfDeduction > 0) {
    reasons.push(`Position size ${(s.positionFraction * 100).toFixed(1)}% of account equity (-${pfDeduction.toFixed(2)})`);
  } else {
    reasons.push("Position size negligible relative to account equity (0.00)");
  }

  const gapDeduction = Math.max(0, s.gapExposureFraction) * 0.20;
  score -= gapDeduction;
  if (gapDeduction > 0) {
    reasons.push(`Gap exposure ${(s.gapExposureFraction * 100).toFixed(1)}% in off-hours (-${gapDeduction.toFixed(2)})`);
  } else {
    reasons.push("Continuous market session with no off-hours gap exposure (0.00)");
  }

  const hedgeContribution = Math.max(0, s.hedgeCoverageFraction) * 0.15;
  score += hedgeContribution;
  if (hedgeContribution > 0) {
    reasons.push(`Hedge coverage ${(s.hedgeCoverageFraction * 100).toFixed(1)}% offset (+${hedgeContribution.toFixed(2)})`);
  }

  // Clamp final result strictly to [0, 1]
  score = Math.max(0, Math.min(1, score));
  score = Math.round(score * 10000) / 10000;
  const band = assignBand(score);

  return { score, band, reasons };
}

/**
 * Gate final verdict by taking the WORSE of the thesis band and position band.
 * Never average, never the better one.
 * Concatenates both reasons arrays.
 */
export function gateVerdict(
  thesis: ThesisSignals | ScoringResult,
  position: PositionSignals | ScoringResult
): VerdictGateResult {
  const tResult: ScoringResult = "band" in thesis ? thesis : scoreThesis(thesis);
  const pResult: ScoringResult = "band" in position ? position : scorePosition(position);

  const tRank = BAND_RANKS[tResult.band];
  const pRank = BAND_RANKS[pResult.band];

  // Lower rank is worse (critical = 0, elevated = 1, moderate = 2, clear = 3)
  const worseBand: QualityBand = tRank <= pRank ? tResult.band : pResult.band;

  return {
    band: worseBand,
    reasons: [...tResult.reasons, ...pResult.reasons],
  };
}
