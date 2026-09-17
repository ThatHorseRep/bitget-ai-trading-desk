import type { EvidenceProvider } from "../evidence/types";
import type { NormalizedResearchObservation, ResearchProvider, ResearchProviderStatus } from "./types";

export class LegacyEvidenceProviderAdapter implements ResearchProvider {
  constructor(private legacyProvider: EvidenceProvider) {}

  get providerId(): string {
    return "legacy-evidence-provider";
  }

  async getStatus(): Promise<ResearchProviderStatus> {
    return "AVAILABLE";
  }

  async getObservations(asset: string, topic?: string): Promise<NormalizedResearchObservation[]> {
    const items = await this.legacyProvider.retrieveEvidence({ asset, topic });
    return items.map(item => ({
      id: item.id,
      providerId: this.providerId,
      source: item.source,
      title: item.title,
      summary: item.summary,
      observedTimestamp: item.retrievedAt || new Date().toISOString(),
      providerStatus: item.state === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE",
      url: item.url
    }));
  }
}
