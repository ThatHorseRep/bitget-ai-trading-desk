import type { Decision, DecisionInputs, DecisionPolicyConfig } from "../../domain/decision/types";
import {
  gateVerdict,
  type ThesisSignals,
  type PositionSignals,
  type VerdictGateResult
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

  if (inputs.materialUncertainty) {
    return {
      verdict: config.materialUncertaintyVerdict,
      reasons: [{
        code: "CRITICAL_DATA_BLOCKER",
        message: "Material uncertainty remains in the available decision inputs."
      }],
      blockers: [],
      changeConditions: ["Resolve or refresh the material uncertainty before acting.", ...thesisConditions]
    };
  }

  const isWeekendOrOffHours = inputs.marketState.sessionStatus === "WEEKEND" || inputs.marketState.sessionStatus === "OFF_HOURS";

  // Derive signals or use precomputed gatedVerdictResult
  let gated: VerdictGateResult;
  if (inputs.positionAssessment?.gatedVerdictResult) {
    gated = inputs.positionAssessment.gatedVerdictResult;
  } else {
    const thesisSignals: ThesisSignals = {
      hasInvalidationLevel: inputs.thesis?.signals?.hasInvalidationLevel ?? (inputs.thesisQuality === "STRONGER"),
      hasStatedHorizon: inputs.thesis?.signals?.hasStatedHorizon ?? (inputs.thesisQuality !== "INSUFFICIENT"),
      hasNamedCatalyst: inputs.thesis?.signals?.hasNamedCatalyst ?? (inputs.thesisQuality === "STRONGER" || inputs.thesisQuality === "MIXED"),
      hasDirectionalClaim: inputs.thesis?.signals?.hasDirectionalClaim ?? (inputs.thesisQuality !== "INSUFFICIENT"),
      precedentCount: inputs.thesisQuality === "STRONGER" ? 2 : 0
    };

    const applicableScenarios = inputs.scenarios?.filter(s => s.applicable && s.estimatedPnlPct !== null) ?? [];
    const scenarioLosses = applicableScenarios.map(s => Math.max(0, -s.estimatedPnlPct! / 100));
    const expectedShortfall = scenarioLosses.length > 0
      ? scenarioLosses.reduce((sum, l) => sum + l, 0) / scenarioLosses.length
      : (inputs.positionQuality.quality === "WEAKER" ? 0.30 : 0.05);

    const positionSignals: PositionSignals = {
      expectedShortfall,
      valueAtRisk: scenarioLosses.length > 0 ? Math.max(...scenarioLosses) : expectedShortfall,
      positionFraction: 0.25,
      gapExposureFraction: isWeekendOrOffHours ? 0.75 : 0.0,
      hedgeCoverageFraction: 0.0
    };

    gated = gateVerdict(thesisSignals, positionSignals);
  }

  // Band-driven deterministic verdict
  if (gated.band === "critical" || inputs.thesisQuality === "INSUFFICIENT") {
    const reasons = gated.reasons.length > 0
      ? gated.reasons.map((r: string) => ({
          code: r.toLowerCase().includes("thesis") ? ("INSUFFICIENT_THESIS" as const) : ("SEVERE_POSITION_RISK" as const),
          message: r
        }))
      : [
          {
            code: "INSUFFICIENT_THESIS" as const,
            message: "The trader thesis lacks causal reasoning or actionable substance to justify capital allocation."
          }
        ];

    return {
      verdict: "REJECT",
      reasons,
      blockers: ["Critical risk gating threshold reached"],
      changeConditions: ["Articulate a specific, falsifiable thesis or catalyst.", ...thesisConditions]
    };
  }

  if (gated.band === "elevated" || inputs.positionQuality.quality === "WEAKER") {
    if (isWeekendOrOffHours) {
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

      reasons.push(
        ...gated.reasons.map((r: string) => ({
          code: "OFF_HOURS_WAIT" as const,
          message: r
        }))
      );

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

    // Regular hours elevated risk -> REDUCE
    const reasons = [];
    if (inputs.positionAssessment?.keyMismatch) {
      reasons.push({
        code: "REDUCE_POSITION_SIZE" as const,
        message: inputs.positionAssessment.keyMismatch
      });
    }

    reasons.push(
      ...gated.reasons.map((r: string) => ({
        code: "REDUCE_POSITION_SIZE" as const,
        message: r
      }))
    );

    return {
      verdict: "REDUCE",
      reasons: reasons.length > 0 ? reasons : [{
        code: "REDUCE_POSITION_SIZE" as const,
        message: "Elevated risk threshold reached: reduce position size."
      }],
      blockers: [],
      changeConditions: [
        "Reduce proposed position size by 50% to mitigate scenario drawdown severity.",
        "Verify liquidity depth before executing to prevent excessive execution slippage.",
        ...thesisConditions
      ]
    };
  }

  // Clear or Moderate band -> PROCEED
  const proceedReasons = [];

  if (gated.reasons.length > 0) {
    proceedReasons.push(
      ...gated.reasons.map((r: string) => ({
        code: "PROCEED_OK" as const,
        message: r
      }))
    );
  } else {
    proceedReasons.push({
      code: "PROCEED_OK" as const,
      message: "The proposed position structure survives deterministic stress scenarios within acceptable bounds."
    });
  }

  if (inputs.thesisQuality === "STRONGER" || inputs.thesisQuality === "MIXED") {
    proceedReasons.push({
      code: "PROCEED_OK" as const,
      message: `The underlying thesis is supported by current available evidence (quality: ${inputs.thesisQuality}).`
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


