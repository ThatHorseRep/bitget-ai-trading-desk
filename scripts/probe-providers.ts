/**
 * Standalone Connectivity Probe for Bitget AI RedTeam Desk
 *
 * Command to run:
 *   npx ts-node scripts/probe-providers.ts
 *
 * NOTE: This is an independent check and must NOT import anything from src/adapters.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { performance } from "node:perf_hooks";

export interface ProbeTarget {
  provider: string;
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  description: string;
}

export interface ProbeResult {
  provider: string;
  url: string;
  status: number | string;
  latencyMs: number;
  byteSize: number;
  bodySnippet: string;
  error?: string;
  errorType?: "DNS" | "TLS" | "TIMEOUT" | "HTTP_ERROR" | "NETWORK";
}

const TARGETS: ProbeTarget[] = [
  {
    provider: "Bitget Public Spot Ticker",
    url: "https://api.bitget.com/api/v3/market/tickers?category=SPOT&symbol=BTCUSDT",
    description: "Bitget v3 market tickers endpoint used for spot and tokenized asset pricing",
  },
  {
    provider: "Bitget Public Spot Instrument",
    url: "https://api.bitget.com/api/v3/market/instruments?category=SPOT&symbol=BTCUSDT",
    description: "Bitget v3 market instruments metadata endpoint",
  },
  {
    provider: "Bitget Public Market Candles (Kline)",
    url: "https://api.bitget.com/api/v2/spot/market/candles?symbol=BTCUSDT&granularity=1day&limit=5",
    description: "Bitget v2 public market candles/kline endpoint for historical bars",
  },
  {
    provider: "Bitget Reality Calendar",
    url: "https://api.bitget.com/api/v3/reality/market/calendar",
    description: "Bitget v3 reality market calendar for trading session hours",
  },
  {
    provider: "Yahoo Finance Chart (Query1)",
    url: "https://query1.finance.yahoo.com/v8/finance/chart/NVDA?range=5d&interval=1d",
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    description: "Yahoo Finance primary reference equity price and chart feed",
  },
  {
    provider: "Yahoo Finance Chart (Query2 Fallback)",
    url: "https://query2.finance.yahoo.com/v8/finance/chart/NVDA?range=5d&interval=1d",
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    description: "Yahoo Finance secondary reference equity price feed",
  },
  {
    provider: "Yahoo Finance Search (News/Evidence)",
    url: "https://query1.finance.yahoo.com/v1/finance/search?q=NVDA&quotesCount=5&newsCount=5",
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    description: "Yahoo Finance search API for ticker news and evidence arbitration",
  },
  {
    provider: "Bitget US Equity MCP Gateway",
    url: "https://agent.bitget.com/mcp",
    description: "Bitget Agent Hub MCP HTTP endpoint (researched in src/adapters)",
  },
  {
    provider: "Bitget Signal DataHub MCP Gateway",
    url: "https://datahub.noxiaohao.com/mcp",
    description: "External partner market intelligence MCP endpoint",
  },
];

async function probeEndpoint(target: ProbeTarget): Promise<ProbeResult> {
  const timeoutMs = 10_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const res = await fetch(target.url, {
      method: target.method || "GET",
      headers: target.headers,
      body: target.body,
      signal: controller.signal,
    });

    const elapsed = Math.round(performance.now() - start);
    clearTimeout(timer);

    const text = await res.text();
    const byteSize = Buffer.byteLength(text, "utf8");
    const snippet = text.replace(/[\r\n\t]+/g, " ").slice(0, 200);

    return {
      provider: target.provider,
      url: target.url,
      status: res.status,
      latencyMs: elapsed,
      byteSize,
      bodySnippet: snippet,
    };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    clearTimeout(timer);

    let errorType: ProbeResult["errorType"] = "NETWORK";
    let message = String(err);

    if (err instanceof Error) {
      message = err.message;
      if (err.name === "AbortError" || message.includes("abort") || message.includes("timeout")) {
        errorType = "TIMEOUT";
      } else if (message.includes("ENOTFOUND") || message.includes("EAI_AGAIN")) {
        errorType = "DNS";
      } else if (message.includes("CERT_") || message.includes("TLS") || message.includes("SSL")) {
        errorType = "TLS";
      }
    }

    return {
      provider: target.provider,
      url: target.url,
      status: `ERR (${errorType})`,
      latencyMs: elapsed,
      byteSize: 0,
      bodySnippet: `Error: ${message.slice(0, 180)}`,
      error: message,
      errorType,
    };
  }
}

export async function runProbe(): Promise<void> {
  console.log("=================================================");
  console.log("Starting Standalone Connectivity Probe (10s timeout)");
  console.log(`Machine: ${os.hostname()} (${os.platform()} ${os.arch()}) Node: ${process.version}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log("=================================================\n");

  const results: ProbeResult[] = [];

  for (const target of TARGETS) {
    process.stdout.write(`Probing ${target.provider} ... `);
    const result = await probeEndpoint(target);
    results.push(result);
    console.log(`Status: ${result.status} | Latency: ${result.latencyMs}ms | Bytes: ${result.byteSize}`);
  }

  // Generate markdown report
  const runDate = new Date().toISOString();
  const machineInfo = `${os.hostname()} (${os.type()} ${os.release()} ${os.arch()}) | Node.js ${process.version}`;

  let markdown = `# External Connectivity Report\n\n`;
  markdown += `**Run Date:** ${runDate}  \n`;
  markdown += `**Machine:** \`${machineInfo}\`  \n`;
  markdown += `**Probe Timeout:** 10,000ms per endpoint  \n\n`;

  markdown += `## Connectivity Results\n\n`;
  markdown += `| Provider | Endpoint URL | HTTP Status | Latency (ms) | Bytes | First 200 Chars of Body |\n`;
  markdown += `|---|---|---|---|---|---|\n`;

  for (const r of results) {
    // Sanitize markdown pipes in snippet
    const sanitizedSnippet = r.bodySnippet.replace(/\|/g, "\\|");
    markdown += `| **${r.provider}** | \`${r.url}\` | \`${r.status}\` | ${r.latencyMs} | ${r.byteSize} | \`${sanitizedSnippet}\` |\n`;
  }

  markdown += `\n## Analysis & Findings\n\n`;
  for (const r of results) {
    markdown += `### ${r.provider}\n`;
    markdown += `- **URL**: \`${r.url}\`\n`;
    markdown += `- **Status**: \`${r.status}\`\n`;
    markdown += `- **Latency**: ${r.latencyMs}ms (${r.byteSize} bytes)\n`;
    if (r.error) {
      markdown += `- **Failure Analysis**: Type \`${r.errorType}\` - ${r.error}\n`;
    } else {
      markdown += `- **Health**: Reachable and responding.\n`;
    }
    markdown += `\n`;
  }

  const outputPath = path.resolve(process.cwd(), "docs/CONNECTIVITY_REPORT.md");
  fs.writeFileSync(outputPath, markdown, "utf8");
  console.log(`\nReport written to: ${outputPath}`);
}

// Allow direct CLI execution
runProbe().catch((err) => {
  console.error("Probe execution failed:", err);
  process.exit(1);
});

