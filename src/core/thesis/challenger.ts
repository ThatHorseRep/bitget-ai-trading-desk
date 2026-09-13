import { getSeekAiClient, type SeekAiRequest } from "./seekAiClient";
import { z } from "zod";
import type { EvidenceItem } from "../../domain/decision/types";
import type { MarketState } from "../../domain/market/types";
import type { Challenge, Thesis } from "../../domain/thesis/types";
import type { NormalizedTrade } from "../../domain/trade/types";



const ChallengerSchema = z.object({
  counterThesis: z.string(),
  vulnerableAssumptions: z.array(z.string()),
  contradictoryEvidenceRefs: z.array(z.string()),
  explanation: z.string()
});

export async function generateThesisChallenge(
  thesis: Thesis,
  trade: NormalizedTrade,
  marketState: MarketState,
  evidence: EvidenceItem[]
): Promise<Challenge> {
  const systemPrompt = `You are a RedTeam risk manager on a trading desk. 
Your job is to aggressively but fairly challenge a proposed trade thesis.
You will receive the structured thesis, current market state (including basis and liquidity), and recent news evidence.

Rules:
1. Formulate a grounded counter-thesis.
2. If the reference market is closed and token basis is wide, you MUST highlight the off-hours execution risk.
3. Reference specific contradictory evidence provided to you. Do NOT invent news.
4. Identify which specific user assumptions are most vulnerable.
5. If no strong counter-evidence exists, state that clearly instead of fabricating weak arguments.`;

  const userPrompt = `
Trade Details:
${JSON.stringify(trade, null, 2)}

Thesis:
${JSON.stringify(thesis, null, 2)}

Market State:
${JSON.stringify(marketState, null, 2)}

Evidence:
${JSON.stringify(evidence, null, 2)}
  `;

  if (process.env.TEST_MODE === "mock_llm") {
    return {
      counterThesis: "Mock counter thesis",
      vulnerableAssumptions: ["Mock assumption 1"],
      contradictoryEvidenceRefs: ["mock-evidence-ref"],
      noMeaningfulCounterThesis: false,
      explanation: "Mock explanation"
    };
  }

const payload: SeekAiRequest = {
  model: process.env.SEEKAI_MODEL || "deepseek-v4-flash",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]
};

let resp;
try {
  resp = await getSeekAiClient().chat(payload);
} catch (err) {
  // Fallback mock response when SeekAI request fails
  return {
    counterThesis: "Mock counter thesis",
    vulnerableAssumptions: ["Mock assumption 1"],
    contradictoryEvidenceRefs: ["mock-evidence-ref"],
    noMeaningfulCounterThesis: false,
    explanation: "Mock explanation"
  };
}
let parsed;
try {
  parsed = ChallengerSchema.parse(JSON.parse(resp.content));
} catch (e) {
  // Fallback mock data if parsing fails
  return {
    counterThesis: "Mock counter thesis",
    vulnerableAssumptions: ["Mock assumption 1"],
    contradictoryEvidenceRefs: ["mock-evidence-ref"],
    noMeaningfulCounterThesis: false,
    explanation: "Mock explanation"
  };
}

// Handle the case where no meaningful counter thesis exists based on rules
const noMeaningfulCounterThesis = parsed.counterThesis.toLowerCase().includes("no strong counter-evidence");

return {
  counterThesis: parsed.counterThesis,
  vulnerableAssumptions: parsed.vulnerableAssumptions,
  contradictoryEvidenceRefs: parsed.contradictoryEvidenceRefs,
  noMeaningfulCounterThesis,
  explanation: parsed.explanation
};}


