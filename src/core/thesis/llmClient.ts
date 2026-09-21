// Using global fetch (Node 18+). No external import needed.

export type SeekAiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type SeekAiRequest = {
  model?: string;
  messages: SeekAiMessage[];
  /**
   * Wall-clock budget in milliseconds for this call INCLUDING its single
   * retry. When set, the per-attempt timeout is clamped so attempt + 2s
   * backoff + retry always fits the budget, and the retry is skipped when
   * too little time remains to be useful. Callers under a hard function
   * deadline (e.g. Vercel maxDuration) pass their remaining budget so the
   * workflow degrades to an honest limitation instead of being killed
   * mid-stream (observed 2026-09-21 on the deployed site).
   */
  budgetMs?: number;
  // any additional OpenAI‑compatible parameters can be added here
};

export type SeekAiResponse = {
  content: string;
  provenance: {
    model: string;
    provider: string;
  };
};

class LLMProvider {
  async chat(request: SeekAiRequest, isRetry = false): Promise<SeekAiResponse> {
    const testMode = process.env.TEST_MODE === 'mock_llm';
    if (testMode) {
      return {
        content: JSON.stringify({
          thesisQuality: 'STRONGER',
          keyMismatch: null,
          explanation: 'Mock explanation for testing.'
        }),
        provenance: { model: 'mock-model', provider: 'mock-provider' }
      };
    }

    let endpoint = process.env.LLM_API_BASE_URL;
    const apiKey = process.env.LLM_API_KEY;
    const model = request.model || process.env.LLM_MODEL || "deepseek-v4-flash";
    
    if (!endpoint || !apiKey) {
      throw new Error("Missing required LLM configuration: LLM_API_BASE_URL and/or LLM_API_KEY");
    }

    if (!endpoint.endsWith('/chat/completions')) {
      endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
    }

    const controller = new AbortController();
    const defaultMs = process.env.VERCEL ? 25000 : 90000;
    const RETRY_BACKOFF_MS = 2000;
    let timeoutMs = defaultMs;
    if (typeof request.budgetMs === "number" && request.budgetMs > 0) {
      // attempt1 + backoff + attempt2 must fit the budget: clamp each
      // attempt to (budget - backoff) / 2. Never below a 5s floor — below
      // that a call is pointless and the budget is already exhausted.
      timeoutMs = Math.min(defaultMs, Math.max(5000, Math.floor((request.budgetMs - RETRY_BACKOFF_MS) / 2)));
      // Skip the retry when even one clamped attempt cannot fit what remains.
      if (request.budgetMs < timeoutMs + RETRY_BACKOFF_MS + 5000) isRetry = true;
    }
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // Qwen3-class "thinking" models on OpenAI-compatible proxies burn 30-90s+
    // in reasoning_content before answering (observed 2026-09-21 on the
    // hackathon gateway: 55s extraction, 90s+ challenge timeouts with thinking
    // on; ~3s with it off). These prompts are strict-schema and designed for
    // fast non-thinking completion, so thinking is disabled by default. Set
    // LLM_ENABLE_THINKING=1 to opt back in for endpoints that support it.
    const enableThinking = process.env.LLM_ENABLE_THINKING === "1";

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ ...request, model, stream: false, response_format: { type: "json_object" }, ...(enableThinking ? {} : { enable_thinking: false }) }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`LLM request failed (${response.status}): ${text}`);
      }
      
      let content = "";
      try {
        const jsonBody = await response.json();
        if (jsonBody.choices && jsonBody.choices[0] && jsonBody.choices[0].message) {
          content = jsonBody.choices[0].message.content || "";
        } else {
          content = JSON.stringify(jsonBody);
        }
      } catch (err) {
        throw new Error("Failed to parse non-stream JSON response: " + (err as Error).message);
      }
      
      // Transparently extract JSON if it's wrapped in markdown
      content = content.trim();
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        content = jsonMatch[1].trim();
      } else {
        // Sometimes it just outputs plain text, try to find the first { or [
        const startIdx = content.indexOf('{');
        const startArrayIdx = content.indexOf('[');
        const firstChar = startIdx !== -1 && (startArrayIdx === -1 || startIdx < startArrayIdx) ? startIdx : startArrayIdx;
        if (firstChar !== -1) {
            const lastBrace = content.lastIndexOf('}');
            const lastBracket = content.lastIndexOf(']');
            const lastChar = Math.max(lastBrace, lastBracket);
            if (lastChar > firstChar) {
                content = content.substring(firstChar, lastChar + 1);
            }
        }
      }
      
      return { 
        content,
        provenance: { model, provider: new URL(endpoint).hostname }
      };
    } catch (err) {
      clearTimeout(timeout);
      const budgetLeft = typeof request.budgetMs === "number" ? request.budgetMs - (timeoutMs + RETRY_BACKOFF_MS) : Infinity;
      if (!isRetry && budgetLeft >= 5000) {
        console.warn("LLM Request failed, retrying once in 2 seconds...");
        await new Promise(r => setTimeout(r, RETRY_BACKOFF_MS));
        return this.chat(request, true);
      }
      console.error("LLM CLIENT ERROR (Retry failed or aborted):", err);
      throw err; // Caller must handle the failure
    }
  }
}

export const sharedLlmClient = new LLMProvider();
export function getSeekAiClient() {
  return sharedLlmClient;
}


