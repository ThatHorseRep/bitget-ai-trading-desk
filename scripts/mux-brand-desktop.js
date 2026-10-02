const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const recordingsDir = path.join(__dirname, '../recordings-brand-desktop');
const audioMixedMp3 = path.join(__dirname, '../public/demo/brand-desktop-audio-mixed.mp3');
const outDir = path.join(__dirname, '../public/demo');
const srtPath = path.join(outDir, 'brand-desktop.srt');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const webmFiles = fs.readdirSync(recordingsDir).filter(f => f.endsWith('.webm'));
if (webmFiles.length === 0) {
  console.error('No .webm recording found in recordings-brand-desktop!');
  process.exit(1);
}

const videoWebm = path.join(recordingsDir, webmFiles[0]);
const finalMp4 = path.join(outDir, 'brand-desktop-demo.mp4');
const posterJpg = path.join(outDir, 'brand-desktop-poster.jpg');

// Provenance timeline: poster goes at the REAL verdict-card moment of this
// take; the tail pad extends the frozen brand-outro frame (end-card only, no
// live content) when the voice tail slightly overruns the captured video.
const timeline = JSON.parse(fs.readFileSync(path.join(__dirname, '../demo-out/brand-desktop-live-timeline.json'), 'utf8'));
const posterAt = Math.max(1, timeline.swellAt + 2.5);
const tailPad = Math.max(2, (timeline.videoTailPadSeconds || 0) + 1.0);

console.log('Using recorded desktop video:', videoWebm);
console.log('Using master mixed audio:', audioMixedMp3);
console.log(`Muxing 1280x720 (CRF 19 slow, AAC 192k) | poster at ${posterAt}s | outro tail pad ${tailPad}s...`);

// tpad clones the final frame for tailPad seconds so the voice tail is never
// cut; -shortest then trims to the audio length exactly.
const vf = `tpad=stop_mode=clone:stop_duration=${tailPad},scale=1280:720,format=yuv420p`;

const cmd = `ffmpeg -y ` +
  `-i "${videoWebm}" ` +
  `-i "${audioMixedMp3}" ` +
  `-vf "${vf}" ` +
  `-c:v libx264 -preset slow -crf 19 ` +
  `-c:a aac -b:a 192k ` +
  `-shortest -movflags +faststart ` +
  `"${finalMp4}"`;

console.log('Executing FFmpeg command...');
execSync(cmd, { stdio: 'inherit' });

console.log(`Generating poster thumbnail at ${posterAt}s (clean verdict card from this take)...`);
const posterCmd = `ffmpeg -y -ss ${posterAt} -i "${finalMp4}" -vframes 1 -q:v 2 -update 1 "${posterJpg}"`;
execSync(posterCmd, { stdio: 'inherit' });

// Burned-in captions intentionally REMOVED: separate .srt only (pipeline
// convention shared with the mobile brand cut).

console.log('\n=== VIDEO 3: BRAND CUT — DESKTOP (LIVE TAKE) COMPLETED ===');
console.log('Final Video MP4:', finalMp4);
console.log('Poster Thumbnail:', posterJpg);
console.log('Subtitle SRT:', srtPath);
