import { chromium } from 'playwright';
import path from 'path';

async function captureArtifactAndModals() {
  const outputDir = path.join(process.cwd(), 'public', 'screenshots', 'full-suite');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  for (const vp of [{ name: 'desktop-1440', width: 1440, height: 900 }, { name: 'mobile-375', width: 375, height: 812 }]) {
    console.log(`Capturing artifact for ${vp.name}...`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Click 'Stress a trade' on landing
    const stressBtn = page.locator('button:has-text("Stress a trade")').first();
    await stressBtn.click();
    await page.waitForSelector('button:has-text("Confirm and run stress test")', { timeout: 10000 });

    // Turn on Fixture toggle in Header
    const fixtureBtn = page.locator('button:has-text("Deterministic fixture"), button[aria-label*="Toggle data mode"]').first();
    if (await fixtureBtn.isVisible()) {
      await fixtureBtn.click();
      await page.waitForTimeout(400);
    }

    // Click Confirm and run stress test
    await page.locator('button:has-text("Confirm and run stress test")').first().click();

    // Wait for the decision artifact report
    await page.waitForSelector('text=Proposed trade', { timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, `05-decision-artifact-report-${vp.name}.png`), fullPage: true });

    // Open Provenance Drawer
    const auditBtn = page.locator('button:has-text("Audit trail"), button:has-text("View full audit trail"), button:has-text("PROVENANCE")').first();
    if (await auditBtn.isVisible()) {
      await auditBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outputDir, `06-provenance-drawer-${vp.name}.png`), fullPage: true });
    }

    await page.close();
  }

  await browser.close();
  console.log('✨ All artifact & provenance screens captured successfully!');
}

captureArtifactAndModals().catch((err) => {
  console.error('Error during artifact capture:', err);
  process.exit(1);
});
