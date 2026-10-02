// Extracts the artifact from the read-only SSE tee captured during a live
// brand-cut recording. Whatever this script writes is exactly what the screen
// rendered — the source of truth for voice/captions. Shared by the mobile
// (Video 4) and desktop (Video 3) pipelines.
//
// Usage:
//   node scripts/extract-brand-live-artifact.cjs [--sse <tee-file>] [--out <artifact-file>]
// Defaults: the original mobile paths (demo-out/brand-live-*).
//
// The tee appended a newline per raw chunk, which can split an SSE event
// mid-JSON. Recovery is safe: SSE data events are JSON.stringify'd and never
// contain raw newlines, so stripping every newline and splitting on the
// literal 'data: ' prefix reconstructs the original event boundaries.
const fs = require('fs');

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const TEE_PATH = argValue('--sse', 'demo-out/brand-live-recorded-sse.tmp.txt');
const OUT_PATH = argValue('--out', 'demo-out/brand-live-recorded-artifact.json');

const raw = fs.readFileSync(TEE_PATH, 'utf8');
console.log('tee:', TEE_PATH, '| bytes:', raw.length);

const stripped = raw.replace(/\r?\n/g, '');
const parts = stripped.split('data: ').filter(p => p.trim().length > 0);
console.log('SSE events reconstructed:', parts.length);

let resultEvent = null;
for (const p of parts) {
  if (p.includes('"type":"result"')) { resultEvent = p; break; }
}
if (!resultEvent) {
  console.log('NO result EVENT IN TEE. Event shapes:', parts.map(p => p.slice(0, 60)));
  process.exit(1);
}

// The result event may carry trailing whitespace/junk from chunk joins; find
// the outermost JSON object it starts with via balanced-brace scan.
const start = resultEvent.indexOf('{');
if (start < 0) { console.log('NO JSON IN result EVENT'); process.exit(1); }
let depth = 0, end = -1, inStr = false, esc = false;
for (let i = start; i < resultEvent.length; i++) {
  const c = resultEvent[i];
  if (esc) { esc = false; continue; }
  if (c === '\\') { esc = true; continue; }
  if (c === '"') { inStr = !inStr; continue; }
  if (inStr) continue;
  if (c === '{') depth++;
  if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
if (end < 0) { console.log('UNBALANCED result JSON'); process.exit(1); }

const result = JSON.parse(resultEvent.slice(start, end));
const a = result.data && result.data.artifact ? result.data.artifact : result.artifact;
if (!a) { console.log('NO artifact FIELD. keys:', Object.keys(result)); process.exit(1); }

fs.writeFileSync(OUT_PATH, JSON.stringify(a, null, 1));

const cs = (a.scenarios || []).find(s => s.id === 'COMBINED_SHOCK');
console.log('--- RECORDED RUN ARTIFACT (data of record) ---');
console.log('verdict:', a.decision.verdict);
console.log('qty:', a.trade.quantity, '| entry:', a.trade.entryPrice);
console.log('token:', a.marketState.instrumentPrice, '| ref:', a.marketState.referencePrice, '| prevClose:', a.marketState.referencePreviousClose);
console.log('combined PnL:', cs && cs.estimatedPnlUsd, '(', cs && cs.estimatedPnlPct, '%)');
console.log('dataSource:', a.dataSource, '| session:', a.marketState.sessionStatus);
console.log('gated band:', a.thesisPosition && a.thesisPosition.gatedVerdictResult && a.thesisPosition.gatedVerdictResult.band);
console.log('-> ' + OUT_PATH);
