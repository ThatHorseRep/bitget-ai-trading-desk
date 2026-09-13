import type { DecisionArtifact, ProvenanceRecord } from "../../domain/decision/types";
import type { ParsedTradeResult } from "../../core/trade/parser";

export type WorkspaceStep =
  | "ENTRY"
  | "CLARIFICATION"
  | "REVIEW"
  | "ANALYZING"
  | "DECISION_READY"
  | "ERROR";

export interface AnalysisStage {
  id: number;
  label: string;
  description: string;
  detail?: string;
  status?: "pending" | "active" | "completed";
}

export interface WorkspaceState {
  step: WorkspaceStep;
  inputPrompt: string;
  useFixture: boolean;
  parsedResult: ParsedTradeResult | null;
  artifact: DecisionArtifact | null;
  error: string | null;
  activeStageIndex: number;
  stages: AnalysisStage[];
  isDrawerOpen: boolean;
  selectedProvenance: ProvenanceRecord | null;
}


