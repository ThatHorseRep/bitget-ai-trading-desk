const assert = require("node:assert/strict");
const { test, beforeEach, afterEach } = require("node:test");
const { sharedLlmClient, GEMINI_MODELS } = require("../dist-core/src/core/thesis/llmClient.js");

// Regression tests for the Qwen3 "thinking" latency fix (2026-09-21):
// the hackathon gateway's qwen3.8-max burned 30-90s+ in reasoning_content
// per call with thinking enabled (two 90s timeouts degraded a live workflow),
// while enable_thinking:false cut the same calls to seconds. The client must
// default to thinking OFF and only opt in via LLM_ENABLE_THINKING=1.
// These tests stub global.fetch so nothing leaves the machine.

function stubFetch(captured) {
  const real = global.fetch;
  global.fetch = async (url, init) => {
    captured.push({ url: String(url), body: JSON.parse(init.body) });
    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '{"ok":true}' } }] }),
      text: async () => '{"choices":[{"message":{"content":"{\\"ok\\":true}"}}]}',
    };
  };
  return () => {
    global.fetch = real;
  };
}

async function withEnv(overrides, fn) {
  const keys = ["LLM_API_BASE_URL", "LLM_API_KEY", "LLM_ENABLE_THINKING"];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  process.env.LLM_API_BASE_URL = "https://llm.example.invalid/v1/chat/completions";
  process.env.LLM_API_KEY = "test-key-not-real";
  delete process.env.LLM_ENABLE_THINKING;
  Object.assign(process.env, overrides);
  try {
    await fn();
  } finally {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

test("llmClient sends enable_thinking:false by default (thinking-model latency fix)", async () => {
  const captured = [];
  const restore = stubFetch(captured);
  try {
    await withEnv({}, async () => {
      const res = await sharedLlmClient.chat({ messages: [{ role: "user", content: "Return json: {\"ok\": true}" }] });
      assert.equal(res.content, '{"ok":true}');
      assert.equal(captured.length, 1);
      assert.equal(captured[0].body.enable_thinking, false, "thinking must be disabled by default");
      assert.deepEqual(captured[0].body.response_format, { type: "json_object" });
      assert.equal(captured[0].body.stream, false);
    });
  } finally {
    restore();
  }
});

test("llmClient omits enable_thinking when LLM_ENABLE_THINKING=1 (opt-in)", async () => {
  const captured = [];
  const restore = stubFetch(captured);
  try {
    await withEnv({ LLM_ENABLE_THINKING: "1" }, async () => {
      await sharedLlmClient.chat({ messages: [{ role: "user", content: "Return json: {\"ok\": true}" }] });
      assert.equal(captured.length, 1);
      assert.equal(
        "enable_thinking" in captured[0].body,
        false,
        "opt-in must leave the payload untouched for endpoints without the flag",
      );
    });
  } finally {
    restore();
  }
});

test("GEMINI_MODELS cascade excludes deprecated models and prioritizes resilient list", () => {
  assert.equal(GEMINI_MODELS.includes("gemini-2.0-flash"), false, "gemini-2.0-flash is shut down and must be excluded");
  assert.equal(GEMINI_MODELS.includes("gemini-1.5-flash"), false, "gemini-1.5-flash is deprecated and must be excluded");
  assert.deepEqual(GEMINI_MODELS, [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-flash-lite-latest"
  ]);
});

test("Gemini API call transmits x-goog-api-key in request headers and removes ?key= from URL", async () => {
  const captured = [];
  const real = global.fetch;
  global.fetch = async (url, init) => {
    captured.push({
      url: String(url),
      headers: init && init.headers ? init.headers : {},
      body: init && init.body ? JSON.parse(init.body) : null
    });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: JSON.stringify({ thesisQuality: "STRONGER", explanation: "Header security test pass" }) }] }
        }]
      }),
      text: async () => JSON.stringify({
        candidates: [{
          content: { parts: [{ text: JSON.stringify({ thesisQuality: "STRONGER", explanation: "Header security test pass" }) }] }
        }]
      })
    };
  };

  const keys = ["LLM_API_BASE_URL", "LLM_API_KEY", "GEMINI_API_KEY", "DISABLE_LLM_FAILOVER", "TEST_MODE"];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  delete process.env.TEST_MODE;
  delete process.env.DISABLE_LLM_FAILOVER;
  process.env.GEMINI_API_KEY = "test-gemini-secret-key-xyz123";
  process.env.LLM_API_BASE_URL = "https://hackathon.bitgetops.com/v1";
  delete process.env.LLM_API_KEY;

  try {
    const res = await sharedLlmClient.chat({ messages: [{ role: "user", content: "Evaluate" }] });
    assert.equal(captured.length, 1);
    const geminiCall = captured[0];

    // Verify Clean URL without ?key= parameter
    assert.equal(geminiCall.url.includes("?key="), false, "Gemini URL must not expose ?key= query string");
    assert.equal(geminiCall.url.includes("test-gemini-secret-key-xyz123"), false, "API key must never appear in URL");
    assert.equal(geminiCall.url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");

    // Verify Header Authentication
    assert.equal(geminiCall.headers["x-goog-api-key"], "test-gemini-secret-key-xyz123", "API key must be sent via x-goog-api-key header");
    assert.equal(geminiCall.headers["Content-Type"], "application/json");

    // Verify Response Provenance
    assert.equal(res.provenance.provider, "Google Gemini");
    assert.equal(res.provenance.circuitState, "FAILOVER_GEMINI");
  } finally {
    global.fetch = real;
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
});

test("Gemini failover is triggered when primary LLM returns 500, keeping API key in headers", async () => {
  const captured = [];
  const real = global.fetch;
  global.fetch = async (url, init) => {
    const urlStr = String(url);
    captured.push({
      url: urlStr,
      headers: init && init.headers ? init.headers : {}
    });

    if (urlStr.includes("generativelanguage.googleapis.com")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ thesisQuality: "ACCEPTABLE" }) }] } }]
        }),
        text: async () => JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ thesisQuality: "ACCEPTABLE" }) }] } }]
        })
      };
    }

    // Primary returns 500
    return {
      ok: false,
      status: 500,
      text: async () => "Internal server error"
    };
  };

  const keys = ["LLM_API_BASE_URL", "LLM_API_KEY", "GEMINI_API_KEY", "DISABLE_LLM_FAILOVER", "TEST_MODE"];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  delete process.env.TEST_MODE;
  delete process.env.DISABLE_LLM_FAILOVER;
  process.env.GEMINI_API_KEY = "test-failover-secret-456";
  process.env.LLM_API_BASE_URL = "https://hackathon.bitgetops.com/v1";
  process.env.LLM_API_KEY = "dummy-qwen-key";

  try {
    const res = await sharedLlmClient.chat({ messages: [{ role: "user", content: "Evaluate" }] });
    assert.equal(captured.length, 2, "Should attempt primary then failover to Gemini");
    const [primaryReq, geminiReq] = captured;
    assert.match(primaryReq.url, /chat\/completions/);
    assert.equal(geminiReq.url.includes("?key="), false);
    assert.equal(geminiReq.headers["x-goog-api-key"], "test-failover-secret-456");
    assert.equal(res.provenance.circuitState, "FAILOVER_GEMINI");
  } finally {
    global.fetch = real;
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
});

test("Gemini model cascade cascades to next model when first model fails", async () => {
  const attemptedModels = [];
  const real = global.fetch;
  global.fetch = async (url, init) => {
    const urlStr = String(url);
    if (urlStr.includes("generativelanguage.googleapis.com")) {
      const match = urlStr.match(/\/models\/([^:]+):generateContent/);
      if (match) attemptedModels.push(match[1]);

      assert.equal(urlStr.includes("?key="), false);
      assert.equal(init?.headers?.["x-goog-api-key"], "test-cascade-secret");

      // First model (gemini-2.5-flash) returns 404
      if (match && match[1] === "gemini-2.5-flash") {
        return {
          ok: false,
          status: 404,
          text: async () => "Model not found"
        };
      }

      // Second model (gemini-2.5-flash-lite) succeeds
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ thesisQuality: "STRONGER" }) }] } }]
        }),
        text: async () => JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ thesisQuality: "STRONGER" }) }] } }]
        })
      };
    }

    return { ok: false, status: 500, text: async () => "Fail" };
  };

  const keys = ["LLM_API_BASE_URL", "LLM_API_KEY", "GEMINI_API_KEY", "DISABLE_LLM_FAILOVER", "TEST_MODE"];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  delete process.env.TEST_MODE;
  delete process.env.DISABLE_LLM_FAILOVER;
  process.env.GEMINI_API_KEY = "test-cascade-secret";
  process.env.LLM_API_BASE_URL = "https://hackathon.bitgetops.com/v1";
  delete process.env.LLM_API_KEY;

  try {
    const res = await sharedLlmClient.chat({ messages: [{ role: "user", content: "Evaluate" }] });
    assert.deepEqual(attemptedModels, ["gemini-2.5-flash", "gemini-2.5-flash-lite"]);
    assert.match(res.provenance.model, /^gemini-2\.5-flash-lite/);
  } finally {
    global.fetch = real;
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
});
