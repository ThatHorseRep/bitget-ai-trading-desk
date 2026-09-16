require("dotenv").config({ path: ".env.local" });
const { getSeekAiClient } = require("./dist-core/src/core/thesis/llmClient");

async function main() {
    const client = getSeekAiClient();
    console.log("Calling LLM directly...");
    const payload = {
        model: process.env.LLM_MODEL || "deepseek-v4-flash",
        messages: [{ role: "user", content: "Hello, what model are you?" }]
    };
    try {
        const resp = await client.chat(payload);
        console.log("Response:", resp.content);
    } catch (e) {
        console.error("LLM Error:", e);
    }
}

main().catch(e => { console.error(e); process.exit(1); });
