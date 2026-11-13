"""
Erzeugt alle Klänge des Zahlen-Zoos selbst (keine fremden Dateien, keine Lizenzfragen):
15 Effekte, 8 Tierlaute und 3 Musikstücke als Loop (Spezifikation, Abschnitt 11).

Aufruf: python3 art/build_audio.py  (braucht numpy und ffmpeg; Teil von `npm run art`)
Ausgabe: public/assets/audio/{sfx,animals,music}/<name>.mp3

Der Zufall hat einen festen Startwert, damit jeder Lauf dieselben Dateien liefert.
"""

from __future__ import annotations

import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

RATE = 44100
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets" / "audio"
rng = np.random.default_rng(20261113)


# ---------------------------------------------------------------------------
# Bausteine


def t_axis(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * RATE)) / RATE


def midi(note: float) -> float:
    return 440.0 * 2 ** ((note - 69) / 12)


def phase(freq: np.ndarray | float, seconds: float) -> np.ndarray:
    """Phase für eine (auch gleitende) Frequenz."""
    n = int(seconds * RATE)
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return 2 * np.pi * np.cumsum(f) / RATE


def sine(freq, seconds: float) -> np.ndarray:
    return np.sin(phase(freq, seconds))


def tri(freq, seconds: float) -> np.ndarray:
    p = phase(freq, seconds) / (2 * np.pi)
    return 2 * np.abs(2 * (p - np.floor(p + 0.5))) - 1


def soft_saw(freq, seconds: float, harmonics: int = 8) -> np.ndarray:
    """Sägezahn aus wenigen Obertönen: warm statt scharf."""
    p = phase(freq, seconds)
    return sum(np.sin(k * p) / k for k in range(1, harmonics + 1)) * 0.6


def env(seconds: float, attack=0.005, decay=0.1, sustain=0.0, release=0.05) -> np.ndarray:
    n = int(seconds * RATE)
    e = np.zeros(n)
    a = max(1, int(attack * RATE))
    d = max(1, int(decay * RATE))
    r = max(1, int(release * RATE))
    e[:a] = np.linspace(0, 1, a, endpoint=False)[: n]
    end_d = min(n, a + d)
    if end_d > a:
        e[a:end_d] = np.linspace(1, sustain, end_d - a, endpoint=False)
    e[end_d:] = sustain
    if sustain > 0 and n > r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def pluck(seconds: float, decay: float) -> np.ndarray:
    """Kurzer Anschlag, dann exponentielles Ausklingen (Marimba, Glocke)."""
    t = t_axis(seconds)
    e = np.exp(-t / decay)
    a = int(0.003 * RATE)
    e[:a] *= np.linspace(0, 1, a)
    return e


def lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    alpha = 1 - np.exp(-2 * np.pi * cutoff / RATE)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += alpha * (v - acc)
        y[i] = acc
    return y


def noise(seconds: float) -> np.ndarray:
    return rng.uniform(-1, 1, int(seconds * RATE))


def mallet(note: float, seconds: float = 0.6, decay: float = 0.18, bright: float = 0.3):
    """Marimba-artiger Ton: Grundton plus vierfacher Oberton, der schneller verklingt."""
    f = midi(note)
    t = t_axis(seconds)
    body = np.sin(2 * np.pi * f * t) * np.exp(-t / decay)
    over = np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / (decay / 4)) * bright
    out = body + over
    a = int(0.002 * RATE)
    out[:a] *= np.linspace(0, 1, a)
    return out


def bell(note: float, seconds: float = 1.0, decay: float = 0.35):
    f = midi(note)
    t = t_axis(seconds)
    parts = [(1, 1.0), (2.76, 0.4), (5.4, 0.2), (8.93, 0.1)]
    out = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * r / (decay * 3)) for r, a in parts)
    return out * np.exp(-t / decay)


def place(dst: np.ndarray, src: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(at * RATE)
    j = min(len(dst), i + len(src))
    if i < len(dst):
        dst[i:j] += src[: j - i] * gain


def silence(seconds: float) -> np.ndarray:
    return np.zeros(int(seconds * RATE))


def normalize(x: np.ndarray, peak: float = 0.85) -> np.ndarray:
    m = np.max(np.abs(x))
    return x if m == 0 else x / m * peak


def fade(x: np.ndarray, inn: float = 0.004, out: float = 0.02) -> np.ndarray:
    x = x.copy()
    a, b = int(inn * RATE), int(out * RATE)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def write_mp3(path: Path, data: np.ndarray, stereo: bool = False, bitrate: str = "96k") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    channels = 2 if stereo else 1
    pcm = np.clip(data, -1, 1)
    pcm = (pcm * 32767).astype("<i2")
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "x.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(channels)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(pcm.tobytes())
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-codec:a", "libmp3lame",
             "-b:a", bitrate, "-map_metadata", "-1", str(path)],
            check=True,
        )


# ---------------------------------------------------------------------------
# Effekte: kurz, weich, nie schrill (Spezifikation 8: freundliche Rückmeldung)


def sfx_correct():
    out = silence(0.7)
    place(out, mallet(72, 0.6, 0.2), 0.0, 0.8)  # C5
    place(out, mallet(79, 0.6, 0.25), 0.09, 0.9)  # G5
    place(out, bell(84, 0.5, 0.2), 0.18, 0.25)
    return out


def sfx_wrong():
    # sanft: zwei tiefe, weiche Töne abwärts, kein Summer
    out = silence(0.55)
    place(out, mallet(62, 0.4, 0.15, 0.05), 0.0, 0.8)
    place(out, mallet(58, 0.45, 0.2, 0.05), 0.14, 0.8)
    return lowpass(out, 1800)


def sfx_tap():
    t = 0.07
    return sine(np.linspace(900, 600, int(t * RATE)), t) * pluck(t, 0.015)


def sfx_digit():
    return mallet(79, 0.18, 0.05, 0.15)


def sfx_pick():
    t = 0.12
    return sine(np.linspace(500, 900, int(t * RATE)), t) * pluck(t, 0.04)


def sfx_drop():
    t = 0.16
    body = sine(np.linspace(260, 160, int(t * RATE)), t) * pluck(t, 0.05)
    click = lowpass(noise(t), 2500) * pluck(t, 0.008) * 0.5
    return body + click


def sfx_star():
    out = silence(0.9)
    for i, n in enumerate([84, 88, 91, 96]):
        place(out, bell(n, 0.6, 0.18), i * 0.06, 0.5)
    return out


def sfx_unlock():
    out = silence(1.3)
    for i, n in enumerate([67, 72, 76, 79]):
        place(out, mallet(n, 0.5, 0.18), i * 0.1, 0.7)
    place(out, mallet(84, 0.9, 0.35), 0.42, 0.8)
    place(out, bell(91, 0.9, 0.3), 0.42, 0.3)
    return out


def sfx_round_end():
    out = silence(1.8)
    melody = [(72, 0.0), (76, 0.15), (79, 0.3), (76, 0.45), (79, 0.6), (84, 0.8)]
    for n, at in melody:
        place(out, mallet(n, 0.7, 0.22), at, 0.75)
    for n in (60, 64, 67):
        place(out, mallet(n, 1.0, 0.5, 0.1), 0.8, 0.35)
    place(out, bell(96, 0.9, 0.3), 0.8, 0.2)
    return out


def sfx_hint():
    return bell(81, 0.7, 0.25) * 0.7


def sfx_erase():
    t = 0.18
    n = lowpass(lowpass(noise(t), 1600), 1600)
    return n * env(t, 0.02, 0.16) * 0.8


def sfx_coin():
    out = silence(0.45)
    place(out, bell(93, 0.4, 0.12), 0.0, 0.6)
    place(out, bell(98, 0.4, 0.15), 0.05, 0.5)
    return out


def sfx_badge():
    out = silence(1.0)
    place(out, sfx_pick(), 0.0, 0.8)
    for i, n in enumerate([79, 83, 86, 91]):
        place(out, bell(n, 0.6, 0.2), 0.08 + i * 0.07, 0.45)
    return out


def sfx_clock():
    t = 0.06
    return lowpass(noise(t), 4000) * pluck(t, 0.006) + sine(2200, t) * pluck(t, 0.01) * 0.3


def sfx_swoosh():
    t = 0.35
    x = noise(t)
    cut = np.linspace(300, 1800, len(x))
    # gleitender Tiefpass: Rauschen, das heller wird
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        alpha = 1 - np.exp(-2 * np.pi * cut[i] / RATE)
        acc += alpha * (v - acc)
        y[i] = acc
    return y * np.sin(np.linspace(0, np.pi, len(x))) * 1.4


SFX = {
    "correct": sfx_correct,
    "wrong": sfx_wrong,
    "tap": sfx_tap,
    "digit": sfx_digit,
    "pick": sfx_pick,
    "drop": sfx_drop,
    "star": sfx_star,
    "unlock": sfx_unlock,
    "round_end": sfx_round_end,
    "hint": sfx_hint,
    "erase": sfx_erase,
    "coin": sfx_coin,
    "badge": sfx_badge,
    "clock": sfx_clock,
    "swoosh": sfx_swoosh,
}


# ---------------------------------------------------------------------------
# Tierlaute: spielzeughaft und freundlich, keine echten Aufnahmen


def vowel(freq_curve: np.ndarray, seconds: float, formants=(700, 1200), bright=6):
    """Stimmhafter Laut: obertonreicher Ton, durch zwei Resonanzen gefärbt."""
    src = soft_saw(freq_curve, seconds, bright)
    return lowpass(src, formants[1]) * 0.7 + lowpass(src, formants[0]) * 0.5


def animal_monkey():
    out = silence(0.9)
    for i, (lo, hi) in enumerate([(380, 620), (420, 700), (520, 900)]):
        t = 0.2
        f = np.concatenate([np.linspace(lo, hi, int(t * RATE * 0.6)), np.linspace(hi, lo, int(t * RATE) - int(t * RATE * 0.6))])
        place(out, vowel(f, t, (900, 1800)) * env(t, 0.01, 0.05, 0.7, 0.06), i * 0.24)
    return out


def animal_penguin():
    out = silence(0.8)
    for i, base in enumerate([520, 560]):
        t = 0.28
        vib = base * (1 + 0.06 * np.sin(2 * np.pi * 28 * t_axis(t)))
        place(out, vowel(vib, t, (800, 1600), 10) * env(t, 0.01, 0.05, 0.8, 0.08), i * 0.32)
    return out


def animal_elephant():
    t = 1.0
    f = np.concatenate([np.linspace(330, 520, int(t * RATE * 0.3)), np.full(int(t * RATE) - int(t * RATE * 0.3), 520.0)])
    f = f * (1 + 0.025 * np.sin(2 * np.pi * 6 * t_axis(t)))
    return vowel(f, t, (1200, 2600), 12) * env(t, 0.04, 0.1, 0.8, 0.3)


def animal_parrot():
    out = silence(0.8)
    for i, (a, b) in enumerate([(1400, 2200), (2100, 1500), (1500, 2500)]):
        t = 0.16
        place(out, sine(np.linspace(a, b, int(t * RATE)), t) * env(t, 0.005, 0.03, 0.8, 0.04), i * 0.2, 0.7)
    return out


def animal_owl():
    out = silence(1.3)
    for at, t in [(0.0, 0.35), (0.5, 0.55)]:
        f = np.linspace(400, 360, int(t * RATE))
        place(out, (sine(f, t) + 0.15 * sine(2 * f, t)) * env(t, 0.06, 0.1, 0.8, 0.15), at, 0.8)
    return lowpass(out, 1500)


def animal_butterfly():
    out = silence(0.9)
    for i, n in enumerate([84, 88, 91, 96, 91]):
        place(out, bell(n, 0.4, 0.1), i * 0.07, 0.35)
    return out


def animal_giraffe():
    # Giraffen summen leise: tiefer, weicher Brummton
    t = 0.9
    f = 140 * (1 + 0.03 * np.sin(2 * np.pi * 4 * t_axis(t)))
    return lowpass(soft_saw(f, t, 6), 700) * env(t, 0.12, 0.1, 0.8, 0.3) * 1.6


def animal_meerkat():
    out = silence(0.7)
    for i in range(4):
        t = 0.07
        place(out, sine(np.linspace(1800, 2400, int(t * RATE)), t) * pluck(t, 0.025), i * 0.12, 0.7)
    return out


ANIMALS = {
    "monkey": animal_monkey,
    "penguin": animal_penguin,
    "elephant": animal_elephant,
    "parrot": animal_parrot,
    "owl": animal_owl,
    "butterfly": animal_butterfly,
    "giraffe": animal_giraffe,
    "meerkat": animal_meerkat,
}


# ---------------------------------------------------------------------------
# Musik: ruhige Loops in Pentatonik (C-Dur), Marimba, weicher Bass, leises Rasseln.
# Was über das Ende hinausklingt, wird an den Anfang gelegt: so läuft der Loop ohne Naht.

PENTA = [0, 2, 4, 7, 9]
CHORDS = {"C": [48, 52, 55], "F": [53, 57, 60], "G": [55, 59, 62], "Am": [57, 60, 64]}


def penta_note(degree: int, base: int = 72) -> int:
    octave, i = divmod(degree, len(PENTA))
    return base + 12 * octave + PENTA[i]


def song(bpm: float, bars: int, progression: list[str], density: float, base: int, swing: float = 0.0):
    beat = 60 / bpm
    length = bars * 4 * beat
    tail = 2.0
    left = silence(length + tail)
    right = silence(length + tail)
    degree = 2
    for bar in range(bars):
        chord = progression[bar % len(progression)]
        t0 = bar * 4 * beat
        # Bass: Grundton auf 1 und 3
        root = CHORDS[chord][0] - 12
        for b in (0, 2):
            note = mallet(root if b == 0 else root + 7, 1.2, 0.45, 0.02)
            place(left, note, t0 + b * beat, 0.42)
            place(right, note, t0 + b * beat, 0.42)
        # weicher Akkord auf 1
        for n in CHORDS[chord]:
            pad = mallet(n, 2.0, 0.9, 0.0)
            place(left, pad, t0, 0.12)
            place(right, pad, t0 + 0.012, 0.12)
        # Melodie: Achtel in Pentatonik, Schritte meist klein
        for e in range(8):
            if rng.random() > density:
                continue
            degree = int(np.clip(degree + rng.choice([-2, -1, -1, 0, 1, 1, 2]), 0, 9))
            at = t0 + e * beat / 2 + (swing * beat / 2 if e % 2 else 0)
            note = mallet(penta_note(degree, base), 0.8, 0.22, 0.25)
            pan = 0.35 + 0.3 * rng.random()
            place(left, note, at, 0.32 * (1 - pan) * 2)
            place(right, note, at, 0.32 * pan * 2)
        # leises Rasseln auf den Zählzeiten
        for b in range(4):
            shaker = lowpass(noise(0.08), 6000) - lowpass(noise(0.08), 2000)
            sh = shaker * pluck(0.08, 0.02) * (0.05 if b % 2 else 0.035)
            place(left, sh, t0 + b * beat + beat / 2, 1.0)
            place(right, sh, t0 + b * beat + beat / 2, 0.8)
    # Nachklang an den Anfang legen
    n = int(length * RATE)
    for ch in (left, right):
        ch[: len(ch) - n] += ch[n:]
    left, right = left[:n], right[:n]
    stereo = np.empty(2 * n)
    peak = max(np.max(np.abs(left)), np.max(np.abs(right)))
    stereo[0::2] = left / peak * 0.8
    stereo[1::2] = right / peak * 0.8
    return stereo


MUSIC = {
    # Weltkarte: freundlich, mittleres Tempo
    "map": lambda: song(96, 8, ["C", "Am", "F", "G"], 0.55, 72, 0.12),
    # Aufgabe: ruhig und sparsam, damit es nicht ablenkt
    "task": lambda: song(76, 8, ["C", "F", "C", "G"], 0.28, 72),
    # Rundenabschluss: hell und etwas schneller
    "round_end": lambda: song(112, 4, ["F", "G", "C", "C"], 0.75, 76, 0.1),
}


def main() -> None:
    for name, make in SFX.items():
        write_mp3(OUT / "sfx" / f"{name}.mp3", fade(normalize(make(), 0.8)), bitrate="80k")
    for name, make in ANIMALS.items():
        write_mp3(OUT / "animals" / f"{name}.mp3", fade(normalize(make(), 0.8), 0.01, 0.05), bitrate="80k")
    for name, make in MUSIC.items():
        write_mp3(OUT / "music" / f"{name}.mp3", make(), stereo=True, bitrate="96k")
    total = sum(p.stat().st_size for p in OUT.rglob("*.mp3"))
    print(f"{len(SFX)} Effekte, {len(ANIMALS)} Tierlaute, {len(MUSIC)} Musikstücke, {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
