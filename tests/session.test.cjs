const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  determineUsMarketSession,
  getEasternTimeParts,
  isReferenceMarketOpen
} = require("../dist-core/src/core/market/session.js");

test("session status correctly identifies regular trading hours (e.g. Wednesday 11:00 AM ET)", () => {
  // Wednesday, Jan 14, 2026 at 16:00:00 UTC = 11:00 AM ET
  const date = new Date("2026-01-14T16:00:00.000Z");
  const parts = getEasternTimeParts(date);
  assert.equal(parts.dayOfWeek, 3); // Wednesday
  assert.equal(parts.hour, 11);
  assert.equal(parts.minute, 0);

  const status = determineUsMarketSession(date);
  assert.equal(status, "REGULAR");
  assert.equal(isReferenceMarketOpen(status), true);
});

test("session status correctly identifies off-hours before market open (e.g. Wednesday 08:30 AM ET)", () => {
  // Wednesday, Jan 14, 2026 at 13:30:00 UTC = 08:30 AM ET
  const date = new Date("2026-01-14T13:30:00.000Z");
  const status = determineUsMarketSession(date);
  assert.equal(status, "OFF_HOURS");
  assert.equal(isReferenceMarketOpen(status), false);
});

test("session status correctly identifies weekend (e.g. Saturday 12:00 PM ET)", () => {
  // Saturday, Jan 17, 2026 at 17:00:00 UTC = 12:00 PM ET
  const date = new Date("2026-01-17T17:00:00.000Z");
  const status = determineUsMarketSession(date);
  assert.equal(status, "WEEKEND");
  assert.equal(isReferenceMarketOpen(status), false);
});

test("session status correctly identifies Friday evening post-close as weekend", () => {
  // Friday, Jan 16, 2026 at 22:00:00 UTC = 17:00 ET (5:00 PM)
  const date = new Date("2026-01-16T22:00:00.000Z");
  const status = determineUsMarketSession(date);
  assert.equal(status, "WEEKEND");
});

test("session status correctly identifies holiday closures", () => {
  // New Year's Day: Jan 1, 2026 at 16:00:00 UTC = 11:00 AM ET
  const date = new Date("2026-01-01T16:00:00.000Z");
  const status = determineUsMarketSession(date);
  assert.equal(status, "HOLIDAY");
  assert.equal(isReferenceMarketOpen(status), false);
});

test("session status handles invalid date gracefully", () => {
  const status = determineUsMarketSession(new Date("invalid-date"));
  assert.equal(status, "UNKNOWN");
});
