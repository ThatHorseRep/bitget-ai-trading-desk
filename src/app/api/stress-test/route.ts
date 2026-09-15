import { NextResponse, type NextRequest } from "next/server";
import { DecisionDeskService } from "../../../services/decisionDeskService";
import { z } from "zod";
import { BRANDING } from "@/config/branding";

const requestSchema = z.object({
  input: z.string().min(1).max(2000, "Input is too long"),
  useFixture: z.boolean().optional().default(false),
}).strict();

// Simple in-memory rate limiting (Note: clears on server restart)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (record) {
    if (now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      return true;
    }
    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }
    record.count++;
    return true;
  }
  rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
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

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
      return NextResponse.json(
        { step: "ERROR", parsedResult: null, artifact: null, limitations: ["Request body too large."] },
        { status: 413 }
      );
    }

    let rawBody;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { step: "ERROR", parsedResult: null, artifact: null, limitations: ["Malformed JSON in request body."] },
        { status: 400 }
      );
    }

    const parseResult = requestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          step: "ERROR",
          parsedResult: null,
          artifact: null,
          limitations: ["Invalid request payload format."],
        },
        { status: 400 }
      );
    }

    const { input, useFixture } = parseResult.data;
    const deskService = new DecisionDeskService();
    const result = await deskService.runWorkflow(input, { useFixture });

    if (result.step === "CLARIFICATION") {
      return NextResponse.json(result, { status: 422 });
    }

    if (result.step === "ERROR") {
      // Assuming ERROR at this stage corresponds to an upstream failure in market state or evidence retrieval.
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // 6. Do not leak secrets, raw stack traces, API keys, or unnecessary provider internals to the client.
    // 7. Ensure error messages are useful to the user but safe to expose.
    console.error("Internal service error:", error);
    return NextResponse.json(
      {
        step: "ERROR",
        parsedResult: null,
        artifact: null,
        limitations: ["An internal error occurred while processing your request."],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // 12. Ensure the GET health route does not imply that dependencies are healthy if they have not actually been checked.
  // 13. Do not expose internal architecture details unnecessarily in the health response.
  return NextResponse.json({
    service: BRANDING.PRODUCT_NAME,
    status: "OK",
    version: "0.1.0",
  });
}



