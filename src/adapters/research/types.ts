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
  /**
   * Optional numeric value for observed facts that can be compared across
   * sources (e.g. price, volume, analyst target). When present, the
   * arbitrator can detect conflicts between providers reporting different
   * numbers for the same metric.
   */
  value?: number;
  /** Unit of the optional numeric value (e.g. USD, percent, ratio). */
  unit?: string;
}

export interface ResearchProvider {
  readonly providerId: string;
  getStatus(): Promise<ResearchProviderStatus>;
  getObservations(asset: string, topic?: string): Promise<NormalizedResearchObservation[]>;
}
