require("dotenv").config({ path: ".env.local" });

async function test(messages, name) {
    console.log(`\n--- Testing ${name} ---`);
    const start = Date.now();
    try {
        const response = await fetch("https://hackathon.bitgetops.com/v1/chat/completions", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LLM_API_KEY}`
          },
          body: JSON.stringify({
              model: process.env.LLM_MODEL || "qwen3.8-max",
              messages
          }),
          signal: AbortSignal.timeout(25000)
        });
        const text = await response.text();
        console.log(`Status: ${response.status} (${Date.now() - start}ms)`);
        console.log("Response:", text.substring(0, 200));
    } catch (e) {
        console.error(`Error (${Date.now() - start}ms):`, e.message);
    }
}

async function main() {
    await test([
        { role: "system", content: "You are a quantitative trading risk analyst. Your job is to deconstruct a trader's natural language trade idea into a structured thesis. Extract the core assumptions. Identify external dependencies. Define invalidation conditions. Tag each item's origin." },
        { role: "user", content: "Hi" }
    ], "Complex System + Simple User");
}

main();
