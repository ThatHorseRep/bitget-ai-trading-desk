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
}

export interface Challenge {
  counterThesis: string;
  vulnerableAssumptions: string[];
  contradictoryEvidenceRefs: string[];
  noMeaningfulCounterThesis: boolean;
  explanation: string;
}

export interface ThesisPositionAssessment {
  thesisQuality: ThesisQuality;
  positionQuality: ThesisQuality;
  keyMismatch: string | null;
  explanation: string;
}
