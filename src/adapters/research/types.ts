export type ResearchProviderStatus = "AVAILABLE" | "DEGRADED" | "UNAVAILABLE";

export interface NormalizedResearchObservation {
  id: string;
  providerId: string;
  source: string;
  title: string;
  summary: string;
  observedTimestamp: string;
  providerStatus: ResearchProviderStatus;
  url?: string;
}

export interface ResearchProvider {
  readonly providerId: string;
  getStatus(): Promise<ResearchProviderStatus>;
  getObservations(asset: string, topic?: string): Promise<NormalizedResearchObservation[]>;
}
