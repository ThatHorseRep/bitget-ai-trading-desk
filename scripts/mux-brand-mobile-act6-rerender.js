const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// VIDEO 4 re-mux (user-approved): splices the engine-true Act 6 re-render
// segment into the original LIVE capture and muxes WITHOUT -shortest, so the
// mp4 preserves the FULL captured duration (fixes the 2.28s tail trim; the
// final seconds are the frozen brand outro, narration intact).
//
//   Segment t=0 <-> old timeline 86.00s (LEVER starts 86.0).
//   The capture's first ~2.9s is blank browser paint (dev-server load), so
//   the splice trims SEGMENT_TRIM_LEAD off the segment head and lets the
//   ORIGINAL pixels run longer: head [0, 89.0) + segment[3.0, 15.5) + tail
//   [101.5, end). Tap abs times are preserved (93.97 / 96.35 / 99.09).
//   Splice window [89.0, 101.5): 12.5s of segment replaces original.
//
//   WHY 101.5: in the ORIGINAL take the scroll to the What-If sandbox began
//   ~101.6s (halfBtn.scrollIntoViewIfNeeded right after the 101.0 pointer
//   drift), so the original tail [101.5, end) carries its own smooth scroll.
//   At 101.5 BOTH takes show the identical state — MODERATE restored (WAIT),
//   scroll at top, pointer at (206,300) — making the cut seamless. Earlier
//   attempts that ran the segment to 104.5 produced a visible jump from
//   top-of-artifact straight to the scrolled What-If view.
//
//   Verdict words land on their taps (93.8 / 96.2), which ARE in the window.
//   Act 6's last voice second ("It adjusts to you.", ends 109.36) rides on
//   the ORIGINAL pixels, which show the MODERATE (WAIT) verdict from 99.1s.
//   Act 6 voice window [87.45, 109.36] overlaps the window end — the last
//   voice second ("It adjusts to you.") rides on the original pixels, which
//   show the MODERATE (WAIT) verdict on screen from 99.1s on. Verdict words
//   land on their taps (93.8 / 96.2), which ARE in the window.
//
// Resumable: each intermediate is skipped if it already exists on disk.
// ---------------------------------------------------------------------------

const ORIGINAL_WEBM = path.join(__dirname, '../recordings-brand-mobile/page@d040eb97d82e461650f2aeee892e3ea7.webm');
const SEGMENT_WEBM_DIR = path.join(__dirname, '../recordings-mobile-act6-rerender');
const AUDIO = path.join(__dirname, '../public/demo/brand-mobile-audio-mixed.mp3');
const OUT = path.join(__dirname, '../public/demo/brand-mobile-demo.mp4');
const POSTER = path.join(__dirname, '../public/demo/brand-mobile-poster.jpg');
const BACKUP = path.join(__dirname, '../demo-out/brand-mobile-demo.pre-act6-rerender.mp4');

const SPLICE_START = 89.0;      // original pixels hold until here
const SPLICE_END = 101.5;       // original pixels resume here (see WHY 101.5)
const SEGMENT_TRIM_LEAD = 3.0;  // drop blank browser paint from capture head
const SEGMENT_LEN = 18.5;       // captured length
const SEGMENT_USE_LEN = SPLICE_END - SPLICE_START; // 12.5s placed
const BRAND_VF = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x0E2436,format=yuv420p";

const ffprobe = (p) => parseFloat(execSync(
  `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${p}"`,
  { encoding: 'utf8', maxBuffer: 1024 * 1024 }
).trim());

const run = (label, outPath, cmd) => {
  if (fs.existsSync(outPath)) {
    console.log(`[skip] ${label} exists: ${outPath}`);
    return;
  }
  console.log(`[make] ${label}...`);
  execSync(cmd, { stdio: ['ignore', 'ignore', 'inherit'] });
};

// ---------------------------------------------------------------------------
// 0. Backup shipped video before touching anything.
// ---------------------------------------------------------------------------
if (!fs.existsSync(BACKUP)) {
  fs.copyFileSync(OUT, BACKUP);
  console.log('Backed up current shipped video ->', BACKUP);
}

const webmFiles = fs.readdirSync(SEGMENT_WEBM_DIR).filter(f => f.endsWith('.webm'));
if (webmFiles.length === 0) throw new Error('No rerender segment webm found in ' + SEGMENT_WEBM_DIR);
const segmentWebm = path.join(SEGMENT_WEBM_DIR, webmFiles[0]);

const origDur = ffprobe(ORIGINAL_WEBM);
const segDur = ffprobe(segmentWebm);
console.log(`Original webm: ${origDur.toFixed(3)}s | segment webm: ${segDur.toFixed(3)}s`);
if (segDur < SEGMENT_LEN - 0.15) throw new Error(`Segment too short: ${segDur.toFixed(3)}s < ${SEGMENT_LEN}s`);
if (origDur < SPLICE_END) throw new Error('Original webm shorter than splice window');
if (SEGMENT_TRIM_LEAD + SEGMENT_USE_LEN > segDur) throw new Error('Segment webm shorter than requested window');

// ---------------------------------------------------------------------------
// 1. Normalize segment to 1080x1920 brand pad, exactly SEGMENT_LEN seconds
//    (video-only; audio comes entirely from the master mix).
// ---------------------------------------------------------------------------
const segNorm = path.join(__dirname, '../demo-out/act6-segment-1080x1920.mp4');
run('normalized segment', segNorm,
  `ffmpeg -y -ss ${SEGMENT_TRIM_LEAD} -i "${segmentWebm}" -vf "${BRAND_VF}" -t ${SEGMENT_USE_LEN} -an -c:v libx264 -preset slow -crf 19 -r 25 "${segNorm}"`);

// ---------------------------------------------------------------------------
// 2. Cut original into head [0, 89.0) and tail [101.5, end), same brand pad.
// ---------------------------------------------------------------------------
const head = path.join(__dirname, '../demo-out/act6-splice-head.mp4');
const tail = path.join(__dirname, '../demo-out/act6-splice-tail.mp4');
run('head cut', head,
  `ffmpeg -y -i "${ORIGINAL_WEBM}" -t ${SPLICE_START} -vf "${BRAND_VF}" -an -c:v libx264 -preset slow -crf 19 -r 25 "${head}"`);
run('tail cut', tail,
  `ffmpeg -y -ss ${SPLICE_END} -i "${ORIGINAL_WEBM}" -vf "${BRAND_VF}" -an -c:v libx264 -preset slow -crf 19 -r 25 "${tail}"`);

const headDur = ffprobe(head);
const tailDur = ffprobe(tail);
const expected = headDur + SEGMENT_USE_LEN + tailDur;
console.log(`Head: ${headDur.toFixed(3)}s | Tail: ${tailDur.toFixed(3)}s | expected total: ${expected.toFixed(3)}s`);

// ---------------------------------------------------------------------------
// 3. Concat head + segment + tail (identical codec/dimensions, -c copy).
// ---------------------------------------------------------------------------
const concatList = path.join(__dirname, '../demo-out/act6-splice-list.txt');
fs.writeFileSync(concatList, `file '${head.replace(/\\/g, '/')}'\nfile '${segNorm.replace(/\\/g, '/')}'\nfile '${tail.replace(/\\/g, '/')}'\n`);
const spliced = path.join(__dirname, '../demo-out/act6-spliced-source.mp4');
run('concat', spliced, `ffmpeg -y -f concat -safe 0 -i "${concatList}" -c copy "${spliced}"`);
const splicedDur = ffprobe(spliced);
if (Math.abs(splicedDur - expected) > 0.3) throw new Error(`Concat duration ${splicedDur.toFixed(3)} != expected ${expected.toFixed(3)}`);

// ---------------------------------------------------------------------------
// 4. Mux WITHOUT -shortest: full video length shipped; audio ends at ~134.2s
//    (silent tail over the frozen brand outro). Video is already final-spec
//    1080x1920, so it is stream-copied; only audio is encoded.
// ---------------------------------------------------------------------------
console.log('Muxing full-capture-length mp4 (no -shortest, video stream copy)...');
execSync(
  `ffmpeg -y -i "${spliced}" -i "${AUDIO}" ` +
  `-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart "${OUT}"`,
  { stdio: ['ignore', 'ignore', 'inherit'] }
);

// ---------------------------------------------------------------------------
// 5. Poster: same WAIT verdict-card moment as the original take (68s is well
//    clear of the splice window).
// ---------------------------------------------------------------------------
run('poster', POSTER, `ffmpeg -y -ss 68 -i "${OUT}" -vframes 1 -q:v 2 -update 1 "${POSTER}"`);

// ---------------------------------------------------------------------------
// 6. Verify the shipped file.
// ---------------------------------------------------------------------------
const outDur = ffprobe(OUT);
const audioDur = ffprobe(AUDIO);
console.log('\n=== POST-MUX VERIFICATION ===');
console.log(`Shipped mp4  : ${outDur.toFixed(3)}s (original capture ${origDur.toFixed(3)}s)`);
console.log(`Mixed audio  : ${audioDur.toFixed(3)}s (silent tail over frozen outro)`);
console.log(`Tail cut vs original capture: ${(origDur - outDur).toFixed(3)}s (was 2.280s before fix)`);
if (origDur - outDur > 0.2) throw new Error('Tail still trimmed — mux fix did not take');
if (Math.abs(outDur - expected) > 0.3) throw new Error('Shipped duration mismatch vs splice math');

console.log('\n=== VIDEO 4 ACT 6 RERENDER + FULL-LENGTH REMUX COMPLETE ===');
console.log('Shipped:', OUT);
console.log('Backup of previous shipped video:', BACKUP);
