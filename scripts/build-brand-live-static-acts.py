import asyncio
import json
import os
import subprocess
import edge_tts

# VIDEO 4 take 2 — 100% LIVE DATA pipeline.
# Acts 1/2/4/6/8 contain no live numbers, so they are generated BEFORE the
# recording and their durations drive the tap schedule. Acts 3/5/7 speak live
# scraped values and are generated AFTER the recording from
# demo-out/brand-live-artifact.json (never the other way around).

OUT_DIR = "demo-out/brand-live-audio"
os.makedirs(OUT_DIR, exist_ok=True)

VOICE = "en-US-ChristopherNeural"

ACTS = [
    {
        "id": 1,
        "rate": "+0%",
        "text": "Okay so — crypto doesn't sleep, but the stock market does. Most weekends people jump into these tokenized stocks off a rumor and just get wrecked by Monday. Let's actually stress-test one right now.",
    },
    {
        "id": 2,
        "rate": "+2%",
        "text": "Say I'm looking at Tesla, Saturday morning — there's rumors going around about an autonomous driving demo. Instead of just FOMOing straight in, I'll type it into the desk and let it actually argue with me a little.",
    },
    # Act 3: generated AFTER recording (speaks live quantity / entry price)
    {
        "id": 4,
        "rate": "+5%",
        "text": "This is the engine actually kicking in — six real checks running underneath. And honestly, if the main model's gateway is down, watch — it just fails over to a backup mid-request. Doesn't touch the money math though, that's pure arithmetic either way. Worst case, you're just waiting a little longer.",
    },
    # Act 5: generated AFTER recording (speaks live verdict / prices / P&L)
    {
        "id": 6,
        "rate": "+5%",
        "text": "Honestly, this next part's my favorite. It's not one rulebook for everyone — watch, same trade, same market, I'm just changing my risk tolerance. Conservative — REJECT. Aggressive — REDUCE. That's an actual threshold moving, not the AI just saying it differently. It adjusts to you.",
    },
    # Act 7: generated AFTER recording (speaks live protected-capital figure)
    {
        "id": 8,
        "rate": "+6%",
        "text": "That right there is a structural trap I would've walked straight into. Bitget AI RedTeam Desk. Stress-test before the market does. Available now at redteamdesk.name.ng.",
    },
]


def ffprobe_duration(path):
    res = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True,
    )
    return float(res.stdout.strip() or 0.0)


async def main():
    print(f"Generating {len(ACTS)} static acts (voice '{VOICE}')...")
    out = {}
    for act in ACTS:
        path = os.path.join(OUT_DIR, f"act{act['id']}.mp3")
        await edge_tts.Communicate(act["text"], VOICE, rate=act["rate"]).save(path)
        d = ffprobe_duration(path)
        out[act["id"]] = {"file": path, "duration": round(d, 3), "rate": act["rate"]}
        print(f"  Act {act['id']}: {d:.2f}s")

    with open("demo-out/brand-live-static-acts.json", "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print("-> demo-out/brand-live-static-acts.json")


if __name__ == "__main__":
    asyncio.run(main())
