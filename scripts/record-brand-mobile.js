const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// VIDEO 4: BRAND CUT — MOBILE (take 2: 100% LIVE DATA)
// 412x915 @ 2.5x. NO route interception. NO injected artifact. NO fake SSE.
// The app's real fetch to /api/stress-test runs untouched; a read-only CDP
// binding tees the live SSE response to demo-out/brand-live-recorded-sse.tmp.txt
// so the audio builder can speak the exact numbers the screen rendered.
// Every interaction timestamp is logged for exact SFX placement.
// ---------------------------------------------------------------------------

const RECORD_LOG = path.join(__dirname, '../demo-out/brand-live-record-log.json');
const SSE_TEE = path.join(__dirname, '../demo-out/brand-live-recorded-sse.tmp.txt');
const taps = {};

async function inPageTouchMove(page, targetX, targetY, durationMs = 500) {
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
        if (progress < 1) requestAnimationFrame(step); else resolve();
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
      ripple.style = `position:fixed;top:${y - 20}px;left:${x - 20}px;width:40px;height:40px;border-radius:50%;background:rgba(200,16,46,0.35);border:2px solid #C8102E;pointer-events:none;z-index:9999998;animation:touchRipple 0.45s ease-out forwards;`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 450);
      setTimeout(() => {
        pointer.style.transform = `translate(${x - 14}px, ${y - 14}px) scale(1.0)`;
      }, 150);
    }
  }, { x, y });
}

async function inPageSmoothScroll(page, targetY, durationMs = 700) {
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
        if (progress < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
  }, { targetY, durationMs });
}

// Realistic keystroke cadence: 45-75ms random jitter per character (spec sheet)
async function inPageType(page, selector, text) {
  await page.evaluate(async ({ selector, text }) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    for (let i = 1; i <= text.length; i++) {
      setter.call(el, text.slice(0, i));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 45 + Math.random() * 30));
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { selector, text });
}

(async () => {
  const recordingsDir = path.join(__dirname, '../recordings-brand-mobile');
  if (fs.existsSync(recordingsDir)) fs.rmSync(recordingsDir, { recursive: true, force: true });
  fs.mkdirSync(recordingsDir, { recursive: true });
  if (fs.existsSync(SSE_TEE)) fs.rmSync(SSE_TEE, { force: true });

  console.log('Launching Chrome for 412x915 @ 2.5x LIVE brand mobile capture...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const context = await browser.newContext({
    recordVideo: { dir: recordingsDir, size: { width: 412, height: 915 } },
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.5
  });

  const page = await context.newPage();

  // ---- Read-only SSE telemetry (tee), wired before any navigation ----------
  const cdp = await context.newCDPSession(page);
  await cdp.send('Runtime.enable');
  await cdp.send('Runtime.addBinding', { name: '__sseTelemetry' });
  cdp.on('Runtime.bindingCalled', ev => {
    if (ev.name === '__sseTelemetry') {
      fs.appendFileSync(SSE_TEE, ev.payload + '\n');
    }
  });
  // Telemetry-only init script: wraps fetch, tees the stress-test response body,
  // hands the untouched twin branch back to the app. Changes no app behavior.
  await page.addInitScript(() => {
    if (!window.__sseTelemetry) return; // binding not present -> do nothing
    const origFetch = window.fetch;
    window.fetch = async function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const resp = await origFetch.apply(this, arguments);
      if (url.includes('/api/stress-test') && resp && resp.body) {
        try {
          const [teeBranch, pageBranch] = resp.body.tee();
          (async () => {
            const reader = teeBranch.getReader();
            const dec = new TextDecoder();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                window.__sseTelemetry(dec.decode(value, { stream: true }));
              }
            } catch (e) { /* tee reader ended; app branch unaffected */ }
          })();
          return new Response(pageBranch, {
            status: resp.status,
            statusText: resp.statusText,
            headers: resp.headers
          });
        } catch (e) { return resp; }
      }
      return resp;
    };
  });

  const recordingStart = Date.now();
  const getElapsed = () => (Date.now() - recordingStart) / 1000;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const waitUntilTime = async (targetSec) => {
    const remainingMs = Math.max(0, (targetSec - getElapsed()) * 1000);
    if (remainingMs > 0) await page.waitForTimeout(remainingMs);
  };
  // Best-effort verdict read: never queues, never delays the next cue
  const readVerdictTitle = async (pg) => {
    try {
      await pg.waitForFunction(
        () => { const h = document.querySelector('h2'); return h && h.innerText && h.innerText.trim().length > 0; },
        { timeout: 2000 }
      );
      return await pg.evaluate(() => document.querySelector('h2').innerText.trim());
    } catch (e) {
      return 'verdict-check-skipped';
    }
  };

  console.log(`[${getElapsed().toFixed(2)}s] Loading Mobile Landing Page (LIVE, no mocks)...`);
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('bitget_rtd_workspace_state_v1'));
  await page.reload({ waitUntil: 'domcontentloaded' });

  await page.addStyleTag({
    content: `
      nextjs-portal, #nextjs-dev-overlay, [data-nextjs-toast], [data-nextjs-dialog-overlay] {
        display: none !important; opacity: 0 !important; pointer-events: none !important;
      }
    `
  });

  // Mobile touch pointer: semi-transparent white dot, #C8102E ring, ripple on tap
  await page.evaluate(() => {
    const pointer = document.createElement('div');
    pointer.id = 'demo-touch-pointer';
    pointer.style = `
      position: fixed; top: 0; left: 0; width: 28px; height: 28px; border-radius: 50%;
      background: rgba(255, 255, 255, 0.4); border: 2px solid #C8102E;
      box-shadow: 0 0 10px rgba(200, 16, 46, 0.6); z-index: 9999999; pointer-events: none;
      transform: translate(192px, 436px);
      transition: transform 0.04s ease-out, scale 0.15s ease-out;
    `;
    document.body.appendChild(pointer);
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes touchRipple {
        from { transform: scale(0.5); opacity: 1; }
        to { transform: scale(2.4); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  });

  // On-screen evaluation caption per spec sheet (static text, no numbers)
  const showEvalCaption = () => page.evaluate(() => {
    const caption = document.createElement('div');
    caption.id = 'eval-caption-overlay';
    caption.style = 'position:fixed;bottom:24px;left:12px;right:12px;background:#0E2436;border:1px solid #C98A14;color:#FFFFFF;padding:8px 14px;font-family:monospace;font-size:11.5px;font-weight:700;letter-spacing:0.5px;z-index:9999999;box-shadow:0 8px 24px rgba(0,0,0,0.4);border-radius:4px;text-align:center;';
    caption.innerHTML = '<span style="color:#C98A14;">●</span> Typical evaluation: 12–50s, depending on live model routing.';
    document.body.appendChild(caption);
  });
  const removeOverlays = () => page.evaluate(() => {
    document.getElementById('eval-caption-overlay')?.remove();
    document.getElementById('model-failover-badge-mobile')?.remove();
  });

  // =========================================================================
  // ACT 1 [voice 0.8 -> 14.67]
  // =========================================================================
  console.log(`[${getElapsed().toFixed(2)}s] Act 1: Hook on Mobile Landing Page (LIVE)`);
  await waitUntilTime(6.5);
  await inPageTouchMove(page, 206, 260, 600);
  await waitUntilTime(9.5);
  await inPageTouchMove(page, 206, 330, 500);

  await waitUntilTime(13.0);
  const stressBtn = page.locator('button:visible', { hasText: /stress a trade/i }).first();
  const stressBox = await stressBtn.boundingBox();
  if (stressBox) {
    await inPageTouchMove(page, stressBox.x + stressBox.width / 2, stressBox.y + stressBox.height / 2, 700);
  }
  await waitUntilTime(14.5);
  if (stressBox) {
    await simulateTap(page, stressBox.x + stressBox.width / 2, stressBox.y + stressBox.height / 2);
  }
  await stressBtn.click({ force: true });
  taps.stress = +getElapsed().toFixed(2);
  console.log(`[${taps.stress}s] Tapped 'Stress a trade'`);

  // =========================================================================
  // ACT 2 [voice 15.97 -> 28.74]
  // =========================================================================
  await page.waitForSelector('textarea', { timeout: 15000 });
  await page.addStyleTag({
    content: `
      nextjs-portal, #nextjs-dev-overlay, [data-nextjs-toast], [data-nextjs-dialog-overlay] {
        display: none !important; opacity: 0 !important; pointer-events: none !important;
      }
    `
  });

  await waitUntilTime(17.5);
  const textarea = page.locator('textarea').first();
  const areaBox = await textarea.boundingBox();
  if (areaBox) {
    await inPageTouchMove(page, areaBox.x + areaBox.width / 2, areaBox.y + areaBox.height / 2, 400);
    await simulateTap(page, areaBox.x + areaBox.width / 2, areaBox.y + areaBox.height / 2);
  }
  await waitUntilTime(17.2);
  const rtslaThesis = "I want to long $25,000 on rTSLA this Saturday morning because autonomous driving demo rumors are building on social, and I want to front-run Monday.";
  await inPageType(page, 'textarea', rtslaThesis);

  await waitUntilTime(27.2);
  await inPageTouchMove(page, 206, areaBox ? areaBox.y + areaBox.height + 40 : 380, 200);

  const runDeskBtn = page.locator('button:visible', { hasText: /run adversarial desk/i }).first();
  const runBox = await runDeskBtn.boundingBox();
  if (runBox) {
    await inPageTouchMove(page, runBox.x + runBox.width / 2, runBox.y + runBox.height / 2, 250);
  }
  await waitUntilTime(28.3);
  if (runBox) {
    await simulateTap(page, runBox.x + runBox.width / 2, runBox.y + runBox.height / 2);
  }
  await runDeskBtn.click({ force: true });
  taps.runDesk = +getElapsed().toFixed(2);
  console.log(`[${taps.runDesk}s] Tapped 'Run Adversarial Desk'`);

  // =========================================================================
  // ACT 3 [voice 29.64 -> ~42.9] — checkpoint card shows LIVE parsed fields
  // =========================================================================
  await Promise.race([
    page.waitForSelector('text=Normalized trade review', { timeout: 15000 }),
    sleep(6000)
  ]);
  console.log(`[${getElapsed().toFixed(2)}s] Act 3: Checkpoint card (live parsed fields)`);

  await waitUntilTime(33.0);
  await inPageTouchMove(page, 206, 300, 500);
  await waitUntilTime(37.0);
  await inPageTouchMove(page, 206, 360, 500);

  await waitUntilTime(41.5);
  const execBtn = page.locator('button:visible', { hasText: /execute stress test/i }).first();
  const execBox = await execBtn.boundingBox();
  if (execBox) {
    await inPageTouchMove(page, execBox.x + execBox.width / 2, execBox.y + execBox.height / 2, 400);
  }
  await waitUntilTime(43.2);
  if (execBox) {
    await simulateTap(page, execBox.x + execBox.width / 2, execBox.y + execBox.height / 2);
  }
  await execBtn.click({ force: true });
  taps.execute = +getElapsed().toFixed(2);
  console.log(`[${taps.execute}s] Tapped 'Execute Stress Test' — LIVE pipeline begins`);

  // =========================================================================
  // ACT 4: REAL live run. No staged beats — the app's own SSE drives the UI.
  // =========================================================================
  await Promise.race([
    page.waitForSelector('text=Deterministic Risk Pipeline', { timeout: 15000 }),
    sleep(6000)
  ]);
  await showEvalCaption();
  console.log(`[${getElapsed().toFixed(2)}s] Act 4: live pipeline running (real stages)`);

  // Wait for the artifact to land (real DECISION_READY render), cap 60s
  const landStart = getElapsed();
  const landed = await Promise.race([
    page.waitForFunction(() => {
      const h = document.querySelector('h2');
      return !!h && /WAIT|REJECT|REDUCE|PROCEED/.test(h.innerText);
    }, { timeout: 60000 }).then(() => true).catch(() => false),
    sleep(60500)
  ]);
  taps.artifactLand = +getElapsed().toFixed(2);
  taps.act4LiveDuration = +(taps.artifactLand - taps.execute).toFixed(2);
  taps.act4WindowPlanned = +(65.2 - taps.execute).toFixed(2);
  taps.act4Overflow = +(Math.max(0, taps.act4LiveDuration - taps.act4WindowPlanned)).toFixed(2);
  console.log(`[${taps.artifactLand}s] LIVE artifact landed: ${landed} | act4 live=${taps.act4LiveDuration}s vs window=${taps.act4WindowPlanned}s | overflow=${taps.act4Overflow}s`);
  await removeOverlays();

  // =========================================================================
  // ACT 5 [voice ~65.2+ -> ~82] — verdict card + Market State (all live)
  // =========================================================================
  console.log(`[${getElapsed().toFixed(2)}s] Act 5: Verdict & Market State`);
  await waitUntilTime(67.0);
  await inPageTouchMove(page, 206, 300, 500);

  await waitUntilTime(71.5);
  await Promise.race([inPageSmoothScroll(page, 300, 800), sleep(2500)]);

  await waitUntilTime(76.5);
  await Promise.race([inPageSmoothScroll(page, 620, 800), sleep(2500)]);
  await waitUntilTime(79.0);
  await inPageTouchMove(page, 206, 460, 500);

  // =========================================================================
  // ACT 6 [voice 83.3 -> 105.2] — real tolerance recomputes, taps on SFX cues
  // =========================================================================
  console.log(`[${getElapsed().toFixed(2)}s] Act 6: Risk-Tolerance Lever`);
  await waitUntilTime(84.5);
  await Promise.race([inPageSmoothScroll(page, 0, 800), sleep(2500)]);

  // Pre-fetch all three tolerance buttons BEFORE their cues
  const lowBtn = page.locator('button:visible', { hasText: /^LOW$/i }).first();
  const highBtn = page.locator('button:visible', { hasText: /^HIGH$/i }).first();
  const medBtn = page.locator('button:visible', { hasText: /^MED$/i }).first();
  const lowBox = await lowBtn.boundingBox().catch(() => null);
  const highBox = await highBtn.boundingBox().catch(() => null);
  const medBox = await medBtn.boundingBox().catch(() => null);
  console.log(`[${getElapsed().toFixed(2)}s] Tolerance boxes: LOW=${!!lowBox} HIGH=${!!highBox} MED=${!!medBox}`);

  await waitUntilTime(90.5);
  if (lowBox) {
    await inPageTouchMove(page, lowBox.x + lowBox.width / 2, lowBox.y + lowBox.height / 2, 600);
  }

  await waitUntilTime(93.8);
  if (lowBox) {
    await simulateTap(page, lowBox.x + lowBox.width / 2, lowBox.y + lowBox.height / 2);
  }
  await lowBtn.click({ force: true });
  taps.low = +getElapsed().toFixed(2);
  console.log(`[${taps.low}s] Tapped LOW -> ${await readVerdictTitle(page)}`);

  if (highBox) {
    await inPageTouchMove(page, highBox.x + highBox.width / 2, highBox.y + highBox.height / 2, 250);
  }
  await waitUntilTime(96.2);
  if (highBox) {
    await simulateTap(page, highBox.x + highBox.width / 2, highBox.y + highBox.height / 2);
  }
  await highBtn.click({ force: true });
  taps.high = +getElapsed().toFixed(2);
  console.log(`[${taps.high}s] Tapped HIGH -> ${await readVerdictTitle(page)}`);

  if (medBox) {
    await inPageTouchMove(page, medBox.x + medBox.width / 2, medBox.y + medBox.height / 2, 250);
  }
  await waitUntilTime(99.0);
  if (medBox) {
    await simulateTap(page, medBox.x + medBox.width / 2, medBox.y + medBox.height / 2);
  }
  await medBtn.click({ force: true });
  taps.med = +getElapsed().toFixed(2);
  console.log(`[${taps.med}s] Tapped MED -> ${await readVerdictTitle(page)}`);

  await waitUntilTime(101.0);
  await inPageTouchMove(page, 206, 300, 600);

  // =========================================================================
  // ACT 7 [voice 106.51 -> ~116.5] — live What-If recompute
  // =========================================================================
  console.log(`[${getElapsed().toFixed(2)}s] Act 7: What-If Sandbox`);
  const halfBtn = page.locator('button:has-text("50%")').first();
  await halfBtn.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  const halfBox = await halfBtn.boundingBox().catch(() => null);
  if (halfBox) {
    await inPageTouchMove(page, halfBox.x + halfBox.width / 2, halfBox.y + halfBox.height / 2, 400);
  }
  await waitUntilTime(108.0);
  if (halfBox) {
    await simulateTap(page, halfBox.x + halfBox.width / 2, halfBox.y + halfBox.height / 2);
  }
  await halfBtn.click({ force: true });
  taps.fifty = +getElapsed().toFixed(2);
  console.log(`[${taps.fifty}s] Tapped 50% size`);

  await waitUntilTime(110.0);
  await inPageTouchMove(page, 206, halfBox ? halfBox.y + halfBox.height + 60 : 540, 400);

  await waitUntilTime(111.5);
  const auditBtn = page.locator('button:has-text("Audit provenance"), button:has-text("Provenance")').first();
  await auditBtn.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  const auditBox = await auditBtn.boundingBox().catch(() => null);
  if (auditBox) {
    await inPageTouchMove(page, auditBox.x + auditBox.width / 2, auditBox.y + auditBox.height / 2, 400);
  }
  await waitUntilTime(112.5);
  if (auditBox) {
    await simulateTap(page, auditBox.x + auditBox.width / 2, auditBox.y + auditBox.height / 2);
  }
  await auditBtn.click({ force: true });
  taps.audit = +getElapsed().toFixed(2);
  console.log(`[${taps.audit}s] Tapped 'Audit provenance'`);

  await waitUntilTime(114.5);
  await inPageTouchMove(page, 206, 400, 500);

  await waitUntilTime(118.5);
  const closeBtn = page.locator('button:has-text("Close"), button[aria-label*="lose"], button:has-text("✕")').first();
  const closeBox = await closeBtn.boundingBox().catch(() => null);
  if (closeBox) {
    await inPageTouchMove(page, closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2, 300);
    await simulateTap(page, closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2);
    await closeBtn.click({ force: true }).catch(() => {});
  }
  taps.close = +getElapsed().toFixed(2);
  console.log(`[${taps.close}s] Closed provenance drawer`);

  // =========================================================================
  // ACT 8 [voice 117.77 -> 131.28] — brand outro
  // =========================================================================
  console.log(`[${getElapsed().toFixed(2)}s] Act 8: Brand outro`);
  await waitUntilTime(119.5);
  await page.evaluate(() => {
    const outro = document.createElement('div');
    outro.id = 'brand-lockup-outro-mobile';
    outro.style = `
      position: fixed; inset: 0; z-index: 99999999;
      background: #0E2436; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.8s ease-in-out;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      text-align: center; padding: 24px; box-sizing: border-box;
    `;
    outro.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:28px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 124 124" width="68" height="68" fill="none" style="filter:drop-shadow(0 4px 20px rgba(200,16,46,0.45));flex-shrink:0;">
          <path d="M 32.80,4.13 L 84.80,4.13 L 102.80,22.13 L 102.80,37.24 L 14.80,55.95 L 14.80,22.13 Z M 45.80,24.13 L 71.80,24.13 L 82.80,35.13 L 82.80,41.49 L 34.80,51.70 L 34.80,35.13 Z" fill="#FFFFFF" fill-rule="evenodd"/>
          <path d="M 85.20,44.05 L 85.20,77.87 L 67.20,95.87 L 15.20,95.87 L -2.80,77.87 L -2.80,62.76 Z M 65.20,48.30 L 65.20,64.87 L 54.20,75.87 L 28.20,75.87 L 17.20,64.87 L 17.20,58.51 Z" fill="#FFFFFF" fill-rule="evenodd"/>
          <path d="M -2.80,62.76 L -1.34,59.38 L 102.80,37.24 L 101.34,40.62 Z" fill="#C8102E"/>
        </svg>
        <div style="display:flex;flex-direction:column;align-items:flex-start;line-height:1;text-align:left;">
          <span style="font-size:12px;letter-spacing:3.5px;font-weight:600;color:rgba(240,244,248,0.75);margin-bottom:6px;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">BITGET AI</span>
          <span style="font-size:24px;font-weight:800;letter-spacing:1px;color:#FFFFFF;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">REDTEAM DESK</span>
        </div>
      </div>
      <div style="display:inline-block;padding:5px 14px;background:rgba(201,138,20,0.12);border:1px solid rgba(201,138,20,0.4);border-radius:4px;font-size:11px;color:#C98A14;font-weight:700;letter-spacing:1.8px;margin-bottom:18px;text-transform:uppercase;">TRACK 3: DECISION STRESS TESTING</div>
      <div style="font-size:17px;color:#FFFFFF;font-weight:700;letter-spacing:0.5px;margin-bottom:18px;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;padding:0 12px;line-height:1.4;">Stress-test before the market does.</div>
      <div style="display:inline-flex;align-items:center;gap:7px;padding:7px 16px;background:rgba(14,159,139,0.12);border:1px solid rgba(14,159,139,0.35);border-radius:6px;font-size:13px;color:#00F0FF;font-weight:600;letter-spacing:1px;">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#00F0FF;box-shadow:0 0 8px #00F0FF;"></span>
        redteamdesk.name.ng
      </div>
    `;
    document.body.appendChild(outro);
    requestAnimationFrame(() => outro.style.opacity = '1');
  });

  // Hold the clean outro until the 135.78s total duration
  await waitUntilTime(135.78);
  taps.recordingEnd = +getElapsed().toFixed(2);
  console.log(`[${taps.recordingEnd}s] Finalizing LIVE capture...`);

  fs.writeFileSync(RECORD_LOG, JSON.stringify({
    recordedAt: new Date().toISOString(),
    dataMode: 'LIVE_NO_INTERCEPTION',
    thesis: "I want to long $25,000 on rTSLA this Saturday morning because autonomous driving demo rumors are building on social, and I want to front-run Monday.",
    taps,
    sseTee: SSE_TEE
  }, null, 2));

  await page.close();
  await context.close();
  await browser.close();

  const webmFiles = fs.readdirSync(recordingsDir).filter(f => f.endsWith('.webm'));
  console.log('LIVE brand mobile video recorded to:', path.join(recordingsDir, webmFiles[0]));
  console.log('Interaction log ->', RECORD_LOG);
})();
