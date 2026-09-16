
import { DecisionDeskService } from "./src/services/decisionDeskService";

async function main() {
  const service = new DecisionDeskService();
  const input = "I want to go long $50,000 of RNVDA because NVIDIA earnings are strong.";
  const result = await service.runWorkflow(input, { useFixture: true });
  
  if (result.artifact) {
    console.log(JSON.stringify(result.artifact.provenance, null, 2));
  } else {
    console.log("No artifact generated");
  }
}

main().catch(console.error);

