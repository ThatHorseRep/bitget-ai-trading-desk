/**
 * PRE24-08 test fixture — a local stdio MCP server mimicking the OFFICIAL
 * `@bitget-ai/bitget-agent-mcp` surface semantics (documented in the
 * agent-mcp README): the discover/market/order/account_overview intent
 * verbs, `dryRun: true` write previews, `confirmationRequired` for
 * high-risk operations, and a Demo-environment account that reflects
 * placed paper orders.
 *
 * Hermetic: spawned as a child process on stdio by the test's
 * StdioClientTransport; no network, no real credentials, no Bitget access.
 */
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

const state = {
  usdt: 10000,
  orders: [],
  calls: [],
};

const DEMO_PRICE = 40000; // BTCUSDT fixture price -> 0.001 BTC = $40 (under the $50 demo cap)

// Args schema mirrors the documented intent-verb shapes; everything the
// harness may send is declared so the SDK does not strip fields.
const argsShape = {
  action: z.string().optional(),
  tool: z.string().optional(),
  domain: z.string().optional(),
  symbol: z.string().optional(),
  side: z.string().optional(),
  orderType: z.string().optional(),
  size: z.string().optional(),
  dryRun: z.boolean().optional(),
  confirm: z.boolean().optional(),
};

const server = new McpServer({ name: "fixture-bitget-agent-mcp-paper", version: "1.0.0" });

server.registerTool(
  "discover",
  { description: "Progressive introspection of the intent surface", inputSchema: argsShape },
  async (args) => {
    state.calls.push({ tool: "discover", args });
    let payload;
    if (args.tool === "market") {
      payload = { tool: "market", actions: [{ name: "ticker", params: { symbol: "string" } }, { name: "candles", params: { symbol: "string" } }] };
    } else if (args.tool === "order" && args.action === "place") {
      payload = {
        tool: "order",
        action: "place",
        fields: { symbol: "string", side: "string", orderType: "string", size: "string" },
        writeSafety: { dryRun: "preview the would-send request without sending it", confirm: "required for high-risk operations" },
      };
    } else if (args.tool === "order") {
      payload = { tool: "order", actions: [{ name: "place" }, { name: "cancel" }, { name: "cancelAll", highRisk: true }] };
    } else {
      payload = { domains: ["market", "trade", "account"], metaTools: ["discover", "raw"] };
    }
    return { content: [{ type: "text", text: JSON.stringify(payload) }] };
  },
);

server.registerTool(
  "market",
  { description: "Market data verb (public, no credentials)", inputSchema: argsShape },
  async (args) => {
    state.calls.push({ tool: "market", args });
    if (args.action === "ticker") {
      return { content: [{ type: "text", text: JSON.stringify({ symbol: args.symbol, price: DEMO_PRICE, demoEnvironment: true }) }] };
    }
    return { content: [{ type: "text", text: JSON.stringify({}) }] };
  },
);

server.registerTool(
  "order",
  { description: "Trading verb", inputSchema: argsShape },
  async (args) => {
    state.calls.push({ tool: "order", args });
    if (args.action === "place") {
      if (args.dryRun === true) {
        // Official write-safety: preview the would-send request, send nothing.
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              dryRun: true,
              preview: { wouldSend: { symbol: args.symbol, side: args.side, orderType: args.orderType, size: args.size } },
              note: "preview only - nothing sent",
            }),
          }],
        };
      }
      const id = `PAPER-${state.orders.length + 1}`;
      const notional = Number(args.size) * DEMO_PRICE;
      state.usdt = state.usdt - notional;
      state.orders.push({ orderId: id, symbol: args.symbol, side: args.side, size: args.size, demo: true });
      return { content: [{ type: "text", text: JSON.stringify({ orderId: id, status: "filled", demoTradingEnvironment: true }) }] };
    }
    if (args.action === "cancelAll" && args.confirm !== true) {
      return { content: [{ type: "text", text: JSON.stringify({ confirmationRequired: true }) }] };
    }
    return { content: [{ type: "text", text: JSON.stringify({}) }] };
  },
);

server.registerTool(
  "account_overview",
  { description: "Demo-environment account state", inputSchema: argsShape },
  async () => {
    state.calls.push({ tool: "account_overview", args: {} });
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          demoTradingEnvironment: true,
          paperEnvironment: true,
          balances: [{ asset: "USDT", available: state.usdt }],
          paperOrders: state.orders,
        }),
      }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Serve requests until stdin closes; no further output (stdio protocol).
}

main().catch(() => process.exit(1));
