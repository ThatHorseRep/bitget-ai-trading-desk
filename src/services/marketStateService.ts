import type { MarketState, SourceRef } from "../domain/market/types";
import { BitgetClient } from "../adapters/bitget/client";
import { CompositeReferenceProvider } from "../adapters/reference/composite";
import type { ReferencePriceProvider } from "../adapters/reference/types";
import { deriveSpreadAndBasis, classifyLiquidity } from "../core/calculations/market";
import { determineUsMarketSession } from "../core/market/session";
import { assessMarketDataQuality } from "../core/validation/dataQuality";
import { SCENARIO_CONFIG } from "../core/scenarios/config";
import { rnvdaDemoMarketState } from "../fixtures/rnvda-demo";

export interface MarketStateOptions {
  useFixture?: boolean;
  bitgetClient?: BitgetClient;
  referenceProvider?: ReferencePriceProvider;
  now?: Date;
}

export const SUPPORTED_ASSET_MAPPINGS: Record<string, { bitgetSymbol: string; referenceSymbol: string }> = {
  "rNVDA": { bitgetSymbol: "rNVDAUSDT", referenceSymbol: "NVDA" },
  "rNVDAUSDT": { bitgetSymbol: "rNVDAUSDT", referenceSymbol: "NVDA" },
  "RNVDAUSDT": { bitgetSymbol: "rNVDAUSDT", referenceSymbol: "NVDA" }
};

export class MarketStateService {
  private bitgetClient: BitgetClient;
  private referenceProvider: ReferencePriceProvider;

  constructor(
    bitgetClient: BitgetClient = new BitgetClient(),
    referenceProvider: ReferencePriceProvider = new CompositeReferenceProvider()
  ) {
    this.bitgetClient = bitgetClient;
    this.referenceProvider = referenceProvider;
  }

  async getMarketState(asset: string, options: MarketStateOptions = {}): Promise<MarketState> {
    if (options.useFixture) {
      return {
        ...rnvdaDemoMarketState
      };
    }

    let mapping = SUPPORTED_ASSET_MAPPINGS[asset] || SUPPORTED_ASSET_MAPPINGS[asset.toUpperCase()];
    
    // Dynamic mapping for other rTokens (e.g. rAAPL, rTSLA)
    if (!mapping && asset.toLowerCase().startsWith('r')) {
       let refSymbol = asset.substring(1).toUpperCase();
       if (refSymbol.endsWith('USDT')) {
          refSymbol = refSymbol.substring(0, refSymbol.length - 4);
       }
       mapping = { 
         bitgetSymbol: `r${refSymbol}USDT`, 
         referenceSymbol: refSymbol 
       };
    }

    if (!mapping) {
      throw new Error(`Asset ${asset} is not supported. Must be an rToken.`);
    }

    const now = options.now ?? new Date();
    const sources: SourceRef[] = [];

    // 1. Fetch Bitget rToken instrument & ticker with Demo Safety Net fallback
    let rTokenInstrument;
    let rTokenTicker;
    try {
      [rTokenInstrument, rTokenTicker] = await Promise.all([
        this.bitgetClient.getSpotInstrument(mapping.bitgetSymbol),
        this.bitgetClient.getSpotTicker(mapping.bitgetSymbol)
      ]);

      if (!rTokenInstrument.isReality) {
        throw new Error(`Instrument ${mapping.bitgetSymbol} is not identified as a Reality token by Bitget.`);
      }
    } catch (bitgetError) {
      // The curated demo fixture describes rNVDA only. Substituting it for any
      // other asset would present NVDA demo prices as the requested asset's
      // market — so fall back ONLY when the request is actually rNVDA;
      // otherwise rethrow so callers get an honest failure.
      console.warn("Bitget API unavailable:", bitgetError);
      if (mapping.referenceSymbol === "NVDA") {
        return {
          ...rnvdaDemoMarketState,
          isFallbackDemo: true,
          fallbackReason: "Bitget API unavailable - showing curated rNVDA weekend basis demo",
          dataQuality: "DEGRADED"
        };
      }
      throw bitgetError;
    }

    const tokenMarketStatus = rTokenInstrument.isActive ? "ACTIVE" : "INACTIVE";

    sources.push({
      id: "bitget-rtoken",
      name: "Bitget Spot Ticker (rToken)",
      observedAt: rTokenTicker.observedAt
    });

    // 2. Fetch Bitget BTC ticker for crypto benchmark
    let btcPrice: number | null = null;
    let btcObservedAt: string | null = null;
    try {
      const btcTicker = await this.bitgetClient.getSpotTicker("BTCUSDT");
      btcPrice = btcTicker.lastPrice;
      btcObservedAt = btcTicker.observedAt;
      sources.push({
        id: "bitget-btc",
        name: "Bitget BTC/USDT Benchmark",
        observedAt: btcTicker.observedAt
      });
    } catch {
      // BTC fetch failed; keep null for degraded state
    }

    // 3. Fetch Bitget Reality calendar for special closures
    const calendar = await this.bitgetClient.getRealityCalendar();
    
    // 4. Determine deterministic session status
    let sessionStatus = determineUsMarketSession(now, calendar?.specificConfig ?? []);
    if (calendar === null) {
      sessionStatus = "UNKNOWN"; // Do not silently pretend no closures if fetch failed
    }

    // 5. Fetch Reference stock price (Yahoo / fallback)
    const activeReferenceProvider = options.referenceProvider ?? this.referenceProvider;
    let referencePrice: number | null = null;
    let referencePreviousClose: number | null = null;
    let referenceObservedAt: string | null = null;
    let referenceSourceName: string | null = null;
    try {
      const refQuote = await activeReferenceProvider.getReferencePrice(mapping.referenceSymbol);
      referencePrice = refQuote.price;
      referencePreviousClose = refQuote.previousClose ?? null;
      referenceObservedAt = refQuote.observedAt;
      referenceSourceName = refQuote.source;
      sources.push({
        id: "reference-quote",
        name: refQuote.source,
        observedAt: refQuote.observedAt
      });
    } catch {
      // Reference quote unavailable; keep null for degraded state
    }

    // 6. Deterministic calculations: spread, basis, liquidity
    const { spread, spreadPct, basis, basisPct } = deriveSpreadAndBasis(
      rTokenTicker.lastPrice,
      rTokenTicker.bid,
      rTokenTicker.ask,
      referencePrice
    );

    const liquidityClass = classifyLiquidity(
      spreadPct,
      rTokenTicker.bidSize,
      rTokenTicker.askSize,
      {
        spreadWarnPercent: SCENARIO_CONFIG.liquiditySpreadWarnPercent,
        minVisibleBidSize: SCENARIO_CONFIG.minVisibleBidSize,
        minVisibleAskSize: SCENARIO_CONFIG.minVisibleAskSize
      }
    );

    // Initial state before validation
    // observedAt uses the EXCHANGE's ticker timestamp, not the local clock —
    // assessMarketDataQuality compares this against `now` to detect stale
    // observations, so stamping it with `now` would make that check a no-op.
    const candidateState: MarketState = {
      observedAt: rTokenTicker.observedAt,
      instrumentPrice: rTokenTicker.lastPrice,
      bid: rTokenTicker.bid,
      ask: rTokenTicker.ask,
      bidSize: rTokenTicker.bidSize,
      askSize: rTokenTicker.askSize,
      spread,
      spreadPct,
      referenceSymbol: mapping.referenceSymbol,
      referencePrice,
      referencePreviousClose,
      referenceObservedAt,
      referenceSourceName,
      basis,
      basisPct,
      btcPrice,
      btcObservedAt,
      sessionStatus,
      tokenMarketStatus,
      liquidityClass,
      dataQuality: "COMPLETE",
      sources
    };

    // 7. Assess data quality
    const qualityReport = assessMarketDataQuality(candidateState, now);
    candidateState.dataQuality = qualityReport.status;

    return candidateState;
  }
}


