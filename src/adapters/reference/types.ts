import type { SessionStatus } from "../../domain/market/types";

export interface ReferencePriceQuote {
  symbol: string;
  price: number;
  previousClose?: number;
  observedAt: string;
  sessionStatus?: SessionStatus;
  source: string;
}

export interface ReferencePriceProvider {
  getReferencePrice(symbol: string): Promise<ReferencePriceQuote>;
}


