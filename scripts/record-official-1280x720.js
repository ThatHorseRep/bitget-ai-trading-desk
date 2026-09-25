const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function smoothMouseMove(page, startX, startY, endX, endY, durationMs) {
  const steps = Math.max(12, Math.floor(durationMs / 16));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const x = startX + (endX - startX) * ease;
    const y = startY + (endY - startY) * ease;
    await page.mouse.move(x, y);
    await new Promise(r => setTimeout(r, durationMs / steps));
  }
}

async function smoothScroll(page, startY, endY, durationMs) {
  const steps = Math.max(16, Math.floor(durationMs / 16));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const y = startY + (endY - startY) * ease;
    await page.evaluate(top => window.scrollTo(0, top), y);
    await new Promise(r => setTimeout(r, durationMs / steps));
  }
}

(async () => {
  const recordingsDir = path.join(__dirname, '../recordings-official-720p');
  if (fs.existsSync(recordingsDir)) {
    fs.rmSync(recordingsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(recordingsDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const context = await browser.newContext({
    recordVideo: { dir: recordingsDir, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  const video = page.video();

  const realArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../demo-out/real-live-artifact.json'), 'utf8'));

  // Intercept /api/stress-test to return realArtifact naturally via SSE stream without reload
  await page.route('**/api/stress-test', async route => {
    // Artificial 10s delay to show the beautiful 6-stage deterministic pipeline progress
    await new Promise(r => setTimeout(r, 10000));
    
    const sseFrames = [
      ': stream-open\n\n',
      'data: {"type":"progress","stageId":"MARKET_STATE","message":"Checking market state..."}\n\n',
      'data: {"type":"progress","stageId":"EVIDENCE","message":"Searching live sources..."}\n\n',
      'data: {"type":"progress","stageId":"STRESS","message":"Computing deterministic stress shocks..."}\n\n',
      'data: {"type":"progress","stageId":"DECONSTRUCT","message":"Deconstructing trade claims..."}\n\n',
      'data: {"type":"progress","stageId":"COUNTER_THESIS","message":"Generating adversarial counter-thesis..."}\n\n',
      'data: {"type":"progress","stageId":"POLICY","message":"Evaluating risk policy..."}\n\n',
      `data: {"type":"result","status":200,"data":{"step":"DECISION_READY","artifact":${JSON.stringify(realArtifact)}}}\n\n`
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

  // 1. Navigate to Landing Page
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

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

  // Inject custom smooth pointer cursor
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.id = 'demo-mouse-pointer';
    cursor.style = 'position:fixed;top:0;left:0;width:22px;height:22px;z-index:9999999;pointer-events:none;transform:translate(640px, 340px);transition:transform 0.04s ease-out;';
    cursor.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
      <path d="M5.5 3.2L18.5 13.5L12.5 14.5L16 21.5L13.5 22.5L10 15.5L5.5 19.5V3.2Z" fill="#0E2436" stroke="#FFFFFF" stroke-width="1.6"/>
    </svg>`;
    document.body.appendChild(cursor);

    window.addEventListener('mousemove', e => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });

    window.addEventListener('mousedown', e => {
      const ripple = document.createElement('div');
      ripple.style = `position:fixed;top:${e.clientY - 12}px;left:${e.clientX - 12}px;width:24px;height:24px;border-radius:50%;background:rgba(200,16,46,0.4);border:2px solid #C8102E;pointer-events:none;z-index:9999998;animation:demoRipple 0.35s ease-out forwards;`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 350);
    });

    const style = document.createElement('style');
    style.innerHTML = `@keyframes demoRipple { from { transform: scale(0.6); opacity: 1; } to { transform: scale(2.2); opacity: 0; } }`;
    document.head.appendChild(style);
  });

  console.log('[00:00 - 00:10] Act 1: Landing Page');
  await page.mouse.move(640, 340);
  await page.waitForTimeout(4500);

  // Move cursor toward "Stress a trade" button
  const stressBtn = page.locator('button', { hasText: 'Stress a trade' }).first();
  const btnBox = await stressBtn.boundingBox();
  if (btnBox) {
    await smoothMouseMove(page, 640, 340, btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2, 1600);
    await page.waitForTimeout(600);
    await page.mouse.down();
    await stressBtn.click();
    await page.mouse.up();
  }

  console.log('[00:10 - 00:32] Act 2: Desk Workspace Entry & Typing');
  await page.waitForSelector('textarea', { timeout: 10000 });
  await page.waitForTimeout(1200);

  const textarea = page.locator('textarea');
  const taBox = await textarea.boundingBox();
  if (taBox) {
    await smoothMouseMove(page, 400, 300, taBox.x + 80, taBox.y + 35, 1000);
    await page.mouse.down();
    await textarea.click();
    await page.mouse.up();
  }

  // Type thesis naturally
  const promptText = "I want to go long $25,000 on rTSLA on Saturday morning after autonomous driving demo rumors, while NASDAQ cash venue is closed and wrapper premium drifts +3.1%.";
  console.log('Typing thesis...');
  await textarea.pressSequentially(promptText, { delay: 42 });
  await page.waitForTimeout(1500);

  // Move cursor to "Run Adversarial Desk" button
  const runBtn = page.locator('button:has-text("Run Adversarial Desk")').first();
  const runBox = await runBtn.boundingBox();
  if (runBox) {
    await smoothMouseMove(page, taBox ? taBox.x + 80 : 400, taBox ? taBox.y + 35 : 400, runBox.x + runBox.width / 2, runBox.y + runBox.height / 2, 1200);
    await page.waitForTimeout(600);
    await page.mouse.down();
    await runBtn.click();
    await page.mouse.up();
  }

  console.log('[00:32 - 00:45] Act 3: Normalized Trade Review Card');
  await page.waitForSelector('text=Normalized trade review', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Hover over review parameters
  await smoothMouseMove(page, runBox ? runBox.x : 800, runBox ? runBox.y : 600, 420, 360, 1200);
  await page.waitForTimeout(1800);
  await smoothMouseMove(page, 420, 360, 800, 360, 1200);
  await page.waitForTimeout(1800);

  // Click Execute Stress Test button
  const executeBtn = page.locator('button:has-text("Execute Stress Test")').first();
  const execBox = await executeBtn.boundingBox();
  if (execBox) {
    await smoothMouseMove(page, 800, 360, execBox.x + execBox.width / 2, execBox.y + execBox.height / 2, 1000);
    await page.waitForTimeout(500);
    await page.mouse.down();
    await executeBtn.click();
    await page.mouse.up();
  }

  console.log('[00:45 - 00:58] Act 4: Deterministic Risk Pipeline Progress');
  await page.waitForSelector('text=Deterministic Risk Pipeline', { timeout: 10000 });
  // The route mock provides a smooth 12s delay during which the progress bar cycles through all stages
  await page.waitForSelector('button:has-text("Audit provenance")', { timeout: 25000 });
  console.log('[00:58 - 01:12] Act 5: Real Decision Artifact View (Seamless, No Reload)');
  await page.waitForTimeout(2000);

  // Inspect Market State Reconstruction
  await smoothMouseMove(page, 640, 360, 480, 420, 1200);
  await page.waitForTimeout(3000);
  await smoothMouseMove(page, 480, 420, 580, 420, 1000);
  await page.waitForTimeout(3500);

  console.log('[01:12 - 01:22] Act 6: Scrolling to Deterministic Scenarios');
  await smoothScroll(page, 0, 460, 1800);
  await page.waitForTimeout(3500);

  // Highlight Combined Shock (-$2,703.94)
  await smoothMouseMove(page, 580, 420, 1050, 480, 1200);
  await page.waitForTimeout(3500);

  console.log('[01:22 - 01:31] Act 7: Audit Provenance Drawer (Smooth Slide-In)');
  await smoothScroll(page, 460, 0, 1400);
  await page.waitForTimeout(800);

  const provBtn = page.locator('button:has-text("Audit provenance")').first();
  const pBox = await provBtn.boundingBox();
  if (pBox) {
    await smoothMouseMove(page, 640, 300, pBox.x + pBox.width / 2, pBox.y + pBox.height / 2, 1000);
    await page.waitForTimeout(400);
    await page.mouse.down();
    await provBtn.click();
    await page.mouse.up();
  }

  await page.waitForSelector('text=Provenance & Data Lineage', { timeout: 8000 });
  await page.waitForTimeout(1000);

  // Click OBSERVED FACT tab
  const factTab = page.locator('button:has-text("OBSERVED FACT")').first();
  const fBox = await factTab.boundingBox();
  if (fBox) {
    await smoothMouseMove(page, pBox ? pBox.x : 1000, 180, fBox.x + fBox.width / 2, fBox.y + fBox.height / 2, 1000);
    await page.waitForTimeout(400);
    await page.mouse.down();
    await factTab.click();
    await page.mouse.up();
  }
  await page.waitForTimeout(3500);

  console.log('[01:31 - 01:38] Act 8: Outro Brand Resolve & CTA');
  // Inject clean outro dissolve overlay
  await page.evaluate(() => {
    const outro = document.createElement('div');
    outro.style = 'position:fixed;inset:0;background:#06121C;z-index:99999999;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity 0.8s ease-in-out;font-family:monospace;';
    outro.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
        <svg viewBox="0 0 100 100" width="56" height="56">
          <path d="M12 18 L68 18 L68 34 L12 34 Z M32 66 L88 66 L88 82 L32 82 Z" fill="#FFFFFF"/>
          <path d="M48 6 L56 6 L44 94 L36 94 Z" fill="#C8102E"/>
        </svg>
        <div style="display:flex;flex-direction:column;">
          <span style="font-size:12px;letter-spacing:3px;font-weight:700;color:#8FA2B5;">BITGET AI</span>
          <span style="font-size:26px;font-weight:900;letter-spacing:1px;color:#FFFFFF;">REDTEAM DESK</span>
        </div>
      </div>
      <div style="font-size:14px;color:#C98A14;font-weight:700;letter-spacing:2px;margin-bottom:14px;">TRACK 3: DECISION STRESS TESTING</div>
      <div style="font-size:18px;color:#FFFFFF;font-weight:600;letter-spacing:0.5px;margin-bottom:8px;">Stress-test before the market does.</div>
      <div style="font-size:13px;color:#8FA2B5;letter-spacing:0.5px;">redteamdesk.name.ng</div>
    `;
    document.body.appendChild(outro);
    requestAnimationFrame(() => { outro.style.opacity = '1'; });
  });

  await page.waitForTimeout(5000);

  // Clean shutdown
  console.log('Closing page and finalizing video recording...');
  await page.close();
  await context.close();
  const savedVideoPath = await video.path();
  await browser.close();
  console.log('Seamless 1280x720 video recorded cleanly to:', savedVideoPath);
})();
