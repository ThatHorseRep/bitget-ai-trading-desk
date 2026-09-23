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
        const timeoutPromise = new Promise<NormalizedResearchObservation[]>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout gathering from ${provider.providerId}`)), 5000)
        );

        const gatherPromise = (async () => {
          const status = await provider.getStatus();
          if (status === "UNAVAILABLE") {
            return [];
          }
          const observations = await provider.getObservations(asset, topic);
          return Array.isArray(observations) ? observations : [];
        })();

        return await Promise.race([gatherPromise, timeoutPromise]);
      } catch (err) {
        // Provider failure or timeout does not crash the core
        console.warn(`[ResearchProviderRegistry] Provider ${provider.providerId} skipped:`, (err as Error).message);
        return [];
      }
    });

    const results = await Promise.allSettled(promises);
    return results
      .filter((r): r is PromiseFulfilledResult<NormalizedResearchObservation[]> => r.status === "fulfilled")
      .flatMap(r => r.value);
  }
}
