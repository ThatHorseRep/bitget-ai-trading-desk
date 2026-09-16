const assert = require("node:assert/strict");
const { test } = require("node:test");
const { MarketStateService } = require("../dist-core/src/services/marketStateService.js");

test("MarketStateService returns fixture when useFixture is true", async () => {
  const service = new MarketStateService();
  const state = await service.getMarketState("rNVDA", { useFixture: true });
  assert.equal(state.instrumentPrice, 120);
  assert.equal(state.referencePrice, 117);
  assert.equal(state.basis, 3);
  assert.equal(state.dataQuality, "COMPLETE");
});

test("MarketStateService throws on unsupported asset", async () => {
  const service = new MarketStateService();
  await assert.rejects(
    async () => service.getMarketState("XYZ_FAKE"),
    /Asset XYZ_FAKE is not supported. Must be an rToken./
  );
});

test("MarketStateService synthesizes live state with mock providers correctly", async () => {
  const mockBitgetClient = {
    getSpotInstrument: async (symbol) => {
      return {
        symbol,
        category: "SPOT",
        baseCoin: "rNVDA",
        quoteCoin: "USDT",
        isRwa: false,
        isReality: true,
        status: "online",
        isActive: true
      };
    },
    getSpotTicker: async (symbol) => {
      if (symbol === "rNVDAUSDT") {
        return {
          symbol: "rNVDAUSDT",
          lastPrice: 220,
          bid: 219.5,
          ask: 220.5,
          bidSize: 20,
          askSize: 25,
          volume24h: 1000,
          price24hPcnt: 0.01,
          observedAt: "2026-01-14T16:00:00.000Z",
          source: "Mock Bitget"
        };
      }
      if (symbol === "BTCUSDT") {
        return {
          symbol: "BTCUSDT",
          lastPrice: 90000,
          bid: 89999,
          ask: 90001,
          bidSize: 5,
          askSize: 5,
          volume24h: 50000,
          price24hPcnt: -0.02,
          observedAt: "2026-01-14T16:00:00.000Z",
          source: "Mock Bitget BTC"
        };
      }
      throw new Error(`Unexpected symbol: ${symbol}`);
    },
    getRealityCalendar: async () => ({ specificConfig: [] })
  };

  const mockReferenceProvider = {
    getReferencePrice: async (symbol) => ({
      symbol,
      price: 215,
      previousClose: 214,
      observedAt: "2026-01-14T16:00:00.000Z",
      source: "Mock Reference"
    })
  };

  const service = new MarketStateService(mockBitgetClient, mockReferenceProvider);
  const now = new Date("2026-01-14T16:00:30.000Z"); // Wednesday 11:00 AM ET (REGULAR session)

  const state = await service.getMarketState("rNVDA", { now });

  assert.equal(state.instrumentPrice, 220);
  assert.equal(state.referencePrice, 215);
  assert.equal(state.basis, 5); // 220 - 215
  assert.equal(state.spread, 1); // 220.5 - 219.5
  assert.equal(state.sessionStatus, "REGULAR");
  assert.equal(state.liquidityClass, "NORMAL");
  assert.equal(state.dataQuality, "COMPLETE");
  assert.equal(state.btcPrice, 90000);
});

test("MarketStateService degrades cleanly when reference price fails", async () => {
  const mockBitgetClient = {
    getSpotInstrument: async (symbol) => ({
      symbol,
      category: "SPOT",
      baseCoin: "rNVDA",
      quoteCoin: "USDT",
      isReality: true,
      status: "online",
      isActive: true
    }),
    getSpotTicker: async () => ({
      symbol: "rNVDAUSDT",
      lastPrice: 220,
      bid: 219.5,
      ask: 220.5,
      bidSize: 20,
      askSize: 25,
      volume24h: 1000,
      price24hPcnt: 0.01,
      observedAt: "2026-01-14T16:00:00.000Z",
      source: "Mock Bitget"
    }),
    getRealityCalendar: async () => null
  };

  const failingReferenceProvider = {
    getReferencePrice: async () => {
      throw new Error("Reference provider timeout");
    }
  };

  const service = new MarketStateService(mockBitgetClient, failingReferenceProvider);
  const now = new Date("2026-01-14T16:00:30.000Z");
  const state = await service.getMarketState("rNVDA", { now });

  assert.equal(state.instrumentPrice, 220);
  assert.equal(state.referencePrice, null);
  assert.equal(state.basis, null);
  assert.equal(state.dataQuality, "DEGRADED");
});
