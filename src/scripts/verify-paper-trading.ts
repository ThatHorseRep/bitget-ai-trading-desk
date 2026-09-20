/**
 * PRE24-08 — Official Bitget Agent Hub PAPER-TRADING verification harness.
 *
 * DEMO / PAPER ONLY. Runs the official `@bitget-ai/bitget-agent-mcp` in
 * `--paper-trading` mode (Bitget's Demo Trading environment, paptrading: 1)
 * as a LOCAL stdio child process and proves the seven-step chain:
 * connection → market read → proposed action → dry-run preview → explicit
 * human confirmation boundary → paper execution (only if the human passes
 * --confirm-execution) → resulting paper account state.
 *
 * This script is NOT part of the web app, the test suite, or any Vercel
 * deployment. It is a developer-side procedure (run with npm run
 * verify-paper-trading). Credentials never touch this repository: they are
 * read from BITGET_DEMO_* variables and forwarded ONLY into the child
 * process env under the official names.
 *
 * Usage:
 *   BITGET_DEMO_API_KEY=... BITGET_DEMO_SECRET_KEY=... BITGET_DEMO_PASSPHRASE=... \
 *     npm run verify-paper-trading
 *   (add --confirm-execution to explicitly allow paper execution)
 *
 * If the Demo credentials are absent, the script prints the documented
 * setup procedure and exits — it never falls back to production variables.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  OFFICIAL_MCP_LAUNCH,
  PAPER_ENVIRONMENT_LABEL,
  buildChildEnv,
  mapDemoCredentials,
  proposedActionFromHandoff,
  runPaperVerification,
  type PaperProposedAction,
} from "../adapters/agenthub/paperTrading.js";

const CONFIRM_FLAG = "--confirm-execution";

function readParentEnv(): Record<string, string | undefined> {
  return { ...process.env } as Record<string, string | undefined>;
}

function printSetupProcedure(reason: string): void {
  console.log(`
${PAPER_ENVIRONMENT_LABEL}

${reason}

SETUP PROCEDURE (official, per Bitget Agent Hub docs):
1. Create a SEPARATE Demo API Key (never your production key):
     bitget.com -> Profile -> API Management -> Create API Key
     -> choose the DEMO/paper-trading key type (Read + Trade permissions)
2. Export ONLY the demo variables (never BITGET_API_KEY — that namespace
   belongs to production credentials and is deliberately not read here):
     export BITGET_DEMO_API_KEY=<demo key>
     export BITGET_DEMO_SECRET_KEY=<demo secret>
     export BITGET_DEMO_PASSPHRASE=<demo passphrase>
3. Re-run: npm run verify-paper-trading
   (add --confirm-execution only when you explicitly want paper execution)

The harness refuses to run if a demo value equals a production-namespace
value — the Demo credential must be separate.
`);
}

async function main(): Promise<void> {
  console.log(`\n=== PRE24-08 Paper-Trading Verification Harness ===`);
  console.log(`Environment: ${PAPER_ENVIRONMENT_LABEL}\n`);

  const args = process.argv.slice(2);
  const executionConfirmedByHuman = args.includes(CONFIRM_FLAG);

  // Credential separation gate (step 0):
  let mapped;
  try {
    mapped = mapDemoCredentials(readParentEnv());
  } catch (e) {
    printSetupProcedure(e instanceof Error ? e.message : String(e));
    process.exitCode = 2;
    return;
  }
  if (!mapped) {
    printSetupProcedure("Demo credentials not found (BITGET_DEMO_API_KEY / _SECRET_KEY / _PASSPHRASE).");
    process.exitCode = 2;
    return;
  }
  console.log(
    `[0/7] Credential separation: OK — demo-only child env from ${mapped.sourceVars.join(", ")}; production namespace never forwarded.`,
  );

  // Proposed action: default demo plan (tiny, bounded by the harness cap).
  const proposedAction: PaperProposedAction = {
    source: "harness-default",
    symbol: process.env.PAPER_DEMO_SYMBOL ?? "BTCUSDT",
    side: "buy",
    orderType: "market",
    size: process.env.PAPER_DEMO_SIZE ?? "0.001",
  };

  // Launch the official MCP as a local stdio child (developer machine only).
  console.log(
    `Launching official MCP: ${OFFICIAL_MCP_LAUNCH.command} ${OFFICIAL_MCP_LAUNCH.args.join(" ")} ...`,
  );
  const transport = new StdioClientTransport({
    command: OFFICIAL_MCP_LAUNCH.command,
    args: OFFICIAL_MCP_LAUNCH.args,
    env: buildChildEnv(readParentEnv(), mapped),
  });
  const client = new Client({ name: "paper-trading-verification", version: "1.0.0" }, { capabilities: {} });

  let report;
  try {
    await client.connect(transport);
    console.log("Child MCP connected (stdio).\n");
    report = await runPaperVerification({
      client,
      proposedAction,
      executionConfirmedByHuman,
      callTimeoutMs: Number(process.env.PAPER_CALL_TIMEOUT_MS ?? 15_000),
    });
  } catch (err) {
    console.error("\nHarness could not run the official MCP:", err instanceof Error ? err.message : err);
    console.error(
      "Check: Node >= 20, npm registry reachable, and the Demo API Key valid for the Demo environment.",
    );
    process.exitCode = 1;
    return;
  } finally {
    try {
      await client.close();
    } catch {
      /* swallow */
    }
    try {
      transport.close();
    } catch {
      /* swallow */
    }
  }

  // Report — every step labeled DEMO / PAPER; saved as the paper-trading log.
  console.log(`\n${report.runLabel}`);
  for (const s of report.steps) {
    const mark = { PASS: "PASS", SKIPPED: "SKIP", REFUSED: "REFUSED", FAIL: "FAIL" }[s.status];
    console.log(`  [${mark.padEnd(7)}] (step ${s.id}, ${s.environment}) ${s.name}`);
    console.log(`            ${s.detail}`);
  }
  const failed = report.steps.some((s) => s.status === "FAIL");
  const refused = report.steps.some((s) => s.status === "REFUSED");

  const logDir = "paper-trading-logs";
  try {
    mkdirSync(logDir, { recursive: true });
    const file = join(logDir, `paper-verify-${report.executedAt.replace(/[:.]/g, "-")}.json`);
    writeFileSync(file, JSON.stringify(report, null, 2));
    console.log(`\nPaper-trading log written: ${file}`);
  } catch {
    console.log("\n( Could not write the paper-trading log file — report printed above. )");
  }

  console.log(
    failed
      ? "\nResult: FAILURES detected — see steps above. No real funds were ever at risk (DEMO environment)."
      : refused
        ? "\nResult: verification stopped at the explicit confirmation boundary — no paper order placed. Re-run with --confirm-execution to proceed deliberately."
        : "\nResult: paper-trading verification COMPLETE (DEMO environment only — no real funds involved).",
  );
  process.exitCode = failed ? 1 : 0;
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});
