import { httpGetJson } from "../network/http";
import type { ReferencePriceProvider, ReferencePriceQuote } from "./types";

interface YahooChartMeta {
  currency?: string;
  symbol?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketTime?: number;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: YahooChartMeta;
    }>;
    error?: unknown;
  };
}

const TRUSTED_YAHOO_ORIGINS = new Set([
  "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com"
]);

export class YahooReferenceProvider implements ReferencePriceProvider {
  private baseUrl: string;

  constructor(baseUrl = "https://query1.finance.yahoo.com") {
    const cleanUrl = baseUrl.replace(/\/$/, "");
    if (!TRUSTED_YAHOO_ORIGINS.has(cleanUrl)) {
      console.warn(`Untrusted Yahoo base URL: ${cleanUrl}. Falling back to default.`);
      this.baseUrl = "https://query1.finance.yahoo.com";
    } else {
      this.baseUrl = cleanUrl;
    }
  }

  async getReferencePrice(symbol: string): Promise<ReferencePriceQuote> {
    const url = `${this.baseUrl}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await httpGetJson<YahooChartResponse>(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    const result = res.chart?.result?.[0];
    if (!result?.meta) {
      throw new Error(`Yahoo Finance returned invalid chart payload for ${symbol}`);
    }

    const price = result.meta.regularMarketPrice ?? result.meta.previousClose;
    if (!price || !Number.isFinite(price) || price <= 0) {
      throw new Error(`Invalid price for ${symbol} from Yahoo Finance: ${price}`);
    }

    const previousClose = result.meta.chartPreviousClose ?? result.meta.previousClose;
    const timeSec = result.meta.regularMarketTime;
    
    if (!timeSec || !Number.isFinite(timeSec)) {
      throw new Error(`Missing regularMarketTime for ${symbol} from Yahoo Finance`);
    }

    const observedAt = new Date(timeSec * 1000).toISOString();

    return {
      symbol,
      price,
      previousClose: previousClose && Number.isFinite(previousClose) ? previousClose : undefined,
      observedAt,
      source: "Yahoo Finance Reference Quote"
    };
  }
}



