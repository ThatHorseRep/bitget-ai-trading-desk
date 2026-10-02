"""Generates demo-out/ambient-cycle.wav — the 32s loopable ambient bed used by
both live brand-cut audio builders (build-brand-live-audio.py,
build-brand-desktop-live-audio.py). Function body is copied verbatim from the
original mixer (build-mobile-brand-audio-mix.py, archived 2026-10-01) so the
tracked chain stays self-contained. Skips if the file already exists; pass
--force to regenerate.
"""
import math
import os
import struct
import sys
import wave

SAMPLE_RATE = 44100


def generate_ambient_cycle(path="demo-out/ambient-cycle.wav"):
    """Synthesizes a perfectly loopable 32-second ambient chord cycle (80 BPM)."""
    cycle_duration = 32.0  # 4 chords * 8s
    num_samples = int(SAMPLE_RATE * cycle_duration)
    CHORDS = [
        [110.0, 164.81, 196.00, 246.94, 261.63],  # Am9
        [87.31, 130.81, 164.81, 220.00, 261.63],  # Fmaj7
        [65.41, 98.00, 130.81, 164.81, 196.00],   # C
        [98.00, 146.83, 196.00, 246.94, 293.66],  # G
    ]
    CHORD_DURATION = 8.0

    print("Synthesizing seamless 32s ambient cycle...")
    frames = bytearray()

    for i in range(num_samples):
        t = i / SAMPLE_RATE
        chord_idx = int((t / CHORD_DURATION) % len(CHORDS))
        chord = CHORDS[chord_idx]

        chord_t = t % CHORD_DURATION
        env = math.sin(math.pi * (chord_t / CHORD_DURATION))

        left = 0.0
        right = 0.0

        for idx, freq in enumerate(chord):
            pan = (idx / (len(chord) - 1)) * 0.6 + 0.2
            lfo = 0.8 + 0.2 * math.sin(2 * math.pi * 0.25 * t)
            osc1 = math.sin(2 * math.pi * freq * t)
            osc2 = 0.3 * math.sin(2 * math.pi * (freq * 2.002) * t)
            osc3 = 0.15 * math.sin(2 * math.pi * (freq * 0.501) * t)
            voice = (osc1 + osc2 + osc3) * lfo * 0.10
            left += voice * (1.0 - pan)
            right += voice * pan

        pulse_bpm = 80.0
        pulse_freq = pulse_bpm / 60.0
        pulse = 0.5 + 0.5 * math.sin(2 * math.pi * pulse_freq * t)
        pulse_sub = 0.03 * math.sin(2 * math.pi * chord[0] * t) * (pulse ** 3)

        left = (left * env * 0.4) + pulse_sub
        right = (right * env * 0.4) + pulse_sub

        s_left = int(max(-32767, min(32767, left * 32767)))
        s_right = int(max(-32767, min(32767, right * 32767)))
        frames.extend(struct.pack("<hh", s_left, s_right))

    with wave.open(path, "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(frames)
    print(f"Generated stereo ambient cycle: {path}")


if __name__ == "__main__":
    force = "--force" in sys.argv
    if not force and os.path.exists("demo-out/ambient-cycle.wav"):
        print("demo-out/ambient-cycle.wav already exists (use --force to regenerate)")
        sys.exit(0)
    generate_ambient_cycle()
