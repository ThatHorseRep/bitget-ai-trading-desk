import { BitgetUsEquityMcpProvider } from "../adapters/research/bitgetUsEquityMcpProvider.js";

async function main() {
  const provider = new BitgetUsEquityMcpProvider();
  console.log("Checking provider status...");
  const status = await provider.getStatus();
  console.log("Provider status:", status);
  
  if (status === "AVAILABLE") {
    console.log("Fetching observations for AAPL...");
    const observations = await provider.getObservations("AAPL");
    console.log("Observations retrieved:", JSON.stringify(observations, null, 2));
  } else {
    console.log("Provider is UNAVAILABLE, skipping observations fetch.");
  }
}

main().catch(console.error);
