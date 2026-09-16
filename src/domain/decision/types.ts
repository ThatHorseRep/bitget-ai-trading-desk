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
  thesis: import("../thesis/types").Thesis;
  thesisQuality: ThesisQuality;
  positionAssessment: ThesisPositionAssessment;
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
  thesis: import("../thesis/types").Thesis;
  challenge: import("../thesis/types").Challenge;
  scenarios: StressScenario[];
  thesisPosition: ThesisPositionAssessment;
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

export type EvidenceState = "LIVE_RETRIEVED" | "CURATED_DEMO_FIXTURE" | "UNAVAILABLE";

export interface EvidenceItem {
  id: string;
  title: string;
  source: string;
  url?: string;
  publishedAt?: string;
  retrievedAt?: string;
  summary: string;
  state: EvidenceState;
  provenanceType: "OBSERVED_FACT";
}


