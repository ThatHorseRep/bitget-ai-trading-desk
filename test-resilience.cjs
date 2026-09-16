const { DecisionDeskService } = require("./dist-core/src/services/decisionDeskService.js");
const { MarketStateService } = require("./dist-core/src/services/marketStateService.js");

process.env.LLM_API_KEY = "dummy_key";
process.env.LLM_API_BASE_URL = "https://dummy_url";

class MockMarketStateService {
  constructor(failRef = false, failBtc = false, failBitget = false) {
    this.failRef = failRef;
    this.failBtc = failBtc;
    this.failBitget = failBitget;
  }
  async getMarketState(asset, options) {
    if (this.failBitget) {
      throw new Error("Bitget connection failed");
    }
    return {
      asset,
      referenceMarketStatus: "OPEN",
      instrumentPrice: 150,
      referencePrice: this.failRef ? null : 150,
      btcPrice: this.failBtc ? null : 90000,
      spread: 0.01,
      basis: this.failRef ? null : 0,
      liquidityClass: "LIQUID",
      sessionStatus: "REGULAR",
      dataQuality: (this.failRef || this.failBtc) ? "DEGRADED" : "NOMINAL",
      observedAt: new Date().toISOString(),
      sources: [],
      askSize: 100,
      bidSize: 100
    };
  }
}

class MockEvidenceProvider {
  constructor(fail = false) {
    this.fail = fail;
  }
  async retrieveEvidence() {
    if (this.fail) throw new Error("Evidence provider failed");
    return [{ id: "ev1", summary: "Testing" }];
  }
}

async function runTest(name, deps) {
  console.log(`\n--- Testing: ${name} ---`);
  
  const originalFetch = global.fetch;
  
  if (deps.failLlmStep) {
    global.fetch = async (url, options) => {
      const body = options.body;
      let phase = "UNKNOWN";
      if (body.includes("quantitative")) phase = "EXTRACTOR";
      else if (body.includes("RedTeam")) phase = "CHALLENGER";
      else phase = "ASSESSOR";
      
      if (deps.failLlmStep === phase) {
        return { ok: false, status: 500, text: async () => "Internal Server Error" };
      }
      
      // return success mock
      let payload = {};
      if (phase === "EXTRACTOR") {
        payload = { normalizedThesis: "T", assumptions: [], dependencies: [], invalidationConditions: [], supportingEvidenceRefs: [], unresolvedAmbiguities: [] };
      } else if (phase === "CHALLENGER") {
        payload = { counterThesis: "CT", vulnerableAssumptions: [], contradictoryEvidenceRefs: [], explanation: "Ex" };
      } else {
        payload = { thesisQuality: "STRONGER", keyMismatch: null, explanation: "Assessed" };
      }
      
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({choices: [{delta: {content: JSON.stringify(payload)}}]})}\n\ndata: [DONE]\n\n`));
          controller.close();
        }
      });
      return { ok: true, body: stream };
    };
  } else {
    // All succeed
    global.fetch = async (url, options) => {
      const body = options.body;
      let phase = "UNKNOWN";
      if (body.includes("quantitative")) phase = "EXTRACTOR";
      else if (body.includes("RedTeam")) phase = "CHALLENGER";
      else phase = "ASSESSOR";
      
      let payload = {};
      if (phase === "EXTRACTOR") {
        payload = { normalizedThesis: "T", assumptions: [], dependencies: [], invalidationConditions: [], supportingEvidenceRefs: [], unresolvedAmbiguities: [] };
      } else if (phase === "CHALLENGER") {
        payload = { counterThesis: "CT", vulnerableAssumptions: [], contradictoryEvidenceRefs: [], explanation: "Ex" };
      } else {
        payload = { thesisQuality: "STRONGER", keyMismatch: null, explanation: "Assessed" };
      }
      
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({choices: [{delta: {content: JSON.stringify(payload)}}]})}\n\ndata: [DONE]\n\n`));
          controller.close();
        }
      });
      return { ok: true, body: stream };
    };
  }

  const service = new DecisionDeskService(
    new MockMarketStateService(deps.failRef, deps.failBtc, deps.failBitget),
    new MockEvidenceProvider(deps.failEvidence)
  );

  try {
    const tradeIdea = {
      asset: "rNVDA",
      direction: "LONG",
      positionSizeUsd: 1000,
      entryPrice: 150,
      thesis: "Because AI"
    };
    const res = await service.runWorkflow(tradeIdea, { useFixture: false });
    console.log("Step:", res.step);
    if (res.step === "ERROR") {
      console.log("Limitations:", res.limitations);
    } else {
      console.log("Data Quality:", res.artifact.marketState.dataQuality);
      console.log("Thesis missing:", res.artifact.thesis === null);
      console.log("Challenge missing:", res.artifact.challenge === null);
      console.log("ThesisPosition missing:", res.artifact.thesisPosition === null);
      console.log("Decision Verdict:", res.artifact.decision.verdict);
      console.log("Decision Reasons:", res.artifact.decision.reasons.map(r => r.code));
      console.log("Limitations:", res.limitations.length > 0 ? res.limitations : "None");
    }
  } catch(e) {
    console.log("Caught exception:", e.message);
  } finally {
    global.fetch = originalFetch;
  }
}

async function main() {
  await runTest("All Working", {});
  await runTest("1. NVDA reference provider unavailable", { failRef: true });
  await runTest("2. BTC benchmark unavailable", { failBtc: true });
  await runTest("3. evidence provider unavailable", { failEvidence: true });
  await runTest("4. LLM extractor unavailable", { failLlmStep: "EXTRACTOR" });
  await runTest("5. LLM challenger unavailable", { failLlmStep: "CHALLENGER" });
  await runTest("6. LLM qualitative synthesis unavailable", { failLlmStep: "ASSESSOR" });
  await runTest("7. Bitget market data unavailable", { failBitget: true });
}

main().catch(console.error);
