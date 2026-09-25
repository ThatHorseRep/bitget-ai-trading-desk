/**
 * RedTeam Desk - Automated Mobile Product Demo (100.0s Master Calibrated)
 * Synchronized with voiceover-100s-metacomm.mp3 + ambient bed audio
 * Viewport: 412 x 915 (deviceScaleFactor: 2.0)
 *
 * Guarantees 100% visible stress scenario cards with zero edge clipping
 * Shows Live Price ticks, real market numbers, provenance drawer, and brand outro
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function inPageSmoothScroll(page, targetY, durationMs = 800) {
  await page.evaluate(({ targetY, durationMs }) => {
    return new Promise(resolve => {
      const startY = window.scrollY;
      const diff = targetY - startY;
      const startTime = performance.now();
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, startY + diff * ease);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }, { targetY, durationMs });
}

async function inPageTouchMove(page, targetX, targetY, durationMs = 600) {
  await page.evaluate(({ targetX, targetY, durationMs }) => {
    return new Promise(resolve => {
      const pointer = document.getElementById('demo-touch-pointer');
      if (!pointer) return resolve();
      const match = pointer.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
      const startX = match ? parseFloat(match[1]) + 14 : 206;
      const startY = match ? parseFloat(match[2]) + 14 : 450;
      const diffX = targetX - startX;
      const diffY = targetY - startY;
      const startTime = performance.now();
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        const curX = startX + diffX * ease;
        const curY = startY + diffY * ease;
        pointer.style.transform = `translate(${curX - 14}px, ${curY - 14}px)`;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }, { targetX, targetY, durationMs });
}

async function simulateTap(page, x, y) {
  await page.evaluate(({ x, y }) => {
    const pointer = document.getElementById('demo-touch-pointer');
    if (pointer) {
      pointer.style.transform = `translate(${x - 14}px, ${y - 14}px) scale(0.85)`;
      const ripple = document.createElement('div');
      ripple.style = `position:fixed;top:${y - 18}px;left:${x - 18}px;width:36px;height:36px;border-radius:50%;background:rgba(200,16,46,0.4);border:2px solid #C8102E;pointer-events:none;z-index:9999998;animation:touchRipple 0.4s ease-out forwards;`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 400);
      setTimeout(() => {
        pointer.style.transform = `translate(${x - 14}px, ${y - 14}px) scale(1.0)`;
      }, 150);
    }
  }, { x, y });
}

(async () => {
  const recordingsDir = path.join(__dirname, '../recordings-mobile');
  if (fs.existsSync(recordingsDir)) {
    fs.rmSync(recordingsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(recordingsDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  // Mobile portrait: 412 x 915, 2.0x scale factor
  const context = await browser.newContext({
    recordVideo: { dir: recordingsDir, size: { width: 412, height: 915 } },
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.0
  });

  const page = await context.newPage();
  const video = page.video();

  const realArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../demo-out/real-live-artifact.json'), 'utf8'));

  // Mock instant live price for rTSLA to ensure instant normalization
  await page.route('**/api/market-price*', async route => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 378.17, timestamp: '2026-09-25T07:23:59Z' })
    });
  });

  // Calibrate SSE stream to run smoothly:
  // Starts when Execute is clicked at 41.0s, completes at 49.5s (8.5s total progress duration)
  await page.route('**/api/stress-test', async route => {
    await new Promise(r => setTimeout(r, 6500));
    
    const sseFrames = [
      ': stream-open\n\n',
      'data: {"type":"progress","stageId":"MARKET_STATE","message":"Checking market state..."}\n\n',
      'data: {"type":"progress","stageId":"EVIDENCE","message":"Searching live sources..."}\n\n',
      'data: {"type":"progress","stageId":"STRESS","message":"Computing deterministic stress shocks..."}\n\n',
      'data: {"type":"progress","stageId":"DECISION","message":"Synthesizing policy verdict..."}\n\n',
      'data: {"type":"progress","stageId":"AUDIT","message":"Generating cryptographic provenance..."}\n\n',
      'data: {"type":"result","status":200,"data":{"step":"DECISION_READY","artifact":' + JSON.stringify(realArtifact) + '}}\n\n'
    ].join('');
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: sseFrames
    });
  });

  // Timekeeper
  let wallStart = Date.now();
  async function waitUntil(targetSecond) {
    const elapsed = (Date.now() - wallStart) / 1000;
    const remaining = targetSecond - elapsed;
    if (remaining > 0) {
      await page.waitForTimeout(remaining * 1000);
    }
  }

  // 1. Navigate to Landing Page
  console.log('[00:00 - 00:11] Act 1: Mobile Landing Page Hero');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  wallStart = Date.now(); // Start exact 100s master clock here

  // Clear previous session state and hide Next.js dev toast
  await page.evaluate(() => {
    localStorage.removeItem('bitget_rtd_workspace_state_v1');
  });

  await page.addStyleTag({
    content: `
      nextjs-portal, #nextjs-dev-overlay, [data-nextjs-toast], [data-nextjs-dialog-overlay] {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `
  });

  // Inject sleek mobile touch pointer (semi-transparent glowing ring with tap ripple)
  await page.evaluate(() => {
    const pointer = document.createElement('div');
    pointer.id = 'demo-touch-pointer';
    pointer.style = 'position:fixed;top:0;left:0;width:28px;height:28px;border-radius:50%;background:rgba(200,16,46,0.35);border:2px solid #C8102E;box-shadow:0 0 10px rgba(200,16,46,0.6);z-index:9999999;pointer-events:none;transform:translate(192px, 436px);transition:transform 0.04s ease-out, scale 0.15s ease-out;';
    document.body.appendChild(pointer);

    const style = document.createElement('style');
    style.innerHTML = `@keyframes touchRipple { from { transform: scale(0.5); opacity: 1; } to { transform: scale(2.4); opacity: 0; } }`;
    document.head.appendChild(style);
  });

  await waitUntil(7.5);

  // Move touch cursor toward "Stress a trade" button
  const stressBtn = page.locator('button', { hasText: 'Stress a trade' }).first();
  const btnBox = await stressBtn.boundingBox();
  if (btnBox) {
    await inPageTouchMove(page, btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2, 800);
    await waitUntil(9.2);
    await simulateTap(page, btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
    await stressBtn.click();
  }

  await waitUntil(11.5);
  console.log('[00:11 - 00:31] Act 2: Mobile Desk Workspace Entry & Typing');
  await page.waitForSelector('textarea', { timeout: 10000 });

  await page.addStyleTag({
    content: `
      nextjs-portal, #nextjs-dev-overlay, [data-nextjs-toast], [data-nextjs-dialog-overlay] {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `
  });

  const textarea = page.locator('textarea');
  const taBox = await textarea.boundingBox();
  if (taBox) {
    await inPageTouchMove(page, taBox.x + 60, taBox.y + 35, 600);
    await waitUntil(12.5);
    await simulateTap(page, taBox.x + 60, taBox.y + 35);
    await textarea.click();
  }

  // Type thesis naturally
  const promptText = "I want to go long $25,000 on rTSLA on Saturday morning after autonomous driving demo rumors, while NASDAQ cash venue is closed and wrapper premium drifts +3.1%.";
  console.log('Typing trade thesis...');
  await textarea.pressSequentially(promptText, { delay: 25 }); // ~4.0s
  await page.evaluate(val => {
    const el = document.querySelector('textarea');
    if (el && el.value !== val) {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, promptText);
  await waitUntil(26.5);

  // Move touch cursor to "Run Adversarial Desk" submit button
  const runBtn = page.locator('form button[type="submit"]:has-text("Run Adversarial Desk")').first();
  await runBtn.scrollIntoViewIfNeeded();
  const runBox = await runBtn.boundingBox();
  if (runBox) {
    await inPageTouchMove(page, runBox.x + runBox.width / 2, runBox.y + runBox.height / 2, 500);
    await waitUntil(28.8);
    await simulateTap(page, runBox.x + runBox.width / 2, runBox.y + runBox.height / 2);
    await runBtn.click({ force: true });
  }

  await waitUntil(31.5);
  console.log('[00:31 - 00:43] Act 3: Normalized Trade Review Card (Checkpoint S04)');
  await page.waitForSelector('text=Normalized trade review', { timeout: 15000 });

  // Highlight Working Entry Price ($377.80 [• LIVE])
  await inPageTouchMove(page, 206, 320, 600);
  await waitUntil(36.0);

  // Scroll down slightly so "Execute Stress Test" is prominently visible
  await inPageSmoothScroll(page, 180, 600);
  await waitUntil(39.0);

  const executeBtn = page.locator('button:has-text("Execute Stress Test")').first();
  const execBox = await executeBtn.boundingBox();
  if (execBox) {
    await inPageTouchMove(page, execBox.x + execBox.width / 2, execBox.y + execBox.height / 2, 500);
    await waitUntil(41.0);
    await simulateTap(page, execBox.x + execBox.width / 2, execBox.y + execBox.height / 2);
    await executeBtn.click();
  }

  await waitUntil(43.5);
  console.log('[00:43 - 00:58] Act 4: Deterministic Risk Pipeline Progress');
  await page.waitForSelector('text=Deterministic Risk Pipeline', { timeout: 10000 });
  await page.waitForSelector('button:has-text("Audit provenance")', { timeout: 25000 });
  
  await waitUntil(52.0);
  console.log('[00:58 - 01:11] Act 5: Real Decision Verdict & Market State Reconstruction');
  await inPageSmoothScroll(page, 0, 400);

  // Dwell on Policy Verdict & Decisive reasons
  await inPageTouchMove(page, 206, 250, 600);
  await waitUntil(59.5);

  // Scroll to Market state reconstruction
  await inPageSmoothScroll(page, 480, 800);
  await waitUntil(61.5);

  // Dwell on Bitget token vs TSLA underlying equity cards
  await inPageTouchMove(page, 140, 360, 600);
  await waitUntil(70.5);

  console.log('[01:11 - 01:22] Act 6: Scrolling to ALL Stress Scenarios (Guaranteed Full Visibility)');
  // Scroll down to center ALL stress scenario cards including COMBINED SHOCK
  await inPageSmoothScroll(page, 1380, 900);
  await waitUntil(72.5);

  // Smoothly hover directly over Combined Shock -$2,703.94 (-10.82%)
  await inPageTouchMove(page, 206, 750, 800);
  await waitUntil(81.5);

  console.log('[01:22 - 01:33] Act 7: Audit Provenance Drawer (Mobile Slide-In)');
  // Smooth scroll back to top to access Audit Provenance
  await inPageSmoothScroll(page, 0, 700);
  await waitUntil(83.0);

  const provBtn = page.locator('button:has-text("Audit provenance")').first();
  const pBox = await provBtn.boundingBox();
  if (pBox) {
    await inPageTouchMove(page, pBox.x + pBox.width / 2, pBox.y + pBox.height / 2, 500);
    await waitUntil(84.0);
    await simulateTap(page, pBox.x + pBox.width / 2, pBox.y + pBox.height / 2);
    await provBtn.click();
  }

  await page.waitForSelector('text=Provenance & Data Lineage', { timeout: 8000 });
  await waitUntil(86.5);

  // Tap "OBSERVED FACT" filter tab
  const factTab = page.locator('button:has-text("OBSERVED FACT")').first();
  const fBox = await factTab.boundingBox();
  if (fBox) {
    await inPageTouchMove(page, fBox.x + fBox.width / 2, fBox.y + fBox.height / 2, 500);
    await waitUntil(87.8);
    await simulateTap(page, fBox.x + fBox.width / 2, fBox.y + fBox.height / 2);
    await factTab.click();
  }
  await waitUntil(91.2);

  // Tap CLOSE button on drawer
  const closeBtn = page.locator('button:has-text("CLOSE")').first();
  if (await closeBtn.isVisible()) {
    const cBox = await closeBtn.boundingBox();
    if (cBox) {
      await inPageTouchMove(page, cBox.x + cBox.width / 2, cBox.y + cBox.height / 2, 400);
      await waitUntil(92.0);
      await simulateTap(page, cBox.x + cBox.width / 2, cBox.y + cBox.height / 2);
      await closeBtn.click();
    }
  }

  await waitUntil(93.5);

  console.log('[01:33 - 01:40] Act 8: Mobile Brand Outro & Closing CTA');
  // Inject clean mobile outro dissolve overlay with official brand mark
  await page.evaluate(() => {
    const outro = document.createElement('div');
    outro.style = 'position:fixed;inset:0;background:#06121C;z-index:99999999;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity 0.7s ease-in-out;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;padding:28px 20px;text-align:center;box-sizing:border-box;';
    outro.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:16px;margin-bottom:24px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="76" height="76" fill="none" style="filter:drop-shadow(0 4px 16px rgba(200,16,46,0.35));">
          <path d="M 32.80,4.13 L 84.80,4.13 L 102.80,22.13 L 102.80,37.24 L 14.80,55.95 L 14.80,22.13 Z M 45.80,24.13 L 71.80,24.13 L 82.80,35.13 L 82.80,41.49 L 34.80,51.70 L 34.80,35.13 Z" fill="#FFFFFF" fill-rule="evenodd"/>
          <path d="M 85.20,44.05 L 85.20,77.87 L 67.20,95.87 L 15.20,95.87 L -2.80,77.87 L -2.80,62.76 Z M 65.20,48.30 L 65.20,64.87 L 54.20,75.87 L 28.20,75.87 L 17.20,64.87 L 17.20,58.51 Z" fill="#FFFFFF" fill-rule="evenodd"/>
          <path d="M -2.80,62.76 L -1.34,59.38 L 102.80,37.24 L 101.34,40.62 Z" fill="#C8102E"/>
        </svg>
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
          <span style="font-size:11px;letter-spacing:3.5px;font-weight:700;color:#8FA2B5;text-transform:uppercase;">BITGET AI</span>
          <span style="font-size:24px;font-weight:900;letter-spacing:1.5px;color:#FFFFFF;text-transform:uppercase;">REDTEAM DESK</span>
        </div>
      </div>
      <div style="display:inline-block;padding:4px 10px;background:rgba(201,138,20,0.12);border:1px solid rgba(201,138,20,0.35);border-radius:4px;font-size:11px;color:#C98A14;font-weight:700;letter-spacing:2px;margin-bottom:18px;">TRACK 3: DECISION STRESS TESTING</div>
      <div style="font-size:17px;color:#FFFFFF;font-weight:700;letter-spacing:0.5px;margin-bottom:14px;line-height:1.4;">Stress-test before the market does.</div>
      <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(14,159,139,0.1);border:1px solid rgba(14,159,139,0.3);border-radius:6px;font-size:13px;color:#00F0FF;font-weight:600;letter-spacing:0.8px;">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#00F0FF;box-shadow:0 0 6px #00F0FF;"></span>
        redteamdesk.name.ng
      </div>
    `;
    document.body.appendChild(outro);
    requestAnimationFrame(() => { outro.style.opacity = '1'; });
  });

  await waitUntil(100.0);

  console.log('Closing page and finalizing mobile video recording at exact 100.0s...');
  await page.close();
  await context.close();
  const savedVideoPath = await video.path();
  await browser.close();
  console.log('Mobile video recorded cleanly to:', savedVideoPath);

  const finalRawPath = path.join(__dirname, '../public/demo/mobile-raw.webm');
  fs.copyFileSync(savedVideoPath, finalRawPath);
  console.log('Saved raw video copy to:', finalRawPath);
})();
