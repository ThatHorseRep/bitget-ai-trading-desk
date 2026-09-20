/**
 * PRE24-03 — Bitget Signal real-connectivity verification (OPTIONAL script).
 *
 * NOT part of the normal test suite. Run manually:
 *   npm run build:core && node dist-core/src/scripts/verify-signal-connectivity.js
 *
 * Documents the exact access path and verifies, against the LIVE endpoint,
 * that the documented programmatic route works from this environment.
 */
import { BitgetSignalProvider } from "../adapters/research/bitgetSignalProvider.js";

const ENDPOINT = process.env.BITGET_SIGNAL_MCP_ENDPOINT ?? "https://datahub.noxiaohao.com/mcp";

async function main() {
  console.log(`\n=== Bitget Signal (PRE24-03) Connectivity Check ===`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Source:   @bitget-ai/bitget-signal@1.2.0 scripts/install.js (MCP_NAME="bitget-signal")\n`);

  const provider = new BitgetSignalProvider(ENDPOINT);

  // -----------------------------------------------------------------------
  // Step 1: provider status
  // -----------------------------------------------------------------------
  console.log("[1/4] Checking provider status...");
  const status = await provider.getStatus();
  console.log(`  Result: ${status}\n`);

  if (status === "UNAVAILABLE") {
    console.log("Endpoint is unreachable. Possible causes:");
    console.log("  - DNS cannot resolve datahub.noxiaohao.com in this environment");
    console.log("  - Network policy blocks outbound HTTPS");
    console.log("  - The MCP server is temporarily down");
    console.log("\nSkipping remaining steps.");
    process.exitCode = 1;
    return;
  }

  // -----------------------------------------------------------------------
  // Step 2: live tool discovery vs the documented tool inventory
  // -----------------------------------------------------------------------
  console.log("[2/4] Discovering live tools via listTools()...");
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StreamableHTTPClientTransport } = await import(
    "@modelcontextprotocol/sdk/client/streamableHttp.js"
  );
  let transport: InstanceType<typeof StreamableHTTPClientTransport> | null = null;
  let client: InstanceType<typeof Client> | null = null;
  const DOCUMENTED = [
    "rates_yields", "macro_indicators", "global_assets", "cross_asset", "cn_market",
    "global_data", "crypto_market", "defi_analytics", "network_status",
    "sentiment_index", "derivatives_sentiment", "news_feed", "tradfi_news",
    "social_trending",
  ];
  try {
    transport = new StreamableHTTPClientTransport(new URL(ENDPOINT));
    client = new Client({ name: "verify-signal-connectivity", version: "1.0.0" }, { capabilities: {} });
    await Promise.race([
      client.connect(transport),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 10_000)),
    ]);
    const result = await client.listTools();
    const names = ((result as { tools?: Array<{ name: string }> }).tools ?? [])
      .map((t) => t.name)
      .sort();
    console.log(`  Live tools (${names.length}): ${names.join(", ")}`);
    const missing = DOCUMENTED.filter((d) => !names.includes(d));
    console.log(`  Documented-but-absent: ${missing.length > 0 ? missing.join(", ") : "(none)"}`);

    // ---------------------------------------------------------------------
    // Step 3: sample capability calls (one read-only call per capability)
    // ---------------------------------------------------------------------
  console.log("\n[3/4] Sample capability calls (diagnostic window: 40s)...");
    const samples: Array<{ cap: string; tool: string; args: Record<string, unknown> }> = [
      { cap: "macro-analyst", tool: "rates_yields", args: { action: "rates_snapshot" } },
      { cap: "market-intel", tool: "crypto_market", args: { action: "global" } },
      { cap: "sentiment-analyst", tool: "sentiment_index", args: { action: "current" } },
      { cap: "news-briefing", tool: "news_feed", args: { action: "latest", feeds: "cointelegraph,coindesk,decrypt,blockworks", limit: 5 } },
    ];
    const available = new Set(names);
    for (const s of samples) {
      if (!available.has(s.tool)) {
        console.log(`  [${s.cap}] ${s.tool}: NOT LISTED by live server — skipped`);
        continue;
      }
      try {
        const t0 = Date.now();
        const callResult = await Promise.race([
          client.callTool({ name: s.tool, arguments: s.args }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 40_000)),
        ]);
        const text = JSON.stringify(callResult);
        console.log(`  [${s.cap}] ${s.tool}: responded in ${Date.now() - t0} ms (${text.length} chars)`);
        console.log(`    ${text.substring(0, 400)}`);
      } catch (err) {
        console.log(`  [${s.cap}] ${s.tool}: FAILED — ${err}`);
      }
    }

    // ---------------------------------------------------------------------
    // Step 4: provider-level observation fetch (routed, normalized)
    // ---------------------------------------------------------------------
    console.log("\n[4/4] Provider observation fetch (8s per-call bound, parallel dispatch)...");
    const observations = await provider.getObservations(
      "BTCUSDT",
      "is the macro good for crypto and are longs crowded? check funding and news",
    );
    console.log(`  Retrieved ${observations.length} observation(s).`);
    for (const obs of observations.slice(0, 3)) {
      console.log(`  - [${obs.providerStatus}] ${obs.source}`);
      console.log(`    ${obs.title} :: ${obs.summary.substring(0, 160)}`);
    }
  } catch (err) {
    console.error("Verification failed:", err);
    process.exitCode = 1;
  } finally {
    try {
      if (client) await client.close();
    } catch {
      /* swallow */
    }
    try {
      if (transport) await transport.close();
    } catch {
      /* swallow */
    }
  }

  console.log("\n=== Done ===\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});
