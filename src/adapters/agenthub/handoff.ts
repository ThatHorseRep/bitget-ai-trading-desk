import type { DecisionArtifact } from "../../domain/decision/types";
import type { MarketState } from "../../domain/market/types";

/**
 * PRE24-06 — Agent Hub read-only handoff (developer / agent-host integration).
 *
 * INTEGRATION DETERMINATION (documented, not guessed): per the S2 handbook,
 * Bitget Agent Hub's MCP Server and `bgc` CLI are LOCAL AI-host tools
 * (Claude Desktop / Cursor / Windsurf register the MCP server; Claude Code /
 * Codex / OpenClaw install the CLI), with `--read-only` as the documented
 * safe mode. No hosted/browser Agent Hub API is documented, and none is
 * invented. This module therefore implements the developer/agent-host
 * handoff: a structured payload a human carries into their own AI host
 * running `@bitget-ai/bitget-agent-mcp --read-only` (or the `bgc` CLI in
 * read-only mode). A serverless function never launches a local stdio MCP.
 *
 * SAFETY RULES (enforced in the type system, not just prose):
 * - The payload is a RESEARCH HANDOFF ONLY. `executionAllowed` is typed as
 *   the literal `false` — it cannot be set to true by any caller.
 * - No orders, no write tools, no account operations, no monitoring loops.
 * - No exchange credentials exist in the repository or in this payload.
 * - The application remains fully useful with Agent Hub disconnected: this
 *   module is a pure function over an already-produced DecisionArtifact.
 */

/**
 * PRE24-10: Paper-trading companion state for GetAgent Studio workflow.
 * Included only when user has explicitly enabled paper trading.
 */
export interface PaperTradingCompanion {
  /**
   * User has explicitly enabled paper trading (never auto-enabled).
   * Must be true for any paper-trading workflow to proceed.
   */
  enabledByUser: boolean;
  /**
   * Indicates whether external setup (e.g., GetAgent Studio demo credentials)
   * has been completed by the user.
   */
  externalSetupComplete: boolean;
  /**
   * Required label that must be displayed with any paper-trading results.
   * Never omit or modify this string when enabledByUser is true.
   */
  environmentLabel: "DEMO / PAPER — Bitget Demo Trading environment — no real funds involved";
  /**
   * Optional safe link to complete external setup if not yet done.
   * Only present when externalSetupComplete is false.
   */
  setupLink?: string;
}

/** The handoff payload given to a developer's AI host. */
export interface AgentHubHandoffPayload {
  /** Marks the payload kind and contract version for the host. */
  handoffKind: "bitget-agent-hub-readonly-research-handoff";
  contractVersion: "1";
  /** Which tool the human should run on their side, per official docs. */
  intendedHostTool: "@bitget-ai/bitget-agent-mcp --read-only";
  /** Explicit execution bar, typed so it can never be true. */
  executionAllowed: false;
  /**
   * Why execution is barred: the Desk produces research, a human decides,
   * and any account interaction must happen in the human's own read-only
   * Agent Hub session — not from this application.
   */
  executionPolicy: "research-only-human-decides";
  /** The asset researched (e.g. rNVDA). */
  asset: string;
  /** US reference ticker when applicable (rNVDA -> NVDA). */
  referenceSymbol?: string;
  /** The DecisionArtifact this handoff was built from. */
  decisionArtifactId: string;
  generatedAt: string;
  /** Product-generated verdict from the deterministic policy — never an LLM's. */
  finalVerdict: DecisionArtifact["decision"]["verdict"];
  verdictReasons: DecisionArtifact["decision"]["reasons"];
  /** Relevant market state (approved by MarketStateService). */
  marketState: MarketState;
  /** Thesis deconstruction (AI layer, provenance-tagged in the artifact). */
  thesis: DecisionArtifact["thesis"];
  /** Adversarial counter-thesis (AI layer). */
  challenge: DecisionArtifact["challenge"];
  /** Deterministic stress results. */
  stressResults: DecisionArtifact["scenarios"];
  /** Limitations the human should read before acting on anything. */
  limitations: string[];
  /**
   * PRE24-10: Optional paper-trading companion for GetAgent Studio workflow.
   * Absent by default; included only when user explicitly enables paper trading.
   * Does not affect the core research handoff functionality.
   */
  paperTradingCompanion?: PaperTradingCompanion;
}

/**
 * Build a read-only Agent Hub handoff payload from a DecisionArtifact.
 * Pure: reads the artifact, writes nothing, calls nothing, launches nothing.
 *
 * PRE24-10: Includes paperTradingCompanion only when user has explicitly
 * enabled paper trading AND external setup is complete.
 */
export function buildAgentHubHandoff(artifact: DecisionArtifact): AgentHubHandoffPayload {
  const basePayload: Omit<AgentHubHandoffPayload, 'paperTradingCompanion'> = {
    handoffKind: "bitget-agent-hub-readonly-research-handoff",
    contractVersion: "1",
    intendedHostTool: "@bitget-ai/bitget-agent-mcp --read-only",
    executionAllowed: false,
    executionPolicy: "research-only-human-decides",
    asset: artifact.trade.asset,
    ...(artifact.marketState.referenceSymbol
      ? { referenceSymbol: artifact.marketState.referenceSymbol }
      : {}),
    decisionArtifactId: artifact.artifactId,
    generatedAt: artifact.generatedAt,
    finalVerdict: artifact.decision.verdict,
    verdictReasons: artifact.decision.reasons,
    marketState: artifact.marketState,
    thesis: artifact.thesis,
    challenge: artifact.challenge,
    stressResults: artifact.scenarios,
    limitations: artifact.limitations,
  };

  // PRE24-10: Include paper trading companion ONLY when explicitly enabled by user
  // and external setup is complete. Never auto-enabled.
  if (artifact.paperTradingStatus?.enabledByUser) {
    return {
      ...basePayload,
      paperTradingCompanion: {
        enabledByUser: true,
        externalSetupComplete: artifact.paperTradingStatus.externalSetupComplete,
        environmentLabel: "DEMO / PAPER — Bitget Demo Trading environment — no real funds involved",
        ...(artifact.paperTradingStatus.externalSetupComplete
          ? {}
          : {
              setupLink: "https://getagent.studio/demo-setup",
            }),
      },
    };
  }

  return basePayload;
}

/**
 * Validate a payload received back from an agent host (import direction).
 * Returns null unless the entry is a structurally valid handoff payload —
 * a handoff that claims executionAllowed === true is rejected outright,
 * because this contract can never express permission to execute.
 */
export function validateAgentHubHandoff(raw: unknown): AgentHubHandoffPayload | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (r.handoffKind !== "bitget-agent-hub-readonly-research-handoff") return null;
  // The safety invariant is absolute: anything else is not this contract.
  if (r.executionAllowed !== false) return null;
  if (typeof r.decisionArtifactId !== "string" || r.decisionArtifactId.length === 0) return null;
  if (typeof r.asset !== "string" || r.asset.length === 0) return null;
  if (typeof r.marketState !== "object" || r.marketState === null) return null;
  if (!Array.isArray(r.stressResults)) return null;

  return raw as AgentHubHandoffPayload;
}
