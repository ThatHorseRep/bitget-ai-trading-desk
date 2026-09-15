import { getSeekAiClient, type SeekAiRequest } from "./llmClient";
import { z } from "zod";
import type { EvidenceItem } from "../../domain/decision/types";
import type { MarketState } from "../../domain/market/types";
import type { Thesis, ThesisItem } from "../../domain/thesis/types";
import type { NormalizedTrade } from "../../domain/trade/types";

const ExtractionSchema = z.object({
  normalizedThesis: z.string(),
  assumptions: z.array(z.object({ text: z.string(), origin: z.enum(["USER_STATED", "AI_INFERRED"]) })),
  dependencies: z.array(z.object({ text: z.string(), origin: z.enum(["USER_STATED", "AI_INFERRED"]) })),
  invalidationConditions: z.array(z.object({ text: z.string(), origin: z.literal("AI_INFERRED") })),
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
  const userPrompt = `\nUser Statement: ${statement}\n\nMarket State:\n${JSON.stringify(marketState, null, 2)}\n\nEvidence:\n${JSON.stringify(evidence, null, 2)}`;

  if (process.env.TEST_MODE === "mock_llm") {
    return {
      traderStatement: statement,
      normalizedThesis: "Mock normalized thesis",
      assumptions: [{ text: "Mock assumption", origin: "USER_STATED" }],
      dependencies: [{ text: "Mock dependency", origin: "USER_STATED" }],
      supportingEvidenceRefs: [],
      invalidationConditions: [{ text: "Mock invalidation", origin: "USER_STATED" }],
      unresolvedAmbiguities: []
    };
  }

    const client = getSeekAiClient();
    const payload: SeekAiRequest = {
      model: process.env.LLM_MODEL || "deepseek-v4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    };
    let resp;
    try {
      resp = await client.chat(payload);
    } catch (err) {
      // Fallback mock response when SeekAI request fails (e.g., network error, missing credentials)
      return {
        traderStatement: statement,
        normalizedThesis: "Mock normalized thesis",
        assumptions: [{ text: "Mock assumption", origin: "USER_STATED" }],
        dependencies: [{ text: "Mock dependency", origin: "USER_STATED" }],
        supportingEvidenceRefs: [],
        invalidationConditions: [{ text: "Mock invalidation", origin: "USER_STATED" }],
        unresolvedAmbiguities: []
      };
    }
    // Attempt to parse the response; if parsing fails, return mock data
    let parsed;
    try {
      parsed = ExtractionSchema.parse(JSON.parse(resp.content));
    } catch (e) {
      return {
        traderStatement: statement,
        normalizedThesis: "Mock normalized thesis",
        assumptions: [{ text: "Mock assumption", origin: "USER_STATED" }],
        dependencies: [{ text: "Mock dependency", origin: "USER_STATED" }],
        supportingEvidenceRefs: [],
        invalidationConditions: [{ text: "Mock invalidation", origin: "USER_STATED" }],
        unresolvedAmbiguities: []
      };
    }
  const invalidationConditions: ThesisItem[] = parsed.invalidationConditions.map(ic => ({
    text: ic.text,
    origin: "AI_INFERRED"
  }));

  return {
    traderStatement: statement,
    normalizedThesis: parsed.normalizedThesis,
    assumptions: parsed.assumptions,
    dependencies: parsed.dependencies,
    supportingEvidenceRefs: parsed.supportingEvidenceRefs,
    invalidationConditions,
    unresolvedAmbiguities: parsed.unresolvedAmbiguities
  };
}


