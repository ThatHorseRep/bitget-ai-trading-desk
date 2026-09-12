import { NextResponse, type NextRequest } from "next/server";
import { DecisionDeskService } from "../../../services/decisionDeskService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || (!body.input && typeof body.input !== "string")) {
      return NextResponse.json(
        {
          step: "ERROR",
          parsedResult: null,
          artifact: null,
          limitations: ["Missing or invalid 'input' parameter in request body."]
        },
        { status: 400 }
      );
    }

    const { input, useFixture = false } = body;
    const deskService = new DecisionDeskService();
    const result = await deskService.runWorkflow(input, { useFixture });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal decision desk service error";
    return NextResponse.json(
      {
        step: "ERROR",
        parsedResult: null,
        artifact: null,
        limitations: [message]
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Bitget AI Trading Desk — RedTeam Risk Workbench",
    status: "HEALTHY",
    version: "0.1.0",
    supportedAssets: ["rNVDA", "BTC"],
    referenceMarkets: {
      rNVDA: "NVDA (Nasdaq)",
      BTC: "Bitget USDT Spot"
    },
    defaultScenario: "I'm thinking about buying $2,000 of rNVDA before Monday because AI infrastructure demand still looks strong. Holding existing BTC exposure."
  });
}
