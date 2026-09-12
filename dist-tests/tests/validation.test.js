"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const runtime_1 = require("../src/core/validation/runtime");
const dataQuality_1 = require("../src/core/validation/dataQuality");
const rnvda_demo_1 = require("../src/fixtures/rnvda-demo");
(0, node_test_1.default)("trade validation rejects invalid size and empty thesis", () => {
    const result = (0, runtime_1.validateTradeIdea)({ ...rnvda_demo_1.rnvdaTradeIdea, positionSizeUsd: 0, thesis: "" });
    strict_1.default.equal(result.valid, false);
    strict_1.default.ok(result.errors.includes("positionSizeUsd must be greater than zero"));
    strict_1.default.ok(result.errors.includes("thesis is required"));
});
(0, node_test_1.default)("market validation rejects bid above ask", () => {
    const result = (0, runtime_1.validateMarketState)({ ...rnvda_demo_1.rnvdaDemoMarketState, bid: 121, ask: 120 });
    strict_1.default.equal(result.valid, false);
    strict_1.default.ok(result.errors.includes("bid cannot exceed ask"));
});
(0, node_test_1.default)("data quality detects stale observations", () => {
    const result = (0, dataQuality_1.assessMarketDataQuality)(rnvda_demo_1.rnvdaDemoMarketState, new Date("2026-01-01T19:00:00.000Z"));
    strict_1.default.equal(result.status, "DEGRADED");
    strict_1.default.ok(result.issues.includes("instrument observation is stale"));
});
(0, node_test_1.default)("data quality detects missing reference/BTC data", () => {
    const state = { ...rnvda_demo_1.rnvdaDemoMarketState, referencePrice: null, btcPrice: null };
    const result = (0, dataQuality_1.assessMarketDataQuality)(state, new Date("2026-01-01T18:00:30.000Z"));
    strict_1.default.equal(result.status, "INVALID");
    strict_1.default.ok(result.issues.includes("reference price unavailable"));
    strict_1.default.ok(result.issues.includes("BTC price unavailable"));
});
