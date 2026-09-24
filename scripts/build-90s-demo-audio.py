import asyncio
import edge_tts
import os
import subprocess

VOICE = "en-US-ChristopherNeural"
RATE = "+0%"
PITCH = "+0Hz"

# The 8 beats synchronized with the ~95-second video
BEATS = [
    {
        "id": 1,
        "start": 0.5,
        "text": "Crypto never sleeps, but stock exchanges do. Over the weekend, people jump into tokenized stocks on rumors and get wrecked by Monday."
    },
    {
        "id": 2,
        "start": 10.5,
        "text": "Say I'm looking at Tesla on a Saturday morning. Some autonomous driving demo rumors start popping off, and I want to put twenty-five grand on it. So I plug it into Bitget AI RedTeam Desk to tear it apart before I touch any money."
    },
    {
        "id": 3,
        "start": 33.0,
        "text": "It catches my size and direction instantly, checks the off-hours liquidity, and sets up the test. Everything looks ready, so I hit execute."
    },
    {
        "id": 4,
        "start": 45.5,
        "text": "That's the RedTeam Desk kicking into gear. No generic chatbot fluff—it runs through six deterministic checks, pulling live market data, checking actual news evidence, and stress-testing the math."
    },
    {
        "id": 5,
        "start": 58.5,
        "text": "First red flag it shows me is the price gap. Tesla closed at three-eighty on Friday, but this token is trading around three seventy-seven. That spread is already eating into my position."
    },
    {
        "id": 6,
        "start": 72.0,
        "text": "Then it shocks the position. If Bitcoin dumps eight percent over the weekend, I'm looking at losing about twenty-seven hundred bucks just from market contagion."
    },
    {
        "id": 7,
        "start": 82.5,
        "text": "It tells me to wait until the real stock market opens Monday. I can even open the audit drawer and trace every single fact back to its source."
    },
    {
        "id": 8,
        "start": 90.0,
        "text": "Saved me three grand before breakfast. Bitget AI RedTeam Desk. Stress-test before the market does."
    }
]

TEMP_DIR = "demo-out/audio-beats"
os.makedirs(TEMP_DIR, exist_ok=True)
FFMPEG = r"C:\Users\HP\Desktop\agentic-product-demo\node_modules\ffmpeg-static\ffmpeg.exe"

async def generate_beats():
    print(f"Generating {len(BEATS)} beats with voice {VOICE}...")
    for beat in BEATS:
        out_path = os.path.join(TEMP_DIR, f"beat_{beat['id']}.mp3")
        srt_path = os.path.join(TEMP_DIR, f"beat_{beat['id']}.srt")
        communicate = edge_tts.Communicate(beat["text"], VOICE, rate=RATE, pitch=PITCH)
        submaker = edge_tts.SubMaker()
        with open(out_path, "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    submaker.feed(chunk)
        
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(submaker.get_srt())
        
        cmd = [FFMPEG, "-i", out_path]
        res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        for line in res.stderr.splitlines():
            if "Duration:" in line:
                dur_str = line.split("Duration:")[1].split(",")[0].strip()
                print(f"Beat {beat['id']} (start: {beat['start']}s) - raw duration: {dur_str}")
                break

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
    
    master_mp3 = "demo-out/voiceover-90s-spoken.mp3"
    cmd = [
        FFMPEG, "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[outa]",
        "-c:a", "libmp3lame", "-b:a", "192k",
        master_mp3
    ]
    subprocess.run(cmd, check=True)
    print(f"Master voiceover successfully created at: {master_mp3}")
    
    res = subprocess.run([FFMPEG, "-i", master_mp3], stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            print(f"Master Audio Duration: {line.split('Duration:')[1].split(',')[0].strip()}")
            break

async def main():
    await generate_beats()
    assemble_master_audio()

if __name__ == "__main__":
    asyncio.run(main())
