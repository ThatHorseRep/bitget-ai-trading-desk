// Using global fetch (Node 18+). No external import needed.

export type SeekAiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type SeekAiRequest = {
  model: string;
  messages: SeekAiMessage[];
  // any additional OpenAI‑compatible parameters can be added here
};

export type SeekAiResponse = {
  // SeekAI returns a field "content" (string) – we keep the shape flexible
  content: string;
};

/**
 * Returns a client with a single `chat` method that talks to SeekAI.
 * In test mode (`process.env.TEST_MODE === 'mock_llm'`) a mock client is returned.
 */
export function getSeekAiClient() {
  const testMode = process.env.TEST_MODE === 'mock_llm';
  if (testMode) {
    return {
      async chat(_: SeekAiRequest): Promise<SeekAiResponse> {
        // Provide a deterministic mock payload matching the AssessmentSchema shape
        return {
          content: JSON.stringify({
            thesisQuality: 'STRONGER',
            keyMismatch: null,
            explanation: 'Mock explanation for testing.'
          })
        };
      }
    };
  }

  const endpoint = process.env.SEEKAI_ENDPOINT;
  const apiKey = process.env.SEEKAI_API_KEY;
  if (!endpoint || !apiKey) {
    // Return a mock client similar to test mode when credentials are missing
    return {
      async chat(_: SeekAiRequest): Promise<SeekAiResponse> {
        return {
          content: JSON.stringify({
            normalizedThesis: "Mock normalized thesis",
            assumptions: [],
            dependencies: [],
            supportingEvidenceRefs: [],
            invalidationConditions: [],
            unresolvedAmbiguities: []
          })
        };
      }
    };
  }


  return {
    async chat(request: SeekAiRequest): Promise<SeekAiResponse> {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify(request)
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`SeekAI request failed (${response.status}): ${text}`);
        }
        const data = await response.json();
        if (typeof data.content === 'string') {
          return { content: data.content };
        }
        if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
          return { content: data.choices[0].message.content };
        }
        return { content: JSON.stringify(data) };
      } catch (err) {
        // Fallback mock response on any error (network, timeout, etc.)
        return {
          content: JSON.stringify({
            thesisQuality: 'STRONGER',
            keyMismatch: null,
            explanation: `Mock fallback due to error: ${err instanceof Error ? err.message : String(err)}`
          })
        };
      }
    }
  };
}


