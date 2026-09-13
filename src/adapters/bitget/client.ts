import { httpGetJson } from "../network/http";
import type { BitgetResponse, BitgetRealityCalendar, NormalizedBitgetTicker, RawBitgetTickerItem } from "./types";

const DEFAULT_BITGET_BASE_URL = process.env.BITGET_API_BASE_URL || "https://api.bitget.com";

export function parseBitgetTicker(item: RawBitgetTickerItem, sourceName = "Bitget Public Market API"): NormalizedBitgetTicker {
  const lastPrice = parseFloat(item.lastPrice);
  if (!Number.isFinite(lastPrice) || lastPrice <= 0) {
    throw new Error(`Invalid lastPrice from Bitget for ${item.symbol}: ${item.lastPrice}`);
  }

  const bid = item.bid1Price && item.bid1Price !== "" ? parseFloat(item.bid1Price) : null;
  const ask = item.ask1Price && item.ask1Price !== "" ? parseFloat(item.ask1Price) : null;
  const bidSize = item.bid1Size && item.bid1Size !== "" ? parseFloat(item.bid1Size) : null;
  const askSize = item.ask1Size && item.ask1Size !== "" ? parseFloat(item.ask1Size) : null;
  const volume24h = item.volume24h && item.volume24h !== "" ? parseFloat(item.volume24h) : null;
  const price24hPcnt = item.price24hPcnt && item.price24hPcnt !== "" ? parseFloat(item.price24hPcnt) : null;

  const tsMs = parseInt(item.ts, 10);
  const observedAt = Number.isFinite(tsMs) && tsMs > 0 ? new Date(tsMs).toISOString() : new Date().toISOString();

  return {
    symbol: item.symbol,
    lastPrice,
    bid: bid !== null && Number.isFinite(bid) && bid > 0 ? bid : null,
    ask: ask !== null && Number.isFinite(ask) && ask > 0 ? ask : null,
    bidSize: bidSize !== null && Number.isFinite(bidSize) && bidSize >= 0 ? bidSize : null,
    askSize: askSize !== null && Number.isFinite(askSize) && askSize >= 0 ? askSize : null,
    volume24h: volume24h !== null && Number.isFinite(volume24h) ? volume24h : null,
    price24hPcnt: price24hPcnt !== null && Number.isFinite(price24hPcnt) ? price24hPcnt : null,
    observedAt,
    source: sourceName
  };
}

export class BitgetClient {
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_BITGET_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async getSpotTicker(symbol: string): Promise<NormalizedBitgetTicker> {
    const url = `${this.baseUrl}/api/v3/market/tickers?category=SPOT&symbol=${encodeURIComponent(symbol)}`;
    const res = await httpGetJson<BitgetResponse<RawBitgetTickerItem[]>>(url);

    if (res.code !== "00000" || !Array.isArray(res.data) || res.data.length === 0) {
      throw new Error(`Bitget ticker request for ${symbol} failed: ${res.msg || `code ${res.code}`}`);
    }

    return parseBitgetTicker(res.data[0]);
  }

  async getRealityCalendar(): Promise<BitgetRealityCalendar | null> {
    try {
      const url = `${this.baseUrl}/api/v3/reality/market/calendar`;
      const res = await httpGetJson<BitgetResponse<BitgetRealityCalendar>>(url);
      if (res.code === "00000" && res.data) {
        return res.data;
      }
      return null;
    } catch {
      return null;
    }
  }
}


