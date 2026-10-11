# Guide: Verifying a Tokenized Asset & Fetching Its Real Price

> A transferable recipe extracted from the Bitget rToken integration. Language-agnostic; skeletons in TypeScript, trivially portable. Six steps, in dependency order.

---

## Step 1 — Verify the symbol against the exchange's own metadata

**Never trust user input.** Before using a symbol, ask the exchange what it is via its instrument/metadata endpoint, and look for the exchange's classification flag (Bitget: `isReality` for tokenized equities; elsewhere: `assetType`, `isSpotTradingAllowed`, etc.). Reject anything unclassified — throw, don't guess. Parse tradability into an ACTIVE/INACTIVE flag.

```ts
interface Instrument {
  symbol: string; isVerified: boolean; isActive: boolean;
}

function parseInstrument(item: RawInstrumentResponse): Instrument {
  const isVerified = item.isReality === "yes" || item.isReality === "true"; // exchange's own flag
  const status = item.status || "unknown";
  const isActive = status === "online" || status === "normal" || status === "1";
  return { symbol: item.symbol, isVerified, isActive };
}

async function getVerifiedInstrument(symbol: string): Promise<Instrument> {
  const raw = await fetchJson(`${BASE}/market/instruments?symbol=${encodeURIComponent(symbol)}`);
  if (!raw.ok || !raw.data?.length) throw new Error(`No instrument found for ${symbol}`);
  return parseInstrument(raw.data[0]);
}

// The gate — the ONLY hard requirement that must live in step 1:
const instrument = await getVerifiedInstrument(symbol);
if (!instrument.isVerified) {
  throw new Error(`${symbol} is not a verified tokenized asset on this exchange`);
}
```

## Step 2 — Harden every parse at the boundary

Parsing is validation, not conversion. Rules: required numeric fields throw on failure; optional fields become `null` (never `NaN`); the **exchange's timestamp is mandatory** and becomes your `observedAt` — never stamp the local clock (backend cleanliness check compares staleness against it).

```ts
function parseTicker(item: RawTickerResponse): Ticker {
  const lastPrice = parseFloat(item.lastPrice);
  if (!Number.isFinite(lastPrice) || lastPrice <= 0) {
    throw new Error(`Invalid lastPrice for ${item.symbol}: ${item.lastPrice}`);   // required → throw
  }
  const tsMs = parseInt(item.ts, 10);
  if (!Number.isFinite(tsMs) || tsMs <= 0) {
    throw new Error(`Missing valid timestamp for ${item.symbol}: ${item.ts}`);    // required → throw
  }
  const opt = (v?: string) => {                                    // optional → null, never NaN
    const n = parseFloat(v ?? "");
    return Number.isFinite(n) ? n : null;
  };
  return {
    symbol: item.symbol,
    lastPrice,
    bid: opt(item.bid1Price), ask: opt(item.ask1Price),
    bidSize: opt(item.bid1Size), askSize: opt(item.ask1Size),
    observedAt: new Date(tsMs).toISOString(),                      // exchange clock, not Date.now()
  };
}
```

## Step 3 — Lock the client to trusted origins

A config-driven base URL (`EXCHANGE_API_BASE_URL` env var) can redirect your verification call to a fake server that answers "yes, verified" to anything. Allowlist origins and refuse the rest:

```ts
const TRUSTED_ORIGINS = new Set(["https://api.example-exchange.com"]);
const TRUSTED_DEFAULT = "https://api.example-exchange.com";
const envUrl = (process.env.EXCHANGE_API_BASE_URL || TRUSTED_DEFAULT).replace(/\/$/, "");
const baseUrl = TRUSTED_ORIGINS.has(envUrl) ? envUrl : TRUSTED_DEFAULT;  // anything else falls back to the trusted default
```

## Step 4 — Map user input → canonical symbol at exactly one boundary

Normalize once, at the input boundary. Known symbols first (case-insensitive list), then a strict pattern fallback. Anything unmapped → ask the user; never assume.

```ts
const KNOWN: Record<string, string> = { "btc": "BTC", "eth": "ETH" };
function normalizeAsset(input: string): string {
  const text = input.trim();
  const known = Object.keys(KNOWN).find(k => text.toLowerCase().startsWith(k));
  if (known) return KNOWN[known];                                 // known list wins (handles case)
  const m = text.match(/^([A-Z]{2,10})(?:USDT)?$/i);              // strict generic pattern
  if (!m) throw new Error(`Unrecognized asset: ${input}`);
  return m[1].toUpperCase();
}
```

## Step 5 — Compose the snapshot from independent sources

Fetch: the token's ticker, the **underlying** asset's price from a *separate* provider (Yahoo/another API), a benchmark (e.g. BTC), and the exchange's closure calendar. Each wrapped independently — a failed source becomes `null` + a `DEGRADED` flag, never a silent substitution. Derive derived metrics (spread, basis) only from fields that exist. Use `Promise.all` for the first two, lowest-level try/catch for the rest.

```ts
interface Snapshot {
  tokenPrice: number; tokenObservedAt: string;
  underlyingPrice: number | null; benchmarkPrice: number | null;
  sessionStatus: "ACTIVE" | "INACTIVE" | "UNKNOWN";
  dataQuality: "COMPLETE" | "DEGRADED"; isFallbackDemo: boolean;
  composition: Array<{ id: string; observedAt: string }>;
}

async function getSnapshot(normalizedAsset: string): Promise<Snapshot> {
  const [instSnap, tokenSnap] = await Promise.all([
    getVerifiedInstrument(tokenSymbol(normalizedAsset)),   // gate from Step 1, done in parallel
    getTicker(tokenSymbol(normalizedAsset)),               // returns real / throws
  ]);
  const snap: Snapshot = {
    tokenPrice: tokenSnap.lastPrice,
    tokenObservedAt: tokenSnap.observedAt,
    underlyingPrice: null, benchmarkPrice: null,
    sessionStatus: instSnap.isActive ? "ACTIVE" : "INACTIVE",
    dataQuality: "COMPLETE", isFallbackDemo: false, composition: [],
  };
  try {                                                    // independent → own try/catch
    const u = await underlying(normalizedAsset);           // separate provider (Yahoo etc.)
    snap.underlyingPrice = u.price;
  } catch {                                               // degrade, never substitute
    snap.dataQuality = "DEGRADED";
  }
  try {
    snap.benchmarkPrice = (await getTicker("BTCUSDT")).lastPrice;
  } catch { snap.dataQuality = "DEGRADED"; }
  try {
    snap.sessionStatus = await sessionFromCalendar(normalizedAsset);  // calendar fetch
  } catch {
    snap.sessionStatus = "UNKNOWN";                        // never pretend no closures exist
  }
  return snap;
}
// Derivatives (spread, basis) only from non-null fields — compute after, not inside, the try/catches.
```

## Step 6 — Honest failure mode

If the primary API dies, only fall back to a demo fixture for the **one asset the demo actually describes** — substituting another asset's demo data is a lie. For everything else, rethrow. Label the fallback loudly so the UI/user knows.

```ts
async function getSnapshotSafe(asset: string): Promise<Snapshot> {
  try {
    return await getSnapshot(asset);
  } catch (err) {
    if (asset === "BTC") {                                 // only the asset the fixture describes
      return { ...demoFixture, isFallbackDemo: true, dataQuality: "DEGRADED" };
    }
    throw err;                                             // honest failure everywhere else
  }
}
```

---

## The one-sentence transfer

> Verify the symbol against the exchange's own instrument metadata (reject unclassified assets), harden all numeric parses at the boundary, lock the client to trusted origins, fetch token + underlying + benchmark from independent sources, null-and-flag any source that fails instead of substituting data, and always use the exchange's timestamp for staleness.

## What changes for a different exchange / asset class

| Concern | Swappable | Stays the same |
|---|---|---|
| Verification flag | `isReality` / `isSpotTradingAllowed` / `assetType` | Throw on absence or falsy |
| Ticker fields | Field names, timestamp location | Validate-or-throw on required, `null` on optional |
| Underlying price | Yahoo → Alpha Vantage → vendor of choice | Independent provider, null+flag on failure |
| User-input format | `rTSLA` vs `TSLA-USDT` vs whatever | One mapping function, one throw for unknowns |
| Calendar | Exchange-specific closure endpoint | Unknown on failure, never assumed-open |

## Test the pattern, not the exchange

- **Fixture tests** (no network): feed a raw payload per step; assert the thrown errors and null-degradations.
- **Gate test**: a `isVerified: false` instrument must produce a thrown error, never a price.
- **Degradation test**: kill (stub) one provider; assert the snapshot comes back with `null` + `DEGRADED`, not a fabricated number.
- **Timestamp test**: assert `observedAt` equals the exchange's `ts`, not the test wall-clock.

Reference implementation: `src/adapters/bitget/client.ts` + `src/services/marketStateService.ts` in this repo; test patterns in `tests/bitget.test.cjs`.
