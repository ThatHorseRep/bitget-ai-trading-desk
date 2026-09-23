/**
 * Role of the LLM:
 * The LLM's remaining responsibilities, and ONLY these:
 * - parsing the trader's free-text thesis into the ThesisSignals booleans
 *   (it extracts, it does not score)
 * - writing the adversarial interrogation questions
 * - writing the narrative explanation of a verdict it did not decide
 * - summarising retrieved precedents
 *
 * The LLM performs extraction and explanation; verdict thresholds are deterministic and unit-tested.
 */

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

function extractCleanJson(raw: string): string {
  let content = raw.trim();
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    content = jsonMatch[1].trim();
  } else {
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
  return content;
}

class LLMProvider {
  private async callGemini(request: SeekAiRequest): Promise<SeekAiResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const systemMessage = request.messages.find(m => m.role === 'system')?.content;
    const conversationMessages = request.messages.filter(m => m.role !== 'system');

    const contents = conversationMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload: Record<string, unknown> = {
      contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Evaluate' }] }],
      generationConfig: { responseMimeType: "application/json" }
    };
    if (systemMessage) {
      payload.systemInstruction = { parts: [{ text: systemMessage }] };
    }

    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastErr: unknown = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Gemini ${model} returned ${res.status}: ${errText}`);
        }

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const content = extractCleanJson(rawText);

        return {
          content,
          provenance: {
            model,
            provider: "Google Gemini"
          }
        };
      } catch (err) {
        lastErr = err;
      }
    }

    throw lastErr || new Error("Gemini API call failed");
  }

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

    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    let endpoint = process.env.LLM_API_BASE_URL || 'https://hackathon.bitgetops.com/v1';
    let apiKey = process.env.LLM_API_KEY;
    let model = request.model || process.env.LLM_MODEL || 'qwen3.8-max';

    // Auto-correct if environment variables are inverted (LLM_API_KEY containing model name like qwen3.8-max)
    if (apiKey && apiKey.toLowerCase().startsWith('qwen') && model && !model.toLowerCase().startsWith('qwen')) {
      const temp = apiKey;
      apiKey = model;
      model = temp;
    }

    let resolvedEndpoint = endpoint;
    
    if (!resolvedEndpoint || !apiKey) {
      if (hasGemini) {
        return this.callGemini(request);
      }
      throw new Error("Missing required LLM configuration: LLM_API_BASE_URL and/or LLM_API_KEY");
    }

    if (!resolvedEndpoint.endsWith('/chat/completions')) {
      resolvedEndpoint = resolvedEndpoint.replace(/\/$/, '') + '/chat/completions';
    }

    const controller = new AbortController();
    const defaultMs = process.env.VERCEL ? 25000 : 90000;
    const RETRY_BACKOFF_MS = 2000;
    let timeoutMs = defaultMs;
    if (typeof request.budgetMs === "number" && request.budgetMs > 0) {
      timeoutMs = Math.min(defaultMs, Math.max(5000, Math.floor((request.budgetMs - RETRY_BACKOFF_MS) / 2)));
      if (request.budgetMs < timeoutMs + RETRY_BACKOFF_MS + 5000) isRetry = true;
    }
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const enableThinking = process.env.LLM_ENABLE_THINKING === "1";

    try {
      const response = await fetch(resolvedEndpoint, {
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
        // If external endpoint failed and Gemini is available, failover to Gemini
        if (hasGemini) {
          console.warn(`External LLM failed (${response.status}), falling back to Gemini...`);
          return await this.callGemini(request);
        }
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
      
      content = extractCleanJson(content);
      
      return { 
        content,
        provenance: { model, provider: new URL(resolvedEndpoint).hostname }
      };
    } catch (err) {
      clearTimeout(timeout);
      if (hasGemini) {
        console.warn("External LLM errored, falling back to Gemini:", err);
        return await this.callGemini(request);
      }
      const budgetLeft = typeof request.budgetMs === "number" ? request.budgetMs - (timeoutMs + RETRY_BACKOFF_MS) : Infinity;
      if (!isRetry && budgetLeft >= 5000) {
        console.warn("LLM Request failed, retrying once in 2 seconds...");
        await new Promise(r => setTimeout(r, RETRY_BACKOFF_MS));
        return this.chat(request, true);
      }
      console.error("LLM CLIENT ERROR (Retry failed or aborted):", err);
      throw err;
    }
  }
}

export const sharedLlmClient = new LLMProvider();
export function getSeekAiClient() {
  return sharedLlmClient;
}


