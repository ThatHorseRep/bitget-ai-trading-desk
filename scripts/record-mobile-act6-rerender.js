const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// VIDEO 4 ACT 6 RERENDER (post tolerance-fix; user-approved re-render of one
// segment). NO interception, NO injected prices, NO fake SSE.
//
// How the screen is produced:
//   1. demo-out/brand-live-recorded-artifact.json — the artifact the LIVE
//      recording rendered on Sep 29 — is seeded into the app's own
//      localStorage persistence seam (bitget_rtd_workspace_state_v1), so the
//      desk opens on that exact artifact. This is the app's real
//      refresh-restore path, not a mock.
//   2. The tolerance lever is the real UI control; verdicts on screen are
//      recomputed by the SAME pure policy engine used by the server
//      (DecisionArtifactView displayDecision -> evaluateDecision). The
//      script only READS the verdict heading back and logs it.
//
// Timing contract: segment t=0 aligns to old timeline 86.00s. Lever taps at
// segment 7.8s / 10.2s / 13.0s = old 93.8 / 96.2 / 99.0 (the recorded tap
// cues; SFX clicks in the mix land at the same absolute times). Hold until
// 18.5s in segment (= old 104.5s), before Act 7's What-If choreography.
// ---------------------------------------------------------------------------

const ARTIFACT = path.join(__dirname, '../demo-out/brand-live-recorded-artifact.json');
const THESIS = "I want to long $25,000 on rTSLA this Saturday morning because autonomous driving demo rumors are building on social, and I want to front-run Monday.";
const RECORDINGS_DIR = path.join(__dirname, '../recordings-mobile-act6-rerender');
const OUT_LOG = path.join(__dirname, '../demo-out/brand-mobile-act6-rerender-log.json');

const SEGMENT_START_OLD = 86.0; // old-timeline second this segment begins at
const TAPS = { low: 7.8, high: 10.2, med: 13.0 }; // segment-relative
const HOLD_UNTIL = 18.5;

(async () => {
  if (fs.existsSync(RECORDINGS_DIR)) fs.rmSync(RECORDINGS_DIR, { recursive: true, force: true });
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

  const artifact = JSON.parse(fs.readFileSync(ARTIFACT, 'utf8'));
  const seed = JSON.stringify({
    viewMode: 'desk',
    step: 'DECISION_READY',
    prompt: THESIS,
    useFixture: false,
    parsedResult: null,
    artifact,
    timestamp: Date.now()
  });

  console.log('Launching Chrome 412x915 @ 2.5x for Act 6 rerender capture...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext({
    recordVideo: { dir: RECORDINGS_DIR, size: { width: 412, height: 915 } },
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.5
  });
  const page = await context.newPage();

  // Seed BEFORE any app script runs; only this first navigation is seeded.
  await page.addInitScript((seedJson) => {
    try { window.localStorage.setItem('bitget_rtd_workspace_state_v1', seedJson); } catch (e) {}
  }, seed);

  const recordingStart = Date.now();
  const getElapsed = () => (Date.now() - recordingStart) / 1000;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const waitUntilTime = async (targetSec) => {
    const remainingMs = Math.max(0, (targetSec - getElapsed()) * 1000);
    if (remainingMs > 0) await page.waitForTimeout(remainingMs);
  };

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

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  await page.addStyleTag({
    content: `
      nextjs-portal, #nextjs-dev-overlay, [data-nextjs-toast], [data-nextjs-dialog-overlay] {
        display: none !important; opacity: 0 !important; pointer-events: none !important;
      }
    `
  });

  // Same touch pointer styling as the original take (visual continuity).
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

  const simulateTap = (pg, x, y) => pg.evaluate(({ x, y }) => {
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

  const inPageTouchMove = (page, targetX, targetY, durationMs = 500) => page.evaluate(({ targetX, targetY, durationMs }) => {
    return new Promise(resolve => {
      const pointer = document.getElementById('demo-touch-pointer');
      if (!pointer) return resolve();
      const match = pointer.style.transform.match(/translate\(([-\d.]+)px,\s*([-9\d.]+)px\)/);
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

  // ---- Sanity: the desk restored the recorded artifact --------------------
  await page.waitForFunction(
    () => !!document.querySelector('h2') && /WAIT|REJECT|REDUCE|PROCEED/.test(document.querySelector('h2').innerText),
    { timeout: 20000 }
  );
  const baseVerdict = await readVerdictTitle(page);
  const headerState = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].map(b => b.innerText.trim());
    return {
      hasLow: btns.some(t => /^LOW$/i.test(t)),
      hasMed: btns.some(t => /^MED$/i.test(t)),
      hasHigh: btns.some(t => /^HIGH$/i.test(t)),
      activeTolerance: btns.includes('MED') ? 'MED(default)' : 'unknown'
    };
  });
  console.log(`[${getElapsed().toFixed(2)}s] Restored artifact verdict: ${baseVerdict} | header: ${JSON.stringify(headerState)}`);
  if (!/^WAIT/.test(baseVerdict)) throw new Error(`Expected restored artifact verdict WAIT (recorded base), got ${baseVerdict}`);
  if (!headerState.hasLow || !headerState.hasMed || !headerState.hasHigh) throw new Error('Tolerance lever buttons not found');

  const tapsOut = {};

  // ---- LOW (Conservative) at cue 7.8 --------------------------------------
  await waitUntilTime(TAPS.low - 0.9);
  const lowBtn = page.locator('button:visible', { hasText: /^LOW$/i }).first();
  const lowBox = await lowBtn.boundingBox().catch(() => null);
  if (lowBox) await inPageTouchMove(page, lowBox.x + lowBox.width / 2, lowBox.y + lowBox.height / 2, 600);
  await waitUntilTime(TAPS.low);
  if (lowBox) await simulateTap(page, lowBox.x + lowBox.width / 2, lowBox.y + lowBox.height / 2);
  await lowBtn.click({ force: true });
  tapsOut.low = { segmentT: +getElapsed().toFixed(2), oldT: +(SEGMENT_START_OLD + getElapsed()).toFixed(2), verdict: await readVerdictTitle(page) };
  console.log(`[${tapsOut.low.oldT}s abs] Tapped LOW -> ${tapsOut.low.verdict}`);

  // ---- HIGH (Aggressive) at cue 10.2 --------------------------------------
  const highBtn = page.locator('button:visible', { hasText: /^HIGH$/i }).first();
  const highBox = await highBtn.boundingBox().catch(() => null);
  if (highBox) await inPageTouchMove(page, highBox.x + highBox.width / 2, highBox.y + highBox.height / 2, 250);
  await waitUntilTime(TAPS.high);
  if (highBox) await simulateTap(page, highBox.x + highBox.width / 2, highBox.y + highBox.height / 2);
  await highBtn.click({ force: true });
  tapsOut.high = { segmentT: +getElapsed().toFixed(2), oldT: +(SEGMENT_START_OLD + getElapsed()).toFixed(2), verdict: await readVerdictTitle(page) };
  console.log(`[${tapsOut.high.oldT}s abs] Tapped HIGH -> ${tapsOut.high.verdict}`);

  // ---- MED (Moderate) at cue 13.0 -----------------------------------------
  const medBtn = page.locator('button:visible', { hasText: /^MED$/i }).first();
  const medBox = await medBtn.boundingBox().catch(() => null);
  if (medBox) await inPageTouchMove(page, medBox.x + medBox.width / 2, medBox.y + medBox.height / 2, 250);
  await waitUntilTime(TAPS.med);
  if (medBox) await simulateTap(page, medBox.x + medBox.width / 2, medBox.y + medBox.height / 2);
  await medBtn.click({ force: true });
  tapsOut.med = { segmentT: +getElapsed().toFixed(2), oldT: +(SEGMENT_START_OLD + getElapsed()).toFixed(2), verdict: await readVerdictTitle(page) };
  console.log(`[${tapsOut.med.oldT}s abs] Tapped MED -> ${tapsOut.med.verdict}`);

  // Idle pointer drift matching the original take's after-tap motion.
  await waitUntilTime(TAPS.med + 2.0);
  await inPageTouchMove(page, 206, 300, 600);

  // ---- Hold frozen (artifact view is static) until window end -------------
  await waitUntilTime(HOLD_UNTIL);
  const finalVerdict = await readVerdictTitle(page);
  console.log(`[${getElapsed().toFixed(2)}s] Final verdict on screen: ${finalVerdict} (expect WAIT = MODERATE restored)`);

  const log = {
    recordedAt: new Date().toISOString(),
    dataMode: 'ACT6_RERENDER_FROM_RECORDED_ARTIFACT',
    sourceArtifact: 'demo-out/brand-live-recorded-artifact.json',
    restoreMechanism: 'app persistence seam bitget_rtd_workspace_state_v1 (no interception, no injected data)',
    baseVerdictOnScreen: baseVerdict,
    taps: tapsOut,
    finalVerdictOnScreen: finalVerdict,
    segmentStartOldTimeline: SEGMENT_START_OLD,
    holdUntilSegmentT: HOLD_UNTIL
  };
  fs.writeFileSync(OUT_LOG, JSON.stringify(log, null, 2));

  await page.close();
  await context.close();
  await browser.close();

  const webmFiles = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.webm'));
  console.log('Act 6 rerender segment recorded to:', path.join(RECORDINGS_DIR, webmFiles[0] || 'MISSING'));
  console.log('Rerender log ->', OUT_LOG);
  console.log(`Engine-true verdicts this take: LOW=${tapsOut.low.verdict} HIGH=${tapsOut.high.verdict} MED=${tapsOut.med.verdict}`);
})();
