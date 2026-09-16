import { classifyPositionQuality } from "../src/core/decision/classifyPosition";
import { assessThesisVsPosition } from "../src/core/thesis/assessment";
import type { MarketState } from "../src/domain/market/types";
import type { StressScenario } from "../src/domain/scenarios/types";
import type { NormalizedTrade } from "../src/domain/trade/types";
import type { Thesis, Challenge } from "../src/domain/thesis/types";
import * as llmClientModule from "../src/core/thesis/llmClient";
import assert from "assert";

// Mock the LLM client
const mockChat = async (payload: any) => {
  // Deliberately return conflicting LLM output where the LLM attempts to return positionQuality: "STRONGER"
  return {
    content: JSON.stringify({
      thesisQuality: "STRONGER",
      positionQuality: "STRONGER", // <--- Conflicting override attempt
      keyMismatch: "LLM attempted to override position quality",
      explanation: "LLM explanation"
    })
  };
};

jestMockLlmClient();

function jestMockLlmClient() {
  (llmClientModule as any).getSeekAiClient = () => {
    return {
      chat: mockChat
    };
  };
}

async function runTests() {
  console.log("Running deterministic position quality tests...");

  const baseTrade: NormalizedTrade = {
    asset: "TSLA",
    canonicalSymbol: "TSLA",
    instrumentType: "TOKENIZED_EQUITY",
    direction: "LONG",
    positionSizeUsd: 10000,
    entryPrice: 200,
    quantity: 50,
    entryPriceSource: "SYSTEM_DERIVED",
    thesis: "Base thesis",
    userAssumptions: [],
    relevantExposure: []
  };

  const baseMarketState: MarketState = {
    observedAt: new Date().toISOString(),
    instrumentPrice: 200,
    bid: 199.9,
    ask: 200.1,
    bidSize: 1000, // $200k visible bid
    askSize: 1000, // $200k visible ask
    spread: 0.2,
    spreadPct: 0.1,
    referenceSymbol: "TSLA",
    referencePrice: 200,
    referencePreviousClose: 195,
    referenceObservedAt: new Date().toISOString(),
    referenceSourceName: "NASDAQ",
    basis: 0,
    basisPct: 0,
    btcPrice: 60000,
    btcObservedAt: new Date().toISOString(),
    sessionStatus: "REGULAR",
    tokenMarketStatus: "ACTIVE",
    liquidityClass: "NORMAL",
    dataQuality: "COMPLETE",
    sources: []
  };

  const baseScenarios: StressScenario[] = [
    {
      id: "MARKET_RISK",
      name: "Base Scenario",
      description: "Normal variation",
      applicable: true,
      assumptions: [],
      shockedReferencePrice: 190,
      shockedTokenPrice: 190,
      estimatedPnlUsd: -100,
      estimatedPnlPct: -1, // -1% loss -> STRONGER
      basisImpact: 0,
      liquidityImpact: 0,
      limitations: []
    }
  ];

  // Baseline
  let result = classifyPositionQuality(baseScenarios, baseMarketState, baseTrade);
  assert.strictEqual(result.quality, "STRONGER", "Baseline should be STRONGER");
  console.log("✅ Baseline passed");

  // 1. Scenario loss severity
  const severeLossScenarios = [{ ...baseScenarios[0], estimatedPnlPct: -20 }];
  result = classifyPositionQuality(severeLossScenarios, baseMarketState, baseTrade);
  assert.strictEqual(result.quality, "WEAKER", "Severe loss should make it WEAKER");
  assert(result.reasons.some(r => r.includes("exceeds the WEAKER threshold")), "Reason should mention threshold");
  console.log("✅ Scenario loss severity factor passed");

  // 2. Liquidity class
  const thinLiquidityMarket = { ...baseMarketState, liquidityClass: "THIN" as const };
  result = classifyPositionQuality(baseScenarios, thinLiquidityMarket, baseTrade);
  assert.strictEqual(result.quality, "MIXED", "Thin liquidity should downgrade STRONGER to MIXED");
  assert(result.reasons.some(r => r.includes("downgraded due to THIN liquidity conditions")), "Reason should mention THIN liquidity");
  console.log("✅ Liquidity class factor passed");

  // 3. Basis dislocation
  const highBasisScenarios = [{ ...baseScenarios[0], basisImpact: 1.5 }];
  result = classifyPositionQuality(highBasisScenarios, baseMarketState, baseTrade);
  assert.strictEqual(result.quality, "WEAKER", "High basis impact should make it WEAKER");
  assert(result.reasons.some(r => r.includes("due to high scenario basis dislocation impact")), "Reason should mention basis impact");
  console.log("✅ Basis dislocation factor passed");

  // 4. Off-hours state
  const offHoursMarket = { ...baseMarketState, sessionStatus: "OFF_HOURS" as const };
  result = classifyPositionQuality(baseScenarios, offHoursMarket, baseTrade);
  assert.strictEqual(result.quality, "MIXED", "Off-hours should downgrade STRONGER to MIXED");
  assert(result.reasons.some(r => r.includes("off-hours/weekend trading session status (OFF_HOURS)")), "Reason should mention OFF_HOURS");
  console.log("✅ Off-hours state factor passed");

  // 5. Notional vs visible liquidity
  // Position is $1,000,000, Ask Size is 1000 tokens @ $200 = $200,000. Ratio = 5 > 0.5 threshold.
  const hugeTrade = { ...baseTrade, positionSizeUsd: 1000000 };
  result = classifyPositionQuality(baseScenarios, baseMarketState, hugeTrade);
  assert.strictEqual(result.quality, "WEAKER", "Excessive position size should make it WEAKER");
  assert(result.reasons.some(r => r.includes("Position size exceeds 50% of visible top-of-book liquidity")), "Reason should mention position size");
  console.log("✅ Notional vs visible liquidity factor passed");

  // LLM Override Test
  console.log("Testing LLM override resilience...");
  const thesis: Thesis = {
    traderStatement: "",
    normalizedThesis: "",
    assumptions: [],
    dependencies: [],
    supportingEvidenceRefs: [],
    invalidationConditions: [],
    unresolvedAmbiguities: []
  };
  const challenge: Challenge = {
    counterThesis: "",
    vulnerableAssumptions: [],
    contradictoryEvidenceRefs: [],
    noMeaningfulCounterThesis: false,
    explanation: ""
  };
  
  // We feed a severe loss scenario, so deterministic quality is WEAKER
  const assessment = await assessThesisVsPosition(thesis, baseTrade, baseMarketState, severeLossScenarios, challenge, []);
  
  // LLM tries to return "STRONGER" for positionQuality
  assert.strictEqual(assessment.positionQuality.quality, "WEAKER", "LLM must NOT be able to override deterministic position quality");
  console.log("✅ LLM override resilience passed");

  console.log("All tests passed successfully!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
