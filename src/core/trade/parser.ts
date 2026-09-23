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
  workingPrice = 0,
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

  // Case matters: real r-tokens are camelCase (rNVDA, rAAPL) — a case-
  // insensitive r[A-Za-z]+ rule would swallow ordinary words like "risk"
  // or "return" as fake tickers. Match the rNVDA literal permissively and
  // require an UPPERCASE ticker for the generic r-token rule.
  const rnvdaLiteralMatch = text.match(/\brNVDA(?:USDT)?\b/i);
  const genericRTokenMatch = text.match(/\br([A-Z]{2,10})(?:USDT)?\b/);

  if (rnvdaLiteralMatch) {
    asset = "rNVDA";
    userProvided.push("asset");
  } else if (genericRTokenMatch) {
    // e.g. rAAPL, rTSLA
    const ticker = genericRTokenMatch[1];
    asset = ticker.toUpperCase() === "NVDA" ? "rNVDA" : "r" + ticker;
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
  // Causal connectors carry the trader's actual reasoning. Soft intent markers
  // ("I'm thinking about buying X because Y") often appear far earlier in the
  // sentence, so they must never take priority over a causal clause — otherwise
  // the thesis truncates to the intent fragment and loses the reasoning.
  const terminator = "(?:\\.|$|\\b(?:stress-test|stress test|before Monday|already have|my exposure)\\b)";
  let thesis = "";
  const causalMatch = text.match(new RegExp("\\b(?:because|since|thesis is|my thesis is)\\s+(.+?)" + terminator, "i"));
  const softMatch = text.match(new RegExp("\\b(?:expecting|thinking|believing)\\s+(.+?)" + terminator, "i"));
  const thesisMatch = causalMatch ?? softMatch;
  if (thesisMatch) {
    thesis = thesisMatch[1].trim();
    userProvided.push("thesis");
  } else if (text.length > 20) {
    // If no explicit 'because' but trader wrote a paragraph
    thesis = text;
    inferred.push("thesis");
  }

  // 4.5. Price extraction (must strictly distinguish prices from execution times like 'at 11:30 ET' and percentages like 'at 0.03%')
  let explicitPrice: number | null = null;
  let priceClarificationRequired = false;

  // 1. Explicit dollar sign: at $350, @ $350, entry price $350
  const explicitDollarMatch = text.match(/(?:at|@|entry(?:\s*price)?|price(?:\s*of)?)\s*\$\s*([\d,]+(?:\.\d+)?)(?!\s*[%])/i);
  // 2. Explicit currency/unit: at 350 usd, @ 350 per token, price 350 dollars
  const explicitCurrencyMatch = text.match(/(?:at|@|entry(?:\s*price)?|price(?:\s*of)?)\s*([\d,]+(?:\.\d+)?)\s*(?:usd|dollars|usdt|per\s+(?:share|token))\b/i);
  // 3. Explicit "entry price X" or "at price X" without %, without timestamp colon
  const priceKeywordMatch = text.match(/(?:entry\s*price|at\s*price|price\s*of)\s*(?:is|at|@)?\s*([\d,]+(?:\.\d+)?)(?!\s*(?:%|percent|bps|:\d))/i);
  // 4. Plain numeric at/price: at 130.50, @ -50 (excluding times like 11:30 and percentages like 0.03%)
  const plainAtMatch = text.match(/(?:at|@)\s*(-?[\d,]+(?:\.\d+)?)(?!\s*(?:%|percent|bps|:\d|\s*(?:am|pm|et|est|edt|utc|gmt)\b))/i);

  const matchedPriceStr = explicitDollarMatch?.[1] ?? explicitCurrencyMatch?.[1] ?? priceKeywordMatch?.[1] ?? plainAtMatch?.[1];

  if (matchedPriceStr) {
     explicitPrice = parseFloat(matchedPriceStr.replace(/,/g, ""));
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
  } else if (/\b(?:active\s+)?nasdaq\s+session\b/i.test(text)) {
    timeHorizon = "Active NASDAQ session";
    userProvided.push("timeHorizon");
  } else {
    const timeMatch = text.match(/\bat\s+(\d{1,2}:\d{2}(?:\s*(?:ET|EST|EDT|UTC|GMT|AM|PM))?)/i);
    if (timeMatch) {
      timeHorizon = `Session execution (${timeMatch[1]})`;
      userProvided.push("timeHorizon");
    }
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
  } else if (positionSizeUsd === null || positionSizeUsd < 0.01) {
    requiresClarification = true;
    clarificationField = "positionSizeUsd";
    clarificationQuestion = "What position size (in USD) are you proposing to allocate? Please provide a valid positive amount of at least $0.01 USD.";
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
    const entryPrice = explicitPrice !== null ? explicitPrice : (workingPrice > 0 ? workingPrice : 0);
    const quantity = entryPrice > 0 ? calculatePositionQuantity(positionSizeUsd, entryPrice) : 0;

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


