import math
import struct
import wave
import subprocess
import os

SAMPLE_RATE = 44100
DURATION = 98.0  # seconds, covers full video duration + outro
NUM_SAMPLES = int(SAMPLE_RATE * DURATION)
WAV_PATH = "demo-out/ambient-bed.wav"
MP3_PATH = "demo-out/ambient-bed.mp3"
FFMPEG = r"C:\Users\HP\Desktop\agentic-product-demo\node_modules\ffmpeg-static\ffmpeg.exe"

os.makedirs("demo-out", exist_ok=True)

# Chords (frequencies in Hz):
# 1. Am9 (A2, E3, G3, B3, C4)
# 2. Fmaj7 (F2, C3, E3, A3, C4)
# 3. Cmaj (C2, G2, C3, E3, G3)
# 4. Gsus4->G (G2, D3, G3, B3, D4)
CHORDS = [
    [110.0, 164.81, 196.00, 246.94, 261.63], # Am9
    [87.31, 130.81, 164.81, 220.00, 261.63], # Fmaj7
    [65.41, 98.00, 130.81, 164.81, 196.00],  # C
    [98.00, 146.83, 196.00, 246.94, 293.66], # G
]

CHORD_DURATION = 8.0 # 8 seconds per chord cycle

print("Synthesizing ambient tech background music bed...")

with wave.open(WAV_PATH, "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2) # 16-bit
    wav.setframerate(SAMPLE_RATE)
    
    frames = bytearray()
    
    for i in range(NUM_SAMPLES):
        t = i / SAMPLE_RATE
        chord_idx = int((t / CHORD_DURATION) % len(CHORDS))
        chord = CHORDS[chord_idx]
        
        # Chord crossfade envelope
        chord_t = t % CHORD_DURATION
        env = math.sin(math.pi * (chord_t / CHORD_DURATION))
        
        # Gentle master fade-in (3s) and fade-out (4s)
        fade_in = min(1.0, t / 3.0)
        fade_out = min(1.0, (DURATION - t) / 4.0)
        master_env = fade_in * fade_out
        
        left = 0.0
        right = 0.0
        
        # Synthesize harmonic chord voices with gentle chorus detuning
        for idx, freq in enumerate(chord):
            pan = (idx / (len(chord) - 1)) * 0.6 + 0.2 # subtle stereo spread
            
            # Subtle low-frequency filter sweep modulation (LFO)
            lfo = 0.8 + 0.2 * math.sin(2 * math.pi * 0.25 * t)
            
            # Fundamental + soft second harmonic
            osc1 = math.sin(2 * math.pi * freq * t)
            osc2 = 0.3 * math.sin(2 * math.pi * (freq * 2.002) * t)
            osc3 = 0.15 * math.sin(2 * math.pi * (freq * 0.501) * t)
            
            voice = (osc1 + osc2 + osc3) * lfo * 0.12
            
            left += voice * (1.0 - pan)
            right += voice * pan
            
        # Subtle warm rhythmic pulse (80 BPM = 1.333 Hz)
        pulse_bpm = 80.0
        pulse_freq = pulse_bpm / 60.0
        pulse = 0.5 + 0.5 * math.sin(2 * math.pi * pulse_freq * t)
        pulse_sub = 0.04 * math.sin(2 * math.pi * (chord[0]) * t) * (pulse ** 3)
        
        left += pulse_sub
        right += pulse_sub
        
        # Apply master envelope & scaling
        sample_l = int(max(-32767, min(32767, left * master_env * env * 32767 * 0.7)))
        sample_r = int(max(-32767, min(32767, right * master_env * env * 32767 * 0.7)))
        
        frames.extend(struct.pack("<hh", sample_l, sample_r))
        
        if i % (SAMPLE_RATE * 10) == 0:
            print(f"Synthesized {int(t)}s / {int(DURATION)}s...")
            
    wav.writeframes(frames)

print(f"WAV audio generated at {WAV_PATH}. Encoding to MP3 with FFmpeg...")
subprocess.run([
    FFMPEG, "-y", "-i", WAV_PATH,
    "-c:a", "libmp3lame", "-b:a", "192k",
    MP3_PATH
], check=True)

if os.path.exists(WAV_PATH):
    os.remove(WAV_PATH)

print(f"Ambient tech background track successfully created at: {MP3_PATH}")
