"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const engine_1 = require("../src/core/scenarios/engine");
const config_1 = require("../src/core/scenarios/config");
const rnvda_demo_1 = require("../src/fixtures/rnvda-demo");
const trade = (0, rnvda_demo_1.buildRnvdaDemoTrade)();
(0, node_test_1.default)("all four MVP scenarios are produced", () => {
    const results = (0, engine_1.runStressScenarios)(trade, rnvda_demo_1.rnvdaDemoMarketState, config_1.SCENARIO_CONFIG);
    strict_1.default.deepEqual(results.map((s) => s.id), ["MARKET_RISK", "CRYPTO_CONTAGION", "TOKEN_MICROSTRUCTURE", "COMBINED_SHOCK"]);
    strict_1.default.ok(results.every((s) => s.applicable));
});
(0, node_test_1.default)("market shock is deterministic", () => {
    const [market] = (0, engine_1.runStressScenarios)(trade, rnvda_demo_1.rnvdaDemoMarketState, config_1.SCENARIO_CONFIG);
    strict_1.default.equal(market.shockedTokenPrice, 114);
    strict_1.default.equal(market.estimatedPnlPct, -5);
});
(0, node_test_1.default)("crypto contagion never invents beta", () => {
    const [_, crypto] = (0, engine_1.runStressScenarios)(trade, rnvda_demo_1.rnvdaDemoMarketState, config_1.SCENARIO_CONFIG);
    strict_1.default.equal(crypto.shockedTokenPrice, 115.2);
    strict_1.default.ok(crypto.assumptions.some((a) => a.includes("No beta is inferred")));
});
(0, node_test_1.default)("microstructure widening uses reference price and explicit basis assumption", () => {
    const [_, __, micro] = (0, engine_1.runStressScenarios)(trade, rnvda_demo_1.rnvdaDemoMarketState, config_1.SCENARIO_CONFIG);
    strict_1.default.equal(micro.shockedTokenPrice, 120.51);
    strict_1.default.equal(micro.basisImpact, 3);
    strict_1.default.equal(micro.liquidityImpact, -50);
});
(0, node_test_1.default)("combined scenario composes explicit shocks", () => {
    const results = (0, engine_1.runStressScenarios)(trade, rnvda_demo_1.rnvdaDemoMarketState, config_1.SCENARIO_CONFIG);
    const combined = results[3];
    strict_1.default.ok(combined.shockedTokenPrice !== null);
    strict_1.default.equal(combined.basisImpact, 3);
    strict_1.default.equal(combined.liquidityImpact, -50);
});
