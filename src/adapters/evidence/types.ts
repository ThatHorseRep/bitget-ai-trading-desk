import type { EvidenceItem } from "../../domain/decision/types";

export interface EvidenceQuery {
  asset: string;
  topic?: string;
  maxRecords?: number;
}

export interface EvidenceProvider {
  retrieveEvidence(query: EvidenceQuery): Promise<EvidenceItem[]>;
}


