"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DECISION_POLICY_CONFIG = void 0;
exports.evaluateDecision = evaluateDecision;
exports.DECISION_POLICY_CONFIG = {
    unsupportedAssetVerdict: "REJECT",
    invalidTradeVerdict: "REJECT",
    criticalDataVerdict: "WAIT",
    materialUncertaintyVerdict: "WAIT"
};
function evaluateDecision(inputs, config = exports.DECISION_POLICY_CONFIG) {
    const blockers = inputs.criticalBlockers ?? [];
    if (blockers.length > 0) {
        return {
            verdict: config.invalidTradeVerdict,
            reasons: ["A critical blocker prevents a reliable stress test."],
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
