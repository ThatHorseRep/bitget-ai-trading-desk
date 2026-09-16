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
              messages,
              stream: true
          }),
          signal: AbortSignal.timeout(120000)
        });
        
        console.log(`Status: ${response.status} (${Date.now() - start}ms)`);
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            process.stdout.write(chunk);
        }
        console.log(`\n\nFinished in ${Date.now() - start}ms`);
    } catch (e) {
        console.error(`Error (${Date.now() - start}ms):`, e.message);
    }
}

async function main() {
    await test([
        { role: "system", content: "You are a quantitative trading risk analyst. Your job is to deconstruct a trader's natural language trade idea into a structured thesis. Extract the core assumptions. Identify external dependencies. Define invalidation conditions. Tag each item's origin." },
        { role: "user", content: "Trade Details: I want to buy $10k of rNVDA token because the new model looks amazing." }
    ], "Stream test");
}

main();
