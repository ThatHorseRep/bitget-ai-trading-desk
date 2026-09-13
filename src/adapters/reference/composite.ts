import type { ReferencePriceProvider, ReferencePriceQuote } from "./types";
import { YahooReferenceProvider } from "./yahoo";

export class CompositeReferenceProvider implements ReferencePriceProvider {
  private providers: ReferencePriceProvider[];

  constructor(providers?: ReferencePriceProvider[]) {
    this.providers = providers && providers.length > 0 ? providers : [new YahooReferenceProvider()];
  }

  async getReferencePrice(symbol: string): Promise<ReferencePriceQuote> {
    const errors: string[] = [];
    for (const provider of this.providers) {
      try {
        const quote = await provider.getReferencePrice(symbol);
        return quote;
      } catch (err) {
        errors.push((err as Error).message);
      }
    }

    throw new Error(`All reference price providers failed for ${symbol}: ${errors.join("; ")}`);
  }
}


