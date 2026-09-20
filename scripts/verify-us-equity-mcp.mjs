import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function verifyConnection() {
  console.log("Attempting to connect to Bitget US Equity MCP...");
  const transport = new StreamableHTTPClientTransport(new URL("https://agent.bitget.com/mcp"));
  const client = new Client({ name: "bitget-redteam-verifier", version: "1.0.0" }, { capabilities: {} });

  try {
    const timeoutMs = 10000;
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    await Promise.race([client.connect(transport), timeoutPromise]).finally(() => clearTimeout(timeoutHandle));

    console.log("Successfully connected to MCP Server.");
    const { tools } = await client.listTools();
    console.log(`Found ${tools.length} tools:`);
    tools.forEach(t => {
      console.log(`- ${t.name}: ${t.description}`);
      console.log(`  Schema:`, JSON.stringify(t.inputSchema, null, 2));
    });
  } catch (err) {
    console.error("Failed to connect or fetch tools:", err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

verifyConnection();
