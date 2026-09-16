const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Test desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://127.0.0.1:3000');
  await page.waitForTimeout(2000); // let animations settle
  
  // Test mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1000);
  
  // Test reduced motion
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(1000);

  // We can't easily run axe inside page.evaluate if we don't have axe-core npm package installed, 
  // but we can inject it
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js' });
  const a11y = await page.evaluate(async () => {
    const results = await window.axe.run();
    return results.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length }));
  });

  fs.writeFileSync('a11y-report.json', JSON.stringify({ violations: a11y }, null, 2));
  console.log("A11y check complete! See a11y-report.json");
  
  await browser.close();
})();
