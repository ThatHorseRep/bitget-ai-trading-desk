require("dotenv").config({ path: ".env.local" });

async function test(messages, name) {
    console.log(`\n--- Testing ${name} ---`);
    const start = Date.now();
    try {
        const response = await fetch(process.env.LLM_API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LLM_API_KEY}`
          },
          body: JSON.stringify({
              model: process.env.LLM_MODEL,
              messages
          }),
          signal: AbortSignal.timeout(15000)
        });
        const text = await response.text();
        console.log(`Status: ${response.status} (${Date.now() - start}ms)`);
        console.log("Response:", text.substring(0, 200));
    } catch (e) {
        console.error(`Error (${Date.now() - start}ms):`, e.message);
    }
}

async function main() {
    await test([{ role: "user", content: "Hi" }], "User only");
    await test([{ role: "system", content: "You are helpful." }, { role: "user", content: "Hi" }], "System + User");
}

main();
