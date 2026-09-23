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
    circuitState?: "PRIMARY" | "FAILOVER_GEMINI" | "PROBE_RECOVERY";
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

// Circuit Breaker State for External LLM (Qwen)
type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 1; // Trip on first hard timeout/failure to keep desk fast
  private readonly cooldownMs = 45000; // 45s cooldown before probing Qwen again

  getState(): CircuitState {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime > this.cooldownMs) {
        this.state = "HALF_OPEN";
        return "HALF_OPEN";
      }
    }
    return this.state;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.state = "OPEN";
  }

  getCooldownRemainingSeconds(): number {
    if (this.state !== "OPEN") return 0;
    const remaining = this.cooldownMs - (Date.now() - this.lastFailureTime);
    return Math.max(0, Math.ceil(remaining / 1000));
  }
}

const qwenCircuit = new CircuitBreaker();

class LLMProvider {
  private async callGemini(request: SeekAiRequest, circuitNote?: string): Promise<SeekAiResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY for LLM failover.");
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

    const models = [
      "gemini-flash-lite-latest",
      "gemini-flash-latest",
      "gemini-3.5-flash",
      "gemini-3.6-flash"
    ];
    let lastErr: unknown = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeout);

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
            model: circuitNote ? `${model} (${circuitNote})` : model,
            provider: "Google Gemini",
            circuitState: "FAILOVER_GEMINI"
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
        provenance: { model: 'mock-model', provider: 'mock-provider', circuitState: 'PRIMARY' }
      };
    }

    const isMockOrTestEndpoint =
      Boolean(process.env.LLM_API_BASE_URL?.includes("mock.invalid")) ||
      Boolean(process.env.LLM_API_BASE_URL?.includes("example.invalid")) ||
      process.env.TEST_MODE === "mock_llm" ||
      process.env.DISABLE_LLM_FAILOVER === "1";

    const hasGemini = Boolean(process.env.GEMINI_API_KEY) && !isMockOrTestEndpoint;
    let endpoint = process.env.LLM_API_BASE_URL || 'https://hackathon.bitgetops.com/v1';
    let apiKey = process.env.LLM_API_KEY;
    let model = request.model || process.env.LLM_MODEL || 'qwen3.8-max';

    // Auto-detect inverted API key and Model name
    const looksLikeModel = (val?: string) =>
      Boolean(val && /^(qwen|deepseek|gpt|claude|gemini|meta|llama|mistral)/i.test(val.trim()));
    const looksLikeKey = (val?: string) =>
      Boolean(val && !looksLikeModel(val) && val.trim().length >= 8);

    if (looksLikeModel(apiKey) && looksLikeKey(model)) {
      const temp = apiKey!;
      apiKey = model;
      model = temp;
    }

    // Normalize model for Bitget Hackathon proxy:
    // The proxy strictly permits only 'qwen3.8-max'. If another model name is supplied, normalize it.
    if (endpoint.includes("hackathon.bitgetops.com")) {
      if (!model || model !== "qwen3.8-max") {
        console.warn(`[LLM-CLIENT] Hackathon proxy strictly supports 'qwen3.8-max'. Normalizing requested model '${model}' to 'qwen3.8-max'.`);
        model = "qwen3.8-max";
      }
    }

    // Check circuit breaker state
    const currentCircuit = qwenCircuit.getState();

    // If circuit is OPEN (tripped), bypass Qwen immediately and go straight to Gemini
    if (currentCircuit === "OPEN" && hasGemini) {
      const remainingSec = qwenCircuit.getCooldownRemainingSeconds();
      console.warn(`[CIRCUIT-BREAKER] Qwen circuit is OPEN. Auto-routing to Gemini (Probe in ${remainingSec}s)...`);
      try {
        return await this.callGemini(request, `Auto-Failover: Qwen Breaker Open, probe in ${remainingSec}s`);
      } catch (geminiErr) {
        console.warn(`[CIRCUIT-BREAKER] Gemini failover while breaker open failed: ${geminiErr instanceof Error ? geminiErr.message : String(geminiErr)}`);
      }
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

    // FAST-FAIL TIMEOUT: 5000ms max for Qwen so the desk never hangs in live mode
    const QWEN_MAX_TIMEOUT_MS = isMockOrTestEndpoint ? 30000 : 5000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), QWEN_MAX_TIMEOUT_MS);

    const enableThinking = process.env.LLM_ENABLE_THINKING === "1";

    try {
      const response = await fetch(resolvedEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          ...request,
          model,
          stream: false,
          response_format: { type: "json_object" },
          ...(enableThinking ? {} : { enable_thinking: false })
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        if (!isMockOrTestEndpoint) {
          qwenCircuit.recordFailure();
        }
        if (hasGemini) {
          console.warn(`[CIRCUIT-BREAKER] Qwen returned HTTP ${response.status}. Trip breaker & failover to Gemini...`);
          try {
            return await this.callGemini(request, `Auto-Failover: Qwen HTTP ${response.status}`);
          } catch (geminiErr) {
            console.warn(`[CIRCUIT-BREAKER] Gemini failover error: ${geminiErr instanceof Error ? geminiErr.message : String(geminiErr)}`);
          }
        }
        let cleanMsg = text;
        try {
          const parsed = JSON.parse(text);
          if (parsed?.error?.message) {
            cleanMsg = parsed.error.message;
          }
        } catch {
          // keep text
        }
        throw new Error(`LLM provider returned HTTP ${response.status}: ${cleanMsg}`);
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
      // Successful Qwen response -> close / reset circuit
      if (!isMockOrTestEndpoint) {
        qwenCircuit.recordSuccess();
      }

      return {
        content,
        provenance: {
          model,
          provider: new URL(resolvedEndpoint).hostname,
          circuitState: currentCircuit === "HALF_OPEN" ? "PROBE_RECOVERY" : "PRIMARY"
        }
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (!isMockOrTestEndpoint) {
        qwenCircuit.recordFailure();
      }

      if (hasGemini) {
        const reason = err.name === 'AbortError' ? 'Qwen Timeout (5s)' : 'Qwen Connection Error';
        console.warn(`[CIRCUIT-BREAKER] ${reason}. Tripping breaker, routing instantly to Gemini...`);
        try {
          return await this.callGemini(request, `Auto-Failover: ${reason}`);
        } catch (geminiErr) {
          console.warn(`[CIRCUIT-BREAKER] Gemini failover error: ${geminiErr instanceof Error ? geminiErr.message : String(geminiErr)}`);
        }
      }

      console.error("LLM CLIENT ERROR:", err);
      throw err;
    }
  }
}

export const sharedLlmClient = new LLMProvider();
export function getSeekAiClient() {
  return sharedLlmClient;
}


