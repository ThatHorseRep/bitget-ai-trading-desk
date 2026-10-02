const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  MOBILE_BREAKPOINT_PX,
  getBrandCutForViewport,
  BRAND_CUTS
} = require("../dist-core/src/lib/demo/brandCuts.js");

test("brand cuts pin the responsive demo video switch", async (t) => {
  await t.test("mobile viewport (390px, as probed on the landing page) gets the portrait brand cut", () => {
    const cut = getBrandCutForViewport(390);
    assert.equal(cut.videoSrc, "/demo/brand-mobile-demo.mp4");
    assert.equal(cut.posterSrc, "/demo/brand-mobile-poster.jpg");
  });

  await t.test("desktop viewport (1366px, as probed on the landing page) gets the 1080p brand cut", () => {
    const cut = getBrandCutForViewport(1366);
    assert.equal(cut.videoSrc, "/demo/brand-desktop-demo.mp4");
    assert.equal(cut.posterSrc, "/demo/brand-desktop-poster.jpg");
  });

  await t.test("switch boundary is exactly at the 768px breakpoint", () => {
    assert.equal(MOBILE_BREAKPOINT_PX, 768);
    assert.equal(getBrandCutForViewport(767).videoSrc, "/demo/brand-mobile-demo.mp4");
    assert.equal(getBrandCutForViewport(768).videoSrc, "/demo/brand-desktop-demo.mp4");
  });

  await t.test("every cut pairs a brand-{platform}-demo.mp4 with its brand-{platform}-poster.jpg", () => {
    for (const [platform, cut] of Object.entries(BRAND_CUTS)) {
      assert.ok(cut.videoSrc.endsWith(".mp4"));
      assert.equal(cut.videoSrc, `/demo/brand-${platform}-demo.mp4`);
      assert.equal(cut.posterSrc, `/demo/brand-${platform}-poster.jpg`);
    }
  });

  await t.test("exactly two cuts exist: mobile and desktop (no legacy submission cuts reachable)", () => {
    assert.deepEqual(Object.keys(BRAND_CUTS).sort(), ["desktop", "mobile"]);
  });
});
