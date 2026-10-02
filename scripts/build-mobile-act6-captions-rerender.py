import asyncio
import re

import edge_tts

# VIDEO 4 Act 6 re-render — captions step. Rewrites brand-mobile.srt and
# brand-mobile.ass so cue 19 says PROCEED (engine-true) instead of the stale
# REDUCE, timed from the REAL new act6.mp3 word boundaries (edge-tts
# WordBoundary events), mapped into the video timeline via
# act6_start = 87.45 (the same constant used by the audio re-render).
# All other cues are left byte-identical.

SRT = "public/demo/brand-mobile.srt"
ASS = "public/demo/brand-mobile.ass"
ACT6_START = 87.45
RATE = "+5%"

# MUST match ACT6_TEXT in scripts/build-mobile-act6-audio-rerender.py exactly,
# or the word timings will not line up with the spoken audio.
ACT6_TEXT = (
    "Honestly, this next part's my favorite. It's not one rulebook for everyone — watch, "
    "same trade, same market, I'm just changing my risk tolerance. Conservative — REJECT. "
    "Aggressive — PROCEED. That's an actual threshold moving, not the AI just saying it differently. "
    "It adjusts to you."
)

# Old cue 20 start (unchanged sentence) — cue 19 must not run past it.
CUE20_START = 102.66


def fmt_srt(t):
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    ms_part = int(round((t - int(t)) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms_part:03d}"


def fmt_ass(t):
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    cs_part = int(round((t - int(t)) * 100))
    return f"{h}:{m:02d}:{s:02d}.{cs_part:02d}"


async def get_word_cues():
    comm = edge_tts.Communicate(ACT6_TEXT, "en-US-ChristopherNeural", rate=RATE)
    words = []
    async for chunk in comm.stream():
        if chunk["type"] in ("WordBoundary", "SentenceBoundary"):
            words.append({
                "kind": chunk["type"],
                "word": chunk["text"],
                "start": chunk["offset"] / 1e7,
                "end": (chunk["offset"] + chunk["duration"]) / 1e7,
            })
    return words


def find_word(words, text, from_idx):
    for i in range(from_idx, len(words)):
        if words[i]["word"].strip(".,—-") == text:
            return i
    return -1


async def main():
    words = await get_word_cues()
    for w in words:
        print(f"  [{w['kind'][:4]}] {w['word'][:40]:<40} {w['start']:7.2f} -> {w['end']:7.2f}")

    # Prefer sentence boundaries when available (matches the original cue
    # style exactly); otherwise fall back to word boundaries.
    sentences = [w for w in words if w["kind"] == "SentenceBoundary"]
    if sentences:
        s_conservative = next((s for s in sentences if s["word"].strip().startswith("Conservative")), None)
        s_aggressive = next((s for s in sentences if s["word"].strip().startswith("Aggressive")), None)
        if s_conservative and s_aggressive:
            cue18_start = ACT6_START + s_conservative["start"]
            cue18_end = ACT6_START + s_conservative["end"]
            cue19_start = ACT6_START + s_aggressive["start"]
            cue19_end = min(ACT6_START + s_aggressive["end"], CUE20_START)
        else:
            raise SystemExit("sentence cues found but Conservative/Aggressive sentences missing")
    else:
        i_conservative = find_word(words, "Conservative", 0)
        i_reject = find_word(words, "REJECT", 0)
        i_aggressive = find_word(words, "Aggressive", 0)
        i_proceed = find_word(words, "PROCEED", i_aggressive + 1)
        missing = [n for n, i in [("Conservative", i_conservative), ("REJECT", i_reject),
                                  ("Aggressive", i_aggressive), ("PROCEED", i_proceed)] if i < 0]
        if missing:
            raise SystemExit(f"words not found in TTS stream: {missing}")
        cue18_start = ACT6_START + words[i_conservative]["start"]
        cue18_end = min(ACT6_START + words[i_reject]["end"] + 0.05,
                        ACT6_START + words[i_aggressive]["start"])
        cue19_start = ACT6_START + words[i_aggressive]["start"]
        cue19_end = min(ACT6_START + words[i_proceed]["end"] + 0.05, CUE20_START)
    print(f"\ncue18: {cue18_start:.2f} -> {cue18_end:.2f}  'Conservative — REJECT.'")
    print(f"cue19: {cue19_start:.2f} -> {cue19_end:.2f}  'Aggressive — PROCEED.'")

    # ---- SRT: replace cues 18 and 19, keep everything else -----------------
    with open(SRT, "r", encoding="utf-8") as f:
        srt = f.read()
    blocks = re.split(r"\n\s*\n", srt.strip())
    out_blocks = []
    for b in blocks:
        lines = b.strip().splitlines()
        idx = lines[0].strip()
        if idx == "18":
            out_blocks.append(f"18\n{fmt_srt(cue18_start)} --> {fmt_srt(cue18_end)}\nConservative — REJECT.")
        elif idx == "19":
            out_blocks.append(f"19\n{fmt_srt(cue19_start)} --> {fmt_srt(cue19_end)}\nAggressive — PROCEED.")
        else:
            out_blocks.append(b.strip())
    with open(SRT, "w", encoding="utf-8", newline="") as f:
        f.write("\n\n".join(out_blocks) + "\n\n")
    print(f"-> {SRT} (cues 18/19 rewritten)")

    # ---- ASS: rewrite the two Dialogue lines by their text ------------------
    with open(ASS, "r", encoding="utf-8") as f:
        ass_lines = f.read().splitlines()
    new_ass = []
    replaced = {"c18": False, "c19": False}
    for line in ass_lines:
        if line.startswith("Dialogue:") and line.rstrip().endswith("Conservative — REJECT."):
            head = line.split(",", 2)[:2]  # "Dialogue: 0", old start
            new_ass.append(f"{head[0]},{fmt_ass(cue18_start)},{fmt_ass(cue18_end)},Default,,0,0,0,,Conservative — REJECT.")
            replaced["c18"] = True
        elif line.startswith("Dialogue:") and line.rstrip().endswith("Aggressive — REDUCE."):
            head = line.split(",", 2)[:2]
            new_ass.append(f"{head[0]},{fmt_ass(cue19_start)},{fmt_ass(cue19_end)},Default,,0,0,0,,Aggressive — PROCEED.")
            replaced["c19"] = True
        else:
            new_ass.append(line)
    if not (replaced["c18"] and replaced["c19"]):
        raise SystemExit(f"ASS dialogue lines not found: {replaced}")
    with open(ASS, "w", encoding="utf-8", newline="") as f:
        f.write("\n".join(new_ass) + "\n")
    print(f"-> {ASS} (2 dialogue lines rewritten)")

    # ---- Verify --------------------------------------------------------------
    with open(SRT, "r", encoding="utf-8") as f:
        for chunk in f.read().split("\n\n"):
            if chunk.strip()[:2] in ("18", "19"):
                print("  SRT", chunk.strip().replace("\n", " | "))
    for line in new_ass:
        if "REJECT" in line or "PROCEED" in line:
            print("  ASS", line)


if __name__ == "__main__":
    asyncio.run(main())
