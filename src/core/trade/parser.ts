import type { ExistingExposure, NormalizedTrade, TradeDirection, TradeIdea } from "../../domain/trade/types";
import { calculatePositionQuantity } from "../calculations/financial";
import { ASSET_RISK_PROFILES } from "../scenarios/config";

// The supported-asset source of truth is ASSET_RISK_PROFILES (every asset the
// deterministic stress engine can actually model). A parsed asset outside this
// set would dead-end at the market-state step, so the parser clarifies instead
// of accepting it silently. "DEFAULT" is a config fallback key, not an asset.
const KNOWN_R_TOKENS: string[] = Object.keys(ASSET_RISK_PROFILES).filter((a) => a !== "DEFAULT");

// Direction-contradiction detection: opposing directional language appearing
// alongside the resolved direction in the same input. Exact word matches keep
// this deterministic and reviewable; hedged phrasing that lacks an opposing
// keyword ("AI demand is weak", "could pull back") is thesis content, not a
// direction contradiction, and is left to the thesis/LLM layers.
const LONG_ONLY_WORDS = ["crash", "dump", "plunge", "plummet", "tank", "collapse", "bearish"];
const SHORT_ONLY_WORDS = ["moon", "moonshot", "surge", "rally", "rip", "pump", "bullish", "long"];

// "short squeeze" / "short interest" are bullish trading vocabulary, not a
// SHORT direction signal — excluded via negative lookahead (case-insensitive,
// whitespace allowed between the words). Bare "short" still matches.
const SHORT_OPPOSITE_RE = /\bshort(?!\s*(?:squeeze|interest))\b/;

function detectDirectionContradiction(text: string, resolved: TradeDirection): string[] {
  const lower = text.toLowerCase();
  if (resolved === "LONG") {
    const words = LONG_ONLY_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower));
    if (SHORT_OPPOSITE_RE.test(lower)) words.push("short");
    return words;
  }
  return SHORT_ONLY_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower));
}

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
  let unsupportedAssetQuestion: string | null = null;

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
  } else {
    // Full company names count as asset mentions ("I believe NVIDIA is...").
    // Bare tickers ("nvda") get a confirming clarification instead of a
    // silent mapping, since they may refer to the underlying, not the token.
    const companyAliases: Record<string, string> = {
      nvidia: "rNVDA",
      tesla: "rTSLA",
      microstrategy: "rMSTR",
      coinbase: "rCOIN",
      apple: "rAAPL",
      amazon: "rAMZN"
    };
    const lower = text.toLowerCase();
    for (const [name, token] of Object.entries(companyAliases)) {
      if (new RegExp(`\\b${name}\\b`).test(lower)) {
        asset = token;
        userProvided.push("asset");
        break;
      }
    }
    if (!asset && /\b(nvda|tsla|aapl|coin|mstr|amzn)\b/i.test(text)) {
      assetClarificationRequired = true;
    }
  }

  // Typo tolerance: a near-miss r-token like "rNVDDA" would otherwise be
  // accepted as a fabricated asset and dead-end at the market-state step.
  // Correct it to the closest known r-token (edit distance <= 2) and surface
  // the correction as an inferred field so the UI shows what changed.
  if (asset) {
    if (!KNOWN_R_TOKENS.includes(asset)) {
      const editDistance = (a: string, b: string): number => {
        const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
        for (let j = 0; j <= b.length; j++) dp[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
          for (let j = 1; j <= b.length; j++) {
            dp[i][j] = Math.min(
              dp[i - 1][j] + 1,
              dp[i][j - 1] + 1,
              dp[i - 1][j - 1] + (a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1)
            );
          }
        }
        return dp[a.length][b.length];
      };
      let best: { token: string; dist: number } | null = null;
      for (const token of KNOWN_R_TOKENS) {
        const dist = editDistance(asset, token);
        if (dist <= 2 && (best === null || dist < best.dist)) {
          best = { token, dist };
        }
      }
      if (best) {
        inferred.push(`asset (corrected from "${asset}")`);
        asset = best.token;
      } else {
        // Unsupported asset (e.g. an invented r-token like "rQXYZ"): never
        // accepted silently — it cannot reach the market-state step. Ask for
        // a clarification listing the assets the desk actually supports.
        assetClarificationRequired = true;
        unsupportedAssetQuestion = `${asset} isn't a supported asset — did you mean one of: ${KNOWN_R_TOKENS.join(", ")}?`;
        userProvided.pop(); // the generic r-token match is not a real asset mention
        asset = null;
      }
    }
  }

  // 3. Price extraction (must strictly distinguish prices from execution times like 'at 11:30 ET' and percentages like 'at 0.03%')
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

  // 4. Position size extraction ($2,000 or 2000 usd or $2k, or share quantities)
  let positionSizeUsd: number | null = null;
  
  const textToNum: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };
  const grandMatch = text.match(/(one|two|three|four|five|six|seven|eight|nine|ten)\s+grand\b/i);

  // 4a. Share / Token count extraction takes precedence when explicit unit is used (e.g. "50 shares", "10 tokens of rNVDA at $150")
  const sharesMatch = text.match(/([\d,]+(?:\.\d+)?)\s*(?:shares|tokens|units|contracts)\b/i);

  const sizeMatch = text.match(/(-?)\s*\$\s*([\d,]+(?:\.\d+)?)\s*(k|m)?/i) ||
    text.match(/(-?)\s*([\d,]+(?:\.\d+)?)\s*(?:usd|dollars|usdt)\b/i);

  if (sharesMatch) {
    const shareCount = parseFloat(sharesMatch[1].replace(/,/g, ""));
    if (Number.isFinite(shareCount) && shareCount > 0) {
      if (explicitPrice !== null && explicitPrice > 0) {
        positionSizeUsd = Math.round(shareCount * explicitPrice * 100) / 100;
        userProvided.push("positionSizeUsd");
        derived.push("positionSizeUsd (derived from share count and explicit price)");
      } else if (workingPrice > 0) {
        positionSizeUsd = Math.round(shareCount * workingPrice * 100) / 100;
        userProvided.push("positionSizeUsd");
        derived.push("positionSizeUsd (derived from share count and working market price)");
      } else {
        // Without an explicit price or a known live market price, share counts cannot guess USD notional
        priceClarificationRequired = true;
      }
    }
  } else if (grandMatch) {
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

  // 5. Thesis extraction
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
           userProvided.push("relevantExposureAmount");
         }
       } else {
         inferred.push("relevantExposureAmount (unstated in prompt)");
       }
    } else if (exposureMatch[1]) {
       expAsset = exposureMatch[1].toUpperCase();
       inferred.push("relevantExposureAmount (unstated in prompt)");
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
    clarificationQuestion = unsupportedAssetQuestion
      ? unsupportedAssetQuestion
      : assetClarificationRequired 
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

  // Direction contradiction: opposing directional language in the same input
  // as the resolved direction (e.g. "long but I think it'll crash"). Surfaced
  // as an inferred field plus a clarification request — same ambiguity channel
  // the parser already uses — rather than a silently resolved position. Bullish
  // "short squeeze"/"short interest" vocabulary is not a contradiction.
  const directionContradictions = direction ? detectDirectionContradiction(text, direction) : [];
  if (!requiresClarification && directionContradictions.length > 0) {
    inferred.push(
      `direction-contradiction (resolved ${direction}, but input also contains opposing language: ${directionContradictions.join(", ")})`
    );
    requiresClarification = true;
    clarificationField = "direction";
    clarificationQuestion = `Your input reads ${direction} but also contains opposing language ("${directionContradictions.join(", ")}"). Do you want to go LONG or SHORT?`;
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


