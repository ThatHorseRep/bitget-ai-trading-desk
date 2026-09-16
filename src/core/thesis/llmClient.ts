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
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ ...request, model, stream: true, response_format: { type: "json_object" } }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`LLM request failed (${response.status}): ${text}`);
      }
      
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let content = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // keep the last incomplete line
        for (let line of lines) {
          line = line.trim();
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices && data.choices[0] && data.choices[0].delta && typeof data.choices[0].delta.content === 'string') {
                content += data.choices[0].delta.content;
              }
            } catch (e) {
              // ignore parse error on incomplete chunk
            }
          }
        }
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
        console.warn("LLM Request failed, retrying once...");
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


