import { DecisionDeskService } from "./src/services/decisionDeskService";
import { rnvdaDemoMarketState } from "./src/fixtures/rnvda-demo";

async function runTests() {
  const service = new DecisionDeskService();
  const input = "I am thinking about buying $2,000 of rNVDA before Monday because AI infrastructure demand still looks strong.";

  console.log("=== RUNNING DEMO MODE 5 TIMES ===");
  let firstArtifactJson = null;

  for (let i = 1; i <= 5; i++) {
    const result = await service.runWorkflow(input, { useFixture: true });
    
    if (result.step !== "DECISION_READY" || !result.artifact) {
      throw new Error(`Run ${i} failed to reach DECISION_READY.`);
    }

    const artifact = result.artifact;

    // Verify fixture inputs are identical
    if (artifact.marketState.scenarioId !== "RNVDA_WEEKEND_REFERENCE_SCENARIO_V1") {
      throw new Error(`Run ${i}: Expected scenarioId RNVDA_WEEKEND_REFERENCE_SCENARIO_V1`);
    }
    
    // Verify deterministic outputs are identical
    // Except for artifactId which is randomly generated
    const cleanArtifact = { ...artifact, artifactId: "MOCKED" };
    const currentArtifactJson = JSON.stringify(cleanArtifact);
    
    if (i === 1) {
      firstArtifactJson = currentArtifactJson;
    } else {
      if (currentArtifactJson !== firstArtifactJson) {
        throw new Error(`Run ${i}: Output was not identical to run 1!`);
      }
    }

    // Verify no fixture timestamp is rewritten
    if (artifact.generatedAt !== rnvdaDemoMarketState.observedAt) {
      throw new Error(`Run ${i}: generatedAt was rewritten. Expected ${rnvdaDemoMarketState.observedAt}, got ${artifact.generatedAt}`);
    }
    
    if (artifact.marketState.observedAt !== rnvdaDemoMarketState.observedAt) {
      throw new Error(`Run ${i}: observedAt was rewritten.`);
    }
    
    console.log(`Run ${i} passed. Verdict: ${artifact.decision.verdict}`);
  }

  console.log("All 5 fixture runs are completely deterministic and identical.");

  console.log("\n=== RUNNING LIVE MODE ===");
  try {
    const liveResult = await service.runWorkflow(input, { useFixture: false });
    if (liveResult.artifact) {
      console.log(`Live run completed. Verdict: ${liveResult.artifact.decision.verdict}`);
      console.log(`Live MarketState observedAt: ${liveResult.artifact.marketState.observedAt}`);
      console.log(`Live generatedAt: ${liveResult.artifact.generatedAt}`);
      if (liveResult.artifact.marketState.isSynthetic) {
        throw new Error("Live run incorrectly flagged as synthetic.");
      }
    } else {
      console.log(`Live run did not reach DECISION_READY. Step: ${liveResult.step}`);
      console.log(`Limitations: ${liveResult.limitations.join(", ")}`);
    }
  } catch (err) {
    console.error("Live run threw an error (which might be expected if APIs are missing):", err);
  }
}

runTests().catch(console.error);
