import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { BitgetUsEquityMcpProvider, classifyTool } from "../adapters/research/bitgetUsEquityMcpProvider.js";

const ENDPOINT = process.env.BITGET_MCP_ENDPOINT ?? "https://agent.bitget.com/mcp";
const TIMEOUT_MS = 10_000;

async function main() {
  console.log(`\n=== Bitget US Equity MCP Connectivity Check ===`);
  console.log(`Endpoint: ${ENDPOINT}\n`);

  // -----------------------------------------------------------------------
  // Step 1: Provider-level status check
  // -----------------------------------------------------------------------
  const provider = new BitgetUsEquityMcpProvider(ENDPOINT);
  console.log("[1/4] Checking provider status...");
  const status = await provider.getStatus();
  console.log(`  Result: ${status}\n`);

  if (status === "UNAVAILABLE") {
    console.log("Endpoint is unreachable. Possible causes:");
    console.log("  - DNS cannot resolve agent.bitget.com in this environment");
    console.log("  - Network policy blocks outbound HTTPS");
    console.log("  - The MCP server is temporarily down");
    console.log("\nSkipping remaining steps.\n");
    process.exitCode = 1;
    return;
  }

  // -----------------------------------------------------------------------
  // Step 2: Raw tool discovery dump
  // -----------------------------------------------------------------------
  console.log("[2/4] Discovering tools via listTools()...");
  let transport: StreamableHTTPClientTransport | null = null;
  let client: Client | null = null;
  try {
    transport = new StreamableHTTPClientTransport(new URL(ENDPOINT));
    client = new Client(
      { name: "verify-connectivity", version: "1.0.0" },
      { capabilities: {} },
    );
    await Promise.race([
      client.connect(transport),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ]);

    const result = await client.listTools();
    const tools = (result as { tools?: Array<{ name: string; description?: string }> }).tools ?? [];

    console.log(`  Discovered ${tools.length} tool(s):\n`);
    for (const t of tools) {
      const cat = classifyTool(t.name, t.description);
      console.log(`  [${cat.padEnd(22)}] ${t.name}`);
      if (t.description) console.log(`${"".padEnd(28)}${t.description.substring(0, 120)}`);
    }
    console.log();

    // -------------------------------------------------------------------
    // Step 3: Sample tool call (first quote-like tool)
    // -------------------------------------------------------------------
    const quoteTool = tools.find((t) => classifyTool(t.name, t.description) === "quotes");
    if (quoteTool) {
      console.log(`[3/4] Calling sample tool: ${quoteTool.name} with symbol=AAPL...`);
      try {
        const callResult = await Promise.race([
          client.callTool({ name: quoteTool.name, arguments: { symbol: "AAPL" } }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
        ]);
        console.log("  Raw result:", JSON.stringify(callResult, null, 2).substring(0, 2000));
      } catch (err) {
        console.log(`  Tool call failed: ${err}`);
      }
    } else {
      console.log("[3/4] No quote-category tool found, skipping sample call.");
    }
    console.log();

    // -------------------------------------------------------------------
    // Step 4: Provider-level observation fetch
    // -------------------------------------------------------------------
    console.log("[4/4] Fetching observations for AAPL via provider...");
    const observations = await provider.getObservations("AAPL");
    console.log(`  Retrieved ${observations.length} observation(s).`);
    if (observations.length > 0) {
      console.log("  First observation:", JSON.stringify(observations[0], null, 2));
    }

  } catch (err) {
    console.error("Verification failed:", err);
    process.exitCode = 1;
  } finally {
    try { if (client) await client.close(); } catch { /* swallow */ }
    try { if (transport) await transport.close(); } catch { /* swallow */ }
  }

  console.log("\n=== Done ===\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});
