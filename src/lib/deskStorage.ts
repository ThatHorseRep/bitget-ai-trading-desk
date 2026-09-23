import type { WorkspaceStep } from "../components/workspace/types";
import type { DecisionArtifact } from "../domain/decision/types";
import type { ParsedTradeResult } from "../core/trade/parser";

const WORKSPACE_STATE_KEY = "bitget_rtd_workspace_state_v1";
const AUDIT_HISTORY_KEY = "bitget_rtd_audit_history_v1";

export interface PersistedWorkspaceState {
  viewMode: "landing" | "desk";
  step: WorkspaceStep;
  prompt: string;
  useFixture: boolean;
  parsedResult: ParsedTradeResult | null;
  artifact: DecisionArtifact | null;
  timestamp: number;
}

export interface AuditHistoryEntry {
  id: string;
  timestamp: string;
  asset: string;
  direction: "LONG" | "SHORT";
  sizeUsd: number;
  verdict: "PROCEED" | "REJECT" | "WAIT" | "REDUCE";
  compositeScore: number;
  provider: string;
  artifact: DecisionArtifact;
}

/**
 * Load the active draft workspace state from localStorage.
 */
export function loadPersistedWorkspaceState(): PersistedWorkspaceState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WORKSPACE_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedWorkspaceState;
  } catch (e) {
    console.error("Failed to load workspace state from localStorage", e);
    return null;
  }
}

/**
 * Save active draft workspace state to localStorage.
 */
export function savePersistedWorkspaceState(state: PersistedWorkspaceState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save workspace state to localStorage", e);
  }
}

/**
 * Clear the active draft workspace state from localStorage.
 */
export function clearPersistedWorkspaceState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(WORKSPACE_STATE_KEY);
  } catch (e) {
    console.error("Failed to clear workspace state from localStorage", e);
  }
}

/**
 * Load all recent trade audit artifacts from history.
 */
export function loadAuditHistory(): AuditHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDIT_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuditHistoryEntry[];
  } catch (e) {
    console.error("Failed to load audit history from localStorage", e);
    return [];
  }
}

/**
 * Append a newly evaluated Decision Artifact to the persisted audit log.
 * Keeps the latest 30 entries.
 */
export function recordAuditHistory(artifact: DecisionArtifact): void {
  if (typeof window === "undefined") return;
  try {
    const history = loadAuditHistory();
    const entry: AuditHistoryEntry = {
      id: artifact.artifactId,
      timestamp: artifact.generatedAt || new Date().toISOString(),
      asset: artifact.trade.asset,
      direction: artifact.trade.direction,
      sizeUsd: artifact.trade.positionSizeUsd,
      verdict: artifact.decision.verdict,
      compositeScore: artifact.thesisPosition?.positionScoreResult?.score ?? artifact.thesisPosition?.thesisScoreResult?.score ?? 0,
      provider: artifact.provenance?.[0]?.source || "Bitget RedTeam Engine",
      artifact
    };

    // Deduplicate by ID
    const filtered = history.filter(h => h.id !== artifact.artifactId);
    const updated = [entry, ...filtered].slice(0, 30);
    localStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save audit history", e);
  }
}

/**
 * Clear the entire audit history.
 */
export function clearAuditHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUDIT_HISTORY_KEY);
  } catch (e) {
    console.error("Failed to clear audit history", e);
  }
}
