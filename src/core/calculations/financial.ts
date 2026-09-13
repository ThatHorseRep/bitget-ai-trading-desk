const FINANCIAL_SCALE = 1e8;

export function roundFinancial(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Financial value must be finite");
  return Math.round((value + Number.EPSILON) * FINANCIAL_SCALE) / FINANCIAL_SCALE;
}

export function assertPositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be greater than zero`);
}

export function calculatePositionQuantity(positionSizeUsd: number, entryPrice: number): number {
  assertPositive(positionSizeUsd, "positionSizeUsd");
  assertPositive(entryPrice, "entryPrice");
  return roundFinancial(positionSizeUsd / entryPrice);
}

export function calculateSpread(ask: number, bid: number): number {
  if (!Number.isFinite(ask) || !Number.isFinite(bid)) throw new Error("Bid and ask must be finite");
  if (ask < bid) throw new Error("Ask cannot be below bid");
  return roundFinancial(ask - bid);
}

export function calculateSpreadPct(ask: number, bid: number): number {
  if (ask < bid) throw new Error("Ask cannot be below bid");
  const midpoint = (ask + bid) / 2;
  assertPositive(midpoint, "midpoint");
  return roundFinancial((ask - bid) / midpoint * 100);
}

export function calculateBasis(tokenPrice: number, referencePrice: number): { basis: number; basisPct: number } {
  assertPositive(tokenPrice, "tokenPrice");
  assertPositive(referencePrice, "referencePrice");
  return {
    basis: roundFinancial(tokenPrice - referencePrice),
    basisPct: roundFinancial((tokenPrice / referencePrice - 1) * 100)
  };
}

export function calculateScenarioPnl(direction: "LONG" | "SHORT", quantity: number, entryPrice: number, scenarioPrice: number): number {
  assertPositive(quantity, "quantity");
  assertPositive(entryPrice, "entryPrice");
  assertPositive(scenarioPrice, "scenarioPrice");
  const pnl = direction === "LONG"
    ? quantity * (scenarioPrice - entryPrice)
    : quantity * (entryPrice - scenarioPrice);
  return roundFinancial(pnl);
}

export function calculatePnlPct(pnlUsd: number, positionSizeUsd: number): number {
  assertPositive(positionSizeUsd, "positionSizeUsd");
  return roundFinancial((pnlUsd / positionSizeUsd) * 100);
}
