const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ffmpeg = 'C:\\Users\\HP\\Desktop\\agentic-product-demo\\node_modules\\ffmpeg-static\\ffmpeg.exe';
const recordingsDir = path.join(__dirname, '../recordings-official-720p');
const voiceoverMp3 = path.join(__dirname, '../demo-out/voiceover-90s-spoken.mp3');
const ambientMp3 = path.join(__dirname, '../demo-out/ambient-bed.mp3');
const outDir = path.join(__dirname, '../public/demo');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Find recorded webm file in recordingsDir
const webmFiles = fs.readdirSync(recordingsDir).filter(f => f.endsWith('.webm'));
if (webmFiles.length === 0) {
  console.error('No .webm recording found in recordings-official-720p!');
  process.exit(1);
}

const videoWebm = path.join(recordingsDir, webmFiles[0]);
const finalMp4 = path.join(outDir, 'redteam-desk-90s-voiceover.mp4');
const posterJpg = path.join(outDir, 'redteam-desk-90s-poster.jpg');

console.log('Using recorded video:', videoWebm);
console.log('Muxing video with primary voiceover and subtle ambient background track...');

// Complex filter:
// 1. Pad video with tpad to cleanly hold outro
// 2. Scale to exact 1280x720, 30fps CFR, yuv420p
// 3. Ambient music: volume -24dB (0.065), sidechain-ducked by speech
// 4. Voiceover: volume 1.0 (0dB)
const cmd = `"${ffmpeg}" -y ` +
  `-i "${videoWebm}" ` +
  `-i "${voiceoverMp3}" ` +
  `-i "${ambientMp3}" ` +
  `-filter_complex "` +
  `[0:v]tpad=stop_mode=clone:stop_duration=3.5,fps=30,scale=1280:720,format=yuv420p[v]; ` +
  `[2:a]volume=0.065[ambient]; ` +
  `[ambient][1:a]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=350[ducked_ambient]; ` +
  `[1:a][ducked_ambient]amix=inputs=2:duration=first:dropout_transition=2[aout]` +
  `" ` +
  `-map "[v]" -map "[aout]" ` +
  `-c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -shortest -movflags +faststart "${finalMp4}"`;

console.log('Executing FFmpeg command...');
execSync(cmd, { stdio: 'inherit' });

console.log('Generating high-res poster image at 65s...');
const posterCmd = `"${ffmpeg}" -y -ss 65 -i "${finalMp4}" -vframes 1 -q:v 2 -update 1 "${posterJpg}"`;
execSync(posterCmd, { stdio: 'inherit' });

console.log('All demo deliverables generated successfully!');
console.log('Final Video:', finalMp4);
console.log('Poster:', posterJpg);
