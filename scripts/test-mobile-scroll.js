const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const realArtifact = JSON.parse(fs.readFileSync('demo-out/real-live-artifact.json', 'utf8'));

  await page.route('**/api/stress-test', async route => {
    const sse = [
      ': stream-open\n\n',
      'data: {"type":"progress","stageId":"MARKET_STATE","message":"Checking market state..."}\n\n',
      'data: {"type":"result","status":200,"data":{"step":"DECISION_READY","artifact":' + JSON.stringify(realArtifact) + '}}\n\n'
    ].join('');
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body: sse
    });
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.locator('button', { hasText: 'Stress a trade' }).first().click();
  await page.waitForTimeout(600);

  const ta = page.locator('textarea');
  await ta.fill('I want to go long $25,000 on rTSLA on Saturday morning after autonomous driving demo rumors, while NASDAQ cash venue is closed and wrapper premium drifts +3.1%.');
  await page.locator('form button[type="submit"]:has-text("Run Adversarial Desk")').first().click();
  await page.waitForTimeout(600);

  await page.locator('button:has-text("Execute Stress Test")').click();
  await page.waitForSelector('text=Deterministic stress scenarios', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Test scroll 1: Market State
  await page.evaluate(() => window.scrollTo(0, 480));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'demo-out/mobile-scroll-market.png' });

  // Test scroll 2: First two shocks
  await page.evaluate(() => window.scrollTo(0, 850));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'demo-out/mobile-scroll-shocks-1-2.png' });

  // Test scroll 3: Combined Shock!
  await page.evaluate(() => window.scrollTo(0, 1380));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'demo-out/mobile-scroll-combined-shock.png' });

  console.log('Mobile scroll tests completed successfully!');
  await browser.close();
})();
