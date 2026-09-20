import { existsSync } from "node:fs";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import type {
  NormalizedResearchObservation,
  ResearchProvider,
  ResearchProviderStatus,
} from "./types.js";

/**
 * PRE24-05 — Chainbase AgentKey bridge (AI-host handoff).
 *
 * IDENTITY RULE (S2 handbook): Chainbase AgentKey is an EXTERNAL PARTNER
 * product sponsored for the hackathon — NOT a Bitget product, and
 * independent of Agent Hub, the MCP Server, and the Bitget toolchain.
 * Every observation imported here is attributed to Chainbase, never Bitget.
 *
 * INTEGRATION DETERMINATION (documented, not guessed): the S2 handbook's
 * recommended architecture is
 *
 *     Your App -> AI Agent -> AgentKey -> External Data Sources
 *
 * and AgentKey's own documentation positions it as a unified MCP
 * server/gateway installed into AI hosts (Claude Code, Cursor, Codex, ...).
 * No programmatic endpoint is documented for server-side consumption, and
 * none is invented here. This module therefore implements the documented
 * agent-host handoff: the Desk writes a structured request, an AI host with
 * AgentKey installed retrieves the data, and validated structured
 * observations are imported back through this file contract.
 *
 * CREDENTIALS: none exist on the app side — by design. The AI host's
 * AgentKey installation holds any key it needs; the server never sees or
 * stores credentials. (In a future server-side integration, keys would be
 * server-side environment variables only — never client-exposed.)
 *
 * USE-CASE DISCIPLINE: this bridge is gated to ONE meaningful RedTeam use
 * case — multi-signal research around a tokenized stock (rToken) decision.
 * Plain crypto assets and non-research calls never trigger a request, so
 * the app is not flooded with generic research results.
 */

// ---------------------------------------------------------------------------
// Capabilities the official AgentKey interface provides (S2 handbook:
// "market, on-chain, news, social, and company data").
// ---------------------------------------------------------------------------

export const AGENTKEY_CAPABILITIES = [
  "market",
  "on-chain",
  "news",
  "social",
  "company",
] as const;

export type AgentKeyCapability = (typeof AGENTKEY_CAPABILITIES)[number];

const MAX_SUMMARY_LENGTH = 300;
const MAX_IMPORTED_OBSERVATIONS = 24;

// ---------------------------------------------------------------------------
// Request written for the AI host
// ---------------------------------------------------------------------------

export interface AgentKeyResearchRequest {
  /** What the AI host should install/use: AgentKey via its AI host. */
  integration: "agentkey-via-ai-host";
  /** Identity rule, restated so the host prompt cannot mislabel the source. */
  providerIdentity: "chainbase-agentkey-external-partner-not-bitget";
  asset: string;
  /** US reference ticker for tokenized stocks (rNVDA -> NVDA), if applicable. */
  referenceSymbol?: string;
  thesis: string;
  requestedCapabilities: AgentKeyCapability[];
  /** RedTeam use case this request belongs to. */
  useCase: "tokenized-stock-multi-signal-research";
}

// ---------------------------------------------------------------------------
// Relevance routing — request only the capability families the topic needs.
// ---------------------------------------------------------------------------

const CAPABILITY_KEYWORDS: Record<AgentKeyCapability, RegExp> = {
  market: /price|quote|market|valuation|basis|premium|discount|chart|trend/,
  "on-chain": /on-chain|onchain|whale|flow|holder|wallet|smart.?money|tvb|tvl|transfer|accumulation/,
  news: /news|headline|catalyst|announcement|earnings|filing|event|briefing/,
  social: /social|sentiment|reddit|twitter|x posts|buzz|community|mentions/,
  company: /company|fundamental|revenue|eps|sector|profile|balance|guidance/,
};

/**
 * Route a research topic to AgentKey capability families. A generic or
 * tokenized-stock research topic defaults to the multi-signal core
 * (market + news + on-chain) — the handbook's "multi-signal research"
 * direction — never to a flood of every capability.
 */
export function capabilitiesForResearchTopic(topic?: string): AgentKeyCapability[] {
  if (!topic) return ["market", "news", "on-chain"];
  const t = topic.toLowerCase();
  const matched: AgentKeyCapability[] = [];
  for (const capability of AGENTKEY_CAPABILITIES) {
    if (CAPABILITY_KEYWORDS[capability].test(t)) matched.push(capability);
  }
  return matched.length > 0 ? matched : ["market", "news", "on-chain"];
}

/**
 * Use-case gate: ONLY tokenized-stock (rToken) assets are in scope for this
 * bridge. Mirrors the market layer's rule — the asset must be r-prefixed
 * (rNVDA, rNVDAUSDT). Plain crypto (BTC, SOL) and garbage input return null
 * and never produce a request or read attempt.
 */
export function toTokenizedStockReference(asset: string): string | null {
  const upper = asset.trim().toUpperCase();
  if (!upper.startsWith("R")) return null;
  let symbol = upper.slice(1);
  if (symbol.endsWith("USDT")) symbol = symbol.slice(0, -4);
  return /^[A-Z]{1,5}$/.test(symbol) ? symbol : null;
}

// ---------------------------------------------------------------------------
// Observation import validation
// ---------------------------------------------------------------------------

const VALID_STATUSES = new Set(["AVAILABLE", "DEGRADED", "UNAVAILABLE"]);
const VALID_PROVENANCE = new Set(["OBSERVED_FACT", "AI_INTERPRETATION"]);

function asTrimmedString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

/**
 * Validate one imported observation from the AI host. Returns null when the
 * entry is not a trustworthy structured observation — invalid entries are
 * skipped individually; one bad entry never breaks the import.
 */
export function validateImportedObservation(raw: unknown): NormalizedResearchObservation | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const id = asTrimmedString(r.id);
  const title = asTrimmedString(r.title);
  const summary = asTrimmedString(r.summary);
  const observedTimestamp = asTrimmedString(r.observedTimestamp);
  const hostSource = asTrimmedString(r.source);
  const capability = asTrimmedString(r.capability) as AgentKeyCapability | null;

  if (!id || !title || !summary || !observedTimestamp) return null;
  if (!capability || !AGENTKEY_CAPABILITIES.includes(capability)) return null;
  if (Number.isNaN(new Date(observedTimestamp).getTime())) return null;

  const providerStatus = VALID_STATUSES.has(String(r.providerStatus))
    ? (r.providerStatus as ResearchProviderStatus)
    : "AVAILABLE";
  const provenanceType =
    typeof r.provenanceType === "string" && VALID_PROVENANCE.has(r.provenanceType)
      ? (r.provenanceType as NormalizedResearchObservation["provenanceType"])
      : "OBSERVED_FACT";

  // Exact provider attribution: Chainbase AgentKey, capability, host source.
  const source = `chainbase-agentkey/${capability}/${hostSource ?? "ai-host"}`;

  const url = asTrimmedString(r.url) ?? undefined;
  const value = typeof r.value === "number" && Number.isFinite(r.value) ? r.value : undefined;

  return {
    id,
    providerId: "chainbase-agentkey",
    source,
    title,
    summary: summary.substring(0, MAX_SUMMARY_LENGTH),
    observedTimestamp: new Date(observedTimestamp).toISOString(),
    providerStatus,
    provenanceType,
    url,
    value,
  };
}

/** Validate and normalize a full import batch. */
export function validateImportedObservations(raw: unknown): NormalizedResearchObservation[] {
  if (!Array.isArray(raw)) return [];
  const out: NormalizedResearchObservation[] = [];
  for (const entry of raw.slice(0, MAX_IMPORTED_OBSERVATIONS * 4)) {
    const obs = validateImportedObservation(entry);
    if (obs) out.push(obs);
    if (out.length >= MAX_IMPORTED_OBSERVATIONS) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class ChainbaseAgentKeyBridge implements ResearchProvider {
  readonly providerId = "chainbase-agentkey";

  private bridgePath: string;

  constructor(bridgePath: string = "chainbase-agentkey-bridge-output.json") {
    // /tmp in Vercel/Next.js environments: read-only deployment filesystem,
    // same convention as the Bitget Signal bridge.
    this.bridgePath = resolve(tmpdir(), bridgePath);
  }

  async getStatus(): Promise<ResearchProviderStatus> {
    // The handoff contract is always "available": the Desk can always write
    // a request. Actual data depends on an AI host with AgentKey installed.
    return "AVAILABLE";
  }

  async getObservations(asset: string, topic?: string): Promise<NormalizedResearchObservation[]> {
    // Use-case gate: only tokenized-stock research triggers the handoff.
    const referenceSymbol = toTokenizedStockReference(asset);
    if (!referenceSymbol) return [];

    const request: AgentKeyResearchRequest = {
      integration: "agentkey-via-ai-host",
      providerIdentity: "chainbase-agentkey-external-partner-not-bitget",
      asset: asset.trim().toUpperCase(),
      referenceSymbol,
      thesis: topic ?? "",
      requestedCapabilities: capabilitiesForResearchTopic(topic),
      useCase: "tokenized-stock-multi-signal-research",
    };

    const inputPath = this.bridgePath.replace("-output.json", "-input.json");

    // 1. Write the request for the AI host.
    try {
      await writeFile(inputPath, JSON.stringify(request, null, 2), "utf-8");
    } catch (err) {
      console.warn("[ChainbaseAgentKeyBridge] failed to write request file:", err);
      return [];
    }

    // 2. Import the host's output if present.
    if (!existsSync(this.bridgePath)) return [];

    try {
      const content = await readFile(this.bridgePath, "utf-8");
      const parsed: unknown = JSON.parse(content);
      const observations = validateImportedObservations(parsed);
      return observations;
    } catch (err) {
      console.warn("[ChainbaseAgentKeyBridge] failed to parse bridge output:", err);
      return [];
    } finally {
      // Consume-once: never let a stale file masquerade as fresh research.
      try {
        await unlink(this.bridgePath);
      } catch {
        /* already gone */
      }
    }
  }
}
