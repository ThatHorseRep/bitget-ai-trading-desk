import { NormalizedResearchObservation, ResearchProvider } from "./types";

/**
 * Per-provider outcome of a gather pass. Makes "attempted but contributed
 * nothing" visible to callers so the decision artifact can honestly show
 * which ecosystem integrations were reachable in THIS evaluation, instead
 * of silently omitting them (which read as integrations that never ran).
 */
export type ResearchProviderOutcomeStatus = "OBSERVATIONS" | "EMPTY" | "UNAVAILABLE" | "ERROR" | "TIMEOUT";

export interface ResearchProviderOutcome {
  providerId: string;
  status: ResearchProviderOutcomeStatus;
  observationCount: number;
  /** Failure detail for ERROR/TIMEOUT outcomes; absent otherwise. */
  detail?: string;
}

/**
 * Per-provider gather budget (ms). Env-tunable so deployments behind slower
 * gateways (e.g. the Bitget Signal MCP, whose tool calls aggregate several
 * upstream APIs and are documented to take 15-30s when slow) can raise it
 * without code changes. Default 5000 is unchanged; the value is clamped to
 * [3000, 30000] so a bad env value can neither stall the workflow nor be
 * set low enough to starve every provider.
 */
export const DEFAULT_PROVIDER_BUDGET_MS = 5000;

export function resolveProviderBudgetMs(env: Record<string, string | undefined> = process.env): number {
  const parsed = Number(env.RESEARCH_PROVIDER_BUDGET_MS);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PROVIDER_BUDGET_MS;
  return Math.min(30_000, Math.max(3_000, Math.round(parsed)));
}

const PROVIDER_BUDGET_MS = resolveProviderBudgetMs();

export class ResearchProviderRegistry {
  private providers: ResearchProvider[] = [];

  register(provider: ResearchProvider) {
    this.providers.push(provider);
  }

  getRegisteredProviders(): string[] {
    return this.providers.map(p => p.providerId);
  }

  async gatherObservations(asset: string, topic?: string): Promise<NormalizedResearchObservation[]> {
    const { observations } = await this.gatherObservationsDetailed(asset, topic);
    return observations;
  }

  async gatherObservationsDetailed(
    asset: string,
    topic?: string
  ): Promise<{ observations: NormalizedResearchObservation[]; outcomes: ResearchProviderOutcome[] }> {
    const promises = this.providers.map(async (provider): Promise<{ outcome: ResearchProviderOutcome; observations: NormalizedResearchObservation[] }> => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout gathering from ${provider.providerId}`)), PROVIDER_BUDGET_MS)
      );

      const gatherPromise = (async () => {
        const status = await provider.getStatus();
        if (status === "UNAVAILABLE") {
          return {
            outcome: { providerId: provider.providerId, status: "UNAVAILABLE" as const, observationCount: 0 },
            observations: [] as NormalizedResearchObservation[],
          };
        }
        const observations = await provider.getObservations(asset, topic);
        const list = Array.isArray(observations) ? observations : [];
        return {
          outcome: {
            providerId: provider.providerId,
            status: (list.length > 0 ? "OBSERVATIONS" : "EMPTY") as ResearchProviderOutcomeStatus,
            observationCount: list.length,
          },
          observations: list,
        };
      })();

      try {
        return await Promise.race([gatherPromise, timeoutPromise]);
      } catch (err) {
        const message = (err as Error).message ?? String(err);
        // Provider failure or timeout does not crash the core
        console.warn(`[ResearchProviderRegistry] Provider ${provider.providerId} skipped:`, message);
        const status: ResearchProviderOutcomeStatus = message.startsWith("Timeout gathering from") ? "TIMEOUT" : "ERROR";
        return {
          outcome: { providerId: provider.providerId, status, observationCount: 0, detail: message },
          observations: [],
        };
      }
    });

    const results = await Promise.all(promises);
    return {
      observations: results.flatMap(r => r.observations),
      outcomes: results.map(r => r.outcome),
    };
  }
}
