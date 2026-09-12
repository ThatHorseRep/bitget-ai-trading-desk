"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const policy_1 = require("../src/core/decision/policy");
const rnvda_demo_1 = require("../src/fixtures/rnvda-demo");
const assessment = {
    thesisQuality: "STRONGER",
    positionQuality: "STRONGER",
    keyMismatch: null,
    explanation: "Fixture assessment."
};
const base = {
    marketState: rnvda_demo_1.rnvdaDemoMarketState,
    thesisQuality: assessment.thesisQuality,
    positionAssessment: assessment,
    scenarios: [],
    dataQuality: "COMPLETE"
};
(0, node_test_1.default)("decision rejects critical blockers", () => {
    const result = (0, policy_1.evaluateDecision)({ ...base, criticalBlockers: ["unsupported asset"] });
    strict_1.default.equal(result.verdict, "REJECT");
});
(0, node_test_1.default)("decision waits on invalid data", () => {
    const result = (0, policy_1.evaluateDecision)({ ...base, dataQuality: "INVALID" });
    strict_1.default.equal(result.verdict, "WAIT");
});
(0, node_test_1.default)("decision waits on degraded data or material uncertainty", () => {
    strict_1.default.equal((0, policy_1.evaluateDecision)({ ...base, dataQuality: "DEGRADED" }).verdict, "WAIT");
    strict_1.default.equal((0, policy_1.evaluateDecision)({ ...base, materialUncertainty: true }).verdict, "WAIT");
});
(0, node_test_1.default)("decision can proceed when no hard blocker is present", () => {
    strict_1.default.equal((0, policy_1.evaluateDecision)(base).verdict, "PROCEED");
});
