const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require("node:path");
const fs = require("node:fs");

const {
  OFFICIAL_MCP_LAUNCH,
  PAPER_ENVIRONMENT_LABEL,
  DEMO_NOTIONAL_CAP_USD,
  mapDemoCredentials,
  buildChildEnv,
  mapPlaceArguments,
  findTickerAction,
  runPaperVerification,
} = require("../dist-core/src/adapters/agenthub/paperTrading.js");

const FIXTURE = path.join(__dirname, "fixtures", "agentHubPaperMcpFixture.cjs");

const DEMO_ENV = {
  BITGET_DEMO_API_KEY: "demo-key-123",
  BITGET_DEMO_SECRET_KEY: "demo-secret-456",
  BITGET_DEMO_PASSPHRASE: "demo-pass-789",
};

const PLAN = {
  source: "harness-default",
  symbol: "BTCUSDT",
  side: "buy",
  orderType: "market",
  size: "0.001",
};

/** Spawn the stdio fixture with the sanitized child env (the real transport path). */
async function connectFixture(parentEnv) {
  const mapped = mapDemoCredentials(parentEnv);
  assert.ok(mapped, "demo credentials map for the fixture");
  const childEnv = buildChildEnv(parentEnv, mapped);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [FIXTURE],
    env: childEnv,
  });
  const client = new Client({ name: "paper-test", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  return { client, transport, childEnv };
}

test("credential separation: demo-only mapping; missing -> null; equality with production refused", () => {
  const mapped = mapDemoCredentials({ ...DEMO_ENV });
  assert.deepEqual(mapped.childCredentials, {
    BITGET_API_KEY: "demo-key-123",
    BITGET_SECRET_KEY: "demo-secret-456",
    BITGET_PASSPHRASE: "demo-pass-789",
  });
  // Missing any demo var -> null (never falls back to production vars):
  assert.equal(mapDemoCredentials({ BITGET_API_KEY: "prod", BITGET_DEMO_API_KEY: "d" }), null);
  assert.equal(mapDemoCredentials({}), null);
  // Demo value equal to a production-namespace value -> refuse:
  assert.throws(
    () => mapDemoCredentials({ ...DEMO_ENV, BITGET_API_KEY: "demo-key-123" }),
    /must be a SEPARATE credential/,
  );
});

test("child env: allowlisted system entries + demo credentials only; production namespace never forwarded", () => {
  const mapped = mapDemoCredentials({
    ...DEMO_ENV,
    PATH: "/usr/bin",
    TEMP: "/tmp",
    BITGET_API_KEY: "PRODUCTION-KEY", // present in parent, must NOT reach the child
    BITGET_SECRET_KEY: "PRODUCTION-SECRET",
    SOMETHING_ELSE: "leak?",
  });
  const child = buildChildEnv(
    { ...DEMO_ENV, PATH: "/usr/bin", TEMP: "/tmp", BITGET_API_KEY: "PRODUCTION-KEY", BITGET_SECRET_KEY: "PRODUCTION-SECRET", SOMETHING_ELSE: "leak?" },
    mapped,
  );
  assert.equal(child.BITGET_API_KEY, "demo-key-123");
  assert.equal(child.BITGET_SECRET_KEY, "demo-secret-456");
  assert.equal(child.BITGET_PASSPHRASE, "demo-pass-789");
  assert.equal(child.SOMETHING_ELSE, undefined);
  assert.equal(child.PATH, "/usr/bin");
  assert.ok(!JSON.stringify(child).includes("PRODUCTION-KEY"));
  assert.ok(!JSON.stringify(child).includes("PRODUCTION-SECRET"));
});

test("official launch: --paper-trading hardcoded; never combined with --read-only", () => {
  assert.deepEqual(OFFICIAL_MCP_LAUNCH, {
    command: "npx",
    args: ["-y", "@bitget-ai/bitget-agent-mcp", "--paper-trading"],
  });
  assert.ok(!OFFICIAL_MCP_LAUNCH.args.includes("--read-only"), "--read-only is officially mutually exclusive with --paper-trading");
  assert.ok(PAPER_ENVIRONMENT_LABEL.includes("DEMO / PAPER"));
  assert.ok(PAPER_ENVIRONMENT_LABEL.includes("no real funds"));
});

test("discovery-driven mapping: place args from the discovered contract; ticker action found", () => {
  const contract = {
    tool: "order", action: "place",
    fields: { symbol: "string", side: "string", orderType: "string", size: "string" },
  };
  const { args, unmatched } = mapPlaceArguments(contract, PLAN, { dryRun: true });
  assert.deepEqual(unmatched, []);
  assert.equal(args.action, "place");
  assert.equal(args.dryRun, true);
  assert.equal(args.symbol, "BTCUSDT");
  assert.equal(args.side, "buy");
  assert.equal(args.orderType, "market");
  assert.equal(args.size, "0.001");
  assert.equal(findTickerAction({ actions: [{ name: "ticker" }, { name: "candles" }] }), "ticker");
  assert.equal(findTickerAction({ actions: [{ name: "unknown" }] }), null);
});

test("seven-step paper verification WITHOUT human confirmation: stops at the boundary, no order placed", async () => {
  const { client, transport } = await connectFixture({
    ...DEMO_ENV, PATH: process.env.PATH,
  });
  try {
    const report = await runPaperVerification({
      client,
      proposedAction: PLAN,
      executionConfirmedByHuman: false, // the default: no human confirmation
      callTimeoutMs: 10_000,
    });

    assert.equal(report.runLabel.includes("DEMO / PAPER"), true);
    assert.equal(report.credentialSeparation.demoOnlyChildEnv, true);
    assert.equal(report.credentialSeparation.productionNamespaceForwarded, false);
    assert.equal(report.steps.length, 7);

    const byId = Object.fromEntries(report.steps.map((s) => [s.id, s]));
    assert.equal(byId[1].status, "PASS", "connection");
    assert.equal(byId[2].status, "PASS", "market read");
    assert.equal(byId[3].status, "PASS", "proposed action");
    assert.ok(byId[3].detail.includes("demo cap"), "proposed action shows the demo notional cap");
    assert.equal(byId[4].status, "PASS", "dry-run preview");
    assert.ok(byId[4].detail.includes("without placing an order"));
    assert.equal(byId[5].status, "REFUSED", "confirmation boundary without human consent");
    assert.equal(byId[6].status, "SKIPPED", "paper execution skipped without consent");
    assert.equal(byId[7].status, "PASS", "paper account state still readable");

    // Cross-check through the protocol itself: the fixture account must be
    // UNCHANGED (no order was placed by the dry-run or the boundary stop):
    const account = JSON.parse(byId[7].data);
    assert.equal(account.demoTradingEnvironment, true);
    assert.equal(account.balances[0].available, 10000, "paper USDT balance untouched");
    assert.equal(account.paperOrders.length, 0, "no paper orders exist");

    // Every step labeled DEMO/PAPER:
    for (const s of report.steps) assert.equal(s.environment, "DEMO_PAPER");
    // JSON-serializable (log-safe):
    assert.deepEqual(JSON.parse(JSON.stringify(report)), report);
  } finally {
    await client.close().catch(() => {});
    transport.close().catch(() => {});
  }
});

test("seven-step paper verification WITH explicit human confirmation: paper order placed and account reflects it", async () => {
  const { client, transport } = await connectFixture({
    ...DEMO_ENV, PATH: process.env.PATH,
  });
  try {
    const report = await runPaperVerification({
      client,
      proposedAction: PLAN,
      executionConfirmedByHuman: true, // the human explicitly chose paper execution
      callTimeoutMs: 10_000,
    });
    const byId = Object.fromEntries(report.steps.map((s) => [s.id, s]));
    assert.equal(byId[5].status, "PASS", "boundary crossed only by explicit confirmation");
    assert.equal(byId[6].status, "PASS", "paper execution ran in the DEMO environment");
    assert.ok(byId[6].data.includes("PAPER-"), "an order id exists in the demo environment");
    assert.ok(byId[6].data.includes("demoTradingEnvironment"), "execution result labeled demo");
    assert.equal(byId[7].status, "PASS", "resulting paper account state");

    // The paper account REFLECTS the executed order:
    const account = JSON.parse(byId[7].data);
    assert.equal(account.balances[0].available, 10000 - 0.001 * 40000, "paper USDT reduced by the fill");
    assert.equal(account.paperOrders.length, 1);
    assert.equal(account.paperOrders[0].demo, true);

    // Proposed action context preserved:
    assert.equal(report.proposedAction.symbol, "BTCUSDT");
    assert.equal(report.proposedAction.size, "0.001");
  } finally {
    await client.close().catch(() => {});
    transport.close().catch(() => {});
  }
});

test("fixture honors the official high-risk gate (confirmationRequired without confirm)", async () => {
  const { client, transport } = await connectFixture({ ...DEMO_ENV, PATH: process.env.PATH });
  try {
    const res = await client.callTool({ name: "order", arguments: { action: "cancelAll" } });
    const text = res.content.find((c) => c.type === "text").text;
    assert.equal(JSON.parse(text).confirmationRequired, true, "high-risk op gated exactly as the official docs state");
  } finally {
    await client.close().catch(() => {});
    transport.close().catch(() => {});
  }
});

test("app isolation: no app surface imports the paper-trading module (no live trading functionality)", () => {
  const roots = [
    path.join(__dirname, "..", "src", "app"),
    path.join(__dirname, "..", "src", "services"),
    path.join(__dirname, "..", "src", "core"),
    path.join(__dirname, "..", "src", "components"),
  ];
  const offenders = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx|js|jsx)$/.test(e.name)) {
        const src = fs.readFileSync(p, "utf8");
        if (/paperTrading|verify-paper-trading/.test(src)) offenders.push(p);
      }
    }
  };
  for (const r of roots) walk(r);
  assert.deepEqual(offenders, [], "the paper-trading harness must never be reachable from the app");
});

test("script exists and gates on demo credentials before spawning anything", () => {
  const script = fs.readFileSync(
    path.join(__dirname, "..", "src", "scripts", "verify-paper-trading.ts"),
    "utf8",
  );
  assert.ok(script.includes("OFFICIAL_MCP_LAUNCH"), "script uses the hardcoded official launch");
  assert.ok(script.includes("mapDemoCredentials"), "script gates on the demo credential mapping");
  assert.ok(script.includes("--confirm-execution"), "explicit human confirmation flag wired");
  assert.ok(script.includes("SETUP PROCEDURE"), "documented setup procedure on refusal");
  // The script never reads production variables:
  assert.ok(!/env\.BITGET_API_KEY|env\.BITGET_SECRET_KEY|env\.BITGET_PASSPHRASE/.test(script));
});
