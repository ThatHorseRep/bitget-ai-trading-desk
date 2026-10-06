// Core Scenarios & Historical Retrieval Engine
export {
  retrieveHistoricalScenarios,
  getSessionRiskMultiplier,
  type HistoricalRetrievalInput,
  type HistoricalRetrievalResult,
  type HistoricalEmpiricalMetrics,
  type MatchConfidence
} from "./scenarios/retrieval";

export {
  HISTORICAL_GAP_DATABASE,
  getAllHistoricalPrecedents,
  getHistoricalPrecedentById,
  type HistoricalGapPrecedent,
  type AssetClass,
  type SessionType
} from "./scenarios/historicalDatabase";

export { runStressScenarios } from "./scenarios/engine";
export { SCENARIO_CONFIG, ASSET_RISK_PROFILES } from "./scenarios/config";

// Thesis & Assessment
export { assessThesisVsPosition } from "./thesis/assessment";
export { generateThesisChallenge } from "./thesis/challenger";
export { extractThesis, parseThesisSignals } from "./thesis/extractor";

// Calculations & Financial Math
export {
  roundFinancial,
  calculateScenarioPnl,
  calculatePnlPct,
  calculatePositionQuantity,
  calculateSpread,
  calculateSpreadPct,
  calculateBasis
} from "./calculations/financial";

// Market Session
export { determineUsMarketSession } from "./market/session";
