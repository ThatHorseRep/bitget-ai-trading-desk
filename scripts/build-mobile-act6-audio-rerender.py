import asyncio
import os
import subprocess

import edge_tts

# VIDEO 4 Act 6 re-render (user-approved). Replaces the one stale verdict word
# in the tolerance-lever narration so the audio matches today's engine:
#   Conservative — REJECT  (unchanged, still engine-true)
#   Aggressive  — PROCEED (was REDUCE before the tolerance fix; today's
#                          engine returns PROCEED on the recorded artifact,
#                          elevated -> moderate with the band-shift note
#                          disclosed verbatim on the artifact)
# Every other word is byte-identical to the approved narration. Voice, rate,
# act start time, SFX placement, ambient bed and ducking all come from the
# original pipeline (scripts/build-brand-live-audio.py) against the RECORDED
# artifact and taps — nothing invented, nothing re-timed.

VOICE = "en-US-ChristopherNeural"
AUDIO_DIR = "demo-out/brand-live-audio"
TOTAL_DURATION = 135.78
ACT6_RATE = "+5%"
ACT6_START = 87.45  # original computed act6 voice start (brand-live-timeline.json)
ACT6_DURATION_BUDGET = 22.7  # original act6 duration was 21.91s; keep within +0.8s

ACT6_TEXT = (
    "Honestly, this next part's my favorite. It's not one rulebook for everyone — watch, "
    "same trade, same market, I'm just changing my risk tolerance. Conservative — REJECT. "
    "Aggressive — PROCEED. That's an actual threshold moving, not the AI just saying it differently. "
    "It adjusts to you."
)


def ffprobe_duration(path):
    res = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True,
    )
    return float(res.stdout.strip() or 0.0)


async def main():
    original = os.path.join(AUDIO_DIR, "act6.mp3")
    backup = os.path.join(AUDIO_DIR, "act6.pre-rerender.mp3")
    if not os.path.exists(backup):
        os.replace(original, backup)
        print(f"Backed up original act6 -> {backup}")
    else:
        print(f"Backup already exists: {backup}")

    act6_path = os.path.join(AUDIO_DIR, "act6.mp3")
    await edge_tts.Communicate(ACT6_TEXT, VOICE, rate=ACT6_RATE).save(act6_path)
    d = ffprobe_duration(act6_path)
    print(f"New act6.mp3: {d:.2f}s (original 21.91s, budget {ACT6_DURATION_BUDGET}s)")
    if d > ACT6_DURATION_BUDGET:
        raise SystemExit(f"act6 too long: {d:.2f}s > {ACT6_DURATION_BUDGET}s — Act 7 must not be displaced")

    # --- Master voice track: rebuild with new act6 at the SAME offset -------
    starts = {1: 0.8, 2: 15.97, 3: 29.5, 4: 44.23, 5: 68.25, 6: ACT6_START, 7: 110.07, 8: 120.73}
    durations = {1: 13.87, 2: 12.77, 3: 13.46, 4: 19.58, 5: 18.5, 6: d, 7: 9.96, 8: 13.51}
    inputs, delays, refs = [], [], ""
    for i in range(1, 9):
        inputs += ["-i", os.path.join(AUDIO_DIR, f"act{i}.mp3")]
        ms = int(starts[i] * 1000)
        delays.append(f"[{i - 1}:a]adelay={ms}|{ms}[a{i}]")
        refs += f"[a{i}]"
    voice_mp3 = "public/demo/brand-mobile-voice.mp3"
    subprocess.run(
        ["ffmpeg", "-y"] + inputs +
        ["-filter_complex", ";".join(delays) + f";{refs}amix=inputs=8:normalize=0:dropout_transition=0[outa]",
         "-map", "[outa]", "-c:a", "libmp3lame", "-b:a", "192k", voice_mp3],
        check=True,
    )
    print(f"-> {voice_mp3} (act6 rides at {ACT6_START}s; act7 unchanged at 110.07s)")

    # --- Ambient bed + SFX + master mix: identical to the shipped take ------
    mixed = "public/demo/brand-mobile-audio-mixed.mp3"
    subprocess.run(
        ["ffmpeg", "-y", "-i", voice_mp3, "-i", "demo-out/brand-live-ambient-bed.wav",
         "-i", "demo-out/brand-live-sfx-track.wav",
         "-filter_complex",
         "[0:a]asplit=2[voice_main][voice_sc]; "
         "[1:a]volume=0.08[ambient_raw]; "
         "[ambient_raw][voice_sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[ambient_ducked]; "
         "[2:a]volume=0.70[sfx_norm]; "
         "[voice_main][ambient_ducked][sfx_norm]amix=inputs=3:normalize=0:duration=first:dropout_transition=0[out_audio]",
         "-map", "[out_audio]", "-c:a", "libmp3lame", "-b:a", "192k", mixed],
        check=True,
    )
    print(f"-> {mixed}")
    print(f"   Mixed duration: {ffprobe_duration(mixed):.3f}s")
    print("Act 6 SFX clicks (93.8 / 96.2 / 99.0) ride on the same SFX track — tap cues unchanged.")


if __name__ == "__main__":
    asyncio.run(main())
