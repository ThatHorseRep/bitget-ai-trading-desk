export type TradeDirection = "LONG" | "SHORT";
export type InstrumentType = "TOKENIZED_EQUITY" | "CRYPTO" | "UNSUPPORTED";

export interface ExistingExposure {
  asset: string;
  direction: TradeDirection;
  valueUsd: number;
}

export interface TradeIdea {
  asset: string;
  direction: TradeDirection;
  positionSizeUsd: number;
  thesis: string;
  entryPrice?: number;
  timeHorizon?: string;
  existingExposure?: ExistingExposure[];
  assumptions?: string[];
}

export interface NormalizedTrade {
  asset: string;
  canonicalSymbol: string;
  instrumentType: InstrumentType;
  direction: TradeDirection;
  positionSizeUsd: number;
  entryPrice: number;
  quantity: number;
  referenceAsset?: string;
  timeHorizon?: string;
  thesis: string;
  userAssumptions: string[];
  relevantExposure: ExistingExposure[];
}
