/**
 * Zod schemas for the six documented bitget-mcp-server tool categories.
 *
 * These schemas define the *expected* response shapes based on the GitBook
 * documentation categories. Because the exact JSON-RPC tool names and payloads
 * are unknown until `client.listTools()` succeeds against a live endpoint,
 * every schema uses `.passthrough()` so extra fields from the server are
 * preserved rather than stripped.
 *
 * Once the real tool schemas are discovered, tighten `.passthrough()` to
 * `.strict()` and adjust field names to match reality.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// 1. Quotes & History
// ---------------------------------------------------------------------------

export const QuoteResponseSchema = z
  .object({
    symbol: z.string(),
    price: z.number().optional(),
    open: z.number().optional(),
    high: z.number().optional(),
    low: z.number().optional(),
    close: z.number().optional(),
    volume: z.number().optional(),
    timestamp: z.string().optional(),
  })
  .passthrough();

export const KlineResponseSchema = z
  .object({
    symbol: z.string(),
    interval: z.string().optional(),
    candles: z
      .array(
        z
          .object({
            open: z.number(),
            high: z.number(),
            low: z.number(),
            close: z.number(),
            volume: z.number(),
            timestamp: z.string(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// 2. Fundamentals
// ---------------------------------------------------------------------------

export const CompanyProfileSchema = z
  .object({
    symbol: z.string(),
    companyName: z.string().optional(),
    sector: z.string().optional(),
    industry: z.string().optional(),
    marketCap: z.number().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const FinancialStatementSchema = z
  .object({
    symbol: z.string(),
    period: z.string().optional(),
    revenue: z.number().optional(),
    netIncome: z.number().optional(),
    eps: z.number().optional(),
  })
  .passthrough();

export const EarningsCalendarSchema = z
  .object({
    symbol: z.string(),
    date: z.string().optional(),
    epsEstimate: z.number().optional(),
    epsActual: z.number().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// 3. Corporate Actions
// ---------------------------------------------------------------------------

export const CorporateActionSchema = z
  .object({
    symbol: z.string(),
    actionType: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// 4. Institutional & Analyst
// ---------------------------------------------------------------------------

export const AnalystEstimateSchema = z
  .object({
    symbol: z.string(),
    targetPrice: z.number().optional(),
    consensusRating: z.string().optional(),
    forwardPE: z.number().optional(),
    forwardEPS: z.number().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// 5. ETF
// ---------------------------------------------------------------------------

export const EtfDataSchema = z
  .object({
    symbol: z.string(),
    name: z.string().optional(),
    holdings: z
      .array(z.object({ symbol: z.string(), weight: z.number() }).passthrough())
      .optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// 6. News & Sentiment
// ---------------------------------------------------------------------------

export const NewsItemSchema = z
  .object({
    title: z.string(),
    summary: z.string().optional(),
    url: z.string().optional(),
    publishedAt: z.string().optional(),
    sentiment: z.string().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Category map — used by the provider to route tool calls by category name
// ---------------------------------------------------------------------------

export const TOOL_CATEGORIES = [
  "quotes",
  "fundamentals",
  "corporate_actions",
  "institutional_analyst",
  "etf",
  "news_sentiment",
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];
