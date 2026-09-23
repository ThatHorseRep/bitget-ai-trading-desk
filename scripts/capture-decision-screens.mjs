import { chromium } from 'playwright';
import path from 'path';

async function captureDecisionScreens() {
  const outputDir = path.join(process.cwd(), 'public', 'screenshots', 'full-suite');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  for (const vp of [{ name: 'desktop-1440', width: 1440, height: 900 }, { name: 'mobile-375', width: 375, height: 812 }]) {
    // 1. Clarification Modal
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.locator('button:has-text("Stress a trade")').first().click();
      
      // On mobile, switch to thesis prompt tab
      const thesisTab = page.locator('button:has-text("Thesis prompt")').first();
      if (await thesisTab.isVisible()) {
        await thesisTab.click();
      }

      await page.waitForSelector('#trade-thesis-input:not([disabled])', { timeout: 10000 });
      const textarea = page.locator('#trade-thesis-input');
      await textarea.fill('Buy NVDA with leverage');
      await page.locator('button:has-text("Run Adversarial Desk")').first().click();
      await page.waitForSelector('text=Clarification needed', { timeout: 10000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outputDir, `05-clarification-modal-${vp.name}.png`), fullPage: true });
      await page.close();
    }

    // 2. Decision Artifact Report with Stress Matrix
    {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      
      const sampleBtn = page.locator('button:has-text("See a sample run")').first();
      await sampleBtn.click();
      await page.waitForSelector('button:has-text("Confirm and run stress test")', { timeout: 10000 });
      await page.waitForTimeout(500);

      const confirmBtn = page.locator('button:has-text("Confirm and run stress test")').first();
      await confirmBtn.click();
      await page.waitForSelector('text=STRESS MATRIX, text=DECISION ARTIFACT', { timeout: 25000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outputDir, `06-decision-artifact-report-${vp.name}.png`), fullPage: true });

      // 3. Provenance Drawer
      const auditBtn = page.locator('button:has-text("View full audit trail"), button:has-text("PROVENANCE GRAPH"), button:has-text("Audit trail")').first();
      if (await auditBtn.isVisible()) {
        await auditBtn.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(outputDir, `07-provenance-drawer-${vp.name}.png`), fullPage: true });
      }

      await page.close();
    }
  }

  await browser.close();
  console.log('✨ All remaining screens captured successfully!');
}

captureDecisionScreens().catch((err) => {
  console.error('Error during decision capture:', err);
  process.exit(1);
});
