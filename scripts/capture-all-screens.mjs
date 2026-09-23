import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function captureAllScreens() {
  const outputDir = path.join(process.cwd(), 'public', 'screenshots', 'full-suite');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🚀 Launching Chromium for comprehensive full-page desk capture...');
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
    console.log(`\n📸 Capturing Viewport: ${vp.name} (${vp.width}x${vp.height})...`);

    // -------------------------------------------------------------
    // 1. Landing Page - Full Scroll (Day Mode)
    // -------------------------------------------------------------
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      console.log(`  [1/8] Landing Page Full Scroll (Day Mode)...`);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outputDir, `01-landing-page-day-${vp.name}.png`), fullPage: true });
      await page.close();
    }

    // -------------------------------------------------------------
    // 2. Landing Page - Full Scroll (Night Mode)
    // -------------------------------------------------------------
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      console.log(`  [2/8] Landing Page Full Scroll (Night Mode)...`);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const nightToggle = page.locator('button:has-text("NIGHT"), button[title*="Dark Room"]').first();
      if (await nightToggle.isVisible()) {
        await nightToggle.click();
        await page.waitForTimeout(500);
      }
      await page.screenshot({ path: path.join(outputDir, `02-landing-page-night-${vp.name}.png`), fullPage: true });
      await page.close();
    }

    // -------------------------------------------------------------
    // 3. Pre-Trade Stress Input Workbench (Main Cockpit)
    // -------------------------------------------------------------
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      console.log(`  [3/8] Pre-Trade Stress Input Workbench...`);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const stressBtn = page.locator('button:has-text("Stress a trade")').first();
      if (await stressBtn.isVisible()) {
        await stressBtn.click();
        await page.waitForTimeout(600);
      }
      await page.screenshot({ path: path.join(outputDir, `03-trade-input-workbench-${vp.name}.png`), fullPage: true });
      await page.close();
    }

    // -------------------------------------------------------------
    // 4. Normalized Review Card (Checkpoint S04)
    // -------------------------------------------------------------
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      console.log(`  [4/8] Normalized Trade Review Card (Checkpoint S04)...`);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const sampleBtn = page.locator('button:has-text("See a sample run")').first();
      if (await sampleBtn.isVisible()) {
        await sampleBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(outputDir, `04-normalized-review-card-${vp.name}.png`), fullPage: true });
      }
      await page.close();
    }

    // -------------------------------------------------------------
    // 5. Decision Artifact Certificate (Full Report & Stress Matrix)
    // -------------------------------------------------------------
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      console.log(`  [5/8] Decision Artifact Certificate (Full Scroll)...`);
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const sampleBtn = page.locator('button:has-text("See a sample run")').first();
      if (await sampleBtn.isVisible()) {
        await sampleBtn.click();
        await page.waitForTimeout(1000);
        const confirmBtn = page.locator('button:has-text("Confirm & run stress tests")').first();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
          await page.waitForSelector('text=DECISION ARTIFACT, text=Checkpoint S05, text=STRESS MATRIX', { timeout: 25000 });
          await page.waitForTimeout(1500);
          await page.screenshot({ path: path.join(outputDir, `05-decision-artifact-report-${vp.name}.png`), fullPage: true });

          // 6. Audit Trail Provenance Drawer
          console.log(`  [6/8] Audit Trail Provenance Drawer...`);
          const auditTrigger = page.locator('button:has-text("View full audit trail"), button:has-text("PROVENANCE GRAPH")').first();
          if (await auditTrigger.isVisible()) {
            await auditTrigger.click();
            await page.waitForTimeout(700);
            await page.screenshot({ path: path.join(outputDir, `06-provenance-drawer-${vp.name}.png`), fullPage: true });
          }
        }
      }
      await page.close();
    }

    // -------------------------------------------------------------
    // 7. Displacement Loader Test Harness Route (/loader)
    // -------------------------------------------------------------
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      console.log(`  [7/8] Displacement Loader Harness (/loader)...`);
      await page.goto(`${BASE_URL}/loader`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outputDir, `07-displacement-loader-harness-${vp.name}.png`), fullPage: true });
      await page.close();
    }

    // -------------------------------------------------------------
    // 8. Offline PWA Fallback Route (/offline)
    // -------------------------------------------------------------
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      console.log(`  [8/8] Offline PWA Fallback (/offline)...`);
      await page.goto(`${BASE_URL}/offline`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outputDir, `08-offline-pwa-fallback-${vp.name}.png`), fullPage: true });
      await page.close();
    }
  }

  await browser.close();
  console.log('\n✨ ALL COMPREHENSIVE FULL-PAGE SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

captureAllScreens().catch((err) => {
  console.error('Error during screen capture suite:', err);
  process.exit(1);
});
