import type { MarketState } from "../domain/market/types";
import type { TradeIdea, NormalizedTrade } from "../domain/trade/types";
import { calculatePositionQuantity } from "../core/calculations/financial";

export const RNVDA_DEMO_FIXTURE_LABEL = "DEMO FIXTURE — NOT LIVE DATA";

export const rnvdaTradeIdea: TradeIdea = {
  asset: "rNVDA",
  direction: "LONG",
  positionSizeUsd: 2000,
  thesis: "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it."
};

export function buildRnvdaDemoTrade(): NormalizedTrade {
  const entryPrice = 120;
  return {
    asset: "rNVDA",
    canonicalSymbol: "rNVDAUSDT",
    instrumentType: "TOKENIZED_EQUITY",
    direction: "LONG",
    positionSizeUsd: 2000,
    entryPrice,
    quantity: calculatePositionQuantity(2000, entryPrice),
    referenceAsset: "NVDA",
    thesis: rnvdaTradeIdea.thesis,
    userAssumptions: [],
    relevantExposure: [],
    entryPriceSource: "SYSTEM_DERIVED",
    entryBasisTimestamp: "2026-01-01T18:00:00.000Z"
  };
}

export const rnvdaDemoMarketState: MarketState = {
  observedAt: "2026-01-01T18:00:00.000Z",
  instrumentPrice: 120,
  bid: 119.4,
  ask: 120.6,
  bidSize: 30,
  askSize: 28,
  spread: 1.2,
  spreadPct: 1.0,
  referenceSymbol: "NVDA",
  referencePrice: 117,
  referencePreviousClose: 116.5,
  referenceObservedAt: "2026-01-01T18:00:00.000Z",
  referenceSourceName: "Fixture Source",
  basis: 3,
  basisPct: 2.56410256,
  btcPrice: 85000,
  btcObservedAt: "2026-01-01T18:00:00.000Z",
  sessionStatus: "WEEKEND",
  tokenMarketStatus: "ACTIVE",
  liquidityClass: "NORMAL",
  dataQuality: "COMPLETE",
  sources: [
    { id: "fixture-bitget", name: "DEMO FIXTURE — NOT LIVE DATA", observedAt: "2026-01-01T18:00:00.000Z" }
  ],
  scenarioId: "RNVDA_WEEKEND_REFERENCE_SCENARIO_V1",
  isSynthetic: true
};

import type { Thesis, Challenge, ThesisPositionAssessment } from "../domain/thesis/types";

export const rnvdaDemoThesis: Thesis = {
  traderStatement: "I'm thinking about buying $2,000 of rNVDA because AI infrastructure demand still looks strong. BTC has been weakening all weekend. Stress-test it.",
  normalizedThesis: "NVIDIA's underlying demand and AI growth will continue to drive the asset's value higher, disregarding immediate crypto market weakness.",
  assumptions: [
    { text: "AI demand remains strong", origin: "USER_STATED" },
    { text: "NVIDIA retains market leadership", origin: "AI_INFERRED" }
  ],
  dependencies: [
    { text: "Semiconductor supply chain stability", origin: "AI_INFERRED" }
  ],
  supportingEvidenceRefs: [],
  invalidationConditions: [
    { text: "Major drop in corporate AI capital expenditure", origin: "AI_INFERRED" }
  ],
  unresolvedAmbiguities: [],
  modelInfo: { model: "FIXTURE_LLM", provider: "DEMO" }
};

export const rnvdaDemoChallenge: Challenge = {
  counterThesis: "You are paying a ~3% premium on a weekend when BTC is weakening. You have 65.5 hours of un-anchored basis risk before Monday's open.",
  vulnerableAssumptions: ["AI demand remains strong", "BTC weakness will not spill over to tokenized equities"],
  contradictoryEvidenceRefs: [],
  noMeaningfulCounterThesis: false,
  explanation: "The fundamental thesis on AI infrastructure demand might hold, but paying a token premium during off-hours with negative crypto sentiment exposes you to significant basis risk.",
  modelInfo: { model: "FIXTURE_LLM", provider: "DEMO" }
};

export const rnvdaDemoThesisPosition: ThesisPositionAssessment = {
  thesisQuality: "STRONGER",
  positionQuality: {
    quality: "WEAKER",
    reasons: ["Trading rNVDA on weekend has high basis risk (+2.56%)"],
    keyDrivers: ["Weekend liquidity", "Basis premium"]
  },
  keyMismatch: "Weekend basis risk offsets fundamental NVDA thesis.",
  explanation: "While the underlying thesis is strong, executing it over the weekend using a tokenized asset carries structural risks due to basis dislocation and crypto market contagion.",
  modelInfo: { model: "FIXTURE_LLM", provider: "DEMO" }
};

import type { EvidenceItem } from "../domain/decision/types";

export const rnvdaDemoEvidence: EvidenceItem[] = [
  {
    id: "demo-ev-1",
    title: "NVIDIA Corporate Capital Expenditure Surge",
    source: "Fixture Source",
    url: "https://fixture.example.com/demo-ev-1",
    publishedAt: "2026-01-01T10:00:00.000Z",
    retrievedAt: "2026-01-01T18:00:00.000Z",
    summary: "Recent supply chain data suggests NVIDIA's upcoming corporate capital expenditure remains robust.",
    state: "CURATED_DEMO_FIXTURE",
    provenanceType: "OBSERVED_FACT"
  }
];
