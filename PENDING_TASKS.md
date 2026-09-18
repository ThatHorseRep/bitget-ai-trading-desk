# Pending Tasks: US Equity MCP Integration

Due to environmental and documentation constraints during development, the following tasks are incomplete and must be finalized before production deployment:

1. **Implement Exact MCP Tool Execution (`src/adapters/research/bitgetUsEquityMcpProvider.ts`)**
   - **Blocker:** The `agent.bitget.com` endpoint was DNS-blocked (`ENOTFOUND`) in the development environment. Furthermore, the official GitBook only listed tool *categories* (e.g., "Fundamentals", "Quotes"), but not the exact JSON-RPC tool names or their `inputSchema`.
   - **Action Required:** Once deployed in a connected environment, inspect the result of `client.listTools()`. Replace the explicit halt/`console.warn` logic in `getObservations` with actual calls to the corresponding MCP tools (e.g., `client.callTool({ name: 'get_us_stock_quote', arguments: { symbol: asset } })`).

2. **Normalize MCP Responses**
   - **Blocker:** Without seeing the live payload shape from the US Equity MCP server, we could not write a rigorous Zod schema to validate and normalize the response into the `NormalizedResearchObservation` array.
   - **Action Required:** Inspect the live tool execution results. Map the raw JSON properties (e.g., price, volume, PE ratio, news sentiment) to the internal `ResearchObservation` contract.
