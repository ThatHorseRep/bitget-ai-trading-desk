require("dotenv").config({ path: ".env.local" });
const { DecisionDeskService } = require("./dist-core/src/services/decisionDeskService");

async function main() {
    console.log("Starting real E2E test...");
    const service = new DecisionDeskService();
    
    // Patch LLM client so we can log calls
    const llmClient = require("./dist-core/src/core/thesis/llmClient");
    const originalGetSeekAiClient = llmClient.getSeekAiClient;
    llmClient.getSeekAiClient = function() {
        const client = originalGetSeekAiClient.apply(this, arguments);
        const originalChat = client.chat;
        client.chat = async function(req) {
            console.log("-> Sending LLM request (messages:", req.messages.length, ")");
            const start = Date.now();
            try {
                const res = await originalChat.apply(this, arguments);
                console.log("<- LLM responded in", Date.now() - start, "ms. Length:", res.content.length);
                console.log("--- LLM RESPONSE START ---");
                console.log(res.content);
                console.log("--- LLM RESPONSE END ---");
                return res;
            } catch (e) {
                console.log("<- LLM failed in", Date.now() - start, "ms", e.message);
                throw e;
            }
        };
        return client;
    };
    
    console.log("Calling runWorkflow...");
    const result = await service.runWorkflow("I want to buy $10k of rNVDA token because the new model looks amazing.", { useFixture: true });
    
    console.log("Workflow completed.");
    if (result.step === "ERROR") {
        console.error("Workflow error:", result.limitations);
        process.exit(1);
    }
    
    console.log("Verdict:", result.artifact?.decision?.verdict);
    console.log("Thesis Quality:", result.artifact?.thesisPosition?.thesisQuality);
    console.log("Counter Thesis:", result.artifact?.challenge?.counterThesis);
    console.log("Assumptions extracted:", result.artifact?.thesis?.assumptions?.length);
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
