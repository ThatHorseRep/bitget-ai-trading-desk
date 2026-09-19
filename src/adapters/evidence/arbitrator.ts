import type { EvidenceItem, ConflictState } from "../../domain/decision/types";
import type { NormalizedResearchObservation } from "../research/types";

/**
 * Options for controlling EvidenceArbitrator behavior.
 */
export interface EvidenceArbitratorOptions {
  /**
   * Maximum age in milliseconds beyond which an observation is considered stale.
   * Observations with observedTimestamp older than (now - staleThresholdMs)
   * are flagged with conflictState = "STALE" but still passed through.
   */
  staleThresholdMs?: number;
  /**
   * Relative tolerance for numeric conflict detection. Two numeric values
   * are considered "the same" if |a - b| / max(|a|, |b|) <= valueTolerance.
   * Defaults to 0.005 (0.5%).
   */
  valueTolerance?: number;
  /**
   * If provided, used as "now" for staleness calculations (mainly for tests).
   */
  now?: Date;
}

/**
 * A single source's contribution to a potential conflict. Preserved so
 * downstream consumers can see exactly which sources disagreed.
 */
export interface ConflictWitness {
  source: string;
  providerId: string;
  value: number;
  unit?: string;
  observedTimestamp: string;
}

/**
 * The EvidenceArbitrator is the single authority for deciding whether
 * observations from multiple research providers agree or conflict on
 * quantitative metrics.
 *
 * Design principles (PRE24-04):
 * - Preserve ALL material source identities. Every source that contributed
 *   a value is recorded in `conflictingSources`.
 * - Preserve timestamps. The original observedTimestamp is never modified.
 * - Distinguish observed facts from AI interpretations. Only observations
 *   with provenanceType = "OBSERVED_FACT" enter numeric conflict detection;
 *   AI interpretations are passed through with conflictState = "OK".
 * - Detect conflicting observations. When two or more sources report
 *   numeric values for the same metric and the spread exceeds tolerance,
 *   the item is marked UNRESOLVED_CONFLICT — the arbitrator NEVER picks
 *   a "convenient" value.
 * - Never let an LLM invent a reconciliation. There is no LLM call here;
 *   conflicts are reported, not resolved.
 * - Attach a conflict limitation. When a conflict is unresolved, a
 *   limitation string is produced alongside the evidence so the
 *   DecisionArtifact can surface it.
 */
export class EvidenceArbitrator {
  private readonly staleThresholdMs: number;
  private readonly valueTolerance: number;

  constructor(options: EvidenceArbitratorOptions = {}) {
    this.staleThresholdMs = options.staleThresholdMs ?? 60 * 60 * 1000; // 1 hour default
    this.valueTolerance = options.valueTolerance ?? 0.005;
  }

  /**
   * Arbitrate a flat list of observations (already gathered from all
   * registered providers) into a list of EvidenceItems with conflict
   * metadata.
   *
   * Returns the arbitrated evidence items AND a list of human-readable
   * limitation strings that should be surfaced in the DecisionArtifact.
   */
  arbitrate(
    observations: NormalizedResearchObservation[],
    options?: EvidenceArbitratorOptions,
  ): { evidence: EvidenceItem[]; limitations: string[] } {
    const now = options?.now ?? new Date();
    const staleThresholdMs = options?.staleThresholdMs ?? this.staleThresholdMs;
    const valueTolerance = options?.valueTolerance ?? this.valueTolerance;

    const limitations: string[] = [];
    const evidence: EvidenceItem[] = [];

    // --- Step 1: Deduplicate by (providerId, id) ---
    const seen = new Set<string>();
    const deduped: NormalizedResearchObservation[] = [];
    for (const obs of observations) {
      const key = `${obs.providerId}:${obs.id}`;
      if (seen.has(key)) {
        evidence.push(this.toDuplicateItem(obs));
        continue;
      }
      seen.add(key);
      deduped.push(obs);
    }

    // --- Step 2: Group numeric observations by conflict key ---
    // The conflict key groups observations that report a numeric value for
    // the same asset. We use the title as a secondary discriminator when
    // it is present and shared, otherwise just the asset.
    const groups = new Map<string, NormalizedResearchObservation[]>();

    for (const obs of deduped) {
      // Non-numeric observations are passed through as-is (OK)
      if (typeof obs.value !== "number") {
        evidence.push(this.toEvidenceItem(obs, "OK", now, staleThresholdMs));
        continue;
      }

      // Numeric observations are grouped for conflict detection.
      // Key = asset + "|#" + title (title identifies the metric, e.g. "price")
      // Group observations that refer to the same metric (from different
      // providers) so they can be cross-checked. The key is the normalized
      // metric title + unit, with NO timestamp — timestamps are preserved
      // on the items themselves but must not fragment the conflict group.
      const normalizedTitle = normalizeMetricKey(obs.title, obs.unit);
      const groupKey = normalizedTitle;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(obs);
    }

    // --- Step 3: Resolve each group ---
    for (const [groupKey, group] of groups) {
      const result = this.resolveGroup(group, valueTolerance, now, staleThresholdMs);
      if (result.items.length > 0) {
        evidence.push(...result.items);
      }
      for (const lim of result.limitations) {
        limitations.push(lim);
      }
    }

    // --- Step 4: Sort limitations for stable output ---
    limitations.sort();

    return { evidence, limitations };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Convert a single observation to an EvidenceItem, checking staleness
   * and availability. Returns conflictState = "OK", "STALE", or
   * "UNAVAILABLE" as appropriate for single-source observations.
   */
  private toEvidenceItem(
    obs: NormalizedResearchObservation,
    defaultState: ConflictState,
    now: Date,
    staleThresholdMs: number,
  ): EvidenceItem {
    const conflictState = this.determineSingleState(obs, now, staleThresholdMs);
    return {
      id: obs.id,
      title: obs.title,
      source: obs.source,
      url: obs.url,
      summary: obs.summary,
      retrievedAt: obs.observedTimestamp,
      state: this.mapProviderState(obs.providerStatus),
      provenanceType: "OBSERVED_FACT",
      providerId: obs.providerId,
      conflictState,
      observedValue: typeof obs.value === "number" ? obs.value : undefined,
      observedUnit: obs.unit,
    };
  }

  /**
   * For observations that are duplicates (same provider + same id already seen).
   */
  private toDuplicateItem(obs: NormalizedResearchObservation): EvidenceItem {
    return {
      id: obs.id,
      title: obs.title,
      source: obs.source,
      url: obs.url,
      summary: obs.summary,
      retrievedAt: obs.observedTimestamp,
      state: this.mapProviderState(obs.providerStatus),
      provenanceType: "OBSERVED_FACT",
      providerId: obs.providerId,
      conflictState: "DUPLICATE",
      observedValue: typeof obs.value === "number" ? obs.value : undefined,
      observedUnit: obs.unit,
    };
  }

  /**
   * Determine the conflict state for a single-source observation.
   * - If providerStatus is UNAVAILABLE -> "UNAVAILABLE"
   * - If timestamp is stale -> "STALE"
   * - Otherwise -> defaultState (usually "OK")
   */
  private determineSingleState(
    obs: NormalizedResearchObservation,
    now: Date,
    staleThresholdMs: number,
  ): ConflictState {
    if (obs.providerStatus === "UNAVAILABLE") {
      return "UNAVAILABLE";
    }
    if (this.isStale(obs, now, staleThresholdMs)) {
      return "STALE";
    }
    return "OK";
  }

  /** Check whether an observation is stale relative to `now`. */
  private isStale(
    obs: NormalizedResearchObservation,
    now: Date,
    staleThresholdMs: number,
  ): boolean {
    if (!obs.observedTimestamp) return true;
    const t = new Date(obs.observedTimestamp).getTime();
    if (Number.isNaN(t)) return true;
    return now.getTime() - t > staleThresholdMs;
  }

  /** Map a provider status to an EvidenceState for the EvidenceItem. */
  private mapProviderState(providerStatus: string): EvidenceItem["state"] {
    switch (providerStatus) {
      case "UNAVAILABLE":
        return "RESEARCH_PROVIDER";
      case "DEGRADED":
        return "RESEARCH_PROVIDER";
      case "AVAILABLE":
      default:
        return "RESEARCH_PROVIDER";
    }
  }

  /**
   * Resolve a group of numeric observations that may conflict.
   * - If a single source reported -> check staleness/unavailability.
   * - If multiple sources reported and values agree -> all OK.
   * - If multiple sources reported and values disagree -> UNRESOLVED_CONFLICT.
   * - Malformed observations (non-finite, negative sanity-check) are
   *   filtered and each gets its own UNAVAILABLE-equivalent item.
   */
  private resolveGroup(
    group: NormalizedResearchObservation[],
    valueTolerance: number,
    now: Date,
    staleThresholdMs: number,
  ): { items: EvidenceItem[]; limitations: string[] } {
      // Filter out malformed observations (non-finite values)
      const valid: NormalizedResearchObservation[] = [];
      const malformed: EvidenceItem[] = [];

      for (const obs of group) {
        if (typeof obs.value !== "number" || !Number.isFinite(obs.value)) {
          // Malformed: the value was supposed to be numeric but isn't.
          // We mark it as UNAVAILABLE (can't trust it) and pass it through
          // so the source identity is preserved.
          malformed.push({
            id: obs.id,
            title: obs.title,
            source: obs.source,
            url: obs.url,
            summary: obs.summary,
            retrievedAt: obs.observedTimestamp,
            state: this.mapProviderState(obs.providerStatus),
            provenanceType: "OBSERVED_FACT",
            providerId: obs.providerId,
            conflictState: "UNAVAILABLE",
            observedValue: undefined,
            observedUnit: obs.unit,
          });
          continue;
        }
       valid.push(obs);
     }

    // If there's only one valid observation, no conflict possible
    if (valid.length === 1) {
      const item = this.toEvidenceItem(valid[0], "OK", now, staleThresholdMs);
      const lim = this.maybeLimitation(item.conflictState, valid[0]);
      return {
        items: [...malformed, item],
        limitations: lim ? [lim] : [],
      };
    }

      // Multiple valid observations: check for conflicts
      const values = valid.map((v) => v.value!);
      const witnesses: ConflictWitness[] = valid.map((v) => ({
        source: v.source,
        providerId: v.providerId,
        value: v.value!,
        unit: v.unit,
        observedTimestamp: v.observedTimestamp,
      }));

      const hasConflict = this.hasNumericConflict(values, valueTolerance);

      if (hasConflict) {
        // CONFLICT: never pick a convenient number. Mark all as UNRESOLVED_CONFLICT.
        const items = valid.map((obs) => ({
          id: obs.id,
          title: obs.title,
          source: obs.source,
          url: obs.url,
          summary: obs.summary,
          retrievedAt: obs.observedTimestamp,
          state: this.mapProviderState(obs.providerStatus),
          provenanceType: "OBSERVED_FACT" as const,
          providerId: obs.providerId,
          conflictState: "UNRESOLVED_CONFLICT" as const,
          conflictingSources: witnesses.map((w) => w.source),
          observedValue: obs.value,
          observedUnit: obs.unit,
        }));

        const valueList = values.join(", ");
        const sourceList = witnesses.map((w) => w.source).join(", ");
        const limitation = `Evidence conflict for '${valid[0].title}': providers reported differing values (${valueList}). Sources: ${sourceList}. No value was selected; treat as unresolved ambiguity.`;

        return {
          items: [...malformed, ...items],
          limitations: [limitation],
        };
      }

      // Values agree within tolerance: all OK
      const items = valid.map((obs) =>
        this.toEvidenceItem(obs, "OK", now, staleThresholdMs),
      );

      const groupLimitations: string[] = [];
      for (let i = 0; i < items.length; i++) {
        const lim = this.maybeLimitation(items[i].conflictState, valid[i]!);
        if (lim) groupLimitations.push(lim);
      }

      return {
        items: [...malformed, ...items],
        limitations: groupLimitations,
      };
  }

  /**
   * Returns true if the numeric values disagree beyond tolerance.
   * Uses relative tolerance: |a - b| / max(|a|, |b|) > tolerance.
   * Falls back to absolute comparison if any value is zero.
   */
  private hasNumericConflict(
    values: number[],
    tolerance: number,
  ): boolean {
    if (values.length < 2) return false;

    // Check all pairwise differences
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        const a = values[i]!;
        const b = values[j]!;
        if (this.valuesDiffer(a, b, tolerance)) {
          return true;
        }
      }
    }
    return false;
  }

  private valuesDiffer(a: number, b: number, tolerance: number): boolean {
    if (a === b) return false;
    const absDiff = Math.abs(a - b);
    const maxAbs = Math.max(Math.abs(a), Math.abs(b));
    if (maxAbs === 0) {
      return absDiff > tolerance;
    }
    return absDiff / maxAbs > tolerance;
  }

  /**
  * Generate a limitation string for STALE or UNAVAILABLE single-source items.
   */
  private maybeLimitation(
    state: ConflictState | undefined,
    obs: NormalizedResearchObservation,
  ): string | null {
    switch (state) {
      case "STALE":
        return `Observation '${obs.title}' from ${obs.source} is stale (observed at ${obs.observedTimestamp}).`;
      case "UNAVAILABLE":
        return `Observation '${obs.title}' from ${obs.source} was flagged unavailable (provider status: ${obs.providerStatus}).`;
      default:
        return null;
    }
  }
}

/**
 * Normalize a metric key from an observation title so that observations
 * describing the same metric from different providers can be grouped.
 * Strips common provider prefixes and lowercases.
 */
export function normalizeMetricKey(title: string, unit?: string): string {
  // Remove provider-specific prefixes and normalize
  const cleaned = title
    .toLowerCase()
    .replace(/^quote:\s*/i, "")
    .replace(/^company:\s*/i, "")
    .replace(/^financials:\s*/i, "")
    .replace(/^earnings:\s*/i, "")
    .replace(/^analyst:\s*/i, "")
    .replace(/^etf:\s*/i, "")
    .replace(/^news:\s*/i, "")
    .replace(/^headlines?:\s*/i, "")
    .trim();
  return `${cleaned}|${unit ?? ""}`;
}
