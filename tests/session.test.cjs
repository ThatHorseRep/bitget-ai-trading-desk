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

test("session status correctly identifies Friday evening post-close as off-hours", () => {
  // Friday, Jan 16, 2026 at 22:00:00 UTC = 17:00 ET (5:00 PM)
  const date = new Date("2026-01-16T22:00:00.000Z");
  const status = determineUsMarketSession(date);
  assert.equal(status, "OFF_HOURS");
});

test("session status correctly identifies holiday closures", () => {
  // New Year's Day: Jan 1, 2026 at 16:00:00 UTC = 11:00 AM ET
  const date = new Date("2026-01-01T16:00:00.000Z");
  const status = determineUsMarketSession(date);
  assert.equal(status, "HOLIDAY");
  assert.equal(isReferenceMarketOpen(status), false);
});

test("session status correctly identifies Wednesday after-hours", () => {
  // Wednesday, Jan 14, 2026 at 22:00:00 UTC = 17:00 ET (5:00 PM)
  const date = new Date("2026-01-14T22:00:00.000Z");
  assert.equal(determineUsMarketSession(date), "OFF_HOURS");
});

test("session status correctly identifies Sunday", () => {
  // Sunday, Jan 18, 2026 at 17:00:00 UTC = 12:00 PM ET
  const date = new Date("2026-01-18T17:00:00.000Z");
  assert.equal(determineUsMarketSession(date), "WEEKEND");
});

test("session status handles timezone boundary around 09:30 ET", () => {
  // 09:29 ET -> OFF_HOURS
  const beforeOpen = new Date("2026-01-14T14:29:59.000Z");
  assert.equal(determineUsMarketSession(beforeOpen), "OFF_HOURS");

  // 09:30 ET -> REGULAR
  const atOpen = new Date("2026-01-14T14:30:00.000Z");
  assert.equal(determineUsMarketSession(atOpen), "REGULAR");
});

test("session status handles timezone boundary around 16:00 ET", () => {
  // 15:59 ET -> REGULAR
  const beforeClose = new Date("2026-01-14T20:59:59.000Z");
  assert.equal(determineUsMarketSession(beforeClose), "REGULAR");

  // 16:00 ET -> OFF_HOURS
  const atClose = new Date("2026-01-14T21:00:00.000Z");
  assert.equal(determineUsMarketSession(atClose), "OFF_HOURS");
});

test("session status works correctly during DST transition week (Spring Forward)", () => {
  // March 8, 2026 is DST start (Spring Forward) in US
  // Monday, March 9, 2026 at 13:30 UTC -> 09:30 EDT
  const date = new Date("2026-03-09T13:30:00.000Z");
  const parts = getEasternTimeParts(date);
  assert.equal(parts.hour, 9);
  assert.equal(parts.minute, 30);
  assert.equal(determineUsMarketSession(date), "REGULAR");
});

test("session status works correctly during DST transition week (Fall Back)", () => {
  // Nov 1, 2026 is DST end (Fall Back) in US
  // Monday, Nov 2, 2026 at 14:30 UTC -> 09:30 EST
  const date = new Date("2026-11-02T14:30:00.000Z");
  const parts = getEasternTimeParts(date);
  assert.equal(parts.hour, 9);
  assert.equal(parts.minute, 30);
  assert.equal(determineUsMarketSession(date), "REGULAR");
});

test("session status can handle 'tomorrow'", () => {
  const tomorrow = new Date(Date.now() + 86400000);
  const status = determineUsMarketSession(tomorrow);
  // It could be any status, just ensure it doesn't throw or return UNKNOWN unless it actually is
  assert.notEqual(status, "UNKNOWN");
});

test("session status handles invalid date gracefully", () => {
  const status = determineUsMarketSession(new Date("invalid-date"));
  assert.equal(status, "UNKNOWN");
});
