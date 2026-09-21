import { NextResponse } from "next/server";

// Simple in-memory rate limiting shared by API routes (clears on server
// restart; per-instance on serverless, which is acceptable for a demo's
// abuse-cost bounding).
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function cleanupExpired(now: number) {
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) rateLimitMap.delete(key);
    }
  }
}

export function checkRateLimit(ip: string, maxRequests: number): boolean {
  const now = Date.now();
  cleanupExpired(now);

  const record = rateLimitMap.get(ip);
  if (record) {
    if (now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      return true;
    }
    if (record.count >= maxRequests) {
      return false;
    }
    record.count++;
    return true;
  }
  rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  return true;
}

export function rateLimitExceededResponse(): NextResponse {
  return NextResponse.json(
    {
      step: "ERROR",
      parsedResult: null,
      artifact: null,
      limitations: ["Rate limit exceeded. Please try again later."],
    },
    { status: 429 }
  );
}
