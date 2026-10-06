import type { DecisionArtifact } from "../../domain/decision/types";
import { ASSET_RISK_PROFILES } from "../scenarios/config";

export interface ConversationalReply {
  id: string;
  timestamp: number;
  query: string;
  replyType: "deterministic_math" | "explanation" | "comparison" | "grounded_synthesis";
  content: string;
  referencedProvenanceIds: string[];
  calculatedMetric?: {
    label: string;
    originalValue: string;
    projectedValue: string;
    impact: string;
  };
}

export interface SuggestedPrompt {
  id: string;
  label: string;
  prompt: string;
  category: "what_if" | "risk_drilldown" | "execution" | "comparison";
}

/**
 * Pre-calibrated conversational prompts tailored to the active artifact.
 */
export function getSuggestedPrompts(artifact: DecisionArtifact): SuggestedPrompt[] {
  const symbol = artifact.trade.asset || "rNVDA";
  const compSymbol = symbol === "rNVDA" ? "rTSLA" : "rNVDA";

  return [
    {
      id: "btc-tail-drop",
      label: "What if BTC drops 15%?",
      prompt: "What happens to this position if BTC drops 15% over the weekend?",
      category: "what_if"
    },
    {
      id: "basis-risk-detail",
      label: "Why is basis risk elevated?",
      prompt: "Explain why basis risk and market session matter for this trade.",
      category: "risk_drilldown"
    },
    {
      id: "resize-guidance",
      label: "How to get a PROCEED verdict?",
      prompt: "How can I resize or adjust this trade to qualify for a PROCEED verdict?",
      category: "execution"
    },
    {
      id: "asset-compare",
      label: `Compare with ${compSymbol}`,
      prompt: `Compare the off-hours risk profile of ${symbol} with ${compSymbol}.`,
      category: "comparison"
    }
  ];
}

/**
 * Deterministic conversational processor anchored to artifact provenance.
 */
export async function processConversationalQuery(
  artifact: DecisionArtifact,
  queryText: string
): Promise<ConversationalReply> {
  const query = queryText.trim();
  const normalizedQuery = query.toLowerCase();
  const timestamp = Date.now();
  const id = `reply-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;

  // Empty query fallback
  if (!query) {
    return {
      id,
      timestamp,
      query: queryText,
      replyType: "explanation",
      content:
        `**RedTeam Desk Interactive Assistant**\n\n` +
        `Ask any follow-up question regarding your stress test results, explore what-if tail risk scenarios, or click one of the suggested exploration queries below.\n\n` +
        `*Examples*:\n` +
        `• *"What if BTC drops 15%?"* (calculates deterministic contagion spillover)\n` +
        `• *"Why is basis risk elevated?"* (breaks down cash vs off-hours session spread)\n` +
        `• *"How to get PROCEED?"* (suggests calibrated sizing down to safe liquidity bounds)\n` +
        `• *"Compare with rTSLA"* (evaluates comparative beta and borrow cost)`,
      referencedProvenanceIds: ["prov-calc-scenarios", "prov-ai-assessment"]
    };
  }

  // 1. What-If BTC Tail Shock Query: "What if BTC drops X%?"
  const btcDropMatch = normalizedQuery.match(/(?:what\s+if\s+)?btc\s+(?:drops?|falls?|dumps?|crashes?|down)\s+(-?\d+(?:\.\d+)?)\s*%/i) ||
    normalizedQuery.match(/(-?\d+(?:\.\d+)?)\s*%\s*(?:drop|dump|fall)\s+in\s+btc/i);

  if (btcDropMatch) {
    const rawShock = parseFloat(btcDropMatch[1]);
    const shockPct = Number.isFinite(rawShock) ? Math.min(100, Math.max(0, Math.abs(rawShock))) : 8;
    const symbol = artifact.trade.asset || "rNVDA";
    const profile = ASSET_RISK_PROFILES[symbol] ?? ASSET_RISK_PROFILES.DEFAULT;
    const beta = profile.betaToBtc;
    const impliedTokenDrop = Number((shockPct * beta).toFixed(2));
    const notional = Math.max(0, artifact.trade.positionSizeUsd || 0);
    const projectedLoss = Number((notional * (impliedTokenDrop / 100)).toFixed(2));

    // Baseline scenario 2 is crypto contagion (-8% BTC)
    const baseScenario = artifact.scenarios.find((s) => s.id === "CRYPTO_CONTAGION");
    const baselineShortfall = baseScenario && baseScenario.estimatedPnlUsd !== null ? Math.abs(baseScenario.estimatedPnlUsd) : 0;
    const lossDiff = Number((projectedLoss - baselineShortfall).toFixed(2));

    let comparisonText = "";
    let impactText = "";
    if (lossDiff > 0) {
      comparisonText = `This elevated tail shock expands your shortfall by **$${lossDiff.toLocaleString()}**.`;
      impactText = `-$${lossDiff.toLocaleString()} expanded drawdown`;
    } else if (lossDiff < 0) {
      comparisonText = `This milder shock provides a **+$${Math.abs(lossDiff).toLocaleString()}** buffer compared to the baseline desk stress test.`;
      impactText = `+$${Math.abs(lossDiff).toLocaleString()} buffer`;
    } else {
      comparisonText = `This matches the standard baseline 95th-percentile desk stress test shortfall.`;
      impactText = "Identical to baseline shock";
    }

    return {
      id,
      timestamp,
      query,
      replyType: "deterministic_math",
      content:
        `Under an adversarial **-${shockPct}% BTC weekend shock**, systemic crypto contagion transmits through **${symbol}** with an empirical beta of **${beta.toFixed(2)}**.\n\n` +
        `• **Projected Token Drawdown**: -${impliedTokenDrop}% ($${projectedLoss.toLocaleString()} on your $${notional.toLocaleString()} position).\n` +
        `• **Baseline vs Projected**: The standard 95th-percentile desk shock (-8% BTC) projected $${baselineShortfall.toLocaleString()} shortfall. ${comparisonText}\n\n` +
        `*Deterministic derivation*: \`Loss = Notional ($${notional}) × (BTC Shock (${shockPct}%) × Beta (${beta.toFixed(2)}))\`. Auditable via provenance record \`prov-assumption-CRYPTO_CONTAGION\`.`,
      referencedProvenanceIds: ["SCENARIO_CRYPTO_CONTAGION", "PARSED_TRADE_IDEA", "prov-assumption-CRYPTO_CONTAGION", "prov-calc-scenarios"],
      calculatedMetric: {
        label: `BTC -${shockPct}% Shock Loss`,
        originalValue: `$${baselineShortfall.toLocaleString()}`,
        projectedValue: `$${projectedLoss.toLocaleString()}`,
        impact: impactText
      }
    };
  }

  // 2. Basis Risk & Session Query: "Why is basis risk elevated?"
  if (
    normalizedQuery.includes("basis") ||
    normalizedQuery.includes("session") ||
    normalizedQuery.includes("off-hours") ||
    normalizedQuery.includes("why is basis")
  ) {
    const basisBps = artifact.marketState.basisPct ? Math.round(artifact.marketState.basisPct * 10000) : 0;
    const session = artifact.marketState.sessionStatus;
    const isOffHours = session === "WEEKEND" || session === "OFF_HOURS" || session === "HOLIDAY";

    return {
      id,
      timestamp,
      query,
      replyType: "explanation",
      content:
        `**Basis Spread Risk Breakdown**:\n\n` +
        `• **Active Market Session**: **${session}** (${isOffHours ? "Off-hours synthetic pricing" : "Cash market open"}).\n` +
        `• **Current Basis Gap**: **${basisBps} bps** between Bitget tokenized spot and U.S. cash equity reference.\n\n` +
        `During ${session} sessions, tokenized equities trade 24/7 on synthetic automated market-maker liquidity while underlying NASDAQ/NYSE orderbooks are dark. ` +
        `If crypto sentiment or off-hours speculation moves the token away from fair value, you pay an unhedged basis premium. ` +
        `When regular U.S. trading opens, arbitrageurs immediately compress this spread, causing an instant mean-reversion loss on illiquid weekend entries.\n\n` +
        `The desk tests for a **+300 bps basis widening** shock under scenario \`TOKEN_MICROSTRUCTURE\`.`,
      referencedProvenanceIds: [
        "CALC_OFF_HOURS_BASIS_SPREAD",
        "MARKET_SESSION_TYPE",
        "SCENARIO_BASIS_WIDENING",
        "prov-calc-basis",
        "prov-source-bitget-rtoken",
        "prov-assumption-TOKEN_MICROSTRUCTURE"
      ]
    };
  }

  // 3. Resizing / Getting Proceed Query: "How can I get PROCEED?"
  if (
    normalizedQuery.includes("proceed") ||
    normalizedQuery.includes("resize") ||
    normalizedQuery.includes("reduce") ||
    normalizedQuery.includes("how to fix") ||
    normalizedQuery.includes("adjust")
  ) {
    const currentVerdict = artifact.decision.verdict;
    const size = Math.max(0, artifact.trade.positionSizeUsd || 0);

    if (currentVerdict === "PROCEED") {
      return {
        id,
        timestamp,
        query,
        replyType: "explanation",
        content:
          `Your trade already has a **PROCEED** verdict! Your position size ($${size.toLocaleString()}) and thesis satisfy desk risk policy. ` +
          `To maintain this status, ensure you execute limit orders rather than aggressive market orders to prevent taking slippage on off-hours orderbooks.`,
        referencedProvenanceIds: ["DECISION_VERDICT", "prov-ai-assessment", "prov-calc-scenarios"]
      };
    }

    const recommendedSize = size > 0 ? Math.max(10, Math.round((size * 0.5) / 10) * 10) : 500;

    return {
      id,
      timestamp,
      query,
      replyType: "explanation",
      content:
        `To upgrade your current verdict (**${currentVerdict}**) toward **PROCEED**, apply the following actionable change conditions:\n\n` +
        `1. **Downsize Notional Exposure**: Cut position from **$${size.toLocaleString()}** to **$${recommendedSize.toLocaleString()}** (a 50% cut). This pulls your size below the off-hours depth threshold and reduces worst-case expected shortfall.\n` +
        `2. **Wait for Cash Session (14:30 UTC)**: If you require full $${size.toLocaleString()} sizing, postpone execution until primary equity markets open, expanding orderbook depth by 10x-20x and collapsing the basis spread.\n` +
        `3. **Anchor Thesis Invalidation**: Define a strict stop-loss price and maximum basis tolerance (e.g. abort if basis spread exceeds 150 bps).`,
      referencedProvenanceIds: ["DECISION_VERDICT", "ACTIONABLE_CONDITIONS", "prov-ai-assessment", "prov-calc-scenarios"],
      calculatedMetric: {
        label: "Recommended Sizing",
        originalValue: `$${size.toLocaleString()}`,
        projectedValue: `$${recommendedSize.toLocaleString()}`,
        impact: "-50% liquidity absorption"
      }
    };
  }

  // 4. Multi-Asset Comparison: "Compare with rTSLA / rNVDA"
  const compMatch = normalizedQuery.match(/(?:compare|vs)\s+(?:with\s+)?(r?[A-Z]{3,5})/i);
  if (compMatch) {
    const rawMatch = compMatch[1];
    let targetSymbol = rawMatch.toLowerCase().startsWith("r")
      ? `r${rawMatch.slice(1).toUpperCase()}`
      : `r${rawMatch.toUpperCase()}`;
    const currentSymbol = artifact.trade.asset || "rNVDA";

    if (targetSymbol === currentSymbol) {
      targetSymbol = currentSymbol === "rNVDA" ? "rTSLA" : "rNVDA";
    }

    const currentProfile = ASSET_RISK_PROFILES[currentSymbol] ?? ASSET_RISK_PROFILES.DEFAULT;
    const targetProfile = ASSET_RISK_PROFILES[targetSymbol] ?? ASSET_RISK_PROFILES.DEFAULT;

    const betaDiff = targetProfile.betaToBtc - currentProfile.betaToBtc;
    const betaNote = betaDiff > 0
      ? `${targetSymbol} has higher crypto spillover (+${betaDiff.toFixed(2)})`
      : betaDiff < 0
      ? `${currentSymbol} has higher crypto spillover (+${Math.abs(betaDiff).toFixed(2)})`
      : "Identical crypto spillover";

    const volDiff = targetProfile.volScalar - currentProfile.volScalar;
    const volNote = volDiff > 0
      ? `${targetSymbol} experiences wider swings`
      : volDiff < 0
      ? `${currentSymbol} experiences wider swings`
      : "Comparable historical volatility";

    const deskTake = currentProfile.betaToBtc < targetProfile.betaToBtc
      ? `${currentSymbol} offers structurally lower tail contagion.`
      : currentProfile.betaToBtc > targetProfile.betaToBtc
      ? `${targetSymbol} offers structurally lower tail contagion.`
      : `both assets exhibit identical beta transmission to BTC.`;

    return {
      id,
      timestamp,
      query,
      replyType: "comparison",
      content:
        `**Comparative Risk Profile: ${currentSymbol} vs ${targetSymbol}**\n\n` +
        `| Metric | ${currentSymbol} (Current) | ${targetSymbol} (Alternative) | Risk Transmission |\n` +
        `| :--- | :--- | :--- | :--- |\n` +
        `| **Beta to BTC** | **${currentProfile.betaToBtc.toFixed(2)}** | **${targetProfile.betaToBtc.toFixed(2)}** | ${betaNote} |\n` +
        `| **Vol Scalar** | **${currentProfile.volScalar.toFixed(2)}x** | **${targetProfile.volScalar.toFixed(2)}x** | ${volNote} |\n` +
        `| **Borrow Cost** | **${(currentProfile.dailyBorrowPct * 100).toFixed(1)}%/day** | **${(targetProfile.dailyBorrowPct * 100).toFixed(1)}%/day** | Cost of holding through weekend |\n\n` +
        `*Desk Take*: If holding over a low-liquidity weekend with heightened BTC volatility risk, ${deskTake}`,
      referencedProvenanceIds: [
        "PARSED_TRADE_IDEA",
        "SCENARIO_CRYPTO_CONTAGION",
        "prov-assumption-CRYPTO_CONTAGION",
        "prov-calc-scenarios"
      ]
    };
  }

  // 5. Open-Ended Grounded Synthesis
  const challenges = artifact.challenge?.vulnerableAssumptions || [];
  const primaryChallenge = challenges[0] || artifact.challenge?.counterThesis || "Unhedged off-hours tail gap exposure";
  const precedent = artifact.thesisPosition?.historicalScenarios?.precedents?.[0];

  return {
    id,
    timestamp,
    query,
    replyType: "grounded_synthesis",
    content:
      `**RedTeam Desk Research Synthesis** for query: *"${query}"*\n\n` +
      `• **Core Thesis Stress**: The desk evaluated your proposal (**${artifact.trade.direction} ${artifact.trade.asset} $${artifact.trade.positionSizeUsd.toLocaleString()}**) and assigned a **${artifact.decision.verdict}** verdict.\n` +
      `• **Key Vulnerability**: ${primaryChallenge}.\n` +
      (precedent
        ? `• **Historical Parallels**: Under the matched **${precedent.eventName}** precedent, similar trades suffered **${precedent.peakDrawdownPct}%** drawdowns and took **${precedent.reAnchorHours} hours** to recover basis parity.\n`
        : "") +
      `• **Policy Threshold**: Maximum acceptable expected shortfall under stress is capped by desk risk policy. You can ask *"What if BTC drops 15%?"* or *"How to get PROCEED?"* for deterministic parameter exploration.`,
    referencedProvenanceIds: [
      "DECISION_VERDICT",
      "THESIS_ASSESSMENT",
      "prov-ai-thesis",
      "prov-ai-assessment"
    ]
  };
}
