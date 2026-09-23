import type { DecisionArtifact, EvidenceItem, ProvenanceRecord } from "../domain/decision/types";
import { EvidenceArbitrator } from "../adapters/evidence/arbitrator";
import type { AgentHubHandoffPayload } from "../adapters/agenthub/handoff";
import { buildAgentHubHandoff } from "../adapters/agenthub/handoff";
import type { AgenticHandoffDocument } from "../adapters/agentic/handoff";
import { buildAgenticHandoff } from "../adapters/agentic/handoff";
import { rnvdaDemoMarketState } from "../fixtures/rnvda-demo";
import type { MarketState } from "../domain/market/types";
import type { NormalizedTrade, TradeIdea } from "../domain/trade/types";
import { SCENARIO_CONFIG } from "../core/scenarios/config";
import { runStressScenarios } from "../core/scenarios/engine";
import { parseNaturalLanguageTrade, type ParsedTradeResult } from "../core/trade/parser";
import { extractThesis } from "../core/thesis/extractor";
import { generateThesisChallenge } from "../core/thesis/challenger";
import { assessThesisVsPosition } from "../core/thesis/assessment";
import { evaluateDecision } from "../core/decision/policy";
import { classifyPositionQuality } from "../core/decision/classifyPosition";
import { MarketStateService } from "./marketStateService";
import { CompositeEvidenceProvider } from "../adapters/evidence/provider";
import type { EvidenceProvider } from "../adapters/evidence/types";
import { ResearchProviderRegistry } from "../adapters/research/registry";
import { createDefaultResearchRegistry } from "../adapters/research/defaultRegistry";
import { validateNormalizedTrade } from "../core/validation/runtime";
import { rnvdaDemoThesis, rnvdaDemoChallenge, rnvdaDemoThesisPosition, rnvdaDemoEvidence } from "../fixtures/rnvda-demo";

export interface DecisionDeskOptions {
  useFixture?: boolean;
  marketStateService?: MarketStateService;
  evidenceProvider?: EvidenceProvider;
  researchRegistry?: ResearchProviderRegistry;
  now?: Date;
  signal?: AbortSignal;
  onProgress?: (stageId: string, message: string) => void;
}

export interface DecisionWorkflowResult {
  step: "CLARIFICATION" | "DECISION_READY" | "ERROR";
  parsedResult: ParsedTradeResult;
  artifact: DecisionArtifact | null;
  limitations: string[];
  /**
   * PRE24-06: read-only Agent Hub research handoff for the developer's own
   * AI host. Present only on DECISION_READY. `executionAllowed` is typed
   * literal false and can never authorize any account operation.
   */
  agentHubHandoff?: AgentHubHandoffPayload;
  /**
   * PRE24-07: optional Agentic Account handoff path. Present only on
   * DECISION_READY. executionAllowed and orderPlaced are typed literal
   * false; the official OAuth flow (authorize_start) runs in the human's
   * own AI host — this application never builds a URL, stores credentials,
   * or executes anything.
   */
  agenticHandoff?: AgenticHandoffDocument;
}

function humanizeLimitation(stage: string, err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("quota")) {
    return `${stage}: AI reasoning service temporarily rate-limited (LLM request failed (429)). Switched seamlessly to deterministic risk analysis.`;
  }
  if (lower.includes("500") || lower.includes("502") || lower.includes("503") || lower.includes("internal server error")) {
    return `${stage}: AI reasoning service encountered upstream outage (LLM request failed (500)). Switched seamlessly to deterministic risk analysis.`;
  }
  if (lower.includes("timeout") || lower.includes("aborterror") || lower.includes("aborted")) {
    return `${stage}: AI reasoning latency exceeded desk limit (timeout). Switched seamlessly to deterministic risk analysis.`;
  }
  if (msg.includes("Failed to extract thesis")) {
    return `${stage}: Failed to extract thesis due to non-conforming model schema response. Desk continued via deterministic rules.`;
  }
  if (lower.includes("401") || lower.includes("unauthorized") || lower.includes("403") || lower.includes("access denied")) {
    return `${stage}: AI model credentials or permission issue. Switched to deterministic rules.`;
  }
  if (lower.includes("404") || lower.includes("not found")) {
    return `${stage}: Configured reasoning model unavailable on endpoint. Switched to deterministic rules.`;
  }

  // Clean raw error string of unsightly JSON blobs or brackets
  const clean = msg
    .replace(/\{[\s\S]*\}/g, "")
    .replace(/Error:/gi, "")
    .replace(/[<>\[\]{}"]/g, "")
    .trim();

  if (clean.length > 5) {
    return `${stage}: External reasoning unavailable (${clean.slice(0, 100)}). Desk completed analysis via deterministic rules.`;
  }

  return `${stage}: External reasoning layer unavailable. Desk completed analysis via deterministic rules.`;
}

export class DecisionDeskService {
  private marketStateService: MarketStateService;
  private evidenceProvider: EvidenceProvider;
  private researchRegistry: ResearchProviderRegistry;

  constructor(
    marketStateService: MarketStateService = new MarketStateService(),
    evidenceProvider: EvidenceProvider = new CompositeEvidenceProvider(),
    researchRegistry?: ResearchProviderRegistry
  ) {
    this.marketStateService = marketStateService;
    this.evidenceProvider = evidenceProvider;
    if (researchRegistry) {
      this.researchRegistry = researchRegistry;
    } else {
      // PRE24-01: composition root for optional external research providers.
      // Slots: legacy evidence adapter, Bitget US Equity MCP, Bitget Signal
      // bridge, and a reserved Chainbase AgentKey slot (not implemented yet).
      this.researchRegistry = createDefaultResearchRegistry({
        evidenceProvider: this.evidenceProvider,
      });
    }
  }

  async runWorkflow(
    input: string | TradeIdea,
    options: DecisionDeskOptions = {}
  ): Promise<DecisionWorkflowResult> {
    const rawText = typeof input === "string" ? input : input.thesis;
    const now = options.useFixture && !options.now 
      ? new Date(rnvdaDemoMarketState.observedAt) 
      : (options.now ?? new Date());
    // Total wall-clock budget from WORKFLOW START — research (MCP calls,
    // Signal) consumes the same function wall as the LLM stages, so the
    // deadline anchor must precede everything (Vercel kills at maxDuration).
    const workflowStart = Date.now();

    // 1. Natural language parsing and trade normalization
    const parsedResult = typeof input === "string"
      ? parseNaturalLanguageTrade(input)
      : parseNaturalLanguageTrade(`${input.direction} $${input.positionSizeUsd} of ${input.asset} ${input.entryPrice ? `at ${input.entryPrice}` : ''} because ${input.thesis}`);

    if (parsedResult.requiresClarification || !parsedResult.normalizedTrade) {
      return {
        step: "CLARIFICATION",
        parsedResult,
        artifact: null,
        limitations: [parsedResult.clarificationQuestion ?? "Missing required trade details."]
      };
    }

    const trade: NormalizedTrade = parsedResult.normalizedTrade;
    const limitations: string[] = [];

    // 2. Reconstruct Market State
    options.onProgress?.("MARKET_STATE", "Reconstructing Market State");
    let marketState: MarketState;
    try {
      marketState = await this.marketStateService.getMarketState(trade.asset, {
        useFixture: options.useFixture,
        now
      });
    } catch (err) {
      return {
        step: "ERROR",
        parsedResult,
        artifact: null,
        limitations: [`Failed to retrieve market state: ${(err as Error).message}`]
      };
    }

    if (marketState.isFallbackDemo) {
      limitations.push(marketState.fallbackReason || "Bitget API unavailable - showing curated rNVDA weekend basis demo");
    } else if (marketState.dataQuality === "DEGRADED") {
      limitations.push("Market observations are partially degraded or missing optional secondary sources.");
    }

    // Update trade quantity & entry price with live market observation if initial was default
    if (trade.entryPriceSource === "SYSTEM_DERIVED") {
      trade.entryPrice = marketState.instrumentPrice;
      trade.entryBasisTimestamp = marketState.observedAt;
      trade.quantity = parseFloat((trade.positionSizeUsd / trade.entryPrice).toFixed(8));
    }

    const tradeValidation = validateNormalizedTrade(trade);
    if (!tradeValidation.valid) {
      return {
        step: "ERROR",
        parsedResult,
        artifact: null,
        limitations: [`Trade validation failed: ${tradeValidation.errors.join(", ")}`]
      };
    }

    // 3. Evidence Retrieval
    options.onProgress?.("EVIDENCE", "Retrieving External Evidence");
    let evidence: EvidenceItem[] = [];
    if (options.useFixture) {
      evidence = rnvdaDemoEvidence;
    } else {
      try {
        const registryToUse = options.researchRegistry ?? this.researchRegistry;
        const observations = await registryToUse.gatherObservations(trade.asset, trade.thesis);
        
        // PRE24-04: Source arbitration at the Evidence layer.
        // The arbitrator preserves all material source identities, timestamps,
        // and observed values; detects conflicts; and never silently picks
        // a convenient number. It returns limitations for any conflict,
        // staleness, or unavailability it detects.
        const arbitrator = new EvidenceArbitrator();
        const arbitration = arbitrator.arbitrate(observations, { now });
        evidence = arbitration.evidence;
        limitations.push(...arbitration.limitations);
      } catch (err) {
        limitations.push(humanizeLimitation("Evidence Retrieval", err));
      }
    }

    // 4. Deterministic Stress Scenarios
    options.onProgress?.("SCENARIOS", "Running Deterministic Stress Scenarios");
    const scenarios = runStressScenarios(trade, marketState, SCENARIO_CONFIG);
    const positionQuality = classifyPositionQuality(scenarios, marketState, trade);

    // 5. Thesis Extraction & Decomposition
    options.onProgress?.("THESIS_EXTRACTION", "Extracting and Decomposing Thesis");
    let thesis: import("../domain/thesis/types").Thesis | null = null;
    let challenge: import("../domain/thesis/types").Challenge | null = null;
    let thesisPosition: import("../domain/thesis/types").ThesisPositionAssessment | null = null;

    if (options.useFixture) {
      thesis = rnvdaDemoThesis;
      challenge = rnvdaDemoChallenge;
      thesisPosition = rnvdaDemoThesisPosition;
    } else {
      // Wall-clock budget for the three LLM stages. On Vercel the route's
      // maxDuration is a hard function kill: exceeding it terminates the
      // stream before any result line is written, which the UI renders as
      // "Analysis failed" with no limitation text (observed 2026-09-21).
      // Every stage receives the same absolute deadline and its LLM call is
      // clamped/skipped to fit, so the workflow ALWAYS returns a decision —
      // degraded with honest limitations when time runs short.
      const llmBudgetMs = process.env.VERCEL ? 45_000 : 300_000;
      const llmDeadline = workflowStart + llmBudgetMs;
      try {
        if (options.signal?.aborted) throw new Error("AbortError");
        thesis = await extractThesis(trade, marketState, evidence, llmDeadline);
        // Validate evidence references generated by the LLM
        if (thesis) {
          thesis.supportingEvidenceRefs = thesis.supportingEvidenceRefs.filter(ref => evidence.some(e => e.id === ref));
        }
      } catch (err) {
        if (options.signal?.aborted) throw err;
        limitations.push(humanizeLimitation("Thesis Extraction", err));
      }

      if (thesis) {
        try {
          // 6. Adversarial Thesis Challenge
          options.onProgress?.("CHALLENGE", "Generating Adversarial Counter-Thesis");
          if (options.signal?.aborted) throw new Error("AbortError");
          if (Date.now() >= llmDeadline - 6000) {
            limitations.push("Adversarial Challenge: Skipped to fit workflow latency budget. Stress models and extracted thesis remain verified.");
          } else {
            challenge = await generateThesisChallenge(thesis, trade, marketState, scenarios, evidence, llmDeadline);
          }
          // Validate evidence references generated by the LLM
          if (challenge) {
            challenge.contradictoryEvidenceRefs = challenge.contradictoryEvidenceRefs.filter(ref => evidence.some(e => e.id === ref));
          }
        } catch (err) {
          if (options.signal?.aborted) throw err;
          limitations.push(humanizeLimitation("Adversarial Challenge", err));
        }

        try {
          // 7. Independent Thesis vs Position Assessment
          options.onProgress?.("ASSESSMENT", "Evaluating Thesis vs. Position");
          if (options.signal?.aborted) throw new Error("AbortError");
          if (challenge) {
            if (Date.now() >= llmDeadline - 6000) {
              limitations.push("Position Assessment: Skipped narrative synthesis due to latency budget. Quantitative position risk remains verified.");
            } else {
              thesisPosition = await assessThesisVsPosition(thesis, trade, marketState, scenarios, challenge, evidence, llmDeadline);
            }
          } else {
             limitations.push("Position Assessment: Evaluated using deterministic stress risk metrics (Adversarial challenge was unavailable).");
          }
        } catch (err) {
          if (options.signal?.aborted) throw err;
          limitations.push(humanizeLimitation("Qualitative Synthesis", err));
        }
      }
    }

    // SAFE FALLBACK: If LLM narrative synthesis fails, synthesize from deterministic signals and position quality
    if (!thesisPosition) {
      const signals = thesis?.signals;
      const isStrongThesis = signals
        ? (signals.hasDirectionalClaim && (signals.hasNamedCatalyst || signals.hasInvalidationLevel))
        : Boolean(trade.thesis && trade.thesis.length > 20);
      const fallbackThesisQuality = isStrongThesis ? "STRONGER" : (thesis ? "MIXED" : "INSUFFICIENT");

      thesisPosition = {
        thesisQuality: fallbackThesisQuality,
        positionQuality: positionQuality,
        keyMismatch: isStrongThesis ? null : "Thesis lacks explicit catalyst or invalidation level.",
        explanation: `Deterministic qualitative synthesis derived from structural thesis signals (${isStrongThesis ? "Strong directional and invalidation parameters" : "Standard parameters"}).`
      };
    }

    // 8. Deterministic Decision Policy
    options.onProgress?.("POLICY", "Evaluating Deterministic Decision Policy");
    const decision = evaluateDecision({
      marketState,
      thesis,
      thesisQuality: thesisPosition?.thesisQuality ?? null,
      positionQuality,
      positionAssessment: thesisPosition,
      scenarios,
      dataQuality: marketState.dataQuality,
      criticalBlockers: [],
      materialUncertainty: thesis ? thesis.unresolvedAmbiguities.length > 0 : false
    });

    // 9. Provenance Compilation (Facts, Calculations, Assumptions, Interpretations)
    options.onProgress?.("PROVENANCE", "Compiling Decision Provenance");
    const provenance: ProvenanceRecord[] = [
      ...marketState.sources.map((src) => ({
        id: `prov-source-${src.id}`,
        type: "OBSERVED_FACT" as const,
        source: src.name,
        observedAt: src.observedAt,
        generatedBy: "Market Data Adapter"
      })),
      ...evidence.map((ev) => ({
        id: `prov-ev-${ev.id}`,
        type: "OBSERVED_FACT" as const,
        source: ev.source,
        sourceRef: ev.url,
        publishedAt: ev.publishedAt,
        retrievedAt: ev.retrievedAt,
        generatedBy: "Evidence Provider",
        evidenceState: ev.state
      })),
      {
        id: "prov-calc-basis",
        type: "CALCULATED_METRIC" as const,
        source: "Deterministic Basis Arithmetic (tokenPrice - referencePrice)",
        inputs: [`tokenPrice: ${marketState.instrumentPrice}`, `referencePrice: ${marketState.referencePrice ?? "null"}`],
        generatedBy: "Financial Calculations Module"
      },
      {
        id: "prov-calc-scenarios",
        type: "CALCULATED_METRIC" as const,
        source: "Deterministic Stress Engine",
        inputs: [`positionSizeUsd: ${trade.positionSizeUsd}`, `shocks: ${scenarios.map(s => `${s.id} (${s.estimatedPnlPct}%)`).join(", ")}`],
        generatedBy: "Scenario Engine"
      },
      ...scenarios.map((sc) => ({
        id: `prov-assumption-${sc.id}`,
        type: "SCENARIO_ASSUMPTION" as const,
        source: `Scenario: ${sc.name}`,
        inputs: sc.assumptions,
        generatedBy: "Scenario Configuration"
      }))
    ];

    if (thesis) {
      provenance.push({
        id: "prov-ai-thesis",
        type: "AI_INTERPRETATION" as const,
        source: "Thesis Extraction & Decomposition",
        generatedBy: "Language Reasoning Layer",
        modelIdentity: thesis.modelInfo ? `${thesis.modelInfo.provider}/${thesis.modelInfo.model}` : undefined
      });
    }

    if (challenge) {
      provenance.push({
        id: "prov-ai-challenge",
        type: "AI_INTERPRETATION" as const,
        source: "Adversarial Counter-Thesis",
        generatedBy: "Language Reasoning Layer",
        modelIdentity: challenge.modelInfo ? `${challenge.modelInfo.provider}/${challenge.modelInfo.model}` : undefined
      });
    }

    if (thesisPosition) {
      provenance.push({
        id: "prov-ai-assessment",
        type: "AI_INTERPRETATION" as const,
        source: "Thesis vs Position Evaluation",
        generatedBy: "Language Reasoning Layer",
        modelIdentity: thesisPosition.modelInfo ? `${thesisPosition.modelInfo.provider}/${thesisPosition.modelInfo.model}` : undefined
      });
    }

    const materialUncertainty = thesis ? thesis.unresolvedAmbiguities.length > 0 : false;
    if (materialUncertainty) {
      limitations.push(`Material Uncertainty: ${thesis!.unresolvedAmbiguities.join("; ")}`);
    }

    const artifact: DecisionArtifact = {
      artifactId: `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      generatedAt: now.toISOString(),
      trade,
      decision,
      marketState,
      thesis,
      challenge,
      scenarios,
      thesisPosition,
      changeConditions: decision.changeConditions,
      evidence,
      provenance,
      limitations,
      dataSource: (options.useFixture || marketState.isSynthetic || marketState.isFallbackDemo) ? "fixture" : "live",
      isFallbackDemo: options.useFixture || marketState.isFallbackDemo || false,
      fallbackReason: marketState.fallbackReason || (options.useFixture ? "Showing curated rNVDA weekend basis demo" : undefined)
    };

    return {
      step: "DECISION_READY",
      parsedResult,
      artifact,
      limitations,
      // PRE24-06: structured read-only Agent Hub handoff, built from the
      // finished artifact. executionAllowed is typed literal false; the
      // app is fully functional without Agent Hub ever being connected.
      agentHubHandoff: buildAgentHubHandoff(artifact),
      // PRE24-07: Agentic handoff document, built from the finished
      // artifact with the connection state UNAVAILABLE by default — the
      // app never claims a connection it did not observe from the
      // official MCP. Purely additive; nothing executes here.
      agenticHandoff: buildAgenticHandoff(artifact),
    };
  }
}


