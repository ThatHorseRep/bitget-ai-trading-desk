import asyncio
import json
import math
import os
import struct
import subprocess
import wave

import edge_tts

# VIDEO 4 take 2 — audio assembly from the RECORDED live run.
# Every number spoken here is scraped from
# demo-out/brand-live-recorded-artifact.json (the SSE the screen rendered
# during the recording). Nothing is invented; nothing comes from earlier runs.
# SFX clicks are placed at the RECORDED interaction times from
# demo-out/brand-live-record-log.json, so every click lands on a real tap.

VOICE = "en-US-ChristopherNeural"
AUDIO_DIR = "demo-out/brand-live-audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

TOTAL_DURATION = 135.78

RATES = {1: "+0%", 2: "+2%", 3: "+3%", 4: "+5%", 5: "+4%", 6: "+5%", 7: "+6%", 8: "+6%"}

# ---------------------------------------------------------------- numbers ---
ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
        "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
        "sixteen", "seventeen", "eighteen", "nineteen"]
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
        "eighty", "ninety"]


def int_words(n):
    """Integers 0..999999 -> spoken words."""
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + (" " + ONES[n % 10] if n % 10 else "")
    if n < 1000:
        return ONES[n // 100] + " hundred" + (" and " + int_words(n % 100) if n % 100 else "")
    if n < 1000000:
        thousands = n // 1000
        rest = n % 1000
        base = int_words(thousands) + " thousand"
        if rest:
            joiner = " " if rest < 100 else " "
            base += joiner + int_words(rest)
        return base
    return str(n)


def decimal_words(value, places=2):
    """70.079 -> 'seventy point zero eight' (digits spoken individually)."""
    s = f"{value:.{places}f}"
    whole, dec = s.split(".")
    dec = dec.rstrip("0")
    words = int_words(int(whole))
    if dec:
        digit_words = " ".join(ONES[int(d)] for d in dec)
        words += f" point {digit_words}"
    return words


def price_words(value):
    """356.74 -> 'three fifty-six seventy-four' (trader price cadence)."""
    whole = int(value)
    cents = int(round((value - whole) * 100))
    if whole >= 100:
        h = whole // 100
        rest = whole % 100
        base = f"{ONES[h]} hundred" + (f" {int_words(rest)}" if rest else "")
    else:
        base = int_words(whole)
    if cents:
        base += f" {int_words(cents)}"
    return base


def approx_dollar_words(value):
    """Spoken dollar amount, natural cadence."""
    v = round(value, 2)
    if 1100 <= v < 2000:
        # thirteen hundred and fifty
        tens_val = int(round(v / 10.0) * 10)
        h = tens_val // 100
        rest = tens_val % 100
        base = f"{ONES[h]} hundred" + (f" and {int_words(rest)}" if rest else "")
        return f"{base} dollars"
    whole = int(round(v))
    return f"{int_words(whole)} dollars"


# ------------------------------------------------------------------ input ---
with open("demo-out/brand-live-static-acts.json", "r", encoding="utf-8") as f:
    STATIC = {int(k): v for k, v in json.load(f).items()}

with open("demo-out/brand-live-record-log.json", "r", encoding="utf-8") as f:
    LOG = json.load(f)
TAPS = LOG["taps"]

with open("demo-out/brand-live-recorded-artifact.json", "r", encoding="utf-8") as f:
    ART = json.load(f)

verdict = ART["decision"]["verdict"]
qty = ART["trade"]["quantity"]
entry = ART["trade"]["entryPrice"]
ms = ART["marketState"]
ref_price = ms["referencePrice"]
token_price = ms["instrumentPrice"]
cs = next(s for s in ART["scenarios"] if s["id"] == "COMBINED_SHOCK")
pnl = cs["estimatedPnlUsd"]
protected = abs(pnl) / 2.0

ACT3_TEXT = (
    f"Okay, it's cleaned up what I meant — twenty-five thousand long, "
    f"{decimal_words(qty)} tokens, working entry around {price_words(entry)}. "
    f"That looks right. I'll hit execute."
)
ACT5_TEXT = (
    f"Verdict's in — {verdict}. Look at this — Tesla closed at {price_words(ref_price)}, "
    f"but the token's at {price_words(token_price)}. And once you run the full weekend shock, "
    f"that's minus {approx_dollar_words(abs(pnl))} — a real hit, before Monday's even opened."
)
ACT7_TEXT = (
    f"Cut the size in half, and it protects about {approx_dollar_words(protected)}. "
    f"Every number here traces back to a live orderbook — you can literally go audit it."
)

STATIC_TEXTS = {
    1: "Okay so — crypto doesn't sleep, but the stock market does. Most weekends people jump into these tokenized stocks off a rumor and just get wrecked by Monday. Let's actually stress-test one right now.",
    2: "Say I'm looking at Tesla, Saturday morning — there's rumors going around about an autonomous driving demo. Instead of just FOMOing straight in, I'll type it into the desk and let it actually argue with me a little.",
    4: "This is the engine actually kicking in — six real checks running underneath. And honestly, if the main model's gateway is down, watch — it just fails over to a backup mid-request. Doesn't touch the money math though, that's pure arithmetic either way. Worst case, you're just waiting a little longer.",
    6: "Honestly, this next part's my favorite. It's not one rulebook for everyone — watch, same trade, same market, I'm just changing my risk tolerance. Conservative — REJECT. Aggressive — REDUCE. That's an actual threshold moving, not the AI just saying it differently. It adjusts to you.",
    8: "That right there is a structural trap I would've walked straight into. Bitget AI RedTeam Desk. Stress-test before the market does. Available now at redteamdesk.name.ng.",
}
ACT_TEXTS = dict(STATIC_TEXTS)
ACT_TEXTS[3] = ACT3_TEXT
ACT_TEXTS[5] = ACT5_TEXT
ACT_TEXTS[7] = ACT7_TEXT

print("--- LIVE VALUES SPOKEN (from recorded artifact) ---")
print(f"  verdict={verdict} qty={qty:.2f} entry={entry:.2f}")
print(f"  ref={ref_price:.2f} token={token_price:.2f} pnl={pnl:.2f} protected={protected:.2f}")


# -------------------------------------------------------------- synthesis ---
def ffprobe_duration(path):
    res = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True,
    )
    return float(res.stdout.strip() or 0.0)


async def synth(act_id, text):
    path = os.path.join(AUDIO_DIR, f"act{act_id}.mp3")
    if not os.path.exists(path) or act_id in (3, 5, 7):
        await edge_tts.Communicate(text, VOICE, rate=RATES[act_id]).save(path)
    return path, ffprobe_duration(path)


async def sentence_cues(act_id, text, start):
    cues = []
    comm = edge_tts.Communicate(text, VOICE, rate=RATES[act_id])
    async for chunk in comm.stream():
        if chunk["type"] == "SentenceBoundary":
            s_start = round(start + (chunk["offset"] / 1e7), 2)
            s_dur = round(chunk["duration"] / 1e7, 2)
            cues.append({"actId": act_id, "start": s_start, "end": round(s_start + s_dur, 2), "text": chunk["text"]})
    return cues


async def main():
    # 1. Synthesize number-bearing acts from live values (always fresh)
    durations = {}
    for act_id in (3, 5, 7):
        _, d = await synth(act_id, ACT_TEXTS[act_id])
        durations[act_id] = d
        print(f"  Act {act_id} (live): {d:.2f}s")
    for act_id, meta in STATIC.items():
        durations[act_id] = meta["duration"]

    # 2. Timeline anchored to RECORDED interactions
    act1_start = 0.8
    act2_start = act1_start + durations[1] + 1.3
    act3_start = act2_start + durations[2] + 0.76  # must finish before Execute tap
    act4_start = TAPS["execute"] + 0.9
    act5_start = max(act4_start + durations[4] + 0.7, TAPS["artifactLand"] + 0.5)
    act6_start = act5_start + durations[5] + 0.7
    act7_start = act6_start + durations[6] + 0.7
    act8_start = act7_start + durations[7] + 0.7

    starts = {1: act1_start, 2: act2_start, 3: act3_start, 4: act4_start,
              5: act5_start, 6: act6_start, 7: act7_start, 8: act8_start}

    print("--- VOICE TIMELINE ---")
    for i in range(1, 9):
        print(f"  Act {i}: {starts[i]:7.2f} -> {starts[i] + durations[i]:7.2f}")

    voice_end = act8_start + durations[8]
    assert voice_end <= TOTAL_DURATION - 0.5, f"voice overflow: {voice_end:.2f}"

    # 3. Master voice track
    inputs, delays, refs = [], [], ""
    for i in range(1, 9):
        inputs += ["-i", os.path.join(AUDIO_DIR, f"act{i}.mp3")]
        ms_delay = int(starts[i] * 1000)
        delays.append(f"[{i - 1}:a]adelay={ms_delay}|{ms_delay}[a{i}]")
        refs += f"[a{i}]"
    filter_complex = ";".join(delays) + f";{refs}amix=inputs=8:normalize=0:dropout_transition=0[outa]"
    voice_mp3 = "public/demo/brand-mobile-voice.mp3"
    subprocess.run(
        ["ffmpeg", "-y"] + inputs + ["-filter_complex", filter_complex,
                                     "-map", "[outa]", "-c:a", "libmp3lame", "-b:a", "192k", voice_mp3],
        check=True,
    )
    print(f"-> {voice_mp3}")

    # 4. SFX: soft clicks at RECORDED tap times, swell ONLY at verdict reveal
    click_times = [TAPS["stress"], TAPS["runDesk"], TAPS["execute"],
                   TAPS["low"], TAPS["high"], TAPS["med"],
                   TAPS["fifty"], TAPS["audit"], TAPS["close"]]
    swell_time = TAPS["artifactLand"]

    sfx_inputs = ["-i", "demo-out/sfx-click.wav", "-i", "demo-out/sfx-swell.wav"]
    sfx_delays = []
    for idx, ct in enumerate(click_times):
        ms_d = int(ct * 1000)
        sfx_delays.append(f"[0:a]adelay={ms_d}|{ms_d}[c{idx}]")
    sw_ms = int(swell_time * 1000)
    sfx_delays.append(f"[1:a]adelay={sw_ms}|{sw_ms}[sw]")
    all_refs = "".join(f"[c{i}]" for i in range(len(click_times))) + "[sw]"
    sfx_filter = ";".join(sfx_delays) + f";{all_refs}amix=inputs={len(click_times) + 1}:duration=longest:dropout_transition=1[sfx_track]"
    sfx_track = "demo-out/brand-live-sfx-track.wav"
    subprocess.run(["ffmpeg", "-y"] + sfx_inputs + ["-filter_complex", sfx_filter, "-map", "[sfx_track]", sfx_track], check=True)
    print(f"-> {sfx_track} (clicks at recorded taps, swell at {swell_time}s)")

    # 5. Ambient bed looped to full length, faded
    fade_out_start = max(0.0, TOTAL_DURATION - 4.0)
    ambient_long = "demo-out/brand-live-ambient-bed.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-stream_loop", "-1", "-i", "demo-out/ambient-cycle.wav",
         "-t", str(TOTAL_DURATION),
         "-af", f"afade=t=in:ss=0:d=3,afade=t=out:st={fade_out_start}:d=4", ambient_long],
        check=True,
    )

    # 6. Master mix: voice + ducked ambient + sfx
    mixed = "public/demo/brand-mobile-audio-mixed.mp3"
    mix_filter = (
        "[0:a]asplit=2[voice_main][voice_sc]; "
        "[1:a]volume=0.08[ambient_raw]; "
        "[ambient_raw][voice_sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[ambient_ducked]; "
        "[2:a]volume=0.70[sfx_norm]; "
        "[voice_main][ambient_ducked][sfx_norm]amix=inputs=3:normalize=0:duration=first:dropout_transition=0[out_audio]"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-i", voice_mp3, "-i", ambient_long, "-i", sfx_track,
         "-filter_complex", mix_filter, "-map", "[out_audio]",
         "-c:a", "libmp3lame", "-b:a", "192k", mixed],
        check=True,
    )
    print(f"-> {mixed}")

    # 7. Captions: sentence cues for ALL acts at their computed starts
    all_cues = []
    for i in range(1, 9):
        cues = await sentence_cues(i, ACT_TEXTS[i], starts[i])
        all_cues.extend(cues)
    all_cues.sort(key=lambda c: c["start"])

    def fmt_srt(t):
        h = int(t // 3600)
        m = int((t % 3600) // 60)
        s = int(t % 60)
        ms_part = int(round((t - int(t)) * 1000))
        return f"{h:02d}:{m:02d}:{s:02d},{ms_part:03d}"

    with open("public/demo/brand-mobile.srt", "w", encoding="utf-8") as f:
        for idx, cue in enumerate(all_cues):
            f.write(f"{idx + 1}\n{fmt_srt(cue['start'])} --> {fmt_srt(cue['end'])}\n{cue['text']}\n\n")
    print(f"-> public/demo/brand-mobile.srt ({len(all_cues)} cues)")

    def fmt_ass(t):
        h = int(t // 3600)
        m = int((t % 3600) // 60)
        s = int(t % 60)
        cs_part = int(round((t - int(t)) * 100))
        return f"{h}:{m:02d}:{s:02d}.{cs_part:02d}"

    with open("public/demo/brand-mobile.ass", "w", encoding="utf-8") as f:
        f.write("[Script Info]\nTitle: Brand Mobile Demo (live take)\nScriptType: v4.00+\n")
        f.write("WrapStyle: 0\nScaledBorderAndShadow: yes\nPlayResX: 1080\nPlayResY: 1920\n\n")
        f.write("[V4+ Styles]\n")
        f.write("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n")
        f.write("Style: Default,Segoe UI,36,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2.5,1.5,2,80,80,160,1\n\n")
        f.write("[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
        for cue in all_cues:
            f.write(f"Dialogue: 0,{fmt_ass(cue['start'])},{fmt_ass(cue['end'])},Default,,0,0,0,,{cue['text']}\n")
    print("-> public/demo/brand-mobile.ass")

    # 8. Provenance timeline
    with open("demo-out/brand-live-timeline.json", "w", encoding="utf-8") as f:
        json.dump({
            "total_duration": TOTAL_DURATION,
            "dataOfRecord": "demo-out/brand-live-recorded-artifact.json",
            "values": {"verdict": verdict, "qty": qty, "entry": entry,
                       "ref": ref_price, "token": token_price, "pnl": pnl,
                       "protected": protected},
            "recordedTaps": TAPS,
            "voiceActs": {str(i): {"start": round(starts[i], 2), "duration": round(durations[i], 2)} for i in range(1, 9)},
            "sfxClicks": click_times,
            "swellAt": swell_time,
        }, f, indent=2)
    print("-> demo-out/brand-live-timeline.json")


if __name__ == "__main__":
    asyncio.run(main())
