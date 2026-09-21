export const maxDuration = 60;

import { NextResponse, type NextRequest } from "next/server";
import { DecisionDeskService } from "../../../services/decisionDeskService";
import { z } from "zod";
import { BRANDING } from "@/config/branding";
import { checkRateLimit, rateLimitExceededResponse } from "../../../lib/rateLimit";

const requestSchema = z.object({
  input: z.string().min(1).max(2000, "Input is too long"),
  useFixture: z.boolean().optional().default(false),
}).strict();

const MAX_REQUESTS_PER_WINDOW = 10;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip, MAX_REQUESTS_PER_WINDOW, "stress-test")) {
      return rateLimitExceededResponse();
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
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await deskService.runWorkflow(input, { 
            useFixture, 
            signal: request.signal,
            onProgress: (stageId, message) => {
              try {
                if (!request.signal.aborted) {
                  controller.enqueue(encoder.encode(JSON.stringify({ type: "progress", stageId, message }) + "\n"));
                }
              } catch (e) {
                // Ignore enqueue errors if the client abruptly disconnected and the controller is closed
              }
            }
          });
          
          let status = 200;
          if (result.step === "CLARIFICATION") status = 422;
          else if (result.step === "ERROR") status = 502;
          
          controller.enqueue(encoder.encode(JSON.stringify({ type: "result", status, data: result }) + "\n"));
          controller.close();
        } catch (error) {
          console.error("Internal service error during stream:", error);
          controller.enqueue(encoder.encode(JSON.stringify({ 
            type: "error", 
            status: 500,
            data: {
              step: "ERROR",
              parsedResult: null,
              artifact: null,
              limitations: ["An internal error occurred while processing your request."],
            }
          }) + "\n"));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });
  } catch (error) {
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



