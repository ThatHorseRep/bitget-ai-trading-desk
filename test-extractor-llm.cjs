require("dotenv").config({ path: ".env.local" });

async function main() {
    const url = process.env.LLM_API_BASE_URL;
    const payload = {
        model: process.env.LLM_MODEL || "qwen3.8-max",
        messages: [
            { role: "system", content: "You are a quantitative trading risk analyst. Your job is to deconstruct a trader's natural language trade idea into a structured thesis. Extract the core assumptions. Identify external dependencies. Define invalidation conditions. Tag each item's origin. Your final output must adhere strictly to the JSON schema." },
            { role: "user", content: "Trade Details: I want to buy $10k of rNVDA token because the new model looks amazing." }
        ]
    };
    
    console.log("Sending payload to", url);
    const start = Date.now();
    try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LLM_API_KEY}`
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000)
        });
        const text = await response.text();
        console.log(`Status: ${response.status} (took ${Date.now() - start}ms)`);
        console.log("Response:", text);
    } catch (e) {
        console.error(`LLM Error after ${Date.now() - start}ms:`, e.message);
    }
}

main().catch(e => { console.error(e); process.exit(1); });
