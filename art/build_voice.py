"""
Eingesprochene Texte (Spezifikation 11, Variante B): Aufnahmeliste erstellen und Aufnahmen
für das Spiel aufbereiten.

  python3 art/build_voice.py --list
      schreibt docs/aufnahmeliste.md und docs/aufnahmeliste.csv: alle Sätze, die das Spiel
      vorliest und für die eine Aufnahme möglich ist (ohne Platzhalter wie {n}), nach
      Wichtigkeit geordnet.

  python3 art/build_voice.py
      liest Aufnahmen aus art/voice/<schlüssel>.<wav|m4a|mp3|ogg|webm>, schneidet Stille am
      Anfang und Ende ab, gleicht die Lautstärke an und legt sie als
      public/assets/audio/voice/<schlüssel>.mp3 ab. Danach steht jeder Schlüssel in
      src/data/voice.json; das Spiel spielt dann die Aufnahme statt der Sprachausgabe.

Braucht ffmpeg. Unbekannte Schlüssel und Texte mit Platzhaltern werden gemeldet, nicht
übernommen.
"""

from __future__ import annotations

import csv
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"
RAW = ROOT / "art" / "voice"
OUT = ROOT / "public" / "assets" / "audio" / "voice"
MANIFEST = DATA / "voice.json"
DOCS = ROOT / "docs"
EXTS = {".wav", ".m4a", ".mp3", ".ogg", ".webm", ".flac", ".aac"}

PLACEHOLDER = re.compile(r"\{[^}]+\}")


def texts() -> dict[str, str]:
    """Alle Texte mit Schlüssel (Hinweise und Oberflächentexte)."""
    out: dict[str, str] = {}
    for name in ("strings.de.json", "hints.de.json"):
        for key, value in json.loads((DATA / name).read_text(encoding="utf-8")).items():
            if isinstance(value, str) and not key.startswith("_"):
                out[key] = value
    return out


def priority(key: str) -> tuple[int, str] | None:
    """Wichtigkeit für die Aufnahme; None: wird nicht mit Schlüssel vorgelesen."""
    if key.startswith("hint."):
        parts = key.split(".")
        if "1" in parts[2:]:
            return 1, "Hinweis, Hilfestufe 1"
        if "2" in parts[2:]:
            return 3, "Hinweis, Hilfestufe 2"
        if "3" in parts[2:]:
            return 4, "Hinweis, Hilfestufe 3"
        return 3, "Hinweis"
    if key.startswith("task.prompt.") or key.startswith("task.money."):
        return 2, "Arbeitsanweisung"
    if key.startswith("package."):
        return 2, "Antwortkarte (Entdeckerpäckchen)"
    return None


def recording_list() -> list[dict[str, str]]:
    rows = []
    for key, text in texts().items():
        p = priority(key)
        if p is None or PLACEHOLDER.search(text) or "@" in text:
            continue
        rows.append({"prio": str(p[0]), "art": p[1], "key": key, "text": text, "datei": f"{key}.wav"})
    rows.sort(key=lambda r: (r["prio"], r["key"]))
    return rows


def write_list() -> None:
    rows = recording_list()
    with (DOCS / "aufnahmeliste.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["Priorität", "Art", "Schlüssel", "Text", "Dateiname"])
        for r in rows:
            w.writerow([r["prio"], r["art"], r["key"], r["text"], r["datei"]])
    counts = {p: sum(1 for r in rows if r["prio"] == p) for p in "1234"}
    lines = [
        "# Aufnahmeliste",
        "",
        "Sätze, die das Spiel vorliest und die sich einsprechen lassen (Spezifikation 11, Variante B).",
        "Sätze mit Zahlen oder Namen (Platzhalter wie `{n}`) liest weiter die Sprachausgabe des",
        "Browsers; sie stehen deshalb nicht in der Liste. Erzeugt mit `python3 art/build_voice.py --list`;",
        "dieselbe Liste zum Abhaken steht in `aufnahmeliste.csv`.",
        "",
        "## So geht es",
        "",
        "1. Einen Satz pro Datei aufnehmen, ruhig und freundlich, eher langsam (Zweitklässler).",
        "   Ein Handy genügt; leiser Raum, etwa 20 cm Abstand. Format egal (WAV, M4A, MP3, OGG).",
        "2. Datei nach dem Schlüssel benennen, z. B. `hint.add_bridge.1.m4a`, und in `art/voice/` legen.",
        "3. `python3 art/build_voice.py` ausführen: schneidet Stille ab, gleicht die Lautstärke an,",
        "   legt `public/assets/audio/voice/<schlüssel>.mp3` ab und trägt den Schlüssel in",
        "   `src/data/voice.json` ein. Ab dann spielt das Spiel die Aufnahme.",
        "",
        "Fehlt eine Aufnahme, liest das Spiel den Satz wie bisher mit der Browserstimme vor.",
        "Ändert sich ein Text, muss er neu aufgenommen werden (das Werkzeug meldet keine Textänderungen;",
        "die Spalte Text zeigt den Stand beim Erzeugen der Liste).",
        "",
        "| Priorität | Inhalt | Sätze |",
        "| --- | --- | --- |",
        f"| 1 | Hinweise der Hilfestufe 1 (zuerst aufnehmen) | {counts['1']} |",
        f"| 2 | Arbeitsanweisungen und Aussagen auf Antwortkarten | {counts['2']} |",
        f"| 3 | Hinweise der Hilfestufe 2 | {counts['3']} |",
        f"| 4 | Hinweise der Hilfestufe 3 | {counts['4']} |",
        f"| | zusammen | {len(rows)} |",
        "",
    ]
    current = None
    for r in rows:
        if r["prio"] != current:
            current = r["prio"]
            lines += ["", f"## Priorität {current}", "", "| Schlüssel | Text |", "| --- | --- |"]
        text = r["text"].replace("|", "\\|").replace("\n", " ")
        lines.append(f"| `{r['key']}` | {text} |")
    (DOCS / "aufnahmeliste.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(rows)} Sätze in docs/aufnahmeliste.md und docs/aufnahmeliste.csv")


def build() -> None:
    known = texts()
    OUT.mkdir(parents=True, exist_ok=True)
    done = []
    for src in sorted(RAW.glob("*")) if RAW.exists() else []:
        if src.suffix.lower() not in EXTS:
            continue
        key = src.stem
        text = known.get(key)
        if text is None:
            print(f"übersprungen: {src.name} (unbekannter Schlüssel)")
            continue
        if PLACEHOLDER.search(text):
            print(f"übersprungen: {src.name} (Text hat Platzhalter, liest die Sprachausgabe)")
            continue
        subprocess.run(
            [
                "ffmpeg", "-loglevel", "error", "-y", "-i", str(src),
                "-af",
                "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,"
                "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,"
                "areverse,loudnorm=I=-18:TP=-2:LRA=7",
                "-ac", "1", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "64k",
                "-map_metadata", "-1", str(OUT / f"{key}.mp3"),
            ],
            check=True,
        )
        done.append(key)
    # Aufnahmen ohne Rohdatei bleiben erhalten (z. B. aus einem früheren Lauf)
    keys = sorted({p.stem for p in OUT.glob("*.mp3")} & set(known))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    manifest["keys"] = keys
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(done)} Aufnahmen aufbereitet, {len(keys)} im Spiel")


if __name__ == "__main__":
    if "--list" in sys.argv:
        write_list()
    else:
        build()
