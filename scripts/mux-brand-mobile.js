const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const recordingsDir = path.join(__dirname, '../recordings-brand-mobile');
const audioMixedMp3 = path.join(__dirname, '../public/demo/brand-mobile-audio-mixed.mp3');
const outDir = path.join(__dirname, '../public/demo');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const webmFiles = fs.readdirSync(recordingsDir).filter(f => f.endsWith('.webm'));
if (webmFiles.length === 0) {
  console.error('No .webm recording found in recordings-brand-mobile!');
  process.exit(1);
}

const videoWebm = path.join(recordingsDir, webmFiles[0]);
const finalMp4 = path.join(outDir, 'brand-mobile-demo.mp4');
const posterJpg = path.join(outDir, 'brand-mobile-poster.jpg');

console.log('Using recorded mobile video:', videoWebm);
console.log('Using master mixed audio:', audioMixedMp3);
console.log('Muxing high-fidelity portrait video (1080x1920, CRF 19, libx264 slow preset, AAC 192k)...');

// FFmpeg mux command:
// Fits the 412x915 mobile capture cleanly into 1080x1920 portrait with #0E2436 brand navy framing
const vf = `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x0E2436,format=yuv420p`;

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

// Poster: clean WAIT verdict card, mid-Act 5 (verdict on screen 65.2s -> 71.5s)
console.log('Generating high-res mobile poster thumbnail at 68s (clean WAIT verdict card)...');
const posterCmd = `ffmpeg -y -ss 68 -i "${finalMp4}" -vframes 1 -q:v 2 -update 1 "${posterJpg}"`;
execSync(posterCmd, { stdio: 'inherit' });

// Burned-in captions intentionally REMOVED: the retake spec ships a separate
// .srt only (no burned captions). The .ass remains available in public/demo
// if a captioned variant is ever needed again.

console.log('\n=== VIDEO 4: BRAND CUT — MOBILE (LIVE TAKE) COMPLETED SUCCESSFULLY ===');
console.log('Final Video MP4:', finalMp4);
console.log('Poster Thumbnail:', posterJpg);
console.log('Subtitle SRT:', path.join(outDir, 'brand-mobile.srt'));
