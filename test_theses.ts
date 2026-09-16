import { extractThesis } from "./src/core/thesis/extractor";
import { generateThesisChallenge } from "./src/core/thesis/challenger";
import { runStressScenarios } from "./src/core/scenarios/engine";
import { SCENARIO_CONFIG } from "./src/core/scenarios/config";
import type { NormalizedTrade } from "./src/domain/trade/types";
import type { MarketState } from "./src/domain/market/types";
import type { EvidenceItem } from "./src/domain/decision/types";
import * as dotenv from 'dotenv';
dotenv.config();

const marketState: MarketState = {
  observedAt: new Date().toISOString(),
  instrumentPrice: 150,
  bid: 149.9,
  ask: 150.1,
  bidSize: 1000,
  askSize: 1000,
  spread: 0.2,
  spreadPct: 0.0013,
  referenceSymbol: "TEST",
  referencePrice: 150,
  referencePreviousClose: 145,
  referenceObservedAt: new Date().toISOString(),
  referenceSourceName: "Mock",
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

const evidence: EvidenceItem[] = [
  {
    id: "ev1",
    title: "AI Demand Soars",
    source: "src1",
    url: "https://example.com/news",
    publishedAt: new Date().toISOString(),
    retrievedAt: new Date().toISOString(),
    summary: "Major hyperscalers announce 2x increase in capital expenditure on AI infrastructure for next year, focusing on next-gen GPUs.",
    state: "CURATED_DEMO_FIXTURE",
    provenanceType: "OBSERVED_FACT"
  },
  {
    id: "ev2",
    title: "EV Market Struggles",
    source: "src1",
    url: "https://example.com/ev",
    publishedAt: new Date().toISOString(),
    retrievedAt: new Date().toISOString(),
    summary: "Chinese EV manufacturers escalate price war. Margins for western auto makers fall below 5%. Regulatory scrutiny on self-driving tech increases.",
    state: "CURATED_DEMO_FIXTURE",
    provenanceType: "OBSERVED_FACT"
  },
  {
    id: "ev3",
    title: "Inflation Sticky",
    source: "src1",
    url: "https://example.com/macro",
    publishedAt: new Date().toISOString(),
    retrievedAt: new Date().toISOString(),
    summary: "Core PCE comes in hotter than expected. Jobless claims fall. Fed signals rates may need to stay higher for longer. 10-year yield hits new local highs.",
    state: "CURATED_DEMO_FIXTURE",
    provenanceType: "OBSERVED_FACT"
  }
];

const theses = [
  {
    name: "AI Infrastructure Demand",
    asset: "rNVDA",
    instrumentType: "TOKENIZED_EQUITY" as const,
    direction: "LONG" as const,
    thesis: "The next generation Blackwell chips are going to drive a massive super-cycle. Hyperscalers like Microsoft and Google have no choice but to keep buying GPUs regardless of price to win the AI arms race. TSMC's recent capacity expansion proves the bottleneck is clearing."
  },
  {
    name: "Valuation/Multiple Compression",
    asset: "rTSLA",
    instrumentType: "TOKENIZED_EQUITY" as const,
    direction: "SHORT" as const,
    thesis: "The PE multiple of 60x makes no sense anymore when EV margins are getting crushed by BYD and price wars in China. It should be priced like a traditional automaker, not a hyper-growth tech company. Full Self Driving is a pipe dream that will get regulated out of existence next year."
  },
  {
    name: "Macro/Risk-off",
    asset: "rSPY",
    instrumentType: "TOKENIZED_EQUITY" as const,
    direction: "SHORT" as const,
    thesis: "Core PCE inflation is sticky, meaning the Fed will be forced to hike rates again rather than cut. Employment data is showing cracks, meaning consumer spending will collapse. The 10-year yield is breaking out, which will drain liquidity from equities."
  }
];

async function run() {
  for (const t of theses) {
    console.log(`\n======================================================`);
    console.log(`Running: ${t.name}`);
    console.log(`======================================================\n`);
    
    const trade: NormalizedTrade = {
      asset: t.asset,
      canonicalSymbol: `${t.asset}USDT`,
      instrumentType: t.instrumentType,
      direction: t.direction,
      positionSizeUsd: 50000,
      entryPrice: 150,
      quantity: 50000 / 150,
      entryPriceSource: "SYSTEM_DERIVED",
      thesis: t.thesis,
      userAssumptions: [],
      relevantExposure: []
    };

    console.log("Extracting Thesis...");
    const extracted = await extractThesis(trade, marketState, evidence);
    console.log("Assumptions:");
    console.log(JSON.stringify(extracted.assumptions, null, 2));
    console.log("\nChange / Invalidation Conditions:");
    console.log(JSON.stringify(extracted.invalidationConditions, null, 2));

    console.log("\nRunning Stress Scenarios...");
    const scenarios = runStressScenarios(trade, marketState, SCENARIO_CONFIG);
    
    console.log("\nGenerating Thesis Challenge...");
    const challenge = await generateThesisChallenge(extracted, trade, marketState, scenarios, evidence);
    console.log("Counter-Thesis:");
    console.log(challenge.counterThesis);
    console.log("\nVulnerable Assumptions:");
    console.log(JSON.stringify(challenge.vulnerableAssumptions, null, 2));
    console.log("\nExplanation:");
    console.log(challenge.explanation);
    
  }
}

run().catch(console.error);
