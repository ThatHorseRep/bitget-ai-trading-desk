import type { DataQualityStatus } from "../market/types";
import type { ThesisQuality, ThesisPositionAssessment } from "../thesis/types";
import type { StressScenario } from "../scenarios/types";
import type { MarketState } from "../market/types";
import type { NormalizedTrade } from "../trade/types";

export type DecisionVerdict = "PROCEED" | "WAIT" | "REDUCE" | "REJECT";
export type DecisionReasonCode = 
  | "FATAL_INVALID_TRADE"
  | "CRITICAL_DATA_BLOCKER"
  | "INSUFFICIENT_THESIS"
  | "THESIS_CONTRADICTED"
  | "SEVERE_POSITION_RISK"
  | "OFF_HOURS_WAIT"
  | "REDUCE_POSITION_SIZE"
  | "MATERIAL_UNCERTAINTY"
  | "PROCEED_OK";

export interface DecisionReason {
  code: DecisionReasonCode;
  message: string;
}

export interface DecisionInputs {
  marketState: MarketState;
  thesis: import("../thesis/types").Thesis | null;
  thesisQuality: ThesisQuality | null;
  positionQuality: import("../thesis/types").PositionQualityAssessment;
  positionAssessment: import("../thesis/types").ThesisPositionAssessment | null;
  scenarios: StressScenario[];
  dataQuality: DataQualityStatus;
  criticalBlockers?: string[];
  materialUncertainty?: boolean;
}

export interface Decision {
  verdict: DecisionVerdict;
  reasons: DecisionReason[];
  blockers: string[];
  changeConditions: string[];
}

export interface DecisionPolicyConfig {
  unsupportedAssetVerdict: "REJECT";
  invalidTradeVerdict: "REJECT";
  criticalDataVerdict: "WAIT";
  materialUncertaintyVerdict: "WAIT";
}

export interface DecisionArtifact {
  artifactId: string;
  generatedAt: string;
  trade: NormalizedTrade;
  decision: Decision;
  marketState: MarketState;
  thesis: import("../thesis/types").Thesis | null;
  challenge: import("../thesis/types").Challenge | null;
  scenarios: StressScenario[];
  thesisPosition: import("../thesis/types").ThesisPositionAssessment | null;
  changeConditions: string[];
  evidence: EvidenceItem[];
  provenance: ProvenanceRecord[];
  limitations: string[];
}

export type ProvenanceType = "OBSERVED_FACT" | "CALCULATED_METRIC" | "SCENARIO_ASSUMPTION" | "AI_INTERPRETATION";

export interface ProvenanceRecord {
  id: string;
  type: ProvenanceType;
  source?: string;
  sourceRef?: string;
  observedAt?: string;
  publishedAt?: string;
  retrievedAt?: string;
  inputs?: string[];
  generatedBy?: string;
  evidenceState?: EvidenceState;
  modelIdentity?: string;
}

export type EvidenceState = "LIVE_RETRIEVED" | "CURATED_DEMO_FIXTURE" | "UNAVAILABLE" | "RESEARCH_PROVIDER";

/**
 * Conflict state assigned to an EvidenceItem after source arbitration.
 * - UNRESOLVED_CONFLICT: numeric values from multiple sources disagree beyond tolerance;
 *   the arbitrator does NOT pick one — a conflict limitation is attached instead.
 * - DUPLICATE: same source+id already observed; deduplicated (kept once).
 * - STALE: observation timestamp is older than the staleness threshold.
 * - UNAVAILABLE: the observation was produced by a provider that returned
 *   "UNAVAILABLE" status or failed entirely.
 * - OK: no conflict detected; sources agree or only a single source reported.
 */
export type ConflictState = "OK" | "UNRESOLVED_CONFLICT" | "DUPLICATE" | "STALE" | "UNAVAILABLE";

export interface EvidenceItem {
  id: string;
  title: string;
  source: string;
  url?: string;
  publishedAt?: string;
  retrievedAt?: string;
  summary: string;
  state: EvidenceState;
  /**
   * Provenance of the evidence itself. "OBSERVED_FACT" for directly
   * observed data; "AI_INTERPRETATION" when the item reports an AI
   * step's interpretation (e.g. an agent-host Skill verdict). Widened
   * from a hardcoded "OBSERVED_FACT" in PRE24-04 so the Evidence layer
   * can honestly distinguish the two; all existing producers still
   * emit "OBSERVED_FACT".
   */
  provenanceType: ProvenanceType;
  providerId?: string;
  /**
   * Arbitration result. Present when the EvidenceArbitrator has processed
   * this item. Allows downstream consumers (e.g. DecisionArtifact) to
   * surface conflict limitations without losing the original observation.
   */
  conflictState?: ConflictState;
  /**
   * When conflictState is UNRESOLVED_CONFLICT, lists every source that
   * contributed a differing value so the conflict is fully traceable.
   * Preserved verbatim — no reconciliation is attempted.
   */
  conflictingSources?: string[];
  /** When the observation carried a numeric value, the normalized value. */
  observedValue?: number;
  /** Unit of observedValue (e.g. USD, percent). */
  observedUnit?: string;
}
