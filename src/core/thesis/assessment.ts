import { getSeekAiClient, type SeekAiRequest } from "./llmClient";
import { getNarrative } from "./narrativeCache";
import { z } from "zod";
import type { EvidenceItem } from "../../domain/decision/types";
import type { MarketState } from "../../domain/market/types";
import type { StressScenario } from "../../domain/scenarios/types";
import type { Thesis, ThesisPositionAssessment, ThesisQuality, Challenge } from "../../domain/thesis/types";
import { classifyPositionQuality } from "../decision/classifyPosition";
import type { NormalizedTrade } from "../../domain/trade/types";

const modelName = process.env.LLM_MODEL || "deepseek-v4-flash";

const AssessmentSchema = z.object({
  thesisQuality: z.enum(["STRONGER", "MIXED", "WEAKER", "INSUFFICIENT"]),
  // positionQuality is now computed deterministically; LLM only narrates.
  keyMismatch: z.string().nullable(),
  explanation: z.string()
});

export async function assessThesisVsPosition(
  thesis: Thesis,
  trade: NormalizedTrade,
  marketState: MarketState,
  scenarios: StressScenario[],
  challenge: Challenge,
  evidence: EvidenceItem[]
): Promise<ThesisPositionAssessment> {
  const deterministicResult = classifyPositionQuality(scenarios, marketState);
  const systemPrompt = `You are the final decision-support synthesizer.
You must evaluate two things independently:
1. Thesis Quality (STRONGER, MIXED, WEAKER, INSUFFICIENT): Based on the evidence and counter-thesis.
2. Position Quality (STRONGER, MIXED, WEAKER, INSUFFICIENT): Determined deterministically as ${deterministicResult.positionQuality} based on stress scenario losses, liquidity, and basis risk.

Rules:
1. A strong thesis does NOT mean a strong position. If the token is illiquid or basis is severely disconnected, Position Quality must be WEAKER even if the thesis is STRONGER.
2. Provide a concise explanation of any mismatch between thesis and position.`;

  const userPrompt = `
Trade Details:
${JSON.stringify(trade, null, 2)}

Thesis:
${JSON.stringify(thesis, null, 2)}

Counter-Thesis (Challenge):
${JSON.stringify(challenge, null, 2)}

Market State:
${JSON.stringify(marketState, null, 2)}

Stress Scenarios:
${JSON.stringify(scenarios, null, 2)}

Evidence:
${JSON.stringify(evidence, null, 2)}
  `;

let result;
try {
  const client = getSeekAiClient();
  const payload: SeekAiRequest = {
    model: modelName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  };
  const resp = await client.chat(payload);
  result = AssessmentSchema.parse(JSON.parse(resp.content));
} catch (error) {
  // Fallback to static narrative cache
  const fallbackExplanation = getNarrative(deterministicResult.positionQuality);
  result = {
    thesisQuality: deterministicResult.positionQuality as any,
    keyMismatch: null,
    explanation: fallbackExplanation
  };
}



  return {
    thesisQuality: result.thesisQuality as ThesisQuality,
    positionQuality: deterministicResult.positionQuality as ThesisQuality,
    keyMismatch: result.keyMismatch,
    explanation: result.explanation
  };
}


