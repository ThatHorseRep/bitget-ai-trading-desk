import type { Decision, DecisionInputs, DecisionPolicyConfig } from "../../domain/decision/types";

export const DECISION_POLICY_CONFIG: DecisionPolicyConfig = {
  unsupportedAssetVerdict: "REJECT",
  invalidTradeVerdict: "REJECT",
  criticalDataVerdict: "WAIT",
  materialUncertaintyVerdict: "WAIT"
};

export function evaluateDecision(inputs: DecisionInputs, config: DecisionPolicyConfig = DECISION_POLICY_CONFIG): Decision {
  const blockers = inputs.criticalBlockers ?? [];
  if (blockers.length > 0) {
    return {
      verdict: config.invalidTradeVerdict,
      reasons: blockers.map((b) => `Critical trade blocker: ${b}`),
      blockers,
      changeConditions: ["Resolve the critical blockers before resubmitting the trade idea."]
    };
  }

  if (inputs.thesisQuality === "INSUFFICIENT") {
    return {
      verdict: "REJECT",
      reasons: ["The trader thesis lacks causal reasoning or actionable substance to justify capital allocation."],
      blockers: ["Insufficient thesis"],
      changeConditions: ["Articulate a specific, falsifiable thesis or catalyst."]
    };
  }

  if (inputs.thesisQuality === "WEAKER" && inputs.positionAssessment.positionQuality === "WEAKER") {
    return {
      verdict: "REJECT",
      reasons: [
        "The underlying thesis is contradicted by available market evidence.",
        "The proposed position structure is vulnerable to adverse liquidity and microstructure shocks."
      ],
      blockers: [],
      changeConditions: ["Re-evaluate the trade only if fresh evidence invalidates the counter-thesis."]
    };
  }

  if (inputs.dataQuality === "INVALID") {
    return {
      verdict: config.criticalDataVerdict,
      reasons: ["Required market data is missing or invalid."],
      blockers: [],
      changeConditions: ["Obtain valid current market observations before acting."]
    };
  }

  if (inputs.materialUncertainty || inputs.dataQuality === "DEGRADED") {
    return {
      verdict: config.materialUncertaintyVerdict,
      reasons: ["Material uncertainty remains in the available decision inputs."],
      blockers: [],
      changeConditions: ["Resolve or refresh the material uncertainty before acting."]
    };
  }

  // Off-hours / weekend position stress check
  const isWeekendOrOffHours = inputs.marketState.sessionStatus === "WEEKEND" || inputs.marketState.sessionStatus === "OFF_HOURS";
  if (isWeekendOrOffHours && inputs.positionAssessment.positionQuality === "WEAKER") {
    return {
      verdict: "WAIT",
      reasons: [
        `Underlying reference equity market is currently in ${inputs.marketState.sessionStatus} state with no continuous price discovery.`,
        "Thin top-of-book liquidity and unanchored off-hours basis create asymmetric downside risk before Monday's open.",
        inputs.positionAssessment.keyMismatch ?? "Thesis quality does not rescue off-hours position fragility."
      ],
      blockers: [],
      changeConditions: [
        "Wait for Monday 09:30 ET reference market open to confirm underlying price response to weekend events.",
        "Ensure token/reference basis divergence does not widen prior to trade execution."
      ]
    };
  }

  if (inputs.positionAssessment.positionQuality === "WEAKER") {
    return {
      verdict: "REDUCE",
      reasons: [
        "The proposed position size creates disproportionate exposure relative to observable liquidity and scenario drawdowns.",
        inputs.positionAssessment.keyMismatch ?? "Position size/exposure exceeds optimal structural bounds."
      ],
      blockers: [],
      changeConditions: [
        "Reduce proposed position size by 50% to mitigate scenario drawdown severity.",
        "Verify liquidity depth before executing to prevent excessive execution slippage."
      ]
    };
  }

  return {
    verdict: "PROCEED",
    reasons: [
      "The underlying thesis is supported by current available evidence.",
      "The proposed position structure survives deterministic stress scenarios within acceptable bounds.",
      "No configured hard blocker prevents the decision from proceeding to human judgment."
    ],
    blockers: [],
    changeConditions: [
      "Monitor for major negative guidance revisions or capex announcements from cloud hyperscalers.",
      "Track BTC benchmark stability for potential crypto contagion spillover."
    ]
  };
}


