import asyncio
import edge_tts
import os
import subprocess

VOICE = "en-US-ChristopherNeural"

# The calibrated beats synchronized with the 100-second timeline (00:00 - 01:40)
BEATS = [
    {
        "id": 1,
        "start": 0.5,
        "rate": "+0%",
        "text": "We all know that crypto never sleeps, but stock exchanges do. Most weekends, people jump into tokenized stocks based off rumors and get wrecked by Monday."
    },
    {
        "id": 2,
        "start": 11.8,
        "rate": "+2%",
        "text": "Let's say I'm looking at Tesla on a Saturday morning, and then some autonomous driving demo rumors start to pop off, and I feel like putting twenty-five grand on it. I'd first plug it into Bitget AI RedTeam Desk to tear that thought apart before I touch any money."
    },
    {
        "id": 3,
        "start": 31.5,
        "rate": "+2%",
        "text": "It catches my size and direction instantly, checks the off-hours liquidity, and sets up the test. I think everything looks fine, so I'll just hit execute."
    },
    {
        "id": 4,
        "start": 43.5,
        "rate": "+6%",
        "text": "Now what you see is the RedTeam Desk kicking into gear. It doesn't dish out any generic chatbot fluff—it runs through six deterministic checks, pulling live market data, checking actual news evidence, and stress-testing the math behind my thesis."
    },
    {
        "id": 5,
        "start": 58.8,
        "rate": "+4%",
        "text": "The first red flag it showed me is the price gap. Tesla closed at three-eighty on Friday, but this token is trading around three seventy-seven. That spread is already eating into my position."
    },
    {
        "id": 6,
        "start": 71.8,
        "rate": "+4%",
        "text": "Next, it shocks the position. If Bitcoin dumps eight percent over the weekend, I'm looking at losing about twenty-seven hundred bucks just from market contagion."
    },
    {
        "id": 7,
        "start": 81.8,
        "rate": "+9%",
        "text": "It then tells me to wait until the real stock market opens Monday. When in doubt, I can even open the audit drawer and trace every single fact back to its source."
    },
    {
        "id": 8,
        "start": 91.8,
        "rate": "+10%",
        "text": "The Desk saved me three grand even before I had breakfast."
    },
    {
        "id": 9,
        "start": 95.4,
        "rate": "+12%",
        "text": "Bitget AI RedTeam Desk. Stress-test before the market does."
    }
]

TEMP_DIR = "demo-out/audio-beats-100s"
os.makedirs(TEMP_DIR, exist_ok=True)
OUT_DIR = "public/demo"
os.makedirs(OUT_DIR, exist_ok=True)

FFMPEG = r"C:\Users\HP\Desktop\agentic-product-demo\node_modules\ffmpeg-static\ffmpeg.exe"

def get_duration(file_path):
    cmd = [FFMPEG, "-i", file_path]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            dur_str = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = dur_str.split(":")
            return float(h) * 3600 + float(m) * 60 + float(s)
    return 0.0

async def generate_beats():
    print(f"Generating {len(BEATS)} beats with voice {VOICE}...")
    durations = {}
    for beat in BEATS:
        out_path = os.path.join(TEMP_DIR, f"beat_{beat['id']}.mp3")
        communicate = edge_tts.Communicate(beat["text"], VOICE, rate=beat["rate"])
        with open(out_path, "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
        
        dur = get_duration(out_path)
        durations[beat["id"]] = dur
        end_time = beat["start"] + dur
        print(f"Beat {beat['id']}: start {beat['start']}s -> dur {dur:.2f}s -> end {end_time:.2f}s")
    return durations

def assemble_master_audio():
    print("Assembling master voiceover audio track with exact adelay...")
    inputs = []
    filter_parts = []
    mix_labels = []
    
    for i, beat in enumerate(BEATS):
        beat_file = os.path.join(TEMP_DIR, f"beat_{beat['id']}.mp3")
        inputs.extend(["-i", beat_file])
        delay_ms = int(beat["start"] * 1000)
        filter_parts.append(f"[{i}]adelay={delay_ms}|{delay_ms}[a{i}]")
        mix_labels.append(f"[a{i}]")
    
    filter_complex = ";".join(filter_parts) + ";" + "".join(mix_labels) + f"amix=inputs={len(BEATS)}:normalize=0[outa]"
    
    clean_vo_mp3 = os.path.join(OUT_DIR, "voiceover-100s-metacomm.mp3")
    cmd = [
        FFMPEG, "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[outa]",
        "-c:a", "libmp3lame", "-b:a", "192k",
        clean_vo_mp3
    ]
    subprocess.run(cmd, check=True)
    print(f"Master clean voiceover successfully created at: {clean_vo_mp3}")
    
    # Check master duration
    dur = get_duration(clean_vo_mp3)
    print(f"Master Voiceover Duration: {dur:.2f}s")

def create_subtle_music_mix():
    print("Creating mixed audio with subtle ducked background music...")
    clean_vo_mp3 = os.path.join(OUT_DIR, "voiceover-100s-metacomm.mp3")
    ambient_mp3 = "demo-out/ambient-bed.mp3"
    mixed_mp3 = os.path.join(OUT_DIR, "voiceover-100s-mixed.mp3")
    
    if os.path.exists(ambient_mp3):
        # Mix with sidechain compression ducking
        cmd = [
            FFMPEG, "-y",
            "-i", clean_vo_mp3,
            "-i", ambient_mp3,
            "-filter_complex",
            "[1:a]volume=0.065[ambient];[ambient][0:a]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=350[ducked];[0:a][ducked]amix=inputs=2:duration=first[aout]",
            "-map", "[aout]",
            "-c:a", "libmp3lame", "-b:a", "192k",
            mixed_mp3
        ]
        subprocess.run(cmd, check=True)
        dur = get_duration(mixed_mp3)
        print(f"Mixed voiceover + ambient track created at: {mixed_mp3} (duration: {dur:.2f}s)")

def generate_vtt(durations):
    def fmt(seconds):
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = seconds % 60
        return f"{h:02d}:{m:02d}:{s:06.3f}"

    vtt_path = os.path.join(OUT_DIR, "voiceover-100s-metacomm.vtt")
    with open(vtt_path, "w", encoding="utf-8") as f:
        f.write("WEBVTT - Bitget AI RedTeam Desk 100s Demo Voiceover\n\n")
        for beat in BEATS:
            start_s = beat["start"]
            dur = durations.get(beat["id"], 5.0)
            end_s = start_s + dur
            f.write(f"{fmt(start_s)} --> {fmt(end_s)}\n")
            f.write(f"{beat['text']}\n\n")
    print(f"WebVTT subtitles successfully written to: {vtt_path}")

def mux_video():
    demo_video = os.path.join(OUT_DIR, "demo.mp4")
    mixed_mp3 = os.path.join(OUT_DIR, "voiceover-100s-mixed.mp3")
    out_video = os.path.join(OUT_DIR, "demo-with-voiceover.mp4")
    
    if os.path.exists(demo_video) and os.path.exists(mixed_mp3):
        print("Muxing mixed voiceover with demo.mp4...")
        cmd = [
            FFMPEG, "-y",
            "-i", demo_video,
            "-i", mixed_mp3,
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k",
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-shortest",
            out_video
        ]
        subprocess.run(cmd, check=True)
        dur = get_duration(out_video)
        print(f"Final muxed demo video created at: {out_video} (duration: {dur:.2f}s)")

async def main():
    durations = await generate_beats()
    assemble_master_audio()
    create_subtle_music_mix()
    generate_vtt(durations)
    mux_video()

if __name__ == "__main__":
    asyncio.run(main())
