import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function captureAllScreensComplete() {
  const outputDir = path.join(process.cwd(), 'public', 'screenshots', 'full-suite');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🚀 Starting Complete Desk Full-Page Screen Capture Suite...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'mobile-375', width: 375, height: 812 }
  ];

  for (const vp of viewports) {
    console.log(`\n📸 Processing Viewport: ${vp.name}...`);

    // 1. Full Landing Page (Day Mode / Proof Sheet)
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outputDir, `01-landing-page-day-${vp.name}.png`), fullPage: true });
      await page.close();
    }

    // 2. Full Landing Page (Night Mode / Dark Room)
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const nightToggle = page.locator('button:has-text("NIGHT"), button[title*="Dark Room"]').first();
      if (await nightToggle.isVisible()) {
        await nightToggle.click();
        await page.waitForTimeout(400);
      }
      await page.screenshot({ path: path.join(outputDir, `02-landing-page-night-${vp.name}.png`), fullPage: true });
      await page.close();
    }

    // 3. Trade Input Workbench (Empty / Custom Prompt Cockpit)
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const customBtn = page.locator('button:has-text("See a sample run"), button:has-text("ENTER CUSTOM THESIS")').first();
      if (await customBtn.isVisible()) {
        await customBtn.click();
        await page.waitForTimeout(600);
      }
      await page.screenshot({ path: path.join(outputDir, `03-trade-input-workbench-${vp.name}.png`), fullPage: true });
      await page.close();
    }

    // 4. Normalized Trade Review Card (Checkpoint S04)
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const stressBtn = page.locator('button:has-text("Stress a trade")').first();
      if (await stressBtn.isVisible()) {
        await stressBtn.click();
        await page.waitForSelector('button:has-text("Confirm and run stress test")', { timeout: 10000 });
        await page.waitForTimeout(400);
      }
      await page.screenshot({ path: path.join(outputDir, `04-normalized-review-card-${vp.name}.png`), fullPage: true });
      await page.close();
    }

    // 5. Decision Artifact Report with Quantitative Stress Matrix
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const stressBtn = page.locator('button:has-text("Stress a trade")').first();
      if (await stressBtn.isVisible()) {
        await stressBtn.click();
        await page.waitForSelector('button:has-text("Confirm and run stress test")', { timeout: 10000 });
        await page.locator('button:has-text("Confirm and run stress test")').first().click();
        await page.waitForSelector('text=DECISION ARTIFACT', { timeout: 35000 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(outputDir, `05-decision-artifact-report-${vp.name}.png`), fullPage: true });

        // 6. Full Audit Trail Provenance Drawer
        const auditBtn = page.locator('button:has-text("View full audit trail"), button:has-text("PROVENANCE GRAPH"), button:has-text("Audit trail")').first();
        if (await auditBtn.isVisible()) {
          await auditBtn.click();
          await page.waitForTimeout(600);
          await page.screenshot({ path: path.join(outputDir, `06-provenance-drawer-${vp.name}.png`), fullPage: true });
        }
      }
      await page.close();
    }

    // 7. Displacement Loader Test Harness Route (/loader)
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      await page.goto(`${BASE_URL}/loader`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outputDir, `07-displacement-loader-harness-${vp.name}.png`), fullPage: true });
      await page.close();
    }

    // 8. Offline PWA Fallback Route (/offline)
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      await page.goto(`${BASE_URL}/offline`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outputDir, `08-offline-pwa-fallback-${vp.name}.png`), fullPage: true });
      await page.close();
    }
  }

  await browser.close();
  console.log('\n🎉 ALL SCREENSHOTS GENERATED AND SAVED TO /public/screenshots/full-suite/');
}

captureAllScreensComplete().catch((err) => {
  console.error('Error during screen capture:', err);
  process.exit(1);
});
