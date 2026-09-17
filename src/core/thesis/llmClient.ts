// Using global fetch (Node 18+). No external import needed.

export type SeekAiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type SeekAiRequest = {
  model?: string;
  messages: SeekAiMessage[];
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
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout to prevent Vercel 60s limit

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ ...request, model, stream: false, response_format: { type: "json_object" } }),
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
      if (!isRetry) {
        console.warn("LLM Request failed, retrying once in 2 seconds...");
        await new Promise(r => setTimeout(r, 2000));
        return this.chat(request, true);
      }
      console.error("LLM CLIENT ERROR (Retry failed):", err);
      throw err; // Caller must handle the failure
    }
  }
}

export const sharedLlmClient = new LLMProvider();
export function getSeekAiClient() {
  return sharedLlmClient;
}


