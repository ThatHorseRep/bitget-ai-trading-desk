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
      reasons: ["The trade cannot be supported by the MVP contract."],
      blockers,
      changeConditions: []
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

  return {
    verdict: "PROCEED",
    reasons: ["No configured hard blocker prevents the decision from proceeding to human judgment."],
    blockers: [],
    changeConditions: []
  };
}
