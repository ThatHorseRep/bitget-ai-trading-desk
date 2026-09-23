const assert = require("node:assert/strict");
const { test, beforeEach, afterEach } = require("node:test");
const { sharedLlmClient } = require("../dist-core/src/core/thesis/llmClient.js");

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
