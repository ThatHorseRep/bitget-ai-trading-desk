import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type { EvidenceItem } from "../../domain/decision/types";
import type { MarketState } from "../../domain/market/types";
import type { Thesis, ThesisItem } from "../../domain/thesis/types";
import type { NormalizedTrade } from "../../domain/trade/types";

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.LLM_API_BASE_URL || undefined,
});
const modelName = process.env.LLM_MODEL || "gpt-4o";

const ExtractionSchema = z.object({
  normalizedThesis: z.string(),
  assumptions: z.array(z.object({
    text: z.string(),
    origin: z.enum(["USER_STATED", "AI_INFERRED"])
  })),
  dependencies: z.array(z.object({
    text: z.string(),
    origin: z.enum(["USER_STATED", "AI_INFERRED"])
  })),
  invalidationConditions: z.array(z.object({
    text: z.string(),
    origin: z.literal("AI_INFERRED") // Changed from enum for compatibility if needed, but B05 says "AI_INFERRED". Let's stick to enum for safety
  })),
  supportingEvidenceRefs: z.array(z.string()),
  unresolvedAmbiguities: z.array(z.string())
});

export async function extractThesis(
  trade: NormalizedTrade,
  marketState: MarketState,
  evidence: EvidenceItem[]
): Promise<Thesis> {
  const statement = trade.thesis;

  const systemPrompt = `You are a quantitative trading risk analyst. 
Your job is to deconstruct a trader's natural language trade idea into a structured thesis.
You will be provided with the user's statement, current market state, and recent evidence.

Rules:
1. Extract the core assumptions driving the trade.
2. Identify external dependencies (e.g., supply chain, macro conditions).
3. Define invalidation conditions (what specific events would prove the thesis wrong).
4. Tag each item's origin as "USER_STATED" if explicitly mentioned, or "AI_INFERRED" if logically deduced.
5. Do not evaluate if the trade is good or bad; only deconstruct it.`;

  const userPrompt = `
User Statement: ${statement}

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
      response_format: zodResponseFormat(ExtractionSchema, "extraction")
    });
  } catch (error) {
    throw new Error(`Failed to extract thesis: ${error}`);
  }

  const result = response.choices[0].message.parsed;
  if (!result) {
    throw new Error("Parsed result is null.");
  }

  // Ensure origin constraint on invalidation conditions
  const invalidationConditions: ThesisItem[] = result.invalidationConditions.map((ic: any) => ({
    text: ic.text,
    origin: "AI_INFERRED"
  }));

  return {
    traderStatement: statement,
    normalizedThesis: result.normalizedThesis,
    assumptions: result.assumptions,
    dependencies: result.dependencies,
    supportingEvidenceRefs: result.supportingEvidenceRefs,
    invalidationConditions: invalidationConditions,
    unresolvedAmbiguities: result.unresolvedAmbiguities
  };
}
