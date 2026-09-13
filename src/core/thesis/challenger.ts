import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type { EvidenceItem } from "../../domain/decision/types";
import type { MarketState } from "../../domain/market/types";
import type { Challenge, Thesis } from "../../domain/thesis/types";
import type { NormalizedTrade } from "../../domain/trade/types";

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.LLM_API_BASE_URL || undefined,
});
const modelName = process.env.LLM_MODEL || "gpt-4o";

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

  let response;
  try {
    response = await openai.chat.completions.parse({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: zodResponseFormat(ChallengerSchema, "challenge")
    });
  } catch (error) {
    throw new Error(`Failed to generate challenge: ${error}`);
  }

  const result = response.choices[0].message.parsed;
  if (!result) {
    throw new Error("Parsed result is null.");
  }

  // Handle the case where no meaningful counter thesis exists based on rules
  const noMeaningfulCounterThesis = result.counterThesis.toLowerCase().includes("no strong counter-evidence");

  return {
    counterThesis: result.counterThesis,
    vulnerableAssumptions: result.vulnerableAssumptions,
    contradictoryEvidenceRefs: result.contradictoryEvidenceRefs,
    noMeaningfulCounterThesis: noMeaningfulCounterThesis,
    explanation: result.explanation
  };
}
