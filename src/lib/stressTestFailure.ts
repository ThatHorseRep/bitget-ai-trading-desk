/**
 * Pure mapping from a failed POST /api/stress-test response to the message the
 * trader should see.
 *
 * Why this exists: the client used to guard non-OK responses with
 * `!response.ok && !response.body` — but a JSON error response always has a
 * body, so the guard never fired, the friendly 429/413 copies were dead code,
 * and every failure (rate limit, oversize input, bad payload) surfaced as the
 * misleading "analysis ran out of its execution time budget" timeout message.
 * This helper keeps each failure telling the truth; unit-pinned by
 * tests/error-contract.test.cjs.
 */

/** Friendly copy for failures that have their own remediation. */
const RATE_LIMIT_MESSAGE =
  "Rate limit reached: the desk accepts up to 10 stress tests per minute. Please wait about a minute and try again.";

const TOO_LARGE_MESSAGE =
  "The trade statement is too large to analyze. Please shorten it and try again.";

const INTERNAL_MESSAGE =
  "An internal error occurred while processing your request.";

/**
 * Map a non-OK stress-test response to the trader-facing failure message.
 *
 * @param status HTTP status of the failed response.
 * @param body   Parsed JSON body, or null when the body was absent or
 *               non-JSON (tolerated — proxies can answer HTML pages).
 */
export function parseStressTestFailure(status: number, body: unknown): string {
  // Statuses whose remediation we own: prefer the actionable copy over the
  // server's terse `limitations` text.
  if (status === 429) return RATE_LIMIT_MESSAGE;
  if (status === 413) return TOO_LARGE_MESSAGE;

  const limitation = extractLimitation(body);
  if (limitation) return limitation;

  if (status >= 500) return INTERNAL_MESSAGE;
  return `HTTP ${status}: Analysis failed.`;
}

/**
 * Deterministic provenance IDs for every headline number in a Decision Artifact,
 * so the Provenance Drawer's record lookup has a reliable key instead of an
 * opaque string in the artifact. Pure: no imports, no I/O.
 */
export function provenanceIdFor(
  type: "market-state" | "evidence" | "scenario" | "assumption" | "thesis" | "challenge" | "assessment",
  id: string
): string {
  switch (type) {
    case "market-state":
      return `prov-source-${id}`;
    case "evidence":
      return `prov-ev-${id}`;
    case "scenario":
      return `prov-assumption-${id}`;
    case "assumption":
      return `prov-assumption-${id}`;
    case "thesis":
      return "prov-ai-thesis";
    case "challenge":
      return "prov-ai-challenge";
    case "assessment":
      return "prov-ai-assessment";
  }
}

/** First non-empty string in the body's `limitations` array, if any. */
function extractLimitation(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const limitations = (body as { limitations?: unknown }).limitations;
  if (!Array.isArray(limitations)) return null;
  const first = limitations.find(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0
  );
  return first ?? null;
}
