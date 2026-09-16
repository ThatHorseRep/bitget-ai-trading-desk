export type LiquidityClass = "NORMAL" | "THIN" | "UNKNOWN";
export type SessionStatus = "REGULAR" | "OFF_HOURS" | "WEEKEND" | "HOLIDAY" | "UNKNOWN";
export type DataQualityStatus = "COMPLETE" | "DEGRADED" | "INVALID";

export interface SourceRef {
  id: string;
  name: string;
  url?: string;
  observedAt?: string;
  publishedAt?: string;
  retrievedAt?: string;
}

export interface MarketState {
  observedAt: string;
  instrumentPrice: number;
  bid: number | null;
  ask: number | null;
  bidSize: number | null;
  askSize: number | null;
  spread: number | null;
  spreadPct: number | null;
  referenceSymbol: string | null;
  referencePrice: number | null;
  referencePreviousClose: number | null;
  referenceObservedAt: string | null;
  referenceSourceName: string | null;
  basis: number | null;
  basisPct: number | null;
  btcPrice: number | null;
  btcObservedAt: string | null;
  sessionStatus: SessionStatus;
  tokenMarketStatus: "ACTIVE" | "INACTIVE" | "UNKNOWN";
  liquidityClass: LiquidityClass;
  dataQuality: DataQualityStatus;
  sources: SourceRef[];
  scenarioId?: string;
  isSynthetic?: boolean;
}


