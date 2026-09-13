import type { ExistingExposure, NormalizedTrade, TradeDirection, TradeIdea } from "../../domain/trade/types";
import { calculatePositionQuantity } from "../calculations/financial";

export interface ParsedTradeResult {
  tradeIdea: TradeIdea;
  normalizedTrade: NormalizedTrade | null;
  requiresClarification: boolean;
  clarificationField: string | null;
  clarificationQuestion: string | null;
  userProvidedFields: string[];
  inferredFields: string[];
  derivedFields: string[];
}

export function parseNaturalLanguageTrade(
  input: string,
  workingPrice = 219.22
): ParsedTradeResult {
  const text = input.trim();
  const userProvided: string[] = [];
  const inferred: string[] = [];
  const derived: string[] = [];

  // 1. Direction extraction
  let direction: TradeDirection | null = null;
  if (/\b(buy|buying|long|longing|go long)\b/i.test(text)) {
    direction = "LONG";
    userProvided.push("direction");
  } else if (/\b(sell|selling|short|shorting|go short)\b/i.test(text)) {
    direction = "SHORT";
    userProvided.push("direction");
  }

  // 2. Asset extraction
  let asset: string | null = null;
  if (/\b(rnvda|rnvdausdt)\b/i.test(text)) {
    asset = "rNVDA";
    userProvided.push("asset");
  } else if (/\bnvda\b/i.test(text)) {
    asset = "rNVDA";
    inferred.push("asset (mapped NVDA to Bitget rNVDA token)");
  } else if (/\bbtc\b/i.test(text) && !/\b(rnvda|nvda)\b/i.test(text)) {
    asset = "BTC";
    userProvided.push("asset");
  }

  // 3. Position size extraction ($2,000 or 2000 usd or $2k)
  let positionSizeUsd: number | null = null;
  const sizeMatch = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(k|m)?/i) ||
    text.match(/([\d,]+(?:\.\d+)?)\s*(?:usd|dollars|usdt)\b/i);

  if (sizeMatch) {
    const rawNum = parseFloat(sizeMatch[1].replace(/,/g, ""));
    const multiplier = sizeMatch[2]?.toLowerCase() === "k" ? 1000 : (sizeMatch[2]?.toLowerCase() === "m" ? 1000000 : 1);
    if (Number.isFinite(rawNum) && rawNum > 0) {
      positionSizeUsd = rawNum * multiplier;
      userProvided.push("positionSizeUsd");
    }
  }

  // 4. Thesis extraction
  let thesis = "";
  const becauseMatch = text.match(/\b(?:because|since|as|thesis is|expecting|thinking|believing)\s+(.+?)(?:\.|\b(?:stress-test|stress test|before Monday|already have|my exposure)\b|$)/i);
  if (becauseMatch) {
    thesis = becauseMatch[1].trim();
    userProvided.push("thesis");
  } else if (text.length > 20) {
    // If no explicit 'because' but trader wrote a paragraph
    thesis = text;
    inferred.push("thesis");
  }

  // 5. Time horizon extraction
  let timeHorizon: string | undefined;
  if (/\bbefore monday\b/i.test(text)) {
    timeHorizon = "Before Monday (off-hours / weekend holding window)";
    userProvided.push("timeHorizon");
  } else if (/\bweekend\b/i.test(text)) {
    timeHorizon = "Weekend holding";
    userProvided.push("timeHorizon");
  } else if (/\bintraday|day trade\b/i.test(text)) {
    timeHorizon = "Intraday";
    userProvided.push("timeHorizon");
  }

  // 6. Existing exposure extraction (e.g. "already have BTC exposure" or "have $10,000 in BTC")
  const relevantExposure: ExistingExposure[] = [];
  if (/\b(?:already have|holding|have|hold|exposure to)\s+(?:a\s+)?(?:([\d,]+(?:\.\d+)?)\s*(?:usd|dollars|usdt|\$)?\s+of\s+)?btc\b/i.test(text) || /\bbtc exposure\b/i.test(text)) {
    const btcAmountMatch = text.match(/\$?([\d,]+(?:\.\d+)?)\s*(k)?\s*(?:of\s+)?btc/i);
    let val = 5000; // default estimated exposure if not specified
    if (btcAmountMatch) {
      const parsed = parseFloat(btcAmountMatch[1].replace(/,/g, ""));
      if (Number.isFinite(parsed) && parsed > 0) {
        val = parsed * (btcAmountMatch[2]?.toLowerCase() === "k" ? 1000 : 1);
      }
    }
    relevantExposure.push({
      asset: "BTC",
      direction: "LONG",
      valueUsd: val
    });
    userProvided.push("relevantExposure");
  }

  // Check required fields and determine if clarification is required
  let requiresClarification = false;
  let clarificationField: string | null = null;
  let clarificationQuestion: string | null = null;

  if (!asset) {
    requiresClarification = true;
    clarificationField = "asset";
    clarificationQuestion = "Which asset are you planning to trade? (The MVP supports rNVDA tokenized NVIDIA).";
  } else if (!direction) {
    requiresClarification = true;
    clarificationField = "direction";
    clarificationQuestion = "Are you planning to buy (LONG) or sell (SHORT) this position?";
  } else if (!positionSizeUsd || positionSizeUsd <= 0) {
    requiresClarification = true;
    clarificationField = "positionSizeUsd";
    clarificationQuestion = "What position size (in USD) are you proposing to allocate?";
  } else if (!thesis || thesis.length < 5) {
    requiresClarification = true;
    clarificationField = "thesis";
    clarificationQuestion = "What is your underlying thesis or catalyst for entering this trade?";
  }

  const tradeIdea: TradeIdea = {
    asset: asset || "rNVDA",
    direction: direction || "LONG",
    positionSizeUsd: positionSizeUsd || 0,
    thesis: thesis || "",
    timeHorizon,
    existingExposure: relevantExposure.length > 0 ? relevantExposure : undefined
  };

  let normalizedTrade: NormalizedTrade | null = null;
  if (!requiresClarification && asset && direction && positionSizeUsd && positionSizeUsd > 0) {
    const canonicalSymbol = asset === "rNVDA" ? "rNVDAUSDT" : `${asset}USDT`;
    const referenceAsset = asset === "rNVDA" ? "NVDA" : undefined;
    const entryPrice = workingPrice > 0 ? workingPrice : 120;
    const quantity = calculatePositionQuantity(positionSizeUsd, entryPrice);

    derived.push("canonicalSymbol");
    derived.push("referenceAsset");
    derived.push("entryPrice (from market observation)");
    derived.push("quantity (calculated from position size and entry price)");

    normalizedTrade = {
      asset,
      canonicalSymbol,
      instrumentType: asset.startsWith("r") ? "TOKENIZED_EQUITY" : "CRYPTO",
      direction,
      positionSizeUsd,
      entryPrice,
      quantity,
      referenceAsset,
      timeHorizon,
      thesis,
      userAssumptions: [],
      relevantExposure
    };
  }

  return {
    tradeIdea,
    normalizedTrade,
    requiresClarification,
    clarificationField,
    clarificationQuestion,
    userProvidedFields: userProvided,
    inferredFields: inferred,
    derivedFields: derived
  };
}
