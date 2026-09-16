import { DecisionDeskService } from "./src/services/decisionDeskService";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
    console.log("Starting real E2E test...");
    const service = new DecisionDeskService();
    const result = await service.runWorkflow("I want to buy $10k of TSLA token because the new model looks amazing.", { useFixture: true });
    
    if (result.step === "ERROR") {
        console.error("Workflow error:", result.limitations);
        process.exit(1);
    }
    
    console.log("Verdict:", result.artifact?.decision.verdict);
    console.log("Thesis Quality:", result.artifact?.thesisPosition.thesisQuality);
    console.log("Counter Thesis:", result.artifact?.challenge.counterThesis);
    console.log("Assumptions extracted:", result.artifact?.thesis.assumptions.length);
}

main().catch(e => { console.error(e); process.exit(1); });
