import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { z } from "zod";
import type { NormalizedResearchObservation, ResearchProvider, ResearchProviderStatus } from "./types.js";

export class BitgetUsEquityMcpProvider implements ResearchProvider {
  readonly providerId = "bitget-us-equity-mcp";
  private endpoint = "https://agent.bitget.com/mcp";

  async getStatus(): Promise<ResearchProviderStatus> {
    let transport: SSEClientTransport | null = null;
    let client: Client | null = null;
    try {
      transport = new SSEClientTransport(new URL(this.endpoint));
      client = new Client(
        { name: "bitget-us-equity-client", version: "1.0.0" },
        { capabilities: {} }
      );
      
      const connectPromise = client.connect(transport);
      await Promise.race([
        connectPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 3000))
      ]);
      
      return "AVAILABLE";
    } catch (error) {
      console.warn("[BitgetUsEquityMcpProvider] Graceful degradation: remote MCP unreachable.", error);
      return "UNAVAILABLE";
    } finally {
      try { if (client) await client.close(); } catch (e) {}
      try { if (transport) await transport.close(); } catch (e) {}
    }
  }

  async getObservations(asset: string, topic?: string): Promise<NormalizedResearchObservation[]> {
    let client: Client | null = null;
    let transport: SSEClientTransport | null = null;
    
    try {
      transport = new SSEClientTransport(new URL(this.endpoint));
      client = new Client(
        { name: "bitget-us-equity-client", version: "1.0.0" },
        { capabilities: {} }
      );
      
      const connectPromise = client.connect(transport);
      await Promise.race([
        connectPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 3000))
      ]);
    } catch (error) {
      console.warn("[BitgetUsEquityMcpProvider] Failed to connect for observations.", error);
      try { if (client) await client.close(); } catch (e) {}
      try { if (transport) await transport.close(); } catch (e) {}
      return [];
    }

    try {
      const toolsResult = await client.listTools();
      
      // STRICT COMPLIANCE: "Do not guess tool names or request shapes."
      // Since the exact tool names and schemas are not documented in the provided GitBook,
      // and we cannot guess them, we explicitly refuse to execute generic heuristics.
      // This path will only be implemented once the exact MCP tool names are specified.
      console.warn("[BitgetUsEquityMcpProvider] Connected, but exact tool schemas are unknown. Halting execution to prevent guessing.");
      return [];

    } catch (error) {
      console.warn("[BitgetUsEquityMcpProvider] Error fetching tools.", error);
      return [];
    } finally {
      try { if (client) await client.close(); } catch (e) {}
      try { if (transport) await transport.close(); } catch (e) {}
    }
  }
}
