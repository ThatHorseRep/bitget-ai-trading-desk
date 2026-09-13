import type { MarketState } from "../../domain/market/types";
import type { TradeIdea, NormalizedTrade } from "../../domain/trade/types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function validateTradeIdea(input: TradeIdea): ValidationResult {
  const errors: string[] = [];
  if (!input.asset.trim()) errors.push("asset is required");
  if (input.direction !== "LONG" && input.direction !== "SHORT") errors.push("direction is invalid");
  if (!isFiniteNumber(input.positionSizeUsd) || input.positionSizeUsd <= 0) errors.push("positionSizeUsd must be greater than zero");
  if (!input.thesis.trim()) errors.push("thesis is required");
  if (input.entryPrice !== undefined && (!isFiniteNumber(input.entryPrice) || input.entryPrice <= 0)) errors.push("entryPrice must be greater than zero when provided");
  return { valid: errors.length === 0, errors };
}

export function validateNormalizedTrade(input: NormalizedTrade): ValidationResult {
  const base = validateTradeIdea(input);
  const errors = [...base.errors];
  if (!input.canonicalSymbol.trim()) errors.push("canonicalSymbol is required");
  if (!Number.isFinite(input.entryPrice) || input.entryPrice <= 0) errors.push("normalized entryPrice must be greater than zero");
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) errors.push("quantity must be greater than zero");
  return { valid: errors.length === 0, errors };
}

export function validateMarketState(state: MarketState): ValidationResult {
  const errors: string[] = [];
  if (!isFiniteNumber(state.instrumentPrice) || state.instrumentPrice <= 0) errors.push("instrumentPrice must be greater than zero");
  if (!Number.isFinite(Date.parse(state.observedAt))) errors.push("observedAt is invalid");
  if (state.bid !== null && state.bid <= 0) errors.push("bid must be positive when provided");
  if (state.ask !== null && state.ask <= 0) errors.push("ask must be positive when provided");
  if (state.bid !== null && state.ask !== null && state.bid > state.ask) errors.push("bid cannot exceed ask");
  if (state.referencePrice !== null && state.referencePrice <= 0) errors.push("referencePrice must be positive when provided");
  if (state.btcPrice !== null && state.btcPrice <= 0) errors.push("btcPrice must be positive when provided");
  return { valid: errors.length === 0, errors };
}


