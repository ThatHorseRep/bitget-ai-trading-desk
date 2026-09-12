"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const market_1 = require("../src/core/calculations/market");
(0, node_test_1.default)("liquidity classification", () => {
    const config = { spreadWarnPercent: 1, minVisibleBidSize: 5, minVisibleAskSize: 5 };
    strict_1.default.equal((0, market_1.classifyLiquidity)(0.5, 10, 10, config), "NORMAL");
    strict_1.default.equal((0, market_1.classifyLiquidity)(1.5, 10, 10, config), "THIN");
    strict_1.default.equal((0, market_1.classifyLiquidity)(0.5, 2, 10, config), "THIN");
    strict_1.default.equal((0, market_1.classifyLiquidity)(null, 10, 10, config), "UNKNOWN");
});
