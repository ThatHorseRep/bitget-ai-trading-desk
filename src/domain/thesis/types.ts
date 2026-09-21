import type { ThesisSignals, ScoringResult, VerdictGateResult } from "../../lib/verdict/scoring";

export type ThesisItemOrigin = "USER_STATED" | "AI_INFERRED";
export type ThesisQuality = "STRONGER" | "MIXED" | "WEAKER" | "INSUFFICIENT";

export interface ThesisItem {
  text: string;
  origin: ThesisItemOrigin;
  extractionConfidence?: number;
}

export interface Thesis {
  traderStatement: string;
  normalizedThesis: string;
  assumptions: ThesisItem[];
  dependencies: ThesisItem[];
  supportingEvidenceRefs: string[];
  invalidationConditions: ThesisItem[];
  unresolvedAmbiguities: string[];
  signals?: ThesisSignals;
  signalsParseFailed?: boolean;
  modelInfo?: { model: string; provider: string };
}

export interface Challenge {
  counterThesis: string;
  vulnerableAssumptions: string[];
  contradictoryEvidenceRefs: string[];
  noMeaningfulCounterThesis: boolean;
  explanation: string;
  modelInfo?: { model: string; provider: string };
}

export interface ExecutionRiskMetric {
  metricName: string;
  positionNotionalUsd: number;
  visibleNotionalUsd: number | "UNKNOWN";
  ratio: number | "UNKNOWN";
  explanation: string;
}

export interface PositionQualityAssessment {
  quality: ThesisQuality;
  reasons: string[];
  keyDrivers: string[];
  executionRisk?: ExecutionRiskMetric;
}

export interface ThesisPositionAssessment {
  thesisQuality: ThesisQuality;
  positionQuality: PositionQualityAssessment;
  keyMismatch: string | null;
  explanation: string;
  modelInfo?: { model: string; provider: string };
  thesisScoreResult?: ScoringResult;
  positionScoreResult?: ScoringResult;
  gatedVerdictResult?: VerdictGateResult;
}
