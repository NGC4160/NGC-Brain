#!/usr/bin/env python3
"""Generate original dark tactical synth-rock mission BGM loops (no copyrighted material).

Outputs mono 16-bit WAV files into GrandGramboGuns/Audio/ suitable for seamless looping.
"""

from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 22050
BPM = 108.0
BARS = 4
BEATS_PER_BAR = 4

# A minor dark palette (Hz)
ROOT = 55.0  # A1
MINOR_THIRD = ROOT * (2 ** (3 / 12))  # C2
FIFTH = ROOT * (2 ** (7 / 12))  # E2
OCTAVE = ROOT * 2
BASS_NOTES = [ROOT, ROOT, MINOR_THIRD, FIFTH, ROOT * 0.75, ROOT, FIFTH, MINOR_THIRD]
ARP_NOTES = [OCTAVE, OCTAVE * (2 ** (3 / 12)), OCTAVE * (2 ** (7 / 12)), OCTAVE * 2,
             OCTAVE * (2 ** (10 / 12)), OCTAVE * (2 ** (7 / 12)), OCTAVE * (2 ** (3 / 12)), OCTAVE]


def clamp(x: float, lo: float = -1.0, hi: float = 1.0) -> float:
    return lo if x < lo else hi if x > hi else x


def soft_clip(x: float, drive: float = 1.6) -> float:
    return math.tanh(x * drive)


def envelope(t: float, attack: float, decay: float) -> float:
    if t < attack:
        return t / max(attack, 1e-6)
    return math.exp(-(t - attack) / max(decay, 1e-6))


def noise(seed: int) -> tuple[float, int]:
    # Deterministic LCG noise in [-1, 1]
    seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
    return (seed / 0x7FFFFFFF) * 2.0 - 1.0, seed


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for s in samples:
            v = int(clamp(s) * 32767.0)
            frames.extend(struct.pack("<h", v))
        wf.writeframes(frames)


def generate_loop(intensity: float = 1.0) -> list[float]:
    beat = 60.0 / BPM
    duration = BARS * BEATS_PER_BAR * beat
    n = int(round(duration * SAMPLE_RATE))
    # Snap length to exact bar grid for seamless loop
    samples_per_beat = int(round(beat * SAMPLE_RATE))
    n = samples_per_beat * BARS * BEATS_PER_BAR

    out = [0.0] * n
    seed = 0xC0FFEE ^ int(intensity * 1000)

    # Kick + noise snare pulse (driving rock pulse)
    for beat_i in range(BARS * BEATS_PER_BAR):
        start = beat_i * samples_per_beat
        # Kick on every beat
        for i in range(min(int(0.12 * SAMPLE_RATE), n - start)):
            t = i / SAMPLE_RATE
            freq = 90.0 * math.exp(-t * 18.0) + 42.0
            env = envelope(t, 0.002, 0.09)
            out[start + i] += math.sin(2 * math.pi * freq * t) * env * 0.55 * intensity
        # Snare / grit on 2 and 4
        if beat_i % 2 == 1:
            for i in range(min(int(0.08 * SAMPLE_RATE), n - start)):
                t = i / SAMPLE_RATE
                nval, seed = noise(seed)
                env = envelope(t, 0.001, 0.05)
                out[start + i] += nval * env * 0.28 * intensity
        # Hi-hat ticks 8th notes
        for sub in (0, 1):
            hat_start = start + sub * (samples_per_beat // 2)
            for i in range(min(int(0.03 * SAMPLE_RATE), n - hat_start)):
                t = i / SAMPLE_RATE
                nval, seed = noise(seed)
                env = envelope(t, 0.0005, 0.018)
                gain = 0.12 if sub == 0 else 0.07
                out[hat_start + i] += nval * env * gain * intensity

    # Distorted bass line (synth-rock grit)
    samples_per_note = samples_per_beat
    for note_i, freq in enumerate(BASS_NOTES * (BARS // 2)):
        start = note_i * samples_per_note
        if start >= n:
            break
        length = min(samples_per_note, n - start)
        for i in range(length):
            t = i / SAMPLE_RATE
            phase = 2 * math.pi * freq * t
            # Square-ish + slight saw for rock edge
            square = 1.0 if math.sin(phase) >= 0 else -1.0
            saw = (phase / math.pi) % 2.0 - 1.0
            tone = soft_clip(square * 0.55 + saw * 0.35 + math.sin(phase * 2) * 0.15, 1.8)
            # Note envelope with slight sustain for continuous bed
            env = 0.55 + 0.45 * envelope(t, 0.01, 0.35)
            # Mild sidechain duck under kick
            duck = 1.0 - 0.35 * math.exp(-t * 22.0)
            out[start + i] += tone * env * duck * 0.32 * intensity

    # Minor synth arpeggio (tactical lead)
    arp_step = samples_per_beat // 2
    for step_i, freq in enumerate((ARP_NOTES * 4)[: BARS * BEATS_PER_BAR * 2]):
        start = step_i * arp_step
        if start >= n:
            break
        length = min(arp_step, n - start)
        for i in range(length):
            t = i / SAMPLE_RATE
            # Soft PWM-ish lead
            phase = 2 * math.pi * freq * t
            tone = math.sin(phase) * 0.7 + math.sin(phase * 2.01) * 0.2
            env = envelope(t, 0.005, 0.12) * (0.65 + 0.35 * intensity)
            # Filter-ish high rolloff via simple one-pole feel (blend)
            out[start + i] += tone * env * 0.14

    # Low drone pad for atmosphere
    for i in range(n):
        t = i / SAMPLE_RATE
        pad = math.sin(2 * math.pi * ROOT * t) * 0.08
        pad += math.sin(2 * math.pi * FIFTH * t) * 0.05
        # Slow LFO grit
        lfo = 0.5 + 0.5 * math.sin(2 * math.pi * 0.25 * t)
        nval, seed = noise(seed)
        grit = nval * 0.015 * lfo * intensity
        out[i] += pad + grit

    # Normalize + soft clip for headroom; leave room under SFX (~-14 dB peak target in-app)
    peak = max(abs(s) for s in out) or 1.0
    target = 0.72
    gain = target / peak
    normalized = [soft_clip(s * gain, 1.25) for s in out]

    # Seamless loop: crossfade tail into head (no silence dip at the join).
    fade = int(0.04 * SAMPLE_RATE)
    for i in range(fade):
        t = i / fade
        # Equal-power-ish blend: end fades out while start material is mixed in
        a = normalized[n - fade + i]
        b = normalized[i]
        normalized[n - fade + i] = a * (1.0 - t) + b * t
    return normalized


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    audio = root / "GrandGramboGuns" / "Audio"
    combat = generate_loop(intensity=1.0)
    write_wav(audio / "mission_bgm_combat.wav", combat)
    # Hotter act-3 bed — same grid, more grit (still one modest file)
    hot = generate_loop(intensity=1.18)
    write_wav(audio / "mission_bgm_hot.wav", hot)
    print(f"Wrote {audio / 'mission_bgm_combat.wav'} ({len(combat)/SAMPLE_RATE:.2f}s)")
    print(f"Wrote {audio / 'mission_bgm_hot.wav'} ({len(hot)/SAMPLE_RATE:.2f}s)")


if __name__ == "__main__":
    main()
