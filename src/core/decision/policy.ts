import type { Decision, DecisionInputs, DecisionPolicyConfig } from "../../domain/decision/types";
import {
  gateVerdict,
  applyRiskToleranceToBand,
  type ThesisSignals,
  type PositionSignals,
  type VerdictGateResult,
  type RiskAdjustedBand
} from "../../lib/verdict/scoring";

export const DECISION_POLICY_CONFIG: DecisionPolicyConfig = {
  unsupportedAssetVerdict: "REJECT",
  invalidTradeVerdict: "REJECT",
  criticalDataVerdict: "WAIT",
  materialUncertaintyVerdict: "WAIT"
};

export function evaluateDecision(inputs: DecisionInputs, config: DecisionPolicyConfig = DECISION_POLICY_CONFIG): Decision {
  const blockers = inputs.criticalBlockers ?? [];
  const thesisConditions = inputs.thesis?.invalidationConditions?.map(ic => ic.text) || [];

  if (blockers.length > 0) {
    return {
      verdict: config.invalidTradeVerdict,
      reasons: blockers.map((b) => ({
        code: "FATAL_INVALID_TRADE",
        message: `Critical trade blocker: ${b}`
      })),
      blockers,
      changeConditions: ["Resolve the critical blockers before resubmitting the trade idea."]
    };
  }

  if (inputs.dataQuality === "INVALID") {
    return {
      verdict: config.criticalDataVerdict,
      reasons: [{
        code: "CRITICAL_DATA_BLOCKER",
        message: "Required market data is missing or invalid."
      }],
      blockers: [],
      changeConditions: ["Obtain valid current market observations before acting."]
    };
  }

  if (inputs.thesisQuality === "INSUFFICIENT") {
    return {
      verdict: "REJECT",
      reasons: [{
        code: "INSUFFICIENT_THESIS",
        message: "The trader thesis lacks causal reasoning or actionable substance to justify capital allocation."
      }],
      blockers: ["Insufficient thesis"],
      changeConditions: ["Articulate a specific, falsifiable thesis or catalyst.", ...thesisConditions]
    };
  }

  // Contradicted thesis + weak position structure -> Hard REJECT (fallback when gated scoring not present)
  if (!inputs.positionAssessment?.gatedVerdictResult && inputs.thesisQuality === "WEAKER" && inputs.positionQuality.quality === "WEAKER") {
    return {
      verdict: "REJECT",
      reasons: [
        {
          code: "THESIS_CONTRADICTED",
          message: "The underlying thesis is directly contradicted by available market and liquidity evidence."
        },
        {
          code: "SEVERE_POSITION_RISK",
          message: "The proposed position structure is vulnerable to adverse liquidity and microstructure shocks."
        },
        ...inputs.positionQuality.reasons.map((r: string) => ({
          code: "SEVERE_POSITION_RISK" as const,
          message: r
        }))
      ],
      blockers: [],
      changeConditions: ["Re-evaluate the trade only if fresh evidence invalidates the counter-thesis.", ...thesisConditions]
    };
  }

  if (inputs.materialUncertainty) {
    // Persona lever under material uncertainty. A rumor thesis always leaves
    // real unresolved ambiguities, so the plain uncertainty verdict would
    // otherwise mask the tolerance lever entirely. Instead the trader's
    // tolerance shifts the gated risk band (CONSERVATIVE stricter,
    // AGGRESSIVE looser) using the same applyRiskToleranceToBand mapping as
    // the gated path below. MODERATE (the default) keeps the historical
    // threshold byte-for-byte; the uncertainty reasons are always retained.
    const tolerance = inputs.riskTolerance ?? "MODERATE";
    const gated = inputs.positionAssessment?.gatedVerdictResult;
    if (gated && tolerance !== "MODERATE") {
      const adjusted = applyRiskToleranceToBand(gated.band, tolerance);
      const uncertaintyReasons = [{
        code: "CRITICAL_DATA_BLOCKER" as const,
        message: "Material uncertainty remains in the available decision inputs."
      }];
      if (adjusted.band === "critical") {
        return {
          verdict: "REJECT",
          reasons: [...uncertaintyReasons, ...gated.reasons.map((r: string) => ({
            code: "THESIS_CONTRADICTED" as const,
            message: r
          })), ...(adjusted.note ? [{ code: "THESIS_CONTRADICTED" as const, message: adjusted.note }] : [])],
          blockers: ["Risk tolerance CONSERVATIVE raised the gated risk band to critical"],
          changeConditions: ["Resolve or refresh the material uncertainty before acting.", ...thesisConditions]
        };
      }
      if (adjusted.band === "moderate") {
        return {
          verdict: "PROCEED",
          reasons: [...uncertaintyReasons, ...gated.reasons.map((r: string) => ({
            code: "PROCEED_OK" as const,
            message: r
          })), ...(adjusted.note ? [{ code: "PROCEED_OK" as const, message: adjusted.note }] : [])],
          blockers: [],
          changeConditions: ["Monitor the unresolved ambiguities — AGGRESSIVE tolerance accepts the elevated-basis risk.", ...thesisConditions]
        };
      }
    }
    return {
      verdict: config.materialUncertaintyVerdict,
      reasons: [{
        code: "CRITICAL_DATA_BLOCKER",
        message: "Material-uncertainty tolerance shift." + (tolerance !== "MODERATE" ? " Tolerance " + tolerance + " leaves the band unchanged (" + (gated ? gated.band : "ungated") + ")." : "")
      }],
      blockers: [],
      changeConditions: ["Resolve or refresh the material uncertainty before acting.", ...thesisConditions]
    };
  }

  const isWeekendOrOffHours = inputs.marketState.sessionStatus === "WEEKEND" || inputs.marketState.sessionStatus === "OFF_HOURS";

  if (!inputs.positionAssessment?.gatedVerdictResult && isWeekendOrOffHours && inputs.positionQuality.quality === "WEAKER") {
    const reasons = [
      {
        code: "OFF_HOURS_WAIT" as const,
        message: `Underlying reference equity market is currently in ${inputs.marketState.sessionStatus} state with no continuous price discovery.`
      }
    ];

    if (inputs.positionAssessment?.keyMismatch) {
      reasons.push({
        code: "OFF_HOURS_WAIT" as const,
        message: inputs.positionAssessment.keyMismatch
      });
    }

    reasons.push(...inputs.positionQuality.reasons.map((r: string) => ({
      code: "OFF_HOURS_WAIT" as const,
      message: r
    })));

    return {
      verdict: "WAIT",
      reasons,
      blockers: [],
      changeConditions: [
        "Wait for Monday 09:30 ET reference market open to confirm underlying price response to weekend events.",
        "Ensure token/reference basis divergence does not widen prior to trade execution.",
        ...thesisConditions
      ]
    };
  }

  if (!inputs.positionAssessment?.gatedVerdictResult && inputs.positionQuality.quality === "WEAKER") {
    const reasons = [];
    if (inputs.positionAssessment?.keyMismatch) {
      reasons.push({
        code: "REDUCE_POSITION_SIZE" as const,
        message: inputs.positionAssessment.keyMismatch
      });
    }
    
    reasons.push(...inputs.positionQuality.reasons.map((r: string) => ({
      code: "REDUCE_POSITION_SIZE" as const,
      message: r
    })));

    return {
      verdict: "REDUCE",
      reasons: reasons.length > 0 ? reasons : [{
        code: "REDUCE_POSITION_SIZE" as const,
        message: "Severe position risk: reduce position size."
      }],
      blockers: [],
      changeConditions: [
        "Reduce proposed position size by 50% to mitigate scenario drawdown severity.",
        "Verify liquidity depth before executing to prevent excessive execution slippage.",
        ...thesisConditions
      ]
    };
  }

  // Check explicit gated verdict scoring if attached
  if (inputs.positionAssessment?.gatedVerdictResult) {
    const gated = inputs.positionAssessment.gatedVerdictResult;
    // Persona lever: the trader's risk tolerance shifts the computed risk
    // band one step (CONSERVATIVE stricter / AGGRESSIVE looser). Applied
    // ONLY to the gated-band path — hard blockers (invalid trade,
    // insufficient thesis, critical data) above are never relaxed.
    const tolerance = inputs.riskTolerance ?? "MODERATE";
    const adjusted: RiskAdjustedBand = applyRiskToleranceToBand(gated.band, tolerance);
    // Liquidity floor: the gated score never sees execution microstructure.
    // A position graded WEAKER by the deterministic scenario engine may be
    // downgraded further (stricter) by the band/tolerance, but never upgraded
    // (loosened) past REDUCE/WAIT — scenario grading stays authoritative on
    // the downside.
    const effectiveBand: RiskAdjustedBand =
      inputs.positionQuality.quality === "WEAKER" && (adjusted.band === "clear" || adjusted.band === "moderate")
        ? {
            ...adjusted,
            band: "elevated",
            note: "Liquidity floor: deterministic stress scenarios graded this position WEAKER; verdict capped at REDUCE/WAIT regardless of gated score."
          }
        : adjusted;
    const gatedReasons = gated.reasons;
    const shiftedReasons = effectiveBand.note ? [...gatedReasons, effectiveBand.note] : gatedReasons;
    if (effectiveBand.band === "critical") {
      return {
        verdict: "REJECT",
        reasons: shiftedReasons.map((r: string) => ({
          code: "SEVERE_POSITION_RISK" as const,
          message: r
        })),
        blockers: ["Critical risk gating threshold reached"],
        changeConditions: ["Articulate a specific, falsifiable thesis or catalyst.", ...thesisConditions]
      };
    }
    if (effectiveBand.band === "elevated") {
      if (isWeekendOrOffHours) {
        return {
          verdict: "WAIT",
          reasons: shiftedReasons.map((r: string) => ({
            code: "OFF_HOURS_WAIT" as const,
            message: r
          })),
          blockers: [],
          changeConditions: ["Wait for market open to resolve elevated risk.", ...thesisConditions]
        };
      }
      return {
        verdict: "REDUCE",
        reasons: shiftedReasons.map((r: string) => ({
          code: "REDUCE_POSITION_SIZE" as const,
          message: r
        })),
        blockers: [],
        changeConditions: ["Reduce position size to lower risk band.", ...thesisConditions]
      };
    }
  }

  const proceedReasons = [];

  if (inputs.thesisQuality === "STRONGER" || inputs.thesisQuality === "MIXED") {
    proceedReasons.push({
      code: "PROCEED_OK" as const,
      message: `The underlying thesis is supported by current available evidence (quality: ${inputs.thesisQuality}).`
    });
  } else if (inputs.thesisQuality === "WEAKER") {
    proceedReasons.push({
      code: "THESIS_CONTRADICTED" as const,
      message: "Warning: The underlying thesis is contradicted by evidence (quality: WEAKER), but the position structure risk remains acceptable."
    });
  } else if (inputs.thesisQuality === null) {
    proceedReasons.push({
      code: "MATERIAL_UNCERTAINTY" as const,
      message: "Thesis assessment unavailable due to system degradation. Deterministic bounds still acceptable."
    });
  }

  proceedReasons.push({
    code: "PROCEED_OK" as const,
    message: "The proposed position structure survives deterministic stress scenarios within acceptable bounds."
  });

  if (blockers.length === 0 && !inputs.materialUncertainty) {
    proceedReasons.push({
      code: "PROCEED_OK" as const,
      message: "No configured hard blocker prevents the decision from proceeding to human judgment."
    });
  }

  if (inputs.dataQuality === "DEGRADED") {
    proceedReasons.push({
      code: "PROCEED_OK" as const,
      message: "Operating on degraded but defensible partial data."
    });
  }

  return {
    verdict: "PROCEED",
    reasons: proceedReasons,
    blockers: [],
    changeConditions: thesisConditions.length > 0 
      ? thesisConditions
      : ["Monitor underlying assumptions for structural invalidation."]
  };
}


