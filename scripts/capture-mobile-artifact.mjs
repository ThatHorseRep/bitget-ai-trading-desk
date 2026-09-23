import { chromium } from 'playwright';
import path from 'path';

async function captureMobileArtifact() {
  const outputDir = path.join(process.cwd(), 'public', 'screenshots', 'full-suite');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Click 'Stress a trade' on landing
  await page.locator('button:has-text("Stress a trade")').first().click();
  await page.waitForSelector('button:has-text("Confirm and run stress test")', { timeout: 10000 });

  // Toggle fixture
  const fixtureBtn = page.locator('button[aria-label*="Toggle data mode"], header button:has-text("Live")').first();
  if (await fixtureBtn.isVisible()) {
    await fixtureBtn.click();
    await page.waitForTimeout(300);
  }

  // Scroll to confirm button and click
  const confirmBtn = page.locator('button:has-text("Confirm and run stress test")').first();
  await confirmBtn.scrollIntoViewIfNeeded();
  await confirmBtn.click();

  await page.waitForSelector('text=Proposed trade', { timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, `05-decision-artifact-report-mobile-375.png`), fullPage: true });

  // Open Provenance Drawer
  const auditBtn = page.locator('button:has-text("Audit trail"), button:has-text("View full audit trail")').first();
  if (await auditBtn.isVisible()) {
    await auditBtn.scrollIntoViewIfNeeded();
    await auditBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outputDir, `06-provenance-drawer-mobile-375.png`), fullPage: true });
  }

  await page.close();
  await browser.close();
  console.log('✨ Mobile decision & provenance captured successfully!');
}

captureMobileArtifact().catch(console.error);
