export const maxDuration = 60;

import { NextResponse, type NextRequest } from "next/server";
import { MarketStateService } from "../../../services/marketStateService";
import { z } from "zod";

const requestSchema = z.object({
  asset: z.string().min(1)
}).strict();

export async function GET(request: NextRequest) {
  try {
    const asset = request.nextUrl.searchParams.get("asset");
    if (!asset) {
       return NextResponse.json({ error: "Missing asset parameter" }, { status: 400 });
    }
    
    const parseResult = requestSchema.safeParse({ asset });
    if (!parseResult.success) {
       return NextResponse.json({ error: "Invalid asset parameter" }, { status: 400 });
    }

    const marketStateService = new MarketStateService();
    // useFixture true here? No, the user wants the REAL price.
    const marketState = await marketStateService.getMarketState(parseResult.data.asset, { useFixture: false });
    
    return NextResponse.json({ price: marketState.instrumentPrice, timestamp: marketState.observedAt }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch market price:", error);
    return NextResponse.json({ error: "Failed to fetch market price", price: 0 }, { status: 500 });
  }
}
