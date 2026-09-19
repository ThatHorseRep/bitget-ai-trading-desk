import type { DecisionArtifact, EvidenceItem, ProvenanceRecord } from "../domain/decision/types";
import { EvidenceArbitrator } from "../adapters/evidence/arbitrator";
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
import { BitgetUsEquityMcpProvider } from "../adapters/research/bitgetUsEquityMcpProvider";
import { LegacyEvidenceProviderAdapter } from "../adapters/research/legacyAdapter";
import { BitgetSignalAgentBridge } from "../adapters/research/bitgetSignalAgentBridge";
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
      this.researchRegistry = new ResearchProviderRegistry();
      this.researchRegistry.register(new LegacyEvidenceProviderAdapter(this.evidenceProvider));
      this.researchRegistry.register(new BitgetUsEquityMcpProvider());
      this.researchRegistry.register(new BitgetSignalAgentBridge());
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

    if (marketState.dataQuality === "DEGRADED") {
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
        limitations.push(`Evidence retrieval failed: ${(err as Error).message}. Operating without external evidence.`);
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
      try {
        if (options.signal?.aborted) throw new Error("AbortError");
        thesis = await extractThesis(trade, marketState, evidence);
        // Validate evidence references generated by the LLM
        if (thesis) {
          thesis.supportingEvidenceRefs = thesis.supportingEvidenceRefs.filter(ref => evidence.some(e => e.id === ref));
        }
      } catch (err) {
        if ((err as Error).message === "AbortError" || (err as Error).name === "AbortError") throw err;
        limitations.push(`Language reasoning layer (Thesis Extraction) failed: ${(err as Error).message}`);
      }

      if (thesis) {
        try {
          // 6. Adversarial Thesis Challenge
          options.onProgress?.("CHALLENGE", "Generating Adversarial Counter-Thesis");
          if (options.signal?.aborted) throw new Error("AbortError");
          challenge = await generateThesisChallenge(thesis, trade, marketState, scenarios, evidence);
          // Validate evidence references generated by the LLM
          if (challenge) {
            challenge.contradictoryEvidenceRefs = challenge.contradictoryEvidenceRefs.filter(ref => evidence.some(e => e.id === ref));
          }
        } catch (err) {
          if ((err as Error).message === "AbortError" || (err as Error).name === "AbortError") throw err;
          limitations.push(`Language reasoning layer (Adversarial Challenge) failed: ${(err as Error).message}`);
        }

        try {
          // 7. Independent Thesis vs Position Assessment
          options.onProgress?.("ASSESSMENT", "Evaluating Thesis vs. Position");
          if (options.signal?.aborted) throw new Error("AbortError");
          if (challenge) {
            thesisPosition = await assessThesisVsPosition(thesis, trade, marketState, scenarios, challenge, evidence);
          } else {
             limitations.push("Skipping qualitative synthesis (Position Assessment) because Adversarial Challenge failed.");
          }
        } catch (err) {
          if ((err as Error).message === "AbortError" || (err as Error).name === "AbortError") throw err;
          limitations.push(`Language reasoning layer (Qualitative Synthesis) failed: ${(err as Error).message}`);
        }
      }
    }

    // SAFE FALLBACK: If LLM fails to provide thesisPosition, default to INSUFFICIENT to ensure deterministic rejection/wait
    if (!thesisPosition) {
      thesisPosition = {
        thesisQuality: "INSUFFICIENT",
        positionQuality: { quality: "INSUFFICIENT", reasons: ["Assessor LLM failed or skipped"], keyDrivers: [] },
        keyMismatch: "Assessment unavailable due to system failure",
        explanation: "Fallback assessment generated because the reasoning layer failed to respond."
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
      limitations
    };

    return {
      step: "DECISION_READY",
      parsedResult,
      artifact,
      limitations
    };
  }
}


