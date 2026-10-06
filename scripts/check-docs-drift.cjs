#!/usr/bin/env node
/**
 * check-docs-drift.cjs - fails when judge-facing doc headline numbers diverge
 * from live source: test-suite TAP results, test-file count, demo asset sizes,
 * and the cross-document latency pins.
 *
 * Zero dependencies. Run: `npm run check:docs`
 *
 * In CI this runs right after the tee'd `npm test` step and consumes the
 * already-written test-output.txt (no second suite run). Locally, if
 * test-output.txt is missing, the full suite is run once to generate it.
 *
 * Latency figures are a cross-document pin only: every judge-facing doc must
 * state 0.51s fixture / 11.75-50.62s live. Fresh timings are recorded by hand
 * (update EXPECT and the docs together); they are never guessed or re-measured
 * here.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TAP_FILE = path.join(ROOT, 'test-output.txt');

// ---------------------------------------------------------------------------
// Pinned truth - the single source this check enforces. Update here AND in the
// docs together, never separately.
// ---------------------------------------------------------------------------
const EXPECT = {
  tests: { ok: 388, notOk: 0 },
  testFiles: 39,
  // Docs that state the headline test numbers ("366/366" and "38 (test) files").
  testCountDocs: [
    'PRODUCT_DESCRIPTION.md',
    'docs/README.md',
    'docs/SUBMISSION_SIGNOFF.md',
    'docs/PRE_SUBMISSION_REPORT.md',
    'docs/PROBLEMS_AND_SOLUTIONS.md',
  ],
  latency: { fixture: '0.51', liveLow: '11.75', liveHigh: '50.62' },
  // Docs that must state the latency pins (fixture + live range).
  latencyDocs: [
    'PRODUCT_DESCRIPTION.md',
    'docs/GOLDEN_PATH.md',
    'docs/PRE_SUBMISSION_REPORT.md',
    'docs/CONNECTIVITY_REPORT.md',
    'docs/SUBMISSION_SIGNOFF.md',
    'docs/PROBLEMS_AND_SOLUTIONS.md',
  ],
  assets: [
    { file: 'public/demo/brand-desktop-demo.mp4', docMB: 6.8, bytes: 6749953 },
    { file: 'public/demo/brand-mobile-demo.mp4', docMB: 14.3, bytes: 14339843 },
  ],
  // Docs that state the asset sizes ("6.8 MB" / "14.3 MB").
  assetDocs: ['README.md', 'PRODUCT_DESCRIPTION.md', 'SUBMISSION.md'],
  // Rounding headroom: docs round to one decimal (6.75 MB is written "6.8 MB").
  assetToleranceMB: 0.1,
};

// ---------------------------------------------------------------------------
// Fabricated-figure ban. These dollar values were once invented by hand and
// presented as historical outcomes (purged in the integrity pass, see
// docs/PRE_SUBMISSION_REPORT.md Part 1). They must never reappear in any
// tracked doc. Scanned set = every tracked *.md via `git ls-files`, so
// gitignored scratch/ and the local-only docs/archive/ are excluded by design.
// ---------------------------------------------------------------------------
const FORBIDDEN = [
  /\$4,515(\.00)?/, /\$1,420(\.00)?/, /\$1,185(\.00)?/, /\$1,910(\.00)?/,
  /\$862\.45/, /\$1,112\.75/, /\$2,500\+/, /\$2,689\.50/, /\$2,703\.94/,
];
// Judge-facing substance docs that must never carry the fabricated figures.
// The two integrity ledgers (docs/PRE_SUBMISSION_REPORT.md,
// docs/PROBLEMS_AND_SOLUTIONS.md) deliberately quote these values as the
// "Before" column of the purge record, so they are excluded by design.
const FORBIDDEN_DOCS = [
  'ARCHITECTURE_AND_LIMITATIONS.md',
  'PRODUCT_DESCRIPTION.md',
  'README.md',
  'SUBMISSION.md',
  'docs/CONNECTIVITY_REPORT.md',
  'docs/GOLDEN_PATH.md',
  'docs/README.md',
  'docs/RETROSPECTIVE_CASE_STUDIES.md',
  'docs/SHOCK_CALIBRATION_METHODOLOGY.md',
  'docs/SUBMISSION_SIGNOFF.md',
  'docs/VERDICT_GATING.md',
];
const failures = [];
function fail(msg) {
  failures.push(msg);
}

function readDoc(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    fail(`doc missing: ${rel}`);
    return null;
  }
  // Normalize en/em dashes so "11.75s-50.62s" and "11.75-50.62s" both match.
  return fs.readFileSync(abs, 'utf8').replace(/[\u2013\u2014]/g, '-');
}

function docContains(rel, text, needle, label) {
  if (text === null) return;
  if (!text.includes(needle)) {
    fail(`${rel}: pinned ${label} "${needle}" not found`);
  }
}

function checkTap() {
  if (!fs.existsSync(TAP_FILE)) {
    console.log('[check-docs] test-output.txt not found - running the full suite once to generate it...');
    const res = spawnSync('npm', ['test'], {
      cwd: ROOT,
      shell: true,
      encoding: 'utf8',
      timeout: 15 * 60 * 1000,
      env: process.env,
    });
    const output = `${res.stdout || ''}${res.stderr ? `\n${res.stderr}` : ''}`;
    try {
      fs.writeFileSync(TAP_FILE, output);
    } catch (err) {
      fail(`could not write ${path.basename(TAP_FILE)}: ${err.message}`);
      return null;
    }
    if (res.error) {
      fail(`could not run the suite to generate ${path.basename(TAP_FILE)}: ${res.error.message}`);
      return null;
    }
    if (res.status !== 0) {
      fail(`full suite exited ${res.status} while generating ${path.basename(TAP_FILE)}`);
      return null;
    }
  }

  let text;
  try {
    text = fs.readFileSync(TAP_FILE, 'utf8');
  } catch (err) {
    fail(`could not read ${path.basename(TAP_FILE)}: ${err.message}`);
    return null;
  }

  let tests;
  let pass;
  let failCount;
  let skipped;
  let okLines = 0;
  let notOkLines = 0;
  for (const line of text.split(/\r?\n/)) {
    let m;
    if ((m = line.match(/^# tests (\d+)/))) tests = Number(m[1]);
    else if ((m = line.match(/^# pass (\d+)/))) pass = Number(m[1]);
    else if ((m = line.match(/^# fail (\d+)/))) failCount = Number(m[1]);
    else if ((m = line.match(/^# skipped (\d+)/))) skipped = Number(m[1]);
    else if (/^ok /.test(line)) okLines++;
    else if (/^not ok /.test(line)) notOkLines++;
  }

  let tap;
  if (tests !== undefined && pass !== undefined) {
    tap = { ok: pass, notOk: failCount === undefined ? 0 : failCount, skipped, source: 'TAP summary' };
  } else {
    tap = { ok: okLines, notOk: notOkLines, skipped: undefined, source: 'TAP top-level ok lines' };
  }

  if (tap.ok !== EXPECT.tests.ok) {
    fail(`test result drift: TAP reports ${tap.ok} passing, docs pin ${EXPECT.tests.ok} (${tap.source})`);
  }
  if (tap.notOk !== EXPECT.tests.notOk) {
    fail(`failing tests: TAP reports ${tap.notOk} not-ok, docs pin ${EXPECT.tests.notOk} (${tap.source})`);
  }
  if (tap.skipped !== undefined && tap.skipped !== 0) {
    fail(`skipped tests: TAP reports ${tap.skipped} skips, docs claim 0 skips`);
  }
  return tap;
}

function checkTestFiles() {
  const dir = path.join(ROOT, 'tests');
  if (!fs.existsSync(dir)) {
    fail('tests/ directory missing');
    return 0;
  }
  const count = fs.readdirSync(dir).filter((f) => f.endsWith('.test.cjs')).length;
  if (count !== EXPECT.testFiles) {
    fail(`test-file drift: ${count} tests/*.test.cjs on disk, docs pin ${EXPECT.testFiles}`);
  }
  return count;
}

function checkAssets() {
  for (const a of EXPECT.assets) {
    const abs = path.join(ROOT, a.file);
    if (!fs.existsSync(abs)) {
      fail(`asset missing: ${a.file}`);
      continue;
    }
    const bytes = fs.statSync(abs).size;
    const mb = bytes / 1e6;
    if (Math.abs(bytes - a.bytes) / 1e6 > EXPECT.assetToleranceMB) {
      fail(
        `asset size drift: ${a.file} is ${bytes} B (${mb.toFixed(2)} MB), pinned ${a.bytes} B - ` +
          'if this re-render is intentional, re-measure and update the docs together'
      );
    }
    if (Math.abs(mb - a.docMB) > EXPECT.assetToleranceMB) {
      fail(`doc size drift: docs say ${a.docMB} MB for ${a.file}, measured ${mb.toFixed(2)} MB`);
    }
  }
}

function checkForbidden() {
  let hits = 0;
  for (const rel of FORBIDDEN_DOCS) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      fail(`banned-figure scan: doc missing: ${rel}`);
      continue;
    }
    let text;
    try {
      text = fs.readFileSync(abs, 'utf8').replace(/[\u2013\u2014]/g, '-');
    } catch (err) {
      fail(`could not read tracked doc ${rel}: ${err.message}`);
      continue;
    }
    for (const pattern of FORBIDDEN) {
      if (pattern.test(text)) {
        hits++;
        fail(`${rel}: fabricated figure ${pattern} found - this value was purged in the integrity pass and must not return`);
      }
    }
  }
  return hits;
}

function main() {
  const tap = checkTap();
  const fileCount = checkTestFiles();
  checkAssets();
  const forbiddenHits = checkForbidden();

  for (const rel of EXPECT.testCountDocs) {
    const text = readDoc(rel);
    docContains(rel, text, '388/388', 'test count');
    if (text !== null && !/39 (test )?files/.test(text)) {
      fail(`${rel}: pinned test-file count "39 files" not found`);
    }
  }

  for (const rel of EXPECT.latencyDocs) {
    const text = readDoc(rel);
    if (text === null) continue;
    docContains(rel, text, `${EXPECT.latency.fixture}s`, 'fixture latency');
    const range = new RegExp(`${EXPECT.latency.liveLow}s?\\s*-\\s*${EXPECT.latency.liveHigh}s`);
    if (!range.test(text)) {
      fail(`${rel}: pinned live latency range "${EXPECT.latency.liveLow}-${EXPECT.latency.liveHigh}s" not found`);
    }
  }

  for (const rel of EXPECT.assetDocs) {
    const text = readDoc(rel);
    docContains(rel, text, '6.8 MB', 'desktop asset size');
    docContains(rel, text, '14.3 MB', 'mobile asset size');
  }

  console.log('== docs drift check ==');
  if (tap) {
    console.log(
      `tests:   ${tap.ok} ok / ${tap.notOk} not ok (measured, ${tap.source}) vs pinned ` +
        `${EXPECT.tests.ok}/${EXPECT.tests.notOk}`
    );
  }
  console.log(`files:   ${fileCount} tests/*.test.cjs on disk vs pinned ${EXPECT.testFiles}`);
  for (const a of EXPECT.assets) {
    const abs = path.join(ROOT, a.file);
    const size = fs.existsSync(abs) ? fs.statSync(abs).size : NaN;
    console.log(`asset:   ${a.file} ${Number.isNaN(size) ? 'MISSING' : `${(size / 1e6).toFixed(2)} MB`} (measured) vs ${a.docMB} MB (documented)`);
  }
  console.log(
    `latency: ${EXPECT.latency.fixture}s fixture / ${EXPECT.latency.liveLow}-${EXPECT.latency.liveHigh}s live ` +
      `pinned across ${EXPECT.latencyDocs.length} docs`
  );
  console.log(`banned:   ${forbiddenHits} fabricated-figure hits across tracked docs`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} doc-drift failure(s):`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error('\ndocs out of sync with source: FAIL');
    process.exit(1);
  }
  console.log('\ndocs in sync with source: PASS');
  process.exit(0);
}

main();
