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
  workingPrice = 219.22,
  workingPriceTimestamp: string = new Date().toISOString()
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
  let assetClarificationRequired = false;
  
  const genericRTokenMatch = text.match(/\b(r[A-Z]{2,10})(?:USDT)?\b/i);
  
  if (genericRTokenMatch) {
    // e.g. rNVDA, rAAPL, rTSLA
    asset = genericRTokenMatch[1].toUpperCase();
    if (asset === "RNVDA") asset = "rNVDA"; // keep preferred casing
    else asset = "r" + asset.substring(1);
    userProvided.push("asset");
  } else if (/\bnvda\b/i.test(text)) {
    assetClarificationRequired = true;
  }

  // 3. Position size extraction ($2,000 or 2000 usd or $2k)
  let positionSizeUsd: number | null = null;
  
  const textToNum: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };
  const grandMatch = text.match(/(one|two|three|four|five|six|seven|eight|nine|ten)\s+grand\b/i);

  const sizeMatch = text.match(/(-?)\s*\$\s*([\d,]+(?:\.\d+)?)\s*(k|m)?/i) ||
    text.match(/(-?)\s*([\d,]+(?:\.\d+)?)\s*(?:usd|dollars|usdt)\b/i);

  if (grandMatch) {
    positionSizeUsd = textToNum[grandMatch[1].toLowerCase()] * 1000;
    userProvided.push("positionSizeUsd");
  } else if (sizeMatch) {
    const isNegative = sizeMatch[1] === "-";
    const rawNum = parseFloat(sizeMatch[2].replace(/,/g, ""));
    const multiplierStr = sizeMatch[3] || "";
    const multiplier = multiplierStr.toLowerCase() === "k" ? 1000 : (multiplierStr.toLowerCase() === "m" ? 1000000 : 1);
    if (Number.isFinite(rawNum)) {
      positionSizeUsd = (isNegative ? -rawNum : rawNum) * multiplier;
      if (positionSizeUsd > 0) {
        userProvided.push("positionSizeUsd");
      }
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

  // 4.5. Price extraction
  let explicitPrice: number | null = null;
  let priceClarificationRequired = false;
  const priceMatch = text.match(/(?:at|@)\s*\$?(-?[\d,]+(?:\.\d+)?)/i);
  if (priceMatch) {
     explicitPrice = parseFloat(priceMatch[1].replace(/,/g, ""));
     if (explicitPrice <= 0 || isNaN(explicitPrice)) {
        priceClarificationRequired = true;
     } else {
        userProvided.push("entryPrice");
     }
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

  // 6. Existing exposure extraction (e.g. "already have BTC exposure" or "have $10,000 in ETH")
  const relevantExposure: ExistingExposure[] = [];
  
  const exposureMatch = text.match(/\b(?:already have|holding|have|hold|exposure to)\s+(?:a\s+)?(?:\$?([\d,]+(?:\.\d+)?)\s*(k|m)?\s*(?:usd|dollars|usdt)?\s*(?:of|in)?\s+)?([A-Za-z]{2,8})\b/i) || text.match(/\b([A-Za-z]{2,8})\s+exposure\b/i);

  if (exposureMatch) {
    let val = 5000; // default estimated exposure if not specified
    let expAsset = "BTC"; // default fallback

    if (exposureMatch[3]) { 
       const amountMatch = exposureMatch[1];
       const multMatch = exposureMatch[2];
       expAsset = exposureMatch[3].toUpperCase();
       
       if (amountMatch) {
         const parsed = parseFloat(amountMatch.replace(/,/g, ""));
         if (Number.isFinite(parsed) && parsed > 0) {
           val = parsed * (multMatch?.toLowerCase() === "m" ? 1000000 : (multMatch?.toLowerCase() === "k" ? 1000 : 1));
         }
       }
    } else if (exposureMatch[1]) {
       expAsset = exposureMatch[1].toUpperCase();
    }

    const commonWords = ["A", "THE", "SOME", "THIS", "THAT", "LONG", "SHORT", "POSITION", "TRADE", "MONEY", "CASH", "USD", "USDT"];
    if (!commonWords.includes(expAsset) && expAsset !== asset?.toUpperCase()) {
      relevantExposure.push({
        asset: expAsset,
        direction: "LONG",
        valueUsd: val
      });
      userProvided.push("relevantExposure");
    }
  }

  // Check required fields and determine if clarification is required
  let requiresClarification = false;
  let clarificationField: string | null = null;
  let clarificationQuestion: string | null = null;

  if (assetClarificationRequired || !asset) {
    requiresClarification = true;
    clarificationField = "asset";
    clarificationQuestion = assetClarificationRequired 
      ? "Did you mean rNVDA (the tokenized NVIDIA asset available on Bitget)?" 
      : "Which asset are you planning to trade? (e.g., rNVDA, rAAPL, rTSLA).";
  } else if (!direction) {
    requiresClarification = true;
    clarificationField = "direction";
    clarificationQuestion = "Are you planning to buy (LONG) or sell (SHORT) this position?";
  } else if (priceClarificationRequired) {
    requiresClarification = true;
    clarificationField = "entryPrice";
    clarificationQuestion = "The specified entry price is invalid. Please provide a positive number.";
  } else if (positionSizeUsd === null || positionSizeUsd <= 0) {
    requiresClarification = true;
    clarificationField = "positionSizeUsd";
    clarificationQuestion = "What position size (in USD) are you proposing to allocate? Please provide a valid positive number.";
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
    const referenceAsset = asset.startsWith("r") && asset.length > 1 ? asset.substring(1).toUpperCase() : undefined;
    const entryPrice = explicitPrice !== null ? explicitPrice : (workingPrice > 0 ? workingPrice : 120);
    const quantity = calculatePositionQuantity(positionSizeUsd, entryPrice);

    derived.push("canonicalSymbol");
    derived.push("referenceAsset");
    
    if (explicitPrice === null) {
       derived.push("entryPrice (system-derived from market observation)");
    }
    derived.push("quantity (calculated from position size and entry price)");

    normalizedTrade = {
      asset,
      canonicalSymbol,
      instrumentType: asset.startsWith("r") ? "TOKENIZED_EQUITY" : "CRYPTO",
      direction,
      positionSizeUsd,
      entryPrice,
      quantity,
      entryPriceSource: explicitPrice !== null ? "USER_PROVIDED" : "SYSTEM_DERIVED",
      entryBasisTimestamp: explicitPrice === null ? workingPriceTimestamp : undefined,
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


