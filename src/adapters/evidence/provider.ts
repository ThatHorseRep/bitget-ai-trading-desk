import type { EvidenceItem } from "../../domain/decision/types";
import { httpGetJson } from "../network/http";
import type { EvidenceProvider, EvidenceQuery } from "./types";

interface YahooNewsItem {
  uuid?: string;
  title: string;
  publisher?: string;
  link?: string;
  providerPublishTime?: number;
  type?: string;
}

interface YahooSearchResponse {
  news?: YahooNewsItem[];
}

export const CURATED_NVDA_EVIDENCE: EvidenceItem[] = [
  {
    id: "curated-nvda-1",
    title: "Hyperscaler Capex Commitments Point to Sustained Accelerated Computing Demand",
    source: "Bloomberg / SemiAnalysis Industry Intelligence",
    url: "https://www.bloomberg.com/technology",
    publishedAt: "2026-09-10T14:30:00.000Z",
    retrievedAt: "2026-09-12T20:00:00.000Z",
    summary: "Major cloud providers (Microsoft, Alphabet, Meta) reiterated planned capital expenditure increases for AI data center infrastructure through 2026.",
    state: "CURATED_DEMO_FIXTURE",
    provenanceType: "OBSERVED_FACT"
  },
  {
    id: "curated-nvda-2",
    title: "Supply Chain Reports Note CoWoS Packaging Capacity Constraints Remain a Bottleneck",
    source: "DigiTimes Asia",
    url: "https://www.digitimes.com",
    publishedAt: "2026-09-09T08:00:00.000Z",
    retrievedAt: "2026-09-12T20:00:00.000Z",
    summary: "Advanced packaging availability at TSMC continues to cap maximum quarterly hardware shipment volumes despite strong booking interest.",
    state: "CURATED_DEMO_FIXTURE",
    provenanceType: "OBSERVED_FACT"
  },
  {
    id: "curated-nvda-3",
    title: "Broader Tech Valuation Multiples Under Scrutiny Amid Macro Uncertainty",
    source: "Financial Times Market Briefing",
    url: "https://www.ft.com/markets",
    publishedAt: "2026-09-11T18:00:00.000Z",
    retrievedAt: "2026-09-12T20:00:00.000Z",
    summary: "High enterprise multiples leave semiconductor leaders vulnerable to asymmetric downside on any guidance deceleration or client capex hesitation.",
    state: "CURATED_DEMO_FIXTURE",
    provenanceType: "OBSERVED_FACT"
  }
];

const TRUSTED_ORIGINS = new Set([
  "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com"
]);

export class CompositeEvidenceProvider implements EvidenceProvider {
  private baseUrl: string;

  constructor(baseUrl = "https://query1.finance.yahoo.com") {
    const cleanUrl = baseUrl.replace(/\/$/, "");
    if (!TRUSTED_ORIGINS.has(cleanUrl)) {
      console.warn(`Untrusted base URL: ${cleanUrl}. Falling back to default.`);
      this.baseUrl = "https://query1.finance.yahoo.com";
    } else {
      this.baseUrl = cleanUrl;
    }
  }

  async retrieveEvidence(query: EvidenceQuery): Promise<EvidenceItem[]> {
    const symbol = query.asset.replace(/^r/i, "").replace(/USDT$/i, "");
    
    // Bound the number of external records requested
    const requestedRecords = query.maxRecords ?? 5;
    const maxRecords = Math.min(Math.max(requestedRecords, 1), 10);
    const nowIso = new Date().toISOString();

    let liveRetrievalFailed = false;

    try {
      const url = `${this.baseUrl}/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=${maxRecords}`;
      const res = await httpGetJson<YahooSearchResponse>(url, {
        timeoutMs: 5000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      if (res.news && Array.isArray(res.news) && res.news.length > 0) {
        return res.news.slice(0, maxRecords).map((item, idx) => {
          const publishedAt = item.providerPublishTime
            ? new Date(item.providerPublishTime * 1000).toISOString()
            : undefined;

          return {
            id: item.uuid || `live-news-${idx + 1}`,
            title: item.title,
            source: item.publisher || "Financial News Wire",
            url: item.link,
            publishedAt,
            retrievedAt: nowIso,
            summary: `[Title Only] ${item.title}`,
            state: "LIVE_RETRIEVED",
            provenanceType: "OBSERVED_FACT"
          };
        });
      } else {
        liveRetrievalFailed = true;
      }
    } catch {
      liveRetrievalFailed = true;
    }

    const fallbackEvidence = symbol.toUpperCase().includes("NVDA") 
      ? CURATED_NVDA_EVIDENCE.slice(0, maxRecords)
      : [];
    
    if (liveRetrievalFailed) {
      if (fallbackEvidence.length === 0) {
        return [
          {
            id: "live-unavailable",
            title: "Live Evidence Retrieval Failed",
            source: "System",
            summary: "Could not fetch live evidence. No curated demo fixture available for this asset.",
            state: "UNAVAILABLE",
            retrievedAt: nowIso,
            provenanceType: "OBSERVED_FACT"
          }
        ];
      }
      return [
        {
          id: "live-unavailable",
          title: "Live Evidence Retrieval Failed",
          source: "System",
          summary: "Could not fetch live evidence. Falling back to curated demo fixture.",
          state: "UNAVAILABLE",
          retrievedAt: nowIso,
          provenanceType: "OBSERVED_FACT"
        },
        ...fallbackEvidence.slice(0, Math.max(0, maxRecords - 1))
      ];
    }

    return fallbackEvidence;
  }
}



