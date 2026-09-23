export interface CalibratedPromptItem {
  id: "PROCEED" | "REDUCE" | "WAIT" | "REJECT";
  stateLabel: string;
  scoreLabel: string;
  verdict: "PROCEED" | "REDUCE" | "WAIT" | "REJECT";
  offsetLabel: string;
  summary: string;
  policyGate: string;
  policyStatus: string;
  prompt: string;
  targetMetric: string;
  assetSymbol: string;
}

export interface CalibratedBatchInfo {
  batchIndex: number;
  assetSymbol: string;
  theme: string;
  prompts: CalibratedPromptItem[];
}

const CALIBRATED_BATCHES: CalibratedBatchInfo[] = [
  {
    batchIndex: 0,
    assetSymbol: "rNVDA",
    theme: "AI Semiconductor & Cloud Capex",
    prompts: [
      {
        id: "PROCEED",
        stateLabel: "STATE 4",
        scoreLabel: "SCORE ≥ 0.80",
        verdict: "PROCEED",
        offsetLabel: "OFFSET 0u",
        summary: "Clear execution runway. Basis within parameters, thesis fully falsifiable, risk within account limit.",
        policyGate: "GATE: GREEN",
        policyStatus: "PROCEED_OK",
        prompt: "I plan to buy $3,500 rNVDA token during regular US market trading. TSMC reports 28% Q3 AI accelerator revenue growth; orderbook depth shows <0.04% basis spread against NASDAQ reference close.",
        targetMetric: "Basis < 0.05% • Cash Open",
        assetSymbol: "rNVDA"
      },
      {
        id: "REDUCE",
        stateLabel: "STATE 3",
        scoreLabel: "SCORE ≥ 0.60",
        verdict: "REDUCE",
        offsetLabel: "OFFSET 4.5u",
        summary: "Basis risk elevated. Trim notional position size by 40% or hedge crypto contagion drag.",
        policyGate: "GATE: WARNING",
        policyStatus: "REDUCE_POSITION_SIZE",
        prompt: "I plan to buy $48,000 rNVDA token with 3x leverage based on hyperscaler cloud capex expansions. Basis spread currently elevated at 0.38%; crypto beta correlation warrants position trim.",
        targetMetric: "Notional $48k • 3x Lev",
        assetSymbol: "rNVDA"
      },
      {
        id: "WAIT",
        stateLabel: "STATE 2",
        scoreLabel: "SCORE ≥ 0.35",
        verdict: "WAIT",
        offsetLabel: "OFFSET 9u",
        summary: "Off-hours market close or un-anchored basis drift. Defer execution until cash open at 09:30 ET.",
        policyGate: "GATE: DEFERRAL",
        policyStatus: "OFF_HOURS_WAIT",
        prompt: "I want to buy $20,000 rNVDA token on Sunday at 03:00 AM ET during the 65.5-hour weekend cash closure while NASDAQ is closed and token orderbook basis is un-anchored.",
        targetMetric: "65.5h Closure • Off-Hours",
        assetSymbol: "rNVDA"
      },
      {
        id: "REJECT",
        stateLabel: "STATE 1",
        scoreLabel: "SCORE < 0.35",
        verdict: "REJECT",
        offsetLabel: "OFFSET 15u",
        summary: "Critical tail risk or unfalsifiable thesis. Position blocked from trade execution by pre-trade firewall.",
        policyGate: "GATE: BLOCKED",
        policyStatus: "SEVERE_RISK",
        prompt: "I plan to buy $120,000 rNVDA token with 10x leverage on Sunday at 04:00 AM ET with no stop loss; thesis assumes continuous momentum despite crypto liquidation cascades.",
        targetMetric: "Unfalsifiable • Max Shock",
        assetSymbol: "rNVDA"
      }
    ]
  },
  {
    batchIndex: 1,
    assetSymbol: "rTSLA",
    theme: "Autonomous Mobility & High Retail Leverage",
    prompts: [
      {
        id: "PROCEED",
        stateLabel: "STATE 4",
        scoreLabel: "SCORE ≥ 0.80",
        verdict: "PROCEED",
        offsetLabel: "OFFSET 0u",
        summary: "Clear execution runway. Basis within parameters, thesis fully falsifiable, risk within account limit.",
        policyGate: "GATE: GREEN",
        policyStatus: "PROCEED_OK",
        prompt: "I plan to buy $4,000 rTSLA token at 11:30 ET during active NASDAQ session. Invalidation if cash mark drops below $210; orderbook basis spread is flat at 0.03% to primary exchange.",
        targetMetric: "Basis 0.03% • Cash Open",
        assetSymbol: "rTSLA"
      },
      {
        id: "REDUCE",
        stateLabel: "STATE 3",
        scoreLabel: "SCORE ≥ 0.60",
        verdict: "REDUCE",
        offsetLabel: "OFFSET 4.5u",
        summary: "Basis risk elevated. Trim notional position size by 40% or hedge crypto contagion drag.",
        policyGate: "GATE: WARNING",
        policyStatus: "REDUCE_POSITION_SIZE",
        prompt: "I plan to buy $55,000 rTSLA token with 2.5x leverage before Q3 deliveries. High retail implied volatility and basis spread of 0.42% warrant immediate position scaling down.",
        targetMetric: "Notional $55k • 2.5x Lev",
        assetSymbol: "rTSLA"
      },
      {
        id: "WAIT",
        stateLabel: "STATE 2",
        scoreLabel: "SCORE ≥ 0.35",
        verdict: "WAIT",
        offsetLabel: "OFFSET 9u",
        summary: "Off-hours market close or un-anchored basis drift. Defer execution until cash open at 09:30 ET.",
        policyGate: "GATE: DEFERRAL",
        policyStatus: "OFF_HOURS_WAIT",
        prompt: "I want to allocate $25,000 to rTSLA on Saturday morning after autonomous driving demo rumors, while NASDAQ cash venue is closed and wrapper premium drifts +3.1%.",
        targetMetric: "Weekend Gap • Basis +3.1%",
        assetSymbol: "rTSLA"
      },
      {
        id: "REJECT",
        stateLabel: "STATE 1",
        scoreLabel: "SCORE < 0.35",
        verdict: "REJECT",
        offsetLabel: "OFFSET 15u",
        summary: "Critical tail risk or unfalsifiable thesis. Position blocked from trade execution by pre-trade firewall.",
        policyGate: "GATE: BLOCKED",
        policyStatus: "SEVERE_RISK",
        prompt: "I plan to buy $150,000 rTSLA with 10x leverage on Sunday midnight with no hedge or exit stop; robotaxi sentiment will overpower any weekend crypto downturn.",
        targetMetric: "Unfalsifiable • Max Shock",
        assetSymbol: "rTSLA"
      }
    ]
  },
  {
    batchIndex: 2,
    assetSymbol: "rCOIN",
    theme: "Crypto Infrastructure Proxy & High Beta Contagion",
    prompts: [
      {
        id: "PROCEED",
        stateLabel: "STATE 4",
        scoreLabel: "SCORE ≥ 0.80",
        verdict: "PROCEED",
        offsetLabel: "OFFSET 0u",
        summary: "Clear execution runway. Basis within parameters, thesis fully falsifiable, risk within account limit.",
        policyGate: "GATE: GREEN",
        policyStatus: "PROCEED_OK",
        prompt: "I plan to buy $2,500 rCOIN token on Tuesday at 14:00 ET. Invalidation if BTC breaks $62k support; basis spread is 0.04% with deep primary orderbook liquidity.",
        targetMetric: "Basis < 0.05% • Cash Open",
        assetSymbol: "rCOIN"
      },
      {
        id: "REDUCE",
        stateLabel: "STATE 3",
        scoreLabel: "SCORE ≥ 0.60",
        verdict: "REDUCE",
        offsetLabel: "OFFSET 4.5u",
        summary: "Basis risk elevated. Trim notional position size by 40% or hedge crypto contagion drag.",
        policyGate: "GATE: WARNING",
        policyStatus: "REDUCE_POSITION_SIZE",
        prompt: "I plan to buy $42,000 rCOIN token with 3x leverage ahead of crypto ETF inflows. High equity-crypto beta of 0.82 and elevated wrapper spread require trimming notional exposure.",
        targetMetric: "Beta 0.82 • 3x Lev",
        assetSymbol: "rCOIN"
      },
      {
        id: "WAIT",
        stateLabel: "STATE 2",
        scoreLabel: "SCORE ≥ 0.35",
        verdict: "WAIT",
        offsetLabel: "OFFSET 9u",
        summary: "Off-hours market close or un-anchored basis drift. Defer execution until cash open at 09:30 ET.",
        policyGate: "GATE: DEFERRAL",
        policyStatus: "OFF_HOURS_WAIT",
        prompt: "I want to buy $18,000 rCOIN token on Sunday afternoon during SEC rumor volatility, when NASDAQ is shuttered and decentralized token book has 2.8% basis dislocation.",
        targetMetric: "65.5h Closure • Beta Drift",
        assetSymbol: "rCOIN"
      },
      {
        id: "REJECT",
        stateLabel: "STATE 1",
        scoreLabel: "SCORE < 0.35",
        verdict: "REJECT",
        offsetLabel: "OFFSET 15u",
        summary: "Critical tail risk or unfalsifiable thesis. Position blocked from trade execution by pre-trade firewall.",
        policyGate: "GATE: BLOCKED",
        policyStatus: "SEVERE_RISK",
        prompt: "I plan to buy $100,000 rCOIN token with 10x leverage on Saturday night without stop loss; exchange trading volume is guaranteed to explode regardless of weekend macro dumps.",
        targetMetric: "Unfalsifiable • Max Shock",
        assetSymbol: "rCOIN"
      }
    ]
  }
];

export const CYCLE_SECONDS = 900; // 15-minute global calibration cycle

export function getEpochBatchIndex(): number {
  if (typeof window === "undefined") return 0;
  const epochCycle = Math.floor(Date.now() / (1000 * CYCLE_SECONDS));
  return epochCycle % CALIBRATED_BATCHES.length;
}

export function getEpochRemainingSeconds(): number {
  if (typeof window === "undefined") return CYCLE_SECONDS;
  const nowSec = Math.floor(Date.now() / 1000);
  const remaining = CYCLE_SECONDS - (nowSec % CYCLE_SECONDS);
  return remaining === 0 ? CYCLE_SECONDS : remaining;
}

export function getCalibratedBatch(batchIndex?: number): CalibratedBatchInfo {
  const index = batchIndex !== undefined 
    ? Math.abs(batchIndex) % CALIBRATED_BATCHES.length 
    : getEpochBatchIndex();
  return CALIBRATED_BATCHES[index];
}

export function getCalibratedPrompts(batchIndex?: number): CalibratedPromptItem[] {
  return getCalibratedBatch(batchIndex).prompts;
}
