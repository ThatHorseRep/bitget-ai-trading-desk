import type { DecisionArtifact } from "../../domain/decision/types";
import { buildAgentHubHandoff, type AgentHubHandoffPayload } from "../agenthub/handoff";

/**
 * PRE24-07 — Bitget Agentic Account handoff path (optional, external).
 *
 * INTEGRATION DETERMINATION (from the official guide at
 * https://www.bitget.com/support/articles/12560603894122, not guessed):
 *
 * - Agentic account connection is an OAuth flow TRIGGERED ONLY by the
 *   official MCP's `authorize_start` tool. The link must come from that
 *   tool; "the LLM must not assemble the URL itself or start a local
 *   server to listen for the callback."
 * - Credentials (API Key / Secret / Passphrase) are received by the
 *   MCP/SDK callback and "written to disk locally"; BITGET_API_* env vars
 *   must NOT be set; the user never creates or pastes a Key.
 * - Success is judged ONLY when the official MCP confirms credentials are
 *   saved (`get_auth_status` returns authorized): "A finished browser page
 *   is not proof of success."
 * - A newly registered MCP is invisible until the session is restarted —
 *   `authorize_start` must not be called in the installing session.
 *
 * THEREFORE this application:
 * - builds NO OAuth URL, stores NO credentials, asks for NO API key,
 *   launches NO local stdio MCP (impossible and forbidden from Vercel),
 * - implements the documented handoff: prepare the decision, prepare the
 *   proposed action, show why the action is handed off, REQUIRE explicit
 *   human confirmation, and delegate execution to the official Agent Hub
 *   mechanism running in the human's own AI host.
 *
 * The state machine below is the shared contract for that path. It is
 * driven by authoritative external facts (the official MCP's auth status
 * and the human's own confirmation) — never invented by this app.
 *
 * SAFETY RULES (enforced in the type system):
 * - `executionAllowed` is typed literal `false` and `orderPlaced` is
 *   typed literal `false`. No caller can construct a permissive payload.
 * - There is no "order placed" / "executing" / "filled" state. READY_FOR_
 *   EXTERNAL_EXECUTION means the handoff document is prepared for the
 *   human's official Agentic session — nothing has been executed here.
 * - This module performs no I/O: no fetch, no child_process, no process.env.
 */

/**
 * The official Agentic connection states. NOTE: there is deliberately NO
 * state meaning "order placed". READY_FOR_EXTERNAL_EXECUTION is a HANDOFF
 * state: execution, if ever, happens in the official external mechanism
 * after explicit human confirmation — never inside this product.
 */
export type AgenticConnectionState =
  | "UNAVAILABLE"
  | "AUTH_REQUIRED"
  | "AUTHORIZING"
  | "AUTHORIZED"
  | "HUMAN_CONFIRMATION_REQUIRED"
  | "READY_FOR_EXTERNAL_EXECUTION"
  | "ERROR";

/**
 * Legal transitions between Agentic connection states.
 * Invariants encoded here:
 * - Authorization (AUTHORIZED) can ONLY progress through explicit human
 *   confirmation (HUMAN_CONFIRMATION_REQUIRED). There is no edge from
 *   AUTHORIZED directly to READY_FOR_EXTERNAL_EXECUTION: human consent
 *   can never be skipped or inferred from a successful OAuth.
 * - No state ever transitions to anything meaning "executed"/"placed".
 * - Every state can reach ERROR or UNAVAILABLE (things fail/disconnect).
 */
export const AGENTIC_TRANSITIONS: Readonly<
  Record<AgenticConnectionState, readonly AgenticConnectionState[]>
> = {
  UNAVAILABLE: ["AUTH_REQUIRED", "ERROR"],
  AUTH_REQUIRED: ["AUTHORIZING", "UNAVAILABLE", "ERROR"],
  AUTHORIZING: ["AUTHORIZED", "AUTH_REQUIRED", "UNAVAILABLE", "ERROR"],
  AUTHORIZED: ["HUMAN_CONFIRMATION_REQUIRED", "UNAVAILABLE", "ERROR"],
  HUMAN_CONFIRMATION_REQUIRED: ["READY_FOR_EXTERNAL_EXECUTION", "AUTH_REQUIRED", "ERROR"],
  READY_FOR_EXTERNAL_EXECUTION: ["AUTH_REQUIRED", "UNAVAILABLE", "ERROR"],
  ERROR: ["AUTH_REQUIRED", "UNAVAILABLE"],
};

export function isAgenticTransition(from: AgenticConnectionState, to: AgenticConnectionState): boolean {
  return AGENTIC_TRANSITIONS[from].includes(to);
}

/** Human-readable meaning of each state, shared by product and host. */
export const AGENTIC_STATE_NOTES: Readonly<Record<AgenticConnectionState, string>> = {
  UNAVAILABLE:
    "The Agentic path is not set up in this environment. The Desk works fully without it.",
  AUTH_REQUIRED:
    "No Agentic authorization exists yet. The official MCP (authorize_start) triggers OAuth — this application never builds the URL or asks for an API key.",
  AUTHORIZING:
    "OAuth is in progress in the browser. Per the official guide, a finished browser page is NOT proof of success — only the official MCP's confirmation counts.",
  AUTHORIZED:
    "The official MCP confirmed credentials are saved ON YOUR MACHINE. This authorizes YOUR Agentic account in YOUR host — it placed no order and moved nothing.",
  HUMAN_CONFIRMATION_REQUIRED:
    "A specific proposed action awaits YOUR explicit confirmation. Authorization alone is never consent to act on a decision.",
  READY_FOR_EXTERNAL_EXECUTION:
    "The handoff document is prepared for your official Agentic session. Execution, if any, happens ONLY there, by you. Nothing has been executed by this application.",
  ERROR: "The Agentic path hit an error. The Desk's research is unaffected.",
};

/**
 * A small, strict state machine over the official states. setState refuses
 * any transition not in AGENTIC_TRANSITIONS, so the contract cannot be
 * drifted (e.g. skipping human confirmation) by any caller.
 */
export interface AgenticConnectionStateMachine {
  getState(): AgenticConnectionState;
  /** Throws on any transition outside AGENTIC_TRANSITIONS. */
  setState(to: AgenticConnectionState, note?: string): AgenticConnectionState;
  getNote(): string;
}

export function createAgenticConnectionStateMachine(
  initial: AgenticConnectionState = "UNAVAILABLE",
): AgenticConnectionStateMachine {
  let current: AgenticConnectionState = initial;
  let note: string = AGENTIC_STATE_NOTES[initial];
  return {
    getState: () => current,
    getNote: () => note,
    setState(to, customNote) {
      if (!isAgenticTransition(current, to)) {
        throw new Error(
          `Illegal Agentic connection transition ${current} -> ${to}. ` +
            `Legal: ${AGENTIC_TRANSITIONS[current].join(", ")}`,
        );
      }
      current = to;
      note = customNote ?? AGENTIC_STATE_NOTES[to];
      return current;
    },
  };
}

/** The handoff document given to the human / official Agentic session. */
export interface AgenticHandoffDocument {
  handoffKind: "bitget-agentic-handoff";
  contractVersion: "1";
  /** Explicit execution bar, typed so it can never be true. */
  executionAllowed: false;
  /**
   * Typed proof that this handoff does not, and cannot, record an executed
   * trade. Nothing in this contract can ever represent a placed order.
   */
  orderPlaced: false;
  executionPolicy: "human-confirms-official-agentic-host-executes";
  /** Current connection state (authoritative facts live with the official MCP). */
  currentState: AgenticConnectionState;
  currentStateNote: string;
  /** How authorization actually works, per the official guide. */
  authorizationContract: {
    method: "official-bitget-agent-mcp-oauth";
    oauthTriggerTool: "authorize_start";
    statusConfirmationTool: "get_auth_status";
    waitTool: "authorize_wait";
    /** The official MCP stores credentials locally on the human's machine. */
    credentialsStoredBy: "@bitget-ai/bitget-agent-mcp (local callback, on the user's machine)";
    /** This repository/application never stores or requests Agentic credentials. */
    productStoresCredentials: false;
    /** The user is never asked to create or paste an API key. */
    productAsksUserForApiKey: false;
    /** The OAuth URL always comes from authorize_start — never assembled here. */
    productBuildsOAuthUrl: false;
    /** authorize_start must not be called in the session that registered the MCP. */
    sessionRestartRequiredBeforeAuthorizeStart: true;
  };
  /**
   * The explicit anti-deception contract: authorization is not execution.
   * These strings are part of the payload so no UI or host can omit them.
   */
  humanConfirmation: {
    required: true;
    meaning: string;
    whatAuthorizationDoesNotMean: string[];
  };
  /** Why the decision is being handed off instead of acted on here. */
  handoffReason: string;
  /** The proposed action (the Desk's decision, for the human to confirm). */
  proposedAction: {
    actionType: "review-decision-in-official-agentic-session";
    asset: string;
    referenceSymbol?: string;
    decisionArtifactId: string;
    /** Product-generated verdict from the deterministic policy — never an LLM's. */
    finalVerdict: DecisionArtifact["decision"]["verdict"];
    verdictReasons: DecisionArtifact["decision"]["reasons"];
    /** The parsed trade, verbatim — proposed, never executed. */
    trade: DecisionArtifact["trade"];
    /** Approved market state the decision consumed. */
    marketState: DecisionArtifact["marketState"];
    /** Deterministic stress results backing the proposal. */
    stressResults: DecisionArtifact["scenarios"];
    limitations: string[];
  };
  /** The full research context (thesis, challenge) from the read-only contract. */
  researchHandoff: AgentHubHandoffPayload;
  /** The official first-connection flow steps, verbatim to the guide's rules. */
  officialFlowSteps: string[];
  generatedAt: string;
}

/**
 * Build the Agentic handoff document from a finished DecisionArtifact.
 * Pure: reads the artifact, writes nothing, calls nothing, launches nothing.
 * `connection` defaults to UNAVAILABLE — this app never claims a connection
 * it did not observe from the official MCP.
 */
export function buildAgenticHandoff(
  artifact: DecisionArtifact,
  connection: AgenticConnectionState = "UNAVAILABLE",
): AgenticHandoffDocument {
  return {
    handoffKind: "bitget-agentic-handoff",
    contractVersion: "1",
    executionAllowed: false,
    orderPlaced: false,
    executionPolicy: "human-confirms-official-agentic-host-executes",
    currentState: connection,
    currentStateNote: AGENTIC_STATE_NOTES[connection],
    authorizationContract: {
      method: "official-bitget-agent-mcp-oauth",
      oauthTriggerTool: "authorize_start",
      statusConfirmationTool: "get_auth_status",
      waitTool: "authorize_wait",
      credentialsStoredBy: "@bitget-ai/bitget-agent-mcp (local callback, on the user's machine)",
      productStoresCredentials: false,
      productAsksUserForApiKey: false,
      productBuildsOAuthUrl: false,
      sessionRestartRequiredBeforeAuthorizeStart: true,
    },
    humanConfirmation: {
      required: true,
      meaning:
        "You must explicitly confirm this proposed action. Authorization of your Agentic account is NOT consent to act on any decision.",
      whatAuthorizationDoesNotMean: [
        "Authorization does NOT mean an order was placed.",
        "Authorization does NOT mean this application can trade — it never touches your account.",
        "A finished browser page is NOT proof of authorization; only the official MCP's get_auth_status counts.",
        "READY_FOR_EXTERNAL_EXECUTION means the document is ready for YOUR official session — nothing has been executed anywhere.",
      ],
    },
    handoffReason:
      "The Desk is a research product: it prepares decisions but does not hold credentials, does not run the official MCP, and cannot execute. " +
      "Execution is delegated to the official Agent Hub mechanism in your own AI host, gated on your explicit confirmation.",
    proposedAction: {
      actionType: "review-decision-in-official-agentic-session",
      asset: artifact.trade.asset,
      ...(artifact.marketState.referenceSymbol
        ? { referenceSymbol: artifact.marketState.referenceSymbol }
        : {}),
      decisionArtifactId: artifact.artifactId,
      finalVerdict: artifact.decision.verdict,
      verdictReasons: artifact.decision.reasons,
      trade: artifact.trade,
      marketState: artifact.marketState,
      stressResults: artifact.scenarios,
      limitations: artifact.limitations,
    },
    researchHandoff: buildAgentHubHandoff(artifact),
    officialFlowSteps: [
      "Install the official skill + MCP: npx @bitget-ai/bitget-agent-skill --target all --skill agentic, then npx -y @bitget-ai/bitget-agent-mcp registered in your client.",
      "Restart your AI-host session (a newly registered MCP is invisible until reload) — do NOT call authorize_start in the installing session.",
      "In the new session, call the official MCP's authorize_start; use the authorizeUrl exactly as returned — never build or modify the OAuth URL.",
      "Complete sign-in, account selection, Allow, and device verification in the browser yourself; never create or paste an API key.",
      "Confirm success only via authorize_wait or get_auth_status returning authorized — a finished browser page is not proof.",
      "Only then, with the state machine at HUMAN_CONFIRMATION_REQUIRED for a specific decision, explicitly confirm — and act solely inside your official Agentic session.",
    ],
    generatedAt: artifact.generatedAt,
  };
}

/**
 * Validate a document received back from a host (import direction).
 * Returns null unless it is structurally this contract. A payload claiming
 * executionAllowed === true or orderPlaced === true is rejected outright:
 * this contract can never express permission or execution.
 */
export function validateAgenticHandoff(raw: unknown): AgenticHandoffDocument | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (r.handoffKind !== "bitget-agentic-handoff") return null;
  // The safety invariants are absolute: anything else is not this contract.
  if (r.executionAllowed !== false) return null;
  if (r.orderPlaced !== false) return null;
  if (
    typeof r.currentState !== "string" ||
    !(r.currentState in AGENTIC_TRANSITIONS)
  ) {
    return null;
  }
  // Identity fields live inside proposedAction in this contract:
  const pa =
    typeof r.proposedAction === "object" && r.proposedAction !== null
      ? (r.proposedAction as Record<string, unknown>)
      : null;
  if (
    !pa ||
    typeof pa.decisionArtifactId !== "string" ||
    pa.decisionArtifactId.length === 0 ||
    typeof pa.asset !== "string" ||
    pa.asset.length === 0 ||
    !Array.isArray(pa.stressResults)
  ) {
    return null;
  }
  if (typeof r.researchHandoff !== "object" || r.researchHandoff === null) {
    return null;
  }
  return raw as AgenticHandoffDocument;
}
