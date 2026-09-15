import { BitgetClient } from "../adapters/bitget/client";
import { YahooReferenceProvider } from "../adapters/reference/yahoo";

async function verifyConnectivity() {
  console.log("Starting connectivity verification...\n");

  const bitget = new BitgetClient();
  const yahoo = new YahooReferenceProvider();

  try {
    console.log("1. Fetching rNVDAUSDT instrument from Bitget...");
    const instrument = await bitget.getSpotInstrument("rNVDAUSDT");
    console.log("Instrument:", instrument, "\n");

    console.log("2. Fetching rNVDAUSDT ticker from Bitget...");
    const rNVDATicker = await bitget.getSpotTicker("rNVDAUSDT");
    console.log("rNVDAUSDT ticker:", rNVDATicker, "\n");
  } catch (error) {
    console.error("Failed to fetch rNVDAUSDT:", error);
  }

  try {
    console.log("2. Fetching BTCUSDT from Bitget...");
    const btcTicker = await bitget.getSpotTicker("BTCUSDT");
    console.log("BTCUSDT:", btcTicker, "\n");
  } catch (error) {
    console.error("Failed to fetch BTCUSDT:", error);
  }

  try {
    console.log("3. Fetching NVDA from Yahoo Finance...");
    const nvdaReference = await yahoo.getReferencePrice("NVDA");
    console.log("NVDA Reference:", nvdaReference, "\n");
  } catch (error) {
    console.error("Failed to fetch NVDA from Yahoo:", error);
  }

  console.log("Connectivity verification complete.");
}

verifyConnectivity();


