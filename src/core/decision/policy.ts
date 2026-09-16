import type { Decision, DecisionInputs, DecisionPolicyConfig } from "../../domain/decision/types";

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
      changeConditions: ["Articulate a specific, falsifiable thesis or catalyst."]
    };
  }

  if (inputs.thesisQuality === "WEAKER" && inputs.positionAssessment.positionQuality.quality === "WEAKER") {
    return {
      verdict: "REJECT",
      reasons: [
        {
          code: "THESIS_CONTRADICTED",
          message: "The underlying thesis is contradicted by available market evidence."
        },
        {
          code: "SEVERE_POSITION_RISK",
          message: "The proposed position structure is vulnerable to adverse liquidity and microstructure shocks."
        },
        ...inputs.positionAssessment.positionQuality.reasons.map(r => ({
          code: "SEVERE_POSITION_RISK" as const,
          message: r
        }))
      ],
      blockers: [],
      changeConditions: ["Re-evaluate the trade only if fresh evidence invalidates the counter-thesis.", ...thesisConditions]
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

  // Off-hours / weekend position stress check
  const isWeekendOrOffHours = inputs.marketState.sessionStatus === "WEEKEND" || inputs.marketState.sessionStatus === "OFF_HOURS";
  if (isWeekendOrOffHours && inputs.positionAssessment.positionQuality.quality === "WEAKER") {
    const reasons = [
      {
        code: "OFF_HOURS_WAIT" as const,
        message: `Underlying reference equity market is currently in ${inputs.marketState.sessionStatus} state with no continuous price discovery.`
      }
    ];

    if (inputs.positionAssessment.keyMismatch) {
      reasons.push({
        code: "OFF_HOURS_WAIT" as const,
        message: inputs.positionAssessment.keyMismatch
      });
    }

    reasons.push(...inputs.positionAssessment.positionQuality.reasons.map(r => ({
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

  if (inputs.positionAssessment.positionQuality.quality === "WEAKER") {
    const reasons = [];
    if (inputs.positionAssessment.keyMismatch) {
      reasons.push({
        code: "REDUCE_POSITION_SIZE" as const,
        message: inputs.positionAssessment.keyMismatch
      });
    }
    
    reasons.push(...inputs.positionAssessment.positionQuality.reasons.map(r => ({
      code: "REDUCE_POSITION_SIZE" as const,
      message: r
    })));

    return {
      verdict: "REDUCE",
      reasons,
      blockers: [],
      changeConditions: [
        "Reduce proposed position size by 50% to mitigate scenario drawdown severity.",
        "Verify liquidity depth before executing to prevent excessive execution slippage.",
        ...thesisConditions
      ]
    };
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


