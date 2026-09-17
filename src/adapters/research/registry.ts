import { NormalizedResearchObservation, ResearchProvider } from "./types";

export class ResearchProviderRegistry {
  private providers: ResearchProvider[] = [];

  register(provider: ResearchProvider) {
    this.providers.push(provider);
  }

  getRegisteredProviders(): string[] {
    return this.providers.map(p => p.providerId);
  }

  async gatherObservations(asset: string, topic?: string): Promise<NormalizedResearchObservation[]> {
    const promises = this.providers.map(async (provider) => {
      try {
        const status = await provider.getStatus();
        if (status === "UNAVAILABLE") {
          return [];
        }
        return await provider.getObservations(asset, topic);
      } catch (err) {
        // Provider failure does not crash the core
        console.warn(`[ResearchProviderRegistry] Provider ${provider.providerId} failed:`, err);
        return [];
      }
    });

    const results = await Promise.allSettled(promises);
    return results
      .filter((r): r is PromiseFulfilledResult<NormalizedResearchObservation[]> => r.status === "fulfilled")
      .flatMap(r => r.value);
  }
}
