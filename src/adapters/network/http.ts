import https from "node:https";
import http from "node:http";
import dns from "node:dns";
import { Resolver } from "node:dns/promises";

const fallbackResolver = new Resolver();
fallbackResolver.setServers(["8.8.8.8", "1.1.1.1"]);

// Custom lookup function that tries system DNS first, falling back to 8.8.8.8 / 1.1.1.1
// Custom lookup function that tries system DNS first, falling back to 8.8.8.8 / 1.1.1.1
const robustLookup = (
  hostname: string,
  options: dns.LookupOptions | ((err: NodeJS.ErrnoException | null, address: string, family: number) => void),
  callback?: (err: NodeJS.ErrnoException | null, address: any, family?: number) => void
): void => {
  const cb = (typeof options === "function" ? options : callback) as (
    err: Error | null,
    address?: any,
    family?: number
  ) => void;
  const opts = (typeof options === "function" ? {} : options) as dns.LookupOptions;

  dns.lookup(hostname, opts as any, (err, address, family) => {
    if (!err && address) {
      if (opts.all) {
        cb(null, address);
      } else {
        cb(null, address, family || 4);
      }
      return;
    }

    // Fall back to direct public DNS (8.8.8.8 / 1.1.1.1)
    fallbackResolver.resolve4(hostname)
      .then((ips) => {
        if (!ips || ips.length === 0) {
          cb(new Error(`No IP addresses found for ${hostname}`), "", 4);
          return;
        }
        if (opts.all) {
          cb(null, ips.map((ip) => ({ address: ip, family: 4 })));
        } else {
          cb(null, ips[0], 4);
        }
      })
      .catch((fallbackErr) => {
        cb(fallbackErr, "", 4);
      });
  });
};

const httpsAgent = new https.Agent({
  keepAlive: true,
  timeout: 10000,
  lookup: robustLookup
});

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  agent?: boolean;
}

export async function httpGetJson<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  const parsedUrl = new URL(url);
  const headers = {
    "User-Agent": "BitgetTradingDesk/1.0",
    "Accept": "application/json",
    ...options.headers
  };

  const timeoutMs = options.timeoutMs ?? 10000;

  return new Promise<T>((resolve, reject) => {
    const isHttps = parsedUrl.protocol === "https:";
    const transport = isHttps ? https : http;
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: "GET",
      headers,
      agent: isHttps ? httpsAgent : undefined,
      timeout: timeoutMs
    };

    const req = transport.request(reqOptions, (res) => {
      let body = "";
      res.setEncoding("utf8");

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP GET ${url} failed with status ${res.statusCode}: ${body.slice(0, 200)}`));
          return;
        }

        try {
          const parsed = JSON.parse(body) as T;
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse JSON response from ${url}: ${(e as Error).message}. Body: ${body.slice(0, 100)}`));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`HTTP GET ${url} timed out after ${timeoutMs}ms`));
    });

    req.on("error", (err) => {
      reject(new Error(`HTTP GET ${url} network error: ${err.message}`));
    });

    req.end();
  });
}


