const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseStressTestFailure } = require("../dist-core/src/lib/stressTestFailure.js");

const TIMEOUT_MESSAGE =
  "The analysis ran out of its execution time budget before a decision could be returned. Try the Deterministic fixture mode, or narrow the trade question.";

const { provenanceIdFor } = require("../dist-core/src/lib/stressTestFailure.js");

test("provenance: deterministic IDs for every headline number in a Decision Artifact", () => {
  assert.equal(
    provenanceIdFor("market-state", "fixture-bitget"),
    "prov-source-fixture-bitget"
  );
  assert.equal(provenanceIdFor("evidence", "demo-ev-1"), "prov-ev-demo-ev-1");
  assert.equal(provenanceIdFor("scenario", "MARKET_RISK"), "prov-assumption-MARKET_RISK");
  assert.equal(provenanceIdFor("assumption", "MARKET_RISK"), "prov-assumption-MARKET_RISK");
  assert.equal(provenanceIdFor("thesis", ""), "prov-ai-thesis");
  assert.equal(provenanceIdFor("challenge", ""), "prov-ai-challenge");
  assert.equal(provenanceIdFor("assessment", ""), "prov-ai-assessment");
});

test("error contract: non-OK stress-test responses map to the true failure message", async (t) => {
  await t.test("429 → actionable rate-limit copy even when the server sent terse limitations", () => {
    assert.equal(
      parseStressTestFailure(429, {
        step: "ERROR",
        parsedResult: null,
        artifact: null,
        limitations: ["Rate limit exceeded. Please try again later."]
      }),
      "Rate limit reached: the desk accepts up to 10 stress tests per minute. Please wait about a minute and try again."
    );
  });

  await t.test("429 with null, non-JSON, or empty body still tells the truth", () => {
    const expected =
      "Rate limit reached: the desk accepts up to 10 stress tests per minute. Please wait about a minute and try again.";
    assert.equal(parseStressTestFailure(429, null), expected);
    assert.equal(parseStressTestFailure(429, "<html>gateway error</html>"), expected);
    assert.equal(parseStressTestFailure(429, {}), expected);
  });

  await t.test("413 → too-large copy (server body tolerated)", () => {
    const expected =
      "The trade statement is too large to analyze. Please shorten it and try again.";
    assert.equal(
      parseStressTestFailure(413, { limitations: ["Request body too large."] }),
      expected
    );
    assert.equal(parseStressTestFailure(413, null), expected);
  });

  await t.test("400 → server limitations[0], HTTP text as fallback", () => {
    assert.equal(
      parseStressTestFailure(400, { limitations: ["Invalid request payload format."] }),
      "Invalid request payload format."
    );
    assert.equal(
      parseStressTestFailure(400, { limitations: ["Malformed JSON in request body."] }),
      "Malformed JSON in request body."
    );
    assert.equal(parseStressTestFailure(400, { limitations: [] }), "HTTP 400: Analysis failed.");
    assert.equal(parseStressTestFailure(400, null), "HTTP 400: Analysis failed.");
    assert.equal(parseStressTestFailure(400, "not json at all"), "HTTP 400: Analysis failed.");
    assert.equal(
      parseStressTestFailure(400, { limitations: [42, null, "  "] }),
      "HTTP 400: Analysis failed."
    );
  });

  await t.test("422 → clarification limitation verbatim", () => {
    assert.equal(
      parseStressTestFailure(422, { step: "CLARIFICATION", limitations: ["Which asset?"] }),
      "Which asset?"
    );
    assert.equal(parseStressTestFailure(422, null), "HTTP 422: Analysis failed.");
  });

  await t.test("500/502/503 → limitation or generic internal message", () => {
    assert.equal(
      parseStressTestFailure(500, {
        limitations: ["An internal error occurred while processing your request."]
      }),
      "An internal error occurred while processing your request."
    );
    assert.equal(
      parseStressTestFailure(500, null),
      "An internal error occurred while processing your request."
    );
    assert.equal(
      parseStressTestFailure(502, { limitations: ["Upstream gateway failure."] }),
      "Upstream gateway failure."
    );
    assert.equal(
      parseStressTestFailure(503, null),
      "An internal error occurred while processing your request."
    );
  });

  await t.test("the misleading timeout message is unreachable from any non-OK response", () => {
    const nonOkCases = [
      [400, null],
      [413, null],
      [422, null],
      [429, null],
      [418, {}],
      [500, null],
      [502, { limitations: ["boom"] }]
    ];
    for (const [status, body] of nonOkCases) {
      assert.notEqual(parseStressTestFailure(status, body), TIMEOUT_MESSAGE);
    }
  });
});
