const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// VIDEO 3: BRAND CUT — DESKTOP (live-data retake)
// 1280x720 @ 1x. NO route interception. NO injected artifact. NO fake SSE.
// NO time compression: the live pipeline runs at real length; Act 4 waits for
// the real DECISION_READY render (60s cap) exactly like the mobile build.
// Read-only CDP Runtime.addBinding fetch-tee mirrors the app's own SSE to
// demo-out/brand-desktop-live-recorded-sse.tmp.txt. Verdicts shown after each
// tolerance tap are read from the rendered DOM and logged (read-only) so the
// audio builder can speak what the screen actually showed.
// ---------------------------------------------------------------------------

const RECORD_LOG = path.join(__dirname, '../demo-out/brand-desktop-live-record-log.json');
const SSE_TEE = path.join(__dirname, '../demo-out/brand-desktop-live-recorded-sse.tmp.txt');
const taps = {};
let recordingStart = 0; // set when the recorded context starts (module scope: hoverClick reads it)

async function smoothMouseMove(page, startX, startY, endX, endY, durationMs) {
  const steps = Math.min(24, Math.max(8, Math.floor(durationMs / 40)));
  const stepDelay = Math.max(8, Math.floor(durationMs / steps) - 8);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    await page.mouse.move(startX + (endX - startX) * ease, startY + (endY - startY) * ease);
    await new Promise(r => setTimeout(r, stepDelay));
  }
}

async function movePointer(page, targetX, targetY, durationMs = 500) {
  const pos = await page.evaluate(() => {
    const p = document.getElementById('demo-mouse-pointer');
    if (!p) return { x: 640, y: 360 };
    const m = p.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 640, y: 360 };
  });
  await smoothMouseMove(page, pos.x, pos.y, targetX, targetY, durationMs);
  await page.evaluate(({ x, y }) => {
    const p = document.getElementById('demo-mouse-pointer');
    if (p) p.style.transform = `translate(${x}px, ${y}px)`;
  }, { x: targetX, y: targetY });
}

async function hoverClick(page, box, label) {
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await movePointer(page, cx, cy, 550);
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.up();
  taps[label] = +( (Date.now() - recordingStart) / 1000 ).toFixed(2);
  console.log(`[${taps[label]}s] Clicked ${label}`);
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

(async () => {
  const recordingsDir = path.join(__dirname, '../recordings-brand-desktop');
  if (fs.existsSync(recordingsDir)) fs.rmSync(recordingsDir, { recursive: true, force: true });
  fs.mkdirSync(recordingsDir, { recursive: true });
  if (fs.existsSync(SSE_TEE)) fs.rmSync(SSE_TEE, { force: true });

  console.log('Launching Chrome for 1280x720 @ 1x LIVE brand desktop capture...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  // Pre-warm the route so page load has no compile delay during recording
  const warm = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await warm.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await warm.waitForTimeout(1200).catch(() => {});
  await warm.close().catch(() => {});

  const context = await browser.newContext({
    recordVideo: { dir: recordingsDir, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
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
    if (!window.__sseTelemetry) return;
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

  recordingStart = Date.now();
  const getElapsed = () => (Date.now() - recordingStart) / 1000;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const waitUntilTime = async (targetSec) => {
    const remainingMs = Math.max(0, (targetSec - getElapsed()) * 1000);
    if (remainingMs > 0) await page.waitForTimeout(remainingMs);
  };

  console.log(`[${getElapsed().toFixed(2)}s] Loading Desktop Landing Page (LIVE, no mocks)...`);
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

  // Desktop cursor: small translucent ring pointer + heartbeat animator.
  // The heartbeat continuously animates the ring's opacity so the headless
  // screencast emits a frame at least every ~100ms — without it, the recorder
  // drops frames during static stretches and the webm's timeline compresses
  // (video time drifts away from wall-clock tap times, breaking AV sync and
  // the integrity of the recorded timeline).
  await page.evaluate(() => {
    const pointer = document.createElement('div');
    pointer.id = 'demo-mouse-pointer';
    pointer.style = `
      position: fixed; top: 0; left: 0; width: 14px; height: 14px; border-radius: 50%;
      background: rgba(255, 255, 255, 0.35); border: 2px solid #C8102E;
      box-shadow: 0 0 8px rgba(200, 16, 46, 0.55); z-index: 9999999; pointer-events: none;
      transform: translate(640px, 360px);
    `;
    document.body.appendChild(pointer);
    const beat = document.createElement('div');
    beat.id = 'demo-heartbeat';
    beat.style = `position: fixed; top: 0; left: 0; width: 2px; height: 2px; background: rgba(14,36,54,0.006); z-index: 9999990; pointer-events: none;`;
    document.body.appendChild(beat);
    (function pulse() {
      const t = performance.now() / 500; // ~2 Hz
      const v = 0.004 + 0.004 * (0.5 + 0.5 * Math.sin(t));
      beat.style.background = `rgba(14,36,54,${v.toFixed(4)})`;
      requestAnimationFrame(pulse);
    })();
  });

  // On-screen evaluation caption per spec sheet (static text, no numbers)
  const showEvalCaption = () => page.evaluate(() => {
    const caption = document.createElement('div');
    caption.id = 'eval-caption-overlay';
    caption.style = 'position:fixed;bottom:24px;left:24px;right:24px;background:#0E2436;border:1px solid #C98A14;color:#FFFFFF;padding:10px 16px;font-family:monospace;font-size:13px;font-weight:700;letter-spacing:0.5px;z-index:9999999;box-shadow:0 8px 24px rgba(0,0,0,0.4);border-radius:4px;text-align:center;';
    caption.innerHTML = '<span style="color:#C98A14;">●</span> Typical evaluation: 12–50s, depending on live model routing.';
    document.body.appendChild(caption);
  });
  const removeOverlays = () => page.evaluate(() => {
    document.getElementById('eval-caption-overlay')?.remove();
  });

  // =========================================================================
  // ACT 1 [00:00–00:11] — hero, hover tickers, click STRESS A TRADE
  // =========================================================================
  console.log(`[${getElapsed().toFixed(2)}s] Act 1: Hook on Desktop Landing Page (LIVE)`);
  await waitUntilTime(3.0);
  await movePointer(page, 900, 250, 700);       // hover live tickers
  await waitUntilTime(5.5);
  await movePointer(page, 480, 300, 600);

  await waitUntilTime(8.0);
  const stressBtn = page.locator('button:visible', { hasText: /stress a trade/i }).first();
  const stressBox = await stressBtn.boundingBox();
  if (stressBox) {
    await movePointer(page, stressBox.x + stressBox.width / 2, stressBox.y + stressBox.height / 2, 700);
  }
  await waitUntilTime(10.0);
  if (stressBox) {
    await hoverClick(page, stressBox, 'stress');
  } else {
    await stressBtn.click({ force: true });
    taps.stress = +getElapsed().toFixed(2);
  }

  // =========================================================================
  // ACT 2 [00:11–00:30] — workspace, type thesis, click RUN ADVERSARIAL DESK
  // =========================================================================
  await page.waitForSelector('textarea', { timeout: 15000 });
  await page.addStyleTag({
    content: `
      nextjs-portal, #nextjs-dev-overlay, [data-nextjs-toast], [data-nextjs-dialog-overlay] {
        display: none !important; opacity: 0 !important; pointer-events: none !important;
      }
    `
  });

  await waitUntilTime(13.5);
  const textarea = page.locator('textarea').first();
  const areaBox = await textarea.boundingBox();
  if (areaBox) {
    await movePointer(page, areaBox.x + areaBox.width / 2, areaBox.y + areaBox.height / 2, 450);
    await page.mouse.move(areaBox.x + areaBox.width / 2, areaBox.y + areaBox.height / 2);
    await page.mouse.down(); await page.mouse.up();
  }
  await waitUntilTime(14.0);
  const rtslaThesis = "I want to go long $25,000 on rTSLA this Saturday morning because autonomous driving demo rumors are building on social, and I want to front-run Monday.";
  await inPageType(page, 'textarea', rtslaThesis);

  await waitUntilTime(27.5);
  const runDeskBtn = page.locator('button:visible', { hasText: /run adversarial desk/i }).first();
  const runBox = await runDeskBtn.boundingBox();
  if (runBox) {
    await movePointer(page, runBox.x + runBox.width / 2, runBox.y + runBox.height / 2, 350);
  }
  await waitUntilTime(29.0);
  if (runBox) {
    await hoverClick(page, runBox, 'runDesk');
  } else {
    await runDeskBtn.click({ force: true });
    taps.runDesk = +getElapsed().toFixed(2);
  }

  // =========================================================================
  // ACT 3 [00:30–00:42] — checkpoint card shows LIVE parsed fields
  // =========================================================================
  await Promise.race([
    page.waitForSelector('text=Normalized trade review', { timeout: 15000 }),
    sleep(6000)
  ]);
  console.log(`[${getElapsed().toFixed(2)}s] Act 3: Checkpoint card (live parsed fields)`);

  await waitUntilTime(32.5);
  await movePointer(page, 640, 330, 500);
  await waitUntilTime(36.0);
  await movePointer(page, 640, 400, 500);

  await waitUntilTime(39.5);
  const execBtn = page.locator('button:visible', { hasText: /execute stress test/i }).first();
  const execBox = await execBtn.boundingBox();
  if (execBox) {
    await movePointer(page, execBox.x + execBox.width / 2, execBox.y + execBox.height / 2, 400);
  }
  await waitUntilTime(41.2);
  if (execBox) {
    await hoverClick(page, execBox, 'execute');
  } else {
    await execBtn.click({ force: true });
    taps.execute = +getElapsed().toFixed(2);
  }
  console.log(`[${taps.execute}s] LIVE pipeline begins`);

  // =========================================================================
  // ACT 4 [00:42–…]: REAL live run. No staged beats — the app's own SSE
  // drives the UI. NO time compression; we wait for the real render.
  // =========================================================================
  await Promise.race([
    page.waitForSelector('text=Deterministic Risk Pipeline', { timeout: 15000 }),
    sleep(6000)
  ]);
  await showEvalCaption();
  console.log(`[${getElapsed().toFixed(2)}s] Act 4: live pipeline running (real stages, no compression)`);

  const landed = await Promise.race([
    page.waitForFunction(() => {
      const h = document.querySelector('h2');
      return !!h && /WAIT|REJECT|REDUCE|PROCEED/.test(h.innerText);
    }, { timeout: 60000 }).then(() => true).catch(() => false),
    sleep(60500)
  ]);
  taps.artifactLand = +getElapsed().toFixed(2);
  taps.act4LiveDuration = +(taps.artifactLand - taps.execute).toFixed(2);
  console.log(`[${taps.artifactLand}s] LIVE artifact landed: ${landed} | act4 live=${taps.act4LiveDuration}s`);
  await removeOverlays();

  // =========================================================================
  // ACT 5 [~+0–12s after land] — verdict card + Market State dwell
  // =========================================================================
  console.log(`[${getElapsed().toFixed(2)}s] Act 5: Verdict & Market State`);
  await page.waitForTimeout(2500);
  await movePointer(page, 640, 320, 500);

  await page.waitForTimeout(2500);
  await Promise.race([inPageSmoothScroll(page, 420, 800), sleep(2500)]);
  await page.waitForTimeout(2500);
  await movePointer(page, 640, 430, 500);

  // =========================================================================
  // ACT 6 — real tolerance recomputes; verdicts read from the rendered DOM
  // =========================================================================
  console.log(`[${getElapsed().toFixed(2)}s] Act 6: Risk-Tolerance Lever`);
  await Promise.race([inPageSmoothScroll(page, 0, 800), sleep(2500)]);

  const lowBtn = page.locator('button:visible', { hasText: /^LOW$/i }).first();
  const highBtn = page.locator('button:visible', { hasText: /^HIGH$/i }).first();
  const medBtn = page.locator('button:visible', { hasText: /^MED$/i }).first();
  const lowBox = await lowBtn.boundingBox().catch(() => null);
  const highBox = await highBtn.boundingBox().catch(() => null);
  const medBox = await medBtn.boundingBox().catch(() => null);
  console.log(`[${getElapsed().toFixed(2)}s] Tolerance boxes: LOW=${!!lowBox} HIGH=${!!highBox} MED=${!!medBox}`);

  await page.waitForTimeout(2000);
  if (lowBox) await movePointer(page, lowBox.x + lowBox.width / 2, lowBox.y + lowBox.height / 2, 500);
  await page.waitForTimeout(1500);
  if (lowBox) await hoverClick(page, lowBox, 'low');
  else { await lowBtn.click({ force: true }); taps.low = +getElapsed().toFixed(2); }
  await page.waitForTimeout(1200);
  taps.verdictAfterLow = await readVerdictTitle(page);
  console.log(`[${taps.low}s] Tapped LOW -> ${taps.verdictAfterLow}`);

  if (highBox) await movePointer(page, highBox.x + highBox.width / 2, highBox.y + highBox.height / 2, 300);
  await page.waitForTimeout(1200);
  if (highBox) await hoverClick(page, highBox, 'high');
  else { await highBtn.click({ force: true }); taps.high = +getElapsed().toFixed(2); }
  await page.waitForTimeout(1200);
  taps.verdictAfterHigh = await readVerdictTitle(page);
  console.log(`[${taps.high}s] Tapped HIGH -> ${taps.verdictAfterHigh}`);

  if (medBox) await movePointer(page, medBox.x + medBox.width / 2, medBox.y + medBox.height / 2, 300);
  await page.waitForTimeout(1200);
  if (medBox) await hoverClick(page, medBox, 'med');
  else { await medBtn.click({ force: true }); taps.med = +getElapsed().toFixed(2); }
  await page.waitForTimeout(1000);
  taps.verdictAfterMed = await readVerdictTitle(page);
  console.log(`[${taps.med}s] Tapped MED -> ${taps.verdictAfterMed}`);

  await page.waitForTimeout(1500);
  await movePointer(page, 640, 340, 600);

  // =========================================================================
  // ACT 7 — live What-If recompute (50% toggle) + provenance drawer
  // =========================================================================
  console.log(`[${getElapsed().toFixed(2)}s] Act 7: What-If Sandbox`);
  const halfBtn = page.locator('button:has-text("50%")').first();
  await halfBtn.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  const halfBox = await halfBtn.boundingBox().catch(() => null);
  if (halfBox) await movePointer(page, halfBox.x + halfBox.width / 2, halfBox.y + halfBox.height / 2, 450);
  await page.waitForTimeout(1800);
  if (halfBox) await hoverClick(page, halfBox, 'fifty');
  else { await halfBtn.click({ force: true }); taps.fifty = +getElapsed().toFixed(2); }
  console.log(`[${taps.fifty}s] Tapped 50% size`);

  await page.waitForTimeout(2000);
  const auditBtn = page.locator('button:has-text("Audit provenance"), button:has-text("Provenance")').first();
  await auditBtn.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  const auditBox = await auditBtn.boundingBox().catch(() => null);
  if (auditBox) await movePointer(page, auditBox.x + auditBox.width / 2, auditBox.y + auditBox.height / 2, 400);
  await page.waitForTimeout(1200);
  if (auditBox) await hoverClick(page, auditBox, 'audit');
  else { await auditBtn.click({ force: true }); taps.audit = +getElapsed().toFixed(2); }
  console.log(`[${taps.audit}s] Tapped 'Audit provenance'`);

  await page.waitForTimeout(2200);
  const closeBtn = page.locator('button:has-text("Close"), button[aria-label*="lose"], button:has-text("✕")').first();
  const closeBox = await closeBtn.boundingBox().catch(() => null);
  if (closeBox) {
    await movePointer(page, closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2, 300);
    await hoverClick(page, closeBox, 'close');
  } else {
    await closeBtn.click({ force: true }).catch(() => {});
    taps.close = +getElapsed().toFixed(2);
  }
  console.log(`[${taps.close}s] Closed provenance drawer`);

  // =========================================================================
  // ACT 8 — brand outro lockup
  // =========================================================================
  console.log(`[${getElapsed().toFixed(2)}s] Act 8: Brand outro`);
  await page.evaluate(() => {
    const outro = document.createElement('div');
    outro.id = 'brand-lockup-outro-desktop';
    outro.style = `
      position: fixed; inset: 0; z-index: 99999999;
      background: #0E2436; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.8s ease-in-out;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      text-align: center;
    `;
    outro.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:22px;margin-bottom:30px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 124 124" width="84" height="84" fill="none" style="filter:drop-shadow(0 4px 20px rgba(200,16,46,0.45));flex-shrink:0;">
          <path d="M 32.80,4.13 L 84.80,4.13 L 102.80,22.13 L 102.80,37.24 L 14.80,55.95 L 14.80,22.13 Z M 45.80,24.13 L 71.80,24.13 L 82.80,35.13 L 82.80,41.49 L 34.80,51.70 L 34.80,35.13 Z" fill="#FFFFFF" fill-rule="evenodd"/>
          <path d="M 85.20,44.05 L 85.20,77.87 L 67.20,95.87 L 15.20,95.87 L -2.80,77.87 L -2.80,62.76 Z M 65.20,48.30 L 65.20,64.87 L 54.20,75.87 L 28.20,75.87 L 17.20,64.87 L 17.20,58.51 Z" fill="#FFFFFF" fill-rule="evenodd"/>
          <path d="M -2.80,62.76 L -1.34,59.38 L 102.80,37.24 L 101.34,40.62 Z" fill="#C8102E"/>
        </svg>
        <div style="display:flex;flex-direction:column;align-items:flex-start;line-height:1;text-align:left;">
          <span style="font-size:14px;letter-spacing:4px;font-weight:600;color:rgba(240,244,248,0.75);margin-bottom:8px;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">BITGET AI</span>
          <span style="font-size:30px;font-weight:800;letter-spacing:1px;color:#FFFFFF;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">REDTEAM DESK</span>
        </div>
      </div>
      <div style="display:inline-block;padding:6px 16px;background:rgba(201,138,20,0.12);border:1px solid rgba(201,138,20,0.4);border-radius:4px;font-size:13px;color:#C98A14;font-weight:700;letter-spacing:2px;margin-bottom:20px;text-transform:uppercase;">TRACK 3: DECISION STRESS TESTING</div>
      <div style="font-size:20px;color:#FFFFFF;font-weight:700;letter-spacing:0.5px;margin-bottom:20px;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">Stress-test before the market does.</div>
      <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 18px;background:rgba(14,159,139,0.12);border:1px solid rgba(14,159,139,0.35);border-radius:6px;font-size:15px;color:#00F0FF;font-weight:600;letter-spacing:1px;">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#00F0FF;box-shadow:0 0 8px #00F0FF;"></span>
        redteamdesk.name.ng
      </div>
    `;
    document.body.appendChild(outro);
    requestAnimationFrame(() => outro.style.opacity = '1');
  });

  // Hold the outro long enough that the captured video always outlasts the
  // voice track: the audio builder anchors act 8 to end ~67s after the
  // artifact lands, so keep rendering the (static) end card until at least
  // artifactLand + 70s. Holding a static brand card adds time without
  // touching any live act.
  const outroStart = getElapsed();
  const targetEnd = taps.artifactLand + 70;
  const outroHold = Math.max(9, targetEnd - outroStart);
  await page.waitForTimeout(outroHold * 1000);
  taps.recordingEnd = +getElapsed().toFixed(2);
  taps.totalDuration = taps.recordingEnd;
  console.log(`[${taps.recordingEnd}s] Finalizing LIVE capture...`);

  fs.writeFileSync(RECORD_LOG, JSON.stringify({
    recordedAt: new Date().toISOString(),
    dataMode: 'LIVE_NO_INTERCEPTION',
    format: '1280x720',
    thesis: "I want to go long $25,000 on rTSLA this Saturday morning because autonomous driving demo rumors are building on social, and I want to front-run Monday.",
    taps,
    sseTee: SSE_TEE
  }, null, 2));

  await page.close();
  await context.close();
  await browser.close();

  const webmFiles = fs.readdirSync(recordingsDir).filter(f => f.endsWith('.webm'));
  console.log('LIVE brand desktop video recorded to:', path.join(recordingsDir, webmFiles[0]));
  console.log('Interaction log ->', RECORD_LOG);

  // Wall-clock sync guard: the screencast must have kept emitting frames
  // (heartbeat) so video duration tracks the real elapsed time. A large
  // mismatch means frames were dropped and the take is unusable for sync.
  const { execSync } = require('child_process');
  const durOut = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${path.join(recordingsDir, webmFiles[0])}"`,
    { encoding: 'utf8' }
  ).trim();
  const videoDur = parseFloat(durOut);
  const drift = Math.abs(videoDur - taps.recordingEnd);
  console.log(`SYNC CHECK: video=${videoDur}s wall=${taps.recordingEnd}s drift=${drift.toFixed(2)}s ${drift < 2.5 ? 'OK' : 'TAKE UNUSABLE (frames dropped)'}`);
  process.exitCode = drift < 2.5 ? 0 : 3;
})().catch(e => { console.error('RECORD_ERROR', e); process.exit(1); });
