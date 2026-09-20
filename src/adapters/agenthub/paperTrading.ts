import { z } from "zod";
import type { AgenticHandoffDocument } from "../agentic/handoff";

/**
 * PRE24-08 — Official Bitget Agent Hub PAPER-TRADING verification harness (core).
 *
 * DETERMINATION (official docs, not guessed — Bitget-AI/agent_hub + agent-mcp
 * READMEs and the S2 handbook):
 * - `--paper-trading` routes signed requests to Bitget's DEMO Trading
 *   environment (`paptrading: 1` header) — "no real funds involved" — and
 *   requires a SEPARATE Demo API Key (created at bitget.com/api-management).
 * - The MCP is a LOCAL stdio server launched by the AI host/developer
 *   (`npx -y @bitget-ai/bitget-agent-mcp`). It is mutually exclusive with
 *   `--read-only`. A Vercel function cannot and must not host it.
 * - Credentials are environment variables (BITGET_API_KEY / SECRET_KEY /
 *   PASSPHRASE) read by the child MCP only; the server never stores/logs them.
 * - Official write-safety: "Any write accepts `dryRun: true` to preview the
 *   would-send request without sending it"; high-risk operations return
 *   `{ confirmationRequired: true }` unless `confirm: true`.
 * - Surface: 14 tools = 12 intent verbs + `discover` + `raw`, progressively
 *   discoverable: discover({}) → discover({tool}) → discover({tool, action}).
 *
 * SAFETY RULES (enforced in code and tests):
 * - The launch command is HARDCODED with `--paper-trading` and cannot be
 *   overridden; `--read-only` is never combined with it (official mutual
 *   exclusion; paper mode IS the safety boundary).
 * - This harness maps ONLY `BITGET_DEMO_*` variables into the child env
 *   (under the official names). Production-namespace variables are never
 *   forwarded. If a demo value equals a production-namespace value, the
 *   harness REFUSES to run (a Demo key must be a separate credential).
 * - Paper execution (step 6) runs ONLY when the human explicitly confirms
 *   (the script's `--confirm-execution` flag → executionConfirmedByHuman).
 *   Without it the harness stops at the confirmation boundary and no order
 *   verb call without `dryRun` is ever issued.
 * - Every step and the whole report are labeled DEMO / PAPER.
 * - No live-trading functionality exists: there is no code path that
 *   launches the MCP without `--paper-trading`, and this module is not
 *   imported by any app route/service (test-enforced).
 */

export const PAPER_ENVIRONMENT_LABEL =
  "DEMO / PAPER — Bitget Demo Trading environment (--paper-trading, paptrading: 1) — no real funds involved";

/** The official launch. Hardcoded: callers cannot remove `--paper-trading`. */
export const OFFICIAL_MCP_LAUNCH: { command: string; args: string[] } = {
  command: "npx",
  args: ["-y", "@bitget-ai/bitget-agent-mcp", "--paper-trading"],
};

const DEMO_SOURCE_VARS = [
  "BITGET_DEMO_API_KEY",
  "BITGET_DEMO_SECRET_KEY",
  "BITGET_DEMO_PASSPHRASE",
] as const;

const PRODUCTION_NAMESPACE_VARS = [
  "BITGET_API_KEY",
  "BITGET_SECRET_KEY",
  "BITGET_PASSPHRASE",
] as const;

export interface DemoCredentialMapping {
  /** Official variable names → demo values, for the child MCP env ONLY. */
  childCredentials: Record<string, string>;
  sourceVars: string[];
}

/**
 * Map the separate Demo credentials into the official child-env names.
 * Pure: takes an env record, returns null when demo credentials are absent
 * (the caller reports the documented setup procedure). Throws when a demo
 * value equals a production-namespace value — "a separate Demo API Key" is
 * a hard requirement, and reusing the production credential in any
 * namespace violates it. Production values are compared, never forwarded.
 */
export function mapDemoCredentials(
  env: Record<string, string | undefined>,
): DemoCredentialMapping | null {
  const missing = DEMO_SOURCE_VARS.filter((k) => !env[k]);
  if (missing.length > 0) return null;

  const childCredentials: Record<string, string> = {
    BITGET_API_KEY: env.BITGET_DEMO_API_KEY as string,
    BITGET_SECRET_KEY: env.BITGET_DEMO_SECRET_KEY as string,
    BITGET_PASSPHRASE: env.BITGET_DEMO_PASSPHRASE as string,
  };

  for (const prodVar of PRODUCTION_NAMESPACE_VARS) {
    const prodValue = env[prodVar];
    if (prodValue && Object.values(childCredentials).includes(prodValue)) {
      throw new Error(
        `Refusing to run: ${prodVar} is identical to a demo credential. ` +
          `The Demo API Key must be a SEPARATE credential created at bitget.com/api-management.`,
      );
    }
  }

  return { childCredentials, sourceVars: [...DEMO_SOURCE_VARS] };
}

/** Minimal env a spawned `npx` needs; everything else stays out. */
const CHILD_ENV_ALLOWLIST = [
  "PATH", "PATHEXT", "COMSPEC", "SystemRoot", "windir", "TEMP", "TMP",
  "APPDATA", "LOCALAPPDATA", "PROGRAMFILES", "PROGRAMFILES(X86)",
  "COMMONPROGRAMFILES", "USERPROFILE", "HOMEDRIVE", "HOMEPATH", "OS",
  "NODE_OPTIONS", "npm_config_registry",
] as const;

/**
 * Build the child MCP env: allowlisted system entries + ONLY the mapped
 * demo credentials. No production-namespace variable is ever forwarded.
 */
export function buildChildEnv(
  parentEnv: Record<string, string | undefined>,
  mapped: DemoCredentialMapping,
): Record<string, string> {
  const child: Record<string, string> = {};
  for (const key of CHILD_ENV_ALLOWLIST) {
    const value = parentEnv[key];
    if (typeof value === "string") child[key] = value;
  }
  for (const [k, v] of Object.entries(mapped.childCredentials)) {
    child[k] = v;
  }
  return child;
}

// ---------------------------------------------------------------------------
// Response validation (bounded, Zod-validated with a generic fallback)
// ---------------------------------------------------------------------------

const McpCallResultSchema = z.object({
  content: z
    .array(z.object({ type: z.string(), text: z.string().optional() }).passthrough())
    .min(1)
    .max(64),
  isError: z.boolean().optional(),
}).passthrough();

/** Parse an MCP callTool result: text content → JSON when it parses. */
export function parseMcpResult(raw: unknown): { json: unknown; text: string; isError: boolean } {
  const r = McpCallResultSchema.safeParse(raw);
  if (!r.success) {
    return { json: undefined, text: JSON.stringify(raw).slice(0, 800), isError: true };
  }
  const firstText = r.data.content.find((c) => typeof c.text === "string")?.text ?? "";
  let json: unknown;
  try {
    json = JSON.parse(firstText);
  } catch {
    json = undefined;
  }
  return { json, text: firstText.slice(0, 4000), isError: r.data.isError === true };
}

// ---------------------------------------------------------------------------
// Action plan and discovery-driven argument mapping
// ---------------------------------------------------------------------------

export interface PaperProposedAction {
  source: "product-generated" | "harness-default";
  symbol: string;
  side: "buy" | "sell";
  orderType: "market";
  /** Order size in base currency (kept tiny for the demo environment). */
  size: string;
  /** Product context when derived from an Agentic handoff document. */
  productAsset?: string;
  productVerdict?: string;
  decisionArtifactId?: string;
}

/** Hard cap on estimated demo notional (USD) — the demo stays tiny. */
export const DEMO_NOTIONAL_CAP_USD = 50;

const FIELD_CANDIDATES: Record<string, string[]> = {
  symbol: ["symbol", "instrument", "instId", "pair", "market"],
  side: ["side", "orderSide"],
  orderType: ["orderType", "type", "order_type"],
  size: ["size", "quantity", "qty", "amount", "orderSize", "baseSize"],
};

/**
 * Map the plan onto the OFFICIAL discovered `order place` contract. Field
 * names are matched against the contract the server itself returned —
 * nothing is hardcoded beyond the officially documented `action: "place"`
 * anchor and the global `dryRun` write-safety parameter.
 */
export function mapPlaceArguments(
  placeContract: unknown,
  plan: PaperProposedAction,
  opts: { dryRun: boolean },
): { args: Record<string, unknown>; unmatched: string[] } {
  const args: Record<string, unknown> = { action: "place", dryRun: opts.dryRun };
  const unmatched: string[] = [];

  const props = new Set<string>();
  const contractText = JSON.stringify(placeContract ?? {}).toLowerCase();
  for (const fields of Object.values(FIELD_CANDIDATES)) {
    for (const f of fields) if (contractText.includes(`"${f.toLowerCase()}"`)) props.add(f.toLowerCase());
  }

  const pick = (kind: string, value: unknown): boolean => {
    const candidates = FIELD_CANDIDATES[kind].filter((f) => props.has(f.toLowerCase()));
    const target = candidates[0];
    if (target) {
      args[target] = value;
      return true;
    }
    return false;
  };

  if (!pick("symbol", plan.symbol)) unmatched.push("symbol");
  if (!pick("side", plan.side)) unmatched.push("side");
  if (!pick("orderType", plan.orderType)) unmatched.push("orderType");
  if (!pick("size", plan.size)) unmatched.push("size");
  return { args, unmatched };
}

/** Pull the ticker-like action name out of the discovered market contract. */
export function findTickerAction(marketContract: unknown): string | null {
  const text = JSON.stringify(marketContract ?? {}).toLowerCase();
  for (const candidate of ["ticker", "price", "latest", "quote", "candles"]) {
    if (text.includes(`"${candidate}"`)) return candidate;
  }
  return null;
}

// ---------------------------------------------------------------------------
// The seven-step verification run
// ---------------------------------------------------------------------------

export interface PaperMcpClient {
  callTool(req: { name: string; arguments?: Record<string, unknown> }): Promise<unknown>;
}

export type PaperStepStatus = "PASS" | "SKIPPED" | "REFUSED" | "FAIL";

export interface PaperStepResult {
  id: number;
  name: string;
  status: PaperStepStatus;
  /** Every step carries the DEMO/PAPER label — no exceptions. */
  environment: "DEMO_PAPER";
  detail: string;
  /** Bounded response excerpt for the paper-trading log. */
  data?: string;
}

export interface PaperVerificationReport {
  runLabel: string;
  environmentLabel: string;
  executedAt: string;
  proposedAction: PaperProposedAction;
  credentialSeparation: {
    demoOnlyChildEnv: true;
    sourceVars: string[];
    productionNamespaceForwarded: false;
  };
  executionConfirmedByHuman: boolean;
  steps: PaperStepResult[];
}

export interface PaperVerificationOptions {
  client: PaperMcpClient;
  proposedAction: PaperProposedAction;
  /** The EXPLICIT human confirmation for paper execution (step 6). */
  executionConfirmedByHuman: boolean;
  /** Wall-clock bound per call (ms). */
  callTimeoutMs?: number;
}

const bounded = (value: unknown, max = 1600): string | undefined => {
  if (value === undefined) return undefined;
  try {
    return JSON.stringify(value).slice(0, max);
  } catch {
    return String(value).slice(0, max);
  }
};

async function call(
  client: PaperMcpClient,
  name: string,
  args: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ json: unknown; text: string; isError: boolean; error?: string }> {
  try {
    const raw = await Promise.race([
      client.callTool({ name, arguments: args }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
    const parsed = parseMcpResult(raw);
    return parsed;
  } catch (e) {
    return { json: undefined, text: "", isError: true, error: e instanceof Error ? e.message : String(e) };
  }
}

function extractPrice(json: unknown): number | null {
  if (json === null || typeof json !== "object") return null;
  const rec = json as Record<string, unknown>;
  for (const key of ["price", "lastPr", "last", "lastPrice", "close"]) {
    const v = rec[key];
    if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) return Number(v);
    if (typeof v === "number") return v;
    if (v && typeof v === "object") {
      const nested = extractPrice(v);
      if (nested !== null) return nested;
    }
  }
  return null;
}

function hasOrderPlacedMarker(json: unknown): boolean {
  const text = JSON.stringify(json ?? {}).toLowerCase();
  return /"(order_?id|orderId)"\s*:\s*"(?!")/.test(text) && !/dryRun"\s*:\s*true/.test(text);
}

/**
 * Run the seven-step paper-trading verification against an injected MCP
 * client (the real stdio MCP in the script; the stdio fixture in tests).
 * The runner performs NO credential handling and NO direct network I/O of
 * its own — everything flows through the official MCP process.
 */
export async function runPaperVerification(
  opts: PaperVerificationOptions,
): Promise<PaperVerificationReport> {
  const { client, proposedAction } = opts;
  const timeoutMs = opts.callTimeoutMs ?? 15_000;
  const steps: PaperStepResult[] = [];
  const step = (s: PaperStepResult) => steps.push(s);

  // (1) CONNECTION — MCP initialize + surface discovery
  const conn = await call(client, "discover", {}, timeoutMs);
  step({
    id: 1,
    name: "connection (MCP stdio initialize + discover)",
    status: conn.isError ? "FAIL" : "PASS",
    environment: "DEMO_PAPER",
    detail: conn.isError
      ? `official MCP not reachable: ${conn.error ?? conn.text.slice(0, 200)}`
      : "connected to the official @bitget-ai/bitget-agent-mcp --paper-trading child process",
    data: conn.isError ? conn.text : bounded(conn.json),
  });

  // (2) MARKET READ — public data, works in the demo environment
  const marketContract = await call(client, "discover", { tool: "market" }, timeoutMs);
  const tickerAction = findTickerAction(marketContract.json);
  let marketPrice: number | null = null;
  if (tickerAction && !marketContract.isError) {
    const tick = await call(
      client,
      "market",
      { action: tickerAction, symbol: proposedAction.symbol },
      timeoutMs,
    );
    marketPrice = extractPrice(tick.json);
    step({
      id: 2,
      name: `market read (market.${tickerAction} ${proposedAction.symbol})`,
      status: marketPrice !== null && !tick.isError ? "PASS" : "FAIL",
      environment: "DEMO_PAPER",
      detail:
        marketPrice !== null
          ? `paper-environment price for ${proposedAction.symbol}: ${marketPrice}`
          : `market read did not yield a price: ${tick.error ?? tick.text.slice(0, 200)}`,
      data: tick.isError ? tick.text : bounded(tick.json),
    });
  } else {
    step({
      id: 2,
      name: "market read",
      status: "FAIL",
      environment: "DEMO_PAPER",
      detail: `no ticker-like action in the discovered market contract: ${bounded(marketContract.json, 400)}`,
    });
  }

  // (3) PROPOSED ACTION — validated, bounded, never auto-executed
  const notional =
    marketPrice !== null ? marketPrice * Number(proposedAction.size || "0") : null;
  const notionalOk = notional !== null && notional <= DEMO_NOTIONAL_CAP_USD && notional > 0;
  step({
    id: 3,
    name: "proposed action (prepared, not executed)",
    status: notionalOk ? "PASS" : "FAIL",
    environment: "DEMO_PAPER",
    detail: notionalOk
      ? `proposed ${proposedAction.side} ${proposedAction.size} ${proposedAction.symbol} (~$${notional!.toFixed(2)} ≤ $${DEMO_NOTIONAL_CAP_USD} demo cap), source: ${proposedAction.source}`
      : `proposed action failed the demo bounds (price=${marketPrice}, cap $${DEMO_NOTIONAL_CAP_USD})`,
    data: bounded(proposedAction),
  });

  // (4) DRY-RUN / PREVIEW — official write-safety gate
  const placeContract = await call(
    client,
    "discover",
    { tool: "order", action: "place" },
    timeoutMs,
  );
  if (placeContract.isError) {
    step({
      id: 4,
      name: "dry-run preview",
      status: "FAIL",
      environment: "DEMO_PAPER",
      detail: `could not discover the order.place contract: ${placeContract.error ?? placeContract.text.slice(0, 200)}`,
    });
  } else {
    const { args, unmatched } = mapPlaceArguments(placeContract.json, proposedAction, { dryRun: true });
    if (unmatched.length > 0) {
      step({
        id: 4,
        name: "dry-run preview",
        status: "FAIL",
        environment: "DEMO_PAPER",
        detail: `could not map plan fields onto the official contract: ${unmatched.join(", ")}`,
        data: bounded(placeContract.json, 800),
      });
    } else {
      const dry = await call(client, "order", args, timeoutMs);
      const leaked = hasOrderPlacedMarker(dry.json);
      step({
        id: 4,
        name: "dry-run preview (dryRun: true)",
        status: !dry.isError && !leaked ? "PASS" : "FAIL",
        environment: "DEMO_PAPER",
        detail: !dry.isError && !leaked
          ? "official write-safety gate returned a preview without placing an order (no order id present)"
          : leaked
            ? "REFUSING: dry-run response contained an order id — preview semantics violated"
            : `dry-run failed: ${dry.error ?? dry.text.slice(0, 200)}`,
        data: dry.isError ? dry.text : bounded(dry.json, 2000),
      });

      // (5) EXPLICIT CONFIRMATION BOUNDARY
      if (!opts.executionConfirmedByHuman) {
        step({
          id: 5,
          name: "explicit human confirmation boundary",
          status: "REFUSED",
          environment: "DEMO_PAPER",
          detail:
            "no human confirmation provided — paper execution will NOT run. Re-run with --confirm-execution to proceed deliberately.",
        });
      } else {
        step({
          id: 5,
          name: "explicit human confirmation boundary",
          status: "PASS",
          environment: "DEMO_PAPER",
          detail: "human explicitly confirmed paper execution (--confirm-execution)",
        });
      }

      // (6) PAPER EXECUTION — only behind the explicit human gate
      if (opts.executionConfirmedByHuman) {
        const placeArgs = { ...args, dryRun: undefined };
        delete placeArgs.dryRun;
        const placed = await call(client, "order", placeArgs, timeoutMs);
        const placedOk = !placed.isError && hasOrderPlacedMarker(placed.json);
        step({
          id: 6,
          name: "paper execution (Demo environment)",
          status: placedOk ? "PASS" : "FAIL",
          environment: "DEMO_PAPER",
          detail: placedOk
            ? "paper order placed in the Bitget DEMO environment (no real funds)"
            : `paper execution failed: ${placed.error ?? placed.text.slice(0, 200)}`,
          data: bounded(placed.json, 2000),
        });
      } else {
        step({
          id: 6,
          name: "paper execution (Demo environment)",
          status: "SKIPPED",
          environment: "DEMO_PAPER",
          detail: "skipped: explicit human confirmation not given (this is the designed default)",
        });
      }
    }
  }

  // (7) RESULTING PAPER ACCOUNT STATE
  const account = await call(client, "account_overview", {}, timeoutMs);
  step({
    id: 7,
    name: "resulting paper account state (account_overview)",
    status: account.isError ? "FAIL" : "PASS",
    environment: "DEMO_PAPER",
    detail: account.isError
      ? `paper account state unavailable: ${account.error ?? account.text.slice(0, 200)}`
      : "paper account state retrieved from the Demo environment",
    data: account.isError ? account.text : bounded(account.json, 2000),
  });

  return {
    runLabel: "PRE24-08 PAPER-TRADING VERIFICATION — DEMO / PAPER",
    environmentLabel: PAPER_ENVIRONMENT_LABEL,
    executedAt: new Date().toISOString(),
    proposedAction,
    credentialSeparation: {
      demoOnlyChildEnv: true,
      sourceVars: DEMO_SOURCE_VARS as unknown as string[],
      productionNamespaceForwarded: false,
    },
    executionConfirmedByHuman: opts.executionConfirmedByHuman,
    steps,
  };
}

/**
 * Derive the product-context proposed action from an Agentic handoff
 * document (PRE24-07). The demo order uses a demo-tradable symbol; the
 * product context is carried and labeled verbatim.
 */
export function proposedActionFromHandoff(
  handoff: AgenticHandoffDocument,
  demoSymbol: string,
  demoSize: string,
): PaperProposedAction {
  return {
    source: "product-generated",
    symbol: demoSymbol,
    side: "buy",
    orderType: "market",
    size: demoSize,
    productAsset: handoff.proposedAction.asset,
    productVerdict: handoff.proposedAction.finalVerdict,
    decisionArtifactId: handoff.proposedAction.decisionArtifactId,
  };
}
