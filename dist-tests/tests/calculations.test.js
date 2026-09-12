"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const financial_1 = require("../src/core/calculations/financial");
const expectThrows = (fn) => strict_1.default.throws(fn);
(0, node_test_1.default)("position quantity calculation", () => {
    strict_1.default.equal((0, financial_1.calculatePositionQuantity)(2000, 120), 16.66666667);
    expectThrows(() => (0, financial_1.calculatePositionQuantity)(0, 120));
    expectThrows(() => (0, financial_1.calculatePositionQuantity)(2000, 0));
});
(0, node_test_1.default)("spread and spread percentage", () => {
    strict_1.default.equal((0, financial_1.calculateSpread)(120.6, 119.4), 1.2);
    strict_1.default.equal((0, financial_1.calculateSpreadPct)(120.6, 119.4), 1);
    expectThrows(() => (0, financial_1.calculateSpread)(119, 120));
});
(0, node_test_1.default)("basis", () => {
    const result = (0, financial_1.calculateBasis)(120, 117);
    strict_1.default.equal(result.basis, 3);
    strict_1.default.equal(result.basisPct, 2.56410256);
    expectThrows(() => (0, financial_1.calculateBasis)(120, 0));
});
(0, node_test_1.default)("scenario P&L for long and short", () => {
    strict_1.default.equal((0, financial_1.calculateScenarioPnl)("LONG", 10, 100, 90), -100);
    strict_1.default.equal((0, financial_1.calculateScenarioPnl)("SHORT", 10, 100, 90), 100);
    strict_1.default.equal((0, financial_1.calculatePnlPct)(-100, 1000), -10);
});
