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
    // Step 3: Catalog protocol (live guide + do_query interface) or named
    // tool sample call.
    // -------------------------------------------------------------------
    const toolNames = new Set(tools.map((t) => t.name));
    if (toolNames.has("guide") && toolNames.has("do_query")) {
      console.log("[3/4] Catalog protocol detected (guide + do_query). Walking the equity catalog...");
      try {
        const guideRes = await Promise.race([
          client.callTool({ name: "guide", arguments: { category: "equity" } }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
        ]);
        const guidePayload = extractPayloadJson(guideRes);
        const rawEntries: unknown[] = Array.isArray(guidePayload?.entries)
          ? guidePayload.entries
          : [];
        const entries = rawEntries.filter(
          (e): e is { id: string; params_summary?: Array<{ name: string; required?: boolean }> } =>
            typeof e === "object" && e !== null && typeof (e as { id?: unknown }).id === "string",
        );
        console.log(`  guide(equity) returned ${entries.length} entr(ies).`);
        const ranked = entries
          .filter((e) =>
            (e.params_summary ?? []).every((p) => !p.required || p.name === "symbol"))
          .slice(0, 3);
        for (const entry of ranked) {
          const entryId = entry.id;
          try {
            const qRes = await Promise.race([
              client.callTool({
                name: "do_query",
                arguments: { entry_id: entryId, params: { symbol: "AAPL" } },
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
            ]);
            const text = ((qRes as { content?: Array<{ type: string; text?: string }> }).content ?? [])
              .filter((c) => c.type === "text")
              .map((c) => c.text ?? "")
              .join("\n");
            console.log(`  do_query(${entryId}): ${text.substring(0, 300)}`);
          } catch (err) {
            console.log(`  do_query(${entryId}) failed: ${err}`);
          }
        }
      } catch (err) {
        console.log(`  Catalog walk failed: ${err}`);
      }
    } else {
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

/** Parse the first text block of an MCP result as JSON (diagnostic helper). */
function extractPayloadJson(raw: unknown): { entries?: unknown[] } | null {
  const obj = raw as { content?: Array<{ type: string; text?: string }> } | null;
  const text = (obj?.content ?? []).find((c) => c.type === "text")?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
